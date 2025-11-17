# Branch Classes Row Level Security (RLS) Policies

## Overview

This document provides **recommended** RLS policies for the `branch_classes` table as a **security backup layer**. The primary authorization is handled at the service level for better performance and UX, but RLS policies provide defense-in-depth security.

> **Important**: Service-level authorization is the primary gate keeper. RLS policies act as a final security net to prevent unauthorized data access even if service-level checks are bypassed.

## Authorization Matrix

| Role               | Permissions                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Coach (C)**      | Full access to classes in their coaching centers (via owner_id or manager_id)          |
| **Branch Manager** | Full access to classes in their managed branches (via manager_id on coaching_branches) |
| **Teacher (T)**    | Read/Update their assigned classes + Read active visible classes                       |
| **Student (S)**    | Read enrolled classes + Read active visible classes                                    |
| **Admin (A/SA)**   | Full access to all classes                                                             |
| **Anonymous**      | Read active visible classes only                                                       |

## Helper Functions

First, create helper functions to check user permissions:

```sql
-- ============================================================
-- HELPER FUNCTION: Check if user owns/manages coaching center
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_manages_coaching_center(
    user_id UUID,
    center_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM coaching_centers
        WHERE id = center_id
          AND (owner_id = user_id OR manager_id = user_id)
    );
END;
$$;

-- ============================================================
-- HELPER FUNCTION: Check if user manages branch
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_manages_branch(
    user_id UUID,
    branch_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    center_id UUID;
BEGIN
    -- Get coaching center ID for this branch
    SELECT coaching_center_id INTO center_id
    FROM coaching_branches
    WHERE id = branch_id;

    -- User manages branch if:
    -- 1. They are the branch manager, OR
    -- 2. They own/manage the coaching center
    RETURN EXISTS (
        SELECT 1
        FROM coaching_branches cb
        JOIN coaching_centers cc ON cc.id = cb.coaching_center_id
        WHERE cb.id = branch_id
          AND (
              cb.manager_id = user_id
              OR cc.owner_id = user_id
              OR cc.manager_id = user_id
          )
    );
END;
$$;

-- ============================================================
-- HELPER FUNCTION: Check if user is teacher of class
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_teaches_class(
    user_id UUID,
    class_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM branch_classes
        WHERE id = class_id
          AND teacher_id = user_id
    );
END;
$$;

-- ============================================================
-- HELPER FUNCTION: Check if student is enrolled in class
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_enrolled_in_class(
    user_id UUID,
    class_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM branch_students
        WHERE class_id = class_id
          AND student_id = user_id
          AND is_active = true
    );
END;
$$;

-- ============================================================
-- HELPER FUNCTION: Check if user has admin role
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = user_id
          AND role IN ('A', 'SA')
    );
END;
$$;

-- ============================================================
-- HELPER FUNCTION: Get user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;

    RETURN user_role;
END;
$$;
```

## RLS Policies for `branch_classes`

### Enable RLS

```sql
ALTER TABLE branch_classes ENABLE ROW LEVEL SECURITY;
```

### SELECT Policy (Read Access)

```sql
-- ============================================================
-- SELECT POLICY: Users can read classes they have access to
-- ============================================================
CREATE POLICY "branch_classes_select_policy"
ON branch_classes
FOR SELECT
USING (
    -- Admin users can see everything
    user_is_admin(auth.uid())

    -- Users who own/manage the coaching center
    OR user_manages_coaching_center(
        auth.uid(),
        (SELECT coaching_center_id FROM coaching_branches WHERE id = branch_id)
    )

    -- Users who manage the branch
    OR user_manages_branch(auth.uid(), branch_id)

    -- Teachers can see their assigned classes
    OR user_teaches_class(auth.uid(), id)

    -- Students can see classes they're enrolled in
    OR user_enrolled_in_class(auth.uid(), id)

    -- Everyone can see active, visible classes (public)
    OR (is_visible = true AND status = 'ACTIVE')
);
```

### INSERT Policy (Create Classes)

