// /**
//  * Location Reviews Hook
//  * 
//  * Custom hook for managing reviews based on user's location
//  * Integrates with address store to get user location automatically
//  */

// import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
// import { useReviewStore, useSearchResults, useSearchLoading, useSearchError } from '@/lib/review';
// import { useAddressStore, usePrimaryAddress } from '@/lib/address';
// import type { ReviewSortBy } from '@/lib/schema/review.types';
// import type { Address } from '@/lib/schema/address.types';

// interface LocationReviewsConfig {
//   /** Auto-load reviews when component mounts */
//   autoLoad?: boolean;
//   /** Default sort order */
//   defaultSort?: ReviewSortBy;
//   /** Number of reviews per page */
//   perPage?: number;
//   /** Whether to use user's primary address automatically */
//   useUserLocation?: boolean;
//   /** Custom location override */
//   customLocation?: {
//     state?: string;
//     district?: string;
//     city?: string;
//   };
// }

// interface LocationReviewsReturn {
//   /** Review data and pagination */
//   reviews: ReturnType<typeof useSearchResults>;
//   loading: boolean;
//   error: string | null;
  
//   /** User location info */
//   userLocation: {
//     state?: string;
//     district?: string;
//     city?: string;
//   } | null;
//   primaryAddress: Address | null;
  
//   /** Manual controls */
//   loadReviews: (location?: {
//     state?: string;
//     district?: string;
//     city?: string;
//   }, sort?: ReviewSortBy) => Promise<void>;
//   refreshReviews: () => Promise<void>;
//   loadNextPage: () => Promise<void>;
//   loadPreviousPage: () => Promise<void>;
  
//   /** Location helpers */
//   hasValidLocation: boolean;
//   locationString: string;
//   /** Active sort value */
//   currentSort: ReviewSortBy;
// }

// /**
//  * Hook for managing reviews based on user's location
//  */
// export function useLocationReviews(config: LocationReviewsConfig = {}): LocationReviewsReturn {
//   const {
//     autoLoad = true,
//     defaultSort = 'recent',
//     perPage = 20,
//     useUserLocation = true,
//     customLocation
//   } = config;

//   const [currentPage, setCurrentPage] = useState(1);
//   const [currentSort, setCurrentSort] = useState<ReviewSortBy>(defaultSort);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const loadingRef = useRef(false);

//   // Review store
//   const { loadLocationReviews } = useReviewStore();
//   const reviews = useSearchResults();
//   const loading = useSearchLoading();
//   const error = useSearchError();

//   // Address store
//   const { loadPrimaryAddress } = useAddressStore();
//   const primaryAddress = usePrimaryAddress();

//   // Memoize the effective location to prevent infinite re-renders
//   const effectiveLocation = useMemo(() => {
//     if (customLocation) {
//       return customLocation;
//     }
    
//     if (useUserLocation && primaryAddress) {
//       return {
//         state: primaryAddress.state,
//         district: primaryAddress.district,
//         city: primaryAddress.city || undefined
//       };
//     }
    
//     return null;
//   }, [customLocation, useUserLocation, primaryAddress?.state, primaryAddress?.district, primaryAddress?.city]);

//   const hasValidLocation = !!(effectiveLocation?.state || effectiveLocation?.district || effectiveLocation?.city);

//   // Create location string for display
//   const locationString = useMemo(() => {
//     if (!effectiveLocation) return '';
    
//     return [
//       effectiveLocation.city,
//       effectiveLocation.district,
//       effectiveLocation.state
//     ].filter(Boolean).join(', ');
//   }, [effectiveLocation]);

//   // Load user's primary address on mount if needed
//   useEffect(() => {
//     if (useUserLocation && !primaryAddress && !isLoading) {
//       loadPrimaryAddress();
//     }
//   }, [useUserLocation, primaryAddress, loadPrimaryAddress, isLoading]);

//   // Auto-load reviews when location is available (only once on initialization)
//   useEffect(() => {
//     if (
//       autoLoad && 
//       hasValidLocation && 
//       effectiveLocation && 
//       !isInitialized && 
//       !isLoading && 
//       !loading &&
//       !loadingRef.current
//     ) {
//       loadingRef.current = true;
//       setIsLoading(true);
      
