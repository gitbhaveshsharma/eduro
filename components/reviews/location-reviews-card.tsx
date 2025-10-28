// 'use client';

// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import {
//     Star,
//     MapPin,
//     RefreshCw,
//     ChevronLeft,
//     ChevronRight,
//     Users,
//     Filter,
//     ChevronDown,
// } from 'lucide-react';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { useLocationReviews } from '@/hooks/use-location-reviews';
// import { ReviewDisplayUtils } from '@/lib/utils/review.utils';
// import { cn } from '@/lib/utils';
// import type { ReviewSortBy } from '@/lib/schema/review.types';

// interface LocationReviewsCardProps {
//     className?: string;
//     title?: string;
//     maxHeight?: string;
//     customLocation?: { state?: string; district?: string; city?: string };
//     showLocation?: boolean;
//     showPagination?: boolean;
//     defaultSort?: ReviewSortBy;
//     perPage?: number;
//     onReviewClick?: (reviewId: string) => void;
//     /**
//      * Show sort dropdown and refresh button. Set to false to hide both.
//      * Default: true
//      */
//     sortOption?: boolean;
//     /**
//      * Maximum number of characters to show from a review comment in the list.
//      * Default: 50
//      */
//     commentPreviewLength?: number;
// }

// const SORT_OPTIONS = [
//     { value: 'recent', label: 'Most Recent' },
//     { value: 'helpful', label: 'Most Helpful' },
//     { value: 'highest_rated', label: 'Highest Rated' },
//     { value: 'lowest_rated', label: 'Lowest Rated' },
//     { value: 'relevant', label: 'Relevant' },
// ] as const;

// export function LocationReviewsCard({
//     className,
//     title,
//     maxHeight = '500px',
//     customLocation,
//     showLocation = true,
//     showPagination = true,
//     defaultSort = 'recent',
//     perPage = 10,
//     onReviewClick,
//     sortOption = true,
//     commentPreviewLength = 50,
// }: LocationReviewsCardProps) {
//     const {
//         reviews,
//         loading,
//         error,
//         userLocation,
//         currentSort,
//         loadReviews,
//         refreshReviews,
//         loadNextPage,
//         loadPreviousPage,
//         hasValidLocation,
//         locationString,
//     } = useLocationReviews({
//         autoLoad: true,
//         useUserLocation: !customLocation,
//         customLocation,
//         defaultSort,
//         perPage,
//     });

//     const displayTitle = title || (customLocation ? 'Reviews in Area' : 'Reviews Near You');

//     const handleSortChange = (sort: ReviewSortBy) => {
//         loadReviews(customLocation || userLocation || undefined, sort);
//     };

//     const handleReviewClick = (reviewId: string) => {
//         onReviewClick?.(reviewId);
//     };

//     const currentSortLabel =
//         SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label || 'Most Recent';

//     return (
//         <Card className={cn('flex flex-col border shadow-sm', className)}>
//             {/* Header: 3 stacked rows */}
//             <CardHeader className="pb-2">
//                 {/* Row 1: Title */}
//                 <div className="min-w-0">
//                     <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0">
//                         <Users className="h-5 w-5 text-primary shrink-0" />
//                         <span className="truncate">{displayTitle}</span>
//                     </CardTitle>
//                 </div>

//                 {/* Row 2: Controls (Sort + Refresh) */}
//                 {sortOption && (
//                     <div className="mt-2 flex items-center gap-2">
//                         <DropdownMenu modal={false}>
//                             <DropdownMenuTrigger asChild>
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="h-8 gap-1.5 min-w-0 shrink-0"
//                                     disabled={loading}
//                                     aria-label="Sort reviews"
//                                 >
//                                     <Filter className="h-3.5 w-3.5 shrink-0" />
//                                     <span className="truncate max-w-[160px]">{currentSortLabel}</span>
//                                     <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
//                                 </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="start" className="w-44">
//                                 {SORT_OPTIONS.map((option) => (
//                                     <DropdownMenuItem
//                                         key={option.value}
//                                         onClick={() => handleSortChange(option.value as ReviewSortBy)}
//                                         className={cn('cursor-pointer', currentSort === option.value && 'bg-accent')}
//                                     >
//                                         {option.label}
//                                     </DropdownMenuItem>
//                                 ))}
//                             </DropdownMenuContent>
//                         </DropdownMenu>

//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={refreshReviews}
//                             disabled={loading}
//                             className="h-8 w-8 p-0 shrink-0"
//                             aria-label="Refresh reviews"
//                         >
//                             <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
//                         </Button>
//                     </div>
//                 )}

