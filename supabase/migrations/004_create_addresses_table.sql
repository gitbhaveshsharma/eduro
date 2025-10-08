-- Create addresses table migration
-- This table stores comprehensive address information for users with geographic data

-- Create address type enum
-- Create address type enum
CREATE TYPE address_type AS ENUM (
  'HOME',
  'WORK',
  'SCHOOL',
  'COLLEGE',
  'COACHING',
  'HOSTEL',
  'BRANCH',
  'OFFICE',
  'OTHER'
);


-- Create addresses table
CREATE TABLE addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign key relationships
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES coaching_branches(id) ON DELETE CASCADE NULL, -- Will reference branches table when created
    coaching_id UUID REFERENCES coaching_centers(id) ON DELETE CASCADE NULL, -- Will reference coachings table when created
    -- Address type and labeling
    address_type address_type NOT NULL DEFAULT 'HOME',
    label TEXT, -- Custom label like "Home", "Office", "Mom's House"
    
    -- Required location fields (NOT NULL)
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    
    -- Detailed address fields (NULLABLE)
    country TEXT DEFAULT 'India',
    address_line_1 TEXT, -- House/Building number, Street name
    address_line_2 TEXT, -- Area, Locality, Landmark
    city TEXT,
    sub_district TEXT, -- Tehsil/Taluka/Block
    village_town TEXT, -- Village or Town name
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8), -- GPS latitude
    longitude DECIMAL(11, 8), -- GPS longitude
    
    -- Google Maps integration
    google_maps_url TEXT, -- Full Google Maps URL
    google_place_id TEXT, -- Google Places API Place ID
    google_plus_code TEXT, -- Google Plus Code (Open Location Code)
    
    -- Additional metadata
    postal_address TEXT, -- Formatted postal address
    delivery_instructions TEXT, -- Special delivery notes
    
    -- Status flags
    is_primary BOOLEAN DEFAULT FALSE, -- Primary address for user
    is_active BOOLEAN DEFAULT TRUE, -- Address is currently active
    is_verified BOOLEAN DEFAULT FALSE, -- Address has been verified
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_pin_code CHECK (pin_code ~ '^[0-9]{6}$'), -- Indian PIN code format
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude >= -90 AND latitude <= 90 AND
         longitude >= -180 AND longitude <= 180)
    ),
    CONSTRAINT valid_google_maps_url CHECK (
        google_maps_url IS NULL OR 
        google_maps_url ~ '^https://(www\.)?google\.(com|co\.in)/maps'
    ),
    CONSTRAINT valid_plus_code CHECK (
        google_plus_code IS NULL OR 
        google_plus_code ~ '^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$'
    )
);

-- Create indexes for better performance
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_branch_id ON addresses(branch_id);
CREATE INDEX idx_addresses_state_district ON addresses(state, district);
CREATE INDEX idx_addresses_pin_code ON addresses(pin_code);
CREATE INDEX idx_addresses_is_primary ON addresses(is_primary);
CREATE INDEX idx_addresses_is_active ON addresses(is_active);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude);
CREATE INDEX idx_addresses_google_place_id ON addresses(google_place_id);

-- Create unique constraint for one primary address per user
CREATE UNIQUE INDEX idx_addresses_user_primary ON addresses(user_id) 
WHERE is_primary = TRUE AND is_active = TRUE;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_addresses_updated_at 
    BEFORE UPDATE ON addresses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_addresses_updated_at();

-- Enable Row Level Security
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for addresses
-- Users can view their own addresses
CREATE POLICY "Users can view own addresses" 
    ON addresses FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses" 
    ON addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses" 
    ON addresses FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses" 
    ON addresses FOR DELETE 
    USING (auth.uid() = user_id);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses" 
    ON addresses FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('SA', 'A')
        )
    );

-- Helper function to set primary address
CREATE OR REPLACE FUNCTION set_primary_address(address_id UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove primary flag from all other addresses for this user
    UPDATE addresses 
    SET is_primary = FALSE, updated_at = NOW()
    WHERE user_id = user_id_param AND id != address_id;
    
    -- Set the specified address as primary
    UPDATE addresses 
    SET is_primary = TRUE, updated_at = NOW()
    WHERE id = address_id AND user_id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to format address
CREATE OR REPLACE FUNCTION format_address(address_id UUID)
RETURNS TEXT AS $$
DECLARE
    addr addresses%ROWTYPE;
    formatted_address TEXT := '';
BEGIN
    SELECT * INTO addr FROM addresses WHERE id = address_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Build formatted address
    IF addr.address_line_1 IS NOT NULL THEN
        formatted_address := formatted_address || addr.address_line_1;
    END IF;
    
    IF addr.address_line_2 IS NOT NULL THEN
        IF formatted_address != '' THEN
            formatted_address := formatted_address || ', ';
        END IF;
        formatted_address := formatted_address || addr.address_line_2;
    END IF;
    
    IF addr.city IS NOT NULL THEN
        IF formatted_address != '' THEN
            formatted_address := formatted_address || ', ';
        END IF;
        formatted_address := formatted_address || addr.city;
    END IF;
    
    IF addr.district IS NOT NULL THEN
        IF formatted_address != '' THEN
            formatted_address := formatted_address || ', ';
        END IF;
        formatted_address := formatted_address || addr.district;
    END IF;
    
    IF addr.state IS NOT NULL THEN
        IF formatted_address != '' THEN
            formatted_address := formatted_address || ', ';
        END IF;
        formatted_address := formatted_address || addr.state;
    END IF;
    
    IF addr.pin_code IS NOT NULL THEN
        formatted_address := formatted_address || ' - ' || addr.pin_code;
    END IF;
    
    IF addr.country IS NOT NULL THEN
        formatted_address := formatted_address || ', ' || addr.country;
    END IF;
    
    RETURN formatted_address;
END;
$$ LANGUAGE plpgsql;

-- Helper function to validate Google Maps URL and extract coordinates
CREATE OR REPLACE FUNCTION extract_coordinates_from_maps_url(maps_url TEXT)
RETURNS JSON AS $$
DECLARE
    lat_match TEXT;
    lng_match TEXT;
    result JSON;
BEGIN
    -- Extract coordinates from Google Maps URL
    -- Example: https://www.google.com/maps/@28.6139,77.2090,15z
    lat_match := substring(maps_url from '@(-?\d+\.?\d*),');
    lng_match := substring(maps_url from '@-?\d+\.?\d*,(-?\d+\.?\d*)');
    
    IF lat_match IS NOT NULL AND lng_match IS NOT NULL THEN
        result := json_build_object(
            'latitude', lat_match::DECIMAL(10,8),
            'longitude', lng_match::DECIMAL(11,8),
            'extracted', true
        );
    ELSE
        result := json_build_object('extracted', false);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Sample data for Indian states and major districts (for reference)
-- This can be used for address validation or dropdown population

-- Comment: Consider creating a separate states_districts table for normalization
/*
CREATE TABLE IF NOT EXISTS indian_states (
    code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indian_districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state_code VARCHAR(3) REFERENCES indian_states(code),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Insert some common Indian states for reference
-- INSERT INTO indian_states (code, name) VALUES 
-- ('DL', 'Delhi'),
-- ('MH', 'Maharashtra'), 
-- ('KA', 'Karnataka'),
-- ('TN', 'Tamil Nadu'),
-- ('WB', 'West Bengal'),
-- ('UP', 'Uttar Pradesh'),
-- ('RJ', 'Rajasthan'),
-- ('GJ', 'Gujarat');

-- Function to get distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL(10,8), 
    lng1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lng2 DECIMAL(11,8)
)
RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;