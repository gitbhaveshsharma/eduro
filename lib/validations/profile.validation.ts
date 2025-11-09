/**
 * Profile Validation Schemas
 * 
 * Comprehensive Zod validation schemas for profile-related operations
 * Centralized validation logic for consistency across the application
 */

import { z } from 'zod';
import { UserRole, OnboardingLevel } from '@/lib/schema/profile.types';

/**
 * Reserved usernames that cannot be used
 */
const RESERVED_USERNAMES = [
    'admin', 'administrator', 'root', 'api', 'www', 'mail',
    'support', 'help', 'about', 'contact', 'settings', 'profile',
    'user', 'users', 'account', 'accounts', 'dashboard', 'login',
    'logout', 'signup', 'signin', 'register', 'auth', 'oauth',
    'tutrsy', 'system', 'moderator', 'mod', 'staff'
];

/**
 * Regular Expressions for validation
 */
const VALIDATION_REGEX = {
    USERNAME: /^[a-zA-Z0-9_]+$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    URL: /^https?:\/\/.+/,
    LINKEDIN: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
    GITHUB: /^https?:\/\/(www\.)?github\.com\/.+/,
    TWITTER: /^https?:\/\/(www\.)?(twitter|x)\.com\/.+/,
} as const;

/**
 * Validation limits
 */
const LIMITS = {
    USERNAME_MIN: 3,
    USERNAME_MAX: 20,
    NAME_MIN: 2,
    NAME_MAX: 100,
    BIO_MAX: 500,
    LEARNING_GOALS_MAX: 1000,
    EXPERIENCE_MIN: 0,
    EXPERIENCE_MAX: 100,
    HOURLY_RATE_MIN: 0,
    HOURLY_RATE_MAX: 100000,
    EXPERTISE_MAX: 20,
    SUBJECTS_MAX: 20,
} as const;

/**
 * Username validation schema
 */
export const usernameSchema = z
    .string()
    .min(LIMITS.USERNAME_MIN, `Username must be at least ${LIMITS.USERNAME_MIN} characters`)
    .max(LIMITS.USERNAME_MAX, `Username must be no more than ${LIMITS.USERNAME_MAX} characters`)
    .regex(VALIDATION_REGEX.USERNAME, 'Username can only contain letters, numbers, and underscores')
    .refine(
        (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
        'This username is reserved and cannot be used'
    )
    .refine(
        (username) => !/^[0-9]+$/.test(username),
        'Username cannot be only numbers'
    );

/**
 * Full name validation schema
 */
export const fullNameSchema = z
    .string()
    .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
    .max(LIMITS.NAME_MAX, `Name must be no more than ${LIMITS.NAME_MAX} characters`)
    .refine(
        (name) => name.trim().length >= LIMITS.NAME_MIN,
        'Name cannot be only whitespace'
    );

/**
 * Bio validation schema
 */
export const bioSchema = z
    .string()
    .max(LIMITS.BIO_MAX, `Bio must be no more than ${LIMITS.BIO_MAX} characters`)
    .optional();

/**
 * Phone number validation schema
 */
export const phoneSchema = z
    .string()
    .regex(VALIDATION_REGEX.PHONE, 'Invalid phone number format. Use international format (e.g., +1234567890)')
    .refine(
        (phone) => phone.length >= 10 && phone.length <= 15,
        'Phone number must be between 10 and 15 digits'
    );

/**
 * Email validation schema
 */
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .min(5, 'Email is too short')
    .max(255, 'Email is too long')
    .toLowerCase();

/**
 * URL validation schema
 */
export const urlSchema = z
    .string()
    .url('Invalid URL format')
    .regex(VALIDATION_REGEX.URL, 'URL must start with http:// or https://');

/**
 * LinkedIn URL validation schema
 */
export const linkedinUrlSchema = z
    .string()
    .url('Invalid LinkedIn URL')
    .regex(VALIDATION_REGEX.LINKEDIN, 'Must be a valid LinkedIn profile URL');

/**
 * GitHub URL validation schema
 */
export const githubUrlSchema = z
    .string()
    .url('Invalid GitHub URL')
    .regex(VALIDATION_REGEX.GITHUB, 'Must be a valid GitHub profile URL');

/**
 * Twitter/X URL validation schema
 */
export const twitterUrlSchema = z
    .string()
    .url('Invalid Twitter/X URL')
    .regex(VALIDATION_REGEX.TWITTER, 'Must be a valid Twitter or X profile URL');

/**
 * Expertise areas validation schema
 */
export const expertiseAreasSchema = z
    .array(z.string().min(1, 'Area cannot be empty').max(50, 'Area name is too long'))
    .max(LIMITS.EXPERTISE_MAX, `You can add up to ${LIMITS.EXPERTISE_MAX} expertise areas`)
    .refine(
        (areas) => {
            const unique = new Set(areas.map(a => a.toLowerCase()));
            return unique.size === areas.length;
        },
        'Duplicate expertise areas are not allowed'
    );

/**
 * Subjects of interest validation schema
 */
export const subjectsOfInterestSchema = z
    .array(z.string().min(1, 'Subject cannot be empty').max(50, 'Subject name is too long'))
    .max(LIMITS.SUBJECTS_MAX, `You can add up to ${LIMITS.SUBJECTS_MAX} subjects`)
    .refine(
        (subjects) => {
            const unique = new Set(subjects.map(s => s.toLowerCase()));
            return unique.size === subjects.length;
        },
        'Duplicate subjects are not allowed'
    );

/**
 * Years of experience validation schema
 */
export const yearsOfExperienceSchema = z
    .number()
    .int('Years of experience must be a whole number')
    .min(LIMITS.EXPERIENCE_MIN, `Years of experience cannot be negative`)
    .max(LIMITS.EXPERIENCE_MAX, `Years of experience cannot exceed ${LIMITS.EXPERIENCE_MAX}`);

/**
 * Hourly rate validation schema
 */
export const hourlyRateSchema = z
    .number()
    .min(LIMITS.HOURLY_RATE_MIN, 'Hourly rate cannot be negative')
    .max(LIMITS.HOURLY_RATE_MAX, `Hourly rate cannot exceed ₹${LIMITS.HOURLY_RATE_MAX.toLocaleString()}`);

/**
 * Grade level validation schema
 */
export const gradeLevelSchema = z
    .string()
    .min(1, 'Grade level cannot be empty')
    .max(50, 'Grade level is too long');

/**
 * Learning goals validation schema
 */
export const learningGoalsSchema = z
    .string()
    .max(LIMITS.LEARNING_GOALS_MAX, `Learning goals must be no more than ${LIMITS.LEARNING_GOALS_MAX} characters`);

/**
 * Role validation schema
 */
export const roleSchema = z.enum(['SA', 'A', 'S', 'T', 'C'], {
    errorMap: () => ({ message: 'Invalid role' })
});

/**
 * Onboarding level validation schema
 */
export const onboardingLevelSchema = z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], {
    errorMap: () => ({ message: 'Invalid onboarding level' })
});

