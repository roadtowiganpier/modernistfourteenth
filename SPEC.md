# SPEC.md — Modernist Buildings of Paris XIV

Reference spec for the project. `CLAUDE.md` is the short operating summary.
Schema detail lives in `DATA-MODEL.md`; hosting and CI/CD detail lives in
`DEPLOYMENT.md`. This document is the source of truth for everything else
— product behavior, features, moderation, legal, and content.

---

## 1. Overview

A bilingual (FR/EN) public website cataloging modernist buildings in the
14th arrondissement of Paris. It combines an admin-curated core (building
list, official history text) with community contribution (uploaded photos,
suggested text corrections/additions), all gated behind admin moderation.
Primary audience: **locals and residents of the 14th**.

## 2. Goals & Audience

- Primary audience: residents of the 14th arrondissement interested in
  local architectural heritage.
- Secondary benefit: acts as a portfolio piece demonstrating full-stack
  build + data/content workflow skills.
- "Modernist" is interpreted loosely per the owner's seed list (see §12),
  not a strict period cutoff — style/period is a freeform tag, not an
  enforced date range.

## 3. Scope

**Full scope ships in v1** — no phased MVP. All features below are in the
first release.

## 4. Tech Stack & Architecture

- **Framework**: Next.js (App Router), TypeScript
- **Database**: PostgreSQL, accessed via Prisma — see `DATA-MODEL.md` for
  the schema
- **i18n**: next-intl, routes under `/fr/...` and `/en/...`
- **Map**: MapLibre GL JS + OpenStreetMap tiles (no API key required)
- **Auth**: NextAuth, credentials provider, single seeded admin user
  (extensible to more admins later without rework)
- **Photo storage**: Hetzner Object Storage (S3-compatible) — decoupled
  from the app server/disk. Public-read bucket, objects served directly
  from Object Storage (no signed URLs / proxy needed — approved photos are
  public content with no access control once live).
- **Geocoding**: OpenStreetMap Nominatim (free), called once per building
  at creation time, result cached in the DB (respect Nominatim's 1 req/sec
  usage policy)
- **NSFW pre-filter**: NSFWJS (or equivalent open-source model) run
  server-side on upload, using the model library's documented default
  threshold for its flagged classes (tune later if the moderation queue
  shows false positives/negatives)
- **CAPTCHA**: Cloudflare Turnstile
- **Email**: Resend (or equivalent) for transactional notifications
- **Analytics**: self-hosted Umami
- **Hosting**: self-hosted on the owner's existing Hetzner VPS, as a Docker
  Compose stack behind the existing Traefik reverse proxy, deployed via
  GitHub Actions. Full detail — services, CI/CD pipeline, secrets,
  backups, rollback — is in `DEPLOYMENT.md`.
- **Domain**: placeholder (e.g. `modernist14.local`) until a real domain is
  chosen — not blocking for build.

## 5. Features & User Flows

### 5.1 Public browsing
- List view and map view (MapLibre, pins from `lat`/`lng`) of all buildings.
- No search/filter in v1 (deferred — see §13).
- Language switcher (FR/EN), all copy and building history translated.

### 5.2 Building detail page
- Building name, address, official history (`historyFr`/`historyEn`).
- Style tags shown as a simple view-only tag list (no filtering, per §13).
- **Community Notes** section below the official text: list of approved
  `CommunityNote` entries, shown verbatim as submitted. Hidden entirely if
  there are none (no empty-state placeholder).
- **Photo gallery**: approved `Photo` entries with captions. Hidden
  entirely if there are none.
- "Last updated" timestamp shown publicly.
- Two calls to action: "Add a photo" and "Suggest a correction".

### 5.3 Photo submission flow
1. Visitor selects a building, opens the upload form.
2. Form fields: one photo file per submission, caption (≤200 words), name,
   email, consent checkbox, Turnstile challenge. A visitor wanting to
   contribute multiple photos submits the form multiple times.
3. Server validates: file ≤5MB, resizes to ≤2000px longest side, converts
   to WebP, runs NSFW pre-filter, stores to Object Storage, creates a
   `Photo` row with `status: pending` (see `DATA-MODEL.md`).
4. Admin is emailed that a new photo awaits review.
5. On approval: photo becomes publicly visible.
   On rejection: submitter is emailed a brief reason.
6. **30-photo cap per building is not automatically enforced** — the admin
   manages this manually via the approved-items management view (§5.5),
   e.g. by declining new submissions or removing older approved photos at
   their discretion once a building nears/exceeds 30 approved photos.

### 5.4 Community note submission flow
1. Visitor selects a building, opens the "suggest a correction" form.
2. Fields: text (≤500 words), name, email, consent checkbox, Turnstile
   challenge.
3. Server applies rate-limiting (default: 5 submissions per IP per hour per
   form, adjustable without schema changes), creates a `CommunityNote`
   with `status: pending`.
4. Admin emailed; approval/rejection mirrors the photo flow (§5.3 steps
   4–5).
5. Approved notes appear as a separate "Community Notes" section — they are
   never merged into or overwrite the official `historyFr`/`historyEn` text.
6. No edit/resubmit flow for a rejected note — the submitter simply submits
   a new one if they wish to try again.

### 5.5 Admin moderation
- **Pending queue**: dashboard listing pending Photos and CommunityNotes,
  NSFW-flagged items surfaced first. Approve / reject (with optional
  reason) actions. Rejection triggers submitter notification email
  (§5.3/§5.4).
- **Approved-items management**: a separate view (per building) listing
  already-approved Photos and CommunityNotes, letting the admin unpublish
  or delete them — this is how the manual 30-photo cap (§5.3 point 6) is
  actually exercised, not just triage of incoming submissions.

