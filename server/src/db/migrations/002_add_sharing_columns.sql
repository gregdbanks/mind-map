-- Add sharing support to maps table
ALTER TABLE maps ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE maps ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
ALTER TABLE maps ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_maps_share_token ON maps(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maps_is_public ON maps(is_public) WHERE is_public = TRUE;
