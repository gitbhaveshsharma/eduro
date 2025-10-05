/**
 * Address Utilities
 * 
 * Helper functions and utilities for address-related operations
 * Includes formatters, validators, calculators, and other utility functions
 */

import type {
  Address,
  PublicAddress,
  AddressType,
  AddressCompletionStep,
  Coordinates,
  AddressValidationResult,
  AddressValidationError,
  FormattedAddress,
  AddressFormatOptions,
  GoogleMapsData,
  AddressComponent,
  IndianState,
  IndianDistrict
} from '../schema/address.types';

/**
 * Address Display Utilities
 */
export class AddressDisplayUtils {
  /**
   * Get display name for an address
   */
  static getDisplayName(address: Partial<Address | PublicAddress>): string {
    if (address.label && address.label.trim()) {
      return address.label.trim();
    }
    
    const typeLabel = this.getAddressTypeLabel(address.address_type || 'HOME');
    
    if (address.city || address.district) {
      const location = address.city || address.district;
      return `${typeLabel} - ${location}`;
    }
    
    if (address.state) {
      return `${typeLabel} - ${address.state}`;
    }
    
    return typeLabel;
  }

  /**
   * Get address type label
   */
  static getAddressTypeLabel(type: AddressType): string {
    const typeMap: Record<AddressType, string> = {
      'HOME': 'Home',
      'WORK': 'Work',
      'SCHOOL': 'School',
      'COLLEGE': 'College',
      'COACHING': 'Coaching Center',
      'HOSTEL': 'Hostel',
      'BRANCH': 'Branch Office',
      'OFFICE': 'Office',
      'OTHER': 'Other'
    };
    
    return typeMap[type] || 'Unknown';
  }

  /**
   * Get address type color/badge style
   */
  static getAddressTypeColor(type: AddressType): string {
    const colorMap: Record<AddressType, string> = {
      'HOME': 'blue',
      'WORK': 'green',
      'SCHOOL': 'yellow',
      'COLLEGE': 'purple',
      'COACHING': 'orange',
      'HOSTEL': 'cyan',
      'BRANCH': 'red',
      'OFFICE': 'green',
      'OTHER': 'gray'
    };
    
    return colorMap[type] || 'gray';
  }

  /**
   * Get address type icon
   */
  static getAddressTypeIcon(type: AddressType): string {
    const iconMap: Record<AddressType, string> = {
      'HOME': 'home',
      'WORK': 'building',
      'SCHOOL': 'graduation-cap',
      'COLLEGE': 'university',
      'COACHING': 'chalkboard-teacher',
      'HOSTEL': 'bed',
      'BRANCH': 'map-marker-alt',
      'OFFICE': 'briefcase',
      'OTHER': 'map-pin'
    };
    
    return iconMap[type] || 'map-pin';
  }

  /**
   * Format address as single line
   */
  static formatSingleLine(
    address: Partial<Address>,
    options: AddressFormatOptions = {}
  ): string {
    const parts: string[] = [];
    
    if (address.address_line_1) parts.push(address.address_line_1);
    if (address.address_line_2) parts.push(address.address_line_2);
    if (address.city) parts.push(address.city);
    if (address.district && address.district !== address.city) parts.push(address.district);
    if (address.state) parts.push(address.state);
    
    if (options.include_pin_code !== false && address.pin_code) {
      parts.push(address.pin_code);
    }
    
    if (options.include_country !== false && address.country && address.country !== 'India') {
      parts.push(address.country);
    }
    
    const separator = options.separator || ', ';
    return parts.join(separator);
  }