/**
 * Timezone validation schema
 */
export const timezoneSchema = z
    .string()
    .min(1, 'Timezone is required')
    .refine(
        (tz) => {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: tz });
                return true;
            } catch {
                return false;
            }
        },
        'Invalid timezone'
    );

/**
 * Language preference validation schema
 */
export const languagePreferenceSchema = z.enum([
    'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'or'
], {
    errorMap: () => ({ message: 'Invalid language preference' })
});

/**
 * Profile creation validation schema
 */
export const profileCreateSchema = z.object({
    id: z.string().uuid('Invalid user ID'),
    email: emailSchema,
    role: roleSchema.optional(),
    full_name: fullNameSchema.optional(),
    username: usernameSchema.optional(),
    bio: bioSchema.nullable().optional(),
    avatar_url: z.string().url().optional(),
    phone: phoneSchema.nullable().optional(),
    timezone: z.string().optional(),
});

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
    full_name: fullNameSchema.nullable().optional(),
    username: usernameSchema.nullable().optional(),
    bio: bioSchema.nullable().optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    timezone: timezoneSchema.optional(),
    language_preference: languagePreferenceSchema.optional(),

    // Social links
    website_url: urlSchema.nullable().optional().or(z.literal('')),
    linkedin_url: linkedinUrlSchema.nullable().optional().or(z.literal('')),
    github_url: githubUrlSchema.nullable().optional().or(z.literal('')),
    twitter_url: twitterUrlSchema.nullable().optional().or(z.literal('')),

    // Notification preferences
    email_notifications: z.boolean().optional(),
    push_notifications: z.boolean().optional(),
    chat_notifications: z.boolean().optional(),
    whatsapp_notifications: z.boolean().optional(),
    sms_notifications: z.boolean().optional(),

    // Role-specific fields for Teachers/Coaches
    expertise_areas: expertiseAreasSchema.nullable().optional(),
    years_of_experience: yearsOfExperienceSchema.nullable().optional(),
    hourly_rate: hourlyRateSchema.nullable().optional(),

    // Role-specific fields for Students
    grade_level: gradeLevelSchema.nullable().optional(),
    subjects_of_interest: subjectsOfInterestSchema.nullable().optional(),
    learning_goals: learningGoalsSchema.nullable().optional(),
}).refine(
    (data) => {
        // At least one field must be provided for update
        return Object.keys(data).length > 0;
    },
    'At least one field must be provided for update'
);

