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
import { Input } from '@/components/ui/input';
import {
    type PublicCoachingCenter,
    CoachingDisplayUtils,
    CoachingUrlUtils
} from '@/lib/coaching';
import {
    Star,
    MapPin,
    Building2,
    CheckCircle2,
    StarIcon,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface CoachingCenterCardProps {
    center: PublicCoachingCenter;
    averageRating?: number;
    totalReviews?: number;
}

export function CoachingCenterCard({
    center,
    averageRating = 0,
    totalReviews = 0
}: CoachingCenterCardProps) {
    const categoryInfo = {
        label: CoachingDisplayUtils.getCategoryDisplayName(center.category),
        icon: CoachingDisplayUtils.getCategoryIcon(center.category),
        color: CoachingDisplayUtils.getCategoryColor(center.category)
    };

    const logoUrl = CoachingUrlUtils.getLogoUrl(center, 80);
    const centerUrl = `/coaching/${center.slug || center.id}`;

    return (
        <Link href={centerUrl}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 h-full">
                <CardContent className="p-0">
                    {/* Cover Image / Header */}
                    <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <span className="text-4xl">{categoryInfo.icon}</span>

                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            {center.is_verified && (
                                <Badge variant="default" className="bg-blue-500 text-white text-xs">
                                    <CheckCircle2 className="h-3 w-3" />
                                </Badge>
                            )}
                            {center.is_featured && (
                                <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                                    <StarIcon className="h-3 w-3" />
                                </Badge>
                            )}
                        </div>
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
                        {totalReviews > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                                </div>
                                <span className="text-muted-foreground">
                                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                                </span>
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
                                <MapPin className="h-3.5 w-3.5" />
                                {center.total_branches ? (
                                    <span>{center.total_branches} {center.total_branches === 1 ? 'branch' : 'branches'}</span>
                                ) : (
                                    <span>No branches</span>
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
    loading?: boolean;
    emptyMessage?: string;
}

export function CoachingCenterGrid({
    centers,
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

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
                <CoachingCenterCard
                    key={center.id}
                    center={center}
                    // TODO: Load ratings from review store
                    averageRating={0}
                    totalReviews={0}
                />
            ))}
        </div>
    );
}
