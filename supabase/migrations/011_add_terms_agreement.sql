-- Add is_agree field to profiles table for terms and conditions acceptance
ALTER TABLE profiles 
ADD COLUMN is_agree BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX idx_profiles_is_agree ON profiles(is_agree);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_agree IS 'Indicates whether the user has accepted the terms and conditions';