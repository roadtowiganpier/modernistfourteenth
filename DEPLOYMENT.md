# DEPLOYMENT.md — Modernist Buildings of Paris XIV

Companion to `SPEC.md` (product behavior), `DATA-MODEL.md` (schema), and
`TESTING.md` (test standards / CI gate). This file covers hosting,
containerization, and CI/CD.

---

## Hosting overview

Self-hosted on the owner's existing Hetzner VPS, as a Docker Compose stack,
routed through the Traefik reverse proxy already running on that VPS (no
new reverse proxy or platform introduced). Object Storage (photos, backups)
is external to the compose stack.

## Services (docker-compose.yml)

- `app` — the Next.js application (built from the repo's `Dockerfile`)
- `db` — PostgreSQL
- `umami` (+ its own db, or a shared Postgres instance) — analytics

Hetzner Object Storage is **not** a compose service — it's accessed by the
app via an S3-compatible SDK and environment-configured credentials.

## CI/CD — GitHub Actions

### Trigger

Push to `main` — `main` is production; there is no staging environment in
v1 (solo-maintained project, low deploy risk).

### Pipeline

1. **Test** job
   - Checkout code
   - Spin up an ephemeral Postgres service container
   - Install deps, run `prisma migrate deploy` against it
   - Run lint (`ESLint`), type check (`tsc --noEmit`), unit/integration
     tests (Vitest), and E2E tests (Playwright) — see `TESTING.md`
   - This job must pass before the pipeline continues
2. **Build & push** job (`needs: test`)
   - Checkout code
   - Build the production Docker image (multi-stage build)
   - Push to GitHub Container Registry as both
     `ghcr.io/<owner>/<repo>:latest` and `ghcr.io/<owner>/<repo>:<git-sha>`
   - Auth: the workflow's built-in `GITHUB_TOKEN` (with `packages: write`
     permission) — no extra secret needed for this step
3. **Deploy** job (`needs: build`)
   - SSH into the Hetzner VPS (e.g. via the `appleboy/ssh-action` GitHub
     Action) using a deploy-only SSH key
   - `cd ~/modernist14` (the compose project's fixed location on the VPS),
     then run `docker compose pull app && docker compose up -d app`
   - Database migrations run automatically as part of the `app` container's
     entrypoint (`prisma migrate deploy`, before the Next.js server
     starts) — no separate migration step in the pipeline

### Secrets required (GitHub repo settings)

- `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` — deploy access to the VPS
- Nothing extra needed for the GHCR push (uses the automatic
  `GITHUB_TOKEN`)

### Image visibility

Recommended: make the GHCR package **public**, even if the repo itself
stays private. The VPS then pulls the image with zero extra credentials —
no PAT to provision or rotate on the server. If the image must stay
private instead, a read-only PAT (`CR_PAT`) would need to be stored on the
VPS for `docker login ghcr.io`. *(Flagged for your confirmation — public
package is the default assumption.)*

## Initial Admin Setup

There is no public sign-up, so the single `AdminUser` row must be
bootstrapped explicitly rather than created through normal app flow.

- A dedicated script (e.g. `scripts/create-admin.ts`) reads
  `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` from the environment, hashes
  the password (bcrypt), and upserts the `AdminUser` row. Idempotent — safe
  to re-run.
- This is separate from `prisma/seed.ts` (buildings), which is a local/dev
  convenience only — per `SPEC.md`'s Seed Data section, production
  building content is entered manually through the admin UI, not seeded.
  Admin creation, by contrast, has to run in every environment including
  production.
- Run once per environment: locally during initial setup, and once on the
  VPS (e.g. via SSH, `docker compose exec app node scripts/create-admin.js`
  or equivalent) after the first deploy. Not wired into the automatic
  deploy pipeline, to avoid accidentally resetting the admin password on
  every push.

## Rollback

Every image is tagged with both `latest` and the git SHA. A bad deploy can
be rolled back manually — SSH to the VPS and run
`docker compose pull app@sha256:<known-good-sha> && docker compose up -d app`
— without needing a new commit or re-running the pipeline.

## Environment variables & secrets (runtime)

Managed via a `.env` file on the VPS (never committed to the repo), read
by Docker Compose. Expected contents: DB connection string, Object Storage
credentials, Resend API key, Cloudflare Turnstile keys, NextAuth secret.

## Backups

A scheduled `pg_dump` of Postgres, written to the same Hetzner Object
Storage bucket used for photos (separate prefix/folder), run via a cron
job on the VPS (or a small scheduled container). *(Open item: exact backup
retention window wasn't specified — defaulting to 30 days of daily
backups, i.e. old backup files older than 30 days are pruned, unless you
say otherwise.)*

## Rollout strategy

Simple pull-and-restart deploy (a few seconds of downtime) — acceptable
given expected traffic for this project. No blue-green or zero-downtime
complexity in v1.

## Health check

The app exposes a basic `/api/health` endpoint. Not wired to automated
rollback in v1 — rollback is the manual process described above.

---

## Open Assumptions / Tech Lead Decisions

- Deploy trigger is `main` = production, no staging environment.
- SSH-based push deploy chosen over alternatives (Watchtower polling
  GHCR, a self-hosted Actions runner on the VPS) — chosen for immediacy
  and simplicity; revisit if deploy frequency grows.
- GHCR package visibility: **public** recommended — pending your
  confirmation.
- Backup retention window: defaulted to **30 days** — pending your
  confirmation.
