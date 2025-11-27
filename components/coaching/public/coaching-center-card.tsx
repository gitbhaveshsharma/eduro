/**
 * Coaching Centers Discovery/List Page Component
 * 
 * Displays a grid of coaching center cards with filters
 * Allows users to search and browse all coaching centers
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    type PublicCoachingCenter,
    CoachingDisplayUtils,
    CoachingUrlUtils
} from '@/lib/coaching';
import type { CoachingCenterSearchItem } from '@/lib/schema/coaching.types';
import {
    Star,
    MapPin,
    Building2,
    BadgeCheck,
    StarIcon,
    ChevronRight,
    Egg
} from 'lucide-react';
import Link from 'next/link';

interface CoachingCenterCardProps {
    center: PublicCoachingCenter;
    searchItem?: CoachingCenterSearchItem; // Additional search data
    averageRating?: number;
    totalReviews?: number;
    branchIndex?: number; // e.g., 1 for first branch, 2 for second
    totalBranches?: number; // Total number of branches for this center
}

export function CoachingCenterCard({
    center,
    searchItem,
    averageRating = 0,
    totalReviews = 0,
    branchIndex,
    totalBranches = 1
}: CoachingCenterCardProps) {
    const categoryInfo = {
        label: CoachingDisplayUtils.getCategoryDisplayName(center.category),
        icon: CoachingDisplayUtils.getCategoryIcon(center.category),
        color: CoachingDisplayUtils.getCategoryColor(center.category)
    };

    const logoUrl = CoachingUrlUtils.getLogoUrl(center, 80);
    // Include branch_id in URL when available so we can highlight it on the profile page
    const centerUrl = searchItem?.branch_id
        ? `/coaching/${center.slug || center.id}?branch=${searchItem.branch_id}`
        : `/coaching/${center.slug || center.id}`;

    // Use search result data if available, otherwise use center data
    const displayRating = searchItem?.avg_rating ? parseFloat(searchItem.avg_rating.toString()) : averageRating;
    const displayReviewCount = searchItem?.total_reviews || totalReviews;

    // Location data (from branch address if available)
    const locationParts = [
        searchItem?.location_city,
        searchItem?.location_district,
        searchItem?.location_state
    ].filter(Boolean);
    const locationText = locationParts.length > 0 ? locationParts.join(', ') : null;

    // Distance (when searching by location)
    const distanceText = searchItem?.distance_meters
        ? `${(searchItem.distance_meters / 1000).toFixed(1)} km away`
        : null;

    // Check if this center has a branch (branch_id is not null AND has location data)
    const hasBranch = searchItem?.branch_id !== null && searchItem?.branch_id !== undefined;
    const hasLocationData = locationText !== null;

    return (
        <Link href={centerUrl}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 h-full p-0">
                <CardContent className="p-0">
                    {/* Cover Image / Header */}
                    <div className=" h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
                        <span className="text-4xl">{categoryInfo.icon}</span>

                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            {center.is_verified && (
                                <Badge variant="default" className="h-6 min-w-6 border-2 border-white rounded-full px-1">
                                    <BadgeCheck className="h-3 w-3" />
                                </Badge>
                            )}
                            {center.is_featured && (
                                <Badge variant="default" className="h-6 min-w-6 rounded-full bg-yellow-500 text-white shadow-lg text-xs">
                                    <StarIcon className="h-3 w-3" />
                                </Badge>
                            )}
                        </div>

                        {/* Branch Indicator Badge - Bottom Left */}
                        {branchIndex && totalBranches > 1 && (
                            <div className="absolute bottom-2 left-2">
                                <Badge variant="success" >
                                    <Egg />Branch {branchIndex}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        {/* Logo and Name */}
                        <div className="flex items-start gap-3">
                            <img
                                src={logoUrl}
                                alt={`${center.name} logo`}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 ring-2 ring-background shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                    {center.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {categoryInfo.label}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {center.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {center.description}
                            </p>
                        )}

                        {/* Rating */}
                        {displayReviewCount > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{displayRating.toFixed(1)}</span>
                                </div>
                                <span className="text-muted-foreground">
                                    ({displayReviewCount} {displayReviewCount === 1 ? 'review' : 'reviews'})
                                </span>
                            </div>
                        )}

                        {/* Location */}
                        {locationText && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{locationText}</span>
                                {distanceText && (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {distanceText}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Subjects */}
                        {center.subjects && center.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {center.subjects.slice(0, 3).map((subject, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {subject}
                                    </Badge>
                                ))}
                                {center.subjects.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{center.subjects.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                {hasBranch ? (
                                    totalBranches > 1 ? (
                                        <span>{totalBranches} locations</span>
                                    ) : (
                                        <span>Has branch location</span>
                                    )
                                ) : (
                                    <span>No branch locations</span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                                <span className="font-medium">View Details</span>
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

interface CoachingCenterGridProps {
    centers: PublicCoachingCenter[];
    searchItems?: CoachingCenterSearchItem[]; // Optional search result data
    loading?: boolean;
    emptyMessage?: string;
}

export function CoachingCenterGrid({
    centers,
    searchItems,
    loading = false,
    emptyMessage = 'No coaching centers found'
}: CoachingCenterGridProps) {
    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-[320px] animate-pulse">
                        <CardContent className="p-0">
                            <div className="h-32 bg-muted" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                                <div className="h-16 bg-muted rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (centers.length === 0) {
        return (
            <div className="text-center py-12 space-y-3">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">{emptyMessage}</p>
                <Button variant="outline" asChild>
                    <Link href="/coaching">Browse All Coaching Centers</Link>
                </Button>
            </div>
        );
    }

    // Group search items by center to count branches and assign indices
    const branchIndexMap = new Map<string, Map<string, number>>(); // center_id -> (branch_id -> branch_index)

    if (searchItems) {
        searchItems.forEach((item) => {
            if (!branchIndexMap.has(item.center_id)) {
                branchIndexMap.set(item.center_id, new Map());
            }
            const centerBranches = branchIndexMap.get(item.center_id)!;
            if (!centerBranches.has(item.branch_id)) {
                centerBranches.set(item.branch_id, centerBranches.size + 1);
            }
        });
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {searchItems && searchItems.length > 0 ? (
                // Render based on search items (one card per branch)
                searchItems.map((searchItem) => {
                    const center = centers.find(c => c.id === searchItem.center_id);
                    if (!center) return null;

                    // Get branch info
                    const centerBranches = branchIndexMap.get(searchItem.center_id);
                    const branchIndex = centerBranches?.get(searchItem.branch_id) || 1;
                    const totalBranches = centerBranches?.size || 1;

                    return (
                        <CoachingCenterCard
                            key={`${searchItem.center_id}-${searchItem.branch_id}`}
                            center={center}
                            searchItem={searchItem}
                            averageRating={parseFloat(searchItem.avg_rating.toString())}
                            totalReviews={searchItem.total_reviews || 0}
                            branchIndex={totalBranches > 1 ? branchIndex : undefined}
                            totalBranches={totalBranches}
                        />
                    );
                })
            ) : (
                // Fallback: render based on centers only
                centers.map((center) => (
                    <CoachingCenterCard
                        key={center.id}
                        center={center}
                        averageRating={0}
                        totalReviews={0}
                    />
                ))
            )}
        </div>
    );
}
