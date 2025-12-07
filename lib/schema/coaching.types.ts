/**
 * Coaching Schema Types
 * 
 * TypeScript interfaces and types for coaching-related data structures
 * Based on the Supabase coaching system schema (007_create_coaching_system.sql)
 */

// Enums from database
export type CoachingCategory =
  // Academic & School Level
  | 'SCHOOL_COACHING'
  | 'COLLEGE_TUITION'
  | 'HOME_TUITION'
  | 'ONLINE_TUITION'
  // Competitive Exams
  | 'COMPETITIVE_EXAM'
  | 'ENTRANCE_EXAM'
  | 'TEST_PREPARATION'
  // Skill & Career Development
  | 'LANGUAGE_TRAINING'
  | 'SKILL_DEVELOPMENT'
  | 'IT_AND_PROGRAMMING'
  | 'DESIGN_AND_CREATIVE'
  | 'BUSINESS_AND_MARKETING'
  | 'ACCOUNTING_AND_FINANCE'
  // Hobby & Talent
  | 'HOBBY_CLASSES'
  | 'MUSIC_AND_DANCE'
  | 'ART_AND_CRAFT'
  | 'SPORTS_AND_FITNESS'
  // Professional & Certification
  | 'PROFESSIONAL_CERTIFICATION'
  | 'GOVERNMENT_EXAM_PREPARATION'
  | 'UPSC_AND_DEFENCE'
  | 'BANKING_AND_INSURANCE'
  | 'MEDICAL_AND_ENGINEERING_ENTRANCE'
  // Coaching Type & Mode
  | 'TUTORING'
  | 'MENTORSHIP'
  | 'WORKSHOP_OR_BOOTCAMP'
  | 'CAREER_COUNSELLING'
  | 'OTHER';

export type CoachingStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

// Core coaching center interface matching the database table
export interface CoachingCenter {
  // Primary identification
  id: string; // UUID

  // Basic information
  name: string;
  slug: string | null;
  description: string | null;
  established_year: number | null;

  // Media
  logo_url: string | null;
  cover_url: string | null;

  // Category and services
  category: CoachingCategory;
  subjects: string[] | null;
  target_audience: string[] | null;

  // Management
  owner_id: string; // References auth.users(id)
  manager_id: string | null; // References auth.users(id)
  status: CoachingStatus;

  // Contact information
  phone: string | null;
  email: string | null;
  website: string | null;

  // Flags
  is_verified: boolean;
  is_featured: boolean;

  // Extensible data
  metadata: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Coaching branch interface matching the database table
export interface CoachingBranch {
  // Primary identification
  id: string; // UUID

  // Association
  coaching_center_id: string; // References coaching_centers(id)

  // Basic information
  name: string;
  description: string | null;

  // Management
  manager_id: string | null; // References auth.users(id)

  // Contact information
  phone: string | null;
  email: string | null;

  // Branch configuration
  is_main_branch: boolean;
  is_active: boolean;

  // Extensible data
  metadata: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Public coaching center interface (for displaying to users)
export interface PublicCoachingCenter {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  established_year: number | null;
  logo_url: string | null;
  cover_url: string | null;
  category: CoachingCategory;
  subjects: string[] | null;
  target_audience: string[] | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Aggregated data
  total_branches?: number;
  active_branches?: number;
}

// Public coaching branch interface
export interface PublicCoachingBranch {
  id: string;
  coaching_center_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_main_branch: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Coaching center update interface (for partial updates)
export interface CoachingCenterUpdate {
  name?: string;
  slug?: string | null;
  description?: string | null;
  established_year?: number | null;
  logo_url?: string | null;
  cover_url?: string | null;
  category?: CoachingCategory;
  subjects?: string[] | null;
  target_audience?: string[] | null;
  manager_id?: string | null;
  status?: CoachingStatus;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_verified?: boolean;
  is_featured?: boolean;
  metadata?: Record<string, any> | null;
}

// Coaching branch update interface
export interface CoachingBranchUpdate {
  name?: string;
  description?: string | null;
  manager_id?: string | null;
  phone?: string | null;
  email?: string | null;
  is_main_branch?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any> | null;
}

// Coaching center creation interface
export interface CoachingCenterCreate {
  name: string;
  description?: string | null;
  established_year?: number | null;
  logo_url?: string | null;
  cover_url?: string | null;
  category: CoachingCategory;
  subjects?: string[] | null;
  target_audience?: string[] | null;
  manager_id?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  metadata?: Record<string, any> | null;
}

// Coaching branch creation interface
export interface CoachingBranchCreate {
  coaching_center_id: string;
  name: string;
  description?: string | null;
  manager_id?: string | null;
  phone?: string | null;
  email?: string | null;
  is_main_branch?: boolean;
  metadata?: Record<string, any> | null;
}

/**
 * Coaching center filters for searching
 * Aligned with search_coaching_centers_v2 RPC function
 */
export interface CoachingCenterFilters {
  // Search parameters
  search_query?: string | null;

