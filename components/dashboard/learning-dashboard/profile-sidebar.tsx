/**
 * Profile Sidebar Component
 * Right sidebar with user profile, stats, activity, and content breakdown
 */

'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, ChevronDown, Trophy, Award, FileCheck, BookOpen, GraduationCap } from 'lucide-react';
import { DonutChart, DonutLegend } from './donut-chart';
import type { Profile } from '@/lib/schema/profile.types';
import type { UserStats, ContentBreakdown, ActivityData } from './types';

interface ProfileSidebarProps {
    profile: Profile | null;
    stats: UserStats;
    activityHours: number;
    contentBreakdown: ContentBreakdown;
    dashboardStats: { content: number; learning: number };
    onSettingsClick?: () => void;
    onViewAllContent?: () => void;
    onViewAllLearning?: () => void;
}

export function ProfileSidebar({
    profile,
    stats,
    activityHours,
    contentBreakdown,
    dashboardStats,
    onSettingsClick,
    onViewAllContent,
    onViewAllLearning,
}: ProfileSidebarProps) {
    const displayName = profile?.full_name || 'User';
    const avatarUrl =
        typeof profile?.avatar_url === 'string'
            ? profile.avatar_url
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'default'}`;

    return (
        <div className="space-y-4 bg-secondary/10 w-full lg:w-80 flex-shrink-0 rounded-2xl ">
            {/* Profile Card */}
            <div className="border border-border/50 shadow-sm rounded-2xl">
                <div className="pt-6 pb-4">
                    {/* Header with settings */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-6" /> {/* Spacer for centering */}
                        <button
                            onClick={onSettingsClick}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                            aria-label="Settings"
                        >
                            <Settings className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Avatar with mint/teal ring - matching design */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            {/* Outer mint/teal ring effect */}
                            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#A7F3D0] via-[#6EE7B7] to-[#34D399] opacity-40" />
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] opacity-60" />
                            <Avatar className="w-24 h-24 border-4 border-white relative shadow-md">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="text-2xl bg-primary/10 font-semibold">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-center font-semibold text-lg text-foreground mb-6">
                        {displayName}
                    </h3>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <StatItem
                            icon={<Trophy className="w-4 h-4 text-red-500" />}
                            value={stats.points}
                            label="Point"
                        />
                        <StatItem
                            icon={<Award className="w-4 h-4 text-amber-500" />}
                            value={stats.badges}
                            label="Badges"
                        />
                        <StatItem
                            icon={<FileCheck className="w-4 h-4 text-green-500" />}
                            value={stats.certificates}
                            label="Certificates"
                        />
                    </div>

                    {/* Activity Section */}
                    <div className="bg-muted/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Activity
                            </span>
                            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Year
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground">
                                {activityHours}h
                            </span>
                        </div>
                        <Badge
                            variant="secondary"
                            className="mt-2 bg-green-100 text-green-700 text-xs"
                        >
                            🎉 Great result!
                        </Badge>
                    </div>

                    {/* Content Breakdown Chart */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-sm font-medium text-foreground">Passed</span>
                        </div>
                        <div className="flex justify-center">
                            <DonutChart data={contentBreakdown} size={160} strokeWidth={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm bg-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {dashboardStats.content}
                        </p>
                        <p className="text-xs text-muted-foreground">Content</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onViewAllContent}
                            className="w-full mt-2 text-xs hover:bg-muted"
                        >
                            View all
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-teal-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {dashboardStats.learning}
                        </p>
                        <p className="text-xs text-muted-foreground">Learning</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onViewAllLearning}
                            className="w-full mt-2 text-xs hover:bg-muted"
                        >
                            View all
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Stat item component
function StatItem({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
}) {
    return (
        <div className="text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    );
}
