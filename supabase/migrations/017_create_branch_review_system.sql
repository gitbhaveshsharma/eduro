-- ============================================================
-- ENUMS for Review System
-- ============================================================

CREATE TYPE review_user_type AS ENUM ('STUDENT', 'TEACHER', 'COACHING_CENTER', 'ANONYMOUS');
CREATE TYPE review_status AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REMOVED');
CREATE TYPE rating_scale AS ENUM ('1', '2', '3', '4', '5');

-- ============================================================
-- REVIEWS TABLE
-- ============================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What is being reviewed (Branch level)
    coaching_branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
    coaching_center_id UUID NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
    
    -- Who is reviewing (with anonymity support)
    reviewer_id UUID REFERENCES auth.users(id), -- NULL for anonymous
    reviewer_user_type review_user_type NOT NULL,
    
    -- Review content (immutable once submitted)
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
    comment TEXT CHECK (char_length(comment) BETWEEN 10 AND 2000),
    
    -- Ratings (1-5 scale)
    overall_rating rating_scale NOT NULL,
    teaching_quality rating_scale,
    infrastructure rating_scale,
    staff_support rating_scale,
    value_for_money rating_scale,
    
    -- User snapshot (for data preservation)
    reviewer_name_snapshot TEXT, -- Store name at time of review
    reviewer_role_snapshot TEXT, -- e.g., 'Grade 10 Student', 'Parent', etc.
    
    -- Review metadata
    status review_status DEFAULT 'APPROVED', -- Auto-approve for performance
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified_reviewer BOOLEAN DEFAULT FALSE, -- Verified student/teacher
    
    -- Moderation flags (using existing reports system)
    report_count INTEGER DEFAULT 0,
    
    -- Engagement metrics (for sorting)
    helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_date DATE DEFAULT CURRENT_DATE, -- When the experience happened
    
    -- Constraints
    CONSTRAINT valid_rating_range CHECK (
        overall_rating IS NOT NULL AND
        teaching_quality IS NULL OR teaching_quality IN ('1','2','3','4','5') AND
        infrastructure IS NULL OR infrastructure IN ('1','2','3','4','5') AND
        staff_support IS NULL OR staff_support IN ('1','2','3','4','5') AND
        value_for_money IS NULL OR value_for_money IN ('1','2','3','4','5')
    ),
    CONSTRAINT anonymous_requires_snapshot CHECK (
        (is_anonymous = TRUE AND reviewer_name_snapshot IS NOT NULL) OR
        (is_anonymous = FALSE AND reviewer_id IS NOT NULL)
    ),
    -- NEW: Additional constraints for data quality
    CONSTRAINT chk_review_date_not_future CHECK (reviewed_date <= CURRENT_DATE),
    CONSTRAINT chk_verified_requires_id CHECK (is_verified_reviewer = FALSE OR reviewer_id IS NOT NULL),
    CONSTRAINT chk_comment_required_for_low_ratings CHECK (
        (overall_rating IN ('1', '2') AND comment IS NOT NULL) OR 
        overall_rating IN ('3', '4', '5')
    )
);

-- ============================================================
-- REVIEW MEDIA/ATTACHMENTS TABLE
-- ============================================================

CREATE TABLE review_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- NEW: Additional constraints
    CONSTRAINT chk_valid_media_url CHECK (media_url ~ '^https?://.+\..+')
);

-- ============================================================
-- REVIEW HELPFUL VOTES TABLE
-- ============================================================

CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate votes
    UNIQUE(review_id, user_id)
);

-- ============================================================
-- COACHING CENTER RESPONSES TABLE
-- ============================================================

-- Create the review_responses table without the subquery constraint
CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE UNIQUE,
    responder_id UUID NOT NULL REFERENCES auth.users(id),
    response_text TEXT NOT NULL CHECK (char_length(response_text) BETWEEN 10 AND 1000),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION validate_response_time()
RETURNS TRIGGER AS $$
DECLARE
    review_created_time TIMESTAMPTZ;
    max_response_time TIMESTAMPTZ;
BEGIN
    -- Get the creation time of the referenced review
    SELECT created_at INTO review_created_time 
    FROM reviews 
    WHERE id = NEW.review_id;
    
    -- Check if the review exists
    IF review_created_time IS NULL THEN
        RAISE EXCEPTION 'Cannot create response: Referenced review (ID: %) does not exist', NEW.review_id;
    END IF;
    
    -- Calculate the maximum allowed response time (review creation + 180 days)
    max_response_time := review_created_time + INTERVAL '180 days';
    
    -- Validate that the response is within the time limit
    IF NEW.created_at > max_response_time THEN
        RAISE EXCEPTION 
            'Response time limit exceeded. Review was created on %, responses must be submitted by %. Current response time: %',
            review_created_time,
            max_response_time,
            NEW.created_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERFORMANCE INDEXES (OPTIMIZED FOR HIGH TRAFFIC)
