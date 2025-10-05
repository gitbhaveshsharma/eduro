-- Create user role enum
CREATE TYPE user_role AS ENUM ('SA', 'A','S', 'T', 'C'); -- SA: Super Admin, A: Admin, S: Student, T: Teacher, C: Coach

-- Create onboarding level enum 
CREATE TYPE onboarding_level AS ENUM ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Basic profile information
    full_name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    
    -- Role and status
    role user_role NOT NULL DEFAULT 'S',
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Onboarding and completion tracking
    onboarding_level onboarding_level DEFAULT '1',
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
    
    -- Contact information
    email TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Platform preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    chat_notifications BOOLEAN DEFAULT TRUE,
    whatsapp_notifications BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    language_preference TEXT DEFAULT 'en',
    
    -- Social links
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    
    -- Role-specific fields
    -- For Teachers/Coaches
    expertise_areas TEXT[], -- Array of subjects/skills they teach
    years_of_experience INTEGER,
    hourly_rate DECIMAL(10,2),
    
    -- Reputation and engagement metrics
    reputation_score INTEGER DEFAULT 0,
    
    -- For Students
    grade_level TEXT,
    subjects_of_interest TEXT[], -- Array of subjects they want to learn
    learning_goals TEXT,
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    -- Allow NULL username (not required at signup) or a valid username matching the pattern
    CONSTRAINT valid_username CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_email_format CHECK (
        (website_url IS NULL OR website_url ~ '^https?://.*') AND
        (linkedin_url IS NULL OR linkedin_url ~ '^https?://.*') AND
        (github_url IS NULL OR github_url ~ '^https?://.*') AND
        (twitter_url IS NULL OR twitter_url ~ '^https?://.*')
    )
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_online ON profiles(is_online);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_reputation_score ON profiles(reputation_score);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_expertise_areas ON profiles USING GIN(expertise_areas);
CREATE INDEX idx_profiles_subjects_of_interest ON profiles USING GIN(subjects_of_interest);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
    ON profiles FOR DELETE 
    USING (auth.uid() = id);