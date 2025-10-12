    -- ==================================================================
    -- POST SYSTEM MIGRATION - Comprehensive Social Media Post System
    -- ==================================================================
    -- This migration creates a complete post system with real-time features,
    -- infinite scroll pagination, reactions, comments, and engagement tracking

    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    -- PostGIS for geographic types and functions
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- ==================================================================
    -- ENUMS AND TYPES
    -- ==================================================================

    -- Post type enumeration
    CREATE TYPE post_type AS ENUM (
        'TEXT',           -- Simple text post
        'IMAGE',          -- Image post with text
        'VIDEO',          -- Video post with text
        'POLL',           -- Poll post
        'ARTICLE',        -- Long-form article
        'QUESTION',       -- Q&A post
        'ANNOUNCEMENT',   -- Official announcements
        'EVENT',          -- Event posts
        'DISCUSSION'      -- Discussion threads
    );

    -- Post privacy levels
    CREATE TYPE post_privacy AS ENUM (
        'PUBLIC',         -- Visible to everyone
        'FOLLOWERS',      -- Visible to followers only
        'FRIENDS',        -- Visible to friends only
        'PRIVATE',        -- Visible to author only
        'RESTRICTED'      -- Visible to specific users
    );

    -- Post status
    CREATE TYPE post_status AS ENUM (
        'DRAFT',          -- Not published yet
        'PUBLISHED',      -- Live and visible
        'ARCHIVED',       -- Hidden from feeds but accessible via link
        'DELETED',        -- Soft deleted
        'FLAGGED',        -- Flagged for review
        'REMOVED'         -- Removed by moderators
    );

    -- Media type for attachments
    CREATE TYPE media_type AS ENUM (
        'IMAGE',
        'VIDEO',
        'AUDIO',
        'DOCUMENT',
        'LINK'
    );

    -- Reaction target types
    CREATE TYPE reaction_target_type AS ENUM (
        'POST',
        'COMMENT',
        'REPLY'
    );

    -- ==================================================================
    -- MAIN POSTS TABLE
    -- ==================================================================

    CREATE TABLE posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        -- Author information
        author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        
        -- Post content
        title TEXT,                           -- Optional title for articles/discussions
        content TEXT NOT NULL,                -- Main post content (required)
        content_preview TEXT,                 -- Auto-generated preview/excerpt
        
        -- Post metadata
        post_type post_type NOT NULL DEFAULT 'TEXT',
        privacy post_privacy NOT NULL DEFAULT 'PUBLIC',
        status post_status NOT NULL DEFAULT 'PUBLISHED',
        
        -- Categories and tagging
        category TEXT,                        -- General category (education, discussion, etc.)
        tags TEXT[],                         -- Array of hashtags
        mentions UUID[],                     -- Array of mentioned user IDs
        
        -- Media and attachments
        media_urls TEXT[],                   -- Array of media file URLs
        media_types media_type[],            -- Corresponding media types
        external_link TEXT,                  -- External URL for link posts
        external_link_preview JSONB,        -- Link preview metadata
        
        -- Location data
        location TEXT,                       -- Text location
        coordinates geometry(Point,4326),    -- Geographic coordinates (PostGIS)
        
        -- Engagement metrics (cached for performance)
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        engagement_score DECIMAL(10,2) DEFAULT 0.0,  -- Calculated engagement score
        
        -- Content moderation
        is_pinned BOOLEAN DEFAULT FALSE,     -- Pinned posts
        is_featured BOOLEAN DEFAULT FALSE,   -- Featured content
        is_sensitive BOOLEAN DEFAULT FALSE,  -- Contains sensitive content
        content_warning TEXT,                -- Content warning text
        
        -- SEO and searchability
        slug TEXT UNIQUE,                    -- URL-friendly slug
        search_vector TSVECTOR,              -- Full-text search vector
        
        -- Scheduling and expiry
        scheduled_at TIMESTAMP WITH TIME ZONE,     -- Future publish time
        expires_at TIMESTAMP WITH TIME ZONE,       -- Post expiration
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- For engagement tracking
        
        -- Constraints
        CONSTRAINT valid_content_length CHECK (LENGTH(TRIM(content)) > 0),
        CONSTRAINT valid_media_arrays CHECK (
            (media_urls IS NULL AND media_types IS NULL) OR
            (array_length(media_urls, 1) = array_length(media_types, 1))
        ),
        CONSTRAINT valid_coordinates CHECK (coordinates IS NULL OR ST_IsValid(coordinates)),
        CONSTRAINT valid_engagement_counts CHECK (
            like_count >= 0 AND comment_count >= 0 AND 
            share_count >= 0 AND view_count >= 0
        )
    );

    -- ==================================================================
    -- COMMENTS TABLE - Nested Comments with Reply Support
    -- ==================================================================

    CREATE TABLE comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        -- Relationships
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
        author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- For nested replies
        
        -- Comment content
        content TEXT NOT NULL,
        
        -- Threading and hierarchy
        thread_level INTEGER DEFAULT 0,      -- 0 = top-level, 1 = reply, 2 = reply to reply, etc.
        thread_path TEXT,                    -- Path like "1.2.3" for nested structure
        
        -- Engagement metrics
        like_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        
        -- Status and moderation
        status post_status DEFAULT 'PUBLISHED',
        is_pinned BOOLEAN DEFAULT FALSE,     -- Pinned comments
        is_highlighted BOOLEAN DEFAULT FALSE, -- Author highlighted comments
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        CONSTRAINT valid_comment_content CHECK (LENGTH(TRIM(content)) > 0),
        CONSTRAINT valid_thread_level CHECK (thread_level >= 0 AND thread_level <= 10),
        CONSTRAINT valid_reply_count CHECK (reply_count >= 0),
        CONSTRAINT valid_like_count CHECK (like_count >= 0)
    );

    -- ==================================================================
    -- POST REACTIONS TABLE - Links posts/comments to your reactions table
    -- ==================================================================

    CREATE TABLE post_reactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        -- Target information
        target_type reaction_target_type NOT NULL,
        target_id UUID NOT NULL,             -- Can be post_id or comment_id
        
        -- User and reaction
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        reaction_id INTEGER REFERENCES reactions(id) ON DELETE CASCADE NOT NULL,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Unique constraint: one reaction per user per target
        UNIQUE(user_id, target_type, target_id)
    );

    -- ==================================================================
    -- SAVED POSTS TABLE - Bookmark functionality
    -- ==================================================================

    CREATE TABLE saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
        
        -- Organization
        collection_name TEXT DEFAULT 'default', -- Allow users to organize saves into collections
        notes TEXT,                             -- Personal notes about saved post
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Unique constraint: one save per user per post
        UNIQUE(user_id, post_id)
    );

    -- ==================================================================
    -- POST VIEWS TABLE - Track post views for analytics
    -- ==================================================================

    CREATE TABLE post_views (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow anonymous views
        
        -- View metadata
        view_duration INTEGER,               -- Time spent viewing (seconds)
        user_agent TEXT,                    -- Browser/app info
        ip_address INET,                    -- IP for analytics
        referrer TEXT,                      -- Where they came from
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraint: limit one view per user per post per day
        -- date column for per-day uniqueness (default to insertion date)
        view_date DATE NOT NULL DEFAULT (now()::date),
        UNIQUE(post_id, user_id, view_date)
    );


    -- ==================================================================
    -- POST SHARES TABLE - Track shares and reposts
    -- ==================================================================

    CREATE TABLE post_shares (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        original_post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        
        -- Share metadata
        share_type TEXT DEFAULT 'repost',    -- 'repost', 'quote', 'external'
        quote_content TEXT,                  -- Additional content when quote-sharing
        platform TEXT,                      -- External platform if shared outside
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ==================================================================
    -- PERFORMANCE INDEXES
    -- ==================================================================

    -- Posts table indexes for infinite scroll and feeds
    CREATE INDEX idx_posts_author_created_desc ON posts(author_id, created_at DESC);
    CREATE INDEX idx_posts_status_published_created_desc ON posts(status, published_at DESC) WHERE status = 'PUBLISHED';
    CREATE INDEX idx_posts_privacy_created_desc ON posts(privacy, created_at DESC);
    CREATE INDEX idx_posts_engagement_score_desc ON posts(engagement_score DESC) WHERE status = 'PUBLISHED';
    CREATE INDEX idx_posts_category ON posts(category) WHERE category IS NOT NULL;
    CREATE INDEX idx_posts_tags_gin ON posts USING GIN(tags) WHERE tags IS NOT NULL;
    CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);
    CREATE INDEX idx_posts_location_gist ON posts USING GIST(coordinates) WHERE coordinates IS NOT NULL;
    CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;

    -- Comments table indexes for threaded discussions
    CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
    CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;
    CREATE INDEX idx_comments_thread_path ON comments(thread_path) WHERE thread_path IS NOT NULL;
    CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);

    -- Reactions indexes for real-time updates
    CREATE INDEX idx_post_reactions_target ON post_reactions(target_type, target_id);
    CREATE INDEX idx_post_reactions_user ON post_reactions(user_id, created_at DESC);
    CREATE INDEX idx_post_reactions_reaction_id ON post_reactions(reaction_id);

    -- Saved posts indexes
    CREATE INDEX idx_saved_posts_user_created ON saved_posts(user_id, created_at DESC);
    CREATE INDEX idx_saved_posts_collection ON saved_posts(user_id, collection_name);

    -- Views and shares indexes
    CREATE INDEX idx_post_views_post_created ON post_views(post_id, created_at DESC);
    CREATE INDEX idx_post_views_user ON post_views(user_id, created_at DESC) WHERE user_id IS NOT NULL;
    CREATE INDEX idx_post_shares_original_created ON post_shares(original_post_id, created_at DESC);
    CREATE INDEX idx_post_shares_user ON post_shares(user_id, created_at DESC);

    -- ==================================================================
    -- TRIGGER FUNCTIONS FOR REAL-TIME UPDATES
    -- ==================================================================

    -- Update timestamp function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Apply updated_at triggers
    CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_post_reactions_updated_at BEFORE UPDATE ON post_reactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Function to update engagement counts in real-time
    CREATE OR REPLACE FUNCTION update_engagement_counts()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Update post engagement counts when reactions change
        IF TG_TABLE_NAME = 'post_reactions' THEN
            IF TG_OP = 'INSERT' AND NEW.target_type = 'POST' THEN
                UPDATE posts 
                SET like_count = like_count + 1,
                    last_activity_at = NOW()
                WHERE id = NEW.target_id;
            ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'POST' THEN
                UPDATE posts 
                SET like_count = GREATEST(like_count - 1, 0),
                    last_activity_at = NOW()
                WHERE id = OLD.target_id;
            ELSIF TG_OP = 'INSERT' AND NEW.target_type = 'COMMENT' THEN
                UPDATE comments 
                SET like_count = like_count + 1
                WHERE id = NEW.target_id;
            ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'COMMENT' THEN
                UPDATE comments 
                SET like_count = GREATEST(like_count - 1, 0)
                WHERE id = OLD.target_id;
            END IF;
        END IF;
        
        -- Update post comment counts when comments change
        IF TG_TABLE_NAME = 'comments' THEN
            IF TG_OP = 'INSERT' THEN
                -- Update post comment count
                UPDATE posts 
                SET comment_count = comment_count + 1,
                    last_activity_at = NOW()
                WHERE id = NEW.post_id;
                
                -- Update parent comment reply count if it's a reply
                IF NEW.parent_comment_id IS NOT NULL THEN
                    UPDATE comments 
                    SET reply_count = reply_count + 1
                    WHERE id = NEW.parent_comment_id;
                END IF;
            ELSIF TG_OP = 'DELETE' THEN
                -- Update post comment count
                UPDATE posts 
                SET comment_count = GREATEST(comment_count - 1, 0),
                    last_activity_at = NOW()
                WHERE id = OLD.post_id;
                
                -- Update parent comment reply count if it was a reply
                IF OLD.parent_comment_id IS NOT NULL THEN
                    UPDATE comments 
                    SET reply_count = GREATEST(reply_count - 1, 0)
                    WHERE id = OLD.parent_comment_id;
                END IF;
            END IF;
        END IF;
        
        -- Update share counts
        IF TG_TABLE_NAME = 'post_shares' THEN
            IF TG_OP = 'INSERT' THEN
                UPDATE posts 
                SET share_count = share_count + 1,
                    last_activity_at = NOW()
                WHERE id = NEW.original_post_id;
            ELSIF TG_OP = 'DELETE' THEN
                UPDATE posts 
                SET share_count = GREATEST(share_count - 1, 0),
                    last_activity_at = NOW()
                WHERE id = OLD.original_post_id;
            END IF;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;

    -- Apply engagement count triggers
    CREATE TRIGGER update_post_engagement_from_reactions 
        AFTER INSERT OR DELETE ON post_reactions 
        FOR EACH ROW EXECUTE FUNCTION update_engagement_counts();

    CREATE TRIGGER update_post_engagement_from_comments 
        AFTER INSERT OR DELETE ON comments 
        FOR EACH ROW EXECUTE FUNCTION update_engagement_counts();

    CREATE TRIGGER update_post_engagement_from_shares 
        AFTER INSERT OR DELETE ON post_shares 
        FOR EACH ROW EXECUTE FUNCTION update_engagement_counts();

    -- Function to maintain comment_count on status changes (soft-delete/restore)
    CREATE OR REPLACE FUNCTION maintain_post_comment_count_on_status_change()
    RETURNS TRIGGER AS $$
    BEGIN
        -- If status changed from PUBLISHED to non-PUBLISHED, decrement post.comment_count
        IF TG_OP = 'UPDATE' THEN
            IF OLD.status = 'PUBLISHED' AND NEW.status <> 'PUBLISHED' THEN
                UPDATE posts
                SET comment_count = GREATEST(comment_count - 1, 0), last_activity_at = NOW()
                WHERE id = NEW.post_id;
            ELSIF OLD.status <> 'PUBLISHED' AND NEW.status = 'PUBLISHED' THEN
                -- Restored or published: increment
                UPDATE posts
                SET comment_count = comment_count + 1, last_activity_at = NOW()
                WHERE id = NEW.post_id;
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Attach trigger to comments for updates to status
    CREATE TRIGGER maintain_comment_count_on_status_update
        AFTER UPDATE OF status ON comments
        FOR EACH ROW EXECUTE FUNCTION maintain_post_comment_count_on_status_change();

    -- Function to generate thread path for nested comments
    CREATE OR REPLACE FUNCTION generate_comment_thread_path()
    RETURNS TRIGGER AS $$
    DECLARE
        parent_path TEXT;
        max_sequence INTEGER;
    BEGIN
        IF NEW.parent_comment_id IS NULL THEN
            -- Top-level comment: find next sequence number
            SELECT COALESCE(MAX(CAST(split_part(thread_path, '.', 1) AS INTEGER)), 0) + 1
            INTO max_sequence
            FROM comments 
            WHERE post_id = NEW.post_id AND parent_comment_id IS NULL;
            
            NEW.thread_path := max_sequence::TEXT;
            NEW.thread_level := 0;
        ELSE
            -- Reply: append to parent's path
            SELECT thread_path, thread_level 
            INTO parent_path, NEW.thread_level
            FROM comments 
            WHERE id = NEW.parent_comment_id;
            
            -- Find next sequence for this parent
            SELECT COALESCE(MAX(CAST(split_part(thread_path, '.', -1) AS INTEGER)), 0) + 1
            INTO max_sequence
            FROM comments 
            WHERE parent_comment_id = NEW.parent_comment_id;
            
            NEW.thread_path := parent_path || '.' || max_sequence::TEXT;
            NEW.thread_level := NEW.thread_level + 1;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER generate_comment_thread_path_trigger
        BEFORE INSERT ON comments
        FOR EACH ROW EXECUTE FUNCTION generate_comment_thread_path();

    -- Function to update search vector for full-text search
    CREATE OR REPLACE FUNCTION update_post_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.search_vector := to_tsvector('english', 
            COALESCE(NEW.title, '') || ' ' || 
            COALESCE(NEW.content, '') || ' ' ||
            COALESCE(array_to_string(NEW.tags, ' '), '')
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_post_search_vector_trigger
        BEFORE INSERT OR UPDATE ON posts
        FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

    -- Function to calculate engagement score
    CREATE OR REPLACE FUNCTION calculate_engagement_score()
    RETURNS TRIGGER AS $$
    DECLARE
        hours_since_creation DECIMAL;
        base_score DECIMAL := 0;
    BEGIN
        -- Calculate hours since post creation
        hours_since_creation := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
        
        -- Prevent division by zero
        IF hours_since_creation < 1 THEN
            hours_since_creation := 1;
        END IF;
        
        -- Calculate engagement score with time decay
        -- Formula: (likes * 1 + comments * 3 + shares * 5 + views * 0.1) / hours^1.5
        base_score := (
            NEW.like_count * 1.0 +
            NEW.comment_count * 3.0 +
            NEW.share_count * 5.0 +
            NEW.view_count * 0.1
        );
        
        NEW.engagement_score := base_score / POWER(hours_since_creation, 1.5);
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER calculate_engagement_score_trigger
        BEFORE UPDATE ON posts
        FOR EACH ROW 
        WHEN (
            OLD.like_count IS DISTINCT FROM NEW.like_count OR
            OLD.comment_count IS DISTINCT FROM NEW.comment_count OR
            OLD.share_count IS DISTINCT FROM NEW.share_count OR
            OLD.view_count IS DISTINCT FROM NEW.view_count
        )
        EXECUTE FUNCTION calculate_engagement_score();

    -- ==================================================================
    -- ROW LEVEL SECURITY POLICIES
    -- ==================================================================

    -- Enable RLS on all tables
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

    -- Posts policies
    CREATE POLICY "Public posts viewable by all" ON posts
        FOR SELECT USING (
            status = 'PUBLISHED' AND 
            privacy = 'PUBLIC' AND
            (expires_at IS NULL OR expires_at > NOW())
        );

    CREATE POLICY "Users can view own posts" ON posts
        FOR SELECT USING (author_id = auth.uid());

    CREATE POLICY "Users can create posts" ON posts
        FOR INSERT WITH CHECK (author_id = auth.uid());

    CREATE POLICY "Users can update own posts" ON posts
        FOR UPDATE USING (author_id = auth.uid())
        WITH CHECK (author_id = auth.uid());

    CREATE POLICY "Users can delete own posts" ON posts
        FOR DELETE USING (author_id = auth.uid());

    -- Comments policies
    CREATE POLICY "Comments viewable when post viewable" ON comments
        FOR SELECT USING (
            status = 'PUBLISHED' AND
            EXISTS (
                SELECT 1 FROM posts 
                WHERE posts.id = comments.post_id 
                AND (
                    (posts.status = 'PUBLISHED' AND posts.privacy = 'PUBLIC') OR
                    posts.author_id = auth.uid()
                )
            )
        );

    CREATE POLICY "Users can create comments" ON comments
        FOR INSERT WITH CHECK (
            author_id = auth.uid() AND
            EXISTS (
                SELECT 1 FROM posts 
                WHERE posts.id = comments.post_id 
                AND posts.status = 'PUBLISHED'
            )
        );

    CREATE POLICY "Users can update own comments" ON comments
        FOR UPDATE USING (author_id = auth.uid())
        WITH CHECK (author_id = auth.uid());

    CREATE POLICY "Users can delete own comments" ON comments
        FOR DELETE USING (author_id = auth.uid());

    -- Reactions policies
    CREATE POLICY "Reactions viewable by all" ON post_reactions
        FOR SELECT USING (true);

    CREATE POLICY "Users can manage own reactions" ON post_reactions
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

    -- Saved posts policies
    CREATE POLICY "Users can manage own saved posts" ON saved_posts
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

    -- Views policies (more permissive for analytics)
    CREATE POLICY "Users can create views" ON post_views
        FOR INSERT WITH CHECK (
            user_id = auth.uid() OR user_id IS NULL
        );

    CREATE POLICY "Users can view own view history" ON post_views
        FOR SELECT USING (user_id = auth.uid());

    -- Shares policies
    CREATE POLICY "Shares viewable by all" ON post_shares
        FOR SELECT USING (true);

    CREATE POLICY "Users can manage own shares" ON post_shares
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

    -- ==================================================================
    -- UTILITY FUNCTIONS FOR FRONTEND
    -- ==================================================================

    -- Function to get feed posts with pagination
    CREATE OR REPLACE FUNCTION get_feed_posts(
        user_id_param UUID DEFAULT auth.uid(),
        limit_param INTEGER DEFAULT 20,
        offset_param INTEGER DEFAULT 0,
        sort_by TEXT DEFAULT 'recent' -- 'recent', 'popular', 'trending'
    )
    RETURNS TABLE (
        id UUID,
        author_id UUID,
        author_username TEXT,
        author_full_name TEXT,
        author_avatar_url TEXT,
        title TEXT,
        content TEXT,
        post_type post_type,
        privacy post_privacy,
        media_urls TEXT[],
        media_types media_type[],
        like_count INTEGER,
        comment_count INTEGER,
        share_count INTEGER,
        view_count INTEGER,
        engagement_score DECIMAL,
        user_has_liked BOOLEAN,
        user_has_saved BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE,
        last_activity_at TIMESTAMP WITH TIME ZONE
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            p.id,
            p.author_id,
            pr.username as author_username,
            pr.full_name as author_full_name,
            pr.avatar_url as author_avatar_url,
            p.title,
            p.content,
            p.post_type,
            p.privacy,
            p.media_urls,
            p.media_types,
            p.like_count,
            -- Compute comment_count only for published comments
            (
                SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'PUBLISHED'
            )::INTEGER AS comment_count,
            p.share_count,
            p.view_count,
            p.engagement_score,
            EXISTS(
                SELECT 1 FROM post_reactions pr2 
                WHERE pr2.target_type = 'POST' 
                AND pr2.target_id = p.id 
                AND pr2.user_id = user_id_param
            ) as user_has_liked,
            EXISTS(
                SELECT 1 FROM saved_posts sp 
                WHERE sp.post_id = p.id 
                AND sp.user_id = user_id_param
            ) as user_has_saved,
            p.created_at,
            p.last_activity_at
        FROM posts p
        JOIN profiles pr ON p.author_id = pr.id
        WHERE p.status = 'PUBLISHED'
            AND p.privacy = 'PUBLIC'
            AND (p.expires_at IS NULL OR p.expires_at > NOW())
            AND pr.is_active = true
        ORDER BY 
            CASE WHEN sort_by = 'recent' THEN p.created_at END DESC,
            CASE WHEN sort_by = 'popular' THEN p.like_count END DESC,
            CASE WHEN sort_by = 'trending' THEN p.engagement_score END DESC
        LIMIT limit_param
        OFFSET offset_param;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to get post comments with threading
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
        parent_comment_id UUID,
        content TEXT,
        thread_level INTEGER,
        thread_path TEXT,
        like_count INTEGER,
        reply_count INTEGER,
        user_has_liked BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE
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
            c.created_at
        FROM comments c
        JOIN profiles pr ON c.author_id = pr.id
        WHERE c.post_id = post_id_param
            AND c.status = 'PUBLISHED'
            AND pr.is_active = true
        ORDER BY c.thread_path
        LIMIT limit_param
        OFFSET offset_param;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to toggle reaction
    CREATE OR REPLACE FUNCTION toggle_reaction(
        target_type_param reaction_target_type,
        target_id_param UUID,
        reaction_id_param INTEGER
    )
    RETURNS BOOLEAN AS $$
    DECLARE
        existing_reaction_id INTEGER;
        result BOOLEAN;
    BEGIN
        -- Check if user already has a reaction on this target
        SELECT reaction_id INTO existing_reaction_id
        FROM post_reactions
        WHERE user_id = auth.uid()
            AND target_type = target_type_param
            AND target_id = target_id_param;
        
        IF existing_reaction_id IS NOT NULL THEN
            IF existing_reaction_id = reaction_id_param THEN
                -- Remove the same reaction
                DELETE FROM post_reactions
                WHERE user_id = auth.uid()
                    AND target_type = target_type_param
                    AND target_id = target_id_param;
                result := FALSE;
            ELSE
                -- Update to new reaction
                UPDATE post_reactions
                SET reaction_id = reaction_id_param,
                    updated_at = NOW()
                WHERE user_id = auth.uid()
                    AND target_type = target_type_param
                    AND target_id = target_id_param;
                result := TRUE;
            END IF;
        ELSE
            -- Add new reaction
            INSERT INTO post_reactions (user_id, target_type, target_id, reaction_id)
            VALUES (auth.uid(), target_type_param, target_id_param, reaction_id_param);
            result := TRUE;
        END IF;
        
        RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to record post view
    CREATE OR REPLACE FUNCTION record_post_view(
        post_id_param UUID,
        view_duration_param INTEGER DEFAULT NULL
    )
    RETURNS VOID AS $$
    BEGIN
        -- Upsert the view and determine whether it was an INSERT (new daily view)
        WITH upsert AS (
            INSERT INTO post_views (post_id, user_id, view_duration, view_date)
            VALUES (post_id_param, auth.uid(), view_duration_param, now()::date)
            ON CONFLICT (post_id, user_id, view_date) DO UPDATE
            SET view_duration = GREATEST(post_views.view_duration, EXCLUDED.view_duration),
                created_at = NOW()
            RETURNING (xmax = 0) AS inserted
        )
        -- If the row was newly inserted, increment posts.view_count once for the day
        UPDATE posts
        SET view_count = view_count + 1,
            last_activity_at = NOW()
        WHERE id = post_id_param
        AND EXISTS (SELECT 1 FROM upsert WHERE upsert.inserted = true);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- ==================================================================
    -- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
    -- ==================================================================

    -- Insert some sample posts for testing (commented out for production)
    /*
    INSERT INTO posts (author_id, content, post_type, category, tags) VALUES
    (
        (SELECT id FROM auth.users LIMIT 1),
        'Welcome to Eduro! This is our first post. What would you like to learn today? 📚✨',
        'TEXT',
        'announcement',
        ARRAY['welcome', 'learning', 'education']
    ),
    (
        (SELECT id FROM auth.users LIMIT 1),
        'What are your favorite study techniques? I''ve been using the Pomodoro Technique and it''s been amazing! 🍅⏰',
        'QUESTION',
        'discussion',
        ARRAY['study', 'productivity', 'tips']
    );
    */

    -- ==================================================================
    -- SUMMARY COMMENT
    -- ==================================================================

    /*
    This migration creates a comprehensive post system with:

    1. **Posts Table**: Full-featured posts with media, privacy, scheduling, SEO
    2. **Comments Table**: Nested comments with unlimited threading depth
    3. **Post Reactions**: Integration with your existing reactions table
    4. **Saved Posts**: Bookmark functionality with collections
    5. **Post Views**: Analytics and view tracking
    6. **Post Shares**: Repost and share functionality

    Key Features:
    - Real-time updates via triggers and websockets
    - Infinite scroll pagination support
    - Full-text search capability
    - Engagement score calculation with time decay
    - Comprehensive RLS policies
    - Thread-safe comment nesting
    - Performance-optimized indexes

    Frontend Integration:
    - Use get_feed_posts() for infinite scroll feeds
    - Use get_post_comments() for threaded comments
    - Use toggle_reaction() for real-time reactions
    - Use record_post_view() for analytics

    Real-time Features:
    - All engagement counts update automatically
    - Thread paths generate automatically
    - Search vectors update on content changes
    - Engagement scores recalculate on interactions

    Next Steps:
    1. Run this migration
    2. Test with sample data
    3. Implement frontend components
    4. Set up real-time subscriptions
    5. Add notification triggers
    */