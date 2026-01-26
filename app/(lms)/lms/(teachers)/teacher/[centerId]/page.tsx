'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, ClipboardList, TrendingUp } from 'lucide-react';
import { useTeacherContext } from './layout';
import { useTeacherDashboardStore } from '@/lib/branch-system/stores/teacher-dashboard.store';
import { useAuthStore } from '@/lib/auth-store';

// Dashboard components
import {
    DashboardHeader,
    DashboardStatsCard,
    DashboardSkeleton,
    DashboardError,
    DashboardEmpty,
    TodaySchedule,
    GradingOverview,
    UpcomingDeadlines,
    ClassPerformance,
    AtRiskStudents,
    RecentActivity,
    QuickActionCard,
    CenterInfo,
} from './_components/dashboard';

export default function TeacherDashboardPage() {
    const router = useRouter();
    const { coachingCenter, centerId } = useTeacherContext();
    const user = useAuthStore((state) => state.user);

    // Dashboard store
    const {
        dashboardStats,
        quickStats,
        formattedSchedule,
        formattedDeadlines,
        loading,
        refreshing,
        error,
        fetchDashboardStats,
        refreshDashboardStats,
        clearError,
    } = useTeacherDashboardStore();

    // Fetch dashboard data on mount
    useEffect(() => {
        if (user?.id && coachingCenter) {
            fetchDashboardStats(user.id);
        }
    }, [user?.id, coachingCenter, fetchDashboardStats]);

    // Refresh handler
    const handleRefresh = useCallback(() => {
        refreshDashboardStats();
    }, [refreshDashboardStats]);

    // Navigation handlers
    const handleClassClick = useCallback((classId: string) => {
        router.push(`/lms/teacher/${centerId}/classes/${classId}`);
    }, [router, centerId]);

    const handleAssignmentClick = useCallback((assignmentId: string) => {
        router.push(`/lms/teacher/${centerId}/assignments/${assignmentId}`);
    }, [router, centerId]);

    const handleViewGrading = useCallback(() => {
        router.push(`/lms/teacher/${centerId}/assignments?filter=pending`);
    }, [router, centerId]);

    const handleViewAllDeadlines = useCallback(() => {
        router.push(`/lms/teacher/${centerId}/assignments`);
    }, [router, centerId]);

    // Prepare chart data for stats cards
    const gradingChartData = useMemo(() => {
        if (!dashboardStats?.grading_stats) return [];
        const { pending_count, urgent_count, graded_today } = dashboardStats.grading_stats;
        return [
            { label: 'Pending', value: pending_count, color: 'bg-yellow-500' },
            { label: 'Urgent', value: urgent_count, color: 'bg-red-500' },
            { label: 'Today', value: graded_today, color: 'bg-green-500' },
        ].filter(d => d.value > 0);
    }, [dashboardStats?.grading_stats]);

    const scheduleChartData = useMemo(() => {
        if (!formattedSchedule.length) return [];
        const statusCounts = formattedSchedule.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { label: 'Completed', value: statusCounts['completed'] || 0, color: 'bg-gray-400' },
            { label: 'Ongoing', value: statusCounts['ongoing'] || 0, color: 'bg-green-500' },
            { label: 'Upcoming', value: statusCounts['upcoming'] || 0, color: 'bg-blue-500' },
        ].filter(d => d.value > 0);
    }, [formattedSchedule]);

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
                    if (user?.id) {
                        fetchDashboardStats(user.id, null, true);
                    }
                }}
            />
        );
    }

    // No coaching center
    if (!coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Coaching center not found</p>
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
                isRefreshing={refreshing}
                onRefresh={handleRefresh}
                lastUpdated={dashboardStats ? new Date() : null}
            />

            {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <DashboardStatsCard
                    title="My Classes"
                    value={quickStats.classes.total}
                    subtitle={`${quickStats.classes.today} scheduled today`}
                    icon={BookOpen}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-100"
                    // chartData={scheduleChartData}
                    chartOrientation="vertical"
                    onClick={() => router.push(`/lms/teacher/${centerId}/classes`)}
                />
                <DashboardStatsCard
                    title="Total Students"
                    value={quickStats.students.total}
                    subtitle={quickStats.students.at_risk > 0
                        ? `${quickStats.students.at_risk} at risk`
                        : 'All performing well'
                    }
                    icon={Users}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-100"
                    onClick={() => router.push(`/lms/teacher/${centerId}/students`)}
                />
                <DashboardStatsCard
                    title="Assignments"
                    value={quickStats.assignments.total}
                    subtitle={quickStats.assignments.pending_grading > 0
                        ? `${quickStats.assignments.pending_grading} pending grading`
                        : 'All graded'
                    }
                    icon={ClipboardList}
                    iconColor="text-green-600"
                    bgColor="bg-green-100"
                    chartData={gradingChartData}
                    chartOrientation="vertical"
                    onClick={() => router.push(`/lms/teacher/${centerId}/assignments`)}
                />
                <DashboardStatsCard
                    title="Submissions"
                    value={quickStats.submissions.week}
                    subtitle={`${quickStats.submissions.today} in last 24h`}
                    icon={TrendingUp}
                    iconColor="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Today's Schedule */}
            <TodaySchedule
                schedule={formattedSchedule}
                onClassClick={handleClassClick}
            />

            {/* Grading and Deadlines - 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GradingOverview
                    gradingStats={dashboardStats.grading_stats}
                    onViewGrading={handleViewGrading}
                />
                <UpcomingDeadlines
                    deadlines={formattedDeadlines}
                    onDeadlineClick={handleAssignmentClick}
                    onViewAll={handleViewAllDeadlines}
                />
            </div>

            {/* Class Performance and At-Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <ClassPerformance
                        classStats={dashboardStats.assignments_by_class}
                        onClassClick={handleClassClick}
                    />
                </div>
                <div className="space-y-4">
                    <AtRiskStudents
                        lowAttendance={dashboardStats.at_risk_students.low_attendance_count}
                        failing={dashboardStats.at_risk_students.failing_count}
                    />
                    <RecentActivity
                        recentSubmissions={dashboardStats.recent_activity.recent_submissions}
                        weeklySubmissions={dashboardStats.recent_activity.submissions_last_7days}
                    />
                </div>
            </div>

            {/* Quick Actions - 3 columns on desktop */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                    title="My Classes"
                    description="Manage your classes and course materials"
                    icon={BookOpen}
                    iconColor="text-blue-600"
                    buttonText="View Classes"
                    buttonVariant="default"
                    onClick={() => router.push(`/lms/teacher/${centerId}/classes`)}
                />
                <QuickActionCard
                    title="Students"
                    description="View and manage your students"
                    icon={Users}
                    iconColor="text-purple-600"
                    buttonText="View Students"
                    buttonVariant="outline"
                    onClick={() => router.push(`/lms/teacher/${centerId}/students`)}
                />
                <QuickActionCard
                    title="Assignments"
                    description="Create and grade assignments"
                    icon={ClipboardList}
                    iconColor="text-green-600"
                    buttonText="View Assignments"
                    buttonVariant="secondary"
                    onClick={() => router.push(`/lms/teacher/${centerId}/assignments`)}
                />
            </div> */}

            {/* Center Info */}
            <CenterInfo coachingCenter={coachingCenter} />
        </div>
    );
}
