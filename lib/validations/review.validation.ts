/**
 * Review Validation Schemas
 * 
 * Zod schemas for validating review-related inputs
 * Used at service level for input validation
 */

import { z } from 'zod';

// ============================================================
// ENUMS
// ============================================================

export const ReviewUserTypeEnum = z.enum(['STUDENT', 'TEACHER', 'COACHING_CENTER', 'ANONYMOUS']);
export const ReviewStatusEnum = z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REMOVED']);
export const RatingScaleEnum = z.enum(['1', '2', '3', '4', '5']);
export const MediaTypeEnum = z.enum(['IMAGE', 'VIDEO']);
export const ReviewSortByEnum = z.enum(['recent', 'helpful', 'highest_rated', 'lowest_rated', 'relevant']);

// ============================================================
// VALIDATION CONSTANTS
// ============================================================

export const REVIEW_VALIDATION = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  COMMENT_MIN_LENGTH: 10,
  COMMENT_MAX_LENGTH: 2000,
  RESPONSE_MIN_LENGTH: 10,
  RESPONSE_MAX_LENGTH: 1000,
  REVIEWER_NAME_MAX_LENGTH: 100,
  REVIEWER_ROLE_MAX_LENGTH: 100,
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

// ============================================================
// CREATE REVIEW SCHEMA
// ============================================================

export const CreateReviewSchema = z.object({
  // Required fields
  coaching_branch_id: z.string().uuid('Invalid branch ID'),
  reviewer_user_type: ReviewUserTypeEnum,
  title: z.string()
    .min(REVIEW_VALIDATION.TITLE_MIN_LENGTH, `Title must be at least ${REVIEW_VALIDATION.TITLE_MIN_LENGTH} characters`)
    .max(REVIEW_VALIDATION.TITLE_MAX_LENGTH, `Title must not exceed ${REVIEW_VALIDATION.TITLE_MAX_LENGTH} characters`)
    .trim(),
  overall_rating: RatingScaleEnum,

  // Optional fields
  comment: z.string()
    .min(REVIEW_VALIDATION.COMMENT_MIN_LENGTH, `Comment must be at least ${REVIEW_VALIDATION.COMMENT_MIN_LENGTH} characters`)
    .max(REVIEW_VALIDATION.COMMENT_MAX_LENGTH, `Comment must not exceed ${REVIEW_VALIDATION.COMMENT_MAX_LENGTH} characters`)
    .trim()
    .optional(),

  // Category ratings
  teaching_quality: RatingScaleEnum.optional(),
  infrastructure: RatingScaleEnum.optional(),
  staff_support: RatingScaleEnum.optional(),
  value_for_money: RatingScaleEnum.optional(),

  // Anonymous review fields
  is_anonymous: z.boolean().optional(),
  reviewer_name_snapshot: z.string()
    .max(REVIEW_VALIDATION.REVIEWER_NAME_MAX_LENGTH)
    .optional(),
  reviewer_role_snapshot: z.string()
    .max(REVIEW_VALIDATION.REVIEWER_ROLE_MAX_LENGTH)
    .optional(),

  // Date when the experience happened
  reviewed_date: z.string().datetime().optional(),
}).refine(
  (data) => {
    // If rating is 1 or 2, comment must be provided
    if (data.overall_rating === '1' || data.overall_rating === '2') {
      return !!data.comment;
    }
    return true;
  },
  {
    message: 'Comment is required for ratings 1 or 2',
    path: ['comment'],
  }
).refine(
  (data) => {
    // If anonymous, reviewer_name_snapshot is required
    if (data.is_anonymous) {
      return !!data.reviewer_name_snapshot;
    }
    return true;
  },
  {
    message: 'Reviewer name snapshot is required for anonymous reviews',
    path: ['reviewer_name_snapshot'],
  }
);

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ============================================================
// UPDATE REVIEW SCHEMA
// ============================================================

