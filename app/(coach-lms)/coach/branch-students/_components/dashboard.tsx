/**
 * Branch Students Dashboard Component
 * 
 * Displays comprehensive statistics and analytics for branch students
 * Features: Stat cards, recent enrollments, students needing attention
 */

'use client';

import { useEffect } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import {
    ENROLLMENT_STATUS_OPTIONS,
    PAYMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/branch-students.types';
import {
    formatCurrency,
    formatDate,
    formatEnrollmentStatus,
    formatPaymentStatus,
} from '@/lib/branch-system/utils/branch-students.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    UserCheck,
    Clock,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Calendar,
    GraduationCap,
} from 'lucide-react';

/**
 * Stat Card Component
 */
interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Recent Enrollments List Component
 */
function RecentEnrollmentsList() {
    const { branchStudents, listLoading } = useBranchStudentsStore();

    // Get 5 most recent enrollments
    const recentEnrollments = [...branchStudents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    if (listLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (recentEnrollments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No enrollments yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recentEnrollments.map((student, index) => (
                <div key={student.id}>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                Student ID: {student.student_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Enrolled {formatDate(student.enrollment_date)}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={ENROLLMENT_STATUS_OPTIONS[student.enrollment_status].color as any}>
                                {formatEnrollmentStatus(student.enrollment_status)}
                            </Badge>
                            <Badge variant={PAYMENT_STATUS_OPTIONS[student.payment_status].color as any}>
                                {formatPaymentStatus(student.payment_status)}
                            </Badge>
                        </div>
                    </div>
                    {index < recentEnrollments.length - 1 && <Separator className="mt-4" />}
                </div>
            ))}
        </div>
    );
}

/**
 * Main Dashboard Component
 */
export function BranchStudentsDashboard() {
    const {
        stats,
        statsLoading,
        fetchBranchStats,
        fetchBranchStudents,
        branchStudents,
    } = useBranchStudentsStore();

    // Fetch data on mount
    useEffect(() => {
        const branchId = 'default-branch-id'; // TODO: Get from context/props
        fetchBranchStats(branchId);
        fetchBranchStudents(branchId);
    }, [fetchBranchStats, fetchBranchStudents]);

    // Calculate derived stats
    const activeStudentsRate = stats
        ? ((stats.enrolled_students / stats.total_students) * 100).toFixed(1)
        : '0';

    const paymentComplianceRate = stats && stats.total_students > 0
        ? (((stats.total_students - stats.students_with_overdue_payments) / stats.total_students) * 100).toFixed(1)
        : '0';

    if (statsLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[60px] mb-2" />
                                <Skeleton className="h-3 w-[120px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value={stats?.total_students || 0}
                    description={`${stats?.enrolled_students || 0} actively enrolled`}
                    icon={<Users className="h-4 w-4 text-green-600" />}
                />

                <StatCard
                    title="Pending Approvals"
                    value={stats?.pending_students || 0}
                    description="Students awaiting approval"
                    icon={<Clock className="h-4 w-4 text-yellow-600" />}
                />

                <StatCard
                    title="Overdue Payments"
                    value={stats?.students_with_overdue_payments || 0}
                    description={`${paymentComplianceRate}% compliance rate`}
                    icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                />

                <StatCard
                    title="Average Attendance"
                    value={`${stats?.average_attendance.toFixed(1) || 0}%`}
                    description="Across all students"
                    icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Financial Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Overview
                        </CardTitle>
                        <CardDescription>Fee collection and outstanding amounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Total Collected</span>
                                <span className="text-sm font-bold text-green-600">
                                    {formatCurrency(stats?.total_fees_collected || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Outstanding</span>
                                <span className="text-sm font-bold text-orange-600">
                                    {formatCurrency(stats?.total_outstanding_fees || 0)}
                                </span>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Collection Rate</span>
                                <span className="text-xs font-medium">{paymentComplianceRate}%</span>
                            </div>
                            <Progress value={Number(paymentComplianceRate)} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollment Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Enrollment Status
                        </CardTitle>
                        <CardDescription>Distribution of student enrollment statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats && Object.entries(stats.students_by_enrollment_status).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant={ENROLLMENT_STATUS_OPTIONS[status as keyof typeof ENROLLMENT_STATUS_OPTIONS].color as any}>
                                        {ENROLLMENT_STATUS_OPTIONS[status as keyof typeof ENROLLMENT_STATUS_OPTIONS].label}
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium">{count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Enrollments */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Enrollments</CardTitle>
                    <CardDescription>Latest 5 student enrollments</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentEnrollmentsList />
                </CardContent>
            </Card>

            {/* Active Students Rate */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Students Rate</CardTitle>
                    <CardDescription>
                        {stats?.enrolled_students || 0} of {stats?.total_students || 0} students actively enrolled
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Enrollment Rate</span>
                            <span className="font-medium">{activeStudentsRate}%</span>
                        </div>
                        <Progress value={Number(activeStudentsRate)} className="h-3" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
