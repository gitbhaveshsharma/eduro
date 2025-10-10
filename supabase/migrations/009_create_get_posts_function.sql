-- =====================================================================
-- COMPREHENSIVE GET_POSTS RPC FUNCTION
-- Enterprise-grade feed algorithm with multiple ranking strategies
-- =====================================================================

CREATE OR REPLACE FUNCTION get_posts(
  -- User context
  p_user_id UUID DEFAULT auth.uid(),
  
  -- Pagination
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Feed algorithm selection
  p_feed_type TEXT DEFAULT 'smart',
  
  -- Filters
  p_post_types post_type[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_author_id UUID DEFAULT NULL,
  p_privacy post_privacy DEFAULT 'PUBLIC',
  
  -- Search and discovery
  p_search_query TEXT DEFAULT NULL,
  p_location_radius_km DECIMAL DEFAULT NULL,
  p_user_coordinates geometry DEFAULT NULL,
  
  -- Content preferences
  p_exclude_seen BOOLEAN DEFAULT FALSE,
  p_include_sensitive BOOLEAN DEFAULT FALSE,
  p_min_engagement_score DECIMAL DEFAULT NULL,
  
  -- Time filters
  p_posted_after TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_posted_before TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_time_window_hours INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_username TEXT,
  author_full_name TEXT,
  author_avatar_url JSONB,
  author_reputation_score INTEGER,
  author_is_verified BOOLEAN,
  title TEXT,
  content TEXT,
  content_preview TEXT,
  post_type post_type,
  privacy post_privacy,
  status post_status,
  media_urls TEXT[],
  media_types media_type[],
  external_link TEXT,
  external_link_preview JSONB,
  location TEXT,
  coordinates geometry,
  category TEXT,
  tags TEXT[],
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  view_count INTEGER,
  engagement_score DECIMAL,
  user_has_liked BOOLEAN,
  user_has_saved BOOLEAN,
  user_has_shared BOOLEAN,
  user_has_viewed BOOLEAN,
  user_reaction_id INTEGER,
  is_pinned BOOLEAN,
  is_featured BOOLEAN,
  is_sensitive BOOLEAN,
  content_warning TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL,
  viral_velocity DECIMAL,
  freshness_score DECIMAL,
  author_affinity_score DECIMAL,
  final_rank_score DECIMAL
) AS $$
DECLARE
  v_time_threshold TIMESTAMP WITH TIME ZONE;
  v_following_ids UUID[];
  v_user_interests TEXT[];
BEGIN
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 100';
  END IF;
  
  IF p_time_window_hours IS NOT NULL THEN
    v_time_threshold := NOW() - (p_time_window_hours || ' hours')::INTERVAL;
  ELSE
    v_time_threshold := p_posted_after;
  END IF;
  
  IF p_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(following_id) INTO v_following_ids
    FROM user_followers
    WHERE follower_id = p_user_id;
    
    SELECT subjects_of_interest INTO v_user_interests
    FROM profiles
    WHERE profiles.id = p_user_id;
  END IF;
  
  RETURN QUERY
  WITH 
  filtered_posts AS (
    SELECT 
      p.id,
      p.author_id,
      p.title,
      p.content,
      p.content_preview,
      p.post_type,
      p.privacy,
      p.status,
      p.media_urls,
      p.media_types,
      p.external_link,
      p.external_link_preview,
      p.location,
      p.coordinates,
      p.category,
      p.tags,
      p.like_count,
      p.comment_count,
      p.share_count,
      p.view_count,
      p.engagement_score,
      p.is_pinned,
      p.is_featured,
      p.is_sensitive,
      p.content_warning,
      p.created_at,
      p.published_at,
      p.last_activity_at,
      p.search_vector,
      p.expires_at,
      pr.username as author_username,
      pr.full_name as author_full_name,
      pr.avatar_url as author_avatar_url,
      pr.reputation_score as author_reputation_score,
      pr.is_verified as author_is_verified
    FROM posts p
    INNER JOIN profiles pr ON p.author_id = pr.id
    WHERE 
      p.status = 'PUBLISHED'
      AND pr.is_active = TRUE
      AND (p.privacy = p_privacy OR p.privacy = 'PUBLIC')
      AND (p.expires_at IS NULL OR p.expires_at > NOW())
      AND (p_post_types IS NULL OR p.post_type = ANY(p_post_types))
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_author_id IS NULL OR p.author_id = p_author_id)
      AND (p_tags IS NULL OR p.tags && p_tags)
      AND (v_time_threshold IS NULL OR p.created_at >= v_time_threshold)
      AND (p_posted_before IS NULL OR p.created_at <= p_posted_before)
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND (p_include_sensitive = TRUE OR p.is_sensitive = FALSE)
      AND (p_min_engagement_score IS NULL OR p.engagement_score >= p_min_engagement_score)
      AND (
        p_search_query IS NULL OR 
        p.search_vector @@ plainto_tsquery('english', p_search_query)
      )
      AND (
        p_location_radius_km IS NULL OR 
        p_user_coordinates IS NULL OR
        p.coordinates IS NULL OR
        ST_DWithin(
          p.coordinates::geography, 
          p_user_coordinates::geography, 
          p_location_radius_km * 1000
        )
      )
  ),
  
  user_interactions AS (
    SELECT 
      fp.id,
      fp.author_id,
      fp.title,
      fp.content,
      fp.content_preview,
      fp.post_type,
      fp.privacy,
      fp.status,
      fp.media_urls,
      fp.media_types,
      fp.external_link,
      fp.external_link_preview,
      fp.location,
      fp.coordinates,
      fp.category,
      fp.tags,
      fp.like_count,
      fp.comment_count,
      fp.share_count,
      fp.view_count,
      fp.engagement_score,
      fp.is_pinned,
      fp.is_featured,
      fp.is_sensitive,
      fp.content_warning,
      fp.created_at,
      fp.published_at,
      fp.last_activity_at,
      fp.search_vector,
      fp.author_username,
      fp.author_full_name,
      fp.author_avatar_url,
      fp.author_reputation_score,
      fp.author_is_verified,
      EXISTS(
        SELECT 1 FROM post_reactions pr2
        WHERE pr2.target_type = 'POST'
        AND pr2.target_id = fp.id
        AND pr2.user_id = p_user_id
      ) as user_has_liked,
      (
        SELECT pr2.reaction_id FROM post_reactions pr2
        WHERE pr2.target_type = 'POST'
        AND pr2.target_id = fp.id
        AND pr2.user_id = p_user_id
        LIMIT 1
      ) as user_reaction_id,
      EXISTS(
        SELECT 1 FROM saved_posts sp
        WHERE sp.post_id = fp.id
        AND sp.user_id = p_user_id
      ) as user_has_saved,
      EXISTS(
        SELECT 1 FROM post_shares ps
        WHERE ps.original_post_id = fp.id
        AND ps.user_id = p_user_id
      ) as user_has_shared,
      EXISTS(
        SELECT 1 FROM post_views pv
        WHERE pv.post_id = fp.id
        AND pv.user_id = p_user_id
        AND (NOT p_exclude_seen OR pv.view_date != CURRENT_DATE)
      ) as user_has_viewed
    FROM filtered_posts fp
    WHERE (NOT p_exclude_seen OR NOT EXISTS(
      SELECT 1 FROM post_views pv
      WHERE pv.post_id = fp.id 
      AND pv.user_id = p_user_id
      AND pv.view_date = CURRENT_DATE
    ))
  ),
  
  scored_posts AS (
    SELECT 
      ui.id,
      ui.author_id,
      ui.title,
      ui.content,
      ui.content_preview,
      ui.post_type,
      ui.privacy,
      ui.status,
      ui.media_urls,
      ui.media_types,
      ui.external_link,
      ui.external_link_preview,
      ui.location,
      ui.coordinates,
      ui.category,
      ui.tags,
      ui.like_count,
      ui.comment_count,
      ui.share_count,
      ui.view_count,
      ui.engagement_score,
      ui.is_pinned,
      ui.is_featured,
      ui.is_sensitive,
      ui.content_warning,
      ui.created_at,
      ui.published_at,
      ui.last_activity_at,
      ui.author_username,
      ui.author_full_name,
      ui.author_avatar_url,
      ui.author_reputation_score,
      ui.author_is_verified,
      ui.user_has_liked,
      ui.user_reaction_id,
      ui.user_has_saved,
      ui.user_has_shared,
      ui.user_has_viewed,
      (100 * EXP(-0.693 * EXTRACT(EPOCH FROM (NOW() - ui.created_at)) / (24 * 3600))) as freshness_score,
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - ui.created_at)) > 0 THEN
          (
            (ui.like_count * 1.0 + ui.comment_count * 3.0 + ui.share_count * 5.0) / 
            (EXTRACT(EPOCH FROM (NOW() - ui.created_at)) / 3600)
          )
        ELSE 0
      END as viral_velocity,
      CASE
        WHEN ui.author_id = p_user_id THEN 100
        WHEN v_following_ids IS NOT NULL AND ui.author_id = ANY(v_following_ids) THEN 80
        WHEN ui.author_is_verified THEN 60
        WHEN ui.author_reputation_score > 500 THEN 50
        ELSE 30
      END as author_affinity_score,
      CASE
        WHEN v_user_interests IS NOT NULL AND ui.tags IS NOT NULL THEN
          LEAST(100, (
            (SELECT COUNT(*) FROM UNNEST(v_user_interests) AS interest
             WHERE interest = ANY(ui.tags)) * 25
          ))
        WHEN p_search_query IS NOT NULL THEN
          ts_rank(ui.search_vector, plainto_tsquery('english', p_search_query)) * 100
        ELSE 50
      END as content_relevance_score,
      LEAST(100, (
        (ui.like_count * 0.5) +
        (ui.comment_count * 2.0) +
        (ui.share_count * 3.0) +
        (ui.view_count * 0.05) +
        (CASE WHEN ui.is_featured THEN 20 ELSE 0 END) +
        (CASE WHEN ui.is_pinned THEN 15 ELSE 0 END)
      )) as engagement_quality_score
    FROM user_interactions ui
  ),
  
  ranked_posts AS (
    SELECT 
      sp.id,
      sp.author_id,
      sp.title,
      sp.content,
      sp.content_preview,
      sp.post_type,
      sp.privacy,
      sp.status,
      sp.media_urls,
      sp.media_types,
      sp.external_link,
      sp.external_link_preview,
      sp.location,
      sp.coordinates,
      sp.category,
      sp.tags,
      sp.like_count,
      sp.comment_count,
      sp.share_count,
      sp.view_count,
      sp.engagement_score,
      sp.is_pinned,
      sp.is_featured,
      sp.is_sensitive,
      sp.content_warning,
      sp.created_at,
      sp.published_at,
      sp.last_activity_at,
      sp.author_username,
      sp.author_full_name,
      sp.author_avatar_url,
      sp.author_reputation_score,
      sp.author_is_verified,
      sp.user_has_liked,
      sp.user_reaction_id,
      sp.user_has_saved,
      sp.user_has_shared,
      sp.user_has_viewed,
      sp.freshness_score,
      sp.viral_velocity,
      sp.author_affinity_score,
      sp.content_relevance_score,
      CASE WHEN p_feed_type = 'smart' THEN
        (
          (sp.freshness_score * 0.25) +
          (sp.viral_velocity * 0.20) +
          (sp.author_affinity_score * 0.20) +
          (sp.content_relevance_score * 0.20) +
          (sp.engagement_quality_score * 0.15)
        )
      WHEN p_feed_type = 'following' THEN
        (sp.author_affinity_score * 0.6) + (sp.freshness_score * 0.4)
      WHEN p_feed_type = 'trending' THEN
        (sp.viral_velocity * 0.5) + (sp.engagement_quality_score * 0.3) + (sp.freshness_score * 0.2)
      WHEN p_feed_type = 'recent' THEN
        sp.freshness_score
      WHEN p_feed_type = 'popular' THEN
        sp.engagement_quality_score
      WHEN p_feed_type = 'personalized' THEN
        (
          (sp.content_relevance_score * 0.35) +
          (sp.author_affinity_score * 0.25) +
          (sp.engagement_quality_score * 0.20) +
          (sp.freshness_score * 0.15) +
          (sp.viral_velocity * 0.05)
        )
      ELSE 
        (
          (sp.freshness_score * 0.25) +
          (sp.viral_velocity * 0.20) +
          (sp.author_affinity_score * 0.20) +
          (sp.content_relevance_score * 0.20) +
          (sp.engagement_quality_score * 0.15)
        )
      END as final_rank_score
    FROM scored_posts sp
  )
  
  SELECT 
    rp.id,
    rp.author_id,
    rp.author_username,
    rp.author_full_name,
    rp.author_avatar_url,
    rp.author_reputation_score,
    rp.author_is_verified,
    rp.title,
    rp.content,
    rp.content_preview,
    rp.post_type,
    rp.privacy,
    rp.status,
    rp.media_urls,
    rp.media_types,
    rp.external_link,
    rp.external_link_preview,
    rp.location,
    rp.coordinates,
    rp.category,
    rp.tags,
    rp.like_count,
    rp.comment_count,
    rp.share_count,
    rp.view_count,
    rp.engagement_score,
    rp.user_has_liked,
    rp.user_has_saved,
    rp.user_has_shared,
    rp.user_has_viewed,
    rp.user_reaction_id,
    rp.is_pinned,
    rp.is_featured,
    rp.is_sensitive,
    rp.content_warning,
    rp.created_at,
    rp.published_at,
    rp.last_activity_at,
    ROUND(rp.content_relevance_score::numeric, 2) as relevance_score,
    ROUND(rp.viral_velocity::numeric, 2) as viral_velocity,
    ROUND(rp.freshness_score::numeric, 2) as freshness_score,
    ROUND(rp.author_affinity_score::numeric, 2) as author_affinity_score,
    ROUND(rp.final_rank_score::numeric, 2) as final_rank_score
  FROM ranked_posts rp
  ORDER BY 
    rp.is_pinned DESC,
    rp.final_rank_score DESC,
    rp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_posts TO authenticated, anon;


