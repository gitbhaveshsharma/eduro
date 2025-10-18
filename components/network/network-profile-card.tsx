'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { ConnectionButton } from '../connections/connection-button';
import { ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import type { FollowerProfile } from '@/lib/follow';

interface ProfileCardProps {
    profile: FollowerProfile;
    currentUser?: FollowerProfile;
    onConnectionChange?: () => void;
}

export function ProfileCard({
    profile,
    currentUser,
    onConnectionChange
}: ProfileCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <UserAvatar
                        profile={profile}
                        size="lg"
                        showOnlineStatus
                        className="flex-shrink-0"
                    />

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">
                                {ProfileDisplayUtils.getDisplayName(profile)}
                            </h3>
                            {profile.is_verified && (
                                <Badge variant="secondary" className="text-xs">
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {profile.username && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                @{profile.username}
                            </p>
                        )}

                        <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                                {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                            </Badge>
                        </div>
                    </div>

                    {/* Connection Button */}
                    <div className="flex-shrink-0">
                        <ConnectionButton
                            targetUser={profile}
                            currentUser={currentUser}
                            size="sm"
                            showText={false}
                            showIcon={true}
                            onConnectionChange={onConnectionChange}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
