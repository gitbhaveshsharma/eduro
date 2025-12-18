/**
 * Student Class Enrollments Component
 * 
 * Displays all classes a student is enrolled in with management actions
 * Features: Class list, status badges, grades, attendance, action buttons
 * 
 * @module class-enrollments/student-class-enrollments
 */

'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import type {
    ClassEnrollmentWithRelations,
    ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/class-enrollments.types';
import { formatDate } from '@/lib/branch-system/utils/branch-students.utils';
import { showInfoToast } from '@/lib/toast';
import { EnrollClassDialog } from './enroll-class-dialog';
import { EditClassEnrollmentDialog } from './edit-class-enrollment-dialog';
import { DropClassEnrollmentDialog } from './drop-class-enrollment-dialog';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    BookOpen,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    GraduationCap,
    Calendar,
    TrendingUp,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

/**
 * Props for StudentClassEnrollments
 */
interface StudentClassEnrollmentsProps {
    /** Student ID to show enrollments for */
    studentId: string;
    /** Branch ID context */
    branchId: string;
    /** Optional branch student ID for tracking */
    branchStudentId?: string | null;
    /** Student name for display */
    studentName?: string;
    /** Coaching center ID for class search */
    coachingCenterId?: string;
    /** Whether the current user can manage enrollments */
    canManage?: boolean;
    /** Compact view mode */
    compact?: boolean;
}

/**
 * Class Enrollment Row Actions - Memoized
 */
interface EnrollmentRowActionsProps {
    enrollment: ClassEnrollmentWithRelations;
    onEdit: (enrollment: ClassEnrollmentWithRelations) => void;
    onDrop: (enrollment: ClassEnrollmentWithRelations) => void;
    disabled?: boolean;
}

const EnrollmentRowActions = memo(function EnrollmentRowActions({
    enrollment,
    onEdit,
    onDrop,
    disabled,
}: EnrollmentRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(enrollment)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Enrollment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onDrop(enrollment)}
                    className="text-destructive focus:text-destructive"
                    disabled={enrollment.enrollment_status === 'DROPPED'}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Drop from Class
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Status Badge Component
 */
const StatusBadge = memo(function StatusBadge({
    status,
}: {
    status: ClassEnrollmentStatus;
}) {
    const config = CLASS_ENROLLMENT_STATUS_OPTIONS[status];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    return (
        <Badge
            variant="outline"
            style={{
                backgroundColor: config.color + '20',
                borderColor: config.color,
                color: config.color,
            }}
        >
            {config.label}
        </Badge>
    );
});

/**
 * Attendance Display Component
 */
const AttendanceDisplay = memo(function AttendanceDisplay({
    percentage,
}: {
    percentage: number;
}) {
    const getColor = () => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <span className={`font-medium ${getColor()}`}>
            {percentage.toFixed(1)}%
        </span>
    );
});

/**
 * Loading Skeleton
 */
function EnrollmentsSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                </div>
            ))}
        </div>
    );
}

/**
 * Empty State Component
 */
function EmptyState({ onEnroll }: { onEnroll: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Class Enrollments</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                This student is not enrolled in any classes yet. Enroll them in a class to get started.
            </p>
            <Button onClick={onEnroll}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll in Class
            </Button>
        </div>
    );
}

/**
 * Student Class Enrollments Component
 */
export function StudentClassEnrollments({
    studentId,
    branchId,
    branchStudentId,
    studentName,
    coachingCenterId,
    canManage = true,
    compact = false,
}: StudentClassEnrollmentsProps) {
    // Store
    const {
        studentClassEnrollments,
        listLoading,
        error,
        fetchStudentClassEnrollments,
        openEditDialog,
        openDropDialog,
    } = useClassEnrollmentsStore();

    // Local state
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch enrollments on mount
    useEffect(() => {
        fetchStudentClassEnrollments(studentId, branchId);
    }, [studentId, branchId, fetchStudentClassEnrollments]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchStudentClassEnrollments(studentId, branchId);
        setIsRefreshing(false);
        showInfoToast('Enrollments refreshed');
    }, [studentId, branchId, fetchStudentClassEnrollments]);

    // Handle edit
    const handleEdit = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            openEditDialog(enrollment);
        },
        [openEditDialog]
    );

    // Handle drop
    const handleDrop = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            openDropDialog(enrollment);
        },
        [openDropDialog]
    );

    // Handle enroll success
    const handleEnrollSuccess = useCallback(() => {
        fetchStudentClassEnrollments(studentId, branchId);
    }, [studentId, branchId, fetchStudentClassEnrollments]);

    // Compute stats
    const stats = useMemo(() => {
        const active = studentClassEnrollments.filter(
            (e) => e.enrollment_status === 'ENROLLED' || e.enrollment_status === 'PENDING'
        ).length;
        const completed = studentClassEnrollments.filter(
            (e) => e.enrollment_status === 'COMPLETED'
        ).length;
        const dropped = studentClassEnrollments.filter(
            (e) => e.enrollment_status === 'DROPPED' || e.enrollment_status === 'SUSPENDED'
        ).length;

        return { active, completed, dropped, total: studentClassEnrollments.length };
    }, [studentClassEnrollments]);

    // Loading state
    if (listLoading && studentClassEnrollments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Class Enrollments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EnrollmentsSkeleton />
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error && studentClassEnrollments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Class Enrollments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Class Enrollments
                        </CardTitle>
                        <CardDescription>
                            {stats.total === 0
                                ? 'No classes enrolled'
                                : `${stats.active} active, ${stats.completed} completed, ${stats.dropped} dropped`}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing || listLoading}
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Refresh</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {canManage && (
                            <Button onClick={() => setIsEnrollDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Enroll in Class
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {studentClassEnrollments.length === 0 ? (
                        <EmptyState onEnroll={() => setIsEnrollDialogOpen(true)} />
                    ) : compact ? (
                        // Compact card view
                        <div className="space-y-3">
                            {studentClassEnrollments.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {enrollment.class?.class_name || 'Unknown Class'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {enrollment.class?.subject || 'No subject'} •{' '}
                                                {formatDate(enrollment.enrollment_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={enrollment.enrollment_status} />
                                        {canManage && (
                                            <EnrollmentRowActions
                                                enrollment={enrollment}
                                                onEdit={handleEdit}
                                                onDrop={handleDrop}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Full table view
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Enrolled</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Grade</TableHead>
                                        {canManage && (
                                            <TableHead className="w-[50px]"></TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentClassEnrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {enrollment.class?.class_name || 'Unknown'}
                                                        </p>
                                                        {enrollment.class?.subject && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {enrollment.class.subject}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={enrollment.enrollment_status} />
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(enrollment.enrollment_date)}
                                            </TableCell>
                                            <TableCell>
                                                <AttendanceDisplay
                                                    percentage={enrollment.attendance_percentage}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {enrollment.current_grade || '—'}
                                            </TableCell>
                                            {canManage && (
                                                <TableCell>
                                                    <EnrollmentRowActions
                                                        enrollment={enrollment}
                                                        onEdit={handleEdit}
                                                        onDrop={handleDrop}
                                                    />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <EnrollClassDialog
                open={isEnrollDialogOpen}
                onOpenChange={setIsEnrollDialogOpen}
                studentId={studentId}
                branchId={branchId}
                branchStudentId={branchStudentId}
                studentName={studentName}
                coachingCenterId={coachingCenterId}
                onSuccess={handleEnrollSuccess}
            />
            <EditClassEnrollmentDialog />
            <DropClassEnrollmentDialog />
        </>
    );
}
