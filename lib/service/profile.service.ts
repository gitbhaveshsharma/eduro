/**
 * Profile Service
 * 
 * Handles all profile-related database operations and API interactions
 * Provides a clean interface for profile CRUD operations
 */

import { createClient } from '../supabase/client';
import { SupabaseRequestWrapper } from '../api-interceptor';

// Initialize Supabase client
const supabase = createClient();
import type {
  Profile,
  PublicProfile,
  ProfileUpdate,
  ProfileFilters,
  ProfileSort,
  ProfileSearchResult,
  ProfileStats,
  ProfileOperationResult,
  ProfilePermissions,
  OnboardingLevel
} from '../schema/profile.types';

export class ProfileService {
  /**
   * Get current user's profile
   */
  static async getCurrentProfile(): Promise<ProfileOperationResult<Profile>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    });
  }

  /**
   * Get profile by user ID
   */
  static async getProfile(userId: string): Promise<ProfileOperationResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get public profile by user ID
   */
  static async getPublicProfile(userId: string): Promise<ProfileOperationResult<PublicProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          bio,
          avatar_url,
          role,
          is_online,
          reputation_score,
          expertise_areas,
          years_of_experience,
          grade_level,
          subjects_of_interest,
          is_verified,
          created_at,
          last_seen_at
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get profile by username
   */
  static async getProfileByUsername(username: string): Promise<ProfileOperationResult<PublicProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          bio,
          avatar_url,
          role,
          is_online,
          reputation_score,
          expertise_areas,
          years_of_experience,
          grade_level,
          subjects_of_interest,
          is_verified,
          created_at,
          last_seen_at
        `)
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update current user's profile
   */
  static async updateProfile(updates: ProfileUpdate & { is_active?: boolean }): Promise<ProfileOperationResult<Profile>> {
    console.log('ProfileService.updateProfile called with:', updates);
    
    // Validate updates before making request
    const validationResult = this.validateProfileUpdate(updates);
    console.log('Validation result:', validationResult);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult);
      return validationResult as ProfileOperationResult<Profile>;
    }

    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating profile with data:', updateData);
      console.log('User ID:', user.id);

      return await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
    });
  }

  /**
   * Update profile avatar
   */
  static async updateAvatar(file: File): Promise<ProfileOperationResult<string>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const updateResult = await this.updateProfile({ avatar_url: publicUrl });
      
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true, data: publicUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Search profiles with filters and pagination
   */
  static async searchProfiles(
    filters: ProfileFilters = {},
    sort: ProfileSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    perPage: number = 20
  ): Promise<ProfileOperationResult<ProfileSearchResult>> {
    try {
      console.log('🟪 ProfileService.searchProfiles - Called with:', {
        filters,
        sort,
        page,
        perPage
      });
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          bio,
          avatar_url,
          role,
          is_online,
          reputation_score,
          expertise_areas,
          years_of_experience,
          grade_level,
          subjects_of_interest,
          is_verified,
          created_at,
          last_seen_at
        `, { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters.role) {
        console.log('🟪 ProfileService.searchProfiles - Applying role filter:', filters.role);
        if (Array.isArray(filters.role)) {
          query = query.in('role', filters.role);
        } else {
          query = query.eq('role', filters.role);
        }
      }

      if (filters.is_online !== undefined) {
        query = query.eq('is_online', filters.is_online);
      }

      if (filters.is_verified !== undefined) {
        query = query.eq('is_verified', filters.is_verified);
      }

      if (filters.expertise_areas && filters.expertise_areas.length > 0) {
        query = query.overlaps('expertise_areas', filters.expertise_areas);
      }

      if (filters.subjects_of_interest && filters.subjects_of_interest.length > 0) {
        query = query.overlaps('subjects_of_interest', filters.subjects_of_interest);
      }

      if (filters.grade_level) {
        query = query.eq('grade_level', filters.grade_level);
      }

      if (filters.min_reputation) {
        query = query.gte('reputation_score', filters.min_reputation);
      }

      if (filters.search_query) {
        console.log('🟪 ProfileService.searchProfiles - Applying search filter:', filters.search_query);
        query = query.or(`full_name.ilike.%${filters.search_query}%,username.ilike.%${filters.search_query}%,bio.ilike.%${filters.search_query}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      console.log('🟪 ProfileService.searchProfiles - Query result:', {
        dataCount: data?.length || 0,
        totalCount: count,
        error: error?.message
      });

      if (error) {
        console.error('🟪 ProfileService.searchProfiles - Query error:', error);
        return { success: false, error: error.message };
      }

      const result: ProfileSearchResult = {
        profiles: data || [],
        total_count: count || 0,
        page,
        per_page: perPage,
        has_more: (count || 0) > page * perPage
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(): Promise<ProfileOperationResult<ProfileStats>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_online, is_verified, is_premium, profile_completion_percentage')
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats: ProfileStats = {
        total_profiles: data.length,
        students: data.filter(p => p.role === 'S').length,
        teachers: data.filter(p => p.role === 'T').length,
        coaches: data.filter(p => p.role === 'C').length,
        admins: data.filter(p => p.role === 'A' || p.role === 'SA').length,
        online_users: data.filter(p => p.is_online).length,
        verified_users: data.filter(p => p.is_verified).length,
        premium_users: data.filter(p => p.is_premium).length,
        average_completion: Math.round(
          data.reduce((sum, p) => sum + p.profile_completion_percentage, 0) / data.length
        )
      };

      return { success: true, data: stats };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update user's online status
   */
  static async updateOnlineStatus(isOnline: boolean): Promise<ProfileOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updates: any = { 
        is_online: isOnline,
        last_seen_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update onboarding level
   */
  static async updateOnboardingLevel(level: OnboardingLevel): Promise<ProfileOperationResult<Profile>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('profiles')
        .update({ onboarding_level: level })
        .eq('id', user.id)
        .select()
        .single();
    });
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<ProfileOperationResult<boolean>> {
    try {
      if (!username || username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters long' };
      }

      // Check username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { success: false, error: error.message };
      }

      const isAvailable = !data;
      return { success: true, data: isAvailable };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get profile permissions for current user
   */
  static async getProfilePermissions(targetUserId: string): Promise<ProfileOperationResult<ProfilePermissions>> {
    try {
      const { data: canView, error: viewError } = await supabase
        .rpc('can_view_profile', { target_user_id: targetUserId });

      const { data: canEdit, error: editError } = await supabase
        .rpc('can_edit_profile', { target_user_id: targetUserId });

      if (viewError || editError) {
        return { success: false, error: 'Error checking permissions' };
      }

      const permissions: ProfilePermissions = {
        can_view: canView,
        can_edit: canEdit,
        can_delete: canEdit, // Same as edit for now
        can_view_private: canEdit // Can view private info if can edit
      };

      return { success: true, data: permissions };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Recalculate profile completion percentage
   */
  static async recalculateProfileCompletion(userId?: string): Promise<ProfileOperationResult<number>> {
    try {
      const { data, error } = await supabase
        .rpc('recalculate_profile_completion', { user_id: userId });

      if (error) {
        return { success: false, error: error.message };
      }

      const completionPercentage = data?.[0]?.completion_percentage || 0;
      return { success: true, data: completionPercentage };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Deactivate current user's profile
   */
  static async deactivateProfile(): Promise<ProfileOperationResult<void>> {
    try {
      const result = await this.updateProfile({ is_active: false });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Validate profile update data
   */
  private static validateProfileUpdate(updates: ProfileUpdate): ProfileOperationResult<void> {
    const errors: any[] = [];

    // Validate username format if provided
    if (updates.username !== undefined && updates.username !== null) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(updates.username)) {
        errors.push({
          field: 'username',
          message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
          code: 'INVALID_USERNAME_FORMAT'
        });
      }
    }

    // Validate phone format if provided
    if (updates.phone !== undefined && updates.phone !== null) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(updates.phone)) {
        errors.push({
          field: 'phone',
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    // Validate URLs if provided
    const urlFields: (keyof ProfileUpdate)[] = ['website_url', 'linkedin_url', 'github_url', 'twitter_url'];
    urlFields.forEach(field => {
      const url = updates[field];
      if (
        typeof url === 'string' &&
        url !== undefined &&
        url !== null &&
        url !== ''
      ) {
        try {
          new URL(url);
        } catch {
          errors.push({
            field,
            message: 'Invalid URL format',
            code: 'INVALID_URL_FORMAT'
          });
        }
      }
    });

    // Validate hourly rate if provided
    if (updates.hourly_rate !== undefined && updates.hourly_rate !== null) {
      if (updates.hourly_rate < 0 || updates.hourly_rate > 10000) {
        errors.push({
          field: 'hourly_rate',
          message: 'Hourly rate must be between 0 and 10000',
          code: 'INVALID_HOURLY_RATE'
        });
      }
    }

    // Validate years of experience if provided
    if (updates.years_of_experience !== undefined && updates.years_of_experience !== null) {
      if (updates.years_of_experience < 0 || updates.years_of_experience > 100) {
        errors.push({
          field: 'years_of_experience',
          message: 'Years of experience must be between 0 and 100',
          code: 'INVALID_EXPERIENCE'
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }
}