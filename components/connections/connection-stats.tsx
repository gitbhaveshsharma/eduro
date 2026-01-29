'use client';

/**
 * Connection Stats Component
 * 
 * Displays connection statistics (mutual connections, sent requests, received requests).
 * LinkedIn-style connection system - no follower/following concept.
 */

import { Users, Send, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowDisplayUtils } from '@/lib/follow';
import type { FollowStats } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionStatsProps {
    stats: FollowStats | null;
    receivedRequestsCount?: number;
    sentRequestsCount?: number;
    isLoading?: boolean;
    className?: string;
    onStatClick?: (stat: 'connections' | 'received' | 'sent') => void;
}

/**
 * Stat item component
 */
interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    colorClass?: string;
    isHighlighted?: boolean;
    onClick?: () => void;
}

function StatItem({
    icon,
    label,
    value,
    subValue,
    colorClass = 'text-muted-foreground',
    isHighlighted = false,
    onClick,
}: StatItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-colors',
                isHighlighted && 'bg-primary/5',
                onClick && 'cursor-pointer hover:bg-accent'
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0',
                    colorClass.includes('blue') && 'bg-blue-100 dark:bg-blue-900/30',
                    colorClass.includes('green') && 'bg-green-100 dark:bg-green-900/30',
                    colorClass.includes('purple') && 'bg-purple-100 dark:bg-purple-900/30',
                    !colorClass.includes('blue') &&
                    !colorClass.includes('green') &&
                    !colorClass.includes('purple') &&
                    'bg-muted'
                )}
            >
                <span className={cn('text-sm', colorClass)}>{icon}</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-muted-foreground font-medium truncate">{label}</span>
                <span className="text-base sm:text-lg font-semibold text-foreground">{value}</span>
                {subValue && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">{subValue}</span>
                )}
            </div>
        </div>
    );
}

export function ConnectionStats({
    stats,
    receivedRequestsCount = 0,
    sentRequestsCount = 0,
    isLoading = false,
    className,
    onStatClick,
}: ConnectionStatsProps) {
    if (isLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-5 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="text-center">
                    <p className="text-muted-foreground">No connection stats available</p>
                </CardContent>
            </Card>
        );
    }

    // Calculate mutual connections (users where both are connected)
    const mutualConnections = stats.mutual_follows || 0;

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent>
                {/* Stats Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <StatItem
                        icon={<Users className="h-4 w-4" />}
                        label="Connections"
                        value={FollowDisplayUtils.formatFollowCount(mutualConnections)}
                        subValue="mutual connections"
                        colorClass="text-blue-600"
                        onClick={() => onStatClick?.('connections')}
                    />
                    <StatItem
                        icon={<Inbox className="h-4 w-4" />}
                        label="Received"
                        value={receivedRequestsCount}
                        subValue="requests received"
                        colorClass="text-green-600"
                        onClick={() => onStatClick?.('received')}
                    />
                    <StatItem
                        icon={<Send className="h-4 w-4" />}
                        label="Sent"
                        value={sentRequestsCount}
                        subValue="requests sent"
                        colorClass="text-purple-600"
                        onClick={() => onStatClick?.('sent')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
