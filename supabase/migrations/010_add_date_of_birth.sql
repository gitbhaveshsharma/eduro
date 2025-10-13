-- Add date_of_birth field to profiles table
-- This migration adds date of birth support for age validation in onboarding

ALTER TABLE profiles 
ADD COLUMN date_of_birth DATE;

-- Add comment for the new column
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth for age validation during onboarding';

-- Create index for date_of_birth queries (optional, for performance if needed)
CREATE INDEX idx_profiles_date_of_birth ON profiles(date_of_birth) WHERE date_of_birth IS NOT NULL;