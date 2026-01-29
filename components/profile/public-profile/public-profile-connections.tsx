'use client';

/**
 * Public Profile Connections Component
 * 
 * Displays connection statistics for a user on their public profile page.
 * LinkedIn-style connections: only shows mutual connections (no follower/following)
 */

import { memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
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
                    <div className="text-center">
                        <Skeleton className="h-12 w-24 mx-auto mb-2" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Only show mutual connections (LinkedIn-style)
    const mutualConnections = stats?.mutual_follows ?? 0;

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Connections
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Single Stat - Mutual Connections Only */}
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-colors cursor-default">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="h-6 w-6 text-primary" />
                        <span className="text-4xl font-bold text-foreground">
                            {formatCount(mutualConnections)}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                        Mutual Connections
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        People connected with each other
                    </p>
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
