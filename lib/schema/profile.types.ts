/**
 * Profile Schema Types
 * 
 * TypeScript interfaces and types for profile-related data structures
 * Based on the Supabase profiles table schema
 */

// Enums from database
export type UserRole = 'SA' | 'A' | 'S' | 'T' | 'C'; // Super Admin, Admin, Student, Teacher, Coach
export type OnboardingLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

// Core profile interface matching the database table
export interface Profile {
  // Primary identification
  id: string; // UUID from auth.users
  
  // Basic profile information
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  
  // Role and status
  role: UserRole;
  is_online: boolean;
  
  // Onboarding and completion tracking
  onboarding_level: OnboardingLevel;
  profile_completion_percentage: number;
  
  // Contact information
  email: string | null;
  phone: string | null;
  timezone: string;
  
  // Platform preferences
  email_notifications: boolean;
  push_notifications: boolean;
  chat_notifications: boolean;
  whatsapp_notifications: boolean;
  sms_notifications: boolean;
  language_preference: string;
  
  // Social links
  website_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  
  // Role-specific fields - Teachers/Coaches
  expertise_areas: string[] | null;
  years_of_experience: number | null;
  hourly_rate: number | null;
  
  // Reputation and engagement metrics
  reputation_score: number;
  
  // Role-specific fields - Students
  grade_level: string | null;
  subjects_of_interest: string[] | null;
  learning_goals: string | null;
  
  // Account status
  is_verified: boolean;
  is_active: boolean;
  is_premium: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

// Public profile interface (for displaying to other users)
export interface PublicProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_online: boolean;
  reputation_score: number;
  expertise_areas: string[] | null;
  years_of_experience: number | null;
  grade_level: string | null;
  subjects_of_interest: string[] | null;
  is_verified: boolean;
  created_at: string;
  last_seen_at: string;
}

// Profile update interface (for partial updates)
export interface ProfileUpdate {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  role?: UserRole; // Allow role updates during onboarding
  phone?: string | null;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  chat_notifications?: boolean;
  whatsapp_notifications?: boolean;
  sms_notifications?: boolean;
  language_preference?: string;
  website_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  expertise_areas?: string[] | null;
  years_of_experience?: number | null;
  hourly_rate?: number | null;
  grade_level?: string | null;
  subjects_of_interest?: string[] | null;
  learning_goals?: string | null;
}

// Profile creation interface (for new profiles)
export interface ProfileCreate {
  id: string; // Auth user ID
  email: string;
  role?: UserRole;
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  date_of_birth?: string;
  phone?: string;
  timezone?: string;
}

// Profile filter options for searching/listing
export interface ProfileFilters {
  role?: UserRole | UserRole[];
  is_online?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  expertise_areas?: string[];
  subjects_of_interest?: string[];
  grade_level?: string;
  min_reputation?: number;
  search_query?: string; // For searching by name, username, bio
}

// Profile sort options
export type ProfileSortField = 
  | 'created_at' 
  | 'updated_at' 
  | 'last_seen_at' 
  | 'reputation_score' 
  | 'profile_completion_percentage'
  | 'full_name'
  | 'username';

export type SortDirection = 'asc' | 'desc';

export interface ProfileSort {
  field: ProfileSortField;
  direction: SortDirection;
}

// Profile statistics interface
export interface ProfileStats {
  total_profiles: number;
  students: number;
  teachers: number;
  coaches: number;
  admins: number;
  online_users: number;
  verified_users: number;
  premium_users: number;
  average_completion: number;
}

// Profile search result interface
export interface ProfileSearchResult {
  profiles: PublicProfile[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Notification preferences interface
export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  chat_notifications: boolean;
  whatsapp_notifications: boolean;
  sms_notifications: boolean;
}

// Social links interface
export interface SocialLinks {
  website_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
}

// Teacher/Coach specific interface
export interface TeacherProfile {
  expertise_areas: string[];
  years_of_experience: number;
  hourly_rate: number;
  reputation_score: number;
}

// Student specific interface
export interface StudentProfile {
  grade_level: string;
  subjects_of_interest: string[];
  learning_goals: string;
}

// Profile validation errors
export interface ProfileValidationError {
  field: keyof Profile;
  message: string;
  code: string;
}

// Profile operation results
export interface ProfileOperationResult<T = Profile> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ProfileValidationError[];
}

// Profile permissions interface
export interface ProfilePermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_private: boolean;
}

// Profile activity status
export type ProfileActivityStatus = 'online' | 'offline' | 'away' | 'busy';

// Profile completion steps
export interface ProfileCompletionStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  points: number;
  required: boolean;
}

// Role constants for type safety
export const USER_ROLES = {
  SUPER_ADMIN: 'SA' as const,
  ADMIN: 'A' as const,
  STUDENT: 'S' as const,
  TEACHER: 'T' as const,
  COACH: 'C' as const,
} as const;

// Onboarding level constants
export const ONBOARDING_LEVELS = {
  WELCOME: '1' as const,
  BASIC_INFO: '2' as const,
  ROLE_SETUP: '3' as const,
  PREFERENCES: '4' as const,
  VERIFICATION: '5' as const,
  PROFILE_DETAILS: '6' as const,
  SOCIAL_LINKS: '7' as const,
  EXPERTISE_SETUP: '8' as const,
  GOAL_SETTING: '9' as const,
  COMPLETED: '10' as const,
} as const;

// Default values
export const DEFAULT_PROFILE_VALUES = {
  role: USER_ROLES.STUDENT,
  onboarding_level: ONBOARDING_LEVELS.WELCOME,
  profile_completion_percentage: 10,
  timezone: 'UTC',
  language_preference: 'en',
  email_notifications: true,
  push_notifications: true,
  chat_notifications: true,
  whatsapp_notifications: false,
  sms_notifications: false,
  is_online: false,
  reputation_score: 0,
  is_verified: false,
  is_active: true,
  is_premium: false,
} as const;