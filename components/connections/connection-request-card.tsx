'use client';

/**
 * Connection Request Card Component
 * 
 * Displays a connection request with accept/reject actions.
 * Shows requester info and optional message.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Clock, BadgeCheck, Loader2 } from 'lucide-react';
import { Item, ItemMedia, ItemContent, ItemActions, ItemTitle, ItemDescription } from '@/components/ui/item';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { useFollowStore, FollowDisplayUtils } from '@/lib/follow';
import type { FollowRequestWithProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionRequestCardProps {
    request: FollowRequestWithProfile;
    type?: 'received' | 'sent';
    className?: string;
    onRequestHandled?: () => void;
}

export function ConnectionRequestCard({
    request,
    type = 'received',
    className,
    onRequestHandled,
}: ConnectionRequestCardProps) {
    const { respondToFollowRequest, cancelFollowRequest } = useFollowStore();
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const user = type === 'received' ? request.requester_profile : request.target_profile;

    if (!user) return null;

    const displayName = FollowDisplayUtils.getDisplayName(user);
    const initials = FollowDisplayUtils.getInitials(user);
    const roleBadge = FollowDisplayUtils.getRoleBadge(user.role);
    const timeAgo = FollowDisplayUtils.formatFollowTime(request.created_at);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await respondToFollowRequest({
                request_id: request.id,
                status: 'accepted',
            });
            onRequestHandled?.();
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await respondToFollowRequest({
                request_id: request.id,
                status: 'rejected',
            });
            onRequestHandled?.();
        } catch (error) {
            console.error('Failed to reject request:', error);
        } finally {
            setIsRejecting(false);
        }
    };

    const handleCancel = async () => {
        if (!user.id) return;

        setIsCancelling(true);
        try {
            await cancelFollowRequest(user.id);
            onRequestHandled?.();
        } catch (error) {
            console.error('Failed to cancel request:', error);
        } finally {
            setIsCancelling(false);
        }
    };

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

            {/* Request Info */}
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
                    {roleBadge && (
                        <Badge variant="outline" className="text-xs">
                            {roleBadge}
                        </Badge>
                    )}
                </ItemTitle>

                <ItemDescription>
                    {user.username && `@${user.username} • `}
                    {type === 'received' ? 'Wants to connect' : 'Request sent'} • {timeAgo}
                </ItemDescription>

                {/* Message */}
                {request.message && (
                    <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded-lg italic">
                        "{request.message}"
                    </div>
                )}
            </ItemContent>

            {/* Actions */}
            <ItemActions>
                {type === 'received' ? (
                    <>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            disabled={isAccepting || isRejecting}
                            className="gap-2"
                        >
                            {isAccepting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Accept
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReject}
                            disabled={isAccepting || isRejecting}
                            className="gap-2"
                        >
                            {isRejecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <X className="h-4 w-4" />
                                    Reject
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="gap-2"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <X className="h-4 w-4" />
                                Cancel Request
                            </>
                        )}
                    </Button>
                )}
            </ItemActions>
        </Item>
    );
}