```sql
-- ============================================================
-- INSERT POLICY: Users can create classes in branches they manage
-- ============================================================
CREATE POLICY "branch_classes_insert_policy"
ON branch_classes
FOR INSERT
WITH CHECK (
    -- Admin users can create anywhere
    user_is_admin(auth.uid())

    -- Users who own/manage the coaching center
    OR user_manages_coaching_center(
        auth.uid(),
        (SELECT coaching_center_id FROM coaching_branches WHERE id = branch_id)
    )

    -- Users who manage the branch
    OR user_manages_branch(auth.uid(), branch_id)
);
```

### UPDATE Policy (Modify Classes)

```sql
-- ============================================================
-- UPDATE POLICY: Users can update classes they manage or teach
-- ============================================================
CREATE POLICY "branch_classes_update_policy"
ON branch_classes
FOR UPDATE
USING (
    -- Admin users can update anything
    user_is_admin(auth.uid())

    -- Users who own/manage the coaching center
    OR user_manages_coaching_center(
        auth.uid(),
        (SELECT coaching_center_id FROM coaching_branches WHERE id = branch_id)
    )

    -- Users who manage the branch
    OR user_manages_branch(auth.uid(), branch_id)

    -- Teachers can update their own classes
    OR user_teaches_class(auth.uid(), id)
)
WITH CHECK (
    -- Same conditions for the updated record
    user_is_admin(auth.uid())
    OR user_manages_coaching_center(
        auth.uid(),
        (SELECT coaching_center_id FROM coaching_branches WHERE id = branch_id)
    )
    OR user_manages_branch(auth.uid(), branch_id)
    OR user_teaches_class(auth.uid(), id)
);
```

### DELETE Policy

```sql
-- ============================================================
-- DELETE POLICY: Only admins and center/branch managers can delete
-- ============================================================
CREATE POLICY "branch_classes_delete_policy"
ON branch_classes
FOR DELETE
USING (
    -- Admin users can delete anything
    user_is_admin(auth.uid())

    -- Users who own/manage the coaching center
    OR user_manages_coaching_center(
        auth.uid(),
        (SELECT coaching_center_id FROM coaching_branches WHERE id = branch_id)
    )

    -- Users who manage the branch
    OR user_manages_branch(auth.uid(), branch_id)

    -- Note: Teachers CANNOT delete classes, only update them
);
```

## Performance Considerations

### Indexes for RLS Performance

Create indexes to speed up RLS policy checks:

```sql
-- Index on branch_id for join performance
CREATE INDEX IF NOT EXISTS idx_branch_classes_branch_id
ON branch_classes(branch_id);

-- Index on teacher_id for teacher checks
CREATE INDEX IF NOT EXISTS idx_branch_classes_teacher_id
ON branch_classes(teacher_id);

-- Index on status and visibility for public access
CREATE INDEX IF NOT EXISTS idx_branch_classes_public
ON branch_classes(status, is_visible)
WHERE status = 'ACTIVE' AND is_visible = true;

-- Index on coaching_branches for center lookups
CREATE INDEX IF NOT EXISTS idx_coaching_branches_center_id
ON coaching_branches(coaching_center_id);

-- Index on coaching_branches manager
CREATE INDEX IF NOT EXISTS idx_coaching_branches_manager_id
ON coaching_branches(manager_id);

-- Index on branch_students for enrollment checks
CREATE INDEX IF NOT EXISTS idx_branch_students_class_student
ON branch_students(class_id, student_id, is_active);
```

### Materialized View (Optional Optimization)

For very high-traffic scenarios, consider a materialized view for user permissions:

