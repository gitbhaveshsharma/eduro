'use client';

/**
 * Public Profile Stats Component
 * 
 * Displays reputation score, engagement metrics in a modern card layout.
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PublicProfile } from '@/lib/schema/profile.types';
import {
    Award,
    Star,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicProfileStatsProps {
    profile: PublicProfile;
    className?: string;
}

function getReputationLevel(score: number): { label: string; color: string; bgColor: string } {
    if (score >= 1000) return { label: 'Expert', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
    if (score >= 500) return { label: 'Advanced', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' };
    if (score >= 100) return { label: 'Intermediate', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (score >= 50) return { label: 'Beginner', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    return { label: 'Newcomer', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' };
}

function getNextLevelThreshold(score: number): number {
    if (score >= 1000) return 1000;
    if (score >= 500) return 1000;
    if (score >= 100) return 500;
    if (score >= 50) return 100;
    return 50;
}

export const PublicProfileStats = memo(function PublicProfileStats({
    profile,
    className,
}: PublicProfileStatsProps) {
    const reputationScore = profile.reputation_score || 0;
    const reputationLevel = getReputationLevel(reputationScore);
    const nextThreshold = getNextLevelThreshold(reputationScore);
    const progress = Math.min((reputationScore / nextThreshold) * 100, 100);

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Trophy className="h-5 w-5 text-primary" />
                    Reputation & Stats
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Reputation Score */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Reputation Score</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', reputationLevel.bgColor, reputationLevel.color)}>
                            {reputationLevel.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={cn(
                            'flex items-center justify-center w-14 h-14 rounded-full',
                            reputationLevel.bgColor
                        )}>
                            <Star className={cn('h-7 w-7', reputationLevel.color)} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-foreground">{reputationScore}</span>
                                <span className="text-sm text-muted-foreground">points</span>
                            </div>
                            {reputationScore < 1000 && (
                                <div className="mt-2 space-y-1">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        {nextThreshold - reputationScore} points to next level
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatItem
                        icon={TrendingUp}
                        label="Activity"
                        value={profile.is_online ? 'Active' : 'Offline'}
                        color={profile.is_online ? 'text-green-600' : 'text-gray-400'}
                    />
                    <StatItem
                        icon={Award}
                        label="Status"
                        value={profile.is_verified ? 'Verified' : 'Unverified'}
                        color={profile.is_verified ? 'text-blue-600' : 'text-gray-400'}
                    />
                </div>
            </CardContent>
        </Card>
    );
});

interface StatItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color?: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Icon className={cn('h-5 w-5', color || 'text-muted-foreground')} />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}
