'use client';

/**
 * Public Profile Connections Component
 * 
 * Displays follower/following statistics and connection info
 * for a user on their public profile page.
 */

import { memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFollowStore, useFollowStats, useStatsLoading } from '@/lib/follow';
import type { PublicProfile } from '@/lib/schema/profile.types';

interface PublicProfileConnectionsProps {
    profile: PublicProfile;
    currentUserId?: string;
    className?: string;
}

export const PublicProfileConnections = memo(function PublicProfileConnections({
    profile,
    currentUserId,
    className,
}: PublicProfileConnectionsProps) {
    const stats = useFollowStats();
    const isLoading = useStatsLoading();
    const loadStats = useFollowStore(state => state.loadStats);

    useEffect(() => {
        if (profile.id) {
            loadStats(profile.id, true);
        }
    }, [profile.id, loadStats]);

    if (isLoading) {
        return (
            <Card className={cn('', className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="text-center">
                                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                                <Skeleton className="h-4 w-20 mx-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const followers = stats?.followers ?? 0;
    const following = stats?.following ?? 0;
    const mutualFollows = stats?.mutual_follows ?? 0;

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Connections
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    {/* Followers */}
                    <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <UserPlus className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold text-foreground">
                                {formatCount(followers)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Followers
                        </p>
                    </div>

                    {/* Following */}
                    <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold text-foreground">
                                {formatCount(following)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Following
                        </p>
                    </div>

                    {/* Mutual Connections */}
                    <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-2xl font-bold text-foreground">
                                {formatCount(mutualFollows)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Mutual
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}
