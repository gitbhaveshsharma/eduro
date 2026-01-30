/**
 * Coach Dashboard Page - PERFORMANCE OPTIMIZED
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCoachContext } from './layout';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingBranch, CoachingCenterRPCStats } from '@/lib/schema/coaching.types';
import {
    DashboardSkeleton,
    CoachingCenterInfo,
    StatsOverview,
    BranchesSection,
    QuickActions
} from './_components';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeBranches: number;
    totalBranches: number;
    pendingFees: number;
    attendanceRate: number;
    avgRating: number;
    totalReviews: number;
}

export default function CoachDashboardPage() {
    const router = useRouter();
    const { coachingCenter, coachingCenterId, isLoading: contextLoading } = useCoachContext();

    const [branches, setBranches] = useState<CoachingBranch[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchedForCenterRef = useRef<string | null>(null);

    useEffect(() => {
        if (!coachingCenterId || fetchedForCenterRef.current === coachingCenterId) {
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [branchesResult, statsResult] = await Promise.all([
                    CoachingAPI.getBranchesByCenter(coachingCenterId),
                    CoachingAPI.getCenterDetailedStats(coachingCenterId)
                ]);

                if (branchesResult.success && branchesResult.data) {
                    setBranches(branchesResult.data);
                }

                if (statsResult.success && statsResult.data) {
                    const rpcStats = statsResult.data as CoachingCenterRPCStats;
                    setStats({
                        totalStudents: rpcStats.total_students || 0,
                        totalTeachers: rpcStats.total_teachers || 0,
                        totalClasses: rpcStats.total_classes || 0,
                        activeBranches: rpcStats.active_branches || 0,
                        totalBranches: rpcStats.total_branches || 0,
                        pendingFees: rpcStats.pending_fees || 0,
                        attendanceRate: rpcStats.attendance_rate || 0,
                        avgRating: rpcStats.avg_rating || 0,
                        totalReviews: rpcStats.total_reviews || 0,
                    });
                } else {
                    const activeBranches = branchesResult.data?.filter((b: CoachingBranch) => b.is_active).length || 0;
                    setStats({
                        totalStudents: 0,
                        totalTeachers: 0,
                        totalClasses: 0,
                        activeBranches,
                        totalBranches: branchesResult.data?.length || 0,
                        pendingFees: 0,
                        attendanceRate: 0,
                        avgRating: 0,
                        totalReviews: 0,
                    });
                }

                fetchedForCenterRef.current = coachingCenterId;
            } catch (err) {
                console.error('[CoachDashboard] Error fetching dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [coachingCenterId]);

    const handleNavigateToStudents = useCallback(() => {
        router.push('/lms/coach/branch-students');
    }, [router]);

    const handleNavigateToClasses = useCallback(() => {
        router.push('/lms/coach/branch-classes');
    }, [router]);

    const handleNavigateToFees = useCallback(() => {
        router.push('/lms/coach/student-fees');
    }, [router]);

    const handleNavigateToAttendance = useCallback(() => {
        router.push('/lms/coach/student-attendance');
    }, [router]);

    if (contextLoading || (isLoading && !stats)) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!coachingCenter || !stats) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to your coaching center management dashboard
                </p>
            </div>

            <CoachingCenterInfo coachingCenter={coachingCenter} />

            <StatsOverview
                stats={stats}
                onStudentsClick={handleNavigateToStudents}
                onClassesClick={handleNavigateToClasses}
                onFeesClick={handleNavigateToFees}
                onAttendanceClick={handleNavigateToAttendance}
            />

            <BranchesSection branches={branches} />

            <QuickActions
                onManageStudents={handleNavigateToStudents}
                onManageClasses={handleNavigateToClasses}
                onTrackAttendance={handleNavigateToAttendance}
                onCollectFees={handleNavigateToFees}
            />
        </div>
    );
}
