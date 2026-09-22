// Nominatim wrapper — called once at building creation (and on re-geocode,
// see lib/buildings/service.ts), result cached in the DB. Never throws:
// a failure just means the building saves without coordinates. Respects
// Nominatim's usage policy (descriptive User-Agent, ≤1 req/sec, results
// biased to the 14th arrondissement).

const DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const THROTTLE_MS = 1000;
const TIMEOUT_MS = 5000;
const PARIS_BIAS = "75014 Paris, France";

export type GeocodeResult = { lat: number; lng: number };

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < THROTTLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

function buildQuery(address: string): string {
  return /paris/i.test(address) ? address : `${address}, ${PARIS_BIAS}`;
}

export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const baseUrl = process.env.NOMINATIM_URL ?? DEFAULT_NOMINATIM_URL;
  const userAgent = process.env.NOMINATIM_USER_AGENT;

  if (!userAgent) {
    console.error(
      "NOMINATIM_USER_AGENT is not set — required by Nominatim's usage policy. Skipping geocode."
    );
    return null;
  }

  await throttle();

  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", buildQuery(address));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "fr");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
    }>;

    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const [first] = results;
    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
