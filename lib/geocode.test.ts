import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadGeocode() {
  vi.resetModules();
  return import("./geocode");
}

describe("geocodeAddress", () => {
  beforeEach(() => {
    process.env.NOMINATIM_URL = "https://nominatim.test";
    process.env.NOMINATIM_USER_AGENT = "modernist14-test/1.0 (test@example.com)";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns coordinates on a successful match", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "48.8339", lon: "2.3216" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    const result = await geocodeAddress("59 rue Vercingétorix");

    expect(result).toEqual({ lat: 48.8339, lng: 2.3216 });
  });

  it("biases the query to Paris when the address doesn't mention it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "48.8", lon: "2.3" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    await geocodeAddress("59 rue Vercingétorix");

    const calledUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(calledUrl.searchParams.get("q")).toBe(
      "59 rue Vercingétorix, 75014 Paris, France"
    );
    expect(calledUrl.searchParams.get("countrycodes")).toBe("fr");
  });

  it("doesn't double-append Paris when already present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "48.8", lon: "2.3" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    await geocodeAddress("59 rue Vercingétorix, 75014 Paris");

    const calledUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(calledUrl.searchParams.get("q")).toBe(
      "59 rue Vercingétorix, 75014 Paris"
    );
  });

  it("returns null on an empty result set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    expect(await geocodeAddress("Nowhere")).toBeNull();
  });

  it("returns null on an HTTP error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    expect(await geocodeAddress("Anywhere")).toBeNull();
  });

  it("returns null instead of throwing on a network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    await expect(geocodeAddress("Anywhere")).resolves.toBeNull();
  });

  it("returns null on a timeout", async () => {
    const fetchMock = vi.fn().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    vi.useFakeTimers();
    const { geocodeAddress } = await loadGeocode();
    const promise = geocodeAddress("Anywhere");

    await vi.advanceTimersByTimeAsync(5000);
    await expect(promise).resolves.toBeNull();
  });

  it("returns null when NOMINATIM_USER_AGENT is not set", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { geocodeAddress } = await loadGeocode();
    expect(await geocodeAddress("Anywhere")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throttles consecutive requests to at most 1/sec", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "48.8", lon: "2.3" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    vi.useFakeTimers();
    const { geocodeAddress } = await loadGeocode();

    const first = geocodeAddress("Address One");
    await vi.advanceTimersByTimeAsync(0);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = geocodeAddress("Address Two");
    // Not enough time has passed — the second call must still be waiting.
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);
    await second;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
