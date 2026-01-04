/**
 * Learning Dashboard Component
 * Modern learning dashboard matching the design mockup
 * Uses brand colors from globals.css
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardGreeting } from './dashboard-greeting';
import { SubjectFilter } from './subject-filter';
import { UpcomingClasses } from './upcoming-class-card';
import { LearningProgressItems } from './learning-progress-item';
import { ProfileSidebar } from './profile-sidebar';
import { ExplorerCards } from './explorer-cards';
import {
    SUBJECTS,
    LEARNING_CONTENT,
    USER_STATS,
    ACTIVITY_HOURS,
    CONTENT_BREAKDOWN,
    DASHBOARD_STATS,
} from './dummy-data';
import type { Profile } from '@/lib/schema/profile.types';
import { useBranchClassesStore, useUpcomingClasses } from '@/lib/branch-system/stores/branch-classes.store';
import { mapUpcomingClassData } from '@/lib/branch-system/utils/branch-classes.utils';
import type { UpcomingClass, SubjectId } from './types';

// Add the getProfileUrl function here
export const getProfileUrl = (username: string): string => {
    return `/profile/${username}`;
};

// Alternatively, you could create a utility object similar to ProfileUrlUtils
export const ProfileUrlUtils = {
    getProfileUrl: (username: string): string => {
        return `/profile/${username}`;
    }
};

interface LearningDashboardProps {
    profile: Profile | null;
    publicProfile?: any;
    className?: string;
}

export function LearningDashboard({
    profile,
    publicProfile,
    className
}: LearningDashboardProps) {
    const [selectedSubject, setSelectedSubject] = useState('all');
    const router = useRouter();

    // Get user role from profile - adjust based on your profile schema
    const userRole = profile?.role || 'S'; // Default to Student
    const isStudent = userRole === 'S';

    // Fetch upcoming classes for students
    const fetchUpcomingClasses = useBranchClassesStore((state) => state.fetchUpcomingClasses);
    const upcomingClassesData = useUpcomingClasses(profile?.id || null);
    const loading = useBranchClassesStore((state) => state.loading.upcomingClasses);

    // Fetch upcoming classes when component mounts (only for students)
    useEffect(() => {
        if (isStudent && profile?.id) {
            fetchUpcomingClasses(profile.id);
        }
    }, [isStudent, profile?.id, fetchUpcomingClasses]);

    // Map RPC data to UI format
    const upcomingClasses: UpcomingClass[] = upcomingClassesData
        ? upcomingClassesData.map(classData => {
            const mapped = mapUpcomingClassData(classData);
            return {
                ...mapped,
                subject: {
                    ...mapped.subject,
                    id: mapped.subject.id as SubjectId
                }
            };
        })
        : [];

    // Filter content based on selected subject
    const filteredClasses =
        selectedSubject === 'all'
            ? upcomingClasses
            : upcomingClasses.filter(
                (c) => c.subject.id === selectedSubject
            );

    const filteredContent =
        selectedSubject === 'all'
            ? LEARNING_CONTENT
            : LEARNING_CONTENT.filter(
                (c) => c.subject.id === selectedSubject
            );

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
    };

    const handleStartClass = (classId: string) => {
        console.log('Starting class:', classId);
        // TODO: Implement class start logic - navigate to class room
        // router.push(`/classroom/${classId}`);
    };

    const handleContentAction = (contentId: string) => {
        console.log('Content action:', contentId);
        // TODO: Implement content action logic
    };

    const handleSettingsClick = () => {
        return router.push('/settings');
    }

    const handleAskAI = () => {
        console.log('Ask AI clicked');
        // TODO: Implement AI assistant
    };

    // Add this function if you want to get the public profile URL
    const getPublicProfileUrl = (): string | null => {
        if (profile?.username) {
            return getProfileUrl(profile.username);
        }
        return null;
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 relative z-0'>
            <div className={`flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto relative z-10 ${className}`}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1 space-y-6 min-w-0 relative z-10">
                    {/* Greeting */}
                    <DashboardGreeting profile={profile} onAskAI={handleAskAI} />

                    {/* Subject Filter Pills */}
                    <SubjectFilter
                        subjects={SUBJECTS}
                        onSubjectChange={handleSubjectChange}
                        defaultSubject={selectedSubject}
                    />

                    {/* Explorer Cards - New Section */}
                    <ExplorerCards userRole={userRole} />

                    {/* Upcoming Classes - Only for Students */}
                    {isStudent && (
                        <>
                            {loading && filteredClasses.length === 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Your Upcoming Class
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="h-56 bg-muted animate-pulse rounded-xl"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : filteredClasses.length > 0 ? (
                                <UpcomingClasses
                                    classes={filteredClasses}
                                    onStartClass={handleStartClass}
                                    onViewAll={() => console.log('View all classes')}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Your Upcoming Class
                                    </h2>
                                    <div className="text-center py-12 bg-card rounded-xl border">
                                        <p className="text-muted-foreground">
                                            No upcoming classes found. Enroll in a class to get started!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Learning Progress */}
                    <LearningProgressItems
                        contents={filteredContent}
                        onContentAction={handleContentAction}
                        onViewAll={() => console.log('View all content')}
                    />
                </div>

                {/* Right Sidebar - Sticky */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    <div className="lg:sticky lg:top-6 space-y-6 relative z-10">
                        <ProfileSidebar
                            profile={profile}
                            publicProfile={publicProfile}
                            stats={USER_STATS}
                            activityHours={ACTIVITY_HOURS}
                            contentBreakdown={CONTENT_BREAKDOWN}
                            dashboardStats={DASHBOARD_STATS}
                            onSettingsClick={handleSettingsClick}
                            onViewAllContent={() => console.log('View all content')}
                            onViewAllLearning={() => console.log('View all learning')}
                        />
                    </div>
                </div>
            </div>

            {/* Modal/Overlay Container - Higher z-index for modals */}
            <div className="fixed inset-0 z-50 pointer-events-none">
                {/* This container ensures modals can appear above everything */}
            </div>
        </div>
    );
}

// Skeleton loading state - also updated for consistency
export function LearningDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background relative z-0">
            <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto relative z-10">
                {/* Main Content Skeleton */}
                <div className="flex-1 space-y-6 min-w-0 relative z-10">
                    {/* Greeting skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="h-9 w-64 bg-muted animate-pulse rounded-lg" />
                        <div className="h-10 w-28 bg-muted animate-pulse rounded-full" />
                    </div>

                    {/* Filter skeleton */}
                    <div className="flex gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-11 w-32 bg-muted animate-pulse rounded-full"
                            />
                        ))}
                    </div>

                    {/* Explorer Cards skeleton */}
                    <div className="space-y-4">
                        <div className="h-6 w-64 bg-muted animate-pulse rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-56 bg-muted animate-pulse rounded-xl"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Classes skeleton - conditional */}
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-56 bg-muted animate-pulse rounded-xl"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Progress skeleton */}
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <div className="h-6 w-64 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="bg-card rounded-xl border p-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 bg-muted animate-pulse rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton - Also sticky */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    <div className="lg:sticky lg:top-6 space-y-4 relative z-10">
                        <div className="h-[500px] bg-muted animate-pulse rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-32 bg-muted animate-pulse rounded-xl" />
                            <div className="h-32 bg-muted animate-pulse rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}