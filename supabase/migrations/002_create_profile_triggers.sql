CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
    random_digits TEXT;
    random_letters TEXT;
    rand1 INT;
    rand2 INT;
BEGIN
    -- Generate 4-digit number with leading zeros
    random_digits := LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0');

    -- Generate two random uppercase letters
    rand1 := FLOOR(RANDOM() * 26)::INT;
    rand2 := FLOOR(RANDOM() * 26)::INT;
    random_letters := CHR(65 + rand1) || CHR(65 + rand2);

    -- Combine to form username
    generated_username := 'Eduro' || random_digits || random_letters;

    -- Check for uniqueness and regenerate if necessary
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) THEN
            EXIT;
        END IF;

        -- Regenerate username parts
        random_digits := LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0');
        rand1 := FLOOR(RANDOM() * 26)::INT;
        rand2 := FLOOR(RANDOM() * 26)::INT;
        random_letters := CHR(65 + rand1) || CHR(65 + rand2);
        generated_username := 'Eduro' || random_digits || random_letters;
    END LOOP;

    -- Insert new profile with generated username
    INSERT INTO public.profiles (
        id,
        email,
        role,
        onboarding_level,
        profile_completion_percentage,
        created_at,
        updated_at,
        last_seen_at,
        username
    )
    VALUES (
        NEW.id,
        NEW.email,
        'S',
        '1',
        10,
        NOW(),
        NOW(),
        NOW(),
        generated_username
    );

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_seen_at when user is active
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_seen_at when user's last_sign_in_at changes
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET 
            last_seen_at = NEW.last_sign_in_at,
            is_online = TRUE,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when user signs in (updates last_sign_in_at)
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.update_user_last_seen();

-- Function to automatically calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Base completion (having a profile)
    completion_score := 10;
    
    -- Full name (10 points)
    IF profile_record.full_name IS NOT NULL AND LENGTH(TRIM(profile_record.full_name)) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Username (10 points)
    IF profile_record.username IS NOT NULL AND LENGTH(TRIM(profile_record.username)) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Bio (15 points)
    IF profile_record.bio IS NOT NULL AND LENGTH(TRIM(profile_record.bio)) > 0 THEN
        completion_score := completion_score + 15;
    END IF;
    
    -- Avatar (10 points)
    IF profile_record.avatar_url IS NOT NULL AND LENGTH(TRIM(profile_record.avatar_url)) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Phone (5 points)
    IF profile_record.phone IS NOT NULL AND LENGTH(TRIM(profile_record.phone)) > 0 THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Role-specific completion
    IF profile_record.role IN ('T', 'C') THEN
        -- Teachers/Coaches
        -- Expertise areas (15 points)
        IF profile_record.expertise_areas IS NOT NULL AND array_length(profile_record.expertise_areas, 1) > 0 THEN
            completion_score := completion_score + 15;
        END IF;
        
        -- Years of experience (10 points)
        IF profile_record.years_of_experience IS NOT NULL AND profile_record.years_of_experience > 0 THEN
            completion_score := completion_score + 10;
        END IF;
        
        -- Hourly rate (10 points)
        IF profile_record.hourly_rate IS NOT NULL AND profile_record.hourly_rate > 0 THEN
            completion_score := completion_score + 10;
        END IF;
    ELSE
        -- Students
        -- Grade level (10 points)
        IF profile_record.grade_level IS NOT NULL AND LENGTH(TRIM(profile_record.grade_level)) > 0 THEN
            completion_score := completion_score + 10;
        END IF;
        
        -- Subjects of interest (15 points)
        IF profile_record.subjects_of_interest IS NOT NULL AND array_length(profile_record.subjects_of_interest, 1) > 0 THEN
            completion_score := completion_score + 15;
        END IF;
        
        -- Learning goals (10 points)
        IF profile_record.learning_goals IS NOT NULL AND LENGTH(TRIM(profile_record.learning_goals)) > 0 THEN
            completion_score := completion_score + 10;
        END IF;
    END IF;
    
    -- Cap at 100%
    IF completion_score > 100 THEN
        completion_score := 100;
    END IF;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update profile completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := public.calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profile_completion_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_profile_completion();

-- RPC function to manually recalculate profile completion
CREATE OR REPLACE FUNCTION public.recalculate_profile_completion(user_id UUID DEFAULT NULL)
RETURNS TABLE(id UUID, completion_percentage INTEGER) AS $$
BEGIN
    IF user_id IS NOT NULL THEN
        -- Update specific user
        UPDATE public.profiles 
        SET profile_completion_percentage = public.calculate_profile_completion(profiles.id)
        WHERE profiles.id = user_id;
        
        RETURN QUERY 
        SELECT profiles.id, profiles.profile_completion_percentage 
        FROM public.profiles 
        WHERE profiles.id = user_id;
    ELSE
        -- Update all users (admin function)
        UPDATE public.profiles 
        SET profile_completion_percentage = public.calculate_profile_completion(profiles.id);
        
        RETURN QUERY 
        SELECT profiles.id, profiles.profile_completion_percentage 
        FROM public.profiles;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;