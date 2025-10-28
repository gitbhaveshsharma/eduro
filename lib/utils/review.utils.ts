/**
 * Review Utility Functions
 * 
 * Helper functions for review display, validation, filtering, and analytics
 */

import type { Review, ReviewWithDetails, RatingSummaryResponse } from '../schema/review.types';

// ============================================================
// DISPLAY UTILITIES
// ============================================================

export class ReviewDisplayUtils {
  /**
   * Get reviewer display name (handles anonymous reviews)
   */
  static getReviewerName(review: {
    is_anonymous: boolean;
    reviewer_name_snapshot: string | null;
  }): string {
    if (review.is_anonymous) {
      return review.reviewer_name_snapshot || 'Anonymous User';
    }
    return review.reviewer_name_snapshot || 'User';
  }

  /**
   * Format rating as stars
   */
  static formatRatingStars(rating: string | number): string {
    const num = typeof rating === 'string' ? parseInt(rating) : rating;
    return '★'.repeat(num) + '☆'.repeat(5 - num);
  }

  /**
   * Get rating color class
   */
  static getRatingColor(rating: string | number): string {
    const num = typeof rating === 'string' ? parseInt(rating) : rating;
    if (num >= 4) return 'text-green-600';
    if (num >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Format time ago
   */
  static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  }

  /**
   * Format review date
   */
  static formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get rating summary text
   */
  static getRatingSummaryText(summary: {
    average_rating: number;
    total_reviews: number;
  }): string {
    return `${summary.average_rating.toFixed(1)} out of 5 stars (${summary.total_reviews} ${
      summary.total_reviews === 1 ? 'review' : 'reviews'
    })`;
  }

  /**
   * Calculate rating percentage
   */
  static calculateRatingPercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

export class ReviewValidationUtils {
  /**
   * Check if review can be edited (within 24 hours)
   */
  static canEdit(createdAt: string): boolean {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = now - created;
    return diffMs < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Check if review can be deleted (within 1 hour)
   */
  static canDelete(createdAt: string): boolean {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = now - created;
    return diffMs < 1 * 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get time remaining for edit
   */
  static getEditTimeRemaining(createdAt: string): string {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const editWindowEnd = created + (24 * 60 * 60 * 1000);
    const remainingMs = editWindowEnd - now;

    if (remainingMs <= 0) return 'Expired';

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }

  /**
   * Validate rating value
   */
  static isValidRating(rating: any): boolean {
    return ['1', '2', '3', '4', '5'].includes(String(rating));
  }

  /**
   * Validate title length
   */
  static isValidTitle(title: string): { valid: boolean; error?: string } {
    if (!title || title.trim().length < 5) {
      return { valid: false, error: 'Title must be at least 5 characters' };
    }
    if (title.length > 200) {
      return { valid: false, error: 'Title must not exceed 200 characters' };
    }
    return { valid: true };
  }

  /**
   * Validate comment length
   */
  static isValidComment(comment: string): { valid: boolean; error?: string } {
    if (!comment || comment.trim().length < 10) {
      return { valid: false, error: 'Comment must be at least 10 characters' };
    }
    if (comment.length > 2000) {
      return { valid: false, error: 'Comment must not exceed 2000 characters' };
    }
    return { valid: true };
  }
}

// ============================================================
// FILTER UTILITIES
// ============================================================

export class ReviewFilterUtils {
  /**
   * Build location-based filter
   */
  static buildLocationFilter(
    state?: string,
    district?: string,
    city?: string
  ): {
    state?: string;
    district?: string;
    city?: string;
  } {
    return {
      state,
      district,
      city
    };
  }

  /**
   * Build rating filter
   */
  static buildRatingFilter(minRating: number, maxRating?: number): {
    min_rating: number;
    max_rating?: number;
  } {
    return {
      min_rating: minRating,
      max_rating: maxRating || 5
    };
  }

  /**
   * Build verified reviews filter
   */
  static buildVerifiedFilter(): {
    is_verified: boolean;
  } {
    return {
      is_verified: true
    };
  }

  /**
   * Build recent reviews filter
   */
  static buildRecentFilter(daysAgo: number = 30): {
    days_ago: number;
    sort_by: 'recent';
  } {
    return {
      days_ago: daysAgo,
      sort_by: 'recent'
    };
  }

  /**
   * Build media reviews filter
   */
  static buildMediaFilter(): {
    has_media: boolean;
  } {
    return {
      has_media: true
    };
  }

  /**
   * Combine multiple filters
   */
  static combineFilters(...filters: any[]): any {
    return Object.assign({}, ...filters);
  }
}

// ============================================================
// ANALYTICS UTILITIES
// ============================================================

export class ReviewAnalyticsUtils {
  /**
   * Calculate average from category ratings
   */
  static calculateCategoryAverage(ratings: {
    teaching_quality: number | null;
    infrastructure: number | null;
    staff_support: number | null;
    value_for_money: number | null;
  }): number {
    const values = Object.values(ratings).filter(v => v !== null) as number[];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get rating distribution percentages
   */
  static getRatingDistribution(breakdown: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  }) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return {
      5: ReviewDisplayUtils.calculateRatingPercentage(breakdown['5'], total),
      4: ReviewDisplayUtils.calculateRatingPercentage(breakdown['4'], total),
      3: ReviewDisplayUtils.calculateRatingPercentage(breakdown['3'], total),
      2: ReviewDisplayUtils.calculateRatingPercentage(breakdown['2'], total),
      1: ReviewDisplayUtils.calculateRatingPercentage(breakdown['1'], total)
    };
  }

  /**
   * Determine rating trend
   */
  static getRatingTrend(
    recentActivity: number,
    totalReviews: number
  ): 'trending' | 'stable' | 'slow' {
    const recentPercentage = (recentActivity / totalReviews) * 100;
    if (recentPercentage >= 30) return 'trending';
    if (recentPercentage >= 10) return 'stable';
    return 'slow';
  }

  /**
   * Get trust score based on verified reviews
   */
  static getTrustScore(
    verifiedCount: number,
    totalCount: number
  ): { score: number; label: string } {
    if (totalCount === 0) return { score: 0, label: 'No Reviews' };
    
    const percentage = (verifiedCount / totalCount) * 100;
    
    if (percentage >= 70) return { score: 100, label: 'Highly Trusted' };
    if (percentage >= 50) return { score: 75, label: 'Trusted' };
    if (percentage >= 30) return { score: 50, label: 'Moderately Trusted' };
    return { score: 25, label: 'Limited Trust' };
  }
}

// ============================================================
// TIME WINDOW CONSTANTS
// ============================================================

export const REVIEW_TIME_WINDOWS = {
  EDIT_WINDOW: 24 * 60 * 60 * 1000,    // 24 hours in milliseconds
  DELETE_WINDOW: 1 * 60 * 60 * 1000,   // 1 hour in milliseconds
  RESPONSE_WINDOW: 180 * 24 * 60 * 60 * 1000, // 180 days in milliseconds
} as const;
