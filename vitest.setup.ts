import { config } from "dotenv";

config();

// Local dev: DATABASE_URL_TEST points at a second database on the same
// Postgres instance the docker-compose dev stack already runs (see
// TESTING.md → Test database). In CI, DATABASE_URL is set directly to the
// ephemeral Postgres service container, so this is a no-op there.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
