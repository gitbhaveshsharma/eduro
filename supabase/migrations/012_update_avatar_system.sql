-- Update avatar system to support JSONB storage for avatar configurations
-- This allows storing both legacy URLs and new avatar config objects

-- First, create a backup column for existing avatar URLs
ALTER TABLE profiles ADD COLUMN avatar_url_backup TEXT;

-- Copy existing avatar URLs to backup
UPDATE profiles SET avatar_url_backup = avatar_url WHERE avatar_url IS NOT NULL;

-- Change avatar_url column to JSONB
ALTER TABLE profiles ALTER COLUMN avatar_url TYPE JSONB USING avatar_url::JSONB;

-- Update existing text URLs to be stored as strings in JSONB
UPDATE profiles 
SET avatar_url = to_jsonb(avatar_url_backup) 
WHERE avatar_url_backup IS NOT NULL AND avatar_url_backup != '';

-- Add comment explaining the new structure
COMMENT ON COLUMN profiles.avatar_url IS 'Avatar configuration - can be legacy URL string or avatar config object {type, uniqueString}';

-- Create index for faster avatar queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_jsonb ON profiles USING GIN(avatar_url);

-- The backup column can be dropped after migration is verified
-- DROP COLUMN avatar_url_backup;