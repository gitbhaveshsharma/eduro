/**
 * Address Service
 * 
 * Handles all address-related database operations and API interactions
 * Provides a clean interface for address CRUD operations, geocoding, and mapping
 */

import { createClient } from '../supabase/client';

// Initialize Supabase client
const supabase = createClient();
import type {
  Address,
  PublicAddress,
  AddressCreate,
  AddressUpdate,
  AddressFilters,
  AddressSort,
  AddressSearchResult,
  AddressStats,
  AddressOperationResult,
  AddressPermissions,
  DistanceResult,
  NearbyAddressesResult,
  GeocodingResult,
  ReverseGeocodingResult,
  Coordinates,
  GoogleMapsData,
  AddressValidationResult,
  AddressType
} from '../schema/address.types';

// Address service error codes
export const ADDRESS_ERROR_CODES = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  INVALID_PIN_CODE: 'INVALID_PIN_CODE',
  COORDINATES_OUT_OF_BOUNDS: 'COORDINATES_OUT_OF_BOUNDS',
  PRIMARY_ADDRESS_EXISTS: 'PRIMARY_ADDRESS_EXISTS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GEOCODING_FAILED: 'GEOCODING_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type AddressErrorCode = typeof ADDRESS_ERROR_CODES[keyof typeof ADDRESS_ERROR_CODES];

