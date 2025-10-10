/**
 * Profile Utilities
 * 
 * Helper functions and utilities for profile-related operations
 * Includes formatters, validators, calculators, and other utility functions
 */

import type {
  Profile,
  PublicProfile,
  UserRole,
  ProfileCompletionStep,
  ProfileActivityStatus,
  NotificationPreferences,
  SocialLinks,
  TeacherProfile,
  StudentProfile
} from '../schema/profile.types';

/**
 * Profile Display Utilities
 */
export class ProfileDisplayUtils {
  /**
   * Get display name for a profile
   */
  static getDisplayName(profile: Partial<Profile | PublicProfile>): string {
    if (profile.full_name && profile.full_name.trim()) {
      return profile.full_name.trim();
    }
    
    if (profile.username && profile.username.trim()) {
      return `@${profile.username.trim()}`;
    }
    
    return 'Anonymous User';
  }

  /**
   * Get initials from profile name
   */
  static getInitials(profile: Partial<Profile | PublicProfile>): string {
    const displayName = this.getDisplayName(profile);
    
    if (displayName.startsWith('@')) {
      return displayName.slice(1, 3).toUpperCase();
    }
    
    const names = displayName.split(' ').filter(name => name.length > 0);
    if (names.length === 1) {
      return names[0].slice(0, 2).toUpperCase();
    }
    
    return names
      .slice(0, 2)
      .map(name => name[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: UserRole): string {
    const roleMap: Record<UserRole, string> = {
      'SA': 'Super Admin',
      'A': 'Admin',
      'S': 'Student',
      'T': 'Teacher',
      'C': 'Coach'
    };
    
    return roleMap[role] || 'Unknown';
  }

  /**
   * Get role color/badge style
   */
  static getRoleColor(role: UserRole): string {
    const colorMap: Record<UserRole, string> = {
      'SA': 'red',
      'A': 'orange',
      'S': 'blue',
      'T': 'green',
      'C': 'purple'
    };
    
    return colorMap[role] || 'gray';
  }

  /**
   * Get profile completion color based on percentage
   */
  static getCompletionColor(percentage: number): string {
    if (percentage >= 90) return 'green';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 50) return 'orange';
    return 'red';
  }

  /**
   * Get activity status from profile
   */
  static getActivityStatus(profile: Partial<Profile | PublicProfile>): ProfileActivityStatus {
    if (!profile.is_online) return 'offline';
    
    if (!profile.last_seen_at) return 'online';
    
    const lastSeen = new Date(profile.last_seen_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'away';
    return 'offline';
  }

  /**
   * Format last seen time
   */
  static formatLastSeen(lastSeenAt: string): string {
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeen.toLocaleDateString();
  }

  /**
   * Format join date
   */
  static formatJoinDate(createdAt: string): string {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }
}

/**
 * Profile Validation Utilities
 */
export class ProfileValidationUtils {
  /**
   * Validate username format and availability
   */
  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (username.length > 20) {
      return { valid: false, error: 'Username must be no more than 20 characters long' };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    
    // Check for reserved usernames
    const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'about', 'contact'];
    if (reserved.includes(username.toLowerCase())) {
      return { valid: false, error: 'This username is reserved' };
    }
    
    return { valid: true };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
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
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate social media URL
   */
  static validateSocialUrl(url: string, platform: 'linkedin' | 'github' | 'twitter'): { valid: boolean; error?: string } {
    const urlValidation = this.validateUrl(url);
    if (!urlValidation.valid) {
      return urlValidation;
    }
    
    const platformDomains = {
      linkedin: ['linkedin.com', 'www.linkedin.com'],
      github: ['github.com', 'www.github.com'],
      twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com']
    };
    
    try {
      const urlObj = new URL(url);
      const validDomains = platformDomains[platform];
      
      if (!validDomains.includes(urlObj.hostname)) {
        return { valid: false, error: `Invalid ${platform} URL` };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
}

/**
 * Profile Completion Utilities
 */
export class ProfileCompletionUtils {
  /**
   * Get profile completion steps for a user role
   */
  static getCompletionSteps(profile: Profile): ProfileCompletionStep[] {
    const baseSteps: ProfileCompletionStep[] = [
      {
        key: 'basic_info',
        label: 'Basic Information',
        description: 'Add your full name and bio',
        completed: !!(profile.full_name && profile.bio),
        points: 25,
        required: true
      },
      {
        key: 'avatar',
        label: 'Profile Picture',
        description: 'Upload a profile picture',
        completed: !!profile.avatar_url,
        points: 10,
        required: false
      },
      {
        key: 'contact',
        label: 'Contact Information',
        description: 'Add phone number',
        completed: !!profile.phone,
        points: 5,
        required: false
      }
    ];

    // Role-specific steps
    if (profile.role === 'T' || profile.role === 'C') {
      baseSteps.push(
        {
          key: 'expertise',
          label: 'Expertise Areas',
          description: 'List your areas of expertise',
          completed: !!(profile.expertise_areas && profile.expertise_areas.length > 0),
          points: 20,
          required: true
        },
        {
          key: 'experience',
          label: 'Experience',
          description: 'Add your years of experience',
          completed: !!profile.years_of_experience,
          points: 15,
          required: false
        },
        {
          key: 'pricing',
          label: 'Hourly Rate',
          description: 'Set your hourly rate',
          completed: !!profile.hourly_rate,
          points: 15,
          required: false
        }
      );
    }

    if (profile.role === 'S') {
      baseSteps.push(
        {
          key: 'academic_info',
          label: 'Academic Information',
          description: 'Add your grade level',
          completed: !!profile.grade_level,
          points: 15,
          required: false
        },
        {
          key: 'interests',
          label: 'Learning Interests',
          description: 'Select subjects you want to learn',
          completed: !!(profile.subjects_of_interest && profile.subjects_of_interest.length > 0),
          points: 20,
          required: false
        },
        {
          key: 'goals',
          label: 'Learning Goals',
          description: 'Describe your learning goals',
          completed: !!profile.learning_goals,
          points: 15,
          required: false
        }
      );
    }

    baseSteps.push({
      key: 'social_links',
      label: 'Social Links',
      description: 'Add your social media profiles',
      completed: !!(profile.website_url || profile.linkedin_url || profile.github_url || profile.twitter_url),
      points: 10,
      required: false
    });

    return baseSteps;
  }

  /**
   * Calculate completion percentage manually
   */
  static calculateCompletionPercentage(profile: Profile): number {
    const steps = this.getCompletionSteps(profile);
    const totalPoints = steps.reduce((sum, step) => sum + step.points, 0);
    const earnedPoints = steps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.points, 0);
    
    return Math.round((earnedPoints / totalPoints) * 100);
  }

  /**
   * Get next recommended completion step
   */
  static getNextStep(profile: Profile): ProfileCompletionStep | null {
    const steps = this.getCompletionSteps(profile);
    
    // Find first incomplete required step
    const nextRequired = steps.find(step => step.required && !step.completed);
    if (nextRequired) return nextRequired;
    
    // Find highest point value incomplete step
    const incompleteSteps = steps.filter(step => !step.completed);
    if (incompleteSteps.length === 0) return null;
    
    return incompleteSteps.reduce((highest, current) => 
      current.points > highest.points ? current : highest
    );
  }
}

/**
 * Profile Filter Utilities
 */
export class ProfileFilterUtils {
  /**
   * Get available expertise areas from profiles
   */
  static getAvailableExpertiseAreas(profiles: PublicProfile[]): string[] {
    const areas = new Set<string>();
    
    profiles.forEach(profile => {
      if (profile.expertise_areas) {
        profile.expertise_areas.forEach(area => areas.add(area));
      }
    });
    
    return Array.from(areas).sort();
  }

  /**
   * Get available subjects from student profiles
   */
  static getAvailableSubjects(profiles: PublicProfile[]): string[] {
    const subjects = new Set<string>();
    
    profiles.forEach(profile => {
      if (profile.subjects_of_interest) {
        profile.subjects_of_interest.forEach(subject => subjects.add(subject));
      }
    });
    
    return Array.from(subjects).sort();
  }

  /**
   * Get available grade levels
   */
  static getAvailableGradeLevels(profiles: PublicProfile[]): string[] {
    const grades = new Set<string>();
    
    profiles.forEach(profile => {
      if (profile.grade_level) {
        grades.add(profile.grade_level);
      }
    });
    
    return Array.from(grades).sort();
  }
}

/**
 * Profile Search Utilities
 */
export class ProfileSearchUtils {
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
  static calculateRelevanceScore(profile: PublicProfile, searchQuery: string): number {
    if (!searchQuery) return 0;
    
    let score = 0;
    const query = searchQuery.toLowerCase();
    
    // Name matches (highest priority)
    if (profile.full_name?.toLowerCase().includes(query)) {
      score += 100;
    }
    
    // Username matches
    if (profile.username?.toLowerCase().includes(query)) {
      score += 80;
    }
    
    // Bio matches
    if (profile.bio?.toLowerCase().includes(query)) {
      score += 50;
    }
    
    // Expertise/subjects matches
    const expertiseMatch = profile.expertise_areas?.some(area => 
      area.toLowerCase().includes(query)
    );
    const subjectsMatch = profile.subjects_of_interest?.some(subject => 
      subject.toLowerCase().includes(query)
    );
    
    if (expertiseMatch || subjectsMatch) {
      score += 60;
    }
    
    // Reputation bonus
    score += Math.min(profile.reputation_score / 10, 20);
    
    // Verification bonus
    if (profile.is_verified) {
      score += 10;
    }
    
    return score;
  }
}

/**
 * Profile Data Transformation Utilities
 */
export class ProfileTransformUtils {
  /**
   * Transform full profile to public profile
   */
  static toPublicProfile(profile: Profile): PublicProfile {
    return {
      id: profile.id,
      full_name: profile.full_name,
      username: profile.username,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      role: profile.role,
      is_online: profile.is_online,
      reputation_score: profile.reputation_score,
      expertise_areas: profile.expertise_areas,
      years_of_experience: profile.years_of_experience,
      grade_level: profile.grade_level,
      subjects_of_interest: profile.subjects_of_interest,
      is_verified: profile.is_verified,
      created_at: profile.created_at,
      last_seen_at: profile.last_seen_at
    };
  }

  /**
   * Extract notification preferences
   */
  static extractNotificationPreferences(profile: Profile): NotificationPreferences {
    return {
      email_notifications: profile.email_notifications,
      push_notifications: profile.push_notifications,
      chat_notifications: profile.chat_notifications,
      whatsapp_notifications: profile.whatsapp_notifications,
      sms_notifications: profile.sms_notifications
    };
  }

  /**
   * Extract social links
   */
  static extractSocialLinks(profile: Profile): SocialLinks {
    return {
      website_url: profile.website_url,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      twitter_url: profile.twitter_url
    };
  }

  /**
   * Extract teacher-specific data
   */
  static extractTeacherProfile(profile: Profile): TeacherProfile | null {
    if (profile.role !== 'T' && profile.role !== 'C') return null;
    
    return {
      expertise_areas: profile.expertise_areas || [],
      years_of_experience: profile.years_of_experience || 0,
      hourly_rate: profile.hourly_rate || 0,
      reputation_score: profile.reputation_score
    };
  }

  /**
   * Extract student-specific data
   */
  static extractStudentProfile(profile: Profile): StudentProfile | null {
    if (profile.role !== 'S') return null;
    
    return {
      grade_level: profile.grade_level || '',
      subjects_of_interest: profile.subjects_of_interest || [],
      learning_goals: profile.learning_goals || ''
    };
  }
}

/**
 * Profile Permission Utilities
 */
export class ProfilePermissionUtils {
  /**
   * Check if user can view profile field
   */
  static canViewField(
    field: keyof Profile,
    viewerRole: UserRole,
    targetRole: UserRole,
    isOwnProfile: boolean
  ): boolean {
    // Own profile - can view everything
    if (isOwnProfile) return true;
    
    // Public fields everyone can see
    const publicFields: (keyof Profile)[] = [
      'id', 'full_name', 'username', 'bio', 'avatar_url', 'role',
      'reputation_score', 'is_verified', 'created_at', 'expertise_areas',
      'years_of_experience', 'grade_level', 'subjects_of_interest'
    ];
    
    if (publicFields.includes(field)) return true;
    
    // Private fields only for admins and own profile
    const privateFields: (keyof Profile)[] = [
      'email', 'phone', 'email_notifications', 'push_notifications',
      'chat_notifications', 'whatsapp_notifications', 'sms_notifications',
      'language_preference', 'timezone', 'hourly_rate'
    ];
    
    if (privateFields.includes(field)) {
      return viewerRole === 'SA' || viewerRole === 'A';
    }
    
    // Semi-private fields (coaches and admins can view)
    const semiPrivateFields: (keyof Profile)[] = [
      'is_online', 'last_seen_at', 'onboarding_level', 'profile_completion_percentage'
    ];
    
    if (semiPrivateFields.includes(field)) {
      return viewerRole === 'SA' || viewerRole === 'A' || viewerRole === 'C';
    }
    
    return false;
  }

  /**
   * Filter profile data based on permissions
   */
  static filterProfileData<T extends Partial<Profile>>(
    profile: T,
    viewerRole: UserRole,
    isOwnProfile: boolean
  ): Partial<T> {
    const filtered: Partial<T> = {};
    
    Object.keys(profile).forEach(key => {
      const field = key as keyof Profile;
      if (this.canViewField(field, viewerRole, profile.role!, isOwnProfile)) {
        (filtered as any)[key] = (profile as any)[key];
      }
    });
    
    return filtered;
  }
}

/**
 * Profile URL Utilities
 */
export class ProfileUrlUtils {
  /**
   * Generate profile URL
   */
  static getProfileUrl(username: string): string {
    return `/profile/${username}`;
  }

  /**
   * Generate avatar URL with fallback
   */
  static getAvatarUrl(profile: Partial<Profile | PublicProfile>, size: number = 400): string {
    // Handle new avatar system if available
    if (profile.avatar_url && typeof profile.avatar_url === 'object' && 'type' in profile.avatar_url) {
      try {
        // Import AvatarUtils dynamically to avoid circular dependencies
        const AvatarUtils = require('./avatar.utils').AvatarUtils;
        const initials = ProfileDisplayUtils.getInitials(profile);
        return AvatarUtils.getAvatarUrl(profile.avatar_url, initials);
      } catch (error) {
        console.warn('Error using new avatar system:', error);
      }
    }
    
    // Handle legacy string URLs
    if (profile.avatar_url && typeof profile.avatar_url === 'string') {
      return profile.avatar_url;
    }
    
    // Generate initials-based avatar URL as fallback
    const initials = ProfileDisplayUtils.getInitials(profile);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=random&format=png`;
  }

  /**
   * Generate QR code URL for profile
   */
  static getProfileQRCodeUrl(username: string): string {
    const profileUrl = `${window.location.origin}${this.getProfileUrl(username)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;
  }
}