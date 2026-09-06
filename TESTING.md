# TESTING.md — Modernist Buildings of Paris XIV

Companion to `SPEC.md`, `DATA-MODEL.md`, and `DEPLOYMENT.md`. This file
defines what "delivered" means for any feature in this repo, and the CI
gate that enforces it.

---

## Principle

No feature is considered delivered until it has automated test coverage
that passes locally. If a specific piece genuinely can't be automated
(e.g. visual polish, third-party map rendering), say so explicitly and
describe what was manually verified instead — silently skipping coverage
is not acceptable.

## Tooling

- **Unit / integration tests**: Vitest
- **End-to-end tests**: Playwright
- **Type check**: `tsc --noEmit`
- **Lint**: ESLint

## What needs coverage

- **Business logic** (unit tests): word/size limit validation, rate
  limiting, moderation status transitions, NSFW-flag sorting logic, the
  Nominatim geocode wrapper (with the HTTP call mocked).
- **API routes** (integration tests): route handlers exercised against a
  real test Postgres database (migrations applied, DB reset between
  tests) — not just mocked Prisma calls.
- **Critical user flows** (Playwright E2E): public list/map browsing,
  building detail page, photo submission (happy path + an oversized/
  invalid file rejected), community note submission, admin login, and the
  admin approve/reject flow with the resulting change in public
  visibility.
- **Required edge cases**: consent checkbox blocks submission when
  unchecked; the 5MB / 200-word / 500-word limits are enforced
  server-side, not just in the UI; rate-limiting actually triggers after
  the configured threshold; an NSFW-flagged item sorts to the top of the
  moderation queue.

## Test database

- **CI**: an ephemeral Postgres service container in the GitHub Actions
  job; `prisma migrate deploy` runs before the test suite.
- **Local**: a second database (name or `DATABASE_URL_TEST`) on the same
  Postgres instance the dev docker-compose stack already runs — no
  separate container needed.

## File conventions

- Unit/integration tests are colocated with the code they test, as
  `*.test.ts`.
- E2E specs live under `/e2e/*.spec.ts`.

## CI gate

`.github/workflows/deploy.yml` (see `DEPLOYMENT.md`) runs a `test` job —
lint, type-check, unit/integration, and Playwright E2E — before the
`build & push` job. `build & push` only runs if `test` passes. A failing
test blocks the deploy; it is never skipped, commented out, or weakened
just to unblock a release.

## What "delivered" means for Claude Code

Before reporting a task or feature as complete:
1. Relevant automated tests exist and pass locally.
2. `tsc --noEmit` and ESLint pass with no new errors or warnings.
3. If something genuinely can't be automated, say so explicitly and
   describe the manual check performed instead.

Never delete, skip, or weaken a test to turn a red suite green — fix the
implementation, or flag the blocker to the Product Owner instead of
working around it silently.

---

## Open Assumptions / Tech Lead Decisions

- Vitest + Playwright chosen over Jest + Cypress — faster, native ESM/TS
  support, good Next.js App Router compatibility. Flag if you have an
  existing preference.
- Integration tests hit a real test database rather than a mocked Prisma
  client, to catch actual query/schema issues — slightly slower test runs
  traded for higher confidence.
