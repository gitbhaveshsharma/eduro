/**
 * Branch Students Dashboard Component
 * 
 * Displays comprehensive statistics and analytics for branch students
 * Features: Stat cards, recent enrollments, students needing attention
 */

'use client';

import { useEffect, useMemo } from 'react';
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

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    colorClass?: string;
    className?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, colorClass, className }: StatCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className={`h-4 w-4 ${colorClass || 'text-primary'}`} />
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

function RecentEnrollmentsList() {
    const { branchStudents, listLoading } = useBranchStudentsStore();

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
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
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

interface BranchStudentsDashboardProps {
    coachingCenterId: string;
}

export function BranchStudentsDashboard({ coachingCenterId }: BranchStudentsDashboardProps) {
    const {
        statsLoading,
        fetchCoachingCenterStudents,
        branchStudents,
        listLoading,
    } = useBranchStudentsStore();

    useEffect(() => {
        if (coachingCenterId) {
            fetchCoachingCenterStudents(coachingCenterId);
        }
    }, [coachingCenterId, fetchCoachingCenterStudents]);

    const calculatedStats = useMemo(() => {
        if (branchStudents.length === 0) {
            return {
                total_students: 0,
                enrolled_students: 0,
                pending_students: 0,
                students_with_overdue_payments: 0,
                average_attendance: 0,
                total_fees_collected: 0,
                total_outstanding_fees: 0,
                students_by_enrollment_status: {},
                students_by_payment_status: {},
            };
        }

        const enrollmentStatusCounts: Record<string, number> = {};
        const paymentStatusCounts: Record<string, number> = {};

        let enrolledCount = 0;
        let pendingCount = 0;
        let overduePaymentCount = 0;
        let totalAttendance = 0;
        let totalOutstanding = 0;

        branchStudents.forEach((student) => {
            enrollmentStatusCounts[student.enrollment_status] =
                (enrollmentStatusCounts[student.enrollment_status] || 0) + 1;

            paymentStatusCounts[student.payment_status] =
                (paymentStatusCounts[student.payment_status] || 0) + 1;

            if (student.enrollment_status === 'ENROLLED') {
                enrolledCount++;
            }

            if (student.enrollment_status === 'PENDING') {
                pendingCount++;
            }

            if (student.is_payment_overdue) {
                overduePaymentCount++;
            }

            totalAttendance += student.attendance_percentage || 0;
            totalOutstanding += student.outstanding_balance || 0;
        });

        const averageAttendance = branchStudents.length > 0
            ? totalAttendance / branchStudents.length
            : 0;

        return {
            total_students: branchStudents.length,
            enrolled_students: enrolledCount,
            pending_students: pendingCount,
            students_with_overdue_payments: overduePaymentCount,
            average_attendance: averageAttendance,
            total_fees_collected: 0,
            total_outstanding_fees: totalOutstanding,
            students_by_enrollment_status: enrollmentStatusCounts,
            students_by_payment_status: paymentStatusCounts,
        };
    }, [branchStudents]);

    const activeStudentsRate = calculatedStats.total_students > 0
        ? ((calculatedStats.enrolled_students / calculatedStats.total_students) * 100).toFixed(1)
        : '0';

    const paymentComplianceRate = calculatedStats.total_students > 0
        ? (((calculatedStats.total_students - calculatedStats.students_with_overdue_payments) / calculatedStats.total_students) * 100).toFixed(1)
        : '0';

    if (statsLoading || listLoading) {
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value={calculatedStats.total_students}
                    description={`${calculatedStats.enrolled_students} actively enrolled`}
                    icon={Users}
                    colorClass="text-blue-600"
                />

                <StatCard
                    title="Pending Approvals"
                    value={calculatedStats.pending_students}
                    description="Students awaiting approval"
                    icon={Clock}
                    colorClass="text-orange-600"
                />

                <StatCard
                    title="Overdue Payments"
                    value={calculatedStats.students_with_overdue_payments}
                    description={`${paymentComplianceRate}% compliance rate`}
                    icon={AlertTriangle}
                    colorClass="text-red-600"
                />

                <StatCard
                    title="Average Attendance"
                    value={`${calculatedStats.average_attendance.toFixed(1)}%`}
                    description="Across all students"
                    icon={TrendingUp}
                    colorClass="text-green-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            Financial Overview
                        </CardTitle>
                        <CardDescription>Fee collection and outstanding amounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Total Collected</span>
                                <span className="text-sm font-bold text-green-600">
                                    {formatCurrency(calculatedStats.total_fees_collected)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Outstanding</span>
                                <span className="text-sm font-bold text-orange-600">
                                    {formatCurrency(calculatedStats.total_outstanding_fees)}
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            Enrollment Status
                        </CardTitle>
                        <CardDescription>Distribution of student enrollment statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.keys(calculatedStats.students_by_enrollment_status).length > 0 ? (
                            Object.entries(calculatedStats.students_by_enrollment_status).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={ENROLLMENT_STATUS_OPTIONS[status as keyof typeof ENROLLMENT_STATUS_OPTIONS]?.color as any}>
                                            {ENROLLMENT_STATUS_OPTIONS[status as keyof typeof ENROLLMENT_STATUS_OPTIONS]?.label || status}
                                        </Badge>
                                    </div>
                                    <span className="text-sm font-medium">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">No enrollment data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Enrollments</CardTitle>
                    <CardDescription>Latest 5 student enrollments</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentEnrollmentsList />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Students Rate</CardTitle>
                    <CardDescription>
                        {calculatedStats.enrolled_students} of {calculatedStats.total_students} students actively enrolled
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