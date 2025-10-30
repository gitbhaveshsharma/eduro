/**
 * Address Validation Schemas
 * 
 * Comprehensive Zod validation schemas for address-related operations
 * Centralized validation logic for consistency across the application
 */

import { z } from 'zod';
import { AddressType } from '@/lib/schema/address.types';

/**
 * Validation limits
 */
const LIMITS = {
    LABEL_MAX: 100,
    ADDRESS_LINE_MAX: 200,
    CITY_MAX: 100,
    STATE_MAX: 100,
    DISTRICT_MAX: 100,
    SUB_DISTRICT_MAX: 100,
    VILLAGE_TOWN_MAX: 100,
    COUNTRY_MAX: 100,
    PIN_CODE_LENGTH: 6,
    POSTAL_ADDRESS_MAX: 500,
    DELIVERY_INSTRUCTIONS_MAX: 500,
    LATITUDE_MIN: -90,
    LATITUDE_MAX: 90,
    LONGITUDE_MIN: -180,
    LONGITUDE_MAX: 180,
    // India-specific coordinate bounds
    INDIA_LAT_MIN: 6.0,
    INDIA_LAT_MAX: 37.6,
    INDIA_LNG_MIN: 68.7,
    INDIA_LNG_MAX: 97.25,
} as const;

/**
 * Regular expressions for validation
 */
const VALIDATION_REGEX = {
    PIN_CODE: /^[0-9]{6}$/,
    GOOGLE_MAPS_URL: /^https:\/\/(www\.)?(google\.(com|co\.in)|goo\.gl)\/maps/,
    GOOGLE_PLUS_CODE: /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$/,
    PHONE_NUMBER: /^\+?[1-9]\d{1,14}$/,
} as const;

/**
 * Address type validation schema
 */
export const addressTypeSchema = z.enum(
    ['HOME', 'WORK', 'SCHOOL', 'COLLEGE', 'COACHING', 'HOSTEL', 'BRANCH', 'OFFICE', 'OTHER'],
    {
        errorMap: () => ({ message: 'Invalid address type' })
    }
);

/**
 * PIN code validation schema
 */
export const pinCodeSchema = z
    .string()
    .length(LIMITS.PIN_CODE_LENGTH, `PIN code must be exactly ${LIMITS.PIN_CODE_LENGTH} digits`)
    .regex(VALIDATION_REGEX.PIN_CODE, 'PIN code must contain only numbers')
    .refine(
        (pin) => !pin.startsWith('0'),
        'PIN code cannot start with 0'
    );

/**
 * State validation schema
 */
export const stateSchema = z
    .string()
    .min(2, 'State name is too short')
    .max(LIMITS.STATE_MAX, `State name must be no more than ${LIMITS.STATE_MAX} characters`)
    .refine(
        (state) => state.trim().length >= 2,
        'State name cannot be only whitespace'
    );

/**
 * District validation schema
 */
export const districtSchema = z
    .string()
    .min(2, 'District name is too short')
    .max(LIMITS.DISTRICT_MAX, `District name must be no more than ${LIMITS.DISTRICT_MAX} characters`)
    .refine(
        (district) => district.trim().length >= 2,
        'District name cannot be only whitespace'
    );

/**
 * City validation schema
 */
export const citySchema = z
    .string()
    .min(2, 'City name is too short')
    .max(LIMITS.CITY_MAX, `City name must be no more than ${LIMITS.CITY_MAX} characters`)
    .refine(
        (city) => city.trim().length >= 2,
        'City name cannot be only whitespace'
    );

/**
 * Label validation schema
 */
export const labelSchema = z
    .string()
    .max(LIMITS.LABEL_MAX, `Label must be no more than ${LIMITS.LABEL_MAX} characters`);

/**
 * Address line validation schema
 */
export const addressLineSchema = z
    .string()
    .max(LIMITS.ADDRESS_LINE_MAX, `Address line must be no more than ${LIMITS.ADDRESS_LINE_MAX} characters`);

/**
 * Country validation schema
 */
export const countrySchema = z
    .string()
    .min(2, 'Country name is too short')
    .max(LIMITS.COUNTRY_MAX, `Country name must be no more than ${LIMITS.COUNTRY_MAX} characters`);

