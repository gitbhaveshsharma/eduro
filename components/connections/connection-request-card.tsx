'use client';

/**
 * Connection Request Card Component
 * 
 * Displays a connection request with accept/reject actions.
 * Shows requester info and optional message.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { ConnectionButton } from '../connections/connection-button';
import { useFollowStore, FollowDisplayUtils } from '@/lib/follow';
import { ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import type { FollowRequestWithProfile, FollowerProfile } from '@/lib/follow';

interface ConnectionRequestCardProps {
    request: FollowRequestWithProfile;
    type?: 'received' | 'sent';
    currentUser?: FollowerProfile;
    className?: string;
    onRequestHandled?: () => void;
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

export function ConnectionRequestCard({
    request,
    type = 'received',
    currentUser,
    className,
    onRequestHandled,
    index = -1
}: ConnectionRequestCardProps) {
    const { respondToFollowRequest } = useFollowStore();
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const user = type === 'received' ? request.requester_profile : request.target_profile;

    if (!user) return null;

    const displayName = FollowDisplayUtils.getDisplayName(user);
    const timeAgo = FollowDisplayUtils.formatFollowTime(request.created_at);

    const profileUrl = user.username
        ? `/profile/${user.username}`
        : `/profile/${user.id}`;

    // Get role color from ProfileDisplayUtils
    const roleColor = ProfileDisplayUtils.getRoleColor(user.role);
    const roleColorClass = getColorClasses(roleColor);
    const borderColorClass = getBorderColorClass(roleColor);

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

    return (
        <Card className={`hover:shadow-md transition-all group border-2 ${borderColorClass} ${className}`}>
            <CardContent>
                <div className="space-y-3">
                    {/* Top row - Avatar, Name, and Action Buttons */}
                    <div className="flex items-start gap-3">
                        {/* Clickable Avatar */}
                        <Link href={profileUrl} className="flex-shrink-0">
                            <UserAvatar
                                profile={user}
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
                                        {displayName}
                                    </h3>
                                    {user.is_verified && (
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                {user.username && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5 hover:text-primary transition-colors">
                                        @{user.username}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${roleColorClass}`}
                                    >
                                        {ProfileDisplayUtils.getRoleDisplayName(user.role)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {type === 'received' ? 'Wants to connect' : 'Request sent'} • {timeAgo}
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Action Buttons - Fixed width */}
                        <div className="flex-shrink-0 self-start flex gap-2">
                            {type === 'received' ? (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleAccept}
                                        disabled={isAccepting || isRejecting}
                                        className="gap-1.5"
                                    >
                                        {isAccepting ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span className="hidden sm:inline">Accepting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Accept</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleReject}
                                        disabled={isAccepting || isRejecting}
                                        className="gap-1.5"
                                    >
                                        {isRejecting ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span className="hidden sm:inline">Rejecting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Reject</span>
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <ConnectionButton
                                    targetUser={user}
                                    currentUser={currentUser}
                                    size="sm"
                                    showText={true}
                                    showIcon={true}
                                    onConnectionChange={onRequestHandled}
                                />
                            )}
                        </div>
                    </div>

                    {/* Message Section - Full width below */}
                    {request.message && (
                        <div className="text-xs text-muted-foreground p-2.5 bg-muted/50 rounded-lg italic border border-muted">
                            "{request.message}"
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}