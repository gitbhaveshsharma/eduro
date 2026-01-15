'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Calendar, ClipboardList } from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import { useTeacherContext } from './layout';
import type { TeacherAssignment } from '@/lib/schema/coaching.types';
// import { UploadDiagnostics } from './_components/assignments/UploadDiagnostics';
// import AdvancedUploadDiagnostics from './_components/assignments/AdvancedUploadDiagnostics';

import { DashboardHeader } from './_components/dashboard/teacher-dashboard-header';
import { StatsCard } from './_components/dashboard/stats-card';
import { QuickActionCard } from './_components/dashboard/quick-action-card';
import { AssignmentsList } from './_components/dashboard/assignments-list';
import { CenterInfo } from './_components/dashboard/center-info';

export default function TeacherDashboardPage() {
    const router = useRouter();
    const { coachingCenter, centerId } = useTeacherContext();

    const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAssignments() {
            if (!coachingCenter) return;
            setLoading(true);
            try {
                const res = await CoachingAPI.getTeacherAssignments();
                if (res.success && res.data) {
                    setAssignments(res.data);
                } else {
                    setError(res.error || 'Failed to load assignments');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unexpected error');
            } finally {
                setLoading(false);
            }
        }
        loadAssignments();
    }, [coachingCenter]);

    if (!coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Coaching center not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <DashboardHeader coachingCenter={coachingCenter} />

            {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatsCard
                    title="My Classes"
                    value={4}
                    icon={BookOpen}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <StatsCard
                    title="Active Assignments"
                    value={assignments.length}
                    icon={ClipboardList}
                    iconColor="text-green-600"
                    bgColor="bg-green-100"
                />
                <StatsCard
                    title="Total Students"
                    value={156}
                    icon={Users}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <StatsCard
                    title="Classes Today"
                    value={3}
                    icon={Calendar}
                    iconColor="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Quick Actions - 2 columns on mobile, 3 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    title="Attendance"
                    description="Mark attendance and view records"
                    icon={Calendar}
                    iconColor="text-green-600"
                    buttonText="Take Attendance"
                    buttonVariant="secondary"
                    onClick={() => router.push(`/lms/teacher/${centerId}/attendance`)}
                />
            </div>

            {/* Assignments */}
            <AssignmentsList
                assignments={assignments}
                onViewAll={() => router.push(`/lms/teacher/${centerId}/assignments`)}
            />

            {/* Center Info */}
            <CenterInfo coachingCenter={coachingCenter} />
            {/* <UploadDiagnostics />
            // <AdvancedUploadDiagnostics /> */}

        </div>
    );
}
