import { z } from 'zod'

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(100, 'Email must be less than 100 characters')

// Phone validation schema
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code')
  .max(20, 'Phone number must be less than 20 characters')

// OTP validation schema
export const otpSchema = z
  .string()
  .min(6, 'OTP must be 6 digits')
  .max(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers')

// Email OTP request schema
export const emailOtpRequestSchema = z.object({
  email: emailSchema,
})

// Phone OTP request schema
export const phoneOtpRequestSchema = z.object({
  phone: phoneSchema,
})

// Email OTP verification schema
export const otpVerificationSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
})

// Phone OTP verification schema
export const phoneOtpVerificationSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
})

// Provider login schema (for OAuth redirects)
export const providerLoginSchema = z.object({
  provider: z.enum(['google', 'github', 'facebook'], {
    required_error: 'Invalid provider',
  }),
  redirectTo: z.string().url().optional(),
})

// Types derived from schemas
export type EmailOtpRequestData = z.infer<typeof emailOtpRequestSchema>
export type PhoneOtpRequestData = z.infer<typeof phoneOtpRequestSchema>
export type OtpVerificationData = z.infer<typeof otpVerificationSchema>
export type PhoneOtpVerificationData = z.infer<typeof phoneOtpVerificationSchema>
export type ProviderLoginData = z.infer<typeof providerLoginSchema>
export type OnboardingRoleSelectionData = z.infer<typeof onboardingRoleSelectionSchema>
export type OnboardingPersonalInfoData = z.infer<typeof onboardingPersonalInfoSchema>
export type OnboardingCoachingSelectionData = z.infer<typeof onboardingCoachingSelectionSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type AddressData = z.infer<typeof addressSchema>

// Onboarding validation schemas
export const onboardingRoleSelectionSchema = z.object({
  role: z.enum(['S', 'T', 'C'], {
    required_error: 'Please select a role',
  }),
})

export const onboardingPersonalInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  pin_code: z
    .string()
    .min(6, 'Pin code must be at least 6 characters')
    .max(10, 'Pin code must be less than 10 characters')
    .regex(/^[0-9]+$/, 'Pin code can only contain numbers')
})

export const onboardingCoachingSelectionSchema = z.object({
  coaching_name: z
    .string()
    .min(2, 'Coaching center name must be at least 2 characters')
    .max(100, 'Coaching center name must be less than 100 characters')
    .trim(),
  coaching_category: z.enum([
    'SCHOOL_COACHING',
    'COLLEGE_TUITION',
    'HOME_TUITION',
    'ONLINE_TUITION',
    'COMPETITIVE_EXAM',
    'ENTRANCE_EXAM',
    'TEST_PREPARATION',
    'LANGUAGE_TRAINING',
    'SKILL_DEVELOPMENT',
    'IT_AND_PROGRAMMING',
    'DESIGN_AND_CREATIVE',
    'BUSINESS_AND_MARKETING',
    'ACCOUNTING_AND_FINANCE',
    'HOBBY_CLASSES',
    'MUSIC_AND_DANCE',
    'ART_AND_CRAFT',
    'SPORTS_AND_FITNESS',
    'PROFESSIONAL_CERTIFICATION',
    'GOVERNMENT_EXAM_PREPARATION',
    'UPSC_AND_DEFENCE',
    'BANKING_AND_INSURANCE',
    'MEDICAL_AND_ENGINEERING_ENTRANCE',
    'TUTORING',
    'MENTORSHIP',
    'WORKSHOP_OR_BOOTCAMP',
    'CAREER_COUNSELLING',
    'OTHER'
  ], {
    required_error: 'Please select a coaching category',
  }),
})

