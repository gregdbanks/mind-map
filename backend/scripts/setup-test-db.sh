#!/bin/bash
# Script to set up test database

echo "🔧 Setting up test database..."

# Wait for PostgreSQL to be ready
until docker-compose exec -T postgres pg_isready -U mindmap_user; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

# Create test database if it doesn't exist
docker-compose exec -T postgres psql -U mindmap_user -d mindmap_dev -c "CREATE DATABASE mindmap_test;" 2>/dev/null || echo "Test database already exists"

echo "✅ Test database ready!"