//       loadLocationReviews(effectiveLocation, currentSort, 1, perPage)
//         .then(() => {
//           setCurrentPage(1);
//           setIsInitialized(true);
//         })
//         .catch(console.error)
//         .finally(() => {
//           setIsLoading(false);
//           loadingRef.current = false;
//         });
//     }
//   }, [autoLoad, hasValidLocation, effectiveLocation, isInitialized, isLoading, loading]);

//   // Manual load function
//   const loadReviews = useCallback(async (
//     location?: { state?: string; district?: string; city?: string },
//     sort: ReviewSortBy = defaultSort
//   ) => {
//     if (loadingRef.current) return;
//     const targetLocation = location || effectiveLocation;
//     if (!targetLocation) {
//       console.warn('No location provided for loading reviews');
//       return;
//     }

//     setCurrentSort(sort);
//     setCurrentPage(1);
//     setIsInitialized(false);
//     loadingRef.current = true;
//     setIsLoading(true);
//     try {
//       await loadLocationReviews(targetLocation, sort, 1, perPage);
//       setIsInitialized(true);
//     } catch (error) {
//       console.error('Failed to load reviews:', error);
//     } finally {
//       loadingRef.current = false;
//       setIsLoading(false);
//     }
//   }, [effectiveLocation, perPage, loadLocationReviews, defaultSort]);

//   // Refresh current reviews
//   const refreshReviews = useCallback(async () => {
//     if (!effectiveLocation) return;
//     if (loadingRef.current) return;
//     loadingRef.current = true;
//     setIsLoading(true);
//     try {
//       await loadLocationReviews(effectiveLocation, currentSort, currentPage, perPage);
//     } catch (error) {
//       console.error('Failed to refresh reviews:', error);
//     } finally {
//       loadingRef.current = false;
//       setIsLoading(false);
//     }
//   }, [effectiveLocation, loadLocationReviews, currentSort, currentPage, perPage]);

//   // Load next page
//   const loadNextPage = useCallback(async () => {
//     if (!effectiveLocation || !reviews?.has_next) return;
    
//     const nextPage = currentPage + 1;
//     setCurrentPage(nextPage);
    
//     try {
//       await loadLocationReviews(effectiveLocation, currentSort, nextPage, perPage);
//     } catch (error) {
//       console.error('Failed to load next page:', error);
//       setCurrentPage(currentPage); // Revert on error
//     }
//   }, [effectiveLocation, reviews?.has_next, currentPage, currentSort, perPage, loadLocationReviews]);

//   // Load previous page
//   const loadPreviousPage = useCallback(async () => {
//     if (!effectiveLocation || !reviews?.has_previous) return;
    
//     const prevPage = currentPage - 1;
//     setCurrentPage(prevPage);
    
//     try {
//       await loadLocationReviews(effectiveLocation, currentSort, prevPage, perPage);
//     } catch (error) {
//       console.error('Failed to load previous page:', error);
//       setCurrentPage(currentPage); // Revert on error
//     }
//   }, [effectiveLocation, reviews?.has_previous, currentPage, currentSort, perPage, loadLocationReviews]);

//   return {
//     // Data
//     reviews,
//     loading: loading || isLoading,
//     error,
    
//     // Location info
//     userLocation: effectiveLocation,
//     primaryAddress,
    
//     // Actions
//     loadReviews,
//     refreshReviews,
//     loadNextPage,
//     loadPreviousPage,
    
//     // Current UI state
//     currentSort,

//     // Helpers
//     hasValidLocation,
//     locationString
//   };
// }

// /**
//  * Simplified hook for just getting reviews in user's location
//  */
// export function useUserLocationReviews() {
//   return useLocationReviews({
//     autoLoad: true,
//     useUserLocation: true,
//     defaultSort: 'recent'
//   });
// }

// /**
//  * Hook for reviews in a specific location
//  */
// export function useCustomLocationReviews(location: {
//   state?: string;
//   district?: string;
//   city?: string;
// }) {
//   return useLocationReviews({
//     autoLoad: true,
//     useUserLocation: false,
//     customLocation: location
//   });
// }