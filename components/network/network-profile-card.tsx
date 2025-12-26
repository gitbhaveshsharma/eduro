'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { ConnectionButton } from '../connections/connection-button';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import type { FollowerProfile } from '@/lib/follow';

interface ProfileCardProps {
    profile: FollowerProfile;
    currentUser?: FollowerProfile;
    onConnectionChange?: () => void;
    index?: number;
}

// Dynamic color class mapping based on color name
const getColorClasses = (colorName: string): string => {
    const colorMap: Record<string, string> = {
        red: 'bg-red-500/10 text-red-700',
        orange: 'bg-orange-500/10 text-orange-700',
        blue: 'bg-blue-500/10 text-blue-700',
        green: 'bg-green-500/10 text-green-700',
        purple: 'bg-purple-500/10 text-purple-700',
        gray: 'bg-gray-500/10 text-gray-700'
    };

    return colorMap[colorName] || colorMap.gray;
};

// Get border color for hover effect (border-2 style)
const getBorderColorClass = (colorName: string): string => {
    const borderMap: Record<string, string> = {
        red: 'hover:border-red-500/20',
        orange: 'hover:border-orange-500/20',
        blue: 'hover:border-blue-500/20',
        green: 'hover:border-green-500/20',
        purple: 'hover:border-purple-500/20',
        gray: 'hover:border-gray-500/20'
    };

    return borderMap[colorName] || borderMap.gray;
};

function ProfileCardComponent({
    profile,
    currentUser,
    onConnectionChange,
    index = -1
}: ProfileCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const profileUrl = profile.username
        ? ProfileUrlUtils.getProfileUrl(profile.username)
        : `/profile/${profile.id}`;

    // Get role color from ProfileDisplayUtils
    const roleColor = ProfileDisplayUtils.getRoleColor(profile.role);
    const roleColorClass = getColorClasses(roleColor);
    const borderColorClass = getBorderColorClass(roleColor);

    // Check if bio is long enough to need expansion
    const bioNeedsExpansion = profile.bio && profile.bio.length > 80;

    return (
        <Card className={`hover:shadow-md transition-all group border-2 ${borderColorClass}`}>
            <CardContent>
                <div className="space-y-3">
                    {/* Top row - Avatar, Name, and Connection Button */}
                    <div className="flex items-start gap-3">
                        {/* Clickable Avatar */}
                        <Link href={profileUrl} className="flex-shrink-0">
                            <UserAvatar
                                profile={profile}
                                size="lg"
                                imageFetchPriority={index === 0 ? 'high' : 'low'}
                                showOnlineStatus
                                className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                            />
                        </Link>

                        {/* Profile Info - Flexible */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <Link href={profileUrl} className="block">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                        {ProfileDisplayUtils.getDisplayName(profile)}
                                    </h3>
                                    {profile.is_verified && (
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                {profile.username && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5 hover:text-primary transition-colors">
                                        @{profile.username}
                                    </p>
                                )}
                                <Badge
                                    variant="outline"
                                    className={`text-xs ${roleColorClass}`}
                                >
                                    {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                                </Badge>
                            </Link>
                        </div>

                        {/* Connection Button - Fixed width */}
                        <div className="flex-shrink-0 self-start">
                            <ConnectionButton
                                targetUser={profile}
                                currentUser={currentUser}
                                size="sm"
                                showText={true}
                                showIcon={true}
                                onConnectionChange={onConnectionChange}
                            />
                        </div>
                    </div>
                    {/* Bio Section - Full width below, max 3 lines */}
                    {profile.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                            {profile.bio}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export const ProfileCard = React.memo(ProfileCardComponent);