  // Category and subject filters
  category?: CoachingCategory | null;
  subjects?: string[] | null;

  // Location filters
  branch_id?: string | null;
  center_id?: string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  village_town?: string | null;

  // Geographic filters (for distance-based search)
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number | null;

  // Rating filters
  min_rating?: number | null;
  max_rating?: number | null;

  // Status filters
  is_verified?: boolean | null;

  // Time filters
  days_ago?: number | null;
}

// Coaching branch filter options
export interface CoachingBranchFilters {
  coaching_center_id?: string;
  is_main_branch?: boolean;
  is_active?: boolean;
  manager_id?: string;
  search_query?: string;
}

/**
 * Sort options for coaching centers (aligned with RPC function)
 */
export type CoachingCenterSortBy =
  | 'recent'        // Sort by creation date (newest first)
  | 'rating_high'   // Sort by rating (highest first)
  | 'rating_low'    // Sort by rating (lowest first)
  | 'distance';     // Sort by distance (only when lat/lng provided)

// Sort options for coaching centers
export type CoachingCenterSortField =
  | 'created_at'
  | 'updated_at'
  | 'name'
  | 'established_year'
  | 'is_featured';

// Sort options for coaching branches
export type CoachingBranchSortField =
  | 'created_at'
  | 'updated_at'
  | 'name'
  | 'is_main_branch';

export type SortDirection = 'asc' | 'desc';

export interface CoachingCenterSort {
  field: CoachingCenterSortField;
  direction: SortDirection;
}

export interface CoachingBranchSort {
  field: CoachingBranchSortField;
  direction: SortDirection;
}

/**
 * Individual coaching center search result from RPC
 * Maps to the RETURNS TABLE structure in search_coaching_centers_v2
 */
export interface CoachingCenterSearchItem {
  center_id: string;
  center_slug: string;
  branch_id: string;
  center_is_verified: boolean;
  center_logo_url: string | null;
  center_name: string;
  center_category: CoachingCategory;
  center_subjects: string[] | null;
  location_city: string | null;
  avg_rating: number;
  total_reviews: number;
  location_state: string | null;
  location_district: string | null;
  distance_meters: number | null;
  total_count: number; // Total count of results (same for all rows)
}

/**
 * Search result wrapper with pagination
 */
export interface CoachingCenterSearchResult {
  results: CoachingCenterSearchItem[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface CoachingBranchSearchResult {
  branches: PublicCoachingBranch[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Statistics interfaces
export interface CoachingCenterStats {
  total_centers: number;
  active_centers: number;
  verified_centers: number;
  featured_centers: number;
  centers_by_category: Record<CoachingCategory, number>;
  total_branches: number;
  active_branches: number;
  average_branches_per_center: number;
   comprehensive_stats?: CoachingCenterRPCStats;
}

/**
 * RPC Stats Response from get_coaching_center_stats function
 * These are the detailed stats returned by the database function
 */
export interface CoachingCenterRPCStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  active_branches: number;
  total_branches: number;
  pending_fees: number;
  attendance_rate: number;
  avg_rating: number;
  total_reviews: number;
}

// Detailed coaching center with branches
export interface CoachingCenterWithBranches extends PublicCoachingCenter {
  branches: PublicCoachingBranch[];
}

// Coaching center permissions interface
export interface CoachingCenterPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage_branches: boolean;
  can_verify: boolean;
  can_feature: boolean;
}

// Coaching branch permissions interface
export interface CoachingBranchPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_set_as_main: boolean;
}

// Validation errors
export interface CoachingValidationError {
  field: string;
  message: string;
  code: string;
}

// Operation results
export interface CoachingOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: CoachingValidationError[];
}

// Coaching center dashboard data
export interface CoachingCenterDashboard {
  center: CoachingCenter;
  branches: CoachingBranch[];
  stats: {
    total_branches: number;
    active_branches: number;
    main_branch?: CoachingBranch;
  };
  permissions: CoachingCenterPermissions;
  /** Detailed stats from RPC function (optional, loaded async) */
  detailedStats?: CoachingCenterRPCStats;
}

// Category groupings for UI
export type CoachingCategoryGroup =
  | 'ACADEMIC'
  | 'COMPETITIVE'
  | 'SKILL_DEVELOPMENT'
  | 'HOBBY'
  | 'PROFESSIONAL'
  | 'COACHING_TYPE';

// Category metadata
export interface CoachingCategoryMeta {
  category: CoachingCategory;
  group: CoachingCategoryGroup;
  label: string;
  description: string;
  icon?: string;
  color?: string;
}

// Contact information interface
export interface CoachingContactInfo {
  phone: string | null;
  email: string | null;
  website: string | null;
}

// Media information interface
export interface CoachingMediaInfo {
  logo_url: string | null;
  cover_url: string | null;
}

// Business information interface
export interface CoachingBusinessInfo {
  established_year: number | null;
  subjects: string[] | null;
  target_audience: string[] | null;
}

// Role constants for type safety
export const COACHING_CATEGORIES = {
  // Academic & School Level
  SCHOOL_COACHING: 'SCHOOL_COACHING' as const,
  COLLEGE_TUITION: 'COLLEGE_TUITION' as const,
  HOME_TUITION: 'HOME_TUITION' as const,
  ONLINE_TUITION: 'ONLINE_TUITION' as const,

  // Competitive Exams
  COMPETITIVE_EXAM: 'COMPETITIVE_EXAM' as const,
  ENTRANCE_EXAM: 'ENTRANCE_EXAM' as const,
  TEST_PREPARATION: 'TEST_PREPARATION' as const,

  // Skill & Career Development
  LANGUAGE_TRAINING: 'LANGUAGE_TRAINING' as const,
  SKILL_DEVELOPMENT: 'SKILL_DEVELOPMENT' as const,
  IT_AND_PROGRAMMING: 'IT_AND_PROGRAMMING' as const,
  DESIGN_AND_CREATIVE: 'DESIGN_AND_CREATIVE' as const,
  BUSINESS_AND_MARKETING: 'BUSINESS_AND_MARKETING' as const,
  ACCOUNTING_AND_FINANCE: 'ACCOUNTING_AND_FINANCE' as const,

  // Hobby & Talent
  HOBBY_CLASSES: 'HOBBY_CLASSES' as const,
  MUSIC_AND_DANCE: 'MUSIC_AND_DANCE' as const,
  ART_AND_CRAFT: 'ART_AND_CRAFT' as const,
  SPORTS_AND_FITNESS: 'SPORTS_AND_FITNESS' as const,

  // Professional & Certification
  PROFESSIONAL_CERTIFICATION: 'PROFESSIONAL_CERTIFICATION' as const,
  GOVERNMENT_EXAM_PREPARATION: 'GOVERNMENT_EXAM_PREPARATION' as const,
  UPSC_AND_DEFENCE: 'UPSC_AND_DEFENCE' as const,
  BANKING_AND_INSURANCE: 'BANKING_AND_INSURANCE' as const,
  MEDICAL_AND_ENGINEERING_ENTRANCE: 'MEDICAL_AND_ENGINEERING_ENTRANCE' as const,

  // Coaching Type & Mode
  TUTORING: 'TUTORING' as const,
  MENTORSHIP: 'MENTORSHIP' as const,
  WORKSHOP_OR_BOOTCAMP: 'WORKSHOP_OR_BOOTCAMP' as const,
  CAREER_COUNSELLING: 'CAREER_COUNSELLING' as const,
  OTHER: 'OTHER' as const,
} as const;

export const COACHING_STATUS = {
  DRAFT: 'DRAFT' as const,
  ACTIVE: 'ACTIVE' as const,
  INACTIVE: 'INACTIVE' as const,
} as const;

// Default values
export const DEFAULT_COACHING_CENTER_VALUES = {
  category: COACHING_CATEGORIES.OTHER,
  status: COACHING_STATUS.DRAFT,
  is_verified: false,
  is_featured: false,
} as const;

export const DEFAULT_COACHING_BRANCH_VALUES = {
  is_main_branch: false,
  is_active: true,
} as const;

// Category metadata mapping
export const COACHING_CATEGORY_METADATA: Record<CoachingCategory, CoachingCategoryMeta> = {
  // Academic & School Level
  SCHOOL_COACHING: {
    category: 'SCHOOL_COACHING',
    group: 'ACADEMIC',
    label: 'School Coaching',
    description: 'Coaching for school-level students across various subjects',
    icon: '🎓',
    color: 'blue'
  },
  COLLEGE_TUITION: {
    category: 'COLLEGE_TUITION',
    group: 'ACADEMIC',
    label: 'College Tuition',
    description: 'Advanced coaching for college-level subjects',
    icon: '🏛️',
    color: 'indigo'
  },
  HOME_TUITION: {
    category: 'HOME_TUITION',
    group: 'ACADEMIC',
    label: 'Home Tuition',
    description: 'Personalized one-on-one coaching at home',
    icon: '🏠',
    color: 'green'
  },
  ONLINE_TUITION: {
    category: 'ONLINE_TUITION',
    group: 'ACADEMIC',
    label: 'Online Tuition',
    description: 'Digital coaching through online platforms',
    icon: '💻',
    color: 'purple'
  },

  // Competitive Exams
  COMPETITIVE_EXAM: {
    category: 'COMPETITIVE_EXAM',
    group: 'COMPETITIVE',
    label: 'Competitive Exam Prep',
    description: 'Preparation for competitive examinations',
    icon: '🏆',
    color: 'red'
  },
  ENTRANCE_EXAM: {
    category: 'ENTRANCE_EXAM',
    group: 'COMPETITIVE',
    label: 'Entrance Exam Prep',
    description: 'Coaching for entrance examinations',
    icon: '🚪',
    color: 'orange'
  },
  TEST_PREPARATION: {
    category: 'TEST_PREPARATION',
    group: 'COMPETITIVE',
    label: 'Test Preparation',
    description: 'General test preparation and study strategies',
    icon: '📝',
    color: 'yellow'
  },

  // Skill & Career Development
  LANGUAGE_TRAINING: {
    category: 'LANGUAGE_TRAINING',
    group: 'SKILL_DEVELOPMENT',
    label: 'Language Training',
    description: 'Learning new languages and communication skills',
    icon: '🗣️',
    color: 'pink'
  },
  SKILL_DEVELOPMENT: {
    category: 'SKILL_DEVELOPMENT',
    group: 'SKILL_DEVELOPMENT',
    label: 'Skill Development',
    description: 'General skill enhancement and professional development',
    icon: '🛠️',
    color: 'gray'
  },
  IT_AND_PROGRAMMING: {
    category: 'IT_AND_PROGRAMMING',
    group: 'SKILL_DEVELOPMENT',
    label: 'IT & Programming',
    description: 'Technology and programming skills',
    icon: '💻',
    color: 'blue'
  },
  DESIGN_AND_CREATIVE: {
    category: 'DESIGN_AND_CREATIVE',
    group: 'SKILL_DEVELOPMENT',
    label: 'Design & Creative',
    description: 'Creative design and artistic skills',
    icon: '🎨',
    color: 'purple'
  },
  BUSINESS_AND_MARKETING: {
    category: 'BUSINESS_AND_MARKETING',
    group: 'SKILL_DEVELOPMENT',
    label: 'Business & Marketing',
    description: 'Business skills and marketing strategies',
    icon: '📈',
    color: 'green'
  },
  ACCOUNTING_AND_FINANCE: {
    category: 'ACCOUNTING_AND_FINANCE',
    group: 'SKILL_DEVELOPMENT',
    label: 'Accounting & Finance',
    description: 'Financial management and accounting skills',
    icon: '💰',
    color: 'yellow'
  },

  // Hobby & Talent
  HOBBY_CLASSES: {
    category: 'HOBBY_CLASSES',
    group: 'HOBBY',
    label: 'Hobby Classes',
    description: 'Recreational and hobby-based learning',
    icon: '🎲',
    color: 'pink'
  },
  MUSIC_AND_DANCE: {
    category: 'MUSIC_AND_DANCE',
    group: 'HOBBY',
    label: 'Music & Dance',
    description: 'Musical instruments and dance forms',
    icon: '🎵',
    color: 'red'
  },
  ART_AND_CRAFT: {
    category: 'ART_AND_CRAFT',
    group: 'HOBBY',
    label: 'Art & Craft',
    description: 'Artistic expression and crafting skills',
    icon: '🎨',
    color: 'orange'
  },
  SPORTS_AND_FITNESS: {
    category: 'SPORTS_AND_FITNESS',
    group: 'HOBBY',
    label: 'Sports & Fitness',
    description: 'Physical activities and fitness training',
    icon: '⚽',
    color: 'green'
  },

  // Professional & Certification
  PROFESSIONAL_CERTIFICATION: {
    category: 'PROFESSIONAL_CERTIFICATION',
    group: 'PROFESSIONAL',
    label: 'Professional Certification',
    description: 'Industry-recognized certification programs',
    icon: '📜',
    color: 'indigo'
  },
  GOVERNMENT_EXAM_PREPARATION: {
    category: 'GOVERNMENT_EXAM_PREPARATION',
    group: 'PROFESSIONAL',
    label: 'Government Exam Prep',
    description: 'Preparation for government job examinations',
    icon: '🏛️',
    color: 'blue'
  },
  UPSC_AND_DEFENCE: {
    category: 'UPSC_AND_DEFENCE',
    group: 'PROFESSIONAL',
    label: 'UPSC & Defence',
    description: 'Civil services and defence examination preparation',
    icon: '🛡️',
    color: 'green'
  },
  BANKING_AND_INSURANCE: {
    category: 'BANKING_AND_INSURANCE',
    group: 'PROFESSIONAL',
    label: 'Banking & Insurance',
    description: 'Banking and insurance sector examination prep',
    icon: '🏦',
    color: 'yellow'
  },
  MEDICAL_AND_ENGINEERING_ENTRANCE: {
    category: 'MEDICAL_AND_ENGINEERING_ENTRANCE',
    group: 'PROFESSIONAL',
    label: 'Medical & Engineering',
    description: 'Medical and engineering entrance exam preparation',
    icon: '⚕️',
    color: 'red'
  },

  // Coaching Type & Mode
  TUTORING: {
    category: 'TUTORING',
    group: 'COACHING_TYPE',
    label: 'Tutoring',
    description: 'Individual or small group tutoring sessions',
    icon: '👨‍🏫',
    color: 'blue'
  },
  MENTORSHIP: {
    category: 'MENTORSHIP',
    group: 'COACHING_TYPE',
    label: 'Mentorship',
    description: 'Personal guidance and career mentoring',
    icon: '🤝',
    color: 'purple'
  },
  WORKSHOP_OR_BOOTCAMP: {
    category: 'WORKSHOP_OR_BOOTCAMP',
    group: 'COACHING_TYPE',
    label: 'Workshop/Bootcamp',
    description: 'Intensive short-term skill-building programs',
    icon: '🔥',
    color: 'orange'
  },
  CAREER_COUNSELLING: {
    category: 'CAREER_COUNSELLING',
    group: 'COACHING_TYPE',
    label: 'Career Counselling',
    description: 'Professional career guidance and planning',
    icon: '🎯',
    color: 'green'
  },
  OTHER: {
    category: 'OTHER',
    group: 'COACHING_TYPE',
    label: 'Other',
    description: 'Other specialized coaching services',
    icon: '❓',
    color: 'gray'
  },
};