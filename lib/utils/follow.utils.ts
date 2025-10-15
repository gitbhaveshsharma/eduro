/**
 * Follow System Utilities
 * 
 * Helper functions and utilities for the follow system
 * Provides validation, formatting, and data transformation utilities
 */

import type {
  FollowRelationship,
  FollowRelationshipWithProfile,
  FollowRequest,
  FollowRequestWithProfile,
  BlockedUser,
  BlockedUserWithProfile,
  FollowerProfile,
  FollowStatus,
  FollowRequestStatus,
  FollowCategory,
  FollowStatusCheck,
  FollowStats,
  FollowSuggestion,
  FollowActivity,
  FollowNetworkAnalysis,
  FollowFilters,
  FollowRequestFilters,
  BlockedUserFilters
} from '../schema/follow.types';

// =====================================
// DISPLAY UTILITIES
// =====================================

export class FollowDisplayUtils {
  /**
   * Get display name for a follower profile
   */
  static getDisplayName(profile: FollowerProfile): string {
    if (profile.full_name) {
      return profile.full_name;
    }
    if (profile.username) {
      return `@${profile.username}`;
    }
    return 'Unknown User';
  }

  /**
   * Get initials for avatar display
   */
  static getInitials(profile: FollowerProfile): string {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    if (profile.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Format follow status for display
   */
  static formatFollowStatus(status: FollowStatus): string {
    switch (status) {
      case 'active':
        return 'Following';
      case 'blocked':
        return 'Blocked';
      case 'muted':
        return 'Muted';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format follow request status for display
   */
  static formatRequestStatus(status: FollowRequestStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format follow category for display
   */
  static formatFollowCategory(category: FollowCategory): string {
    if (!category) return 'General';
    
    switch (category) {
      case 'close_friend':
        return 'Close Friend';
      case 'colleague':
        return 'Colleague';
      case 'mentor':
        return 'Mentor';
      case 'student':
        return 'Student';
      case 'classmate':
        return 'Classmate';
      case 'teacher':
        return 'Teacher';
      default:
        return 'General';
    }
  }

  /**
   * Get follow relationship description
   */
  static getRelationshipDescription(status: FollowStatusCheck): string {
    if (status.is_blocked) {
      return 'This user has blocked you';
    }
    if (status.is_blocking) {
      return 'You have blocked this user';
    }
    if (status.is_mutual) {
      return 'You follow each other';
    }
    if (status.is_following) {
      return 'You are following this user';
    }
    if (status.is_followed_by) {
      return 'This user follows you';
    }
    if (status.has_pending_request) {
      return 'Follow request sent';
    }
    if (status.has_received_request) {
      return 'Follow request received';
    }
    return 'No relationship';
  }

  /**
   * Format timestamp for follow activities
   */
  static formatFollowTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format follow counts for display
   */
  static formatFollowCount(count: number): string {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(1)}M`;
    }
  }

  /**
   * Get role badge text
   */
  static getRoleBadge(role: FollowerProfile['role']): string {
    switch (role) {
      case 'SA':
        return 'Super Admin';
      case 'A':
        return 'Admin';
      case 'T':
        return 'Teacher';
      case 'C':
        return 'Coach';
      case 'S':
        return 'Student';
      default:
        return '';
    }
  }

  /**
   * Get online status text
   */
  static getOnlineStatus(isOnline: boolean, lastSeen?: string): string {
    if (isOnline) {
      return 'Online';
    }
    if (lastSeen) {
      return `Last seen ${this.formatFollowTime(lastSeen)}`;
    }
    return 'Offline';
  }
}

// =====================================
// VALIDATION UTILITIES
// =====================================

export class FollowValidationUtils {
  /**
   * Validate follow category
   */
  static validateFollowCategory(category: string | null): { valid: boolean; error?: string } {
    if (!category) {
      return { valid: true };
    }

    const validCategories = ['close_friend', 'colleague', 'mentor', 'student', 'classmate', 'teacher'];
    
    if (!validCategories.includes(category)) {
      return { 
        valid: false, 
        error: 'Invalid follow category' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate follow notes
   */
  static validateFollowNotes(notes: string | null): { valid: boolean; error?: string } {
    if (!notes) {
      return { valid: true };
    }

    if (notes.length > 500) {
      return { 
        valid: false, 
        error: 'Notes must be 500 characters or less' 
      };
    }

    // Check for prohibited content (basic)
    const prohibitedWords = ['spam', 'abuse']; // Extend as needed
    const hasProhibitedContent = prohibitedWords.some(word => 
      notes.toLowerCase().includes(word)
    );

    if (hasProhibitedContent) {
      return { 
        valid: false, 
        error: 'Notes contain prohibited content' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate follow request message
   */
  static validateRequestMessage(message: string | null): { valid: boolean; error?: string } {
    if (!message) {
      return { valid: true };
    }

    if (message.length > 500) {
      return { 
        valid: false, 
        error: 'Message must be 500 characters or less' 
      };
    }

    if (message.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Message cannot be empty' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate block reason
   */
  static validateBlockReason(reason: string | null): { valid: boolean; error?: string } {
    if (!reason) {
      return { valid: true };
    }

    if (reason.length > 200) {
      return { 
        valid: false, 
        error: 'Reason must be 200 characters or less' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate user ID
   */
  static validateUserId(userId: string): { valid: boolean; error?: string } {
    if (!userId) {
      return { 
        valid: false, 
        error: 'User ID is required' 
      };
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      return { 
        valid: false, 
        error: 'Invalid user ID format' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate bulk operation size
   */
  static validateBulkOperationSize(userIds: string[]): { valid: boolean; error?: string } {
    if (!userIds || userIds.length === 0) {
      return { 
        valid: false, 
        error: 'At least one user ID is required' 
      };
    }

    if (userIds.length > 50) {
      return { 
        valid: false, 
        error: 'Cannot process more than 50 users at once' 
      };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      return { 
        valid: false, 
        error: 'Duplicate user IDs found' 
      };
    }

    return { valid: true };
  }
}

// =====================================
// FILTERING UTILITIES
// =====================================

export class FollowFilterUtils {
  /**
   * Filter followers by criteria
   */
  static filterFollowers(
    followers: FollowRelationshipWithProfile[],
    filters: FollowFilters
  ): FollowRelationshipWithProfile[] {
    let filtered = [...followers];

    if (filters.follow_status) {
      const statuses = Array.isArray(filters.follow_status) 
        ? filters.follow_status 
        : [filters.follow_status];
      filtered = filtered.filter(f => statuses.includes(f.follow_status));
    }

    if (filters.follow_category) {
      const categories = Array.isArray(filters.follow_category) 
        ? filters.follow_category 
        : [filters.follow_category];
      filtered = filtered.filter(f => 
        f.follow_category && categories.includes(f.follow_category)
      );
    }

    if (filters.is_mutual !== undefined) {
      filtered = filtered.filter(f => f.is_mutual === filters.is_mutual);
    }

    if (filters.notification_enabled !== undefined) {
      filtered = filtered.filter(f => f.notification_enabled === filters.notification_enabled);
    }

    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filtered = filtered.filter(f => {
        const profile = f.follower_profile;
        if (!profile) return false;
        
        return (
          profile.username?.toLowerCase().includes(query) ||
          profile.full_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }

  /**
   * Filter follow requests by criteria
   */
  static filterFollowRequests(
    requests: FollowRequestWithProfile[],
    filters: FollowRequestFilters
  ): FollowRequestWithProfile[] {
    let filtered = [...requests];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) 
        ? filters.status 
        : [filters.status];
      filtered = filtered.filter(r => statuses.includes(r.status));
    }

    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filtered = filtered.filter(r => {
        const requester = r.requester_profile;
        const target = r.target_profile;
        
        return (
          requester?.username?.toLowerCase().includes(query) ||
          requester?.full_name?.toLowerCase().includes(query) ||
          target?.username?.toLowerCase().includes(query) ||
          target?.full_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }

  /**
   * Filter blocked users by criteria
   */
  static filterBlockedUsers(
    blockedUsers: BlockedUserWithProfile[],
    filters: BlockedUserFilters
  ): BlockedUserWithProfile[] {
    let filtered = [...blockedUsers];

    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filtered = filtered.filter(b => {
        const profile = b.blocked_profile;
        if (!profile) return false;
        
        return (
          profile.username?.toLowerCase().includes(query) ||
          profile.full_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }
}

// =====================================
// SORTING UTILITIES
// =====================================

export class FollowSortUtils {
  /**
   * Sort followers by specified criteria
   */
  static sortFollowers(
    followers: FollowRelationshipWithProfile[],
    field: string,
    direction: 'asc' | 'desc' = 'desc'
  ): FollowRelationshipWithProfile[] {
    const sorted = [...followers].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (field) {
        case 'username':
          valueA = a.follower_profile?.username || '';
          valueB = b.follower_profile?.username || '';
          break;
        case 'full_name':
          valueA = a.follower_profile?.full_name || '';
          valueB = b.follower_profile?.full_name || '';
          break;
        case 'follower_count':
          valueA = a.follower_profile?.follower_count || 0;
          valueB = b.follower_profile?.follower_count || 0;
          break;
        case 'following_count':
          valueA = a.follower_profile?.following_count || 0;
          valueB = b.follower_profile?.following_count || 0;
          break;
        case 'created_at':
        case 'updated_at':
          valueA = new Date(a[field]).getTime();
          valueB = new Date(b[field]).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }

  /**
   * Sort follow requests by specified criteria
   */
  static sortFollowRequests(
    requests: FollowRequestWithProfile[],
    field: string,
    direction: 'asc' | 'desc' = 'desc'
  ): FollowRequestWithProfile[] {
    const sorted = [...requests].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (field) {
        case 'username':
          valueA = a.requester_profile?.username || a.target_profile?.username || '';
          valueB = b.requester_profile?.username || b.target_profile?.username || '';
          break;
        case 'full_name':
          valueA = a.requester_profile?.full_name || a.target_profile?.full_name || '';
          valueB = b.requester_profile?.full_name || b.target_profile?.full_name || '';
          break;
        case 'created_at':
        case 'updated_at':
        case 'responded_at':
          valueA = a[field] ? new Date(a[field]).getTime() : 0;
          valueB = b[field] ? new Date(b[field]).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }
}

// =====================================
// TRANSFORMATION UTILITIES
// =====================================

export class FollowTransformUtils {
  /**
   * Transform follow relationship for API response
   */
  static transformFollowRelationship(
    relationship: FollowRelationship,
    profile?: FollowerProfile
  ): FollowRelationshipWithProfile {
    return {
      ...relationship,
      follower_profile: profile,
    };
  }

  /**
   * Transform follow request for API response
   */
  static transformFollowRequest(
    request: FollowRequest,
    requesterProfile?: FollowerProfile,
    targetProfile?: FollowerProfile
  ): FollowRequestWithProfile {
    return {
      ...request,
      requester_profile: requesterProfile,
      target_profile: targetProfile,
    };
  }

  /**
   * Extract profile data for follow operations
   */
  static extractFollowerProfile(profile: any): FollowerProfile {
    return {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      is_verified: profile.is_verified || false,
      is_online: profile.is_online || false,
      follower_count: profile.follower_count || 0,
      following_count: profile.following_count || 0,
      created_at: profile.created_at,
    };
  }

  /**
   * Create follow activity from relationship
   */
  static createFollowActivity(
    type: FollowActivity['type'],
    user: FollowerProfile,
    targetUser?: FollowerProfile
  ): FollowActivity {
    return {
      id: `activity-${Date.now()}`,
      type,
      user,
      target_user: targetUser,
      created_at: new Date().toISOString(),
    };
  }
}

// =====================================
// SEARCH UTILITIES
// =====================================

export class FollowSearchUtils {
  /**
   * Search followers by query
   */
  static searchFollowers(
    followers: FollowRelationshipWithProfile[],
    query: string
  ): FollowRelationshipWithProfile[] {
    if (!query.trim()) {
      return followers;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return followers.filter(follower => {
      const profile = follower.follower_profile;
      if (!profile) return false;

      return (
        profile.username?.toLowerCase().includes(searchTerm) ||
        profile.full_name?.toLowerCase().includes(searchTerm) ||
        follower.notes?.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Search in follow requests
   */
  static searchFollowRequests(
    requests: FollowRequestWithProfile[],
    query: string
  ): FollowRequestWithProfile[] {
    if (!query.trim()) {
      return requests;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return requests.filter(request => {
      const requester = request.requester_profile;
      const target = request.target_profile;

      return (
        requester?.username?.toLowerCase().includes(searchTerm) ||
        requester?.full_name?.toLowerCase().includes(searchTerm) ||
        target?.username?.toLowerCase().includes(searchTerm) ||
        target?.full_name?.toLowerCase().includes(searchTerm) ||
        request.message?.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Get search suggestions based on partial query
   */
  static getSearchSuggestions(
    followers: FollowRelationshipWithProfile[],
    query: string,
    limit: number = 5
  ): string[] {
    if (!query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = new Set<string>();

    followers.forEach(follower => {
      const profile = follower.follower_profile;
      if (!profile) return;

      if (profile.username?.toLowerCase().startsWith(searchTerm)) {
        suggestions.add(profile.username);
      }
      if (profile.full_name?.toLowerCase().includes(searchTerm)) {
        suggestions.add(profile.full_name);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// =====================================
// ANALYTICS UTILITIES
// =====================================

export class FollowAnalyticsUtils {
  /**
   * Calculate follow engagement metrics
   */
  static calculateEngagementMetrics(stats: FollowStats): {
    mutualFollowRate: number;
    followBackRate: number;
    engagementScore: number;
  } {
    const mutualFollowRate = stats.followers > 0 
      ? (stats.mutual_follows / stats.followers) * 100 
      : 0;

    const followBackRate = stats.following > 0 
      ? (stats.mutual_follows / stats.following) * 100 
      : 0;

    // Simple engagement score based on mutual follows and activity
    const engagementScore = Math.min(
      (mutualFollowRate + followBackRate) / 2,
      100
    );

    return {
      mutualFollowRate: Math.round(mutualFollowRate * 100) / 100,
      followBackRate: Math.round(followBackRate * 100) / 100,
      engagementScore: Math.round(engagementScore * 100) / 100,
    };
  }

  /**
   * Analyze follow patterns
   */
  static analyzeFollowPatterns(
    followers: FollowRelationshipWithProfile[],
    following: FollowRelationshipWithProfile[]
  ): {
    mostCommonCategory: FollowCategory | null;
    averageFollowAge: number;
    mutualConnections: number;
    categoryDistribution: Record<string, number>;
  } {
    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    let mostCommonCategory: FollowCategory | null = null;
    let maxCount = 0;

    following.forEach(follow => {
      const category = follow.follow_category || 'general';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      
      if (categoryDistribution[category] > maxCount) {
        maxCount = categoryDistribution[category];
        mostCommonCategory = follow.follow_category;
      }
    });

    // Average follow age in days
    const now = Date.now();
    const totalAge = following.reduce((sum, follow) => {
      const age = now - new Date(follow.created_at).getTime();
      return sum + age;
    }, 0);
    
    const averageFollowAge = following.length > 0 
      ? Math.round(totalAge / following.length / (1000 * 60 * 60 * 24))
      : 0;

    // Mutual connections
    const mutualConnections = following.filter(f => f.is_mutual).length;

    return {
      mostCommonCategory,
      averageFollowAge,
      mutualConnections,
      categoryDistribution,
    };
  }

  /**
   * Generate follow recommendations score
   */
  static calculateRecommendationScore(
    targetProfile: FollowerProfile,
    currentUserProfile: FollowerProfile,
    mutualConnections: number = 0
  ): number {
    let score = 0;

    // Role compatibility
    if (targetProfile.role === currentUserProfile.role) {
      score += 20;
    } else if (
      (targetProfile.role === 'T' && currentUserProfile.role === 'S') ||
      (targetProfile.role === 'C' && currentUserProfile.role === 'S')
    ) {
      score += 30; // Teachers/Coaches are good for students
    }

    // Verification bonus
    if (targetProfile.is_verified) {
      score += 15;
    }

    // Mutual connections bonus
    score += Math.min(mutualConnections * 10, 50);

    // Follower count influence (not too high, not too low)
    const followerCount = targetProfile.follower_count;
    if (followerCount >= 10 && followerCount <= 1000) {
      score += 10;
    } else if (followerCount > 1000 && followerCount <= 10000) {
      score += 5;
    }

    // Online status bonus
    if (targetProfile.is_online) {
      score += 5;
    }

    return Math.min(score, 100);
  }
}

// =====================================
// PERMISSION UTILITIES
// =====================================

export class FollowPermissionUtils {
  /**
   * Check if user can follow another user
   */
  static canFollow(
    currentUserRole: FollowerProfile['role'],
    targetUserRole: FollowerProfile['role'],
    followStatus?: FollowStatusCheck
  ): boolean {
    // Can't follow if already following or blocked
    if (followStatus?.is_following || followStatus?.is_blocked || followStatus?.is_blocking) {
      return false;
    }

    // Basic permission - all users can follow each other
    return true;
  }

  /**
   * Check if user can send follow request
   */
  static canSendRequest(
    currentUserRole: FollowerProfile['role'],
    targetUserRole: FollowerProfile['role'],
    followStatus?: FollowStatusCheck
  ): boolean {
    // Can't send request if already following, blocked, or request pending
    if (
      followStatus?.is_following ||
      followStatus?.is_blocked ||
      followStatus?.is_blocking ||
      followStatus?.has_pending_request
    ) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can block another user
   */
  static canBlock(
    currentUserRole: FollowerProfile['role'],
    targetUserRole: FollowerProfile['role']
  ): boolean {
    // Can't block admins (unless you're a super admin)
    if (targetUserRole === 'SA') {
      return false;
    }
    if (targetUserRole === 'A' && currentUserRole !== 'SA') {
      return false;
    }

    return true;
  }

  /**
   * Check if user can view followers/following list
   */
  static canViewFollowList(
    viewerRole: FollowerProfile['role'],
    targetUserRole: FollowerProfile['role'],
    isOwnProfile: boolean
  ): boolean {
    // Can always view own profile
    if (isOwnProfile) {
      return true;
    }

    // Admins can view all
    if (viewerRole === 'SA' || viewerRole === 'A') {
      return true;
    }

    // Public profiles - everyone can view
    return true;
  }
}

// =====================================
// URL UTILITIES
// =====================================

export class FollowUrlUtils {
  /**
   * Generate follow-related URLs
   */
  static getFollowersUrl(username: string): string {
    return `/profile/${username}/followers`;
  }

  static getFollowingUrl(username: string): string {
    return `/profile/${username}/following`;
  }

  static getFollowRequestsUrl(): string {
    return '/follow-requests';
  }

  static getBlockedUsersUrl(): string {
    return '/settings/blocked-users';
  }

  static getProfileUrl(username: string): string {
    return `/profile/${username}`;
  }

  /**
   * Generate share URLs for follow actions
   */
  static getShareFollowUrl(username: string): string {
    return `${window.location.origin}/profile/${username}`;
  }
}