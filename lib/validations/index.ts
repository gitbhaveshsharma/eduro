/**
 * Validation Exports
 * 
 * Central export point for all validation schemas
 */

// Profile validations
export * from './profile.validation';

// Address validations
export * from './address.validation';

// Coaching validations (specific exports to avoid conflicts)
export {
    coachingCategorySchema,
    coachingStatusSchema,
    coachingNameSchema,
    slugSchema,
    descriptionSchema,
    establishedYearSchema,
    subjectsSchema,
    targetAudienceSchema,
    coachingCenterCreateSchema,
    coachingCenterUpdateSchema,
    coachingCenterFormSchema,
    coachingBranchCreateSchema,
    coachingBranchUpdateSchema,
    coachingBranchFormSchema,
    validateSlugFormat,
    COACHING_VALIDATION_LIMITS,
    COACHING_VALIDATION_REGEX,
} from './coaching.validation';
