#!/usr/bin/env sh
set -e

# Apply database migrations if using a migratable provider
npx prisma migrate deploy || true

# Start API server (serves built client from /dist)
npm start