/**
 * Profile form validation schema (for forms)
 */
export const profileFormSchema = z.object({
    full_name: fullNameSchema.nullable().optional(),
    username: usernameSchema.nullable().optional(),
    bio: bioSchema.nullable().optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    timezone: z.string().optional(),
    language_preference: z.string().optional(),

    // Role-specific fields for Teachers/Coaches
    expertise_areas: z.array(z.string()).nullable().optional(),
    years_of_experience: z.number().min(0).max(100).nullable().optional(),
    hourly_rate: z.number().min(0).max(10000).nullable().optional(),

    // Role-specific fields for Students
    grade_level: z.string().nullable().optional(),
    subjects_of_interest: z.array(z.string()).nullable().optional(),
    learning_goals: z.string().max(1000).nullable().optional(),
});

/**
 * Social links validation schema
 */
export const socialLinksSchema = z.object({
    website_url: urlSchema.nullable().optional().or(z.literal('')),
    linkedin_url: linkedinUrlSchema.nullable().optional().or(z.literal('')),
    github_url: githubUrlSchema.nullable().optional().or(z.literal('')),
    twitter_url: twitterUrlSchema.nullable().optional().or(z.literal('')),
});

/**
 * Notification preferences validation schema
 */
export const notificationPreferencesSchema = z.object({
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    chat_notifications: z.boolean(),
    whatsapp_notifications: z.boolean(),
    sms_notifications: z.boolean(),
});

/**
 * Teacher/Coach profile validation schema
 */
export const teacherProfileSchema = z.object({
    expertise_areas: expertiseAreasSchema,
    years_of_experience: yearsOfExperienceSchema,
    hourly_rate: hourlyRateSchema.optional(),
});

/**
 * Student profile validation schema
 */
export const studentProfileSchema = z.object({
    grade_level: gradeLevelSchema,
    subjects_of_interest: subjectsOfInterestSchema,
    learning_goals: learningGoalsSchema.optional(),
});

/**
 * Avatar update validation schema
 */
export const avatarUpdateSchema = z.object({
    file: z.instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
        .refine(
            (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
            'File must be an image (JPEG, PNG, WebP, or GIF)'
        ),
});

/**
 * Profile search filters validation schema
 */
export const profileSearchFiltersSchema = z.object({
    role: z.union([roleSchema, z.array(roleSchema)]).optional(),
    is_online: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    is_active: z.boolean().optional(),
    expertise_areas: z.array(z.string()).optional(),
    subjects_of_interest: z.array(z.string()).optional(),
    grade_level: z.string().optional(),
    min_reputation: z.number().min(0).optional(),
    search_query: z.string().max(100).optional(),
});

/**
 * Utility function to validate username availability
 */
export const validateUsernameFormat = (username: string): { valid: boolean; error?: string } => {
    try {
        usernameSchema.parse(username);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid username' };
        }
        return { valid: false, error: 'Invalid username' };
    }
};

/**
 * Utility function to validate email format
 */
export const validateEmailFormat = (email: string): { valid: boolean; error?: string } => {
    try {
        emailSchema.parse(email);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid email' };
        }
        return { valid: false, error: 'Invalid email' };
    }
};

/**
 * Utility function to validate phone format
 */
export const validatePhoneFormat = (phone: string): { valid: boolean; error?: string } => {
    try {
        phoneSchema.parse(phone);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid phone number' };
        }
        return { valid: false, error: 'Invalid phone number' };
    }
};

/**
 * Utility function to validate URL format
 */
export const validateUrlFormat = (url: string): { valid: boolean; error?: string } => {
    try {
        urlSchema.parse(url);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid URL' };
        }
        return { valid: false, error: 'Invalid URL' };
    }
};

/**
 * Export validation limits for UI components
 */
export { LIMITS as PROFILE_VALIDATION_LIMITS };

/**
 * Export regex patterns for custom validation
 */
export { VALIDATION_REGEX as PROFILE_VALIDATION_REGEX };

/**
 * Export reserved usernames list
 */
export { RESERVED_USERNAMES as PROFILE_RESERVED_USERNAMES };