export class AddressService {
  /**
   * Get current user's addresses
   */
  static async getCurrentUserAddresses(): Promise<AddressOperationResult<Address[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        return { success: false, error: 'Authentication error' };
      }

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

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
   * Get current user's primary address
   */
  static async getPrimaryAddress(): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'No primary address found' };
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
   * Get address by ID
   */
  static async getAddress(addressId: string): Promise<AddressOperationResult<Address>> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
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
   * Get public addresses for a user (limited information)
   */
  static async getPublicAddresses(userId: string): Promise<AddressOperationResult<PublicAddress[]>> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select(`
          id,
          address_type,
          label,
          state,
          district,
          city,
          country,
          postal_address,
          is_verified
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

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
   * Create a new address
   */
  static async createAddress(addressData: AddressCreate): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate address data
      const validationResult = this.validateAddressData(addressData);
      if (!validationResult.valid) {
        return { success: false, errors: validationResult.errors };
      }

      // If this is being set as primary, remove primary flag from other addresses
      if (addressData.is_primary) {
        await this.clearPrimaryFlag(user.id);
      }

      // Format postal address if not provided
      const postalAddress = addressData.postal_address ||
        await this.formatAddress(addressData as Partial<Address>);

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...addressData,
          user_id: user.id,
          postal_address: postalAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
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
   * Update an existing address
   */
  static async updateAddress(addressId: string, updates: AddressUpdate): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate updates
      const validationResult = this.validateAddressData(updates);
      if (!validationResult.valid) {
        return { success: false, errors: validationResult.errors };
      }

      // If setting as primary, clear other primary addresses
      if (updates.is_primary) {
        await this.clearPrimaryFlag(user.id, addressId);
      }

      // Update postal address if location fields changed
      const shouldUpdatePostal = !!(
        updates.address_line_1 || updates.address_line_2 ||
        updates.city || updates.district || updates.state ||
        updates.pin_code || updates.country
      );

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (shouldUpdatePostal && !updates.postal_address) {
        // Get current address to merge with updates
        const currentResult = await this.getAddress(addressId);
        if (currentResult.success && currentResult.data) {
          const mergedAddress = { ...currentResult.data, ...updates };
          updateData.postal_address = await this.formatAddress(mergedAddress);
        }
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
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
   * Delete an address
   */
  static async deleteAddress(addressId: string): Promise<AddressOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if it's a primary address
      const addressResult = await this.getAddress(addressId);
      if (!addressResult.success) {
        return { success: false, error: 'Address not found' };
      }

      if (addressResult.data?.is_primary) {
        return { success: false, error: 'Cannot delete primary address. Set another address as primary first.' };
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('addresses')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', user.id);

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
   * Set address as primary
   */
  static async setPrimaryAddress(addressId: string): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Use the database function for atomic operation
      const { data, error } = await supabase
        .rpc('set_primary_address', {
          address_id: addressId,
          user_id_param: user.id
        });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Failed to set primary address' };
      }

      // Return the updated address
      return this.getAddress(addressId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search addresses with filters and pagination
   */
  static async searchAddresses(
    filters: AddressFilters = {},
    sort: AddressSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    perPage: number = 20
  ): Promise<AddressOperationResult<AddressSearchResult>> {
    try {
      let query = supabase
        .from('addresses')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters.coaching_id) {
        query = query.eq('coaching_id', filters.coaching_id);
      }

      if (filters.address_type) {
        if (Array.isArray(filters.address_type)) {
          query = query.in('address_type', filters.address_type);
        } else {
          query = query.eq('address_type', filters.address_type);
        }
      }

      if (filters.state) {
        if (Array.isArray(filters.state)) {
          query = query.in('state', filters.state);
        } else {
          query = query.eq('state', filters.state);
        }
      }

      if (filters.district) {
        if (Array.isArray(filters.district)) {
          query = query.in('district', filters.district);
        } else {
          query = query.eq('district', filters.district);
        }
      }

      if (filters.pin_code) {
        query = query.eq('pin_code', filters.pin_code);
      }

      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.is_primary !== undefined) {
        query = query.eq('is_primary', filters.is_primary);
      }

      if (filters.is_verified !== undefined) {
        query = query.eq('is_verified', filters.is_verified);
      }

      if (filters.search_query) {
        query = query.or(`label.ilike.%${filters.search_query}%,address_line_1.ilike.%${filters.search_query}%,address_line_2.ilike.%${filters.search_query}%,city.ilike.%${filters.search_query}%`);
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

      const result: AddressSearchResult = {
        addresses: data || [],
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
   * Get addresses near a location
   */
  static async getNearbyAddresses(
    coordinates: Coordinates,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<AddressOperationResult<NearbyAddressesResult>> {
    try {
      // Use the database function for distance calculation
      const { data, error } = await supabase
        .rpc('get_addresses_within_radius', {
          center_lat: coordinates.latitude,
          center_lng: coordinates.longitude,
          radius_km: radiusKm,
          result_limit: limit
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const addresses = data?.map((item: any) => ({
        ...item.address,
        distance_km: item.distance_km
      })) || [];

      const distances = data?.map((item: any) => ({
        address_id: item.address.id,
        distance_km: item.distance_km
      })) || [];

      const result: NearbyAddressesResult = {
        addresses,
        distances,
        center: coordinates,
        radius_km: radiusKm
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
   * Calculate distance between two addresses
   */
  static async calculateDistance(fromAddressId: string, toAddressId: string): Promise<AddressOperationResult<DistanceResult>> {
    try {
      const fromResult = await this.getAddress(fromAddressId);
      const toResult = await this.getAddress(toAddressId);

      if (!fromResult.success || !toResult.success) {
        return { success: false, error: 'One or both addresses not found' };
      }

      const fromAddr = fromResult.data!;
      const toAddr = toResult.data!;

      if (!fromAddr.latitude || !fromAddr.longitude || !toAddr.latitude || !toAddr.longitude) {
        return { success: false, error: 'Both addresses must have coordinates' };
      }

      const { data, error } = await supabase
        .rpc('calculate_distance_km', {
          lat1: fromAddr.latitude,
          lng1: fromAddr.longitude,
          lat2: toAddr.latitude,
          lng2: toAddr.longitude
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const result: DistanceResult = {
        distance_km: data,
        from_address: fromAddr,
        to_address: toAddr
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
   * Geocode an address to get coordinates
   */
  static async geocodeAddress(address: Partial<Address>): Promise<GeocodingResult> {
    try {
      // This would integrate with a geocoding service like Google Maps API
      // For now, return a placeholder implementation
      const addressString = await this.formatAddress(address);

      // TODO: Implement actual geocoding service integration
      return {
        success: false,
        error: 'Geocoding service not implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed'
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address components
   */
  static async reverseGeocode(coordinates: Coordinates): Promise<ReverseGeocodingResult> {
    try {
      // TODO: Implement actual reverse geocoding service integration
      return {
        success: false,
        error: 'Reverse geocoding service not implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reverse geocoding failed'
      };
    }
  }

  /**
   * Extract coordinates from Google Maps URL
   */
  static extractCoordinatesFromMapsUrl(mapsUrl: string): Coordinates | null {
    try {
      // Extract coordinates from various Google Maps URL formats
      const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3dlat!4dlng format
        /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/ // q=lat,lng format
      ];

      for (const pattern of patterns) {
        const match = mapsUrl.match(pattern);
        if (match) {
          const latitude = parseFloat(match[1]);
          const longitude = parseFloat(match[2]);

          if (!isNaN(latitude) && !isNaN(longitude)) {
            return { latitude, longitude };
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get address statistics
   */
  static async getAddressStats(): Promise<AddressOperationResult<AddressStats>> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('address_type, state, is_verified, is_primary, latitude, longitude')
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      const addresses = data || [];

      // Calculate statistics
      const byType: Record<AddressType, number> = {
        HOME: 0, WORK: 0, SCHOOL: 0, COLLEGE: 0, COACHING: 0,
        HOSTEL: 0, BRANCH: 0, OFFICE: 0, OTHER: 0
      };

      const stateCount: Record<string, number> = {};

      addresses.forEach((addr: Address) => {
        if (addr.address_type && byType.hasOwnProperty(addr.address_type)) {
          byType[addr.address_type as AddressType]++;
        }
        stateCount[addr.state] = (stateCount[addr.state] || 0) + 1;
      });

      const byState = Object.entries(stateCount)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);

      const stats: AddressStats = {
        total_addresses: addresses.length,
        by_type: byType,
        by_state: byState,
        verified_addresses: addresses.filter((a: Address) => a.is_verified).length,
        primary_addresses: addresses.filter((a: Address) => a.is_primary).length,
        with_coordinates: addresses.filter((a: Address) => a.latitude && a.longitude).length
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
   * Get address permissions for current user
   */
  static async getAddressPermissions(addressId: string): Promise<AddressOperationResult<AddressPermissions>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const addressResult = await this.getAddress(addressId);
      if (!addressResult.success) {
        return { success: false, error: 'Address not found' };
      }

      const address = addressResult.data!;
      const isOwner = address.user_id === user.id;

      // Get user role for admin permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'SA' || profile?.role === 'A';

      const permissions: AddressPermissions = {
        can_view: isOwner || isAdmin,
        can_edit: isOwner || isAdmin,
        can_delete: isOwner || isAdmin,
        can_view_coordinates: isOwner || isAdmin,
        can_set_primary: isOwner
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
   * Format address into a readable string
   */
  private static async formatAddress(address: Partial<Address>): Promise<string> {
    try {
      // Use the database function for formatting
      if (address.id) {
        const { data, error } = await supabase
          .rpc('format_address', { address_id: address.id });

        if (!error && data) {
          return data;
        }
      }

      // Fallback to manual formatting
      const parts: string[] = [];

      if (address.address_line_1) parts.push(address.address_line_1);
      if (address.address_line_2) parts.push(address.address_line_2);
      if (address.city) parts.push(address.city);
      if (address.district) parts.push(address.district);
      if (address.state) parts.push(address.state);
      if (address.pin_code) parts.push(address.pin_code);
      if (address.country) parts.push(address.country);

      return parts.join(', ');
    } catch (error) {
      return '';
    }
  }

  /**
   * Clear primary flag from all user's addresses except the specified one
   */
  private static async clearPrimaryFlag(userId: string, exceptAddressId?: string): Promise<void> {
    let query = supabase
      .from('addresses')
      .update({
        is_primary: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (exceptAddressId) {
      query = query.neq('id', exceptAddressId);
    }

    await query;
  }

  /**
   * Validate address data
   */
  private static validateAddressData(data: Partial<AddressCreate | AddressUpdate>): AddressValidationResult {
    const errors: any[] = [];

    // Validate PIN code format
    if (data.pin_code && !/^[0-9]{6}$/.test(data.pin_code)) {
      errors.push({
        field: 'pin_code',
        message: 'PIN code must be exactly 6 digits',
        code: 'INVALID_PIN_CODE'
      });
    }

    // Validate coordinates
    if (data.latitude !== undefined || data.longitude !== undefined) {
      if (data.latitude === undefined || data.longitude === undefined) {
        errors.push({
          field: 'coordinates',
          message: 'Both latitude and longitude must be provided',
          code: 'INVALID_COORDINATES'
        });
      } else if (
        data.latitude < -90 || data.latitude > 90 ||
        data.longitude < -180 || data.longitude > 180
      ) {
        errors.push({
          field: 'coordinates',
          message: 'Invalid coordinate values',
          code: 'COORDINATES_OUT_OF_BOUNDS'
        });
      }
    }

    // Validate Google Maps URL
    if (data.google_maps_url) {
      const urlPattern = /^https:\/\/(www\.)?google\.(com|co\.in)\/maps/;
      if (!urlPattern.test(data.google_maps_url)) {
        errors.push({
          field: 'google_maps_url',
          message: 'Invalid Google Maps URL format',
          code: 'INVALID_GOOGLE_MAPS_URL'
        });
      }
    }

    // Validate Plus Code
    if (data.google_plus_code) {
      const plusCodePattern = /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$/;
      if (!plusCodePattern.test(data.google_plus_code)) {
        errors.push({
          field: 'google_plus_code',
          message: 'Invalid Google Plus Code format',
          code: 'INVALID_PLUS_CODE'
        });
      }
    }

    // Validate field lengths
    const maxLengths = {
      label: 100,
      address_line_1: 200,
      address_line_2: 200,
      delivery_instructions: 500
    };

    Object.entries(maxLengths).forEach(([field, maxLength]) => {
      const value = (data as any)[field];
      if (value && value.length > maxLength) {
        errors.push({
          field,
          message: `${field} must be no more than ${maxLength} characters`,
          code: 'FIELD_TOO_LONG'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Link an address to a coaching center or branch
   * Updates the address with the appropriate IDs and address_type
   */
  static async linkAddressToEntity(
    addressId: string,
    entityType: 'branch' | 'coaching',
    entityId: string
  ): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare update data based on entity type
      const updateData: Partial<Address> = {
        updated_at: new Date().toISOString()
      };

      if (entityType === 'branch') {
        updateData.branch_id = entityId;
        updateData.address_type = 'BRANCH';
      } else if (entityType === 'coaching') {
        updateData.coaching_id = entityId;
        updateData.address_type = 'COACHING';
      }

      // Update the address
      const { data, error } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
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
   * Unlink an address from a coaching center or branch
   * Removes the entity IDs and resets address_type to HOME
   */
  static async unlinkAddressFromEntity(
    addressId: string
  ): Promise<AddressOperationResult<Address>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Reset the entity relationships
      const { data, error } = await supabase
        .from('addresses')
        .update({
          branch_id: null,
          coaching_id: null,
          address_type: 'HOME',
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
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
}