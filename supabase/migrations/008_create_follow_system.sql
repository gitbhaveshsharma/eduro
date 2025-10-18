-- =====================================================================
-- USER FOLLOWERS / FOLLOWING SYSTEM
-- Social graph for personalized feeds and networking
-- =====================================================================

-- ==================================================================
-- MAIN FOLLOWER TABLE
-- ==================================================================

CREATE TABLE user_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationship participants
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Follow metadata
  follow_status TEXT DEFAULT 'active' CHECK (follow_status IN ('active', 'blocked', 'muted')),
  notification_enabled BOOLEAN DEFAULT TRUE, -- Get notifications from this user
  
  -- Follow categorization (optional)
  follow_category TEXT, -- 'close_friend', 'colleague', 'mentor', etc.
  notes TEXT, -- Personal notes about this connection
  
  -- Mutual follow detection (denormalized for performance)
  is_mutual BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id) -- One follow relationship per pair
);

-- ==================================================================
-- FOLLOW REQUESTS TABLE (for private accounts)
-- ==================================================================

CREATE TABLE follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Request participants
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Request status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  
  -- Message with request
  message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT no_self_follow_request CHECK (requester_id != target_id),
  UNIQUE(requester_id, target_id)
);

-- ==================================================================
-- BLOCKED USERS TABLE
-- ==================================================================

CREATE TABLE blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Blocking relationship
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Block reason (optional)
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

-- ==================================================================
-- PERFORMANCE INDEXES
-- ==================================================================

-- Follower table indexes
CREATE INDEX idx_user_followers_follower ON user_followers(follower_id, created_at DESC);
CREATE INDEX idx_user_followers_following ON user_followers(following_id, created_at DESC);
CREATE INDEX idx_user_followers_mutual ON user_followers(follower_id, following_id) WHERE is_mutual = TRUE;
CREATE INDEX idx_user_followers_status ON user_followers(follower_id, follow_status);

-- Follow requests indexes
CREATE INDEX idx_follow_requests_target ON follow_requests(target_id, status, created_at DESC);
CREATE INDEX idx_follow_requests_requester ON follow_requests(requester_id, created_at DESC);
CREATE INDEX idx_follow_requests_pending ON follow_requests(status, created_at DESC) WHERE status = 'pending';

-- Blocked users indexes
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- ==================================================================
-- TRIGGER FUNCTIONS
-- ==================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_followers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_followers_updated_at
  BEFORE UPDATE ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_followers_updated_at();

CREATE TRIGGER update_follow_requests_updated_at
  BEFORE UPDATE ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_followers_updated_at();

-- Function to update mutual follow status
CREATE OR REPLACE FUNCTION update_mutual_follow_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check if reverse follow exists
    IF EXISTS(
      SELECT 1 FROM user_followers 
      WHERE follower_id = NEW.following_id 
      AND following_id = NEW.follower_id
      AND follow_status = 'active'
    ) THEN
      -- Mark both as mutual
      NEW.is_mutual = TRUE;
      
      UPDATE user_followers
      SET is_mutual = TRUE
      WHERE follower_id = NEW.following_id 
      AND following_id = NEW.follower_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Unmark reverse relationship as mutual
    UPDATE user_followers
    SET is_mutual = FALSE
    WHERE follower_id = OLD.following_id 
    AND following_id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mutual_follow_status_trigger
  AFTER INSERT OR DELETE ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_mutual_follow_status();