```sql
CREATE MATERIALIZED VIEW user_class_permissions AS
SELECT DISTINCT
    p.id as user_id,
    bc.id as class_id,
    CASE
        WHEN p.role IN ('A', 'SA') THEN 'full'
        WHEN cc.owner_id = p.id OR cc.manager_id = p.id THEN 'manage'
        WHEN cb.manager_id = p.id THEN 'manage'
        WHEN bc.teacher_id = p.id THEN 'update'
        WHEN bs.student_id = p.id THEN 'read'
        WHEN bc.is_visible AND bc.status = 'ACTIVE' THEN 'read'
        ELSE 'none'
    END as permission_level
FROM profiles p
CROSS JOIN branch_classes bc
LEFT JOIN coaching_branches cb ON cb.id = bc.branch_id
LEFT JOIN coaching_centers cc ON cc.id = cb.coaching_center_id
LEFT JOIN branch_students bs ON bs.class_id = bc.id AND bs.student_id = p.id AND bs.is_active = true;

-- Index the materialized view
CREATE INDEX idx_user_class_permissions_lookup
ON user_class_permissions(user_id, class_id, permission_level);

-- Refresh strategy (run periodically or after significant changes)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_class_permissions;
```

## Testing RLS Policies

### Test as Different Users

```sql
-- Test as coach
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '<coach-user-uuid>';
SELECT * FROM branch_classes; -- Should see their center's classes + public

-- Test as teacher
SET LOCAL request.jwt.claims.sub = '<teacher-user-uuid>';
SELECT * FROM branch_classes; -- Should see their classes + public

-- Test as student
SET LOCAL request.jwt.claims.sub = '<student-user-uuid>';
SELECT * FROM branch_classes; -- Should see enrolled classes + public

-- Test as anonymous
RESET ROLE;
SELECT * FROM branch_classes; -- Should see only public active classes
```

### Verify Policy Coverage

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'branch_classes';

-- List all policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'branch_classes';
```

## Migration Script

Complete migration to enable RLS with all policies:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "branch_classes_select_policy" ON branch_classes;
DROP POLICY IF EXISTS "branch_classes_insert_policy" ON branch_classes;
DROP POLICY IF EXISTS "branch_classes_update_policy" ON branch_classes;
DROP POLICY IF EXISTS "branch_classes_delete_policy" ON branch_classes;

-- Enable RLS
ALTER TABLE branch_classes ENABLE ROW LEVEL SECURITY;

-- Create helper functions (paste all helper functions from above)

-- Create policies (paste all policies from above)

-- Create indexes (paste index creation from above)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON branch_classes TO authenticated;
```

## Troubleshooting

### Common Issues

1. **"permission denied for table branch_classes"**

   - Ensure RLS is enabled: `ALTER TABLE branch_classes ENABLE ROW LEVEL SECURITY;`
   - Check policies are created: `SELECT * FROM pg_policies WHERE tablename = 'branch_classes';`

2. **Users can't see data they should access**

   - Check helper functions are working: Test them manually
   - Verify user's role in profiles table
   - Check coaching center/branch relationships

3. **Performance degradation**
   - Ensure indexes are created
   - Consider using materialized view for complex permission checks
   - Monitor with `EXPLAIN ANALYZE`

### Debug Queries

```sql
-- Check user's coaching centers
SELECT cc.id, cc.name
FROM coaching_centers cc
WHERE cc.owner_id = auth.uid() OR cc.manager_id = auth.uid();

-- Check user's managed branches
SELECT cb.id, cb.name
FROM coaching_branches cb
WHERE cb.manager_id = auth.uid()
   OR EXISTS (
       SELECT 1 FROM coaching_centers cc
       WHERE cc.id = cb.coaching_center_id
         AND (cc.owner_id = auth.uid() OR cc.manager_id = auth.uid())
   );

-- Check user's teaching classes
SELECT id, class_name
FROM branch_classes
WHERE teacher_id = auth.uid();

-- Check user's enrolled classes
SELECT bc.id, bc.class_name
FROM branch_classes bc
JOIN branch_students bs ON bs.class_id = bc.id
WHERE bs.student_id = auth.uid() AND bs.is_active = true;
```

## Security Best Practices

1. **Defense in Depth**: Service-level checks + RLS policies
2. **Principle of Least Privilege**: Users only see what they need
3. **Explicit Denials**: Default deny, explicit allow
4. **Audit Logging**: Enable Supabase audit logs for sensitive operations
5. **Regular Reviews**: Periodically review and test policies
6. **Performance Monitoring**: Monitor RLS performance impact

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Service-level authorization: `lib/branch-system/services/branch-classes-auth.service.ts`
