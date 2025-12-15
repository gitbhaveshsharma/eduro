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
    PAYMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/branch-students.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import {
    formatCurrency,
    formatDate,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    User,
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
            className="hover:bg-transparent font-semibold p-0 h-auto"
        >
            <div className="flex items-center gap-1">
                {label}
                <div className="flex flex-col">
                    {!isActive && <ArrowUpDown className="h-3 w-3" />}
                    {isActive && direction === 'asc' && <ArrowUp className="h-3 w-3" />}
                    {isActive && direction === 'desc' && <ArrowDown className="h-3 w-3" />}
                </div>
            </div>
        </Button>
    );
});

/**
 * Student ID with Tooltip Component
 */
interface StudentIdTooltipProps {
    studentId: string;
    studentName: string;
}

const StudentIdTooltip = memo(function StudentIdTooltip({
    studentId,
    studentName
}: StudentIdTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                            <p className="font-medium text-sm leading-none">{studentName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                ID: {studentId.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs">
                        <p className="font-medium">Student ID:</p>
                        <p className="font-mono">{studentId}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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

    // Memoize enrollment status badge
    const enrollmentStatusBadge = useMemo(() => {
        const status = student.enrollment_status as ClassEnrollmentStatus | null;
        if (!status) return <span className="text-xs text-muted-foreground">-</span>;

        const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status];
        if (!statusConfig) return <span className="text-xs text-muted-foreground">{status}</span>;

        const colorVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            green: 'default',
            yellow: 'secondary',
            orange: 'destructive',
            red: 'destructive',
            blue: 'outline',
        };

        return (
            <Badge variant={colorVariants[statusConfig.color] || 'secondary'} className="text-xs">
                {statusConfig.label}
            </Badge>
        );
    }, [student.enrollment_status]);

    // Memoize attendance display
    const attendanceDisplay = useMemo(() => {
        const attendance = student.attendance_percentage;
        let colorClass = 'text-muted-foreground';

        if (attendance >= 90) colorClass = 'text-green-600';
        else if (attendance >= 75) colorClass = 'text-blue-600';
        else if (attendance >= 60) colorClass = 'text-yellow-600';
        else if (attendance > 0) colorClass = 'text-red-600';

        return (
            <span className={`font-medium ${colorClass}`}>
                {attendance.toFixed(1)}%
            </span>
        );
    }, [student.attendance_percentage]);

    return (
        <TableRow>
            {/* Student Name & ID with Tooltip */}
            <TableCell>
                <div className="space-y-1">
                    <StudentIdTooltip
                        studentId={student.student_id}
                        studentName={student.student_name || 'Unknown Student'}
                    />
                    <p className="text-xs text-muted-foreground">
                        Registered {formatDate(student.registration_date)}
                    </p>
                </div>
            </TableCell>

            {/* Enrollment Status */}
            <TableCell>
                <div className="flex flex-col gap-1">
                    {enrollmentStatusBadge}
                    {student.class_name && (
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={student.class_name}>
                            {student.class_name}
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Attendance Percentage */}
            <TableCell className="text-center">
                {attendanceDisplay}
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
        prevProps.student.payment_status === nextProps.student.payment_status &&
        prevProps.student.outstanding_balance === nextProps.student.outstanding_balance &&
        prevProps.student.student_name === nextProps.student.student_name &&
        prevProps.student.enrollment_status === nextProps.student.enrollment_status &&
        prevProps.student.attendance_percentage === nextProps.student.attendance_percentage;
});

/**
 * Table Skeleton Loader - Memoized
 */
const TableSkeleton = memo(function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-8 w-[60px]" />
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
    /** When provided, shows students for a single branch (branch manager view) */
    branchId?: string;
    /** When provided, shows students across all branches (coach/owner view) */
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
    branchId,
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
            // Toggle direction if same field
            newSort = {
                field,
                direction: prevSort.direction === 'asc' ? 'desc' : 'asc',
            };
        } else {
            // New field, default to descending
            newSort = { field, direction: 'desc' };
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
                        <TableHead className="w-[200px]">
                            <SortableHeader
                                field="student_name"
                                label="Student"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[130px]">
                            <SortableHeader
                                field="enrollment_status"
                                label="Status"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[100px] text-center">
                            <SortableHeader
                                field="attendance_percentage"
                                label="Attendance"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[120px]">
                            <SortableHeader
                                field="payment_status"
                                label="Payment"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[100px] text-right">
                            <SortableHeader
                                field="total_fees_due"
                                label="Balance"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[70px] text-right">Actions</TableHead>
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