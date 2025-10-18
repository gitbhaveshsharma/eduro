'use client';

/**
 * Connection Request Card Component
 * 
 * Displays a connection request with accept/reject actions.
 * Shows requester info and optional message.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Clock, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
                    </Link>                    {/* Request Info */}
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
                                {roleBadge && (
                                    <Badge variant="outline" className="text-xs">
                                        {roleBadge}
                                    </Badge>
                                )}
                            </div>
                        </Link>

                        {user.username && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                                @{user.username}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                            {type === 'received' ? 'Wants to connect' : 'Request sent'} • {timeAgo}
                        </p>

                        {/* Message */}
                        {request.message && (
                            <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md">
                                "{request.message}"
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
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
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
