'use client';

/**
 * Connection Card Component
 * 
 * Displays a user's connection information with avatar, name, bio, and connection button.
 * Reusable component for connection lists and suggestions.
 */

import Link from 'next/link';
import { Users, BadgeCheck } from 'lucide-react';
import { Item, ItemMedia, ItemContent, ItemActions, ItemTitle, ItemDescription } from '@/components/ui/item';
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
        <Item className={cn(className)}>
            {/* Avatar */}
            <ItemMedia variant="image">
                <Link href={`/profile/${user.username || user.id}`}>
                    <UserAvatar
                        profile={user}
                        size="md"
                        showOnlineStatus
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                </Link>
            </ItemMedia>

            {/* User Info */}
            <ItemContent>
                <ItemTitle>
                    <Link
                        href={`/profile/${user.username || user.id}`}
                        className="hover:underline truncate"
                    >
                        {displayName}
                    </Link>
                    {user.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                    {showMutualBadge && isMutual && (
                        <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Mutual
                        </Badge>
                    )}
                    {roleBadge && (
                        <Badge variant="outline" className="text-xs">
                            {roleBadge}
                        </Badge>
                    )}
                </ItemTitle>

                <ItemDescription>
                    {user.username && `@${user.username}`}
                    {showStats && (
                        <>
                            {user.username && ' • '}
                            <strong>{FollowDisplayUtils.formatFollowCount(user.follower_count || 0)}</strong> connections
                            {' • '}
                            <strong>{FollowDisplayUtils.formatFollowCount(user.following_count || 0)}</strong> connected
                        </>
                    )}
                </ItemDescription>
            </ItemContent>

            {/* Connection Button */}
            {showConnectionButton && currentUser?.id !== user.id && (
                <ItemActions>
                    <ConnectionButton
                        targetUser={user}
                        currentUser={currentUser}
                        size="sm"
                        showText={false}
                        showIcon={true}
                        onConnectionChange={onConnectionChange}
                    />
                </ItemActions>
            )}
        </Item>
    );
}