-- ============================================================

-- Primary query indexes
CREATE INDEX idx_reviews_branch_id ON reviews(coaching_branch_id);
CREATE INDEX idx_reviews_center_id ON reviews(coaching_center_id);
CREATE INDEX idx_reviews_status ON reviews(status) WHERE status = 'APPROVED';
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

-- NEW: Optimized composite indexes for high-performance queries
CREATE INDEX idx_reviews_branch_approved ON reviews(coaching_branch_id, status, created_at DESC) WHERE status = 'APPROVED';
CREATE INDEX idx_reviews_center_approved ON reviews(coaching_center_id, status, created_at DESC) WHERE status = 'APPROVED';
CREATE INDEX idx_reviews_rating_approved ON reviews(overall_rating, status, created_at DESC) WHERE status = 'APPROVED';

-- NEW: Critical performance indexes for search and aggregation
CREATE INDEX idx_reviews_approved_created_rating ON reviews(status, created_at DESC, overall_rating) WHERE status = 'APPROVED';
CREATE INDEX idx_reviews_branch_location ON reviews(coaching_branch_id, status, overall_rating, created_at DESC) WHERE status = 'APPROVED';
CREATE INDEX idx_reviews_rating_breakdown ON reviews(coaching_branch_id, overall_rating, status) WHERE status = 'APPROVED';

-- Index for helpful sorting
CREATE INDEX idx_reviews_helpful_count ON reviews(helpful_count DESC) WHERE status = 'APPROVED';

-- NEW: Index for date-based queries
CREATE INDEX idx_reviews_reviewed_date ON reviews(reviewed_date DESC) WHERE status = 'APPROVED';

-- Review media indexes
CREATE INDEX idx_review_media_review_id ON review_media(review_id);
CREATE INDEX idx_review_media_created_at ON review_media(created_at DESC);

-- Vote indexes
CREATE INDEX idx_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_helpful_votes_user_id ON review_helpful_votes(user_id);
CREATE INDEX idx_helpful_votes_created_at ON review_helpful_votes(created_at DESC);

-- Response indexes
CREATE INDEX idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX idx_review_responses_responder_id ON review_responses(responder_id);
CREATE INDEX idx_review_responses_created_at ON review_responses(created_at DESC);

-- ============================================================
-- CACHING: MATERIALIZED VIEW FOR RATINGS
-- ============================================================

-- ============================================================
-- CACHING: MATERIALIZED VIEW FOR RATINGS (FIXED)
-- ============================================================

CREATE MATERIALIZED VIEW mv_branch_ratings AS
SELECT 
    coaching_branch_id,
    COUNT(*) as total_reviews,
    ROUND(AVG(CAST(overall_rating::text AS INTEGER)), 2) as avg_rating,
    COUNT(*) FILTER (WHERE overall_rating = '5') as rating_5,
    COUNT(*) FILTER (WHERE overall_rating = '4') as rating_4,
    COUNT(*) FILTER (WHERE overall_rating = '3') as rating_3,
    COUNT(*) FILTER (WHERE overall_rating = '2') as rating_2,
    COUNT(*) FILTER (WHERE overall_rating = '1') as rating_1,
    COUNT(*) FILTER (WHERE teaching_quality IS NOT NULL) as teaching_quality_count,
    ROUND(AVG(CAST(teaching_quality::text AS INTEGER)), 2) as avg_teaching_quality,
    ROUND(AVG(CAST(infrastructure::text AS INTEGER)), 2) as avg_infrastructure,
    ROUND(AVG(CAST(staff_support::text AS INTEGER)), 2) as avg_staff_support,
    ROUND(AVG(CAST(value_for_money::text AS INTEGER)), 2) as avg_value_for_money,
    COUNT(*) FILTER (WHERE is_verified_reviewer = TRUE) as verified_reviews_count,
    MAX(created_at) as last_review_date,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as reviews_last_30_days
FROM reviews 
WHERE status = 'APPROVED'
GROUP BY coaching_branch_id;