GRANT EXECUTE ON FUNCTION get_posts TO authenticated, anon;

COMMENT ON FUNCTION get_posts IS 'Enterprise-grade feed retrieval with multiple ranking algorithms, personalization, and comprehensive filtering. Supports smart, following, trending, recent, popular, and personalized feeds with time decay, viral velocity, and user affinity scoring.';

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_following_ids(p_user_id UUID)
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT following_id 
    FROM user_followers 
    WHERE follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION batch_record_post_views(
  p_post_ids UUID[],
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  WITH inserted AS (
    INSERT INTO post_views (post_id, user_id, view_date)
    SELECT 
      UNNEST(p_post_ids),
      p_user_id,
      CURRENT_DATE
    ON CONFLICT (post_id, user_id, view_date) DO NOTHING
    RETURNING *
  )
  SELECT COUNT(*) INTO v_inserted_count FROM inserted;
  
  UPDATE posts
  SET view_count = view_count + 1,
      last_activity_at = NOW()
  WHERE id = ANY(p_post_ids)
  AND id IN (
    SELECT post_id FROM post_views 
    WHERE user_id = p_user_id 
    AND view_date = CURRENT_DATE
    AND post_id = ANY(p_post_ids)
  );
  
  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_feed_analytics(
  p_user_id UUID DEFAULT auth.uid(),
  p_time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_posts_available INTEGER,
  total_posts_viewed INTEGER,
  total_engagement_actions INTEGER,
  avg_engagement_score DECIMAL,
  top_categories TEXT[],
  engagement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id)::INTEGER as total_posts_available,
    COUNT(DISTINCT pv.post_id)::INTEGER as total_posts_viewed,
    (
      COUNT(DISTINCT pr.id) + 
      COUNT(DISTINCT c.id) + 
      COUNT(DISTINCT ps.id)
    )::INTEGER as total_engagement_actions,
    AVG(p.engagement_score) as avg_engagement_score,
    ARRAY_AGG(DISTINCT p.category ORDER BY COUNT(*) DESC)
      FILTER (WHERE p.category IS NOT NULL) as top_categories,
    CASE 
      WHEN COUNT(DISTINCT pv.post_id) > 0 THEN
        (COUNT(DISTINCT pr.id) + COUNT(DISTINCT c.id))::DECIMAL / 
        COUNT(DISTINCT pv.post_id) * 100
      ELSE 0
    END as engagement_rate
  FROM posts p
  LEFT JOIN post_views pv ON p.id = pv.post_id AND pv.user_id = p_user_id
  LEFT JOIN post_reactions pr ON p.id = pr.target_id AND pr.user_id = p_user_id
  LEFT JOIN comments c ON p.id = c.post_id AND c.author_id = p_user_id
  LEFT JOIN post_shares ps ON p.id = ps.original_post_id AND ps.user_id = p_user_id
  WHERE p.created_at >= NOW() - (p_time_range_hours || ' hours')::INTERVAL
  AND p.status = 'PUBLISHED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;



-- Additional composite indexes for feed queries
CREATE INDEX CONCURRENTLY idx_posts_feed_smart 
ON posts(status, privacy, created_at DESC, engagement_score DESC)
WHERE status = 'PUBLISHED';

CREATE INDEX CONCURRENTLY idx_posts_feed_trending
ON posts(status, engagement_score DESC, last_activity_at DESC)
WHERE status = 'PUBLISHED' 
AND created_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY idx_user_followers_follower
ON user_followers(follower_id, following_id);

CREATE INDEX CONCURRENTLY idx_post_views_user_date
ON post_views(user_id, view_date, post_id);

-- Partial index for recent hot posts
CREATE INDEX CONCURRENTLY idx_posts_hot_recent
ON posts(engagement_score DESC, created_at DESC)
WHERE status = 'PUBLISHED'
AND created_at > NOW() - INTERVAL '48 hours'
AND engagement_score > 5.0;
