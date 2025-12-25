'use client';

import React from 'react';
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
        red: 'bg-red-500/10 text-red-700  ',
        orange: 'bg-orange-500/10 text-orange-700 ',
        blue: 'bg-blue-500/10 text-blue-700',
        green: 'bg-green-500/10 text-green-700 ',
        purple: 'bg-purple-500/10 text-purple-700',
        gray: 'bg-gray-500/10 text-gray-700 '
    };

    return colorMap[colorName] || colorMap.gray;
};

function ProfileCardComponent({
    profile,
    currentUser,
    onConnectionChange,
    index = -1
}: ProfileCardProps) {
    const profileUrl = profile.username
        ? ProfileUrlUtils.getProfileUrl(profile.username)
        : `/profile/${profile.id}`;

    // Get role color from ProfileDisplayUtils
    const roleColor = ProfileDisplayUtils.getRoleColor(profile.role);
    const roleColorClass = getColorClasses(roleColor);

    return (
        <Card className="hover:shadow-md transition-shadow group">
            <CardContent className="p-4">
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

                    {/* Profile Info - Clickable */}
                    <Link href={profileUrl} className="flex-1 min-w-0 cursor-pointer">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                {ProfileDisplayUtils.getDisplayName(profile)}
                            </h3>
                            {profile.is_verified && (
                                <Badge variant="secondary" className="text-xs">
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {profile.username && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5 hover:text-primary transition-colors">
                                @{profile.username}
                            </p>
                        )}

                        <div className="mt-2">
                            <Badge
                                variant="outline"
                                className={`text-xs ${roleColorClass}`}
                            >
                                {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                            </Badge>
                        </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">


                        {/* Connection Button */}
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
            </CardContent>
        </Card>
    );
}

export const ProfileCard = React.memo(ProfileCardComponent);