CREATE UNIQUE INDEX idx_mv_branch_ratings ON mv_branch_ratings(coaching_branch_id);
CREATE INDEX idx_mv_branch_avg_rating ON mv_branch_ratings(avg_rating DESC);
CREATE INDEX idx_mv_branch_total_reviews ON mv_branch_ratings(total_reviews DESC);
-- -- ============================================================
-- -- ANALYTICS TABLE FOR MONITORING
-- -- ============================================================

-- CREATE TABLE review_analytics (
--     branch_id UUID REFERENCES coaching_branches(id),
--     date DATE DEFAULT CURRENT_DATE,
--     total_reviews INTEGER DEFAULT 0,
--     average_rating NUMERIC(3,2),
--     helpful_votes INTEGER DEFAULT 0,
--     reports_count INTEGER DEFAULT 0,
--     responses_count INTEGER DEFAULT 0,
--     media_reviews_count INTEGER DEFAULT 0,
--     verified_reviews_count INTEGER DEFAULT 0,
--     PRIMARY KEY (branch_id, date)
-- );

-- CREATE INDEX idx_review_analytics_date ON review_analytics(date DESC);
-- CREATE INDEX idx_review_analytics_branch_date ON review_analytics(branch_id, date DESC);

-- ============================================================
-- TRIGGERS AND FUNCTIONS (OPTIMIZED)
-- ============================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-populate coaching_center_id from branch
CREATE OR REPLACE FUNCTION auto_populate_coaching_center_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coaching_center_id IS NULL THEN
        SELECT coaching_center_id INTO NEW.coaching_center_id
        FROM coaching_branches WHERE id = NEW.coaching_branch_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_populate_center_id
    BEFORE INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_coaching_center_id();

-- Update helpful_count automatically (OPTIMIZED)
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews 
        SET helpful_count = helpful_count + 1,
            updated_at = NOW()
        WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews 
        SET helpful_count = GREATEST(0, helpful_count - 1),
            updated_at = NOW()
        WHERE id = OLD.review_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpful_count_on_vote
    AFTER INSERT OR DELETE ON review_helpful_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_helpful_count();

-- Update report_count using existing reports table (OPTIMIZED)
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.target_type = 'REVIEW' THEN
        -- Use atomic update
        UPDATE reviews 
        SET report_count = report_count + 1,
            updated_at = NOW(),
            status = CASE 
                WHEN report_count + 1 >= 5 THEN 'FLAGGED'::review_status 
                ELSE status 
            END
        WHERE id = NEW.target_id::UUID;
        
    ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'REVIEW' THEN
        UPDATE reviews 
        SET report_count = GREATEST(0, report_count - 1),
            updated_at = NOW()
        WHERE id = OLD.target_id::UUID;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- -- NEW: Function to update analytics
-- CREATE OR REPLACE FUNCTION update_review_analytics()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Update daily analytics for the branch
--     INSERT INTO review_analytics (
--         branch_id,
--         date,
--         total_reviews,
--         average_rating,
--         helpful_votes,
--         reports_count,
--         responses_count,
--         media_reviews_count,
--         verified_reviews_count
--     )
--     SELECT 
--         r.coaching_branch_id,
--         CURRENT_DATE,
--         COUNT(*) as total_reviews,
--         ROUND(AVG(CAST(r.overall_rating AS NUMERIC)), 2) as avg_rating,
--         COALESCE(SUM(r.helpful_count), 0) as helpful_votes,
--         COALESCE(SUM(r.report_count), 0) as reports_count,
--         COUNT(rr.id) as responses_count,
--         COUNT(DISTINCT rm.review_id) as media_reviews_count,
--         COUNT(*) FILTER (WHERE r.is_verified_reviewer = TRUE) as verified_reviews_count
--     FROM reviews r
--     LEFT JOIN review_responses rr ON r.id = rr.review_id
--     LEFT JOIN review_media rm ON r.id = rm.review_id
--     WHERE r.coaching_branch_id = NEW.coaching_branch_id
--         AND r.status = 'APPROVED'
--     GROUP BY r.coaching_branch_id
--     ON CONFLICT (branch_id, date) 
--     DO UPDATE SET
--         total_reviews = EXCLUDED.total_reviews,
--         average_rating = EXCLUDED.average_rating,
--         helpful_votes = EXCLUDED.helpful_votes,
--         reports_count = EXCLUDED.reports_count,
--         responses_count = EXCLUDED.responses_count,
--         media_reviews_count = EXCLUDED.media_reviews_count,
--         verified_reviews_count = EXCLUDED.verified_reviews_count;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Trigger to update analytics on review changes
-- CREATE TRIGGER update_analytics_on_review
--     AFTER INSERT OR UPDATE OR DELETE ON reviews
--     FOR EACH ROW
--     EXECUTE FUNCTION update_review_analytics();

