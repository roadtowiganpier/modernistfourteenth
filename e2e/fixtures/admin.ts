import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "pg";

// Known admin credentials for E2E — created directly via SQL against the
// resolved test DB (mirrors scripts/create-admin.ts's logic locally,
// without changing that script — see the Phase 2 plan, item 2c). Plain
// `pg` rather than the generated Prisma client: Playwright's globalSetup
// loader can't handle the generated client's ESM output.
export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.com";
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "e2e-test-password-12345";

export async function ensureE2EAdmin(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL (or DATABASE_URL_TEST) must be set to seed the E2E admin user."
    );
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 4);
    await client.query(
      `INSERT INTO "AdminUser" (id, email, "passwordHash")
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      [randomUUID(), E2E_ADMIN_EMAIL, passwordHash]
    );
  } finally {
    await client.end();
  }
}
