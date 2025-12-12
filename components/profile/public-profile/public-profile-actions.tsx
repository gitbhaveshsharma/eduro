'use client';

/**
 * Public Profile Actions Component
 * 
 * Action buttons for connecting, messaging, and sharing profiles.
 */

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectionButton } from '@/components/connections/connection-button';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import type { PublicProfile } from '@/lib/schema/profile.types';
import type { FollowerProfile } from '@/lib/schema/follow.types';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import {
    ExternalLink,
    Link as LinkIcon,
    MessageCircle,
    MoreVertical,
    QrCode,
    Share2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ProfileQRCodeDialog } from './public-profile-qr-dialog';

interface PublicProfileActionsProps {
    profile: PublicProfile;
    currentUserId?: string;
    isOwnProfile?: boolean;
    className?: string;
}

function toFollowerProfile(profile: PublicProfile): FollowerProfile {
    return {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : null,
        role: profile.role,
        is_verified: profile.is_verified,
        is_online: profile.is_online,
        follower_count: 0,
        following_count: 0,
        created_at: profile.created_at,
    };
}

export const PublicProfileActions = memo(function PublicProfileActions({
    profile,
    currentUserId,
    isOwnProfile = false,
    className,
}: PublicProfileActionsProps) {
    const [isCopying, setIsCopying] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}${ProfileUrlUtils.getProfileUrl(profile.username || profile.id)}`;
        const displayName = ProfileDisplayUtils.getDisplayName(profile);

        // Try native share first
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${displayName}'s Profile`,
                    text: `Check out ${displayName}'s profile on Tutrsy`,
                    url: profileUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall back to clipboard
            }
        }

        // Fallback to clipboard
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(profileUrl);
            showSuccessToast('Profile link copied to clipboard!');
        } catch (err) {
            showErrorToast('Failed to copy link');
        } finally {
            setIsCopying(false);
        }
    };

    const handleCopyProfileLink = async () => {
        const profileUrl = `${window.location.origin}${ProfileUrlUtils.getProfileUrl(profile.username || profile.id)}`;
        try {
            await navigator.clipboard.writeText(profileUrl);
            showSuccessToast('Profile link copied!');
        } catch (err) {
            showErrorToast('Failed to copy link');
        }
    };

    // Show edit button for own profile
    if (isOwnProfile) {
        return (
            <>
                <Card className={cn('', className)}>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild className="flex-1">
                                <a href="/settings/profiles">
                                    Edit Profile
                                </a>
                            </Button>
                            <Button variant="outline" onClick={handleShare} disabled={isCopying}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Profile
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            This is how others see your profile
                        </p>
                    </CardContent>
                </Card>

                <ProfileQRCodeDialog
                    profile={profile}
                    open={showQRDialog}
                    onOpenChange={setShowQRDialog}
                />
            </>
        );
    }

    const targetProfile = toFollowerProfile(profile);

    return (
        <>
            <Card className={cn('', className)}>
                <CardContent className="p-4">
                    {/* All three buttons in one row */}
                    <div className="flex gap-2">
                        <ConnectionButton
                            targetUser={targetProfile}
                            variant="default"
                            size="default"
                            showIcon={true}
                            showText={true}
                            className="flex-1"
                        />
                        <Button variant="outline" size="default" disabled className="flex-1">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="default" className="px-3">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setShowQRDialog(true)}>
                                    <QrCode className="h-4 w-4 mr-2" />
                                    Get QR Code
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleCopyProfileLink}>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Copy profile link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShare}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Share profile
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            <ProfileQRCodeDialog
                profile={profile}
                open={showQRDialog}
                onOpenChange={setShowQRDialog}
            />
        </>
    );
});
