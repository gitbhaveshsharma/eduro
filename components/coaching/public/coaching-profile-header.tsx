'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CoachingDisplayUtils,
    CoachingUrlUtils,
    type PublicCoachingCenter
} from '@/lib/coaching';
import { useReviewStore } from '@/lib/review';
import {
    CheckCircle2,
    Ellipsis,
    Globe,
    Link as LinkIcon,
    Star
} from 'lucide-react';

interface CoachingProfileHeaderProps {
    center: PublicCoachingCenter;
    onShare?: () => void;
    onSave?: () => void;
}

export const CoachingProfileHeader = memo(function CoachingProfileHeader({
    center,
    onShare,
    onSave
}: CoachingProfileHeaderProps) {
    const [imageError, setImageError] = useState(false);

    const loadSummary = useReviewStore(s => s.loadCoachingCenterRatingSummary);
    const ratingSummary = useReviewStore(s => s.ratingSummary);
    const ratingLoading = useReviewStore(s => s.ratingSummaryLoading);

    useEffect(() => {
        if (center.id) loadSummary(center.id);
    }, [center.id, loadSummary]);

    const avg = ratingSummary?.average_rating || 0;
    const total = ratingSummary?.total_reviews || 0;

    const coverUrl = CoachingUrlUtils.getCoverUrl(center);
    const logoUrl = CoachingUrlUtils.getLogoUrl(center, 200);
    const categoryInfo = {
        icon: CoachingDisplayUtils.getCategoryIcon(center.category || 'OTHER'),
        label: CoachingDisplayUtils.getCategoryDisplayName(center.category),
    };

    const handleImageError = useCallback(() => setImageError(true), []);

    return (
        <section className="w-full">
            {/* Cover */}
            <div className="relative h-[196px] sm:h-[220px] lg:h-[240px] bg-muted overflow-hidden">
                {center.cover_url && !imageError ? (
                    <>
                        <img
                            src={coverUrl}
                            alt={`${center.name} cover`}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full grid place-items-center">
                        <span className="text-6xl">{categoryInfo.icon}</span>
                    </div>
                )}

                {/* Floating actions (right) */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Button variant="secondary" className="rounded-full bg-white/95 backdrop-blur px-4">
                        + Follow
                    </Button>
                    {center.website && (
                        <Button asChild variant="secondary" className="rounded-full bg-white/95 backdrop-blur px-3">
                            <a href={center.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    {(onShare || onSave) && (
                        <Button variant="secondary" className="rounded-full bg-white/95 backdrop-blur px-3" onClick={onShare}>
                            <Ellipsis className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Overlap card */}
            <div className="-mt-10 sm:-mt-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-card border rounded-xl p-4 sm:p-6">
                        <div className="flex gap-4 sm:gap-6">
                            {/* Logo block overlapping */}
                            <div className="relative shrink-0 -mt-12">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-background border shadow-md overflow-hidden">
                                    <img src={logoUrl} alt={`${center.name} logo`} className="w-full h-full object-cover" />
                                </div>
                                {center.is_verified && (
                                    <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1.5 ring-4 ring-card">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Main identity */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                    <div className="min-w-0">
                                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                                            {center.name}
                                        </h1>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <span aria-hidden>{categoryInfo.icon}</span>
                                                {categoryInfo.label}
                                            </span>
                                            {/* {center.city && <span>• {center.city}</span>}
                      {typeof center.total_employees === 'number' && (
                        <span>• {Intl.NumberFormat().format(center.total_employees)} employees</span>
                      )} */}
                                            {center.website && (
                                                <a
                                                    href={center.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <LinkIcon className="h-3.5 w-3.5" /> Website
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Compact rating chip */}
                                    {ratingLoading ? (
                                        <div className="w-28">
                                            <Skeleton className="h-8 rounded-full" />
                                        </div>
                                    ) : total > 0 ? (
                                        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm">
                                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                            <span>{avg.toFixed(1)}/5</span>
                                            <span className="text-muted-foreground">({total})</span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Meta bar (like LinkedIn info row) */}
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {center.is_featured && (
                                        <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
                                    )}
                                    {center.established_year && (
                                        <Badge variant="secondary">
                                            Est. {CoachingDisplayUtils.formatEstablishedYear(center.established_year)}
                                        </Badge>
                                    )}
                                    {typeof center.total_branches === 'number' && center.total_branches > 0 && (
                                        <Badge variant="secondary">
                                            {CoachingDisplayUtils.formatBranchCount(center.total_branches, center.active_branches)}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});
