'use client';

/**
 * Public Profile Header Component
 * 
 * Modern 2025-style hero section with cover image, avatar, name,
 * role badge, verification status, and quick action buttons.
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/avatar';
import { ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import type { PublicProfile } from '@/lib/schema/profile.types';
import {
    BadgeCheck,
    Briefcase,
    Calendar,
    GraduationCap,
    MapPin,
    Share2,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicProfileHeaderProps {
    profile: PublicProfile;
    isOwnProfile?: boolean;
    onShare?: () => void;
    className?: string;
}

function getRoleInfo(role: PublicProfile['role']) {
    switch (role) {
        case 'T':
            return { label: 'Teacher', icon: Briefcase, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
        case 'C':
            return { label: 'Coach', icon: Briefcase, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
        case 'S':
            return { label: 'Student', icon: GraduationCap, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
        case 'A':
            return { label: 'Admin', icon: User, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
        case 'SA':
            return { label: 'Super Admin', icon: User, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
        default:
            return { label: 'User', icon: User, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' };
    }
}

function formatMemberSince(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const PublicProfileHeader = memo(function PublicProfileHeader({
    profile,
    isOwnProfile = false,
    onShare,
    className,
}: PublicProfileHeaderProps) {
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const roleInfo = getRoleInfo(profile.role);
    const RoleIcon = roleInfo.icon;

    return (
        <section className={cn('relative', className)}>
            {/* Cover/Background Gradient */}
            <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-r from-primary/80 via-primary to-primary/60 overflow-hidden">
                {/* Decorative pattern overlay */}
                <div className="absolute inset-0 opacity-10 z-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Share button */}
                {onShare && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                        onClick={onShare}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                )}
            </div>

            {/* Profile Info Card - Overlapping */}
            <div className="relative  ">
                <div className="bg-card border rounded-b-xl p-3 sm:p-4 ">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0 -mt-16 sm:-mt-20">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-background border-4 border-background shadow-lg overflow-hidden">
                                <UserAvatar
                                    profile={profile}
                                    size="2xl"
                                    className="w-full h-full"
                                    showOnlineStatus={false}
                                />
                            </div>
                            {profile.is_verified && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 ring-4 ring-background">
                                    <BadgeCheck className="h-4 w-4 text-white" />
                                </div>
                            )}

                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0 pt-2 sm:pt-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                {/* Name and username */}
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                                        {displayName}
                                    </h1>
                                    {/* {profile.username && (
                                        <p className="text-muted-foreground mt-0.5">
                                            @{profile.username}
                                        </p>
                                    )} */}
                                </div>

                                {/* Role badge */}
                                <Badge className={cn('self-start shrink-0', roleInfo.color)}>
                                    <RoleIcon className="h-3.5 w-3.5 mr-1" />
                                    {roleInfo.label}
                                </Badge>
                            </div>

                            {/* Meta info row */}
                            <div className=" flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                {profile.is_verified && (
                                    <span className="inline-flex items-center gap-1 text-blue-600">
                                        <BadgeCheck className="h-4 w-4" />
                                        Verified
                                    </span>
                                )}

                                {(profile.role === 'T' || profile.role === 'C') && profile.years_of_experience && (
                                    <span className="inline-flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        {profile.years_of_experience} years experience
                                    </span>
                                )}

                                {profile.role === 'S' && profile.grade_level && (
                                    <span className="inline-flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" />
                                        {profile.grade_level}
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Member since {formatMemberSince(profile.created_at)}
                                </span>
                            </div>

                            {/* Bio preview */}
                            {profile.bio && (
                                <p className="text-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});
