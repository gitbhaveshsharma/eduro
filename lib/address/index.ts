// Address System Exports
// This file provides a centralized export point for all address-related functionality

// Types and Interfaces
export type {
  Address,
  PublicAddress,
  AddressCreate,
  AddressUpdate,
  AddressType,
  AddressFilters,
  AddressSortField,
  AddressSort,
  SortDirection,
  AddressSearchResult,
  AddressValidationResult,
  AddressValidationError,
  Coordinates,
  AddressCompletionStep,
  FormattedAddress,
  AddressFormatOptions,
  IndianState,
  GeocodingResult,
  DistanceResult,
  ReverseGeocodingResult,
  GoogleMapsData,
  AddressOperationResult,
  NearbyAddressesResult,
  AddressStats,
  AddressPermissions,
  // PIN Code API Types
  PostOffice,
  PostalAPIResponse,
  PinCodeInfo,
  PinCodeServiceResult
} from '../schema/address.types';

// Service Layer
export { 
  AddressService,
  ADDRESS_ERROR_CODES 
} from '../service/address.service';

// Store and Hooks
export { 
  useAddressStore,
  // Basic data hooks
  useCurrentUserAddresses,
  usePrimaryAddress,
  useCurrentAddressesLoading,
  useCurrentAddressesError,
  // Search hooks
  useSearchResults,
  useSearchLoading,
  useSearchError,
  useNearbyAddresses,
  useNearbyLoading,
  // Edit state hooks
  useEditMode,
  useEditingAddressId,
  useEditFormData,
  // Create state hooks
  useCreateMode,
  useCreateFormData,
  // Cache hooks
  useAddressFromCache,
  useAddressCacheLoading,
  useAddressCacheError,
  // Operation hooks
  useAddressOperationLoading,
  useBulkOperationLoading
} from '../store/address.store';

// Utility Classes
export {
  AddressDisplayUtils,
  AddressValidationUtils,
  AddressCompletionUtils,
  AddressGeographicUtils,
  AddressSearchUtils
} from '../utils/address.utils';

// Constants
export const ADDRESS_TYPES = [
  'HOME',
  'WORK', 
  'SCHOOL',
  'COLLEGE',
  'COACHING',
  'HOSTEL',
  'BRANCH',
  'OFFICE',
  'OTHER'
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
] as const;