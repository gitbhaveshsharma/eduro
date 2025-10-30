/**
 * Coaching Profile Header Component
 * 
 * Displays the hero section of a coaching center profile
 * Shows cover image, logo, name, category, verification status, and key actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CoachingDisplayUtils,
    CoachingUrlUtils,
    type PublicCoachingCenter
} from '@/lib/coaching';
import {
    Star,
    MapPin,
    Phone,
    Mail,
    Globe,
    Share2,
    BookmarkPlus,
    Building2,
    CheckCircle2,
    StarIcon
} from 'lucide-react';
import { useState } from 'react';

interface CoachingProfileHeaderProps {
    center: PublicCoachingCenter;
    averageRating?: number;
    totalReviews?: number;
    onShare?: () => void;
    onSave?: () => void;
}

export function CoachingProfileHeader({
    center,
    averageRating = 0,
    totalReviews = 0,
    onShare,
    onSave
}: CoachingProfileHeaderProps) {
    const [imageError, setImageError] = useState(false);

    const categoryInfo = {
        label: CoachingDisplayUtils.getCategoryDisplayName(center.category),
        icon: CoachingDisplayUtils.getCategoryIcon(center.category),
        color: CoachingDisplayUtils.getCategoryColor(center.category)
    };

    const coverUrl = CoachingUrlUtils.getCoverUrl(center);
    const logoUrl = CoachingUrlUtils.getLogoUrl(center, 120);

    return (
        <div className="relative w-full">
            {/* Cover Image */}
            <div className="relative h-64 md:h-80 lg:h-96 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                {center.cover_url && !imageError ? (
                    <img
                        src={coverUrl}
                        alt={`${center.name} cover`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-6xl md:text-8xl">{categoryInfo.icon}</span>
                            <p className="mt-4 text-lg text-muted-foreground">{categoryInfo.label}</p>
                        </div>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Action Buttons (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {onShare && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full bg-white/90 hover:bg-white backdrop-blur-sm"
                            onClick={onShare}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    )}
                    {onSave && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full bg-white/90 hover:bg-white backdrop-blur-sm"
                            onClick={onSave}
                        >
                            <BookmarkPlus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Profile Info Section */}
            <div className="relative -mt-20 px-4 md:px-8 pb-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Logo */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl ring-4 ring-background">
                                <img
                                    src={logoUrl}
                                    alt={`${center.name} logo`}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                            {center.is_verified && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2 shadow-lg">
                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Center Info */}
                        <div className="flex-1 space-y-3 bg-background rounded-xl p-6 shadow-lg">
                            {/* Name and Badges */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                        {center.name}
                                    </h1>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="text-sm">
                                        {categoryInfo.icon} {categoryInfo.label}
                                    </Badge>

                                    {center.is_verified && (
                                        <Badge variant="default" className="bg-blue-500 text-white">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}

                                    {center.is_featured && (
                                        <Badge variant="default" className="bg-yellow-500 text-white">
                                            <StarIcon className="h-3 w-3 mr-1" />
                                            Featured
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Rating */}
                            {totalReviews > 0 && (
                                <div className="flex items-center gap-3 pt-2 border-t">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                                    </span>
                                </div>
                            )}

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                                {center.established_year && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{CoachingDisplayUtils.formatEstablishedYear(center.established_year)}</span>
                                    </div>
                                )}

                                {(center.total_branches !== undefined && center.total_branches > 0) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{CoachingDisplayUtils.formatBranchCount(center.total_branches, center.active_branches)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Contact Actions */}
                            <div className="flex flex-wrap gap-2 pt-4">
                                {center.phone && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`tel:${center.phone}`}>
                                            <Phone className="h-4 w-4 mr-2" />
                                            Call Now
                                        </a>
                                    </Button>
                                )}

                                {center.email && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`mailto:${center.email}`}>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </a>
                                    </Button>
                                )}

                                {center.website && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={center.website} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-4 w-4 mr-2" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
