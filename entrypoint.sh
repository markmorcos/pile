#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
npx prisma migrate deploy

echo "▶ Starting application..."
exec pm2-runtime ecosystem.config.cjs