//                 {/* Row 3: Location */}
//                 {showLocation && hasValidLocation && (
//                     <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
//                         <MapPin className="h-3.5 w-3.5 shrink-0" />
//                         <span className="truncate max-w-[260px] sm:max-w-[320px]">{locationString}</span>
//                     </div>
//                 )}
//             </CardHeader>

//             {/* Results: scrollable body only */}
//             <CardContent className="p-0 flex min-h-0 flex-1">
//                 <div className="w-full px-6 pb-4 overflow-y-auto scrollbar-modern" style={{ maxHeight }}>
//                     {/* Skeleton: first load */}
//                     {loading && !reviews && (
//                         <div className="space-y-6" role="status" aria-label="Loading reviews">
//                             {/* Item 1 */}
//                             <div className="space-y-3">
//                                 <div className="flex items-start gap-3">
//                                     <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
//                                     <div className="flex-1 min-w-0 space-y-2">
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-4 w-40" />
//                                             <Skeleton className="h-4 w-20" />
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-3 w-24" />
//                                             <Skeleton className="h-3 w-16" />
//                                         </div>
//                                         <Skeleton className="h-4 w-full" />
//                                         <Skeleton className="h-4 w-[90%]" />
//                                         <div className="flex items-center justify-between pt-1">
//                                             <Skeleton className="h-3 w-24" />
//                                             <div className="flex items-center gap-3">
//                                                 <Skeleton className="h-5 w-12" />
//                                                 <Skeleton className="h-5 w-12" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="border-b pt-2" />
//                             </div>

//                             {/* Item 2 */}
//                             <div className="space-y-3">
//                                 <div className="flex items-start gap-3">
//                                     <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
//                                     <div className="flex-1 min-w-0 space-y-2">
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-4 w-36" />
//                                             <Skeleton className="h-4 w-16" />
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-3 w-24" />
//                                             <Skeleton className="h-3 w-16" />
//                                         </div>
//                                         <Skeleton className="h-4 w-full" />
//                                         <Skeleton className="h-4 w-[85%]" />
//                                         <div className="flex items-center justify-between pt-1">
//                                             <Skeleton className="h-3 w-20" />
//                                             <div className="flex items-center gap-3">
//                                                 <Skeleton className="h-5 w-12" />
//                                                 <Skeleton className="h-5 w-12" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="border-b pt-2" />
//                             </div>

//                             {/* Item 3 */}
//                             <div className="space-y-3">
//                                 <div className="flex items-start gap-3">
//                                     <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
//                                     <div className="flex-1 min-w-0 space-y-2">
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-4 w-44" />
//                                             <Skeleton className="h-4 w-16" />
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <Skeleton className="h-3 w-24" />
//                                             <Skeleton className="h-3 w-16" />
//                                         </div>
//                                         <Skeleton className="h-4 w-full" />
//                                         <Skeleton className="h-4 w-[70%]" />
//                                         <div className="flex items-center justify-between pt-1">
//                                             <Skeleton className="h-3 w-16" />
//                                             <div className="flex items-center gap-3">
//                                                 <Skeleton className="h-5 w-12" />
//                                                 <Skeleton className="h-5 w-12" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Error */}
//                     {error && !loading && (
//                         <Alert className="mb-4">
//                             <AlertDescription className="text-sm">
//                                 {error}. Try refreshing or check your location settings.
//                             </AlertDescription>
//                         </Alert>
//                     )}

//                     {/* No location */}
//                     {!hasValidLocation && !loading && !error && (
//                         <Alert className="mb-4">
//                             <AlertDescription className="text-sm">
//                                 Unable to determine your location. Please set your address in your
//                                 profile to see local reviews.
//                             </AlertDescription>
//                         </Alert>
//                     )}

//                     {/* Empty state */}
//                     {hasValidLocation && !loading && !error && (!reviews || reviews.reviews.length === 0) && (
//                         <div className="text-center py-8 text-muted-foreground space-y-3">
//                             <Users className="h-12 w-12 mx-auto opacity-40" />
//                             <div className="space-y-1">
//                                 <p className="text-sm font-medium">No reviews found in your area yet.</p>
//                                 <p className="text-xs">Be the first to review a coaching center near you!</p>
//                             </div>
//                         </div>
//                     )}

