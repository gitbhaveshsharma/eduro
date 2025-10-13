/**
 * Report Utilities
 * 
 * Helper functions for report functionality
 */

import type { ReportCategory, ReportTargetType } from '@/lib/schema/report.types';

export const REPORT_CATEGORIES = [
  { value: 'SPAM', label: 'Spam or Unwanted Content' },
  { value: 'HARASSMENT', label: 'Harassment or Bullying' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
  { value: 'MISINFORMATION', label: 'False Information' },
  { value: 'COPYRIGHT', label: 'Copyright Violation' },
  { value: 'OTHER', label: 'Other' }
] as const;

export const getTargetTypeDisplay = (targetType: ReportTargetType): string => {
  switch (targetType) {
    case 'POST': return 'post';
    case 'COMMENT': return 'comment';
    case 'LMS_COURSE': return 'course';
    case 'LMS_MODULE': return 'module';
    case 'USER_PROFILE': return 'user profile';
    case 'COMMUNITY_POST': return 'community post';
    default: return 'content';
  }
};

export const getCategoryLabel = (category: ReportCategory): string => {
  return REPORT_CATEGORIES.find(cat => cat.value === category)?.label || category;
};