### 5.6 Admin building management
- Admin UI to create/edit/delete buildings (name, address, bilingual
  history, style tags, lat/lng).
- Address geocoded automatically via Nominatim on save; the resulting
  lat/lng are shown as editable fields so the admin can correct a bad
  match or, if geocoding fails outright, save the building without
  coordinates (it's simply absent from the map until fixed).
- Deleting a building requires an explicit confirmation step (cascades to
  its Photos and CommunityNotes — see `DATA-MODEL.md`).
- ~8 seed buildings entered manually through this UI (not bulk import) —
  see §12.

## 6. Content Moderation & Safety

- **Nothing public-facing is ever auto-published.** All Photos and
  CommunityNotes require explicit admin approval.
- NSFW filter is advisory only (flags for priority review), never an
  auto-reject gate.
- CAPTCHA (Turnstile) + IP-based rate limiting on both submission forms —
  no login exists, so this is the primary anti-spam layer alongside
  moderation.
- Every submission requires an explicit consent checkbox ("I own this
  photo/text and grant the site a license to display it").

## 7. Internationalization

- Bilingual FR/EN from v1, via next-intl.
- Building `name` and `address` are not translated (proper nouns/addresses).
- `historyFr`/`historyEn`: admin writes one language, then uses an LLM to
  draft the other for admin review/edit before publishing (workflow, not
  an automated pipeline — admin always reviews before saving).
- CommunityNotes are rendered exactly as submitted, in whatever language
  the contributor used — not translated.
- Basic hreflang tags for the FR/EN routes; no dedicated SEO work beyond
  that in v1.

## 8. Auth

- Single admin account, NextAuth credentials provider, standard JWT
  session with a reasonable expiry.
- No public user accounts/login anywhere on the site.
- No failed-login lockout or self-service password reset in v1, given
  it's a single seeded admin — if the password is lost it's reset via
  direct DB access/reseed.
- Architecture should allow adding a second admin/moderator later without
  a rework (not required for v1).

## 9. Email Notifications

- Admin is emailed when a new Photo or CommunityNote enters the moderation
  queue.
- Submitters are emailed when their submission is rejected, with a brief
  reason.
- No notification is sent on approval (the content simply appears live).

## 10. Analytics

- Self-hosted Umami, deployed alongside the app on the same VPS (see
  `DEPLOYMENT.md`).

## 11. Legal & Privacy

- Consent checkbox required on every submission (photo and text).
- Retention is a two-tier policy (confirmed by the Product Owner in
  second-pass review):
  - **Approved** submissions: submitter name/email retained **indefinitely**
    as the public/moderation record.
  - **Rejected** submissions: fully deleted **90 days** after `reviewedAt`
    via a scheduled cleanup job. This is a hard delete, not anonymization
    — the DB row (name, email, caption/text) and, for photos, the
    underlying Object Storage file are all removed. Nothing about a
    rejected submission persists past 90 days, since it never went public.
    Full mechanics in `DATA-MODEL.md`.
- Because personal data (name, email) is collected from EU users, a
  lightweight Privacy Policy page is required in v1, explaining both
  retention rules above and how to request deletion.
- Deletion requests are handled manually (submitter emails the admin) —
  no self-service data-deletion feature in v1, given expected low volume.

## 12. Seed Data

Source: `Paris_XIV_Modernist_Building_List.md` (project file), 8 buildings:

1. Église Notre-Dame-du-Travail — 59 rue Vercingétorix (1899–1902)
2. Maison-Atelier Ozenfant — 53 avenue Reille (1922–1924)
3. Villa Seurat — 1–11 Villa Seurat (1924–1931)
4. Pavillon Suisse, Cité Universitaire — 7 bd Jourdan (1930–1933)
5. Maison du Brésil, Cité Universitaire (1953–1959)
6. Immeuble Roux-Spitz — 3 rue de la Cité Universitaire (1930)
7. Maison Perret — 2 square de Montsouris (1923)
8. Fondation Cartier — 261 bd Raspail (1991–1994)

Note the list intentionally spans outside a strict "modernist movement"
window (1899 precursor through a 1994 late-modern building) — style/period
is a freeform tag per §2, not an enforced constraint, so this list is used
as-is.

Entry method: manual, one-by-one, via the admin building-management UI
(§5.6) — no bulk CSV import needed at this volume.

## 13. Out of Scope (v1)

Explicitly deferred, not part of this build:
- Search/filtering (by style, architect, year) — list + map only for now.
- Public user accounts, favorites/bookmarking, social share buttons.
- Structured fields beyond name/address/history/tags (e.g. dedicated
  architect or year-built fields) — that detail lives in the free-text
  history paragraph for now.
- Bulk/CSV building import tooling.
- Self-service data deletion portal.

## 14. Open Assumptions / Tech Lead Decisions

Implementation-level choices made without a dedicated product question —
flag any of these during review if they need revisiting:
- MapLibre GL JS + OpenStreetMap chosen over Google Maps (no API key/cost).
- next-intl chosen as the i18n library for Next.js App Router.
- NSFWJS assumed as the specific open-source NSFW model; any comparable
  open-source/self-hostable model is an acceptable substitute.
- Rate-limiting implementation (simple DB-backed IP counter vs. Redis) left
  open — default to the simplest option given expected low traffic. Default
  limit: 5 submissions per IP per hour per form.
- Photo storage is a public-read bucket served directly (no signed URLs).
- NSFW flag threshold uses the model library's documented default.

Deployment- and schema-specific open assumptions now live in
`DEPLOYMENT.md` and `DATA-MODEL.md` respectively, alongside the sections
they belong to.