  /**
   * Format address as multiple lines
   */
  static formatMultiLine(
    address: Partial<Address>,
    options: AddressFormatOptions = {}
  ): string[] {
    const lines: string[] = [];
    
    if (address.address_line_1) {
      lines.push(address.address_line_1);
    }
    
    if (address.address_line_2) {
      lines.push(address.address_line_2);
    }
    
    // City, District line
    const cityDistrictParts: string[] = [];
    if (address.city) cityDistrictParts.push(address.city);
    if (address.district && address.district !== address.city) {
      cityDistrictParts.push(address.district);
    }
    if (cityDistrictParts.length > 0) {
      lines.push(cityDistrictParts.join(', '));
    }
    
    // State, PIN code line
    const statePinParts: string[] = [];
    if (address.state) statePinParts.push(address.state);
    if (options.include_pin_code !== false && address.pin_code) {
      statePinParts.push(address.pin_code);
    }
    if (statePinParts.length > 0) {
      lines.push(statePinParts.join(' - '));
    }
    
    // Country line
    if (options.include_country !== false && address.country && address.country !== 'India') {
      lines.push(address.country);
    }
    
    return lines.filter(line => line.trim().length > 0);
  }

  /**
   * Format address for postal use
   */
  static formatPostal(address: Partial<Address>): string {
    const lines: string[] = [];
    
    // Name/Label on first line if available
    if (address.label) {
      lines.push(address.label);
    }
    
    // Address lines
    if (address.address_line_1) lines.push(address.address_line_1);
    if (address.address_line_2) lines.push(address.address_line_2);
    
    // City, State PIN
    const locationParts: string[] = [];
    if (address.city) locationParts.push(address.city);
    if (address.state) locationParts.push(address.state);
    if (address.pin_code) locationParts.push(address.pin_code);
    
    if (locationParts.length > 0) {
      lines.push(locationParts.join(', '));
    }
    
    // Country
    if (address.country && address.country !== 'India') {
      lines.push(address.country);
    }
    
    return lines.join('\n');
  }

  /**
   * Get complete formatted address object
   */
  static getFormattedAddress(
    address: Partial<Address>,
    options: AddressFormatOptions = {}
  ): FormattedAddress {
    return {
      single_line: this.formatSingleLine(address, options),
      multi_line: this.formatMultiLine(address, options),
      postal_format: this.formatPostal(address)
    };
  }

  /**
   * Get short address summary
   */
  static getShortSummary(address: Partial<Address | PublicAddress>): string {
    if (address.city && address.state) {
      return `${address.city}, ${address.state}`;
    }
    
    if (address.district && address.state) {
      return `${address.district}, ${address.state}`;
    }
    
    if (address.state) {
      return address.state;
    }
    
    return 'Unknown Location';
  }
}

/**
 * Address Validation Utilities
 */
