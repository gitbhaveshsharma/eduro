/**
 * View Student Classes Dialog Component
 * 
 * Dialog wrapper for viewing and managing a student's class enrollments
 * Features: Class list, edit/drop actions, enroll in new class
 * 
 * @module class-enrollments/view-classes-dialog
 */

'use client';

import { useEffect, useCallback, memo, useMemo } from 'react';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import type { ClassEnrollmentWithRelations, ClassEnrollmentStatus } from '@/lib/branch-system/types/class-enrollments.types';
import { CLASS_ENROLLMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/class-enrollments.types';
import { formatDate } from '@/lib/branch-system/utils/branch-students.utils';
import { showInfoToast } from '@/lib/toast';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    BookOpen,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    GraduationCap,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';

/**
 * Props for ViewClassesDialog
 */
interface ViewClassesDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
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
    /** Callback to open enroll dialog */
    onEnrollClick?: () => void;
}

/**
 * Status Badge Component - Using shadcn Badge variants
 */
const StatusBadge = memo(function StatusBadge({
    status,
}: {
    status: string;
}) {
    // Memoize the badge variant and config
    const badgeContent = useMemo(() => {
        const config = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
        if (!config) {
            return { variant: 'outline' as const, label: status };
        }

        // Map class enrollment colors to shadcn Badge variants
        const colorToVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
            green: 'success',      // ENROLLED - Active/success state
            yellow: 'warning',     // PENDING - Warning/waiting state
            orange: 'warning',     // SUSPENDED - Warning/attention needed
            red: 'destructive',    // DROPPED - Error/removed state
            blue: 'outline',       // COMPLETED - Neutral/completed state
        };

        return {
            variant: colorToVariant[config.color] || 'secondary',
            label: config.label,
        };
    }, [status]);

    return (
        <Badge variant={badgeContent.variant} className="text-xs">
            {badgeContent.label}
        </Badge>
    );
});

/**
 * Attendance Display Component - Memoized
 */
const AttendanceDisplay = memo(function AttendanceDisplay({
    percentage,
}: {
    percentage: number;
}) {
    const display = useMemo(() => {
        let colorClass = 'text-muted-foreground';

        if (percentage >= 90) colorClass = 'text-green-600 dark:text-green-500';
        else if (percentage >= 75) colorClass = 'text-blue-600 dark:text-blue-500';
        else if (percentage >= 60) colorClass = 'text-yellow-600 dark:text-yellow-500';
        else if (percentage > 0) colorClass = 'text-red-600 dark:text-red-500';

        return {
            colorClass,
            text: `${percentage.toFixed(1)}%`,
        };
    }, [percentage]);

    return (
        <span className={`font-medium ${display.colorClass}`}>
            {display.text}
        </span>
    );
});

/**
 * Loading Skeleton - Memoized
 */
const EnrollmentsSkeleton = memo(function EnrollmentsSkeleton() {
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
                    <Skeleton className="h-8 w-8" />
                </div>
            ))}
        </div>
    );
});

/**
 * Empty State Component - Memoized
 */
const EmptyState = memo(function EmptyState({
    onEnroll
}: {
    onEnroll?: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">No Class Enrollments</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    This student is not enrolled in any classes yet.
                </p>
            </div>
            {onEnroll && (
                <Button onClick={onEnroll} size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll in Class
                </Button>
            )}
        </div>
    );
});

/**
 * Error State Component - Memoized
 */
const ErrorState = memo(function ErrorState({
    error,
    onRetry,
}: {
    error: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center py-12 text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Failed to Load</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
            </Button>
        </div>
    );
});

/**
 * Row Actions Component - Memoized
 */
interface RowActionsProps {
    enrollment: ClassEnrollmentWithRelations;
    onEdit: (enrollment: ClassEnrollmentWithRelations) => void;
    onDrop: (enrollment: ClassEnrollmentWithRelations) => void;
}

