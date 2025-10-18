'use client';

/**
 * Connection Button Component
 * 
 * A reusable button for making/removing connections with users.
 * Uses "connection" terminology instead of "follow".
 * Handles loading states and provides visual feedback.
 */

import { useState } from 'react';
import { UserPlus, UserMinus, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    useFollowStore,
    useIsFollowing,
    useFollowLoading,
    useUnfollowLoading,
    useHasPendingRequest,
    useIsBlocked,
    FollowPermissionUtils
} from '@/lib/follow';
import type { FollowerProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionButtonProps {
    targetUser: FollowerProfile;
    currentUser?: FollowerProfile;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
    showText?: boolean;
    className?: string;
    onConnectionChange?: (isConnected: boolean) => void;
}

export function ConnectionButton({
    targetUser,
    currentUser,
    variant = 'default',
    size = 'default',
    showIcon = true,
    showText = true,
    className,
    onConnectionChange,
}: ConnectionButtonProps) {
    const { followUser, unfollowUser, sendFollowRequest } = useFollowStore();
    const isConnected = useIsFollowing(targetUser.id);
    const isConnecting = useFollowLoading(targetUser.id);
    const isDisconnecting = useUnfollowLoading(targetUser.id);
    const hasPendingRequest = useHasPendingRequest(targetUser.id);
    const isBlocked = useIsBlocked(targetUser.id);

    const [localLoading, setLocalLoading] = useState(false);

    const isLoading = isConnecting || isDisconnecting || localLoading;

    // Check permissions
    const canConnect = currentUser
        ? FollowPermissionUtils.canFollow(currentUser.role, targetUser.role, {
            is_following: isConnected,
            is_followed_by: false,
            is_mutual: false,
            is_blocked: isBlocked,
            is_blocking: false,
            has_pending_request: hasPendingRequest,
            has_received_request: false,
        })
        : true;

    const handleConnectionAction = async () => {
        if (isLoading) return;

        setLocalLoading(true);

        try {
            if (isConnected) {
                // Remove connection
                const success = await unfollowUser({ following_id: targetUser.id });
                if (success) {
                    onConnectionChange?.(false);
                }
            } else {
                // Make connection (auto-accepts and creates mutual connection)
                const success = await followUser({
                    following_id: targetUser.id,
                    notification_enabled: true,
                });
                if (success) {
                    onConnectionChange?.(true);
                }
            }
        } catch (error) {
            console.error('Connection action failed:', error);
        } finally {
            setLocalLoading(false);
        }
    };

    // Don't show button for blocked users
    if (isBlocked) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size={size}
                            disabled
                            className={cn('gap-2', className)}
                        >
                            {showIcon && <Ban className="h-4 w-4" />}
                            {showText && 'Blocked'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>You have blocked this user</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Pending request state
    if (hasPendingRequest && !isConnected) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size={size}
                            disabled
                            className={cn('gap-2', className)}
                        >
                            {showIcon && <Clock className="h-4 w-4" />}
                            {showText && 'Pending'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Connection request sent</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Main button
    return (
        <Button
            variant={isConnected ? 'outline' : variant}
            size={size}
            onClick={handleConnectionAction}
            disabled={!canConnect || isLoading}
            className={cn('gap-2', className)}
        >
            {isLoading ? (
                <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {showText && (isConnected ? 'Disconnecting...' : 'Connecting...')}
                </>
            ) : (
                <>
                    {showIcon && (
                        isConnected ? (
                            <UserMinus className="h-4 w-4" />
                        ) : (
                            <UserPlus className="h-4 w-4" />
                        )
                    )}
                    {showText && (isConnected ? 'Connected' : 'Connect')}
                </>
            )}
        </Button>
    );
}