-- ============================================================
-- RATE LIMITING AND VALIDATION FUNCTIONS
-- ============================================================

-- NEW: Rate limiting function
CREATE OR REPLACE FUNCTION check_review_rate_limit(
    user_id UUID,
    branch_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_review_count INTEGER;
    user_role user_role;
BEGIN
    -- Check hourly limit
    SELECT COUNT(*) INTO recent_review_count
    FROM reviews 
    WHERE reviewer_id = user_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Check daily limit
    IF recent_review_count >= 3 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already reviewed this branch
    SELECT COUNT(*) INTO recent_review_count
    FROM reviews 
    WHERE reviewer_id = user_id 
    AND coaching_branch_id = branch_id;
    
    IF recent_review_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    -- Allow review if user has appropriate role
    RETURN user_role IN ('S', 'T', 'C');
END;
$$ LANGUAGE plpgsql;

-- NEW: Function to prevent self-reviews
CREATE OR REPLACE FUNCTION prevent_self_review()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM coaching_branches cb
        JOIN coaching_centers cc ON cb.coaching_center_id = cc.id
        WHERE cb.id = NEW.coaching_branch_id 
        AND (cc.owner_id = NEW.reviewer_id OR cb.manager_id = NEW.reviewer_id)
    ) THEN
        RAISE EXCEPTION 'Users cannot review their own coaching branches';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_review_trigger
    BEFORE INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_review();

-- ============================================================
-- ENHANCED SEARCH AND FILTER FUNCTION (OPTIMIZED)
-- ============================================================
-- ============================================================
-- ENHANCED SEARCH AND FILTER FUNCTION (FIXED)
-- ============================================================

-- ============================================================
-- ENHANCED SEARCH AND FILTER FUNCTION (FIXED)
-- ============================================================

CREATE OR REPLACE FUNCTION search_reviews(
    p_search_query TEXT DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL,
    p_center_id UUID DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_min_rating INTEGER DEFAULT 1,
    p_max_rating INTEGER DEFAULT 5,
    p_has_media BOOLEAN DEFAULT NULL,
    p_is_verified BOOLEAN DEFAULT NULL,
    p_days_ago INTEGER DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'recent',
    p_limit_count INTEGER DEFAULT 20,
    p_offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    review_id UUID,
    title TEXT,
    comment TEXT,
    overall_rating rating_scale,
    reviewer_name TEXT,
    is_anonymous BOOLEAN,
    is_verified_reviewer BOOLEAN,
    reviewer_role_snapshot TEXT,
    helpful_count INTEGER,
    has_media BOOLEAN,
    response_exists BOOLEAN,
    created_at TIMESTAMPTZ,
    teaching_quality rating_scale,
    infrastructure rating_scale,
    staff_support rating_scale,
    value_for_money rating_scale,
    branch_name TEXT,
    center_name TEXT,
    branch_state TEXT,
    branch_district TEXT,
    branch_city TEXT,
    branch_pin_code TEXT,
    search_rank REAL,
    total_count BIGINT
) AS $$
DECLARE
    search_tsquery TSQUERY;
    total_records BIGINT;
