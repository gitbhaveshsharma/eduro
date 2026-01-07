/**
 * Coaching Utilities
 * 
 * Helper functions and utilities for coaching-related operations
 * Includes formatters, validators, calculators, and other utility functions
 */

import type {
  CoachingCenter,
  CoachingBranch,
  PublicCoachingCenter,
  PublicCoachingBranch,
  CoachingCategory,
  CoachingStatus,
  CoachingCategoryGroup,
  CoachingCategoryMeta,
  CoachingContactInfo,
  CoachingMediaInfo,
  CoachingBusinessInfo
} from '../schema/coaching.types';

import { COACHING_CATEGORY_METADATA } from '../schema/coaching.types';

/**
 * Coaching Display Utilities
 */
export class CoachingDisplayUtils {
  /**
   * Get display name for a coaching center
   */
  static getDisplayName(center: Partial<CoachingCenter | PublicCoachingCenter>): string {
    if (center.name && center.name.trim()) {
      return center.name.trim();
    }

    return 'Unnamed Coaching Center';
  }

  /**
   * Get initials from coaching center name
   */
  static getInitials(center: Partial<CoachingCenter | PublicCoachingCenter>): string {
    const displayName = this.getDisplayName(center);

    const words = displayName.split(' ').filter(word => word.length > 0);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Get category display name
   */
  static getCategoryDisplayName(category: CoachingCategory): string {
    return COACHING_CATEGORY_METADATA[category]?.label || category.replace(/_/g, ' ');
  }

  /**
   * Get category description
   */
  static getCategoryDescription(category: CoachingCategory): string {
    return COACHING_CATEGORY_METADATA[category]?.description || '';
  }

  /**
   * Get category icon
   */
  static getCategoryIcon(category: CoachingCategory): string {
    return COACHING_CATEGORY_METADATA[category]?.icon || '📚';
  }

  /**
   * Get category color
   */
  static getCategoryColor(category: CoachingCategory): string {
    return COACHING_CATEGORY_METADATA[category]?.color || 'gray';
  }

  /**
   * Get category group
   */
  static getCategoryGroup(category: CoachingCategory): CoachingCategoryGroup {
    return COACHING_CATEGORY_METADATA[category]?.group || 'COACHING_TYPE';
  }

  /**
   * Get status display name
   */
  static getStatusDisplayName(status: CoachingStatus): string {
    const statusMap: Record<CoachingStatus, string> = {
      'DRAFT': 'Draft',
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive'
    };

    return statusMap[status] || status;
  }

  /**
   * Get status color/badge style
   */
  static getStatusColor(status: CoachingStatus): string {
    const colorMap: Record<CoachingStatus, string> = {
      'DRAFT': 'yellow',
      'ACTIVE': 'green',
      'INACTIVE': 'red'
    };

    return colorMap[status] || 'gray';
  }

  /**
   * Format established year display
   */
  static formatEstablishedYear(establishedYear: number | null): string {
    if (!establishedYear) return 'Not specified';

    const currentYear = new Date().getFullYear();
    const years = currentYear - establishedYear;

    if (years <= 0) return `Established ${establishedYear}`;
    if (years === 1) return `Established ${establishedYear} (1 year)`;
    return `Established ${establishedYear} (${years} years)`;
  }

  /**
   * Format subjects list for display
   */
  static formatSubjects(subjects: string[] | null, maxDisplay: number = 3): string {
    if (!subjects || subjects.length === 0) {
      return 'No subjects listed';
    }

    if (subjects.length <= maxDisplay) {
      return subjects.join(', ');
    }

    const displayed = subjects.slice(0, maxDisplay);
    const remaining = subjects.length - maxDisplay;
    return `${displayed.join(', ')} +${remaining} more`;
  }

  /**
   * Format target audience for display
   */
  static formatTargetAudience(targetAudience: string[] | null, maxDisplay: number = 2): string {
    if (!targetAudience || targetAudience.length === 0) {
      return 'All levels';
    }

    if (targetAudience.length <= maxDisplay) {
      return targetAudience.join(', ');
    }

    const displayed = targetAudience.slice(0, maxDisplay);
    const remaining = targetAudience.length - maxDisplay;
    return `${displayed.join(', ')} +${remaining} more`;
  }

  /**
   * Get verification status display
   */
  static getVerificationStatus(isVerified: boolean): { label: string; color: string; icon: string } {
    return isVerified
      ? { label: 'Verified', color: 'green', icon: '✓' }
      : { label: 'Unverified', color: 'gray', icon: '?' };
  }

  /**
   * Get featured status display
   */
  static getFeaturedStatus(isFeatured: boolean): { label: string; color: string; icon: string } {
    return isFeatured
      ? { label: 'Featured', color: 'yellow', icon: '⭐' }
      : { label: 'Standard', color: 'gray', icon: '' };
  }

  /**
   * Format branch count display
   */
  static formatBranchCount(totalBranches?: number, activeBranches?: number): string {
    if (!totalBranches || totalBranches === 0) {
      return 'No branches';
    }

    if (totalBranches === 1) {
      return '1 branch';
    }

    if (activeBranches !== undefined && activeBranches !== totalBranches) {
      return `${activeBranches}/${totalBranches} branches active`;
    }

    return `${totalBranches} branches`;
  }

  /**
   * Get branch type display
   */
  static getBranchTypeDisplay(isMainBranch: boolean): { label: string; color: string; icon: string } {
    return isMainBranch
      ? { label: 'Main Branch', color: 'blue', icon: '🏢' }
      : { label: 'Branch', color: 'gray', icon: '🏪' };
  }

  /**
   * Format creation date
   */
  static formatCreationDate(createdAt: string): string {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format last updated
   */
  static formatLastUpdated(updatedAt: string): string {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }
}

/**
 * Coaching Validation Utilities
 */
export class CoachingValidationUtils {
  /**
   * Validate coaching center name
   */
  static validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length < 3) {
      return { valid: false, error: 'Name must be at least 3 characters long' };
    }

    if (name.length > 100) {
      return { valid: false, error: 'Name must be no more than 100 characters long' };
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['test', 'demo', 'example'];
    if (inappropriateWords.some(word => name.toLowerCase().includes(word))) {
      return { valid: false, error: 'Name contains inappropriate content' };
    }

    return { valid: true };
  }

  /**
   * Validate slug format
   */
  static validateSlug(slug: string): { valid: boolean; error?: string } {
    if (!slug || slug.length < 3) {
      return { valid: false, error: 'Slug must be at least 3 characters long' };
    }

    if (slug.length > 50) {
      return { valid: false, error: 'Slug must be no more than 50 characters long' };
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, error: 'Slug cannot start or end with a hyphen' };
    }

    if (slug.includes('--')) {
      return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
    }

    // Check for reserved slugs
    const reserved = ['admin', 'api', 'www', 'app', 'dashboard', 'search', 'about', 'contact', 'privacy', 'terms'];
    if (reserved.includes(slug)) {
      return { valid: false, error: 'This slug is reserved' };
    }

    return { valid: true };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) return { valid: true }; // Email is optional

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): { valid: boolean; error?: string } {
    if (!phone) return { valid: true }; // Phone is optional

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true };
  }

  /**
   * Validate website URL format
   */
  static validateWebsite(url: string): { valid: boolean; error?: string } {
    if (!url) return { valid: true }; // Website is optional

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'Website URL must use HTTP or HTTPS protocol' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid website URL format' };
    }
  }

  /**
   * Validate established year
   */
  static validateEstablishedYear(year: number): { valid: boolean; error?: string } {
    const currentYear = new Date().getFullYear();

    if (year < 1800) {
      return { valid: false, error: 'Established year cannot be before 1800' };
    }

    if (year > currentYear) {
      return { valid: false, error: 'Established year cannot be in the future' };
    }

    return { valid: true };
  }

  /**
   * Validate subjects array
   */
  static validateSubjects(subjects: string[]): { valid: boolean; error?: string } {
    if (!subjects || subjects.length === 0) {
      return { valid: true }; // Subjects are optional
    }

    if (subjects.length > 20) {
      return { valid: false, error: 'Cannot have more than 20 subjects' };
    }

    // Check for duplicates
    const uniqueSubjects = [...new Set(subjects.map(s => s.toLowerCase()))];
    if (uniqueSubjects.length !== subjects.length) {
      return { valid: false, error: 'Duplicate subjects are not allowed' };
    }

    // Check individual subject length
    for (const subject of subjects) {
      if (!subject || subject.trim().length < 2) {
        return { valid: false, error: 'Each subject must be at least 2 characters long' };
      }
      if (subject.length > 50) {
        return { valid: false, error: 'Each subject must be no more than 50 characters long' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate target audience array
   */
  static validateTargetAudience(audience: string[]): { valid: boolean; error?: string } {
    if (!audience || audience.length === 0) {
      return { valid: true }; // Target audience is optional
    }

    if (audience.length > 10) {
      return { valid: false, error: 'Cannot have more than 10 target audience groups' };
    }

    // Check for duplicates
    const uniqueAudience = [...new Set(audience.map(a => a.toLowerCase()))];
    if (uniqueAudience.length !== audience.length) {
      return { valid: false, error: 'Duplicate target audience groups are not allowed' };
    }

    return { valid: true };
  }

  /**
   * Validate description length
   */
  static validateDescription(description: string): { valid: boolean; error?: string } {
    if (!description) return { valid: true }; // Description is optional

    if (description.length > 2000) {
      return { valid: false, error: 'Description must be no more than 2000 characters long' };
    }

    return { valid: true };
  }
}

/**
 * Coaching Search Utilities
 */
export class CoachingSearchUtils {
  /**
   * Highlight search terms in text
   */
  static highlightSearchTerms(text: string, searchQuery: string): string {
    if (!searchQuery || !text) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Calculate search relevance score
   */
  static calculateRelevanceScore(center: PublicCoachingCenter, searchQuery: string): number {
    if (!searchQuery) return 0;

    let score = 0;
    const query = searchQuery.toLowerCase();

    // Name matches (highest priority)
    if (center.name?.toLowerCase().includes(query)) {
      score += 100;
    }

    // Description matches
    if (center.description?.toLowerCase().includes(query)) {
      score += 50;
    }

    // Subjects matches
    const subjectsMatch = center.subjects?.some(subject =>
      subject.toLowerCase().includes(query)
    );
    if (subjectsMatch) {
      score += 60;
    }

    // Target audience matches
    const audienceMatch = center.target_audience?.some(audience =>
      audience.toLowerCase().includes(query)
    );
    if (audienceMatch) {
      score += 40;
    }

    // Category matches
    if (center.category?.toLowerCase().includes(query)) {
      score += 30;
    }

    // Verification bonus
    if (center.is_verified) {
      score += 10;
    }

    // Featured bonus
    if (center.is_featured) {
      score += 15;
    }

    // Branch count bonus
    if (center.total_branches && center.total_branches > 1) {
      score += Math.min(center.total_branches * 2, 10);
    }

    return score;
  }

  /**
   * Generate search suggestions
   */
  static generateSearchSuggestions(centers: PublicCoachingCenter[]): string[] {
    const suggestions = new Set<string>();

    centers.forEach(center => {
      // Add subjects
      center.subjects?.forEach(subject => {
        if (subject.length > 2) {
          suggestions.add(subject);
        }
      });

      // Add target audience
      center.target_audience?.forEach(audience => {
        if (audience.length > 2) {
          suggestions.add(audience);
        }
      });

      // Add category display names
      const categoryName = CoachingDisplayUtils.getCategoryDisplayName(center.category);
      suggestions.add(categoryName);
    });

    return Array.from(suggestions).sort().slice(0, 10);
  }

  /**
   * Filter centers by proximity (if location data available)
   */
  static filterByProximity(
    centers: PublicCoachingCenter[],
    userLocation: { lat: number; lng: number },
    maxDistance: number
  ): PublicCoachingCenter[] {
    // This would require location data in the coaching centers
    // For now, return all centers
    return centers;
  }
}

/**
 * Coaching Filter Utilities
 */
export class CoachingFilterUtils {
  /**
   * Get available subjects from centers
   */
  static getAvailableSubjects(centers: PublicCoachingCenter[]): string[] {
    const subjects = new Set<string>();

    centers.forEach(center => {
      if (center.subjects) {
        center.subjects.forEach(subject => subjects.add(subject));
      }
    });

    return Array.from(subjects).sort();
  }

  /**
   * Get available target audiences from centers
   */
  static getAvailableTargetAudiences(centers: PublicCoachingCenter[]): string[] {
    const audiences = new Set<string>();

    centers.forEach(center => {
      if (center.target_audience) {
        center.target_audience.forEach(audience => audiences.add(audience));
      }
    });

    return Array.from(audiences).sort();
  }

  /**
   * Get categories grouped by type
   */
  static getCategoriesByGroup(): Record<CoachingCategoryGroup, CoachingCategoryMeta[]> {
    const groups: Record<CoachingCategoryGroup, CoachingCategoryMeta[]> = {
      ACADEMIC: [],
      COMPETITIVE: [],
      SKILL_DEVELOPMENT: [],
      HOBBY: [],
      PROFESSIONAL: [],
      COACHING_TYPE: []
    };

    Object.values(COACHING_CATEGORY_METADATA).forEach(meta => {
      groups[meta.group].push(meta);
    });

    return groups;
  }

  /**
   * Get establishment year ranges
   */
  static getEstablishmentYearRanges(): { label: string; from: number; to?: number }[] {
    const currentYear = new Date().getFullYear();

    return [
      { label: 'This year', from: currentYear },
      { label: 'Last 5 years', from: currentYear - 5 },
      { label: 'Last 10 years', from: currentYear - 10 },
      { label: 'Last 20 years', from: currentYear - 20 },
      { label: 'More than 20 years', from: 1800, to: currentYear - 20 }
    ];
  }
}

/**
 * Coaching Data Transformation Utilities
 */
export class CoachingTransformUtils {
  /**
   * Transform full coaching center to public coaching center
   */
  static toPublicCoachingCenter(center: CoachingCenter): PublicCoachingCenter {
    return {
      id: center.id,
      name: center.name,
      slug: center.slug,
      description: center.description,
      established_year: center.established_year,
      logo_url: center.logo_url,
      cover_url: center.cover_url,
      category: center.category,
      subjects: center.subjects,
      target_audience: center.target_audience,
      phone: center.phone,
      email: center.email,
      website: center.website,
      is_verified: center.is_verified,
      is_featured: center.is_featured,
      created_at: center.created_at,
      updated_at: center.updated_at
    };
  }

  /**
   * Transform full coaching branch to public coaching branch
   */
  static toPublicCoachingBranch(branch: CoachingBranch): PublicCoachingBranch {
    return {
      id: branch.id,
      coaching_center_id: branch.coaching_center_id,
      name: branch.name,
      description: branch.description,
      phone: branch.phone,
      email: branch.email,
      is_main_branch: branch.is_main_branch,
      is_active: branch.is_active,
      created_at: branch.created_at,
      updated_at: branch.updated_at
    };
  }

  /**
   * Extract contact information
   */
  static extractContactInfo(center: CoachingCenter | PublicCoachingCenter): CoachingContactInfo {
    return {
      phone: center.phone,
      email: center.email,
      website: center.website
    };
  }

  /**
   * Extract media information
   */
  static extractMediaInfo(center: CoachingCenter | PublicCoachingCenter): CoachingMediaInfo {
    return {
      logo_url: center.logo_url,
      cover_url: center.cover_url
    };
  }

  /**
   * Extract business information
   */
  static extractBusinessInfo(center: CoachingCenter | PublicCoachingCenter): CoachingBusinessInfo {
    return {
      established_year: center.established_year,
      subjects: center.subjects,
      target_audience: center.target_audience
    };
  }

  /**
   * Generate slug from name
   */
  static generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Merge coaching center data
   */
  static mergeCoachingCenterData(
    original: CoachingCenter,
    updates: Partial<CoachingCenter>
  ): CoachingCenter {
    return {
      ...original,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }
}

/**
 * Coaching URL Utilities
 */
export class CoachingUrlUtils {
  /**
   * Generate coaching center URL
   */
  static getCoachingCenterUrl(slugOrId: string): string {
    return `/coaching/${slugOrId}`;
  }

  /**
   * Generate coaching center dashboard URL
   */
  static getCoachingDashboardUrl(centerId: string): string {
    return `/dashboard/coaching/${centerId}`;
  }

  /**
   * Generate coaching center edit URL
   */
  static getCoachingEditUrl(centerId: string): string {
    return `/dashboard/coaching/${centerId}/edit`;
  }

  /**
   * Generate branch management URL
   */
  static getBranchManagementUrl(centerId: string): string {
    return `/dashboard/coaching/${centerId}/branches`;
  }

  /**
   * Generate logo URL with fallback
   * Handles Supabase storage URLs and applies proxy in production
   */
  static getLogoUrl(center: Partial<CoachingCenter | PublicCoachingCenter>, size: number = 100): string {
    if (center.logo_url) {
      // If it's a Supabase storage URL or external URL, apply proxy in production
      try {
        const AvatarUtils = require('./avatar.utils').AvatarUtils;
        return AvatarUtils.getPublicAvatarUrlFromRemote(center.logo_url);
      } catch {
        return center.logo_url;
      }
    }

    // Generate initials-based logo URL (use AvatarUtils to enable proxy when configured)
    const initials = CoachingDisplayUtils.getInitials(center);
    const categoryColor = CoachingDisplayUtils.getCategoryColor(center.category || 'OTHER');
    try {
      const AvatarUtils = require('./avatar.utils').AvatarUtils;
      const remote = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${categoryColor}&color=white`;
      return AvatarUtils.getPublicAvatarUrlFromRemote(remote);
    } catch {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${categoryColor}&color=white`;
    }
  }

  /**
   * Generate cover image URL with fallback
   * NOTE: Cover images are typically large (4MB+) and should NOT go through the avatar-proxy
   * Instead, use Next.js Image optimization or serve directly from Supabase CDN
   */
  static getCoverUrl(center: Partial<CoachingCenter | PublicCoachingCenter>): string {
    if (center.cover_url) {
      // Return cover_url directly - do NOT proxy large images
      // Next.js Image component will handle optimization via /_next/image
      return center.cover_url;
    }

    // Generate category-based cover URL
    const categoryIcon = CoachingDisplayUtils.getCategoryIcon(center.category || 'OTHER');
    return `https://via.placeholder.com/800x300/f3f4f6/6b7280?text=${encodeURIComponent(categoryIcon)}`;
  }

  /**
   * Generate QR code URL for coaching center
   */
  static getCoachingCenterQRCodeUrl(slugOrId: string): string {
    const centerUrl = `${window.location.origin}${this.getCoachingCenterUrl(slugOrId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(centerUrl)}`;
  }

  /**
   * Generate social sharing URL
   */
  static getSocialShareUrl(center: PublicCoachingCenter, platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'): string {
    const centerUrl = `${window.location.origin}${this.getCoachingCenterUrl(center.slug || center.id)}`;
    const text = `Check out ${center.name} - ${CoachingDisplayUtils.getCategoryDisplayName(center.category)}`;

    const platforms = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(centerUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(centerUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(centerUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${centerUrl}`)}`
    };

    return platforms[platform];
  }
}

/**
 * Coaching Analytics Utilities
 */
export class CoachingAnalyticsUtils {
  /**
   * Calculate center performance score
   */
  static calculatePerformanceScore(center: PublicCoachingCenter): number {
    let score = 0;

    // Base points for being active
    score += 10;

    // Verification bonus
    if (center.is_verified) score += 20;

    // Featured bonus
    if (center.is_featured) score += 15;

    // Profile completeness
    if (center.description) score += 10;
    if (center.logo_url) score += 5;
    if (center.cover_url) score += 5;
    if (center.phone) score += 5;
    if (center.email) score += 5;
    if (center.website) score += 5;
    if (center.subjects && center.subjects.length > 0) score += 10;
    if (center.target_audience && center.target_audience.length > 0) score += 5;
    if (center.established_year) score += 5;

    // Branch count bonus
    if (center.total_branches) {
      score += Math.min(center.total_branches * 2, 10);
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get center completion percentage
   */
  static getCompletionPercentage(center: CoachingCenter | PublicCoachingCenter): number {
    const fields = [
      'name', 'description', 'logo_url', 'cover_url', 'phone',
      'email', 'website', 'subjects', 'target_audience', 'established_year'
    ];

    let completed = 0;
    fields.forEach(field => {
      const value = (center as any)[field];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) completed++;
        else if (typeof value === 'string' && value.trim().length > 0) completed++;
        else if (typeof value === 'number') completed++;
      }
    });

    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Generate center recommendations
   */
  static generateRecommendations(center: CoachingCenter): string[] {
    const recommendations: string[] = [];

    if (!center.description) {
      recommendations.push('Add a detailed description to attract more students');
    }

    if (!center.logo_url) {
      recommendations.push('Upload a professional logo to build brand recognition');
    }

    if (!center.cover_url) {
      recommendations.push('Add a cover image to make your center more visually appealing');
    }

    if (!center.subjects || center.subjects.length === 0) {
      recommendations.push('List the subjects you teach to help students find you');
    }

    if (!center.target_audience || center.target_audience.length === 0) {
      recommendations.push('Specify your target audience to attract the right students');
    }

    if (!center.phone && !center.email) {
      recommendations.push('Add contact information so students can reach you');
    }

    if (!center.website) {
      recommendations.push('Add your website URL to provide more information to visitors');
    }

    if (!center.established_year) {
      recommendations.push('Add your establishment year to build credibility');
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
}

/**
 * Constants for coaching utilities
 */
export const COACHING_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_SUBJECTS: 20,
  MAX_TARGET_AUDIENCE: 10,
  MAX_SLUG_LENGTH: 50,
  MIN_ESTABLISHED_YEAR: 1800,
  LOGO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  COVER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Error codes for coaching operations
 */
export const COACHING_ERROR_CODES = {
  INVALID_NAME: 'INVALID_NAME',
  INVALID_SLUG: 'INVALID_SLUG',
  SLUG_TAKEN: 'SLUG_TAKEN',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_WEBSITE: 'INVALID_WEBSITE',
  INVALID_ESTABLISHED_YEAR: 'INVALID_ESTABLISHED_YEAR',
  INVALID_SUBJECTS: 'INVALID_SUBJECTS',
  INVALID_TARGET_AUDIENCE: 'INVALID_TARGET_AUDIENCE',
  INVALID_DESCRIPTION: 'INVALID_DESCRIPTION',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  CENTER_NOT_FOUND: 'CENTER_NOT_FOUND',
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const;

/**
 * Enrollment & Assignment Utilities
 */
export class EnrollmentUtils {
  /**
   * Format registration/assignment date
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Get enrollment status badge color
   */
  static getEnrollmentBadgeColor(isActive: boolean): string {
    return isActive ? 'bg-green-500' : 'bg-gray-500';
  }

  /**
   * Check if assignment is currently active
   */
  static isAssignmentActive(assignment: { is_active: boolean; assignment_end_date: string | null }): boolean {
    if (!assignment.is_active) return false;
    if (!assignment.assignment_end_date) return true;

    const endDate = new Date(assignment.assignment_end_date);
    const now = new Date();
    return endDate > now;
  }

  /**
   * Get subjects display text
   */
  static getSubjectsDisplay(subjects: string[] | null, maxDisplay: number = 3): string {
    if (!subjects || subjects.length === 0) return 'No subjects';
    
    if (subjects.length <= maxDisplay) {
      return subjects.join(', ');
    }
    
    const displayed = subjects.slice(0, maxDisplay).join(', ');
    const remaining = subjects.length - maxDisplay;
    return `${displayed} +${remaining} more`;
  }

  /**
   * Get enrollment/assignment duration text
   */
  static getDurationText(startDate: string, endDate?: string | null): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }
}