/**
 * Students Table Component
 * 
 * Displays all branch students with sorting, filtering, and actions
 * Features: Sortable columns, status badges, action menus
 * Optimized: Prevents unnecessary re-renders, no duplicate API calls
 */

'use client';

import { useCallback, useMemo, memo } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { PublicBranchStudent, BranchStudentSort } from '@/lib/branch-system/types/branch-students.types';
import {
    ENROLLMENT_STATUS_OPTIONS,
    PAYMENT_STATUS_OPTIONS,
    ATTENDANCE_THRESHOLDS,
} from '@/lib/branch-system/types/branch-students.types';
import {
    formatCurrency,
    formatDate,
    formatEnrollmentStatus,
    formatPaymentStatus,
    calculateDaysUntilPayment,
    getPaymentUrgency,
} from '@/lib/branch-system/utils/branch-students.utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    GraduationCap,
} from 'lucide-react';

/**
 * Sortable Header Component - Memoized
 */
interface SortableHeaderProps {
    field: BranchStudentSort['field'];
    label: string;
    currentSort: BranchStudentSort | null;
    onSort: (field: BranchStudentSort['field']) => void;
}

const SortableHeader = memo(function SortableHeader({
    field,
    label,
    currentSort,
    onSort
}: SortableHeaderProps) {
    const isActive = currentSort?.field === field;
    const direction = currentSort?.direction;

    const handleClick = useCallback(() => {
        onSort(field);
    }, [field, onSort]);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="hover:bg-transparent font-semibold"
        >
            {label}
            {!isActive && <ArrowUpDown className="ml-2 h-4 w-4" />}
            {isActive && direction === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
            {isActive && direction === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
        </Button>
    );
});

/**
 * Student Row Actions Component - Memoized
 */
interface StudentRowActionsProps {
    student: PublicBranchStudent;
    onView: (student: PublicBranchStudent) => void;
    onEdit: (student: PublicBranchStudent) => void;
    onDelete: (student: PublicBranchStudent) => void;
}

const StudentRowActions = memo(function StudentRowActions({
    student,
    onView,
    onEdit,
    onDelete
}: StudentRowActionsProps) {
    const handleView = useCallback(() => onView(student), [student, onView]);
    const handleEdit = useCallback(() => onEdit(student), [student, onEdit]);
    const handleDelete = useCallback(() => onDelete(student), [student, onDelete]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Enrollment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Student Row Component - Memoized for performance
 */
interface StudentRowProps {
    student: PublicBranchStudent;
    onView: (student: PublicBranchStudent) => void;
    onEdit: (student: PublicBranchStudent) => void;
    onDelete: (student: PublicBranchStudent) => void;
}

const StudentRow = memo(function StudentRow({
    student,
    onView,
    onEdit,
    onDelete
}: StudentRowProps) {
    // Memoize attendance color calculation
    const attendanceColor = useMemo(() => {
        const percentage = student.attendance_percentage;
        if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'text-green-600';
        if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'text-blue-600';
        if (percentage >= ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'text-orange-600';
        return 'text-red-600';
    }, [student.attendance_percentage]);

    // Memoize payment urgency badge
    const paymentUrgencyBadge = useMemo(() => {
        const urgency = getPaymentUrgency(student.next_payment_due);
        const daysUntil = calculateDaysUntilPayment(student.next_payment_due);

        if (!urgency || urgency === 'ok') return null;

        const urgencyConfig = {
            overdue: { variant: 'destructive' as const, label: 'Overdue' },
            urgent: { variant: 'destructive' as const, label: `Due in ${daysUntil} days` },
            warning: { variant: 'default' as const, label: `Due in ${daysUntil} days` },
            reminder: { variant: 'secondary' as const, label: `Due in ${daysUntil} days` },
        };

        const config = urgencyConfig[urgency];
        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
    }, [student.next_payment_due]);

    return (
        <TableRow>
            {/* Student ID & Enrolled Date */}
            <TableCell>
                <div>
                    <p className="font-medium text-sm">
                        {student.student_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Enrolled {formatDate(student.enrollment_date)}
                    </p>
                </div>
            </TableCell>

            {/* Enrollment Status */}
            <TableCell>
                <Badge variant={ENROLLMENT_STATUS_OPTIONS[student.enrollment_status].color as any}>
                    {formatEnrollmentStatus(student.enrollment_status)}
                </Badge>
            </TableCell>

            {/* Payment Status */}
            <TableCell>
                <div className="flex flex-col gap-1">
                    <Badge variant={PAYMENT_STATUS_OPTIONS[student.payment_status].color as any}>
                        {formatPaymentStatus(student.payment_status)}
                    </Badge>
                    {paymentUrgencyBadge}
                </div>
            </TableCell>

            {/* Attendance */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <Progress
                        value={student.attendance_percentage}
                        className="h-2 w-[60px]"
                    />
                    <span className={`text-sm font-medium ${attendanceColor}`}>
                        {student.attendance_percentage.toFixed(1)}%
                    </span>
                </div>
            </TableCell>

            {/* Fees */}
            <TableCell className="text-right">
                <div>
                    <p className="text-sm font-medium">
                        {formatCurrency(student.outstanding_balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        outstanding
                    </p>
                </div>
            </TableCell>

            {/* Next Payment */}
            <TableCell>
                {student.next_payment_due ? (
                    <div className="text-sm">
                        <p className="font-medium">
                            {formatDate(student.next_payment_due)}
                        </p>
                        {student.is_payment_overdue && (
                            <p className="text-xs text-red-600">Overdue</p>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                )}
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
                <StudentRowActions
                    student={student}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-render if student data hasn't changed
    return prevProps.student.id === nextProps.student.id &&
        prevProps.student.enrollment_status === nextProps.student.enrollment_status &&
        prevProps.student.payment_status === nextProps.student.payment_status &&
        prevProps.student.attendance_percentage === nextProps.student.attendance_percentage &&
        prevProps.student.outstanding_balance === nextProps.student.outstanding_balance;
});

/**
 * Table Skeleton Loader - Memoized
 */
const TableSkeleton = memo(function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-3 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[80px]" />
                </div>
            ))}
        </div>
    );
});

/**
 * Empty State Component - Memoized
 */
const EmptyState = memo(function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                No students match your current filters. Try adjusting your search criteria or enroll a new student.
            </p>
        </div>
    );
});

/**
 * Props for Students Table Component
 */
interface StudentsTableProps {
    coachingCenterId?: string;
    onViewStudent?: (studentId: string) => void;
    onEditStudent?: (studentId: string) => void;
    onDeleteStudent?: (studentId: string) => void;
}

/**
 * Main Students Table Component
 * Optimized: Uses existing data from store, no API calls
 */
export function StudentsTable({
    coachingCenterId,
    onViewStudent,
    onEditStudent,
    onDeleteStudent
}: StudentsTableProps = {}) {
    const {
        branchStudents,
        listLoading,
        sort,
        setSort,
    } = useBranchStudentsStore();

    // Memoize sort handler to prevent recreation
    const handleSort = useCallback((field: BranchStudentSort['field']) => {
        const prevSort = sort;
        let newSort: BranchStudentSort;
        if (prevSort?.field === field) {
            newSort = {
                field,
                direction: prevSort.direction === 'asc' ? 'desc' : 'asc',
            };
        } else {
            newSort = { field, direction: 'desc' } as BranchStudentSort;
        }
        setSort(newSort);
    }, [sort, setSort]);

    // Memoize action handlers
    const handleView = useCallback((student: PublicBranchStudent) => {
        console.log('[StudentsTable] View student:', student.id);
        if (onViewStudent) {
            onViewStudent(student.id);
        }
    }, [onViewStudent]);

    const handleEdit = useCallback((student: PublicBranchStudent) => {
        console.log('[StudentsTable] Edit student:', student.id);
        if (onEditStudent) {
            onEditStudent(student.id);
        }
    }, [onEditStudent]);

    const handleDelete = useCallback((student: PublicBranchStudent) => {
        console.log('[StudentsTable] Delete student:', student.id);
        if (onDeleteStudent) {
            onDeleteStudent(student.id);
        }
    }, [onDeleteStudent]);

    if (listLoading) {
        return <TableSkeleton />;
    }

    if (branchStudents.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">
                            <SortableHeader
                                field="enrollment_date"
                                label="Student ID"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                field="enrollment_status"
                                label="Status"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                field="payment_status"
                                label="Payment"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                field="attendance_percentage"
                                label="Attendance"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="text-right">
                            <SortableHeader
                                field="total_fees_due"
                                label="Fees"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                field="next_payment_due"
                                label="Next Payment"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branchStudents.map((student) => (
                        <StudentRow
                            key={student.id}
                            student={student}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
