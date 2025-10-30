/**
 * Coaching Validation Schemas
 * 
 * Comprehensive Zod validation schemas for coaching center and branch operations
 */

import { z } from 'zod';
import { CoachingCategory, CoachingStatus } from '@/lib/schema/coaching.types';

/**
 * Validation limits
 */
const LIMITS = {
    NAME_MIN: 3,
    NAME_MAX: 200,
    DESCRIPTION_MAX: 2000,
    SLUG_MIN: 3,
    SLUG_MAX: 100,
    PHONE_MIN: 10,
    PHONE_MAX: 15,
    SUBJECTS_MAX: 50,
    TARGET_AUDIENCE_MAX: 20,
    ESTABLISHED_YEAR_MIN: 1900,
    ESTABLISHED_YEAR_MAX: new Date().getFullYear(),
} as const;

/**
 * Regular expressions
 */
const VALIDATION_REGEX = {
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
} as const;

/**
 * Coaching category schema
 */
export const coachingCategorySchema = z.enum([
    'SCHOOL_COACHING', 'COLLEGE_TUITION', 'HOME_TUITION', 'ONLINE_TUITION',
    'COMPETITIVE_EXAM', 'ENTRANCE_EXAM', 'TEST_PREPARATION',
    'LANGUAGE_TRAINING', 'SKILL_DEVELOPMENT', 'IT_AND_PROGRAMMING',
    'DESIGN_AND_CREATIVE', 'BUSINESS_AND_MARKETING', 'ACCOUNTING_AND_FINANCE',
    'HOBBY_CLASSES', 'MUSIC_AND_DANCE', 'ART_AND_CRAFT', 'SPORTS_AND_FITNESS',
    'PROFESSIONAL_CERTIFICATION', 'GOVERNMENT_EXAM_PREPARATION', 'UPSC_AND_DEFENCE',
    'BANKING_AND_INSURANCE', 'MEDICAL_AND_ENGINEERING_ENTRANCE',
    'TUTORING', 'MENTORSHIP', 'WORKSHOP_OR_BOOTCAMP', 'CAREER_COUNSELLING', 'OTHER'
], {
    errorMap: () => ({ message: 'Invalid coaching category' })
});

/**
 * Coaching status schema
 */
export const coachingStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Invalid status' })
});

/**
 * Name validation schema
 */
export const coachingNameSchema = z
    .string()
    .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
    .max(LIMITS.NAME_MAX, `Name must be no more than ${LIMITS.NAME_MAX} characters`)
    .refine(
        (name) => name.trim().length >= LIMITS.NAME_MIN,
        'Name cannot be only whitespace'
    );

/**
 * Slug validation schema
 */
