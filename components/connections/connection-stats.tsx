'use client';

/**
 * Connection Stats Component
 * 
 * Displays connection statistics (connections, connected, mutual).
 * Can be used in profile pages or connection overview.
 */

import { Users, UserPlus, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FollowDisplayUtils } from '@/lib/follow';
import type { FollowStats } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionStatsProps {
    stats: FollowStats | null;
    isLoading?: boolean;
    className?: string;
    onStatClick?: (stat: 'followers' | 'following' | 'mutual') => void;
}

export function ConnectionStats({
    stats,
    isLoading = false,
    className,
    onStatClick,
}: ConnectionStatsProps) {
    if (isLoading) {
        return (
            <Card className={cn('', className)}>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="text-center space-y-2">
                                <div className="h-8 w-8 mx-auto bg-muted animate-pulse rounded-full" />
                                <div className="h-4 w-12 mx-auto bg-muted animate-pulse rounded" />
                                <div className="h-3 w-16 mx-auto bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return null;
    }

    const statItems = [
        {
            key: 'followers' as const,
            label: 'Connections',
            value: stats.followers,
            icon: Users,
            color: 'text-blue-500',
            description: 'People connected to you',
        },
        {
            key: 'following' as const,
            label: 'Connected',
            value: stats.following,
            icon: UserPlus,
            color: 'text-green-500',
            description: 'People you\'re connected with',
        },
        {
            key: 'mutual' as const,
            label: 'Mutual',
            value: stats.mutual_follows,
            icon: Heart,
            color: 'text-pink-500',
            description: 'Mutual connections',
        },
    ];

    return (
        <Card className={cn('', className)}>
            <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                    {statItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => onStatClick?.(item.key)}
                            className="text-center space-y-2 hover:bg-accent rounded-lg p-3 transition-colors cursor-pointer group"
                        >
                            <div className={cn('flex justify-center', item.color)}>
                                <item.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {FollowDisplayUtils.formatFollowCount(item.value)}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {item.label}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
