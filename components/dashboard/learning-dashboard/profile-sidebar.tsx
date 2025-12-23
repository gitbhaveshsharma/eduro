/**
 * Profile Sidebar Component
 * Right sidebar with user profile, stats, activity, and content breakdown
 */

'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Settings, ChevronDown, Award, FileCheck, BookOpen, GraduationCap, Eye,
    Users
} from 'lucide-react';
import { DonutChart } from './donut-chart';
import { UserAvatar } from '@/components/avatar';
import type { Profile } from '@/lib/schema/profile.types';
import type { UserStats, ContentBreakdown } from './types';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Lazy-load DashboardHeaderAvatar (same as DashboardHeader)
const ProfileSidebarAvatarManager = dynamic(
    () => import('../dashboard-header-avatar').then(mod => ({ default: mod.DashboardHeaderAvatar })),
    {
        ssr: false,
        loading: () => (
            <div className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse ring-4 ring-primary/10">
                <span className="text-[10px] text-muted-foreground">Loading...</span>
            </div>
        ),
    }
);

const getRoleDisplay = (role: string) => {
    switch (role) {
        case 'T': return { label: 'Teacher', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
        case 'C': return { label: 'Coach', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
        case 'S': return { label: 'Student', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
        default: return { label: 'User', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
    }
};

// Helper function for public profile URL
const getProfileUrl = (username: string): string => {
    return `/profile/${username}`;
};

interface ProfileSidebarProps {
    profile: Profile | null;
    // Optional public profile data (passed from parent when available)
    publicProfile?: any;
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
    const roleInfo = profile ? getRoleDisplay(profile.role || 'S') : null;
    const publicProfileUrl = profile?.username
        ? getProfileUrl(profile.username)
        : null;

    const handlePublicProfileClick = () => {
        if (publicProfileUrl) {
            toast.info('Opening public profile...');
        }
    };

    const handleSettingsClickInternal = () => {
        if (onSettingsClick) {
            onSettingsClick();
            toast.info('Opening settings...');
        }
    };

    const handleViewAllContent = () => {
        if (onViewAllContent) {
            onViewAllContent();
            toast.info('Viewing all content...');
        }
    };

    const handleViewAllLearning = () => {
        if (onViewAllLearning) {
            onViewAllLearning();
            toast.info('Viewing all learning...');
        }
    };

    return (
        <div className="space-y-4">
            {/* Profile Card */}
            <Card className="border border-border/50 shadow-sm rounded-2xl dark:border-border/20">
                <CardContent >
                    {/* Header with settings + public profile */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-6" /> {/* Spacer for centering */}
                        <div className="flex items-center gap-2">
                            {/* Public Profile Link - Fixed Link component */}
                            {publicProfileUrl && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handlePublicProfileClick}
                                                className="h-8 w-8 p-0 rounded-full hover:bg-secondary/10 dark:hover:bg-secondary/20"
                                                aria-label="View public profile"
                                                asChild
                                            >
                                                <Link href={publicProfileUrl}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="text-xs">
                                            <p>View your public profile</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {/* Settings Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSettingsClickInternal}
                                className="h-8 w-8 p-0 rounded-full hover:bg-secondary/10 dark:hover:bg-secondary/20"
                                aria-label="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Avatar with mint/teal ring - SSR + Client pattern */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            {/* Outer mint/teal ring effect */}
                            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#A7F3D0] via-[#6EE7B7] to-[#34D399] opacity-40 dark:opacity-20" />
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] opacity-60 dark:opacity-30" />

                            {profile ? (
                                <div className="relative">
                                    {/* SSR-visible static avatar (renders instantly) */}
                                    <UserAvatar
                                        profile={profile}
                                        size="lg"
                                        showOnlineStatus
                                        className="w-24 h-24 border-4 border-white dark:border-gray-900 rounded-full ring-4 ring-primary/10"
                                    />
                                    {/* Dynamically injected Avatar Manager */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                        <ProfileSidebarAvatarManager profile={profile} />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-24 h-24 border-4 border-white dark:border-gray-900 rounded-full bg-primary/10 flex items-center justify-center shadow-md ring-4 ring-primary/10">
                                    <span className="text-2xl font-semibold text-primary">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name + Role */}
                    <div className="text-center mb-6">
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                            {displayName}
                        </h3>
                        {roleInfo && (
                            <Badge className={`${roleInfo.color} text-xs px-2 py-0.5`}>
                                {roleInfo.label}
                            </Badge>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-secondary/20 rounded-xl p-4 dark:bg-bg-secondary/30">
                            <StatItem
                                icon={<Users className="w-4 h-4 text-red-500" />}
                                value={stats.connections}
                                label="Connections"
                            />
                        </div>
                        <div className="bg-secondary/20 rounded-xl p-4 dark:bg-secondary/30">
                            <StatItem
                                icon={<Award className="w-4 h-4 text-amber-500" />}
                                value={stats.badges}
                                label="Badges"
                            />
                        </div>
                        <div className="bg-secondary/20 rounded-xl p-4 dark:bg-secondary/30">
                            <StatItem
                                icon={<FileCheck className="w-4 h-4 text-green-500" />}
                                value={stats.certificates}
                                label="Certificates"
                            />
                        </div>
                    </div>

                    {/* Activity Section */}
                    <div className="bg-secondary/20 rounded-xl p-4 mb-6 dark:bg-bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Activity
                            </span>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Year
                                <ChevronDown className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground">
                                {activityHours}h   <Badge
                                    variant="success"
                                    className="p-1"
                                >
                                    🎉 Great result!
                                </Badge>
                            </span>
                        </div>

                    </div>

                    {/* Content Breakdown Chart */}
                    <div className="mb-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-sm font-medium text-foreground">Content Progress</span>
                        </div>
                        <div className="flex justify-center">
                            <DonutChart data={contentBreakdown} size={160} strokeWidth={30} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm bg-card dark:bg-card/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {dashboardStats.content}
                        </p>
                        <p className="text-xs text-muted-foreground">Content</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleViewAllContent}
                            className="w-full mt-2 text-xs hover:bg-muted dark:hover:bg-muted/50"
                        >
                            View all
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-card dark:bg-card/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {dashboardStats.learning}
                        </p>
                        <p className="text-xs text-muted-foreground">Learning</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleViewAllLearning}
                            className="w-full mt-2 text-xs hover:bg-muted dark:hover:bg-muted/50"
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