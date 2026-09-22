import { ensureE2EAdmin } from "./fixtures/admin";
import { startNominatimStub, stopNominatimStub } from "./fixtures/nominatim-stub";

export default async function globalSetup() {
  await ensureE2EAdmin();
  const stub = await startNominatimStub();

  return async () => {
    await stopNominatimStub(stub);
  };
}