-- Function to sync follower counts in profiles table
CREATE OR REPLACE FUNCTION sync_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.follow_status = 'active' THEN
    -- Increment following_count for follower
    UPDATE profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;
    
    -- Increment follower_count for following
    UPDATE profiles
    SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' AND OLD.follow_status = 'active' THEN
    -- Decrement following_count for follower
    UPDATE profiles
    SET following_count = GREATEST(COALESCE(following_count, 1) - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement follower_count for following
    UPDATE profiles
    SET follower_count = GREATEST(COALESCE(follower_count, 1) - 1, 0)
    WHERE id = OLD.following_id;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.follow_status != NEW.follow_status THEN
    -- Handle status changes (active <-> blocked/muted)
    IF OLD.follow_status = 'active' AND NEW.follow_status != 'active' THEN
      -- Decrement counts
      UPDATE profiles
      SET following_count = GREATEST(COALESCE(following_count, 1) - 1, 0)
      WHERE id = NEW.follower_id;
      
      UPDATE profiles
      SET follower_count = GREATEST(COALESCE(follower_count, 1) - 1, 0)
      WHERE id = NEW.following_id;
      
    ELSIF OLD.follow_status != 'active' AND NEW.follow_status = 'active' THEN
      -- Increment counts
      UPDATE profiles
      SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
      
      UPDATE profiles
      SET follower_count = COALESCE(follower_count, 0) + 1
      WHERE id = NEW.following_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_follower_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION sync_follower_counts();

-- ==================================================================
-- ADD FOLLOWER COUNTS TO PROFILES TABLE
-- ==================================================================

-- Add columns if they don't exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count 
  ON profiles(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_following_count 
  ON profiles(following_count DESC);

-- ==================================================================
-- ROW LEVEL SECURITY POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- User followers policies
CREATE POLICY "Users can view their own follows"
  ON user_followers FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can view public follow relationships"
  ON user_followers FOR SELECT
  USING (follow_status = 'active');

CREATE POLICY "Users can follow others"
  ON user_followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON user_followers FOR DELETE
  USING (follower_id = auth.uid());

CREATE POLICY "Users can update their follow settings"
  ON user_followers FOR UPDATE
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- Follow requests policies
CREATE POLICY "Users can view their own follow requests"
  ON follow_requests FOR SELECT
  USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create follow requests"
  ON follow_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update requests they received"
  ON follow_requests FOR UPDATE
  USING (target_id = auth.uid())
  WITH CHECK (target_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
  ON follow_requests FOR DELETE
  USING (requester_id = auth.uid());

-- Blocked users policies
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- ==================================================================
-- UTILITY FUNCTIONS
-- ==================================================================

-- Check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_followers
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
    AND follow_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if users are mutual followers
CREATE OR REPLACE FUNCTION is_mutual_follow(
  p_user_a_id UUID,
  p_user_b_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_followers
    WHERE follower_id = p_user_a_id
    AND following_id = p_user_b_id
    AND is_mutual = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_blocked(
  p_blocker_id UUID,
  p_blocked_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM blocked_users
    WHERE blocker_id = p_blocker_id
    AND blocked_id = p_blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Follow a user
CREATE OR REPLACE FUNCTION follow_user(
  p_following_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_existing_follow UUID;
  v_is_mutual BOOLEAN := FALSE;
BEGIN
  -- Check if already following
  SELECT id INTO v_existing_follow
  FROM user_followers
  WHERE follower_id = auth.uid()
  AND following_id = p_following_id;
  
  IF v_existing_follow IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Already following this user',
      'is_mutual', FALSE
    );
  END IF;
  
  -- Check if target follows you (for mutual detection)
  v_is_mutual := EXISTS(
    SELECT 1 FROM user_followers
    WHERE follower_id = p_following_id
    AND following_id = auth.uid()
    AND follow_status = 'active'
  );
  
  -- Create follow relationship
  INSERT INTO user_followers (follower_id, following_id, is_mutual)
  VALUES (auth.uid(), p_following_id, v_is_mutual);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Successfully followed user',
    'is_mutual', v_is_mutual
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unfollow a user
CREATE OR REPLACE FUNCTION unfollow_user(
  p_following_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_followers
  WHERE follower_id = auth.uid()
  AND following_id = p_following_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Successfully unfollowed user'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'You were not following this user'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get followers list
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url JSONB,
  bio TEXT,
  is_verified BOOLEAN,
  follower_count INTEGER,
  is_following_back BOOLEAN,
  is_mutual BOOLEAN,
  followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.follower_count,
    EXISTS(
      SELECT 1 FROM user_followers uf2
      WHERE uf2.follower_id = p_user_id
      AND uf2.following_id = p.id
      AND uf2.follow_status = 'active'
    ) as is_following_back,
    uf.is_mutual,
    uf.created_at
  FROM user_followers uf
  JOIN profiles p ON uf.follower_id = p.id
  WHERE uf.following_id = p_user_id
  AND uf.follow_status = 'active'
  AND p.is_active = TRUE
  ORDER BY uf.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get following list
CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url JSONB,
  bio TEXT,
  is_verified BOOLEAN,
  follower_count INTEGER,
  is_mutual BOOLEAN,
  followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.follower_count,
    uf.is_mutual,
    uf.created_at
  FROM user_followers uf
  JOIN profiles p ON uf.following_id = p.id
  WHERE uf.follower_id = p_user_id
  AND uf.follow_status = 'active'
  AND p.is_active = TRUE
  ORDER BY uf.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get follow suggestions for a user

-- Get follow suggestions for a user
CREATE OR REPLACE FUNCTION get_follow_suggestions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_profile JSONB,
  reason TEXT,
  connection_count INTEGER,
  similarity_score NUMERIC
) AS $$
BEGIN
  -- Return users not already followed, not blocked, with suggestions
  RETURN QUERY
  WITH user_connections AS (
    -- Get users that current user follows
    SELECT uf.following_id as connected_user_id
    FROM user_followers uf
    WHERE uf.follower_id = p_user_id
    AND uf.follow_status = 'active'
  ),
  blocked_users AS (
    -- Get users that are blocked (both directions)
    SELECT bu.blocked_id as user_id FROM blocked_users bu WHERE bu.blocker_id = p_user_id
    UNION
    SELECT bu.blocker_id as user_id FROM blocked_users bu WHERE bu.blocked_id = p_user_id
  ),
  mutual_connections AS (
    -- Find users with mutual connections
    SELECT 
      p.id as suggested_user_id,
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_verified', p.is_verified,
        'is_online', p.is_online,
        'follower_count', p.follower_count,
        'following_count', p.following_count,
        'created_at', p.created_at
      ) as user_profile,
      'mutual_connections' as suggestion_reason,
      COUNT(DISTINCT uf2.follower_id)::INTEGER as mutual_count,
      0::NUMERIC as score
    FROM profiles p
    JOIN user_followers uf1 ON uf1.following_id = p.id  -- Users who follow this profile
    JOIN user_connections uc ON uc.connected_user_id = uf1.follower_id  -- Who current user also follows
    LEFT JOIN user_followers uf2 ON uf2.following_id = p.id AND uf2.follower_id IN (SELECT connected_user_id FROM user_connections)
    WHERE p.id != p_user_id  -- Not self
    AND p.id NOT IN (SELECT connected_user_id FROM user_connections)  -- Not already following
    AND p.id NOT IN (SELECT user_id FROM blocked_users)  -- Not blocked
    AND p.is_active = TRUE
    GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.role, p.is_verified, p.is_online, p.follower_count, p.following_count, p.created_at
    HAVING COUNT(DISTINCT uf2.follower_id) > 0
  ),
  same_role_users AS (
    -- Find users with same role
    SELECT 
      p.id as suggested_user_id,
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_verified', p.is_verified,
        'is_online', p.is_online,
        'follower_count', p.follower_count,
        'following_count', p.following_count,
        'created_at', p.created_at
      ) as user_profile,
      'same_role' as suggestion_reason,
      0::INTEGER as mutual_count,
      0::NUMERIC as score
    FROM profiles p
    WHERE p.role = (SELECT role FROM profiles WHERE id = p_user_id)
    AND p.id != p_user_id
    AND p.id NOT IN (SELECT connected_user_id FROM user_connections)
    AND p.id NOT IN (SELECT user_id FROM blocked_users)
    AND p.is_active = TRUE
    AND p.follower_count BETWEEN 5 AND 1000  -- Users with reasonable follower count
  ),
  popular_users AS (
    -- Find popular verified users
    SELECT 
      p.id as suggested_user_id,
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_verified', p.is_verified,
        'is_online', p.is_online,
        'follower_count', p.follower_count,
        'following_count', p.following_count,
        'created_at', p.created_at
      ) as user_profile,
      'popular' as suggestion_reason,
      0::INTEGER as mutual_count,
      0::NUMERIC as score
    FROM profiles p
    WHERE p.is_verified = TRUE
    AND p.follower_count > 100
    AND p.id != p_user_id
    AND p.id NOT IN (SELECT connected_user_id FROM user_connections)
    AND p.id NOT IN (SELECT user_id FROM blocked_users)
    AND p.is_active = TRUE
  )
  
  -- Combine all suggestions with priority
  SELECT user_profile, suggestion_reason, mutual_count, score
  FROM (
    SELECT *, 1 as priority FROM mutual_connections
    UNION ALL
    SELECT *, 2 as priority FROM same_role_users
    UNION ALL  
    SELECT *, 3 as priority FROM popular_users
  ) combined_suggestions
  ORDER BY priority, mutual_count DESC, score DESC, random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_following TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_mutual_follow TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_blocked TO authenticated, anon;
GRANT EXECUTE ON FUNCTION follow_user TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_followers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_following TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_follow_suggestions TO authenticated;

-- Add comments
COMMENT ON TABLE user_followers IS 'Social graph for follower/following relationships with mutual follow detection';
COMMENT ON TABLE follow_requests IS 'Pending follow requests for private accounts';
COMMENT ON TABLE blocked_users IS 'User blocking relationships';
COMMENT ON FUNCTION follow_user IS 'Follow a user with automatic mutual follow detection';
COMMENT ON FUNCTION get_followers IS 'Get list of users following the specified user';
COMMENT ON FUNCTION get_following IS 'Get list of users that the specified user is following';
COMMENT ON FUNCTION get_follow_suggestions IS 'Get personalized follow suggestions based on mutual connections, role, and popularity';



-- ==================================================================
-- AUTO-FOLLOW TRIGGER FUNCTION
-- When user B accepts user A's follow request, B automatically follows A back
-- ==================================================================

CREATE OR REPLACE FUNCTION auto_follow_on_request_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_reverse_follow_exists BOOLEAN;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted') THEN
    
    -- Check if the target user already follows the requester
    SELECT EXISTS(
      SELECT 1 FROM user_followers
      WHERE follower_id = NEW.target_id
      AND following_id = NEW.requester_id
      AND follow_status = 'active'
    ) INTO v_reverse_follow_exists;
    
    -- If not already following, create the follow relationship
    IF NOT v_reverse_follow_exists THEN
      -- Target user (B) follows requester (A)
      INSERT INTO user_followers (
        follower_id,
        following_id,
        follow_status,
        notification_enabled
      ) VALUES (
        NEW.target_id,      -- User B (who accepted)
        NEW.requester_id,   -- User A (who requested)
        'active',
        TRUE
      );
      
      RAISE NOTICE 'Auto-follow created: User % now follows User %', NEW.target_id, NEW.requester_id;
    END IF;
    
    -- Create the original follow relationship (A follows B)
    -- Check if requester already follows target
    IF NOT EXISTS(
      SELECT 1 FROM user_followers
      WHERE follower_id = NEW.requester_id
      AND following_id = NEW.target_id
      AND follow_status = 'active'
    ) THEN
      INSERT INTO user_followers (
        follower_id,
        following_id,
        follow_status,
        notification_enabled
      ) VALUES (
        NEW.requester_id,   -- User A (who requested)
        NEW.target_id,      -- User B (who accepted)
        'active',
        TRUE
      );
      
      RAISE NOTICE 'Original follow created: User % now follows User %', NEW.requester_id, NEW.target_id;
    END IF;
    
    -- Update the responded_at timestamp
    NEW.responded_at = NOW();
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_auto_follow_on_accept
  BEFORE UPDATE ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_follow_on_request_accept();

COMMENT ON FUNCTION auto_follow_on_request_accept IS 'Automatically creates mutual follow relationship when a follow request is accepted';
