'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Award, Calendar, Users } from 'lucide-react';
import { useStudentContext } from './layout';
import { useStudentDashboardStore } from '@/lib/branch-system/stores/student-dashboard.store';
import { useAuthStore } from '@/lib/auth-store';

// Dashboard components
import {
    DashboardHeader,
    DashboardStatsCard,
    DashboardSkeleton,
    DashboardError,
    DashboardEmpty,
    TodaySchedule,
    UpcomingAssignments,
    UpcomingQuizzes,
    PerformanceOverview,
    ClassProgress,
    RecentSubmissions,
    RecentNotices,
    OverdueAlerts,
    CenterInfo,
} from './_components/dashboard';

interface StudentCoachingPageProps {
    params: {
        centerId: string;
    };
}

export default function StudentCoachingPage({ params }: StudentCoachingPageProps) {
    const router = useRouter();
    const { coachingCenter, centerId } = useStudentContext();
    const user = useAuthStore((state) => state.user);

    // Dashboard store
    const {
        dashboardStats,
        quickStats,
        formattedSchedule,
        formattedAssignments,
        formattedQuizzes,
        loading,
        refreshing,
        error,
        fetchDashboardStats,
        refreshDashboardStats,
        clearError,
    } = useStudentDashboardStore();

    // Fetch dashboard data on mount - using centerId as branch_id
    useEffect(() => {
        if (user?.id && centerId) {
            // centerId from URL IS the branch_id
            // A student can be enrolled in only one branch per coaching center
            fetchDashboardStats(user.id, centerId);
        }
    }, [user?.id, centerId, fetchDashboardStats]);

    // Refresh handler
    const handleRefresh = useCallback(() => {
        if (user?.id && centerId) {
            fetchDashboardStats(user.id, centerId, true); // Force refresh
        }
    }, [user?.id, centerId, fetchDashboardStats]);

    // Navigation handlers
    const handleClassClick = useCallback((classId: string) => {
        router.push(`/lms/student/${centerId}/classes/${classId}`);
    }, [router, centerId]);

    const handleAssignmentClick = useCallback((assignmentId: string) => {
        router.push(`/lms/student/${centerId}/assignments/${assignmentId}`);
    }, [router, centerId]);

    const handleQuizClick = useCallback((quizId: string) => {
        router.push(`/lms/student/${centerId}/quizzes/${quizId}`);
    }, [router, centerId]);

    // Loading state
    if (loading && !dashboardStats) {
        return <DashboardSkeleton />;
    }

    // Error state
    if (error && !dashboardStats) {
        return (
            <DashboardError
                error={error}
                onRetry={() => {
                    clearError();
                    if (user?.id && centerId) {
                        fetchDashboardStats(user.id, centerId);
                    }
                }}
            />
        );
    }

    // No coaching center
    if (!coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground italic">Coaching center not found...</p>
            </div>
        );
    }

    // Empty state (no data yet)
    if (!dashboardStats || !quickStats) {
        return <DashboardEmpty />;
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header with refresh */}
            <DashboardHeader
                coachingCenter={coachingCenter}
                studentName={user?.user_metadata?.full_name}
                isRefreshing={refreshing}
                onRefresh={handleRefresh}
                lastUpdated={dashboardStats ? new Date() : null}
            />

            {/* Overdue Alerts (if any) */}
            <OverdueAlerts
                overdueItems={dashboardStats.overdue_items}
                onViewAssignments={() => router.push(`/lms/student/${centerId}/assignments?filter=overdue`)}
                onViewQuizzes={() => router.push(`/lms/student/${centerId}/quizzes?filter=expiring`)}
            />

            {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <DashboardStatsCard
                    title="Active Enrollments"
                    value={quickStats.enrollments.active}
                    subtitle={`${quickStats.enrollments.total} total courses`}
                    icon={BookOpen}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-100"
                    onClick={() => router.push(`/lms/student/${centerId}/classes`)}
                />
                <DashboardStatsCard
                    title="Pending Assignments"
                    value={quickStats.assignments.upcoming}
                    subtitle={quickStats.assignments.overdue > 0
                        ? `${quickStats.assignments.overdue} overdue`
                        : 'All on track'
                    }
                    icon={Calendar}
                    iconColor="text-green-600"
                    bgColor="bg-green-100"
                    onClick={() => router.push(`/lms/student/${centerId}/assignments`)}
                />
                <DashboardStatsCard
                    title="Average Score"
                    value={`${quickStats.performance.average_score.toFixed(0)}%`}
                    subtitle="Overall performance"
                    icon={Award}
                    iconColor="text-yellow-600"
                    bgColor="bg-yellow-100"
                />
                <DashboardStatsCard
                    title="Attendance"
                    value={`${quickStats.performance.attendance.toFixed(0)}%`}
                    subtitle="Overall attendance"
                    icon={Users}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-100"
                />
            </div>

            {/* Today's Schedule */}
            <TodaySchedule
                schedule={formattedSchedule}
                onClassClick={handleClassClick}
            />

            {/* Assignments and Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <UpcomingAssignments
                    assignments={formattedAssignments}
                    onAssignmentClick={handleAssignmentClick}
                    onViewAll={() => router.push(`/lms/student/${centerId}/assignments`)}
                />
                <UpcomingQuizzes
                    quizzes={formattedQuizzes}
                    onQuizClick={handleQuizClick}
                    onViewAll={() => router.push(`/lms/student/${centerId}/quizzes`)}
                />
            </div>

            {/* Performance and Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PerformanceOverview
                    performanceSummary={dashboardStats.performance_summary}
                />
                <ClassProgress
                    classProgress={dashboardStats.class_progress}
                    onClassClick={handleClassClick}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RecentSubmissions
                    submissions={dashboardStats.recent_submissions}
                />
                <RecentNotices
                    notices={dashboardStats.recent_notices}
                />
            </div>

            {/* Coaching Center Info Section */}
            <CenterInfo coachingCenter={coachingCenter} />
        </div>
    );
}