export class AddressValidationUtils {
  /**
   * Validate PIN code format
   */
  static validatePinCode(pinCode: string): { valid: boolean; error?: string } {
    if (!pinCode || pinCode.length !== 6) {
      return { valid: false, error: 'PIN code must be exactly 6 digits' };
    }
    
    if (!/^[0-9]{6}$/.test(pinCode)) {
      return { valid: false, error: 'PIN code must contain only digits' };
    }
    
    // Check for invalid PIN codes (all same digits)
    if (/^(\d)\1{5}$/.test(pinCode)) {
      return { valid: false, error: 'Invalid PIN code format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(
    latitude: number,
    longitude: number,
    checkIndianBounds: boolean = true
  ): { valid: boolean; error?: string } {
    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
    
    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }
    
    if (checkIndianBounds) {
      // Check if coordinates are within Indian boundaries
      const indiaLatMin = 6.0, indiaLatMax = 37.6;
      const indiaLngMin = 68.7, indiaLngMax = 97.25;
      
      if (latitude < indiaLatMin || latitude > indiaLatMax ||
          longitude < indiaLngMin || longitude > indiaLngMax) {
        return { valid: false, error: 'Coordinates appear to be outside India' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Validate Google Maps URL
   */
  static validateGoogleMapsUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      const validDomains = [
        'maps.google.com',
        'www.google.com',
        'google.com',
        'maps.google.co.in',
        'google.co.in'
      ];
      
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isValidDomain) {
        return { valid: false, error: 'Must be a valid Google Maps URL' };
      }
      
      if (!url.includes('/maps')) {
        return { valid: false, error: 'URL must be a Google Maps link' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate Google Plus Code
   */
  static validatePlusCode(plusCode: string): { valid: boolean; error?: string } {
    // Plus Code format: 8 characters + '+' + 2-6 characters
    const plusCodeRegex = /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,6}$/;
    
    if (!plusCodeRegex.test(plusCode)) {
      return { valid: false, error: 'Invalid Plus Code format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate field lengths
   */
  static validateFieldLength(
    value: string,
    fieldName: string,
    maxLength: number
  ): { valid: boolean; error?: string } {
    if (value && value.length > maxLength) {
      return { 
        valid: false, 
        error: `${fieldName} must be no more than ${maxLength} characters` 
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate complete address
   */
  static validateAddress(address: Partial<Address>): AddressValidationResult {
    const errors: AddressValidationError[] = [];

    // Validate required fields
    if (!address.state) {
      errors.push({
        field: 'state',
        message: 'State is required',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!address.district) {
      errors.push({
        field: 'district',
        message: 'District is required',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!address.pin_code) {
      errors.push({
        field: 'pin_code',
        message: 'PIN code is required',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      const pinValidation = this.validatePinCode(address.pin_code);
      if (!pinValidation.valid) {
        errors.push({
          field: 'pin_code',
          message: pinValidation.error!,
          code: 'INVALID_PIN_CODE'
        });
      }
    }

    // Validate coordinates if provided
    if (address.latitude !== undefined || address.longitude !== undefined) {
      if (address.latitude === undefined || address.longitude === undefined) {
        errors.push({
          field: 'latitude',
          message: 'Both latitude and longitude must be provided',
          code: 'INVALID_COORDINATES'
        });
      } else if (address.latitude !== null && address.longitude !== null) {
        const coordValidation = this.validateCoordinates(address.latitude, address.longitude);
        if (!coordValidation.valid) {
          errors.push({
            field: 'latitude',
            message: coordValidation.error!,
            code: 'COORDINATES_OUT_OF_BOUNDS'
          });
        }
      }
    }

    // Validate Google Maps URL
    if (address.google_maps_url) {
      const urlValidation = this.validateGoogleMapsUrl(address.google_maps_url);
      if (!urlValidation.valid) {
        errors.push({
          field: 'google_maps_url',
          message: urlValidation.error!,
          code: 'INVALID_GOOGLE_MAPS_URL'
        });
      }
    }

    // Validate Plus Code
    if (address.google_plus_code) {
      const plusCodeValidation = this.validatePlusCode(address.google_plus_code);
      if (!plusCodeValidation.valid) {
        errors.push({
          field: 'google_plus_code',
          message: plusCodeValidation.error!,
          code: 'INVALID_PLUS_CODE'
        });
      }
    }

    // Validate field lengths
    const fieldLengthValidations = [
      { field: 'label', value: address.label, maxLength: 100 },
      { field: 'address_line_1', value: address.address_line_1, maxLength: 200 },
      { field: 'address_line_2', value: address.address_line_2, maxLength: 200 },
      { field: 'delivery_instructions', value: address.delivery_instructions, maxLength: 500 },
    ];

    fieldLengthValidations.forEach(({ field, value, maxLength }) => {
      if (value) {
        const lengthValidation = this.validateFieldLength(value, field, maxLength);
        if (!lengthValidation.valid) {
          errors.push({
            field: field as keyof Address,
            message: lengthValidation.error!,
            code: 'FIELD_TOO_LONG'
          });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * Address Completion Utilities
 */
export class AddressCompletionUtils {
  /**
   * Get address completion steps
   */
  static getCompletionSteps(address: Address): AddressCompletionStep[] {
    const steps: AddressCompletionStep[] = [
      {
        key: 'basic_location',
        label: 'Basic Location',
        description: 'Add state, district, and PIN code',
        completed: !!(address.state && address.district && address.pin_code),
        points: 30,
        required: true
      },
      {
        key: 'detailed_address',
        label: 'Detailed Address',
        description: 'Add address lines and city',
        completed: !!(address.address_line_1 && address.city),
        points: 25,
        required: false
      },
      {
        key: 'coordinates',
        label: 'Geographic Coordinates',
        description: 'Add GPS coordinates or link Google Maps',
        completed: !!(address.latitude && address.longitude) || !!address.google_maps_url,
        points: 20,
        required: false
      },
      {
        key: 'address_type',
        label: 'Address Type & Label',
        description: 'Set address type and custom label',
        completed: !!(address.address_type && address.label),
        points: 15,
        required: false
      },
      {
        key: 'delivery_info',
        label: 'Delivery Instructions',
        description: 'Add delivery instructions and landmarks',
        completed: !!address.delivery_instructions,
        points: 10,
        required: false
      }
    ];

    return steps;
  }

  /**
   * Calculate completion percentage
   */
  static calculateCompletionPercentage(address: Address): number {
    const steps = this.getCompletionSteps(address);
    const totalPoints = steps.reduce((sum, step) => sum + step.points, 0);
    const earnedPoints = steps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.points, 0);
    
    return Math.round((earnedPoints / totalPoints) * 100);
  }

  /**
   * Get next recommended completion step
   */
  static getNextStep(address: Address): AddressCompletionStep | null {
    const steps = this.getCompletionSteps(address);
    
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

  /**
   * Check if address is complete enough for delivery
   */
  static isDeliveryReady(address: Address): boolean {
    return !!(
      address.state &&
      address.district &&
      address.pin_code &&
      address.address_line_1 &&
      (address.city || address.village_town)
    );
  }
}

/**
 * Address Geographic Utilities
 */
export class AddressGeographicUtils {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const earthRadiusKm = 6371;
    
    const dLat = this.degreesToRadians(coord2.latitude - coord1.latitude);
    const dLng = this.degreesToRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(coord1.latitude)) *
      Math.cos(this.degreesToRadians(coord2.latitude)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return earthRadiusKm * c;
  }

  /**
   * Convert degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if coordinates are within a radius of a center point
   */
  static isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusKm;
  }

  /**
   * Get bounding box for a given center and radius
   */
  static getBoundingBox(center: Coordinates, radiusKm: number): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const earthRadiusKm = 6371;
    
    // Calculate the degree differences
    const latDiff = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const lngDiff = (radiusKm / earthRadiusKm) * (180 / Math.PI) / 
      Math.cos(center.latitude * Math.PI / 180);
    
    return {
      north: center.latitude + latDiff,
      south: center.latitude - latDiff,
      east: center.longitude + lngDiff,
      west: center.longitude - lngDiff
    };
  }

  /**
   * Extract coordinates from Google Maps URL
   */
  static extractCoordinatesFromUrl(mapsUrl: string): Coordinates | null {
    try {
      // Different Google Maps URL patterns
      const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3dlat!4dlng format
        /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng format
        /place\/([^\/]+)\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/ // place format
      ];

      for (const pattern of patterns) {
        const match = mapsUrl.match(pattern);
        if (match) {
          const latIndex = pattern.source.includes('place') ? 2 : 1;
          const lngIndex = latIndex + 1;
          
          const latitude = parseFloat(match[latIndex]);
          const longitude = parseFloat(match[lngIndex]);
          
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
   * Generate Google Maps URL from coordinates
   */
  static generateGoogleMapsUrl(coordinates: Coordinates, label?: string): string {
    const { latitude, longitude } = coordinates;
    const labelPart = label ? `place/${encodeURIComponent(label)}/` : '';
    return `https://www.google.com/maps/${labelPart}@${latitude},${longitude},15z`;
  }
}

/**
 * Address Search Utilities
 */
export class AddressSearchUtils {
  /**
   * Normalize search query for better matching
   */
  static normalizeSearchQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' '); // Collapse multiple spaces
  }

  /**
   * Calculate search relevance score for an address
   */
  static calculateRelevanceScore(address: Address, searchQuery: string): number {
    if (!searchQuery) return 0;
    
    const normalizedQuery = this.normalizeSearchQuery(searchQuery);
    const queryTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
    
    let score = 0;
    
    // Helper function to check if text contains query terms
    const getMatchScore = (text: string | null, weight: number): number => {
      if (!text) return 0;
      
      const normalizedText = this.normalizeSearchQuery(text);
      let matches = 0;
      
      queryTerms.forEach(term => {
        if (normalizedText.includes(term)) {
          matches++;
        }
      });
      
      return (matches / queryTerms.length) * weight;
    };
    
    // Score different fields with different weights
    score += getMatchScore(address.label, 100); // Highest priority
    score += getMatchScore(address.address_line_1, 80);
    score += getMatchScore(address.address_line_2, 60);
    score += getMatchScore(address.city, 70);
    score += getMatchScore(address.district, 60);
    score += getMatchScore(address.state, 50);
    score += getMatchScore(address.village_town, 40);
    score += getMatchScore(address.delivery_instructions, 30);
    
    // Bonus for primary addresses
    if (address.is_primary) {
      score += 20;
    }
    
    // Bonus for verified addresses
    if (address.is_verified) {
      score += 10;
    }
    
    return Math.round(score);
  }

  /**
   * Highlight search terms in text
   */
  static highlightSearchTerms(text: string, searchQuery: string): string {
    if (!searchQuery || !text) return text;
    
    const normalizedQuery = this.normalizeSearchQuery(searchQuery);
    const queryTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
    
    let highlightedText = text;
    
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
}

/**
 * Address Data Transformation Utilities
 */
export class AddressTransformUtils {
  /**
   * Transform full address to public address
   */
  static toPublicAddress(address: Address): PublicAddress {
    return {
      id: address.id,
      address_type: address.address_type,
      label: address.label,
      state: address.state,
      district: address.district,
      city: address.city,
      country: address.country,
      postal_address: address.postal_address,
      is_verified: address.is_verified
    };
  }

  /**
   * Extract Google Maps data from address
   */
  static extractGoogleMapsData(address: Address): GoogleMapsData {
    const data: GoogleMapsData = {};
    
    if (address.google_maps_url) {
      data.maps_url = address.google_maps_url;
    }
    
    if (address.google_place_id) {
      data.place_id = address.google_place_id;
    }
    
    if (address.google_plus_code) {
      data.plus_code = address.google_plus_code;
    }
    
    if (address.latitude && address.longitude) {
      data.coordinates = {
        latitude: address.latitude,
        longitude: address.longitude
      };
    }
    
    return data;
  }

  /**
   * Convert address to coordinates if available
   */
  static getCoordinates(address: Address): Coordinates | null {
    if (address.latitude && address.longitude) {
      return {
        latitude: address.latitude,
        longitude: address.longitude
      };
    }
    
    return null;
  }

  /**
   * Get address hierarchy (from specific to general)
   */
  static getAddressHierarchy(address: Address): string[] {
    const hierarchy: string[] = [];
    
    if (address.address_line_1) hierarchy.push(address.address_line_1);
    if (address.address_line_2) hierarchy.push(address.address_line_2);
    if (address.village_town) hierarchy.push(address.village_town);
    if (address.city && address.city !== address.village_town) hierarchy.push(address.city);
    if (address.sub_district) hierarchy.push(address.sub_district);
    if (address.district) hierarchy.push(address.district);
    if (address.state) hierarchy.push(address.state);
    if (address.country) hierarchy.push(address.country);
    
    return hierarchy;
  }
}

/**
 * Address URL Utilities
 */
export class AddressUrlUtils {
  /**
   * Generate Google Maps URL for address
   */
  static getGoogleMapsUrl(address: Address): string {
    if (address.google_maps_url) {
      return address.google_maps_url;
    }
    
    if (address.latitude && address.longitude) {
      const label = AddressDisplayUtils.getDisplayName(address);
      return AddressGeographicUtils.generateGoogleMapsUrl(
        { latitude: address.latitude, longitude: address.longitude },
        label
      );
    }
    
    // Fallback to search-based URL
    const searchQuery = AddressDisplayUtils.formatSingleLine(address);
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  }

  /**
   * Generate directions URL to address
   */
  static getDirectionsUrl(address: Address, from?: string): string {
    const destination = address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : AddressDisplayUtils.formatSingleLine(address);
    
    let url = `https://www.google.com/maps/dir/`;
    
    if (from) {
      url += `${encodeURIComponent(from)}/`;
    }
    
    url += encodeURIComponent(destination);
    
    return url;
  }

  /**
   * Generate sharing URL for address
   */
  static getSharingUrl(address: Address): string {
    const addressText = AddressDisplayUtils.formatSingleLine(address);
    const label = AddressDisplayUtils.getDisplayName(address);
    
    return `https://www.google.com/maps/search/${encodeURIComponent(`${label}: ${addressText}`)}`;
  }
}

/**
 * Indian Location Utilities
 */
export class IndianLocationUtils {
  /**
   * Get state by code
   */
  static getStateByCode(code: string): IndianState | null {
    const states: IndianState[] = [
      { code: 'AN', name: 'Andaman and Nicobar Islands' },
      { code: 'AP', name: 'Andhra Pradesh' },
      { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' },
      { code: 'BR', name: 'Bihar' },
      { code: 'CG', name: 'Chhattisgarh' },
      { code: 'CH', name: 'Chandigarh' },
      { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { code: 'DL', name: 'Delhi' },
      { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' },
      { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' },
      { code: 'JK', name: 'Jammu and Kashmir' },
      { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'KL', name: 'Kerala' },
      { code: 'LA', name: 'Ladakh' },
      { code: 'LD', name: 'Lakshadweep' },
      { code: 'MP', name: 'Madhya Pradesh' },
      { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' },
      { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' },
      { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' },
      { code: 'PY', name: 'Puducherry' },
      { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' },
      { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'TS', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' },
      { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UK', name: 'Uttarakhand' },
      { code: 'WB', name: 'West Bengal' },
    ];
    
    return states.find(state => state.code === code) || null;
  }

  /**
   * Get state code by name
   */
  static getStateCode(name: string): string | null {
    const state = this.getStateByCode(''); // Get all states
    const normalizedName = name.toLowerCase().trim();
    
    const states: IndianState[] = [
      { code: 'AN', name: 'Andaman and Nicobar Islands' },
      { code: 'AP', name: 'Andhra Pradesh' },
      { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' },
      { code: 'BR', name: 'Bihar' },
      { code: 'CG', name: 'Chhattisgarh' },
      { code: 'CH', name: 'Chandigarh' },
      { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { code: 'DL', name: 'Delhi' },
      { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' },
      { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' },
      { code: 'JK', name: 'Jammu and Kashmir' },
      { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'KL', name: 'Kerala' },
      { code: 'LA', name: 'Ladakh' },
      { code: 'LD', name: 'Lakshadweep' },
      { code: 'MP', name: 'Madhya Pradesh' },
      { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' },
      { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' },
      { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' },
      { code: 'PY', name: 'Puducherry' },
      { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' },
      { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'TS', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' },
      { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UK', name: 'Uttarakhand' },
      { code: 'WB', name: 'West Bengal' },
    ];
    
    const found = states.find(state => 
      state.name.toLowerCase() === normalizedName
    );
    
    return found?.code || null;
  }

  /**
   * Validate PIN code for specific state (basic validation)
   */
  static validatePinCodeForState(pinCode: string, state: string): boolean {
    // Basic PIN code state mapping (first digit)
    const stateFirstDigits: Record<string, string[]> = {
      'Delhi': ['1'],
      'Haryana': ['1'],
      'Punjab': ['1'],
      'Rajasthan': ['3'],
      'Gujarat': ['3'],
      'Maharashtra': ['4'],
      'Madhya Pradesh': ['4'],
      'Uttar Pradesh': ['2'],
      'Bihar': ['8'],
      'West Bengal': ['7'],
      'Odisha': ['7'],
      'Karnataka': ['5'],
      'Tamil Nadu': ['6'],
      'Kerala': ['6'],
      'Andhra Pradesh': ['5'],
      'Telangana': ['5'],
    };
    
    const firstDigit = pinCode.charAt(0);
    const validDigits = stateFirstDigits[state];
    
    return validDigits ? validDigits.includes(firstDigit) : true;
  }
}