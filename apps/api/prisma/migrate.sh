#!/bin/bash
# Run Prisma migrations and seed for a fresh database
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Done."
