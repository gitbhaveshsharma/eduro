/**
 * PIN Code Hook
 * 
 * React hook for fetching and managing PIN code data
 * Provides a simple interface for PIN code validation and address fetching
 */

import { useState, useCallback } from 'react';
import type { PinCodeInfo, PostOffice } from '@/lib/schema/address.types';

interface PinCodeState {
  isLoading: boolean;
  data: PinCodeInfo | null;
  error: string | null;
  isValid: boolean;
}

interface UsePinCodeReturn extends PinCodeState {
  fetchPinCodeData: (pinCode: string) => Promise<boolean>;
  validatePinCode: (pinCode: string) => boolean;
  reset: () => void;
  getFormattedAddressData: () => {
    pin_code: string;
    state: string;
    district: string;
    country: string;
  } | null;
}

// Error messages
const ERROR_MESSAGES = {
  INVALID_PIN_CODE: 'Please enter a valid 6-digit PIN code',
  NO_DATA_FOUND: 'No address information found for this PIN code',
  API_ERROR: 'Unable to fetch address information. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  INVALID_RESPONSE: 'Invalid response from address service'
};

/**
 * Custom hook for PIN code operations
 */
export function usePinCode(): UsePinCodeReturn {
  const [state, setState] = useState<PinCodeState>({
    isLoading: false,
    data: null,
    error: null,
    isValid: false
  });

  /**
   * Validate PIN code format
   */
  const validatePinCode = useCallback((pinCode: string): boolean => {
    const pinCodeRegex = /^[1-9][0-9]{5}$/;
    return pinCodeRegex.test(pinCode.trim());
  }, []);

  /**
   * Fetch PIN code data from the postal API
   */
  const fetchPinCodeData = useCallback(async (pinCode: string): Promise<boolean> => {
    const cleanPinCode = pinCode.trim();
    
    // Validate format first
    if (!validatePinCode(cleanPinCode)) {
      setState({
        isLoading: false,
        data: null,
        error: ERROR_MESSAGES.INVALID_PIN_CODE,
        isValid: false
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Use internal server-side proxy endpoint to avoid CORS issues
      const response = await fetch(`/api/pincode?pin=${encodeURIComponent(cleanPinCode)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        setState({
          isLoading: false,
          data: null,
          error: ERROR_MESSAGES.API_ERROR,
          isValid: false
        });
        return false;
      }

      const data: Array<{
        Message: string;
        Status: string;
        PostOffice: PostOffice[];
      }> = await response.json();

      // Validate response structure
      if (!Array.isArray(data) || data.length === 0) {
        setState({
          isLoading: false,
          data: null,
          error: ERROR_MESSAGES.INVALID_RESPONSE,
          isValid: false
        });
        return false;
      }

      const firstResponse = data[0];
      
      // Check if API found results
      if (firstResponse.Status !== 'Success' || !firstResponse.PostOffice || firstResponse.PostOffice.length === 0) {
        setState({
          isLoading: false,
          data: null,
          error: ERROR_MESSAGES.NO_DATA_FOUND,
          isValid: false
        });
        return false;
      }

      // Extract primary post office
      const primaryPostOffice = firstResponse.PostOffice[0];
      
      const pinCodeInfo: PinCodeInfo = {
        pinCode: cleanPinCode,
        state: primaryPostOffice.State,
        district: primaryPostOffice.District,
        block: primaryPostOffice.Block,
        region: primaryPostOffice.Region,
        circle: primaryPostOffice.Circle,
        division: primaryPostOffice.Division,
        postOffices: firstResponse.PostOffice,
        isValid: true
      };

      setState({
        isLoading: false,
        data: pinCodeInfo,
        error: null,
        isValid: true
      });

      return true;

    } catch (error) {
      console.error('PIN code fetch error:', error);
      
      let errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      }

      setState({
        isLoading: false,
        data: null,
        error: errorMessage,
        isValid: false
      });

      return false;
    }
  }, [validatePinCode]);

  /**
   * Reset the state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
      isValid: false
    });
  }, []);

  /**
   * Get formatted address data for creating address
   */
  const getFormattedAddressData = useCallback(() => {
    if (!state.data) return null;

    return {
      pin_code: state.data.pinCode,
      state: state.data.state,
      district: state.data.district,
      country: 'India'
    };
  }, [state.data]);

  return {
    ...state,
    fetchPinCodeData,
    validatePinCode,
    reset,
    getFormattedAddressData
  };
}