// Profile update validation schemas
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  website_url: z
    .string()
    .url('Invalid website URL')
    .optional(),
  linkedin_url: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional(),
  github_url: z
    .string()
    .url('Invalid GitHub URL')
    .optional(),
  twitter_url: z
    .string()
    .url('Invalid Twitter URL')
    .optional(),
  expertise_areas: z
    .array(z.string())
    .optional(),
  years_of_experience: z
    .number()
    .min(0, 'Years of experience cannot be negative')
    .max(100, 'Years of experience cannot exceed 100')
    .optional(),
  hourly_rate: z
    .number()
    .min(0, 'Hourly rate cannot be negative')
    .max(10000, 'Hourly rate cannot exceed 10000')
    .optional(),
  grade_level: z
    .string()
    .optional(),
  subjects_of_interest: z
    .array(z.string())
    .optional(),
  learning_goals: z
    .string()
    .max(1000, 'Learning goals must be less than 1000 characters')
    .optional(),
})

// Address validation schemas
export const addressSchema = z.object({
  address_type: z.enum(['HOME', 'WORK', 'SCHOOL', 'OTHER'], {
    required_error: 'Please select an address type',
  }).optional().default('HOME'),
  label: z
    .string()
    .max(100, 'Label must be less than 100 characters')
    .optional(),
  
  // Required fields
  state: z
    .string()
    .min(1, 'State is required')
    .max(50, 'State name is too long'),
  district: z
    .string()
    .min(1, 'District is required')
    .max(50, 'District name is too long'),
  pin_code: z
    .string()
    .regex(/^[0-9]{6}$/, 'PIN code must be exactly 6 digits'),
  
  // Optional fields
  country: z
    .string()
    .max(50, 'Country name is too long')
    .optional()
    .default('India'),
  address_line_1: z
    .string()
    .max(200, 'Address line 1 is too long')
    .optional(),
  address_line_2: z
    .string()
    .max(200, 'Address line 2 is too long')
    .optional(),
  city: z
    .string()
    .max(50, 'City name is too long')
    .optional(),
  sub_district: z
    .string()
    .max(50, 'Sub-district name is too long')
    .optional(),
  village_town: z
    .string()
    .max(50, 'Village/Town name is too long')
    .optional(),
  
  // Geographic coordinates
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .optional(),
  
  // Google Maps data
  google_maps_url: z
    .string()
    .url('Invalid Google Maps URL')
    .regex(/^https:\/\/(www\.)?google\.(com|co\.in)\/maps/, 'Must be a valid Google Maps URL')
    .optional(),
  google_place_id: z
    .string()
    .optional(),
  google_plus_code: z
    .string()
    .regex(/^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$/, 'Invalid Google Plus Code format')
    .optional(),
  
  // Additional metadata
  postal_address: z
    .string()
    .max(500, 'Postal address is too long')
    .optional(),
  delivery_instructions: z
    .string()
    .max(500, 'Delivery instructions are too long')
    .optional(),
  
  // Status flags
  is_primary: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
})

// Validation error messages configuration
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: {
    required: 'Phone number is required',
    format: 'Please enter a valid phone number with country code',
  },
  otp: {
    length: 'OTP must be 6 digits',
    format: 'OTP must contain only numbers',
  },
  fullName: {
    tooShort: 'Full name must be at least 2 characters',
    format: 'Full name can only contain letters and spaces',
  },
  role: 'Please select a role',
  pinCode: {
    tooShort: 'Pin code must be at least 6 characters',
    format: 'Pin code can only contain numbers',
  },
  username: {
    tooShort: 'Username must be at least 3 characters',
    format: 'Username can only contain letters, numbers, and underscores',
  },
  address: {
    required: (field: string) => `${field} is required`,
    pinCodeFormat: 'PIN code must be exactly 6 digits',
    invalidCoordinates: 'Invalid coordinates',
    invalidGoogleMapsUrl: 'Must be a valid Google Maps URL',
    invalidPlusCode: 'Invalid Google Plus Code format',
  },
} as const

// Helper function to get field error message
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors?.[fieldName]?.message
}

// Helper function to validate form data
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}