BEGIN
    -- Prepare full-text search query if search term provided
    IF p_search_query IS NOT NULL AND p_search_query != '' THEN
        search_tsquery := plainto_tsquery('english', p_search_query);
    END IF;
    
    -- Get total count for pagination
    SELECT COUNT(*) INTO total_records
    FROM reviews r
    LEFT JOIN coaching_branches cb ON r.coaching_branch_id = cb.id
    LEFT JOIN coaching_centers cc ON r.coaching_center_id = cc.id
    LEFT JOIN addresses addr ON cb.id = addr.branch_id AND addr.address_type = 'BRANCH'
    WHERE r.status = 'APPROVED'
        AND (p_branch_id IS NULL OR r.coaching_branch_id = p_branch_id)
        AND (p_center_id IS NULL OR r.coaching_center_id = p_center_id)
        AND (p_state IS NULL OR addr.state ILIKE '%' || p_state || '%')
        AND (p_district IS NULL OR addr.district ILIKE '%' || p_district || '%')
        AND (p_city IS NULL OR addr.city ILIKE '%' || p_city || '%')
        AND (
            CASE r.overall_rating::text
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                WHEN '4' THEN 4
                WHEN '5' THEN 5
            END
        ) BETWEEN p_min_rating AND p_max_rating
        AND (p_has_media IS NULL OR 
             (p_has_media = TRUE AND EXISTS(SELECT 1 FROM review_media rm WHERE rm.review_id = r.id)) OR
             (p_has_media = FALSE AND NOT EXISTS(SELECT 1 FROM review_media rm WHERE rm.review_id = r.id))
            )
        AND (p_is_verified IS NULL OR r.is_verified_reviewer = p_is_verified)
        AND (p_days_ago IS NULL OR r.created_at > NOW() - (p_days_ago || ' days')::INTERVAL)
        AND (search_tsquery IS NULL OR 
             (to_tsvector('english', COALESCE(r.title, '')) ||
              to_tsvector('english', COALESCE(r.comment, '')) ||
              to_tsvector('english', COALESCE(cb.name, '')) ||
              to_tsvector('english', COALESCE(cc.name, '')) ||
              to_tsvector('english', COALESCE(addr.city, '')) ||
              to_tsvector('english', COALESCE(addr.district, '')) ||
              to_tsvector('english', COALESCE(addr.state, ''))
             ) @@ search_tsquery);
    
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.comment,
        r.overall_rating,
        CASE 
            WHEN r.is_anonymous THEN r.reviewer_name_snapshot
            ELSE p.full_name
        END as reviewer_name,
        r.is_anonymous,
        r.is_verified_reviewer,
        r.reviewer_role_snapshot,
        r.helpful_count,
        EXISTS(SELECT 1 FROM review_media rm WHERE rm.review_id = r.id) as has_media,
        EXISTS(SELECT 1 FROM review_responses rr WHERE rr.review_id = r.id) as response_exists,
        r.created_at,
        r.teaching_quality,
        r.infrastructure,
        r.staff_support,
        r.value_for_money,
        cb.name as branch_name,
        cc.name as center_name,
        addr.state as branch_state,
        addr.district as branch_district,
        addr.city as branch_city,
        addr.pin_code as branch_pin_code,
        CASE 
            WHEN search_tsquery IS NOT NULL THEN
                ts_rank(
                    setweight(to_tsvector('english', COALESCE(r.title, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(r.comment, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(cb.name, '')), 'C') ||
                    setweight(to_tsvector('english', COALESCE(cc.name, '')), 'C') ||
                    setweight(to_tsvector('english', COALESCE(addr.city, '')), 'D') ||
                    setweight(to_tsvector('english', COALESCE(addr.district, '')), 'D') ||
                    setweight(to_tsvector('english', COALESCE(addr.state, '')), 'D'),
                    search_tsquery
                )
            ELSE 0
        END as search_rank,
        total_records as total_count
    FROM reviews r
    LEFT JOIN profiles p ON r.reviewer_id = p.id
    LEFT JOIN coaching_branches cb ON r.coaching_branch_id = cb.id
    LEFT JOIN coaching_centers cc ON r.coaching_center_id = cc.id
    LEFT JOIN addresses addr ON cb.id = addr.branch_id AND addr.address_type = 'BRANCH'
    WHERE r.status = 'APPROVED'
        AND (p_branch_id IS NULL OR r.coaching_branch_id = p_branch_id)
        AND (p_center_id IS NULL OR r.coaching_center_id = p_center_id)
        AND (p_state IS NULL OR addr.state ILIKE '%' || p_state || '%')
        AND (p_district IS NULL OR addr.district ILIKE '%' || p_district || '%')
        AND (p_city IS NULL OR addr.city ILIKE '%' || p_city || '%')
        AND (
            CASE r.overall_rating::text
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                WHEN '4' THEN 4
                WHEN '5' THEN 5
            END
        ) BETWEEN p_min_rating AND p_max_rating
        AND (p_has_media IS NULL OR 
             (p_has_media = TRUE AND EXISTS(SELECT 1 FROM review_media rm WHERE rm.review_id = r.id)) OR
             (p_has_media = FALSE AND NOT EXISTS(SELECT 1 FROM review_media rm WHERE rm.review_id = r.id))
            )
        AND (p_is_verified IS NULL OR r.is_verified_reviewer = p_is_verified)
        AND (p_days_ago IS NULL OR r.created_at > NOW() - (p_days_ago || ' days')::INTERVAL)
        AND (search_tsquery IS NULL OR 
             (to_tsvector('english', COALESCE(r.title, '')) ||
              to_tsvector('english', COALESCE(r.comment, '')) ||
              to_tsvector('english', COALESCE(cb.name, '')) ||
              to_tsvector('english', COALESCE(cc.name, '')) ||
              to_tsvector('english', COALESCE(addr.city, '')) ||
              to_tsvector('english', COALESCE(addr.district, '')) ||
              to_tsvector('english', COALESCE(addr.state, ''))
             ) @@ search_tsquery)
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'relevant' AND search_tsquery IS NOT NULL THEN search_rank
            WHEN p_sort_by = 'helpful' THEN r.helpful_count
            WHEN p_sort_by = 'highest' THEN -(
                CASE r.overall_rating::text
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    WHEN '4' THEN 4
                    WHEN '5' THEN 5
                END
            )
            WHEN p_sort_by = 'lowest' THEN (
                CASE r.overall_rating::text
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    WHEN '4' THEN 4
                    WHEN '5' THEN 5
                END
            )
            ELSE EXTRACT(EPOCH FROM r.created_at)
        END DESC
    LIMIT p_limit_count OFFSET p_offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FULL-TEXT SEARCH INDEXES (OPTIMIZED)
-- ============================================================

-- GIN indexes for full-text search
CREATE INDEX idx_reviews_title_comment_tsvector ON reviews 
USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(comment, '')));

