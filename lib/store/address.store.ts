/**
 * Address Store
 * 
 * Zustand store for managing address state across the application
 * Handles caching, optimistic updates, and real-time synchronization
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Map and Set support for Immer when using immer middleware in Zustand
enableMapSet();
import { AddressService } from '../service/address.service';
import type {
  Address,
  PublicAddress,
  AddressCreate,
  AddressUpdate,
  AddressFilters,
  AddressSort,
  AddressSearchResult,
  AddressStats,
  AddressPermissions,
  DistanceResult,
  NearbyAddressesResult,
  Coordinates,
  GeocodingResult,
  ReverseGeocodingResult,
  AddressType
} from '../schema/address.types';

// Store state interface
interface AddressState {
  // Current user addresses
  currentUserAddresses: Address[];
  primaryAddress: Address | null;
  currentAddressesLoading: boolean;
  currentAddressesError: string | null;

  // Address cache for other users
  addressCache: Map<string, Address>;
  publicAddressCache: Map<string, PublicAddress[]>;
  addressCacheLoading: Set<string>;
  addressCacheErrors: Map<string, string>;

  // Search and filtering
  searchResults: AddressSearchResult | null;
  searchLoading: boolean;
  searchError: string | null;
  currentFilters: AddressFilters;
  currentSort: AddressSort;

  // Nearby addresses
  nearbyAddresses: NearbyAddressesResult | null;
  nearbyLoading: boolean;
  nearbyError: string | null;

  // Address statistics
  stats: AddressStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Permissions cache
  permissionsCache: Map<string, AddressPermissions>;

  // Geocoding cache
  geocodingCache: Map<string, GeocodingResult>;
  reverseGeocodingCache: Map<string, ReverseGeocodingResult>;

  // UI state
  isEditMode: boolean;
  editingAddressId: string | null;
  editFormData: AddressUpdate | null;
  isCreating: boolean;
  createFormData: Partial<AddressCreate> | null;

  // Operations state
  operationLoading: Map<string, boolean>; // address_id -> loading state
  bulkOperationLoading: boolean;
}

// Store actions interface
interface AddressActions {
  // Current user address actions
  loadCurrentUserAddresses: () => Promise<void>;
  loadPrimaryAddress: () => Promise<void>;
  createAddress: (addressData: AddressCreate) => Promise<boolean>;
  updateAddress: (addressId: string, updates: AddressUpdate) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setPrimaryAddress: (addressId: string) => Promise<boolean>;
  updateAddressOptimistic: (addressId: string, updates: AddressUpdate) => void;
  revertAddressOptimistic: (addressId: string) => void;
  clearCurrentAddresses: () => void;

  // Address cache actions
  loadAddress: (addressId: string) => Promise<Address | null>;
  loadPublicAddresses: (userId: string) => Promise<PublicAddress[]>;
  cacheAddress: (address: Address) => void;
  cachePublicAddresses: (userId: string, addresses: PublicAddress[]) => void;
  clearAddressCache: () => void;
  removeFromCache: (addressId: string) => void;

  // Search and filtering actions
  searchAddresses: (
    filters?: AddressFilters,
    sort?: AddressSort,
    page?: number,
    perPage?: number
  ) => Promise<void>;
  updateFilters: (filters: Partial<AddressFilters>) => void;
  updateSort: (sort: AddressSort) => void;
  clearSearch: () => void;

  // Nearby addresses actions
  loadNearbyAddresses: (
    coordinates: Coordinates,
    radiusKm?: number,
    limit?: number
  ) => Promise<void>;
  clearNearbyAddresses: () => void;

  // Statistics actions
  loadStats: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Permissions actions
  loadPermissions: (addressId: string) => Promise<AddressPermissions | null>;
  cachePermissions: (addressId: string, permissions: AddressPermissions) => void;

  // Geocoding actions
  geocodeAddress: (address: Partial<Address>) => Promise<GeocodingResult>;
  reverseGeocode: (coordinates: Coordinates) => Promise<ReverseGeocodingResult>;
  extractCoordinatesFromMapsUrl: (mapsUrl: string) => Coordinates | null;

  // Distance calculation
  calculateDistance: (fromAddressId: string, toAddressId: string) => Promise<DistanceResult | null>;

  // UI state actions
  setEditMode: (enabled: boolean, addressId?: string) => void;
  setEditFormData: (data: AddressUpdate | null) => void;
  resetEditForm: () => void;
  setCreateMode: (enabled: boolean) => void;
  setCreateFormData: (data: Partial<AddressCreate> | null) => void;
  resetCreateForm: () => void;

  // Operation state actions
  setOperationLoading: (addressId: string, loading: boolean) => void;
  setBulkOperationLoading: (loading: boolean) => void;

  // Utility actions
  refreshAddressData: (addressId?: string) => Promise<void>;
  bulkUpdateAddresses: (updates: Array<{ id: string; updates: AddressUpdate }>) => Promise<boolean>;
}

type AddressStore = AddressState & AddressActions;

// Initial state
const initialState: AddressState = {
  currentUserAddresses: [],
  primaryAddress: null,
  currentAddressesLoading: false,
  currentAddressesError: null,

  addressCache: new Map(),
  publicAddressCache: new Map(),
  addressCacheLoading: new Set(),
  addressCacheErrors: new Map(),

  searchResults: null,
  searchLoading: false,
  searchError: null,
  currentFilters: {},
  currentSort: { field: 'created_at', direction: 'desc' },

  nearbyAddresses: null,
  nearbyLoading: false,
  nearbyError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  permissionsCache: new Map(),
  geocodingCache: new Map(),
  reverseGeocodingCache: new Map(),

  isEditMode: false,
  editingAddressId: null,
  editFormData: null,
  isCreating: false,
  createFormData: null,

  operationLoading: new Map(),
  bulkOperationLoading: false,
};

export const useAddressStore = create<AddressStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Current user address actions
        loadCurrentUserAddresses: async () => {
          set((state) => {
            state.currentAddressesLoading = true;
            state.currentAddressesError = null;
          });

          const result = await AddressService.getCurrentUserAddresses();

          set((state) => {
            state.currentAddressesLoading = false;
            if (result.success && result.data) {
              state.currentUserAddresses = result.data;
              state.primaryAddress = result.data.find((addr: Address) => addr.is_primary) || null;
              state.currentAddressesError = null;

              // Cache the addresses
              result.data.forEach((address: Address) => {
                state.addressCache.set(address.id, address);
              });
            } else {
              state.currentAddressesError = result.error || 'Failed to load addresses';
            }
          });
        },

        loadPrimaryAddress: async () => {
          const result = await AddressService.getPrimaryAddress();

          set((state) => {
            if (result.success && result.data) {
              state.primaryAddress = result.data;
              // Update in current addresses if it exists
              const index = state.currentUserAddresses.findIndex((a: Address) => a.id === result.data!.id);
              if (index >= 0) {
                state.currentUserAddresses[index] = result.data;
              }
              // Cache the address
              state.addressCache.set(result.data.id, result.data);
            }
          });
        },

        createAddress: async (addressData: AddressCreate) => {
          set((state) => {
            state.isCreating = true;
          });

          const result = await AddressService.createAddress(addressData);

          set((state) => {
            state.isCreating = false;
            if (result.success && result.data) {
              state.currentUserAddresses.unshift(result.data);
              
              // Update primary address if this was set as primary
              if (result.data.is_primary) {
                state.primaryAddress = result.data;
                // Update other addresses to remove primary flag
                state.currentUserAddresses.forEach((addr: Address) => {
                  if (addr.id !== result.data!.id) {
                    addr.is_primary = false;
                  }
                });
              }

              // Cache the new address
              state.addressCache.set(result.data.id, result.data);
              state.createFormData = null;
            }
          });

          return result.success;
        },

        updateAddress: async (addressId: string, updates: AddressUpdate) => {
          // Optimistic update
          get().updateAddressOptimistic(addressId, updates);

          set((state) => {
            state.operationLoading.set(addressId, true);
          });

          const result = await AddressService.updateAddress(addressId, updates);

          set((state) => {
            state.operationLoading.delete(addressId);
            if (result.success && result.data) {
              // Update in current addresses
              const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
              if (index >= 0) {
                state.currentUserAddresses[index] = result.data;
              }

              // Update primary address if this was set as primary
              if (result.data.is_primary) {
                state.primaryAddress = result.data;
                // Update other addresses to remove primary flag
                state.currentUserAddresses.forEach((addr: Address) => {
                  if (addr.id !== addressId) {
                    addr.is_primary = false;
                  }
                });
              }

              // Update cache
              state.addressCache.set(addressId, result.data);
              state.editFormData = null;
            } else {
              // Revert optimistic update on failure
              get().revertAddressOptimistic(addressId);
            }
          });

          return result.success;
        },

        updateAddressOptimistic: (addressId: string, updates: AddressUpdate) => {
          set((state) => {
            // Update in current addresses
            const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
            if (index >= 0) {
              Object.assign(state.currentUserAddresses[index], updates);
            }

            // Update in cache
            const cached = state.addressCache.get(addressId);
            if (cached) {
              Object.assign(cached, updates);
            }

            // Update primary address if needed
            if (updates.is_primary && state.primaryAddress?.id === addressId) {
              Object.assign(state.primaryAddress, updates);
            }
          });
        },

        revertAddressOptimistic: async (addressId: string) => {
          // Reload the address from server
          const result = await AddressService.getAddress(addressId);
          if (result.success && result.data) {
            get().cacheAddress(result.data);
            
            set((state) => {
              const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
              if (index >= 0) {
                state.currentUserAddresses[index] = result.data!;
              }
            });
          }
        },

        deleteAddress: async (addressId: string) => {
          set((state) => {
            state.operationLoading.set(addressId, true);
          });

          const result = await AddressService.deleteAddress(addressId);

          set((state) => {
            state.operationLoading.delete(addressId);
            if (result.success) {
              // Remove from current addresses
              state.currentUserAddresses = state.currentUserAddresses.filter((a: Address) => a.id !== addressId);
              
              // Clear primary address if it was the deleted one
              if (state.primaryAddress?.id === addressId) {
                state.primaryAddress = null;
              }

              // Remove from cache
              state.addressCache.delete(addressId);
              state.permissionsCache.delete(addressId);
            }
          });

          return result.success;
        },

        setPrimaryAddress: async (addressId: string) => {
          set((state) => {
            state.operationLoading.set(addressId, true);
          });

          const result = await AddressService.setPrimaryAddress(addressId);

          set((state) => {
            state.operationLoading.delete(addressId);
            if (result.success && result.data) {
              // Update primary address
              state.primaryAddress = result.data;

              // Update current addresses
              state.currentUserAddresses.forEach((addr: Address) => {
                addr.is_primary = addr.id === addressId;
              });

              // Update cache
              state.addressCache.set(addressId, result.data);
            }
          });

          return result.success;
        },

        clearCurrentAddresses: () => {
          set((state) => {
            state.currentUserAddresses = [];
            state.primaryAddress = null;
            state.currentAddressesError = null;
            state.currentAddressesLoading = false;
            state.editFormData = null;
            state.createFormData = null;
            state.isEditMode = false;
            state.isCreating = false;
          });
        },

        // Address cache actions
        loadAddress: async (addressId: string) => {
          const cache = get().addressCache;
          if (cache.has(addressId)) {
            return cache.get(addressId)!;
          }

          const loading = get().addressCacheLoading;
          if (loading.has(addressId)) {
            return null; // Already loading
          }

          set((state) => {
            state.addressCacheLoading.add(addressId);
            state.addressCacheErrors.delete(addressId);
          });

          const result = await AddressService.getAddress(addressId);

          set((state) => {
            state.addressCacheLoading.delete(addressId);
            if (result.success && result.data) {
              state.addressCache.set(addressId, result.data);
            } else {
              state.addressCacheErrors.set(addressId, result.error || 'Failed to load address');
            }
          });

          return result.success && result.data ? result.data : null;
        },

        loadPublicAddresses: async (userId: string) => {
          const cache = get().publicAddressCache;
          if (cache.has(userId)) {
            return cache.get(userId)!;
          }

          const result = await AddressService.getPublicAddresses(userId);

          if (result.success && result.data) {
            get().cachePublicAddresses(userId, result.data);
            return result.data;
          }

          return [];
        },

        cacheAddress: (address: Address) => {
          set((state) => {
            state.addressCache.set(address.id, address);
            state.addressCacheErrors.delete(address.id);
          });
        },

        cachePublicAddresses: (userId: string, addresses: PublicAddress[]) => {
          set((state) => {
            state.publicAddressCache.set(userId, addresses);
          });
        },

        clearAddressCache: () => {
          set((state) => {
            state.addressCache.clear();
            state.publicAddressCache.clear();
            state.addressCacheLoading.clear();
            state.addressCacheErrors.clear();
          });
        },

        removeFromCache: (addressId: string) => {
          set((state) => {
            state.addressCache.delete(addressId);
            state.addressCacheErrors.delete(addressId);
            state.addressCacheLoading.delete(addressId);
            state.permissionsCache.delete(addressId);
          });
        },

        // Search and filtering actions
        searchAddresses: async (
          filters: AddressFilters = {},
          sort: AddressSort = { field: 'created_at', direction: 'desc' },
          page: number = 1,
          perPage: number = 20
        ) => {
          set((state) => {
            state.searchLoading = true;
            state.searchError = null;
            state.currentFilters = filters;
            state.currentSort = sort;
          });

          const result = await AddressService.searchAddresses(filters, sort, page, perPage);

          set((state) => {
            state.searchLoading = false;
            if (result.success && result.data) {
              state.searchResults = result.data;
              // Cache the addresses
              result.data.addresses.forEach((address: Address) => {
                state.addressCache.set(address.id, address);
              });
            } else {
              state.searchError = result.error || 'Failed to search addresses';
            }
          });
        },

        updateFilters: (filters: Partial<AddressFilters>) => {
          set((state) => {
            state.currentFilters = { ...state.currentFilters, ...filters };
          });
        },

        updateSort: (sort: AddressSort) => {
          set((state) => {
            state.currentSort = sort;
          });
        },

        clearSearch: () => {
          set((state) => {
            state.searchResults = null;
            state.searchError = null;
            state.currentFilters = {};
            state.currentSort = { field: 'created_at', direction: 'desc' };
          });
        },

        // Nearby addresses actions
        loadNearbyAddresses: async (
          coordinates: Coordinates,
          radiusKm: number = 10,
          limit: number = 20
        ) => {
          set((state) => {
            state.nearbyLoading = true;
            state.nearbyError = null;
          });

          const result = await AddressService.getNearbyAddresses(coordinates, radiusKm, limit);

          set((state) => {
            state.nearbyLoading = false;
            if (result.success && result.data) {
              state.nearbyAddresses = result.data;
              // Cache the addresses
              result.data.addresses.forEach((address: Address) => {
                state.addressCache.set(address.id, address);
              });
            } else {
              state.nearbyError = result.error || 'Failed to load nearby addresses';
            }
          });
        },

        clearNearbyAddresses: () => {
          set((state) => {
            state.nearbyAddresses = null;
            state.nearbyError = null;
          });
        },

        // Statistics actions
        loadStats: async () => {
          set((state) => {
            state.statsLoading = true;
            state.statsError = null;
          });

          const result = await AddressService.getAddressStats();

          set((state) => {
            state.statsLoading = false;
            if (result.success && result.data) {
              state.stats = result.data;
            } else {
              state.statsError = result.error || 'Failed to load statistics';
            }
          });
        },

        refreshStats: async () => {
          await get().loadStats();
        },

        // Permissions actions
        loadPermissions: async (addressId: string) => {
          const cache = get().permissionsCache;
          if (cache.has(addressId)) {
            return cache.get(addressId)!;
          }

          const result = await AddressService.getAddressPermissions(addressId);

          if (result.success && result.data) {
            get().cachePermissions(addressId, result.data);
            return result.data;
          }

          return null;
        },

        cachePermissions: (addressId: string, permissions: AddressPermissions) => {
          set((state) => {
            state.permissionsCache.set(addressId, permissions);
          });
        },

        // Geocoding actions
        geocodeAddress: async (address: Partial<Address>) => {
          const addressString = JSON.stringify(address);
          const cache = get().geocodingCache;
          
          if (cache.has(addressString)) {
            return cache.get(addressString)!;
          }

          const result = await AddressService.geocodeAddress(address);

          set((state) => {
            state.geocodingCache.set(addressString, result);
          });

          return result;
        },

        reverseGeocode: async (coordinates: Coordinates) => {
          const coordString = `${coordinates.latitude},${coordinates.longitude}`;
          const cache = get().reverseGeocodingCache;

          if (cache.has(coordString)) {
            return cache.get(coordString)!;
          }

          const result = await AddressService.reverseGeocode(coordinates);

          set((state) => {
            state.reverseGeocodingCache.set(coordString, result);
          });

          return result;
        },

        extractCoordinatesFromMapsUrl: (mapsUrl: string) => {
          return AddressService.extractCoordinatesFromMapsUrl(mapsUrl);
        },

        // Distance calculation
        calculateDistance: async (fromAddressId: string, toAddressId: string) => {
          const result = await AddressService.calculateDistance(fromAddressId, toAddressId);
          return result.success && result.data ? result.data : null;
        },

        // UI state actions
        setEditMode: (enabled: boolean, addressId?: string) => {
          set((state) => {
            state.isEditMode = enabled;
            state.editingAddressId = addressId || null;
            if (!enabled) {
              state.editFormData = null;
            }
          });
        },

        setEditFormData: (data: AddressUpdate | null) => {
          set((state) => {
            state.editFormData = data;
          });
        },

        resetEditForm: () => {
          set((state) => {
            state.editFormData = null;
            state.isEditMode = false;
            state.editingAddressId = null;
          });
        },

        setCreateMode: (enabled: boolean) => {
          set((state) => {
            state.isCreating = enabled;
            if (!enabled) {
              state.createFormData = null;
            }
          });
        },

        setCreateFormData: (data: Partial<AddressCreate> | null) => {
          set((state) => {
            state.createFormData = data;
          });
        },

        resetCreateForm: () => {
          set((state) => {
            state.createFormData = null;
            state.isCreating = false;
          });
        },

        // Operation state actions
        setOperationLoading: (addressId: string, loading: boolean) => {
          set((state) => {
            if (loading) {
              state.operationLoading.set(addressId, true);
            } else {
              state.operationLoading.delete(addressId);
            }
          });
        },

        setBulkOperationLoading: (loading: boolean) => {
          set((state) => {
            state.bulkOperationLoading = loading;
          });
        },

        // Utility actions
        refreshAddressData: async (addressId?: string) => {
          if (addressId) {
            // Refresh specific address
            const result = await AddressService.getAddress(addressId);
            if (result.success && result.data) {
              get().cacheAddress(result.data);
              
              set((state) => {
                const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
                if (index >= 0) {
                  state.currentUserAddresses[index] = result.data!;
                }
                
                if (state.primaryAddress?.id === addressId) {
                  state.primaryAddress = result.data!;
                }
              });
            }
          } else {
            // Refresh all current user addresses
            await get().loadCurrentUserAddresses();
          }
        },

        bulkUpdateAddresses: async (updates: Array<{ id: string; updates: AddressUpdate }>) => {
          set((state) => {
            state.bulkOperationLoading = true;
          });

          const results = await Promise.all(
            updates.map(({ id, updates: addressUpdates }) =>
              AddressService.updateAddress(id, addressUpdates)
            )
          );

          const allSuccessful = results.every((result) => result.success);

          if (allSuccessful) {
            // Refresh addresses after bulk update
            await get().loadCurrentUserAddresses();
          }

          set((state) => {
            state.bulkOperationLoading = false;
          });

          return allSuccessful;
        },
      })),
      {
        name: 'address-store',
        partialize: (state) => ({
          // Only persist UI preferences and some cache
          currentFilters: state.currentFilters,
          currentSort: state.currentSort,
        }),
      }
    ),
    {
      name: 'address-store',
    }
  )
);

// Selector hooks for better performance
export const useCurrentUserAddresses = () => useAddressStore(state => state.currentUserAddresses);
export const usePrimaryAddress = () => useAddressStore(state => state.primaryAddress);
export const useCurrentAddressesLoading = () => useAddressStore(state => state.currentAddressesLoading);
export const useCurrentAddressesError = () => useAddressStore(state => state.currentAddressesError);

export const useSearchResults = () => useAddressStore(state => state.searchResults);
export const useSearchLoading = () => useAddressStore(state => state.searchLoading);
export const useSearchError = () => useAddressStore(state => state.searchError);

export const useNearbyAddresses = () => useAddressStore(state => state.nearbyAddresses);
export const useNearbyLoading = () => useAddressStore(state => state.nearbyLoading);

export const useAddressStats = () => useAddressStore(state => state.stats);
export const useAddressStatsLoading = () => useAddressStore(state => state.statsLoading);

export const useEditMode = () => useAddressStore(state => state.isEditMode);
export const useEditingAddressId = () => useAddressStore(state => state.editingAddressId);
export const useEditFormData = () => useAddressStore(state => state.editFormData);

export const useCreateMode = () => useAddressStore(state => state.isCreating);
export const useCreateFormData = () => useAddressStore(state => state.createFormData);

export const useBulkOperationLoading = () => useAddressStore(state => state.bulkOperationLoading);

// Address cache selectors
export const useAddressFromCache = (addressId: string) => {
  return useAddressStore(state => state.addressCache.get(addressId));
};

export const useAddressCacheLoading = (addressId: string) => {
  return useAddressStore(state => state.addressCacheLoading.has(addressId));
};

export const useAddressCacheError = (addressId: string) => {
  return useAddressStore(state => state.addressCacheErrors.get(addressId));
};

export const useAddressOperationLoading = (addressId: string) => {
  return useAddressStore(state => state.operationLoading.get(addressId) || false);
};

export const usePublicAddressesFromCache = (userId: string) => {
  return useAddressStore(state => state.publicAddressCache.get(userId));
};

// Permission selectors
export const useAddressPermissions = (addressId: string) => {
  return useAddressStore(state => state.permissionsCache.get(addressId));
};