const RowActions = memo(function RowActions({
    enrollment,
    onEdit,
    onDrop,
}: RowActionsProps) {
    const handleEdit = useCallback(() => onEdit(enrollment), [enrollment, onEdit]);
    const handleDrop = useCallback(() => onDrop(enrollment), [enrollment, onDrop]);
    const isDropped = enrollment.enrollment_status === 'DROPPED';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Enrollment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDrop}
                    className="text-destructive focus:text-destructive"
                    disabled={isDropped}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDropped ? 'Already Dropped' : 'Drop from Class'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Enrollment Row Component - Memoized for performance
 */
interface EnrollmentRowProps {
    enrollment: ClassEnrollmentWithRelations;
    onEdit: (enrollment: ClassEnrollmentWithRelations) => void;
    onDrop: (enrollment: ClassEnrollmentWithRelations) => void;
}

const EnrollmentRow = memo(function EnrollmentRow({
    enrollment,
    onEdit,
    onDrop,
}: EnrollmentRowProps) {
    const className = enrollment.class?.class_name || 'Unknown Class';
    const subject = enrollment.class?.subject;
    const enrollmentDate = formatDate(enrollment.enrollment_date);
    const grade = enrollment.current_grade || '—';

    return (
        <TableRow>
            {/* Class Name */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-md p-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate" title={className}>
                            {className}
                        </p>
                        {subject && (
                            <p className="text-xs text-muted-foreground truncate" title={subject}>
                                {subject}
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell>
                <StatusBadge status={enrollment.enrollment_status} />
            </TableCell>

            {/* Enrollment Date */}
            <TableCell className="text-sm">
                {enrollmentDate}
            </TableCell>

            {/* Attendance */}
            <TableCell>
                <AttendanceDisplay percentage={enrollment.attendance_percentage} />
            </TableCell>

            {/* Grade */}
            <TableCell className="font-medium">
                {grade}
            </TableCell>

            {/* Actions */}
            <TableCell>
                <RowActions
                    enrollment={enrollment}
                    onEdit={onEdit}
                    onDrop={onDrop}
                />
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
        prevProps.enrollment.id === nextProps.enrollment.id &&
        prevProps.enrollment.enrollment_status === nextProps.enrollment.enrollment_status &&
        prevProps.enrollment.attendance_percentage === nextProps.enrollment.attendance_percentage &&
        prevProps.enrollment.current_grade === nextProps.enrollment.current_grade &&
        prevProps.enrollment.enrollment_date === nextProps.enrollment.enrollment_date
    );
});

/**
 * View Student Classes Dialog Component
 */
export function ViewClassesDialog({
    open,
    onOpenChange,
    studentId,
    branchId,
    branchStudentId,
    studentName,
    coachingCenterId,
    onEnrollClick,
}: ViewClassesDialogProps) {
    const {
        studentClassEnrollments,
        listLoading,
        error,
        fetchStudentClassEnrollments,
        openEditDialog,
        openDropDialog,
    } = useClassEnrollmentsStore();

    // Fetch enrollments when dialog opens
    useEffect(() => {
        if (open && studentId && branchId) {
            console.log('[ViewClassesDialog] Fetching enrollments for:', { studentId, branchId });
            fetchStudentClassEnrollments(studentId, branchId);
        }
    }, [open, studentId, branchId, fetchStudentClassEnrollments]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        console.log('[ViewClassesDialog] Refreshing enrollments');
        fetchStudentClassEnrollments(studentId, branchId);
        showInfoToast('Enrollments refreshed');
    }, [studentId, branchId, fetchStudentClassEnrollments]);

    // Handle edit - opens store dialog
    const handleEdit = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            console.log('[ViewClassesDialog] Opening edit dialog for:', enrollment.id);
            openEditDialog(enrollment);
        },
        [openEditDialog]
    );

    // Handle drop - opens store dialog
    const handleDrop = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            console.log('[ViewClassesDialog] Opening drop dialog for:', enrollment.id);
            openDropDialog(enrollment);
        },
        [openDropDialog]
    );

    // Memoize active count calculation
    const activeCount = useMemo(() => {
        return studentClassEnrollments.filter(
            (e) => e.enrollment_status === 'ENROLLED' || e.enrollment_status === 'PENDING'
        ).length;
    }, [studentClassEnrollments]);

    // Memoize dialog description
    const dialogDescription = useMemo(() => {
        if (studentClassEnrollments.length === 0) {
            return 'No classes enrolled';
        }
        return `${activeCount} active enrollment${activeCount !== 1 ? 's' : ''} out of ${studentClassEnrollments.length} total`;
    }, [studentClassEnrollments.length, activeCount]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                {/* Header Section */}
                <div className="p-6 pb-4 border-b">
                    <DialogHeader className="text-left">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <GraduationCap className="h-5 w-5" />
                            Class Enrollments
                            {studentName && (
                                <span className="text-muted-foreground font-normal">
                                    — {studentName}
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-1">
                            {dialogDescription}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between gap-2 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={listLoading}
                            className="h-9"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${listLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        {onEnrollClick && (
                            <Button size="sm" onClick={onEnrollClick} className="h-9">
                                <Plus className="h-4 w-4 mr-2" />
                                Enroll in Class
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden p-6 pt-4">
                    <ScrollArea className="h-full pr-4">
                        {/* Loading State */}
                        {listLoading && studentClassEnrollments.length === 0 && (
                            <div className="py-8">
                                <EnrollmentsSkeleton />
                            </div>
                        )}

                        {/* Error State */}
                        {error && studentClassEnrollments.length === 0 && (
                            <div className="py-8">
                                <ErrorState error={error} onRetry={handleRefresh} />
                            </div>
                        )}

                        {/* Empty State */}
                        {!listLoading && !error && studentClassEnrollments.length === 0 && (
                            <div className="py-8">
                                <EmptyState onEnroll={onEnrollClick} />
                            </div>
                        )}

                        {/* Class List Table */}
                        {studentClassEnrollments.length > 0 && (
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[280px] font-semibold">Class</TableHead>
                                            <TableHead className="w-[120px] font-semibold">Status</TableHead>
                                            <TableHead className="w-[120px] font-semibold">Enrolled</TableHead>
                                            <TableHead className="w-[120px] font-semibold">Attendance</TableHead>
                                            <TableHead className="w-[100px] font-semibold">Grade</TableHead>
                                            <TableHead className="w-[70px] font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentClassEnrollments.map((enrollment) => (
                                            <EnrollmentRow
                                                key={enrollment.id}
                                                enrollment={enrollment}
                                                onEdit={handleEdit}
                                                onDrop={handleDrop}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}