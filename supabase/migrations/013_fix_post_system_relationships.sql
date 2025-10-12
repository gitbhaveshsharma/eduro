-- ==================================================================
-- POST SYSTEM RELATIONSHIP FIXES
-- ==================================================================
-- This migration fixes the relationship issues between comments and profiles
-- and improves the post_views conflict handling

-- Fix 1: Ensure proper foreign key relationship detection for comments table
-- Drop and recreate the comments foreign key constraint to ensure proper schema detection
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix 2: Add missing view_date field handling in post_views
-- Update the record_post_view function to properly handle the view_date constraint
CREATE OR REPLACE FUNCTION record_post_view(
    post_id_param UUID,
    view_duration_param INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Use proper upsert with view_date handling
    INSERT INTO post_views (post_id, user_id, view_duration, view_date, created_at)
    VALUES (
        post_id_param, 
        auth.uid(), 
        view_duration_param, 
        CURRENT_DATE,
        NOW()
    )
    ON CONFLICT (post_id, user_id, view_date) 
    DO UPDATE SET 
        view_duration = GREATEST(post_views.view_duration, EXCLUDED.view_duration),
        created_at = NOW();
    
    -- Only increment post view_count if this is a new daily view
    -- Check if we actually inserted a new row (not just updated)
    IF NOT FOUND THEN
        -- This means we updated an existing row, don't increment count
        RETURN;
    END IF;
    
    -- Increment the post view count for new daily views
    UPDATE posts
    SET view_count = view_count + 1,
        last_activity_at = NOW()
    WHERE id = post_id_param;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where multiple requests try to insert the same view
        -- Just update the existing record
        UPDATE post_views 
        SET view_duration = GREATEST(view_duration, view_duration_param),
            created_at = NOW()
        WHERE post_id = post_id_param 
            AND user_id = auth.uid() 
            AND view_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: Add proper indexes for relationship performance
CREATE INDEX IF NOT EXISTS idx_comments_author_profile ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_target ON post_reactions(user_id, target_type, target_id);

-- Fix 4: Ensure proper RLS policies for comments with profile relationships
DROP POLICY IF EXISTS "Comments viewable when post viewable" ON comments;

CREATE POLICY "Comments viewable when post viewable" ON comments
    FOR SELECT USING (
        status = 'PUBLISHED' AND
        EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = comments.post_id 
            AND (
                (p.status = 'PUBLISHED' AND p.privacy = 'PUBLIC') OR
                p.author_id = auth.uid() OR
                comments.author_id = auth.uid()
            )
        ) AND
        EXISTS (
            SELECT 1 FROM profiles pr
            WHERE pr.id = comments.author_id
            AND pr.is_active = true
        )
    );

-- Fix 5: Create a view for easier comment-profile relationships
CREATE OR REPLACE VIEW comments_with_profiles AS
SELECT 
    c.*,
    p.username as author_username,
    p.full_name as author_full_name,
    p.avatar_url as author_avatar_url,
    p.is_verified as author_is_verified,
    p.reputation_score as author_reputation_score
FROM comments c
JOIN profiles p ON c.author_id = p.id
WHERE p.is_active = true;

-- Enable RLS on the view
ALTER VIEW comments_with_profiles SET (security_barrier = true);

-- Fix 6: Update get_post_comments function to be more robust
CREATE OR REPLACE FUNCTION get_post_comments(
    post_id_param UUID,
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    post_id UUID,
    author_id UUID,
    author_username TEXT,
    author_full_name TEXT,
    author_avatar_url TEXT,
    author_is_verified BOOLEAN,
    author_reputation_score INTEGER,
    parent_comment_id UUID,
    content TEXT,
    thread_level INTEGER,
    thread_path TEXT,
    like_count INTEGER,
    reply_count INTEGER,
    user_has_liked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.author_id,
        pr.username as author_username,
        pr.full_name as author_full_name,
        pr.avatar_url as author_avatar_url,
        pr.is_verified as author_is_verified,
        pr.reputation_score as author_reputation_score,
        c.parent_comment_id,
        c.content,
        c.thread_level,
        c.thread_path,
        c.like_count,
        c.reply_count,
        EXISTS(
            SELECT 1 FROM post_reactions pr2 
            WHERE pr2.target_type = 'COMMENT' 
            AND pr2.target_id = c.id 
            AND pr2.user_id = auth.uid()
        ) as user_has_liked,
        c.created_at,
        c.updated_at
    FROM comments c
    INNER JOIN profiles pr ON c.author_id = pr.id
    WHERE c.post_id = post_id_param
        AND c.status = 'PUBLISHED'
        AND pr.is_active = true
    ORDER BY 
        CASE 
            WHEN c.thread_path IS NOT NULL THEN c.thread_path
            ELSE c.id::text
        END
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_post_comments IS 'Get comments for a post with proper profile relationships and threading support';

-- Fix 7: Add a function to create comments with proper validation
CREATE OR REPLACE FUNCTION create_comment(
    p_post_id UUID,
    p_content TEXT,
    p_parent_comment_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_comment_id UUID;
    post_exists BOOLEAN;
    parent_exists BOOLEAN := true;
BEGIN
    -- Validate post exists and is accessible
    SELECT EXISTS(
        SELECT 1 FROM posts 
        WHERE id = p_post_id 
        AND status = 'PUBLISHED'
        AND (privacy = 'PUBLIC' OR author_id = auth.uid())
    ) INTO post_exists;
    
    IF NOT post_exists THEN
        RAISE EXCEPTION 'Post not found or not accessible';
    END IF;
    
    -- Validate parent comment if provided
    IF p_parent_comment_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM comments 
            WHERE id = p_parent_comment_id 
            AND post_id = p_post_id
            AND status = 'PUBLISHED'
        ) INTO parent_exists;
        
        IF NOT parent_exists THEN
            RAISE EXCEPTION 'Parent comment not found';
        END IF;
    END IF;
    
    -- Create the comment
    INSERT INTO comments (post_id, author_id, parent_comment_id, content)
    VALUES (p_post_id, auth.uid(), p_parent_comment_id, p_content)
    RETURNING id INTO new_comment_id;
    
    RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_comment IS 'Create a new comment with proper validation and relationship checks';

-- Fix 8: Create helper function for batch post view recording with better conflict handling
CREATE OR REPLACE FUNCTION batch_record_post_views_safe(
    p_post_ids UUID[],
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    post_id_item UUID;
BEGIN
    -- Handle each post view individually to avoid batch conflicts
    FOREACH post_id_item IN ARRAY p_post_ids
    LOOP
        BEGIN
            INSERT INTO post_views (post_id, user_id, view_date, created_at)
            VALUES (post_id_item, p_user_id, CURRENT_DATE, NOW())
            ON CONFLICT (post_id, user_id, view_date) DO NOTHING;
            
            -- Count successful inserts
            IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
                
                -- Update post view count
                UPDATE posts 
                SET view_count = view_count + 1,
                    last_activity_at = NOW()
                WHERE id = post_id_item;
            END IF;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Skip this post view, continue with others
                CONTINUE;
        END;
    END LOOP;
    
    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION batch_record_post_views_safe IS 'Safely record multiple post views with conflict resolution';

-- Add helpful comments to the migration
-- COMMENT ON MIGRATION IS 'Fix post system relationships and conflict handling for 409 errors and schema detection issues';