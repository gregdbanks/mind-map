#!/bin/bash

# Database setup script for Mind Map application
# This script ensures the database is ready before the application starts

set -e

echo "🔄 Checking database connection..."

# Wait for Postgres to be ready
until docker exec mindmap_postgres pg_isready -U mindmap_user -d mindmap_dev > /dev/null 2>&1; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if we need to run migrations
if [ "$1" == "--migrate" ]; then
  echo "🔄 Running database migrations..."
  cd backend
  npx prisma migrate deploy
  echo "✅ Migrations completed!"
fi

echo "🚀 Database setup complete!"