-- ============================================================
-- SIMPLE & FAST CENTER SEARCH
-- Uses single ILIKE strategy for best performance
-- ============================================================

CREATE OR REPLACE FUNCTION search_coaching_centers_v2(
    p_search_query TEXT DEFAULT NULL,
    p_category coaching_category DEFAULT NULL,
    p_subjects TEXT[] DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL,
    p_center_id UUID DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_village_town TEXT DEFAULT NULL,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_radius_meters INTEGER DEFAULT NULL,
    p_min_rating INTEGER DEFAULT 1,
    p_max_rating INTEGER DEFAULT 5,
    p_is_verified BOOLEAN DEFAULT NULL,
    p_days_ago INTEGER DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'recent', -- 'recent', 'rating_high', 'rating_low', 'distance'
    p_limit_count INTEGER DEFAULT 20,
    p_offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    center_id UUID,              -- For API calls, detail pages
    center_slug TEXT,            -- For SEO-friendly URLs: /centers/thebluebe
    branch_id UUID,              -- For branch-specific operations
    center_is_verified BOOLEAN,  -- For trust badges
    center_logo_url TEXT,
    center_name TEXT,
    center_category coaching_category,
    center_subjects TEXT[],
    location_city TEXT,
    avg_rating NUMERIC,
    total_reviews BIGINT,
    location_state TEXT,
    location_district TEXT,
    distance_meters DOUBLE PRECISION,
    total_count BIGINT
) AS $$
DECLARE
    total_records BIGINT;
    user_location GEOGRAPHY;