/**
 * Latitude validation schema
 */
export const latitudeSchema = z
    .number()
    .min(LIMITS.LATITUDE_MIN, `Latitude must be between ${LIMITS.LATITUDE_MIN} and ${LIMITS.LATITUDE_MAX}`)
    .max(LIMITS.LATITUDE_MAX, `Latitude must be between ${LIMITS.LATITUDE_MIN} and ${LIMITS.LATITUDE_MAX}`);

/**
 * Longitude validation schema
 */
export const longitudeSchema = z
    .number()
    .min(LIMITS.LONGITUDE_MIN, `Longitude must be between ${LIMITS.LONGITUDE_MIN} and ${LIMITS.LONGITUDE_MAX}`)
    .max(LIMITS.LONGITUDE_MAX, `Longitude must be between ${LIMITS.LONGITUDE_MIN} and ${LIMITS.LONGITUDE_MAX}`);

/**
 * India-specific latitude validation
 */
export const indiaLatitudeSchema = z
    .number()
    .min(LIMITS.INDIA_LAT_MIN, `Latitude must be within India (${LIMITS.INDIA_LAT_MIN} to ${LIMITS.INDIA_LAT_MAX})`)
    .max(LIMITS.INDIA_LAT_MAX, `Latitude must be within India (${LIMITS.INDIA_LAT_MIN} to ${LIMITS.INDIA_LAT_MAX})`);

/**
 * India-specific longitude validation
 */
export const indiaLongitudeSchema = z
    .number()
    .min(LIMITS.INDIA_LNG_MIN, `Longitude must be within India (${LIMITS.INDIA_LNG_MIN} to ${LIMITS.INDIA_LNG_MAX})`)
    .max(LIMITS.INDIA_LNG_MAX, `Longitude must be within India (${LIMITS.INDIA_LNG_MIN} to ${LIMITS.INDIA_LNG_MAX})`);

/**
 * Coordinates validation schema
 */
export const coordinatesSchema = z.object({
    latitude: latitudeSchema,
    longitude: longitudeSchema,
}).refine(
    (coords) => {
        // Ensure coordinates are not (0, 0) which is invalid for most real locations
        return !(coords.latitude === 0 && coords.longitude === 0);
    },
    'Invalid coordinates (0, 0)'
);

/**
 * India coordinates validation schema
 */
export const indiaCoordinatesSchema = z.object({
    latitude: indiaLatitudeSchema,
    longitude: indiaLongitudeSchema,
});

/**
 * Google Maps URL validation schema
 */
export const googleMapsUrlSchema = z
    .string()
    .url('Invalid Google Maps URL')
    .regex(VALIDATION_REGEX.GOOGLE_MAPS_URL, 'Must be a valid Google Maps URL');

/**
 * Google Plus Code validation schema
 */
export const googlePlusCodeSchema = z
    .string()
    .regex(VALIDATION_REGEX.GOOGLE_PLUS_CODE, 'Invalid Google Plus Code format');

/**
 * Postal address validation schema
 */
export const postalAddressSchema = z
    .string()
    .max(LIMITS.POSTAL_ADDRESS_MAX, `Postal address must be no more than ${LIMITS.POSTAL_ADDRESS_MAX} characters`);

/**
 * Delivery instructions validation schema
 */
export const deliveryInstructionsSchema = z
    .string()
    .max(LIMITS.DELIVERY_INSTRUCTIONS_MAX, `Delivery instructions must be no more than ${LIMITS.DELIVERY_INSTRUCTIONS_MAX} characters`);

/**
 * Address creation validation schema
 */
