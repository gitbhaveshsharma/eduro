-- Drop existing basic policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result FROM public.profiles WHERE id = user_id;
    RETURN COALESCE(user_role_result, 'S'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is coach
CREATE OR REPLACE FUNCTION public.is_coach(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(user_id) = 'C';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(user_id) = 'A';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(user_id) = 'SA';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Helper function to check if user is teacher or coach
CREATE OR REPLACE FUNCTION public.is_teacher_or_coach(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(user_id) IN ('T', 'C');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT Policies
-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 2. Everyone can view public profile information of active users
CREATE POLICY "Public profile information viewable"
    ON profiles FOR SELECT
    USING (
        is_active = true AND (
            -- Basic public info for all users
            auth.uid() IS NOT NULL
        )
    );

-- 3. Teachers and coaches can view more detailed student profiles
CREATE POLICY "Teachers can view student details"
    ON profiles FOR SELECT
    USING (
        is_active = true AND 
        role = 'S' AND 
        public.is_teacher_or_coach() = true
    );

-- 4. Coaches can view all student and teacher profiles
    CREATE POLICY "Coaches can view student and teacher profiles"
        ON profiles FOR SELECT
        USING (
            is_active = true AND 
            role IN ('S', 'T') AND 
            public.is_coach() = true
        );

-- UPDATE Policies
-- 1. Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE Policies
-- 1. Users can soft-delete their own profile (set is_active = false)
CREATE POLICY "Users can deactivate own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id AND is_active = true)
    WITH CHECK (auth.uid() = id AND is_active = false);

-- Security functions for frontend use
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    current_user_role user_role;
    target_user_role user_role;
    target_is_active BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    -- Must be authenticated
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Can always view own profile
    IF current_user_id = target_user_id THEN
        RETURN true;
    END IF;
    
    -- Get user roles and target status
    SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
    SELECT role, is_active INTO target_user_role, target_is_active FROM public.profiles WHERE id = target_user_id;
    
    -- Target must be active
    IF target_is_active = false THEN
        RETURN false;
    END IF;    
    -- Basic public profile info is viewable by all authenticated users
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_edit_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    current_user_role user_role;
BEGIN
    current_user_id := auth.uid();
    
    -- Must be authenticated
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Can always edit own profile
    IF current_user_id = target_user_id THEN
        RETURN true;
    END IF;
    
    -- Get current user role
    SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
    -- Only admins and super admins can edit others' profiles
    IF current_user_role IN ('A') THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;