/**
 * Address Schema Types
 * 
 * TypeScript interfaces and types for address-related data structures
 * Based on the Supabase addresses table schema
 */

// Address type enum from database (matching migration exactly)
export type AddressType = 'HOME' | 'WORK' | 'SCHOOL' | 'COLLEGE' | 'COACHING' | 'HOSTEL' | 'BRANCH' | 'OFFICE' | 'OTHER';

// Core address interface matching the database table
export interface Address {
  // Primary identification
  id: string; // UUID

  // Foreign key relationships
  user_id: string; // UUID from auth.users
  branch_id: string | null; // UUID for branch reference
  coaching_id: string | null; // UUID for coaching center reference

  // Address type and labeling
  address_type: AddressType;
  label: string | null; // Custom label

  // Required location fields
  state: string;
  district: string;
  pin_code: string;

  // Detailed address fields (optional)
  country: string; // Default 'India'
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  sub_district: string | null; // Tehsil/Taluka/Block
  village_town: string | null;

  // Geographic coordinates
  latitude: number | null;
  longitude: number | null;

  // Google Maps integration
  google_maps_url: string | null;
  google_place_id: string | null;
  google_plus_code: string | null;

  // Additional metadata
  postal_address: string | null;
  delivery_instructions: string | null;

  // Status flags
  is_primary: boolean;
  is_active: boolean;
  is_verified: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}

// Public address interface (for displaying to other users)
export interface PublicAddress {
  id: string;
  address_type: AddressType;
  label: string | null;
  state: string;
  district: string;
  city: string | null;
  country: string;
  postal_address: string | null;
  is_verified: boolean;
  // Coordinates hidden for privacy unless explicitly shared
}

// Address creation interface
export interface AddressCreate {
  user_id?: string; // Optional - will be set automatically by the service
  branch_id?: string | null;
  coaching_id?: string | null;
  address_type?: AddressType;
  label?: string;

  // Required fields
  state: string;
  district: string;
  pin_code: string;

  // Optional fields
  country?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  sub_district?: string;
  village_town?: string;

  // Geographic data
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  google_place_id?: string;
  google_plus_code?: string;

  // Metadata
  postal_address?: string;
  delivery_instructions?: string;

  // Status
  is_primary?: boolean;
  is_active?: boolean;
}

// Address update interface
export interface AddressUpdate {
  branch_id?: string | null;
  coaching_id?: string | null;
  address_type?: AddressType;
  label?: string;

  // Location fields
  state?: string;
  district?: string;
  pin_code?: string;
  country?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  sub_district?: string;
  village_town?: string;

  // Geographic data
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  google_place_id?: string;
  google_plus_code?: string;

  // Metadata
  postal_address?: string;
  delivery_instructions?: string;

  // Status
  is_primary?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
}

// Address filter options for searching/listing
export interface AddressFilters {
  user_id?: string;
  branch_id?: string;
  coaching_id?: string;
  address_type?: AddressType | AddressType[];
  state?: string | string[];
  district?: string | string[];
  pin_code?: string;
  city?: string;
  country?: string;
  is_primary?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  within_radius?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  search_query?: string; // For searching by label, address lines, city
}

// Address sort options
export type AddressSortField =
  | 'created_at'
  | 'updated_at'
  | 'address_type'
  | 'state'
  | 'district'
  | 'city'
  | 'pin_code'
  | 'is_primary'
  | 'label';

export type SortDirection = 'asc' | 'desc';

export interface AddressSort {
  field: AddressSortField;
  direction: SortDirection;
}

// Geographic coordinates interface
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Google Maps integration interface
export interface GoogleMapsData {
  maps_url?: string;
  place_id?: string;
  plus_code?: string;
  coordinates?: Coordinates;
  extracted_data?: {
    formatted_address: string;
    address_components: AddressComponent[];
  };
}

// Google Places API address component
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Address validation result
export interface AddressValidationResult {
  valid: boolean;
  success?: boolean; // For consistency with other operation results
  errors?: AddressValidationError[];
  suggestions?: AddressSuggestion[];
  confidence_score?: number;
}

// Address validation error
export interface AddressValidationError {
  field: keyof Address;
  message: string;
  code: string;
}