export const addressCreateSchema = z.object({
    // User/Branch identification
    user_id: z.string().uuid().optional(),
    branch_id: z.string().uuid().nullable().optional(),
    
    // Address type and labeling
    address_type: addressTypeSchema.optional(),
    label: labelSchema.nullable().optional(),
    
    // Required location fields
    state: stateSchema,
    district: districtSchema,
    pin_code: pinCodeSchema,
    
    // Optional detailed address fields
    country: countrySchema.optional(),
    address_line_1: addressLineSchema.nullable().optional(),
    address_line_2: addressLineSchema.nullable().optional(),
    city: citySchema.nullable().optional(),
    sub_district: z.string().max(LIMITS.SUB_DISTRICT_MAX).nullable().optional(),
    village_town: z.string().max(LIMITS.VILLAGE_TOWN_MAX).nullable().optional(),
    
    // Geographic coordinates
    latitude: latitudeSchema.nullable().optional(),
    longitude: longitudeSchema.nullable().optional(),
    
    // Google Maps integration
    google_maps_url: googleMapsUrlSchema.nullable().optional(),
    google_place_id: z.string().nullable().optional(),
    google_plus_code: googlePlusCodeSchema.nullable().optional(),
    
    // Additional metadata
    postal_address: postalAddressSchema.nullable().optional(),
    delivery_instructions: deliveryInstructionsSchema.nullable().optional(),
    
    // Status flags
    is_primary: z.boolean().optional(),
    is_active: z.boolean().optional(),
}).refine(
    (data) => {
        // If coordinates are provided, both latitude and longitude must be present
        if (data.latitude !== null && data.latitude !== undefined) {
            return data.longitude !== null && data.longitude !== undefined;
        }
        if (data.longitude !== null && data.longitude !== undefined) {
            return data.latitude !== null && data.latitude !== undefined;
        }
        return true;
    },
    {
        message: 'Both latitude and longitude must be provided together',
        path: ['coordinates'],
    }
);

/**
 * Address update validation schema
 */
export const addressUpdateSchema = z.object({
    // Address type and labeling
    address_type: addressTypeSchema.optional(),
    label: labelSchema.nullable().optional(),
    
    // Location fields
    state: stateSchema.optional(),
    district: districtSchema.optional(),
    pin_code: pinCodeSchema.optional(),
    country: countrySchema.optional(),
    address_line_1: addressLineSchema.nullable().optional(),
    address_line_2: addressLineSchema.nullable().optional(),
    city: citySchema.nullable().optional(),
    sub_district: z.string().max(LIMITS.SUB_DISTRICT_MAX).nullable().optional(),
    village_town: z.string().max(LIMITS.VILLAGE_TOWN_MAX).nullable().optional(),
    
    // Geographic coordinates
    latitude: latitudeSchema.nullable().optional(),
    longitude: longitudeSchema.nullable().optional(),
    
    // Google Maps integration
    google_maps_url: googleMapsUrlSchema.nullable().optional(),
    google_place_id: z.string().nullable().optional(),
    google_plus_code: googlePlusCodeSchema.nullable().optional(),
    
    // Additional metadata
    postal_address: postalAddressSchema.nullable().optional(),
    delivery_instructions: deliveryInstructionsSchema.nullable().optional(),
    
    // Status flags
    is_primary: z.boolean().optional(),
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
}).refine(
    (data) => {
        // If coordinates are provided, both latitude and longitude must be present
        if (data.latitude !== null && data.latitude !== undefined) {
            return data.longitude !== null && data.longitude !== undefined;
        }
        if (data.longitude !== null && data.longitude !== undefined) {
            return data.latitude !== null && data.latitude !== undefined;
        }
        return true;
    },
    {
        message: 'Both latitude and longitude must be provided together',
        path: ['coordinates'],
    }
).refine(
    (data) => {
        // At least one field must be provided for update
        return Object.keys(data).length > 0;
    },
    'At least one field must be provided for update'
);

/**
 * Address form validation schema (for forms)
 */