export const slugSchema = z
    .string()
    .min(LIMITS.SLUG_MIN, `Slug must be at least ${LIMITS.SLUG_MIN} characters`)
    .max(LIMITS.SLUG_MAX, `Slug must be no more than ${LIMITS.SLUG_MAX} characters`)
    .regex(VALIDATION_REGEX.SLUG, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .refine(
        (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
        'Slug cannot start or end with a hyphen'
    )
    .refine(
        (slug) => !slug.includes('--'),
        'Slug cannot contain consecutive hyphens'
    );

/**
 * Description validation schema
 */
export const descriptionSchema = z
    .string()
    .max(LIMITS.DESCRIPTION_MAX, `Description must be no more than ${LIMITS.DESCRIPTION_MAX} characters`);

/**
 * Phone validation schema
 */
export const phoneSchema = z
    .string()
    .regex(VALIDATION_REGEX.PHONE, 'Invalid phone number format')
    .refine(
        (phone) => phone.length >= LIMITS.PHONE_MIN && phone.length <= LIMITS.PHONE_MAX,
        `Phone number must be between ${LIMITS.PHONE_MIN} and ${LIMITS.PHONE_MAX} digits`
    );

/**
 * Email validation schema
 */
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .regex(VALIDATION_REGEX.EMAIL, 'Invalid email format');

/**
 * URL validation schema
 */
export const urlSchema = z
    .string()
    .url('Invalid URL format')
    .regex(VALIDATION_REGEX.URL, 'URL must start with http:// or https://');

/**
 * Established year validation schema
 */
export const establishedYearSchema = z
    .number()
    .int('Year must be a whole number')
    .min(LIMITS.ESTABLISHED_YEAR_MIN, `Year cannot be before ${LIMITS.ESTABLISHED_YEAR_MIN}`)
    .max(LIMITS.ESTABLISHED_YEAR_MAX, `Year cannot be in the future`);

/**
 * Subjects array validation schema
 */
export const subjectsSchema = z
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
 * Target audience array validation schema
 */
export const targetAudienceSchema = z
    .array(z.string().min(1, 'Audience cannot be empty').max(50, 'Audience name is too long'))
    .max(LIMITS.TARGET_AUDIENCE_MAX, `You can add up to ${LIMITS.TARGET_AUDIENCE_MAX} target audiences`)
    .refine(
        (audience) => {
            const unique = new Set(audience.map(a => a.toLowerCase()));
            return unique.size === audience.length;
        },
        'Duplicate target audiences are not allowed'
    );

/**
 * Coaching center creation validation schema
 */
export const coachingCenterCreateSchema = z.object({
    name: coachingNameSchema,
    description: descriptionSchema.nullable().optional(),
    established_year: establishedYearSchema.nullable().optional(),
    logo_url: z.string().url().nullable().optional(),
    cover_url: z.string().url().nullable().optional(),
    category: coachingCategorySchema,
    subjects: subjectsSchema.nullable().optional(),
    target_audience: targetAudienceSchema.nullable().optional(),
    manager_id: z.string().uuid().nullable().optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    email: emailSchema.nullable().optional().or(z.literal('')),
    website: urlSchema.nullable().optional().or(z.literal('')),
    status: coachingStatusSchema.optional(),
    metadata: z.record(z.any()).nullable().optional(),
});

/**
 * Coaching center update validation schema
 */
export const coachingCenterUpdateSchema = z.object({
    name: coachingNameSchema.optional(),
    slug: slugSchema.nullable().optional(),
    description: descriptionSchema.nullable().optional(),
    established_year: establishedYearSchema.nullable().optional(),
    logo_url: z.string().url().nullable().optional(),
    cover_url: z.string().url().nullable().optional(),
    category: coachingCategorySchema.optional(),
    subjects: subjectsSchema.nullable().optional(),
    target_audience: targetAudienceSchema.nullable().optional(),
    manager_id: z.string().uuid().nullable().optional(),
    status: coachingStatusSchema.optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    email: emailSchema.nullable().optional().or(z.literal('')),
    website: urlSchema.nullable().optional().or(z.literal('')),
    is_verified: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    metadata: z.record(z.any()).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
);

/**
 * Coaching center form validation schema
 */
export const coachingCenterFormSchema = z.object({
    name: coachingNameSchema,
    description: z.string().max(LIMITS.DESCRIPTION_MAX).nullable().optional(),
    established_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
    category: coachingCategorySchema,
    subjects: z.array(z.string()).nullable().optional(),
    target_audience: z.array(z.string()).nullable().optional(),
    phone: z.string().nullable().optional().or(z.literal('')),
    email: z.string().email().nullable().optional().or(z.literal('')),
    website: z.string().url().nullable().optional().or(z.literal('')),
    status: coachingStatusSchema.optional(),
});

/**
 * Coaching branch creation validation schema
 */
export const coachingBranchCreateSchema = z.object({
    coaching_center_id: z.string().uuid('Invalid coaching center ID'),
    name: coachingNameSchema,
    description: descriptionSchema.nullable().optional(),
    manager_id: z.string().uuid().nullable().optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    email: emailSchema.nullable().optional().or(z.literal('')),
    is_main_branch: z.boolean().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.any()).nullable().optional(),
});

/**
 * Coaching branch update validation schema
 */
export const coachingBranchUpdateSchema = z.object({
    name: coachingNameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    manager_id: z.string().uuid().nullable().optional(),
    phone: phoneSchema.nullable().optional().or(z.literal('')),
    email: emailSchema.nullable().optional().or(z.literal('')),
    is_main_branch: z.boolean().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.any()).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
);

/**
 * Coaching branch form validation schema
 */
export const coachingBranchFormSchema = z.object({
    name: coachingNameSchema,
    description: z.string().max(LIMITS.DESCRIPTION_MAX).nullable().optional(),
    phone: z.string().nullable().optional().or(z.literal('')),
    email: z.string().email().nullable().optional().or(z.literal('')),
    is_main_branch: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

/**
 * Utility functions
 */
export const validateSlugFormat = (slug: string): { valid: boolean; error?: string } => {
    try {
        slugSchema.parse(slug);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0]?.message || 'Invalid slug' };
        }
        return { valid: false, error: 'Invalid slug' };
    }
};

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
 * Export validation limits
 */
export { LIMITS as COACHING_VALIDATION_LIMITS };

/**
 * Export regex patterns
 */
export { VALIDATION_REGEX as COACHING_VALIDATION_REGEX };
