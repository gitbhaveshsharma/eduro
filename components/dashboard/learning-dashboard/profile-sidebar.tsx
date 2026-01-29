/**
 * Profile Sidebar Component
 * Right sidebar with user profile, stats, activity, and content breakdown
 * Mobile-friendly with swipe gestures and smooth transitions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Settings, Award, FileCheck, Eye, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserAvatar } from '@/components/avatar';
import type { Profile } from '@/lib/schema/profile.types';
import type { UserStats, ContentBreakdown } from './types';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ProgressActivity } from './progress-activity';
import { CalendarActivity } from './calendar-activity';
import { useFollowStore, useFollowStats } from '@/lib/follow';

// Lazy-load DashboardHeaderAvatar
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

const getProfileUrl = (username: string): string => {
    return `/profile/${username}`;
};

interface ProfileSidebarProps {
    profile: Profile | null;
    publicProfile?: any;
    stats: UserStats;
    activityHours: number;
    calendarActivities?: { date: string; count: number }[];
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
    calendarActivities = [],
    contentBreakdown,
    dashboardStats,
    onSettingsClick,
    onViewAllContent,
    onViewAllLearning,
}: ProfileSidebarProps) {
    const displayName = profile?.full_name || 'User';
    const roleInfo = profile ? getRoleDisplay(profile.role || 'S') : null;
    const publicProfileUrl = profile?.username ? getProfileUrl(profile.username) : null;

    // Get connection stats from follow store
    const followStats = useFollowStats();
    const loadStats = useFollowStore(state => state.loadStats);

    // Load connection stats on mount
    useEffect(() => {
        if (profile?.id) {
            loadStats(profile.id, false);
        }
    }, [profile?.id, loadStats]);

    // Use mutual_follows for connections count (LinkedIn-style)
    const connectionsCount = followStats?.mutual_follows ?? 0;

    // State for student view switching
    const [studentView, setStudentView] = useState<'progress' | 'calendar'>('progress');
    const [isHovering, setIsHovering] = useState(false);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for previous

    // Determine which activity components to show based on role
    const isTeacherOrCoach = profile?.role === 'T' || profile?.role === 'C';
    const isStudent = profile?.role === 'S';

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

    const handlePreviousView = () => {
        if (studentView === 'calendar') {
            setDirection(-1);
            setStudentView('progress');
        }
    };

    const handleNextView = () => {
        if (studentView === 'progress') {
            setDirection(1);
            setStudentView('calendar');
        }
    };

    // Swipe gesture handler
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;

        if (info.offset.x > swipeThreshold) {
            // Swiped right - go to previous
            handlePreviousView();
        } else if (info.offset.x < -swipeThreshold) {
            // Swiped left - go to next
            handleNextView();
        }
    };

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
        }),
    };

    return (
        <div className="space-y-4">
            {/* Profile Card */}
            <Card className="border border-border/50 shadow-sm rounded-2xl dark:border-border/20 overflow-hidden">
                <CardContent>
                    {/* Header with settings + public profile */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-6" />
                        <div className="flex items-center gap-2">
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
                    {/* Avatar with brand color ring */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            {/* Outer brand primary (Deep Blue) ring effect */}
                            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[oklch(0.421_0.180_264.376)] via-[oklch(0.521_0.180_264.376)] to-[oklch(0.621_0.180_264.376)] opacity-40 dark:opacity-20" />

                            {/* Inner brand secondary (Sky Blue) ring effect */}
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[oklch(0.621_0.180_264.376)] to-[oklch(0.721_0.180_264.376)] opacity-60 dark:opacity-30" />

                            {profile ? (
                                <div className="relative">
                                    <UserAvatar
                                        profile={profile}
                                        size="lg"
                                        className="w-24 h-24 border-4 border-white dark:border-gray-900 rounded-full ring-4 ring-primary/10"
                                    />
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
                        <Link href="/connections" className="block">
                            <div className="bg-secondary/20 rounded-xl p-4 dark:bg-secondary/30 hover:bg-secondary/30 dark:hover:bg-secondary/40 transition-colors cursor-pointer">
                                <StatItem
                                    icon={<Users className="w-4 h-4 text-red-500" />}
                                    value={connectionsCount}
                                    label="Connections"
                                />
                            </div>
                        </Link>
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

                    {/* Activity Section - Role-based Display */}
                    <div className="space-y-4">
                        {/* Teachers and Coaches - Only Calendar Activity */}
                        {isTeacherOrCoach && (
                            <div className="overflow-hidden">
                                <CalendarActivity activities={calendarActivities} />
                            </div>
                        )}

                        {/* Students - Swipeable Views with Navigation */}
                        {isStudent && (
                            <div
                                className="relative overflow-hidden"
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                {/* Navigation Arrows - Show on Hover */}
                                <AnimatePresence>
                                    {isHovering && (
                                        <>
                                            {studentView === 'calendar' && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-1/2 -translate-y-1/2 left-2 z-20"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handlePreviousView}
                                                        className="h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background hover:scale-110 transition-all"
                                                        aria-label="Previous view"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                            {studentView === 'progress' && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-1/2 -translate-y-1/2 right-2 z-20"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleNextView}
                                                        className="h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background hover:scale-110 transition-all"
                                                        aria-label="Next view"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Swipeable View Content - Contained */}
                                <div className="relative overflow-hidden">
                                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                        <motion.div
                                            key={studentView}
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: {
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 40,
                                                    mass: 0.8
                                                },
                                                opacity: { duration: 0.15 },
                                            }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.1}
                                            onDragEnd={handleDragEnd}
                                            className="w-full cursor-grab active:cursor-grabbing touch-pan-y"
                                            style={{ touchAction: 'pan-y' }}
                                        >
                                            {studentView === 'progress' && (
                                                <ProgressActivity
                                                    hours={activityHours}
                                                    contentBreakdown={contentBreakdown}
                                                />
                                            )}
                                            {studentView === 'calendar' && (
                                                <CalendarActivity activities={calendarActivities} />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* View Indicators */}
                                <div className="flex justify-center gap-2 mt-4">
                                    <motion.button
                                        onClick={() => {
                                            if (studentView !== 'progress') {
                                                setDirection(-1);
                                                setStudentView('progress');
                                            }
                                        }}
                                        className={`h-2 rounded-full transition-all ${studentView === 'progress'
                                            ? 'bg-primary w-6'
                                            : 'bg-muted-foreground/30 w-2'
                                            }`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label="Progress view"
                                    />
                                    <motion.button
                                        onClick={() => {
                                            if (studentView !== 'calendar') {
                                                setDirection(1);
                                                setStudentView('calendar');
                                            }
                                        }}
                                        className={`h-2 rounded-full transition-all ${studentView === 'calendar'
                                            ? 'bg-primary w-6'
                                            : 'bg-muted-foreground/30 w-2'
                                            }`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label="Calendar view"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
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