CREATE INDEX idx_coaching_branches_name_tsvector ON coaching_branches 
USING GIN (to_tsvector('english', COALESCE(name, '')));

CREATE INDEX idx_coaching_centers_name_tsvector ON coaching_centers 
USING GIN (to_tsvector('english', COALESCE(name, '')));

CREATE INDEX idx_addresses_city_tsvector ON addresses 
USING GIN (to_tsvector('english', COALESCE(city, '')));

CREATE INDEX idx_addresses_district_tsvector ON addresses 
USING GIN (to_tsvector('english', COALESCE(district, '')));

CREATE INDEX idx_addresses_state_tsvector ON addresses 
USING GIN (to_tsvector('english', COALESCE(state, '')));

-- B-tree indexes for location filtering
CREATE INDEX idx_addresses_state ON addresses(state);
CREATE INDEX idx_addresses_district ON addresses(district);
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_branch_id_type ON addresses(branch_id, address_type);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES (ENHANCED)
-- ============================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Reviews: Public can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'APPROVED');

-- NEW: Coaching owners can view their branch reviews (including flagged)
CREATE POLICY "Coaching owners can view their reviews" ON reviews
    FOR SELECT USING (
        status = 'APPROVED' OR
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            JOIN coaching_centers cc ON cb.coaching_center_id = cc.id
            WHERE cb.id = coaching_branch_id 
            AND (cc.owner_id = auth.uid() OR cb.manager_id = auth.uid())
        )
    );

-- NEW: Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'A'))
    );

-- Reviews: Users can create their own reviews
CREATE POLICY "Users can create their own reviews" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id 
        AND check_review_rate_limit(auth.uid(), coaching_branch_id)
    );

-- Reviews: Users can update their own reviews (within time limit)
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() = reviewer_id 
        AND created_at > NOW() - INTERVAL '24 hours' -- 24-hour edit window
    );

-- Reviews: Users can delete their own reviews (within time limit)
CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (
        auth.uid() = reviewer_id 
        AND created_at > NOW() - INTERVAL '1 hour' -- 1-hour delete window
    );

-- Review Media: Public can view media for approved reviews
CREATE POLICY "Anyone can view approved review media" ON review_media
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND status = 'APPROVED')
    );

-- Review Media: Users can manage media for their own reviews
CREATE POLICY "Users can manage own review media" ON review_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM reviews 
            WHERE id = review_id AND reviewer_id = auth.uid()
            AND created_at > NOW() - INTERVAL '24 hours'
        )
    );

-- Helpful Votes: Users can manage their own votes
CREATE POLICY "Users can manage own helpful votes" ON review_helpful_votes
    FOR ALL USING (auth.uid() = user_id);

-- Review Responses: Public can view public responses
CREATE POLICY "Anyone can view public responses" ON review_responses
    FOR SELECT USING (is_public = true);

-- Review Responses: Coaching center staff can respond
CREATE POLICY "Coaching staff can respond to reviews" ON review_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coaching_centers cc
            JOIN coaching_branches cb ON cc.id = cb.coaching_center_id
            JOIN reviews r ON cb.id = r.coaching_branch_id
            WHERE r.id = review_id 
            AND (cc.owner_id = auth.uid() OR cc.manager_id = auth.uid() 
                 OR cb.manager_id = auth.uid())
        )
    );

