'use client';

/**
 * Connection Card Component
 * 
 * Displays a user's connection information with avatar, name, bio, and connection button.
 * Reusable component for connection lists and suggestions.
 */

import Link from 'next/link';
import { Users, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { ConnectionButton } from './connection-button';
import { FollowDisplayUtils } from '@/lib/follow';
import type { FollowerProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionCardProps {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
    showConnectionButton?: boolean;
    showStats?: boolean;
    showMutualBadge?: boolean;
    isMutual?: boolean;
    className?: string;
    onConnectionChange?: (isConnected: boolean) => void;
}

export function ConnectionCard({
    user,
    currentUser,
    showConnectionButton = true,
    showStats = true,
    showMutualBadge = false,
    isMutual = false,
    className,
    onConnectionChange,
}: ConnectionCardProps) {
    const displayName = FollowDisplayUtils.getDisplayName(user);
    const initials = FollowDisplayUtils.getInitials(user);
    const roleBadge = FollowDisplayUtils.getRoleBadge(user.role);

    return (
        <Card className={cn('hover:bg-accent/50 transition-colors', className)}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Link
                        href={`/profile/${user.username || user.id}`}
                        className="flex-shrink-0"
                    >
                        <UserAvatar
                            profile={user}
                            size="lg"
                            showOnlineStatus
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    </Link>                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/profile/${user.username || user.id}`}
                                    className="hover:underline"
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-sm truncate">
                                            {displayName}
                                        </h3>
                                        {user.is_verified && (
                                            <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        )}
                                        {showMutualBadge && isMutual && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Users className="h-3 w-3 mr-1" />
                                                Mutual
                                            </Badge>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex items-center gap-2 mt-1">
                                    {user.username && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            @{user.username}
                                        </p>
                                    )}
                                    {roleBadge && (
                                        <Badge variant="outline" className="text-xs">
                                            {roleBadge}
                                        </Badge>
                                    )}
                                </div>

                                {showStats && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span>
                                            <strong className="text-foreground">
                                                {FollowDisplayUtils.formatFollowCount(user.follower_count || 0)}
                                            </strong>{' '}
                                            connections
                                        </span>
                                        <span>•</span>
                                        <span>
                                            <strong className="text-foreground">
                                                {FollowDisplayUtils.formatFollowCount(user.following_count || 0)}
                                            </strong>{' '}
                                            connected
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Connection Button */}
                            {showConnectionButton && currentUser?.id !== user.id && (
                                <ConnectionButton
                                    targetUser={user}
                                    currentUser={currentUser}
                                    size="sm"
                                    showText={false}
                                    showIcon={true}
                                    onConnectionChange={onConnectionChange}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
