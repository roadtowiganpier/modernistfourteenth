import http from "node:http";

// Deterministic local stand-in for Nominatim used only in E2E — the
// server-side geocode fetch in lib/geocode.ts can't be intercepted by
// Playwright, so NOMINATIM_URL points here instead (see playwright.config.ts
// and TESTING.md — real Nominatim must never be called in tests).
export const NOMINATIM_STUB_PORT = 3987;

// An address containing this marker gets an empty result set, simulating a
// failed/no-match geocode — used to exercise the "unmapped" notice flow.
export const NO_MATCH_ADDRESS_MARKER = "nomatch-fixture";

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${NOMINATIM_STUB_PORT}`);
  const query = url.searchParams.get("q") ?? "";

  res.setHeader("Content-Type", "application/json");

  if (query.toLowerCase().includes(NO_MATCH_ADDRESS_MARKER)) {
    res.end(JSON.stringify([]));
    return;
  }

  res.end(JSON.stringify([{ lat: "48.8271", lon: "2.3372" }]));
}

export function startNominatimStub(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.once("error", reject);
    server.listen(NOMINATIM_STUB_PORT, "127.0.0.1", () => resolve(server));
  });
}

export function stopNominatimStub(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
