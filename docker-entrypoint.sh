#!/bin/sh
set -e

# Run pending migrations before the Next.js server starts (see
# DEPLOYMENT.md — no separate migration step in the CI/CD pipeline).
npx prisma migrate deploy

exec "$@"