-- ============================================================
-- UTILITY FUNCTIONS (ENHANCED)
-- ============================================================

-- Function to check if user can review a branch (OPTIMIZED)
CREATE OR REPLACE FUNCTION can_user_review_branch(
    user_id UUID,
    branch_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_review_count INTEGER;
    user_role user_role;
BEGIN
    -- Check if user already reviewed this branch (using index)
    SELECT COUNT(*) INTO existing_review_count
    FROM reviews 
    WHERE reviewer_id = user_id AND coaching_branch_id = branch_id;
    
    -- Get user role
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    -- Allow review if: hasn't reviewed before AND is student/teacher/coach
    RETURN existing_review_count = 0 AND user_role IN ('S', 'T', 'C');
END;
$$ LANGUAGE plpgsql;

-- Function to submit a review (ENHANCED)
CREATE OR REPLACE FUNCTION submit_review(
    p_branch_id UUID,
    p_reviewer_id UUID,
    p_reviewer_user_type review_user_type,
    p_title TEXT,
    p_comment TEXT,
    p_overall_rating rating_scale,
    p_teaching_quality rating_scale DEFAULT NULL,
    p_infrastructure rating_scale DEFAULT NULL,
    p_staff_support rating_scale DEFAULT NULL,
    p_value_for_money rating_scale DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT FALSE,
    p_reviewer_name_snapshot TEXT DEFAULT NULL,
    p_reviewer_role_snapshot TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_review_id UUID;
    user_full_name TEXT;
    user_role_text TEXT;
BEGIN
    -- Validate user can review with rate limiting
    IF NOT can_user_review_branch(p_reviewer_id, p_branch_id) THEN
        RAISE EXCEPTION 'User cannot review this branch';
    END IF;
    
    IF NOT check_review_rate_limit(p_reviewer_id, p_branch_id) THEN
        RAISE EXCEPTION 'Rate limit exceeded for reviews';
    END IF;
    
    -- Get user details for snapshot if not provided
    IF p_is_anonymous THEN
        user_full_name := p_reviewer_name_snapshot;
        user_role_text := p_reviewer_role_snapshot;
    ELSE
        SELECT full_name, role::TEXT INTO user_full_name, user_role_text
        FROM profiles WHERE id = p_reviewer_id;
        
        user_full_name := COALESCE(p_reviewer_name_snapshot, user_full_name);
        user_role_text := COALESCE(p_reviewer_role_snapshot, user_role_text);
    END IF;
    
    -- Insert review
    INSERT INTO reviews (
        coaching_branch_id,
        reviewer_id,
        reviewer_user_type,
        title,
        comment,
        overall_rating,
        teaching_quality,
        infrastructure,
        staff_support,
        value_for_money,
        is_anonymous,
        reviewer_name_snapshot,
        reviewer_role_snapshot
    ) VALUES (
        p_branch_id,
        CASE WHEN p_is_anonymous THEN NULL ELSE p_reviewer_id END,
        p_reviewer_user_type,
        p_title,
        p_comment,
        p_overall_rating,
        p_teaching_quality,
        p_infrastructure,
        p_staff_support,
        p_value_for_money,
        p_is_anonymous,
        user_full_name,
        user_role_text
    ) RETURNING id INTO new_review_id;
    
    RETURN new_review_id;
END;
$$ LANGUAGE plpgsql;

-- NEW: Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_branch_ratings()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_branch_ratings;
END;
$$ LANGUAGE plpgsql;

-- NEW: Function to get rating summary (USING MATERIALIZED VIEW)
-- NEW: Function to get rating summary (USING MATERIALIZED VIEW - FIXED)
CREATE OR REPLACE FUNCTION get_branch_rating_summary(branch_id UUID)
RETURNS JSON AS $$
DECLARE
    summary JSON;
    mv_record mv_branch_ratings%ROWTYPE;
BEGIN
    -- Try to get from materialized view first
    SELECT * INTO mv_record FROM mv_branch_ratings WHERE coaching_branch_id = branch_id;
    
    IF FOUND THEN
        SELECT json_build_object(
            'total_reviews', mv_record.total_reviews,
            'average_rating', mv_record.avg_rating,
            'rating_breakdown', json_build_object(
                '5', mv_record.rating_5,
                '4', mv_record.rating_4,
                '3', mv_record.rating_3,
                '2', mv_record.rating_2,
                '1', mv_record.rating_1
            ),
            'category_ratings', json_build_object(
                'teaching_quality', mv_record.avg_teaching_quality,
                'infrastructure', mv_record.avg_infrastructure,
                'staff_support', mv_record.avg_staff_support,
                'value_for_money', mv_record.avg_value_for_money
            ),
            'verified_reviews', mv_record.verified_reviews_count,
            'last_review_date', mv_record.last_review_date,
            'recent_activity', mv_record.reviews_last_30_days,
            'cached', true
        ) INTO summary;
    ELSE
        -- Fallback to real-time calculation (FIXED)
        SELECT json_build_object(
            'total_reviews', COUNT(*),
            'average_rating', ROUND(AVG(
                CASE overall_rating::text
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    WHEN '4' THEN 4
                    WHEN '5' THEN 5
                END
            ), 2),
            'rating_breakdown', json_build_object(
                '5', COUNT(*) FILTER (WHERE overall_rating = '5'),
                '4', COUNT(*) FILTER (WHERE overall_rating = '4'),
                '3', COUNT(*) FILTER (WHERE overall_rating = '3'),
                '2', COUNT(*) FILTER (WHERE overall_rating = '2'),
                '1', COUNT(*) FILTER (WHERE overall_rating = '1')
            ),
            'category_ratings', (
                SELECT json_build_object(
                    'teaching_quality', ROUND(AVG(
                        CASE teaching_quality::text
                            WHEN '1' THEN 1
                            WHEN '2' THEN 2
                            WHEN '3' THEN 3
                            WHEN '4' THEN 4
                            WHEN '5' THEN 5
                        END
                    ), 2),
                    'infrastructure', ROUND(AVG(
                        CASE infrastructure::text
                            WHEN '1' THEN 1
                            WHEN '2' THEN 2
                            WHEN '3' THEN 3
                            WHEN '4' THEN 4
                            WHEN '5' THEN 5
                        END
                    ), 2),
                    'staff_support', ROUND(AVG(
                        CASE staff_support::text
                            WHEN '1' THEN 1
                            WHEN '2' THEN 2
                            WHEN '3' THEN 3
                            WHEN '4' THEN 4
                            WHEN '5' THEN 5
                        END
                    ), 2),
                    'value_for_money', ROUND(AVG(
                        CASE value_for_money::text
                            WHEN '1' THEN 1
                            WHEN '2' THEN 2
                            WHEN '3' THEN 3
                            WHEN '4' THEN 4
                            WHEN '5' THEN 5
                        END
                    ), 2)
                )
                FROM reviews 
                WHERE coaching_branch_id = branch_id 
                AND status = 'APPROVED'
                AND teaching_quality IS NOT NULL
            ),
            'verified_reviews', COUNT(*) FILTER (WHERE is_verified_reviewer = TRUE),
            'last_review_date', MAX(created_at),
            'recent_activity', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'),
            'cached', false
        ) INTO summary
        FROM reviews 
        WHERE coaching_branch_id = branch_id AND status = 'APPROVED';
    END IF;

    RETURN summary;
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================

-- NEW: Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_review_data()
RETURNS VOID AS $$
BEGIN
    -- Archive reviews older than 3 years
    -- DELETE FROM reviews WHERE created_at < NOW() - INTERVAL '3 years';
    
    -- Update materialized view
    PERFORM refresh_branch_ratings();
    
    -- Analyze tables for query planner
    ANALYZE reviews;
    ANALYZE review_media;
    ANALYZE review_helpful_votes;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE reviews IS 'High-performance reviews system with caching, rate limiting, and advanced search capabilities';
COMMENT ON MATERIALIZED VIEW mv_branch_ratings IS 'Cached rating aggregations for high-performance queries';
-- COMMENT ON TABLE review_analytics IS 'Daily analytics for monitoring review trends and performance';
COMMENT ON FUNCTION search_reviews IS 'Optimized search with pagination, filtering, and full-text search';
COMMENT ON FUNCTION get_branch_rating_summary IS 'Fast rating summary using materialized views with fallback';
COMMENT ON FUNCTION check_review_rate_limit IS 'Rate limiting to prevent review spam and abuse';

-- ============================================================
-- SCHEDULED MAINTENANCE
-- ============================================================

-- Example: Set up a cron job to refresh materialized views daily
-- 0 2 * * * psql -c "SELECT refresh_branch_ratings();"

-- Example: Weekly cleanup
-- 0 3 * * 0 psql -c "SELECT cleanup_old_review_data();"