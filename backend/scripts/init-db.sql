-- Initial database setup
-- This file runs automatically when the Docker container is first created

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up initial database settings
ALTER DATABASE mindmap_dev SET timezone TO 'UTC';

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Mind Map database initialized successfully at %', NOW();
END $$;