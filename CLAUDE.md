# CLAUDE.md — Modernist Buildings of Paris XIV

Full requirements live in `SPEC.md` (product behavior — source of truth),
`DATA-MODEL.md` (schema), `DEPLOYMENT.md` (hosting/CI-CD), and
`TESTING.md` (test standards). This file is operating instructions for
whoever (human or Claude Code) works on this repo — read all four before
building anything non-trivial.

## What this is
A bilingual (FR/EN) community heritage site cataloging modernist buildings in
Paris's 14th arrondissement: list + map browsing, admin-authored building
histories, and moderated public contributions (photos + text corrections).
Single admin (the owner). No public user accounts, ever.

## Stack
- Next.js (App Router) + TypeScript, PostgreSQL, Prisma
- next-intl for FR/EN routing
- MapLibre GL JS + OpenStreetMap tiles for the map
- NextAuth (credentials provider) for the single admin login
- Hetzner Object Storage (S3-compatible) for photos
- Self-hosted via Docker Compose behind the existing Traefik reverse proxy
  on the owner's Hetzner VPS, deployed via GitHub Actions (build/push to
  GHCR, then SSH deploy) — see `DEPLOYMENT.md` for the full pipeline

## Non-negotiable rules
- ALL public submissions (photos, text corrections) land in a moderation
  queue. Nothing publishes without admin approval. Never build an
  auto-publish path.
- Every submission requires name, email, and a consent checkbox before it
  can be saved.
- Photo uploads: hard cap 5MB, auto-resize to ≤2000px longest side, convert
  to WebP, run through an NSFW model server-side (flag for review only —
  never auto-reject).
- CAPTCHA (Cloudflare Turnstile) + IP rate-limiting on every public
  submission form.
- Every building page renders in FR and EN. Community notes render exactly
  as submitted, untranslated.
- No feature that requires a public user account/login — ever, without an
  explicit spec change from the Product Owner.
- NEVER run `git commit`, `git push`, or open a pull request on your own.
  After finishing a unit of work, prepare the commit message and a short
  summary of what changed for the Product Owner to review — they run the
  actual commit themselves. Prepared commit messages must never include a
  `Co-Authored-By: Claude` trailer, a "Generated with Claude Code" line,
  or a session link — clean text only, no exceptions.
- No feature is marked delivered without passing automated tests per
  `TESTING.md`. Never skip, delete, or weaken a test to make a red suite
  green — fix the code or flag the blocker to the Product Owner.

## Structure conventions
- `/app/[locale]/...` route groups for i18n
- `/lib/moderation/` — shared approve/reject/notify logic
- `/lib/geocode.ts` — Nominatim wrapper, called once at building creation,
  result cached in the DB
- Seed data lives in `prisma/seed.ts`, sourced from SPEC.md's Seed Data
  section — buildings only, local/dev convenience; production buildings
  are entered via the admin UI, per SPEC.md
- The one `AdminUser` row is bootstrapped by a separate script (not
  `prisma/seed.ts`) — see DEPLOYMENT.md's Initial Admin Setup
- `prisma/schema.prisma` should match `DATA-MODEL.md` — treat a mismatch
  as a bug, not a reason to silently diverge from the doc
- `.github/workflows/` should match `DEPLOYMENT.md` exactly (trigger,
  jobs, secret names) — check that file before touching the pipeline

## When in doubt
Re-read the Open Assumptions section in SPEC.md (and the equivalent
sections in DATA-MODEL.md / DEPLOYMENT.md) before inventing new behavior.
Flag ambiguity to the Product Owner rather than guessing on anything
touching moderation, privacy, or data retention.