// Address suggestion for autocomplete
export interface AddressSuggestion {
  display_text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  place_id?: string;
  coordinates?: Coordinates;
}

// Address search result interface
export interface AddressSearchResult {
  addresses: Address[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Address operation result interface
export interface AddressOperationResult<T = Address> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: AddressValidationError[];
}

// Distance calculation interface
export interface DistanceResult {
  distance_km: number;
  from_address: Address;
  to_address: Address;
  estimated_travel_time?: string;
}

// Nearby addresses result
export interface NearbyAddressesResult {
  addresses: Address[];
  distances: Array<{
    address_id: string;
    distance_km: number;
  }>;
  center: Coordinates;
  radius_km: number;
}

// Address formatting options
export interface AddressFormatOptions {
  include_country?: boolean;
  include_pin_code?: boolean;
  separator?: string;
  single_line?: boolean;
}

// Formatted address result
export interface FormattedAddress {
  single_line: string;
  multi_line: string[];
  postal_format: string;
}

// Address statistics interface
export interface AddressStats {
  total_addresses: number;
  by_type: Record<AddressType, number>;
  by_state: Array<{ state: string; count: number }>;
  verified_addresses: number;
  primary_addresses: number;
  with_coordinates: number;
}

// Address completion steps
export interface AddressCompletionStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  points: number;
  required: boolean;
}

// Address permissions interface
export interface AddressPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_coordinates: boolean;
  can_set_primary: boolean;
}

// Geocoding result interface
export interface GeocodingResult {
  success: boolean;
  coordinates?: Coordinates;
  formatted_address?: string;
  place_id?: string;
  confidence?: number;
  error?: string;
}

// Reverse geocoding result interface
export interface ReverseGeocodingResult {
  success: boolean;
  address_components?: AddressComponent[];
  formatted_address?: string;
  place_id?: string;
  confidence?: number;
  error?: string;
}

// Indian state and district interfaces
export interface IndianState {
  code: string;
  name: string;
}

export interface IndianDistrict {
  id: string;
  state_code: string;
  name: string;
}

// Address constants
export const ADDRESS_CONSTANTS = {
  // Validation limits
  PIN_CODE_LENGTH: 6,
  MAX_LABEL_LENGTH: 100,
  MAX_ADDRESS_LINE_LENGTH: 200,
  MAX_INSTRUCTIONS_LENGTH: 500,

  // Coordinate limits for India
  INDIA_LAT_MIN: 6.0,
  INDIA_LAT_MAX: 37.6,
  INDIA_LNG_MIN: 68.7,
  INDIA_LNG_MAX: 97.25,

  // Search and pagination limits
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_SEARCH_RADIUS_KM: 100,
  DEFAULT_SEARCH_RADIUS_KM: 10,

  // Cache TTL in minutes
  ADDRESS_CACHE_TTL: 15,
  GEOCODING_CACHE_TTL: 60,

  // Default values
  DEFAULT_COUNTRY: 'India',
  DEFAULT_ADDRESS_TYPE: 'HOME' as AddressType,

  // Google Maps
  GOOGLE_MAPS_BASE_URL: 'https://www.google.com/maps',
  GOOGLE_PLACES_API_URL: 'https://maps.googleapis.com/maps/api/place',

  // Distance calculation
  EARTH_RADIUS_KM: 6371,
} as const;

// Address type labels
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  HOME: 'Home',
  WORK: 'Work',
  SCHOOL: 'School',
  COLLEGE: 'College',
  COACHING: 'Coaching Center',
  HOSTEL: 'Hostel',
  BRANCH: 'Branch Office',
  OFFICE: 'Office',
  OTHER: 'Other',
} as const;

// Address type icons (for UI)
export const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  HOME: 'home',
  WORK: 'building',
  SCHOOL: 'graduation-cap',
  COLLEGE: 'university',
  COACHING: 'chalkboard-teacher',
  HOSTEL: 'bed',
  BRANCH: 'map-marker-alt',
  OFFICE: 'briefcase',
  OTHER: 'map-pin',
} as const;