export const addressFormSchema = z.object({
    address_type: addressTypeSchema,
    label: z.string().max(LIMITS.LABEL_MAX).nullable().optional(),
    
    // Required fields
    state: stateSchema,
    district: districtSchema,
    pin_code: pinCodeSchema,
    
    // Optional fields
    country: z.string().max(LIMITS.COUNTRY_MAX).optional(),
    address_line_1: z.string().max(LIMITS.ADDRESS_LINE_MAX).nullable().optional(),
    address_line_2: z.string().max(LIMITS.ADDRESS_LINE_MAX).nullable().optional(),
    city: z.string().max(LIMITS.CITY_MAX).nullable().optional(),
    sub_district: z.string().max(LIMITS.SUB_DISTRICT_MAX).nullable().optional(),
    village_town: z.string().max(LIMITS.VILLAGE_TOWN_MAX).nullable().optional(),
    
    // Coordinates
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    
    // Google Maps
    google_maps_url: z.string().url().nullable().optional().or(z.literal('')),
    google_place_id: z.string().nullable().optional(),
    google_plus_code: z.string().nullable().optional(),
    
    // Additional info
    postal_address: z.string().max(LIMITS.POSTAL_ADDRESS_MAX).nullable().optional(),
    delivery_instructions: z.string().max(LIMITS.DELIVERY_INSTRUCTIONS_MAX).nullable().optional(),
    
    // Status
    is_primary: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

/**
 * Address filters validation schema
 */
export const addressFiltersSchema = z.object({
    user_id: z.string().uuid().optional(),
    branch_id: z.string().uuid().optional(),
    address_type: z.union([addressTypeSchema, z.array(addressTypeSchema)]).optional(),
    state: z.union([z.string(), z.array(z.string())]).optional(),
    district: z.union([z.string(), z.array(z.string())]).optional(),
    pin_code: pinCodeSchema.optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    is_primary: z.boolean().optional(),
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    search_query: z.string().max(200).optional(),
});

/**
 * Radius search validation schema
 */
export const radiusSearchSchema = z.object({
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    radius_km: z.number().min(0.1, 'Radius must be at least 0.1 km').max(100, 'Radius cannot exceed 100 km'),
});

/**
 * Utility function to validate PIN code format
 */
export const validatePinCodeFormat = (pinCode: string): { valid: boolean; error?: string } => {
    try {
        pinCodeSchema.parse(pinCode);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid PIN code' };
        }
        return { valid: false, error: 'Invalid PIN code' };
    }
};

/**
 * Utility function to validate coordinates
 */
export const validateCoordinates = (
    latitude: number,
    longitude: number,
    checkIndiaBounds: boolean = false
): { valid: boolean; error?: string } => {
    try {
        if (checkIndiaBounds) {
            indiaCoordinatesSchema.parse({ latitude, longitude });
        } else {
            coordinatesSchema.parse({ latitude, longitude });
        }
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid coordinates' };
        }
        return { valid: false, error: 'Invalid coordinates' };
    }
};

/**
 * Utility function to validate Google Maps URL
 */
export const validateGoogleMapsUrl = (url: string): { valid: boolean; error?: string } => {
    try {
        googleMapsUrlSchema.parse(url);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid Google Maps URL' };
        }
        return { valid: false, error: 'Invalid Google Maps URL' };
    }
};

/**
 * Utility function to validate address completeness
 */
export const validateAddressCompleteness = (address: any): {
    complete: boolean;
    missingFields: string[];
    score: number;
} => {
    const requiredFields = ['state', 'district', 'pin_code'];
    const optionalFields = ['address_line_1', 'address_line_2', 'city', 'latitude', 'longitude'];
    
    const missingRequired = requiredFields.filter(field => !address[field]);
    const missingOptional = optionalFields.filter(field => !address[field]);
    
    const totalFields = requiredFields.length + optionalFields.length;
    const filledFields = totalFields - (missingRequired.length + missingOptional.length);
    const score = Math.round((filledFields / totalFields) * 100);
    
    return {
        complete: missingRequired.length === 0,
        missingFields: [...missingRequired, ...missingOptional],
        score
    };
};

/**
 * Export validation limits for UI components
 */
export { LIMITS as ADDRESS_VALIDATION_LIMITS };

/**
 * Export regex patterns for custom validation
 */
export { VALIDATION_REGEX as ADDRESS_VALIDATION_REGEX };

/**
 * Indian states list for validation
 */
export const INDIAN_STATES = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
    'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
] as const;

/**
 * Validate if state is a valid Indian state
 */
export const validateIndianState = (state: string): boolean => {
    return INDIAN_STATES.some(s => s.toLowerCase() === state.toLowerCase());
};
