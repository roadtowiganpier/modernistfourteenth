# DATA-MODEL.md — Modernist Buildings of Paris XIV

Companion to `SPEC.md` (product behavior, source of truth) and
`DEPLOYMENT.md` (hosting/CI-CD). This file defines the persisted schema —
if a feature description in `SPEC.md` implies a field this file doesn't
have, that's a gap to flag, not a green light to invent one silently.

---

## Entities

### Building
- `id`, `slug`
- `name` (string, not translated — proper noun)
- `address` (string, not translated)
- `lat`, `lng` (nullable until geocoded; admin-editable — see SPEC.md →
  Admin building management)
- `historyFr`, `historyEn` (text)
- `styleTags` (string array, freeform)
- `createdAt`, `updatedAt` (surfaced publicly as "last updated" — reflects
  edits to the Building record itself only: name/address/history/tags/
  coordinates. Approving a Photo or CommunityNote does not bump this.)
- Buildings are admin-authored only — not user-submitted, so no moderation
  status field is needed on this entity.
- Deleting a Building cascades to delete its Photos and CommunityNotes.
  Admin-only, destructive action — the admin UI must require an explicit
  confirmation step before deleting (see SPEC.md → Admin building
  management).

### Photo
- `id`, `buildingId` (FK → Building)
- `storageKey` (Object Storage path)
- `caption` (text, ≤200 words — also used as the image's public `alt` text)
- `submitterName`, `submitterEmail`
- `consentGiven` (boolean, required true to submit)
- `nsfwFlagged` (boolean, from auto-filter — sorts the moderation queue,
  does not block submission)
- `status`: `pending | approved | rejected`
- `rejectionReason` (nullable text)
- `createdAt`, `reviewedAt`
- **Retention**: rejected rows are fully deleted 90 days after
  `reviewedAt` via a scheduled cleanup job — the DB row
  (`submitterName`/`submitterEmail`, caption) **and** the associated
  Object Storage file are both removed. This is a hard delete, not
  anonymization. Approved rows are retained indefinitely as the
  public/moderation record. See SPEC.md → Legal & Privacy for the policy
  rationale.

### CommunityNote
(text correction/addition to a building's official history)
- `id`, `buildingId` (FK → Building)
- `text` (free text, ≤500 words — rendered as submitted, not translated)
- `submitterName`, `submitterEmail`
- `consentGiven` (boolean, required true to submit)
- `status`: `pending | approved | rejected`
- `rejectionReason` (nullable text)
- `createdAt`, `reviewedAt`
- **Retention**: same 90-day rejected-row rule as Photo, above (full
  deletion, not anonymization — there's no separate file to remove here,
  just the DB row).

### AdminUser
- `id`, `email`, `passwordHash`

No public-facing user account entity exists in this system.

## Relationships

- `Building` 1—N `Photo` (cascade delete on Building removal)
- `Building` 1—N `CommunityNote` (cascade delete on Building removal)
- `AdminUser` has no relations — it exists only for NextAuth's credentials
  provider.

## Illustrative Prisma sketch

Not authoritative field-by-field — the prose above is the spec — but a
reasonable starting point for `schema.prisma`:

```prisma
model Building {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String
  address    String
  lat        Float?
  lng        Float?
  historyFr  String
  historyEn  String
  styleTags  String[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  photos        Photo[]
  communityNotes CommunityNote[]
}

enum SubmissionStatus {
  pending
  approved
  rejected
}

model Photo {
  id               String            @id @default(cuid())
  buildingId       String
  building         Building          @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  storageKey       String
  caption          String
  submitterName    String
  submitterEmail   String
  consentGiven     Boolean
  nsfwFlagged      Boolean           @default(false)
  status           SubmissionStatus  @default(pending)
  rejectionReason  String?
  createdAt        DateTime          @default(now())
  reviewedAt       DateTime?
}

model CommunityNote {
  id               String            @id @default(cuid())
  buildingId       String
  building         Building          @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  text             String
  submitterName    String
  submitterEmail   String
  consentGiven     Boolean
  status           SubmissionStatus  @default(pending)
  rejectionReason  String?
  createdAt        DateTime          @default(now())
  reviewedAt       DateTime?
}

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
}
```

## Open Assumptions / Tech Lead Decisions

- `cuid()` IDs assumed over UUIDs — either is fine, no product-level
  implication.
- `styleTags` modeled as a native Postgres string array (Prisma
  `String[]`) rather than a join table — reasonable at this scale given
  tags are freeform and unfiltered in v1 (see SPEC.md → Out of Scope).