export const UpdateReviewSchema = z.object({
  title: z.string()
    .min(REVIEW_VALIDATION.TITLE_MIN_LENGTH)
    .max(REVIEW_VALIDATION.TITLE_MAX_LENGTH)
    .trim()
    .optional(),
  comment: z.string()
    .min(REVIEW_VALIDATION.COMMENT_MIN_LENGTH)
    .max(REVIEW_VALIDATION.COMMENT_MAX_LENGTH)
    .trim()
    .optional(),
  overall_rating: RatingScaleEnum.optional(),
  teaching_quality: RatingScaleEnum.optional(),
  infrastructure: RatingScaleEnum.optional(),
  staff_support: RatingScaleEnum.optional(),
  value_for_money: RatingScaleEnum.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

// ============================================================
// REVIEW SEARCH FILTERS SCHEMA
// ============================================================

export const ReviewSearchFiltersSchema = z.object({
  // Text search
  search_query: z.string().min(2).max(200).optional(),

  // Branch/Center filters
  branch_id: z.string().uuid().optional(),
  center_id: z.string().uuid().optional(),

  // Location filters
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),

  // Rating filters
  min_rating: z.number().min(1).max(5).optional(),
  max_rating: z.number().min(1).max(5).optional(),

  // Feature filters
  has_media: z.boolean().optional(),
  is_verified: z.boolean().optional(),

  // Time filters
  days_ago: z.number().min(1).max(365).optional(),

  // Sorting
  sort_by: ReviewSortByEnum.optional(),
}).refine(
  (data) => {
    // If both min and max rating provided, min should be <= max
    if (data.min_rating !== undefined && data.max_rating !== undefined) {
      return data.min_rating <= data.max_rating;
    }
    return true;
  },
  {
    message: 'Minimum rating must be less than or equal to maximum rating',
    path: ['min_rating'],
  }
);

export type ReviewSearchFilters = z.infer<typeof ReviewSearchFiltersSchema>;

// ============================================================
// REVIEW MEDIA SCHEMA
// ============================================================

export const AddReviewMediaSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  media_url: z.string().url('Invalid media URL'),
  media_type: MediaTypeEnum,
  display_order: z.number().min(0).max(100).optional(),
});

export type AddReviewMediaInput = z.infer<typeof AddReviewMediaSchema>;

// ============================================================
// REVIEW RESPONSE SCHEMA
// ============================================================

export const CreateReviewResponseSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  response_text: z.string()
    .min(REVIEW_VALIDATION.RESPONSE_MIN_LENGTH, `Response must be at least ${REVIEW_VALIDATION.RESPONSE_MIN_LENGTH} characters`)
    .max(REVIEW_VALIDATION.RESPONSE_MAX_LENGTH, `Response must not exceed ${REVIEW_VALIDATION.RESPONSE_MAX_LENGTH} characters`)
    .trim(),
  is_public: z.boolean().optional(),
});

export type CreateReviewResponseInput = z.infer<typeof CreateReviewResponseSchema>;

// ============================================================
// HELPFUL VOTE SCHEMA
// ============================================================

export const HelpfulVoteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
});

export type HelpfulVoteInput = z.infer<typeof HelpfulVoteSchema>;

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validate review title
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  try {
    z.string()
      .min(REVIEW_VALIDATION.TITLE_MIN_LENGTH)
      .max(REVIEW_VALIDATION.TITLE_MAX_LENGTH)
      .parse(title);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid title' };
  }
}

/**
 * Validate review comment
 */
export function validateComment(comment: string): { valid: boolean; error?: string } {
  try {
    z.string()
      .min(REVIEW_VALIDATION.COMMENT_MIN_LENGTH)
      .max(REVIEW_VALIDATION.COMMENT_MAX_LENGTH)
      .parse(comment);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid comment' };
  }
}

/**
 * Validate rating value
 */
export function validateRating(rating: string | number): { valid: boolean; error?: string } {
  try {
    RatingScaleEnum.parse(String(rating));
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }
}

/**
 * Validate response text
 */
export function validateResponseText(text: string): { valid: boolean; error?: string } {
  try {
    z.string()
      .min(REVIEW_VALIDATION.RESPONSE_MIN_LENGTH)
      .max(REVIEW_VALIDATION.RESPONSE_MAX_LENGTH)
      .parse(text);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid response text' };
  }
}

/**
 * Check if comment is required based on rating
 */
export function isCommentRequired(rating: string | number): boolean {
  const ratingNum = typeof rating === 'string' ? rating : String(rating);
  return ratingNum === '1' || ratingNum === '2';
}
