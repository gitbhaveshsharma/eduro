/**
 * View Student Classes Dialog Component
 * 
 * Dialog wrapper for viewing and managing a student's class enrollments
 * Features: Class list, edit/drop actions, enroll in new class
 * 
 * @module class-enrollments/view-classes-dialog
 */

'use client';

import { useEffect, useCallback, memo } from 'react';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import type { ClassEnrollmentWithRelations } from '@/lib/branch-system/types/class-enrollments.types';
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
 * Status Badge Component
 */
const StatusBadge = memo(function StatusBadge({
    status,
}: {
    status: string;
}) {
    const config = CLASS_ENROLLMENT_STATUS_OPTIONS[status as keyof typeof CLASS_ENROLLMENT_STATUS_OPTIONS];
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
function EmptyState({ onEnroll }: { onEnroll?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Class Enrollments</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                This student is not enrolled in any classes yet.
            </p>
            {onEnroll && (
                <Button onClick={onEnroll} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll in Class
                </Button>
            )}
        </div>
    );
}

/**
 * Row Actions Component
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
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
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
            fetchStudentClassEnrollments(studentId, branchId);
        }
    }, [open, studentId, branchId, fetchStudentClassEnrollments]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchStudentClassEnrollments(studentId, branchId);
        showInfoToast('Enrollments refreshed');
    }, [studentId, branchId, fetchStudentClassEnrollments]);

    // Handle edit - opens store dialog
    const handleEdit = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            openEditDialog(enrollment);
        },
        [openEditDialog]
    );

    // Handle drop - opens store dialog
    const handleDrop = useCallback(
        (enrollment: ClassEnrollmentWithRelations) => {
            openDropDialog(enrollment);
        },
        [openDropDialog]
    );

    // Count stats
    const activeCount = studentClassEnrollments.filter(
        (e) => e.enrollment_status === 'ENROLLED' || e.enrollment_status === 'PENDING'
    ).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Class Enrollments
                        {studentName && ` - ${studentName}`}
                    </DialogTitle>
                    <DialogDescription>
                        {studentClassEnrollments.length === 0
                            ? 'No classes enrolled'
                            : `${activeCount} active enrollment${activeCount !== 1 ? 's' : ''} out of ${studentClassEnrollments.length} total`}
                    </DialogDescription>
                </DialogHeader>

                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={listLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${listLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {onEnrollClick && (
                        <Button size="sm" onClick={onEnrollClick}>
                            <Plus className="h-4 w-4 mr-2" />
                            Enroll in Class
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px] pr-4">
                    {/* Loading State */}
                    {listLoading && studentClassEnrollments.length === 0 && (
                        <EnrollmentsSkeleton />
                    )}

                    {/* Error State */}
                    {error && studentClassEnrollments.length === 0 && (
                        <div className="flex flex-col items-center py-8 text-center">
                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!listLoading && !error && studentClassEnrollments.length === 0 && (
                        <EmptyState onEnroll={onEnrollClick} />
                    )}

                    {/* Class List Table */}
                    {studentClassEnrollments.length > 0 && (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Enrolled</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
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
                                            <TableCell>
                                                <RowActions
                                                    enrollment={enrollment}
                                                    onEdit={handleEdit}
                                                    onDrop={handleDrop}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