// Address error codes
export const ADDRESS_ERROR_CODES = {
  // Validation errors
  INVALID_PIN_CODE: 'INVALID_PIN_CODE',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_GOOGLE_MAPS_URL: 'INVALID_GOOGLE_MAPS_URL',
  INVALID_PLUS_CODE: 'INVALID_PLUS_CODE',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',

  // Business logic errors
  PRIMARY_ADDRESS_EXISTS: 'PRIMARY_ADDRESS_EXISTS',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  CANNOT_DELETE_PRIMARY: 'CANNOT_DELETE_PRIMARY',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Geographic errors
  COORDINATES_OUT_OF_BOUNDS: 'COORDINATES_OUT_OF_BOUNDS',
  GEOCODING_FAILED: 'GEOCODING_FAILED',
  REVERSE_GEOCODING_FAILED: 'REVERSE_GEOCODING_FAILED',
  INVALID_SEARCH_RADIUS: 'INVALID_SEARCH_RADIUS',

  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',

  // External service errors
  GOOGLE_MAPS_API_ERROR: 'GOOGLE_MAPS_API_ERROR',
  GOOGLE_PLACES_API_ERROR: 'GOOGLE_PLACES_API_ERROR',
  GEOCODING_SERVICE_UNAVAILABLE: 'GEOCODING_SERVICE_UNAVAILABLE',

  // General errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Common Indian states for reference
export const INDIAN_STATES: IndianState[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
] as const;

// Role constants for type safety
export const ADDRESS_TYPES = {
  HOME: 'HOME' as const,
  WORK: 'WORK' as const,
  SCHOOL: 'SCHOOL' as const,
  COLLEGE: 'COLLEGE' as const,
  COACHING: 'COACHING' as const,
  HOSTEL: 'HOSTEL' as const,
  BRANCH: 'BRANCH' as const,
  OFFICE: 'OFFICE' as const,
  OTHER: 'OTHER' as const,
} as const;

// Default address values
export const DEFAULT_ADDRESS_VALUES = {
  address_type: ADDRESS_CONSTANTS.DEFAULT_ADDRESS_TYPE,
  country: ADDRESS_CONSTANTS.DEFAULT_COUNTRY,
  is_primary: false,
  is_active: true,
  is_verified: false,
} as const;

// Address validation rules
export const ADDRESS_VALIDATION_RULES = {
  PIN_CODE_REGEX: /^[0-9]{6}$/,
  GOOGLE_MAPS_URL_REGEX: /^https:\/\/(www\.)?google\.(com|co\.in)\/maps/,
  GOOGLE_PLUS_CODE_REGEX: /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$/,
  COORDINATE_PRECISION: 8, // Decimal places for coordinates
} as const;

// Pre-defined address completion steps
export const ADDRESS_COMPLETION_STEPS: Record<string, Omit<AddressCompletionStep, 'completed'>> = {
  basic_location: {
    key: 'basic_location',
    label: 'Basic Location',
    description: 'Add state, district, and PIN code',
    points: 30,
    required: true
  },
  detailed_address: {
    key: 'detailed_address',
    label: 'Detailed Address',
    description: 'Add address lines and city',
    points: 25,
    required: false
  },
  coordinates: {
    key: 'coordinates',
    label: 'Geographic Coordinates',
    description: 'Add GPS coordinates or link Google Maps',
    points: 20,
    required: false
  },
  address_type: {
    key: 'address_type',
    label: 'Address Type & Label',
    description: 'Set address type and custom label',
    points: 15,
    required: false
  },
  delivery_info: {
    key: 'delivery_info',
    label: 'Delivery Instructions',
    description: 'Add delivery instructions and landmarks',
    points: 10,
    required: false
  }
} as const;

// PIN Code API Types (moved here for better organization)
export interface PostOffice {
  Name: string;
  Description: string;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

export interface PostalAPIResponse {
  Message: string;
  Status: string;
  PostOffice: PostOffice[];
}

export interface PinCodeInfo {
  pinCode: string;
  state: string;
  district: string;
  block: string;
  region: string;
  circle: string;
  division: string;
  postOffices: PostOffice[];
  isValid: boolean;
}

export interface PinCodeServiceResult {
  success: boolean;
  data?: PinCodeInfo;
  error?: string;
}