BEGIN
    -- Create geography point from user's coordinates
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
        user_location := ST_MakePoint(p_longitude, p_latitude)::geography;
    END IF;
    
    -- Calculate total count
    WITH filtered_centers AS (
        SELECT DISTINCT cc.id
        FROM coaching_centers cc
        LEFT JOIN coaching_branches cb ON cc.id = cb.coaching_center_id AND cb.is_active = TRUE
        LEFT JOIN addresses addr ON cb.id = addr.branch_id AND addr.address_type = 'BRANCH'
        WHERE cc.status = 'ACTIVE'
            AND (p_category IS NULL OR cc.category = p_category)
            AND (p_subjects IS NULL OR cc.subjects && p_subjects)
            AND (p_center_id IS NULL OR cc.id = p_center_id)
            AND (p_branch_id IS NULL OR cb.id = p_branch_id)
            AND (p_state IS NULL OR addr.state ILIKE '%' || p_state || '%')
            AND (p_district IS NULL OR addr.district ILIKE '%' || p_district || '%')
            AND (p_city IS NULL OR addr.city ILIKE '%' || p_city || '%')
            AND (p_village_town IS NULL OR addr.village_town ILIKE '%' || p_village_town || '%')
            AND (p_is_verified IS NULL OR cc.is_verified = p_is_verified)
            AND (p_days_ago IS NULL OR cc.created_at > NOW() - (p_days_ago || ' days')::INTERVAL)
            -- Distance filter
            AND (
                user_location IS NULL OR 
                p_radius_meters IS NULL OR
                addr.latitude IS NULL OR 
                addr.longitude IS NULL OR
                ST_DWithin(
                    user_location,
                    ST_MakePoint(addr.longitude, addr.latitude)::geography,
                    p_radius_meters,
                    true
                )
            )
            -- SIMPLE SEARCH: Single ILIKE strategy
            AND (
                p_search_query IS NULL OR
                p_search_query = '' OR
                (
                    cc.name ILIKE '%' || p_search_query || '%' OR
                    EXISTS (
                        SELECT 1 FROM unnest(cc.subjects) s 
                        WHERE s ILIKE '%' || p_search_query || '%'
                    ) OR
                    cb.name ILIKE '%' || p_search_query || '%' OR
                    addr.city ILIKE '%' || p_search_query || '%' OR
                    addr.district ILIKE '%' || p_search_query || '%' OR
                    addr.state ILIKE '%' || p_search_query || '%'
                )
            )
    )
    SELECT COUNT(*) INTO total_records FROM filtered_centers;
    
    -- Return optimized results
    RETURN QUERY
    WITH center_stats AS (
        SELECT 
            r.coaching_center_id,
            COUNT(r.id) as review_count,
            AVG(
                CASE r.overall_rating::text
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    WHEN '4' THEN 4
                    WHEN '5' THEN 5
                END
            ) as avg_rating
        FROM reviews r
        WHERE r.status = 'APPROVED'
        GROUP BY r.coaching_center_id
    ),
    center_results AS (
        SELECT 
            cc.id as center_id,                    -- ADDED
            cc.slug as center_slug,                -- ADDED
            cc.is_verified as center_is_verified,  -- ADDED
            cb.id as branch_id,                    -- ADDED
            cc.logo_url,
            cc.name,
            cc.category,
            cc.subjects,
            addr.city,
            ROUND(COALESCE(cs.avg_rating, 0), 1) as calculated_avg_rating,
            COALESCE(cs.review_count, 0) as calculated_total_reviews,
            addr.state,
            addr.district,
            -- Calculate distance
            CASE 
                WHEN user_location IS NOT NULL AND addr.latitude IS NOT NULL AND addr.longitude IS NOT NULL THEN
                    ST_Distance(
                        user_location,
                        ST_MakePoint(addr.longitude, addr.latitude)::geography,
                        true
                    )
                ELSE NULL
            END as calculated_distance,
            total_records as calculated_total_count,
            cc.is_featured,
            cc.created_at
            
        FROM coaching_centers cc
        LEFT JOIN coaching_branches cb ON cc.id = cb.coaching_center_id AND cb.is_active = TRUE
        LEFT JOIN addresses addr ON cb.id = addr.branch_id AND addr.address_type = 'BRANCH'
        LEFT JOIN center_stats cs ON cc.id = cs.coaching_center_id
        WHERE cc.status = 'ACTIVE'
            AND (p_category IS NULL OR cc.category = p_category)
            AND (p_subjects IS NULL OR cc.subjects && p_subjects)
            AND (p_center_id IS NULL OR cc.id = p_center_id)
            AND (p_branch_id IS NULL OR cb.id = p_branch_id)
            AND (p_state IS NULL OR addr.state ILIKE '%' || p_state || '%')
            AND (p_district IS NULL OR addr.district ILIKE '%' || p_district || '%')
            AND (p_city IS NULL OR addr.city ILIKE '%' || p_city || '%')
            AND (p_village_town IS NULL OR addr.village_town ILIKE '%' || p_village_town || '%')
            AND (p_is_verified IS NULL OR cc.is_verified = p_is_verified)
            AND (p_days_ago IS NULL OR cc.created_at > NOW() - (p_days_ago || ' days')::INTERVAL)
            -- Distance filter
            AND (
                user_location IS NULL OR 
                p_radius_meters IS NULL OR
                addr.latitude IS NULL OR 
                addr.longitude IS NULL OR
                ST_DWithin(
                    user_location,
                    ST_MakePoint(addr.longitude, addr.latitude)::geography,
                    p_radius_meters,
                    true
                )
            )
            -- Rating filter
            AND (
                (cs.avg_rating IS NULL AND 1 BETWEEN p_min_rating AND p_max_rating) OR
                (cs.avg_rating BETWEEN p_min_rating AND p_max_rating)
            )
            -- SAME SIMPLE SEARCH LOGIC
            AND (
                p_search_query IS NULL OR
                p_search_query = '' OR
                (
                    cc.name ILIKE '%' || p_search_query || '%' OR
                    EXISTS (
                        SELECT 1 FROM unnest(cc.subjects) s 
                        WHERE s ILIKE '%' || p_search_query || '%'
                    ) OR
                    cb.name ILIKE '%' || p_search_query || '%' OR
                    addr.city ILIKE '%' || p_search_query || '%' OR
                    addr.district ILIKE '%' || p_search_query || '%' OR
                    addr.state ILIKE '%' || p_search_query || '%'
                )
            )
        GROUP BY 
            cc.id, cc.slug, cc.is_verified, cc.logo_url, cc.name, cc.category, cc.is_featured, cc.created_at,
            cc.subjects, cb.id,
            addr.city, addr.state, addr.district, addr.latitude, addr.longitude,
            cs.avg_rating, cs.review_count
    )
    SELECT 
        cr.center_id,
        cr.center_slug,
        cr.branch_id,
        cr.center_is_verified,
        cr.logo_url as center_logo_url,
        cr.name as center_name,
        cr.category as center_category,
        cr.subjects as center_subjects,
        cr.city as location_city,
        cr.calculated_avg_rating as avg_rating,
        cr.calculated_total_reviews as total_reviews,
        cr.state as location_state,
        cr.district as location_district,
        cr.calculated_distance as distance_meters,
        cr.calculated_total_count as total_count
    FROM center_results cr
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'distance' AND cr.calculated_distance IS NOT NULL THEN cr.calculated_distance
            WHEN p_sort_by = 'rating_high' THEN -COALESCE(cr.calculated_avg_rating, 0)
            WHEN p_sort_by = 'rating_low' THEN COALESCE(cr.calculated_avg_rating, 5)
            ELSE -EXTRACT(EPOCH FROM cr.created_at)
        END,
        cr.is_featured DESC NULLS LAST,
        cr.calculated_distance ASC NULLS LAST,
        cr.created_at DESC
    LIMIT p_limit_count OFFSET p_offset_count;
    
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- PERFORMANCE INDEXES FOR SUBJECT SEARCHING
-- ============================================================

-- GIN index for efficient array subject searching
CREATE INDEX IF NOT EXISTS idx_coaching_centers_subjects_gin 
ON coaching_centers USING GIN (subjects)
WHERE status = 'ACTIVE';

-- Composite index for category + subjects
CREATE INDEX IF NOT EXISTS idx_coaching_centers_category_subjects 
ON coaching_centers (category, subjects)
WHERE status = 'ACTIVE';




-- Create spatial index on addresses for distance queries
-- Step 1: Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Add a generated geography column to addresses table
ALTER TABLE addresses 
ADD COLUMN geog GEOGRAPHY(Point, 4326) 
GENERATED ALWAYS AS (
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ELSE NULL
    END
) STORED;

-- Step 3: Create a simple GIST index on the geography column
CREATE INDEX idx_addresses_geolocation 
ON addresses USING GIST (geog)
WHERE geog IS NOT NULL;


-- Create index for village_town searches
CREATE INDEX IF NOT EXISTS idx_addresses_village_town 
ON addresses (village_town) WHERE village_town IS NOT NULL;

-- Composite index for location filtering
CREATE INDEX IF NOT EXISTS idx_addresses_location_combined 
ON addresses (state, district, city, village_town) 
WHERE address_type = 'BRANCH';