//                     {/* Reviews list */}
//                     {reviews && reviews.reviews.length > 0 && (
//                         <div className="space-y-5">
//                             {reviews.reviews.map((review, index) => (
//                                 <div key={review.id} className="group">
//                                     <div
//                                         className={cn(
//                                             'space-y-3 p-3 rounded-lg transition-colors duration-200',
//                                             onReviewClick && 'cursor-pointer hover:bg-accent/50'
//                                         )}
//                                         onClick={() => handleReviewClick(review.id)}
//                                     >
//                                         {/* Review header */}
//                                         <div className="flex items-start justify-between gap-3">
//                                             <div className="flex-1 min-w-0 space-y-2">
//                                                 <div className="flex items-center gap-2 flex-wrap">
//                                                     <h4 className="font-semibold text-sm line-clamp-1">
//                                                         {review.branch_name || 'Coaching Center'}
//                                                     </h4>
//                                                     <Badge variant="secondary" className="text-xs font-normal">
//                                                         {review.center_name}
//                                                     </Badge>
//                                                 </div>

//                                                 <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
//                                                     <div className="flex items-center gap-1">
//                                                         {[...Array(5)].map((_, i) => (
//                                                             <Star
//                                                                 key={i}
//                                                                 className={cn(
//                                                                     'h-3 w-3',
//                                                                     i < parseInt(review.overall_rating)
//                                                                         ? 'fill-yellow-400 text-yellow-400'
//                                                                         : 'text-muted'
//                                                                 )}
//                                                             />
//                                                         ))}
//                                                         <span className="ml-1 font-medium">{review.overall_rating}/5</span>
//                                                     </div>
//                                                     <span className="text-muted">•</span>
//                                                     <span className="text-xs">
//                                                         {ReviewDisplayUtils.formatTimeAgo(review.created_at)}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         {/* Title */}
//                                         {review.title && (
//                                             <h5 className="font-medium text-sm line-clamp-2 text-foreground">
//                                                 {review.title}
//                                             </h5>
//                                         )}

//                                         {/* Content */}
//                                         {review.comment && (
//                                             <p className="text-sm text-muted-foreground leading-relaxed">
//                                                 {review.comment.length > commentPreviewLength
//                                                     ? `${review.comment.slice(0, commentPreviewLength).trim()}...`
//                                                     : review.comment}
//                                             </p>
//                                         )}

//                                         {/* Footer */}
//                                         <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
//                                             <span className="font-medium">
//                                                 by {ReviewDisplayUtils.getReviewerName(review)}
//                                             </span>
//                                             <div className="flex items-center gap-3">
//                                                 {review.helpful_count > 0 && (
//                                                     <span className="flex items-center gap-1">
//                                                         {review.helpful_count} helpful
//                                                     </span>
//                                                 )}
//                                                 {review.is_verified_reviewer && (
//                                                     <Badge
//                                                         variant="outline"
//                                                         className="text-xs bg-green-50 text-green-700 border-green-200"
//                                                     >
//                                                         Verified
//                                                     </Badge>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Divider */}
//                                     {index < reviews.reviews.length - 1 && <div className="border-b mt-2" />}
//                                 </div>
//                             ))}
//                         </div>
//                     )}

//                     {/* Loading more skeleton */}
//                     {loading && reviews && (
//                         <div className="mt-3 space-y-3" role="status" aria-label="Loading more reviews">
//                             <div className="flex items-start gap-3">
//                                 <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
//                                 <div className="flex-1 min-w-0 space-y-2">
//                                     <Skeleton className="h-4 w-40" />
//                                     <Skeleton className="h-3 w-28" />
//                                     <Skeleton className="h-4 w-full" />
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </CardContent>

//             {/* Pagination */}
//             {showPagination && reviews && reviews.total_pages > 1 && (
//                 <div className="border-t px-6 py-3 bg-muted/20">
//                     <div className="flex items-center justify-between">
//                         <div className="text-xs text-muted-foreground">
//                             Page {reviews.page} of {reviews.total_pages} • {reviews.total_count} total reviews
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={loadPreviousPage}
//                                 disabled={!reviews.has_previous || loading}
//                                 className="h-8 w-8 p-0"
//                                 aria-label="Previous page"
//                             >
//                                 <ChevronLeft className="h-4 w-4" />
//                             </Button>
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={loadNextPage}
//                                 disabled={!reviews.has_next || loading}
//                                 className="h-8 w-8 p-0"
//                                 aria-label="Next page"
//                             >
//                                 <ChevronRight className="h-4 w-4" />
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </Card>
//     );
// }

// /* Variants */
// export function LocationReviewsCardCompact(
//     props: Omit<LocationReviewsCardProps, 'maxHeight' | 'showPagination'>
// ) {
//     return (
//         <LocationReviewsCard
//             {...props}
//             maxHeight="350px"
//             showPagination={false}
//             perPage={4}
//             className={cn('h-fit', props.className)}
//         />
//     );
// }

// export function LocationReviewsCardFull(props: LocationReviewsCardProps) {
//     return (
//         <LocationReviewsCard
//             {...props}
//             maxHeight="600px"
//             showPagination
//             perPage={15}
//         />
//     );
// }
