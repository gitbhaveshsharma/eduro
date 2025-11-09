-- ============================================================
-- RLS POLICIES FOR COACHING CENTERS
-- ============================================================

-- Enable RLS on coaching_centers table
ALTER TABLE coaching_centers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on coaching_branches table
ALTER TABLE coaching_branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Owners can view their coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Managers can view their coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Coaches can create coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Owners can update their coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Managers can update their coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Owners can delete their coaching centers" ON coaching_centers;
DROP POLICY IF EXISTS "Admins can manage all coaching centers" ON coaching_centers;

DROP POLICY IF EXISTS "Anyone can view active branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center owners can view all branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center managers can view all branches" ON coaching_branches;
DROP POLICY IF EXISTS "Branch managers can view their branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center owners can create branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center managers can create branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center owners can update branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center managers can update branches" ON coaching_branches;
DROP POLICY IF EXISTS "Branch managers can update their branches" ON coaching_branches;
DROP POLICY IF EXISTS "Center owners can delete branches" ON coaching_branches;
DROP POLICY IF EXISTS "Admins can manage all branches" ON coaching_branches;

-- ============================================================
-- COACHING CENTERS - SELECT POLICIES
-- ============================================================

-- 1. Anyone can view active, verified coaching centers
CREATE POLICY "Anyone can view active coaching centers"
    ON coaching_centers FOR SELECT
    USING (
        status = 'ACTIVE' AND is_verified = true
    );

-- 2. Owners can view their own coaching centers (regardless of status)
CREATE POLICY "Owners can view their coaching centers"
    ON coaching_centers FOR SELECT
    USING (
        auth.uid() = owner_id
    );

-- 3. Managers can view coaching centers they manage
CREATE POLICY "Managers can view their coaching centers"
    ON coaching_centers FOR SELECT
    USING (
        auth.uid() = manager_id
    );

-- 4. Admins and Super Admins can view all coaching centers
CREATE POLICY "Admins can view all coaching centers"
    ON coaching_centers FOR SELECT
    USING (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    );

-- ============================================================
-- COACHING CENTERS - INSERT POLICIES
-- ============================================================

-- 1. Coaches, Teachers, Admins can create coaching centers
CREATE POLICY "Coaches can create coaching centers"
    ON coaching_centers FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('C', 'T', 'A', 'SA') AND
        auth.uid() = owner_id
    );

-- ============================================================
-- COACHING CENTERS - UPDATE POLICIES
-- ============================================================

-- 1. Owners can update their coaching centers
CREATE POLICY "Owners can update their coaching centers"
    ON coaching_centers FOR UPDATE
    USING (
        auth.uid() = owner_id
    )
    WITH CHECK (
        auth.uid() = owner_id
    );

-- 2. Managers can update coaching centers they manage (but not ownership)
CREATE POLICY "Managers can update their coaching centers"
    ON coaching_centers FOR UPDATE
    USING (
        auth.uid() = manager_id
    )
    WITH CHECK (
        auth.uid() = manager_id AND
        -- Managers cannot change owner_id
        owner_id = (SELECT owner_id FROM coaching_centers WHERE id = coaching_centers.id)
    );

-- 3. Admins can update all coaching centers
CREATE POLICY "Admins can update all coaching centers"
    ON coaching_centers FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    );

-- ============================================================
-- COACHING CENTERS - DELETE POLICIES
-- ============================================================

-- 1. Only owners can delete their coaching centers
CREATE POLICY "Owners can delete their coaching centers"
    ON coaching_centers FOR DELETE
    USING (
        auth.uid() = owner_id
    );

-- 2. Super Admins can delete any coaching center
CREATE POLICY "Super Admins can delete coaching centers"
    ON coaching_centers FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'SA'
    );

-- ============================================================
-- COACHING BRANCHES - SELECT POLICIES
-- ============================================================

-- 1. Anyone can view active branches of active, verified centers
CREATE POLICY "Anyone can view active branches"
    ON coaching_branches FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.status = 'ACTIVE'
            AND cc.is_verified = true
        )
    );

-- 2. Center owners can view all branches of their centers
CREATE POLICY "Center owners can view all branches"
    ON coaching_branches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.owner_id = auth.uid()
        )
    );

-- 3. Center managers can view all branches of their centers
CREATE POLICY "Center managers can view all branches"
    ON coaching_branches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.manager_id = auth.uid()
        )
    );

-- 4. Branch managers can view their own branches
CREATE POLICY "Branch managers can view their branches"
    ON coaching_branches FOR SELECT
    USING (
        auth.uid() = manager_id
    );

-- 5. Admins can view all branches
CREATE POLICY "Admins can view all branches"
    ON coaching_branches FOR SELECT
    USING (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    );

-- ============================================================
-- COACHING BRANCHES - INSERT POLICIES
-- ============================================================

-- 1. Center owners can create branches for their centers
CREATE POLICY "Center owners can create branches"
    ON coaching_branches FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.owner_id = auth.uid()
        )
    );

-- 2. Center managers can create branches for their centers
CREATE POLICY "Center managers can create branches"
    ON coaching_branches FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.manager_id = auth.uid()
        )
    );

-- 3. Admins can create branches for any center
CREATE POLICY "Admins can create branches"
    ON coaching_branches FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    );

-- ============================================================
-- COACHING BRANCHES - UPDATE POLICIES
-- ============================================================

-- 1. Center owners can update branches of their centers
CREATE POLICY "Center owners can update branches"
    ON coaching_branches FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.owner_id = auth.uid()
        )
    );

-- 2. Center managers can update branches of their centers
CREATE POLICY "Center managers can update branches"
    ON coaching_branches FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.manager_id = auth.uid()
        )
    );

-- 3. Branch managers can update their own branches
CREATE POLICY "Branch managers can update their branches"
    ON coaching_branches FOR UPDATE
    USING (
        auth.uid() = manager_id
    )
    WITH CHECK (
        auth.uid() = manager_id
    );

-- 4. Admins can update all branches
CREATE POLICY "Admins can update all branches"
    ON coaching_branches FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('A', 'SA')
    );

-- ============================================================
-- COACHING BRANCHES - DELETE POLICIES
-- ============================================================

-- 1. Center owners can delete branches of their centers
CREATE POLICY "Center owners can delete branches"
    ON coaching_branches FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            WHERE cc.id = coaching_branches.coaching_center_id
            AND cc.owner_id = auth.uid()
        )
    );

-- 2. Super Admins can delete any branch
CREATE POLICY "Super Admins can delete branches"
    ON coaching_branches FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'SA'
    );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON POLICY "Anyone can view active coaching centers" ON coaching_centers IS 
    'Public can view active and verified coaching centers';
COMMENT ON POLICY "Owners can view their coaching centers" ON coaching_centers IS 
    'Owners can view all their coaching centers regardless of status';
COMMENT ON POLICY "Managers can view their coaching centers" ON coaching_centers IS 
    'Managers can view coaching centers they manage';
COMMENT ON POLICY "Coaches can create coaching centers" ON coaching_centers IS 
    'Coaches, Teachers, and Admins can create coaching centers';
COMMENT ON POLICY "Owners can update their coaching centers" ON coaching_centers IS 
    'Owners have full update access to their coaching centers';
COMMENT ON POLICY "Managers can update their coaching centers" ON coaching_centers IS 
    'Managers can update centers they manage but cannot change ownership';
COMMENT ON POLICY "Owners can delete their coaching centers" ON coaching_centers IS 
    'Only owners can delete their own coaching centers';
