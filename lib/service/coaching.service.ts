/**
 * Coaching Service
 * 
 * Handles all coaching-related database operations and API interactions
 * Provides a clean interface for coaching center and branch CRUD operations
 */

import { createClient } from '../supabase/client';
import { SupabaseRequestWrapper } from '../api-interceptor';

// Initialize Supabase client
const supabase = createClient();
import type {
  CoachingCenter,
  CoachingBranch,
  PublicCoachingCenter,
  PublicCoachingBranch,
  CoachingCenterUpdate,
  CoachingBranchUpdate,
  CoachingCenterCreate,
  CoachingBranchCreate,
  CoachingCenterFilters,
  CoachingBranchFilters,
  CoachingCenterSort,
  CoachingBranchSort,
  CoachingCenterSearchResult,
  CoachingBranchSearchResult,
  CoachingCenterStats,
  CoachingCenterWithBranches,
  CoachingOperationResult,
  CoachingCenterPermissions,
  CoachingBranchPermissions,
  CoachingCenterDashboard,
  CoachingCategory,
  CoachingStatus
} from '../schema/coaching.types';

export class CoachingService {
  
  // ============================================================
  // COACHING CENTER OPERATIONS
  // ============================================================

  /**
   * Get coaching center by ID
   */
  static async getCoachingCenter(centerId: string): Promise<CoachingOperationResult<CoachingCenter>> {
    try {
      const { data, error } = await supabase
        .from('coaching_centers')
        .select('*')
        .eq('id', centerId)
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
   * Get public coaching center by ID
   */
  static async getPublicCoachingCenter(centerId: string): Promise<CoachingOperationResult<PublicCoachingCenter>> {
    try {
      const { data, error } = await supabase
        .from('coaching_center_details')
        .select(`
          id,
          name,
          slug,
          description,
          established_year,
          logo_url,
          cover_url,
          category,
          subjects,
          target_audience,
          phone,
          email,
          website,
          is_verified,
          is_featured,
          created_at,
          updated_at,
          total_branches,
          active_branches
        `)
        .eq('id', centerId)
        .eq('status', 'ACTIVE')
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
   * Get coaching center by slug
   */
  static async getCoachingCenterBySlug(slug: string): Promise<CoachingOperationResult<PublicCoachingCenter>> {
    try {
      const { data, error } = await supabase
        .from('coaching_center_details')
        .select(`
          id,
          name,
          slug,
          description,
          established_year,
          logo_url,
          cover_url,
          category,
          subjects,
          target_audience,
          phone,
          email,
          website,
          is_verified,
          is_featured,
          created_at,
          updated_at,
          total_branches,
          active_branches
        `)
        .eq('slug', slug)
        .eq('status', 'ACTIVE')
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
   * Get coaching centers owned by current user
   */
  static async getMyCoachingCenters(): Promise<CoachingOperationResult<CoachingCenter[]>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('coaching_centers')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Get coaching centers managed by current user
   */
  static async getManagedCoachingCenters(): Promise<CoachingOperationResult<CoachingCenter[]>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('coaching_centers')
        .select('*')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Create a new coaching center
   */
  static async createCoachingCenter(centerData: CoachingCenterCreate): Promise<CoachingOperationResult<CoachingCenter>> {
    // Validate input data
    const validationResult = this.validateCoachingCenterData(centerData);
    if (!validationResult.success) {
      return validationResult as CoachingOperationResult<CoachingCenter>;
    }

    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('coaching_centers')
        .insert({
          ...centerData,
          owner_id: user.id
        })
        .select()
        .single();
    });
  }

  /**
   * Update coaching center
   */
  static async updateCoachingCenter(centerId: string, updates: CoachingCenterUpdate): Promise<CoachingOperationResult<CoachingCenter>> {
    // Validate updates
    const validationResult = this.validateCoachingCenterUpdate(updates);
    if (!validationResult.success) {
      return validationResult as CoachingOperationResult<CoachingCenter>;
    }

    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('coaching_centers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', centerId)
        .or(`owner_id.eq.${user.id},manager_id.eq.${user.id}`)
        .select()
        .single();
    });
  }

  /**
   * Delete coaching center
   */
  static async deleteCoachingCenter(centerId: string): Promise<CoachingOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('coaching_centers')
        .delete()
        .eq('id', centerId)
        .eq('owner_id', user.id);

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
   * Search coaching centers with filters and pagination
   */
  static async searchCoachingCenters(
    filters: CoachingCenterFilters = {},
    sort: CoachingCenterSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    perPage: number = 20
  ): Promise<CoachingOperationResult<CoachingCenterSearchResult>> {
    try {
      let query = supabase
        .from('coaching_center_details')
        .select(`
          id,
          name,
          slug,
          description,
          established_year,
          logo_url,
          cover_url,
          category,
          subjects,
          target_audience,
          phone,
          email,
          website,
          is_verified,
          is_featured,
          created_at,
          updated_at,
          total_branches,
          active_branches
        `, { count: 'exact' })
        .eq('status', 'ACTIVE')
        .eq('is_verified', true);

      // Apply filters
      if (filters.category) {
        if (Array.isArray(filters.category)) {
          query = query.in('category', filters.category);
        } else {
          query = query.eq('category', filters.category);
        }
      }

      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters.subjects && filters.subjects.length > 0) {
        query = query.overlaps('subjects', filters.subjects);
      }

      if (filters.target_audience && filters.target_audience.length > 0) {
        query = query.overlaps('target_audience', filters.target_audience);
      }

      if (filters.established_year_from) {
        query = query.gte('established_year', filters.established_year_from);
      }

      if (filters.established_year_to) {
        query = query.lte('established_year', filters.established_year_to);
      }

      if (filters.search_query) {
        query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const result: CoachingCenterSearchResult = {
        centers: data || [],
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
   * Get coaching center with all branches
   */
  static async getCoachingCenterWithBranches(centerId: string): Promise<CoachingOperationResult<CoachingCenterWithBranches>> {
    try {
      // Get center details
      const centerResult = await this.getPublicCoachingCenter(centerId);
      if (!centerResult.success || !centerResult.data) {
        return { success: false, error: centerResult.error };
      }

      // Get branches
      const branchesResult = await this.getBranchesByCenter(centerId);
      if (!branchesResult.success) {
        return { success: false, error: branchesResult.error };
      }

      const centerWithBranches: CoachingCenterWithBranches = {
        ...centerResult.data,
        branches: branchesResult.data || []
      };

      return { success: true, data: centerWithBranches };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get coaching center dashboard data
   */
  static async getCoachingCenterDashboard(centerId: string): Promise<CoachingOperationResult<CoachingCenterDashboard>> {
    try {
      // Get full center data (with authentication)
      const centerResult = await this.getCoachingCenter(centerId);
      if (!centerResult.success || !centerResult.data) {
        return { success: false, error: centerResult.error };
      }

      // Get all branches (with full data for dashboard)
      const { data: fullBranches, error: branchError } = await supabase
        .from('coaching_branches')
        .select('*')
        .eq('coaching_center_id', centerId)
        .order('is_main_branch', { ascending: false })
        .order('created_at', { ascending: false });

      if (branchError) {
        return { success: false, error: branchError.message };
      }

      const branches = fullBranches || [];

      // Get permissions
      const permissionsResult = await this.getCoachingCenterPermissions(centerId);
      const permissions = permissionsResult.data || {
        can_view: false,
        can_edit: false,
        can_delete: false,
        can_manage_branches: false,
        can_verify: false,
        can_feature: false
      };

      // Calculate stats
      const activeBranches = branches.filter(b => b.is_active);
      const mainBranch = branches.find(b => b.is_main_branch);

      const dashboard: CoachingCenterDashboard = {
        center: centerResult.data,
        branches,
        stats: {
          total_branches: branches.length,
          active_branches: activeBranches.length,
          main_branch: mainBranch
        },
        permissions
      };

      return { success: true, data: dashboard };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================================
  // COACHING BRANCH OPERATIONS
  // ============================================================

  /**
   * Get coaching branch by ID
   */
  static async getCoachingBranch(branchId: string): Promise<CoachingOperationResult<CoachingBranch>> {
    try {
      const { data, error } = await supabase
        .from('coaching_branches')
        .select('*')
        .eq('id', branchId)
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
   * Get branches by coaching center
   */
  static async getBranchesByCenter(
    centerId: string, 
    activeOnly: boolean = true
  ): Promise<CoachingOperationResult<PublicCoachingBranch[]>> {
    try {
      let query = supabase
        .from('coaching_branches')
        .select(`
          id,
          coaching_center_id,
          name,
          description,
          phone,
          email,
          is_main_branch,
          is_active,
          created_at,
          updated_at
        `)
        .eq('coaching_center_id', centerId)
        .order('is_main_branch', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create a new coaching branch
   */
  static async createCoachingBranch(branchData: CoachingBranchCreate): Promise<CoachingOperationResult<CoachingBranch>> {
    // Validate input data
    const validationResult = this.validateCoachingBranchData(branchData);
    if (!validationResult.success) {
      return validationResult as CoachingOperationResult<CoachingBranch>;
    }

    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check if user has permission to create branch for this center
      const { data: center, error: centerError } = await supabase
        .from('coaching_centers')
        .select('owner_id, manager_id')
        .eq('id', branchData.coaching_center_id)
        .single();

      if (centerError || !center) {
        return { data: null, error: { message: 'Coaching center not found' } };
      }

      if (center.owner_id !== user.id && center.manager_id !== user.id) {
        return { data: null, error: { message: 'Not authorized to create branches for this center' } };
      }

      return await supabase
        .from('coaching_branches')
        .insert(branchData)
        .select()
        .single();
    });
  }

  /**
   * Update coaching branch
   */
  static async updateCoachingBranch(branchId: string, updates: CoachingBranchUpdate): Promise<CoachingOperationResult<CoachingBranch>> {
    // Validate updates
    const validationResult = this.validateCoachingBranchUpdate(updates);
    if (!validationResult.success) {
      return validationResult as CoachingOperationResult<CoachingBranch>;
    }

    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      return await supabase
        .from('coaching_branches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId)
        .select()
        .single();
    });
  }

  /**
   * Delete coaching branch
   */
  static async deleteCoachingBranch(branchId: string): Promise<CoachingOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('coaching_branches')
        .delete()
        .eq('id', branchId);

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

  // ============================================================
  // STATISTICS AND ANALYTICS
  // ============================================================

  /**
   * Get coaching center statistics
   */
  static async getCoachingCenterStats(): Promise<CoachingOperationResult<CoachingCenterStats>> {
    try {
      const { data, error } = await supabase
        .from('coaching_centers')
        .select('category, status, is_verified, is_featured')
        .eq('status', 'ACTIVE');

      if (error) {
        return { success: false, error: error.message };
      }

      // Get branch statistics
      const { data: branchData, error: branchError } = await supabase
        .from('coaching_branches')
        .select('is_active');

      if (branchError) {
        return { success: false, error: branchError.message };
      }

      const stats: CoachingCenterStats = {
        total_centers: data.length,
        active_centers: data.filter(c => c.status === 'ACTIVE').length,
        verified_centers: data.filter(c => c.is_verified).length,
        featured_centers: data.filter(c => c.is_featured).length,
        centers_by_category: data.reduce((acc, center) => {
          const category = center.category as CoachingCategory;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<CoachingCategory, number>),
        total_branches: branchData.length,
        active_branches: branchData.filter(b => b.is_active).length,
        average_branches_per_center: data.length > 0 ? branchData.length / data.length : 0
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
   * Get coaching center statistics using database function
   */
  static async getCoachingCenterStatsFromFunction(centerId: string): Promise<CoachingOperationResult<any>> {
    try {
      const { data, error } = await supabase
        .rpc('get_coaching_center_stats', { center_id: centerId });

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

  // ============================================================
  // PERMISSIONS AND ACCESS CONTROL
  // ============================================================

  /**
   * Get coaching center permissions for current user
   */
  static async getCoachingCenterPermissions(centerId: string): Promise<CoachingOperationResult<CoachingCenterPermissions>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: true, 
          data: {
            can_view: true, // Public can view
            can_edit: false,
            can_delete: false,
            can_manage_branches: false,
            can_verify: false,
            can_feature: false
          }
        };
      }

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Get center ownership/management info
      const { data: center } = await supabase
        .from('coaching_centers')
        .select('owner_id, manager_id')
        .eq('id', centerId)
        .single();

      const isOwner = center?.owner_id === user.id;
      const isManager = center?.manager_id === user.id;
      const isAdmin = profile?.role === 'A' || profile?.role === 'SA';
      const isSuperAdmin = profile?.role === 'SA';

      const permissions: CoachingCenterPermissions = {
        can_view: true, // Everyone can view public centers
        can_edit: isOwner || isManager || isAdmin,
        can_delete: isOwner || isSuperAdmin,
        can_manage_branches: isOwner || isManager || isAdmin,
        can_verify: isAdmin,
        can_feature: isAdmin
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
   * Get coaching branch permissions for current user
   */
  static async getCoachingBranchPermissions(branchId: string): Promise<CoachingOperationResult<CoachingBranchPermissions>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: true, 
          data: {
            can_view: true,
            can_edit: false,
            can_delete: false,
            can_set_as_main: false
          }
        };
      }

      // Get branch and center info
      const { data: branch } = await supabase
        .from('coaching_branches')
        .select(`
          coaching_center_id,
          manager_id,
          coaching_centers!inner(owner_id, manager_id)
        `)
        .eq('id', branchId)
        .single();

      if (!branch) {
        return { success: false, error: 'Branch not found' };
      }

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const centerData = (branch as any).coaching_centers;
      const isOwner = centerData?.owner_id === user.id;
      const isCenterManager = centerData?.manager_id === user.id;
      const isBranchManager = branch.manager_id === user.id;
      const isAdmin = profile?.role === 'A' || profile?.role === 'SA';
      const isSuperAdmin = profile?.role === 'SA';

      const permissions: CoachingBranchPermissions = {
        can_view: true,
        can_edit: isOwner || isCenterManager || isBranchManager || isAdmin,
        can_delete: isOwner || isSuperAdmin,
        can_set_as_main: isOwner || isCenterManager || isAdmin
      };

      return { success: true, data: permissions };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================================
  // UPLOAD OPERATIONS
  // ============================================================

  /**
   * Upload coaching center logo
   */
  static async uploadCoachingLogo(centerId: string, file: File): Promise<CoachingOperationResult<string>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${centerId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('coaching-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('coaching-media')
        .getPublicUrl(fileName);

      // Update center with new logo URL
      const updateResult = await this.updateCoachingCenter(centerId, { logo_url: publicUrl });
      
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
   * Upload coaching center cover image
   */
  static async uploadCoachingCover(centerId: string, file: File): Promise<CoachingOperationResult<string>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${centerId}/cover.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('coaching-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('coaching-media')
        .getPublicUrl(fileName);

      // Update center with new cover URL
      const updateResult = await this.updateCoachingCenter(centerId, { cover_url: publicUrl });
      
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

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Check if coaching center slug is available
   */
  static async isSlugAvailable(slug: string, excludeCenterId?: string): Promise<CoachingOperationResult<boolean>> {
    try {
      if (!slug || slug.length < 3) {
        return { success: false, error: 'Slug must be at least 3 characters long' };
      }

      // Check slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
      }

      let query = supabase
        .from('coaching_centers')
        .select('slug')
        .eq('slug', slug);

      if (excludeCenterId) {
        query = query.neq('id', excludeCenterId);
      }

      const { data, error } = await query.single();

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
   * Search coaching centers using database function
   */
  static async searchCoachingCentersWithFunction(
    searchQuery?: string,
    category?: CoachingCategory,
    limitCount: number = 20,
    offsetCount: number = 0
  ): Promise<CoachingOperationResult<PublicCoachingCenter[]>> {
    try {
      const { data, error } = await supabase
        .rpc('search_coaching_centers', {
          search_query: searchQuery || null,
          category_filter: category || null,
          limit_count: limitCount,
          offset_count: offsetCount
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================================
  // VALIDATION FUNCTIONS
  // ============================================================

  /**
   * Validate coaching center creation data
   */
  private static validateCoachingCenterData(data: CoachingCenterCreate): CoachingOperationResult<void> {
    const errors: any[] = [];

    // Required fields
    if (!data.name || data.name.trim().length < 3) {
      errors.push({
        field: 'name',
        message: 'Name must be at least 3 characters long',
        code: 'INVALID_NAME'
      });
    }

    if (data.name && data.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be no more than 100 characters long',
        code: 'NAME_TOO_LONG'
      });
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    }

    // Validate phone if provided
    if (data.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push({
          field: 'phone',
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    // Validate website URL if provided
    if (data.website) {
      try {
        new URL(data.website);
      } catch {
        errors.push({
          field: 'website',
          message: 'Invalid website URL format',
          code: 'INVALID_URL_FORMAT'
        });
      }
    }

    // Validate established year if provided
    if (data.established_year !== undefined && data.established_year !== null) {
      const currentYear = new Date().getFullYear();
      if (data.established_year < 1800 || data.established_year > currentYear) {
        errors.push({
          field: 'established_year',
          message: `Established year must be between 1800 and ${currentYear}`,
          code: 'INVALID_ESTABLISHED_YEAR'
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  /**
   * Validate coaching center update data
   */
  private static validateCoachingCenterUpdate(updates: CoachingCenterUpdate): CoachingOperationResult<void> {
    // Use the same validation logic as creation, but make all fields optional
    const tempData = { name: 'temp', category: 'OTHER' as CoachingCategory, ...updates };
    return this.validateCoachingCenterData(tempData as CoachingCenterCreate);
  }

  /**
   * Validate coaching branch creation data
   */
  private static validateCoachingBranchData(data: CoachingBranchCreate): CoachingOperationResult<void> {
    const errors: any[] = [];

    // Required fields
    if (!data.name || data.name.trim().length < 3) {
      errors.push({
        field: 'name',
        message: 'Branch name must be at least 3 characters long',
        code: 'INVALID_NAME'
      });
    }

    if (data.name && data.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Branch name must be no more than 100 characters long',
        code: 'NAME_TOO_LONG'
      });
    }

    if (!data.coaching_center_id) {
      errors.push({
        field: 'coaching_center_id',
        message: 'Coaching center ID is required',
        code: 'MISSING_CENTER_ID'
      });
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    }

    // Validate phone if provided
    if (data.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push({
          field: 'phone',
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  /**
   * Validate coaching branch update data
   */
  private static validateCoachingBranchUpdate(updates: CoachingBranchUpdate): CoachingOperationResult<void> {
    // Use similar validation logic as creation, but make all fields optional
    const tempData = { 
      name: 'temp', 
      coaching_center_id: 'temp-id', 
      ...updates 
    };
    return this.validateCoachingBranchData(tempData as CoachingBranchCreate);
  }
}