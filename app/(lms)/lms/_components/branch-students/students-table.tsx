/**
 * Students Table Component
 * 
 * Displays all branch students with sorting, filtering, and actions
 * Features: Sortable columns, status badges, action menus
 * Optimized: Prevents unnecessary re-renders, no duplicate API calls
 */

'use client';

import { useCallback, useMemo, memo, useState } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import type { PublicBranchStudent, BranchStudentSort } from '@/lib/branch-system/types/branch-students.types';
import {
    PAYMENT_STATUS_OPTIONS,
    type PaymentStatus,
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
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
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
    BookOpen,
    Plus,
} from 'lucide-react';
import {
    EnrollClassDialog,
    EditClassEnrollmentDialog,
    DropClassEnrollmentDialog,
    ViewClassesDialog,
} from '../class-enrollments';

// ============================================================
// UTILITY TYPES & HELPERS
// ============================================================

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Maps enrollment status to Badge variant
 * Uses CLASS_ENROLLMENT_STATUS_OPTIONS for consistent color mapping
 */
function getEnrollmentStatusVariant(status: ClassEnrollmentStatus | null | undefined): BadgeVariant {
    if (!status) return 'secondary';

    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status];
    if (!statusConfig) return 'secondary';

    // Map from status config color to Badge variant
    const colorMap: Record<string, BadgeVariant> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
    };

    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Maps payment status to Badge variant
 * Uses PAYMENT_STATUS_OPTIONS for consistent color mapping
 */
function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
    const statusConfig = PAYMENT_STATUS_OPTIONS[status];
    if (!statusConfig) return 'secondary';

    // Map from status config color to Badge variant
    const colorMap: Record<string, BadgeVariant> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
    };

    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Gets enrollment status label
 */
function getEnrollmentStatusLabel(status: ClassEnrollmentStatus | null | undefined): string {
    if (!status) return '-';
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status];
    return statusConfig?.label || status;
}

/**
 * Maps payment urgency to Badge variant
 */
function getPaymentUrgencyVariant(urgency: string | null): BadgeVariant | null {
    if (!urgency || urgency === 'ok') return null;

    const urgencyMap: Record<string, BadgeVariant> = {
        'overdue': 'destructive',
        'urgent': 'destructive',
        'warning': 'warning',
        'reminder': 'secondary',
    };

    return urgencyMap[urgency] || null;
}

/**
 * Gets payment urgency label
 */
function getPaymentUrgencyLabel(urgency: string | null, daysUntil: number | null): string | null {
    if (!urgency || urgency === 'ok') return null;

    if (urgency === 'overdue') return 'Overdue';
    if (daysUntil !== null) return `Due in ${daysUntil} days`;

    return null;
}

/**
 * Gets attendance color class based on percentage
 */
function getAttendanceColorClass(percentage: number): string {
    if (percentage >= 90) return 'text-green-600 dark:text-green-500';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-500';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-500';
    if (percentage > 0) return 'text-red-600 dark:text-red-500';
    return 'text-muted-foreground';
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

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
    onEnrollClass: (student: PublicBranchStudent) => void;
    onViewClasses: (student: PublicBranchStudent) => void;
}

const StudentRowActions = memo(function StudentRowActions({
    student,
    onView,
    onEdit,
    onDelete,
    onEnrollClass,
    onViewClasses,
}: StudentRowActionsProps) {
    const handleView = useCallback(() => onView(student), [student, onView]);
    const handleEdit = useCallback(() => onEdit(student), [student, onEdit]);
    const handleDelete = useCallback(() => onDelete(student), [student, onDelete]);
    const handleEnrollClass = useCallback(() => onEnrollClass(student), [student, onEnrollClass]);
    const handleViewClasses = useCallback(() => onViewClasses(student), [student, onViewClasses]);

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
                    Edit Registration
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Class Enrollment Actions */}
                <DropdownMenuItem onClick={handleEnrollClass}>
                    <Plus className="mr-2 h-4 w-4" />
                    Enroll in Class
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewClasses}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Classes
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
    onEnrollClass: (student: PublicBranchStudent) => void;
    onViewClasses: (student: PublicBranchStudent) => void;
}

const StudentRow = memo(function StudentRow({
    student,
    onView,
    onEdit,
    onDelete,
    onEnrollClass,
    onViewClasses,
}: StudentRowProps) {
    // Memoize payment urgency badge using utility functions
    const paymentUrgencyBadge = useMemo(() => {
        const urgency = getPaymentUrgency(student.next_payment_due);
        const daysUntil = calculateDaysUntilPayment(student.next_payment_due);

        const variant = getPaymentUrgencyVariant(urgency);
        const label = getPaymentUrgencyLabel(urgency, daysUntil);

        if (!variant || !label) return null;

        return (
            <Badge variant={variant} className="text-xs">
                {label}
            </Badge>
        );
    }, [student.next_payment_due]);

    // Memoize enrollment status badge using utility functions
    const enrollmentStatusBadge = useMemo(() => {
        const status = student.enrollment_status as ClassEnrollmentStatus | null;

        if (!status) {
            return (
                <Badge variant="secondary" className="text-xs">
                    Not Enrolled
                </Badge>
            );
        }

        const variant = getEnrollmentStatusVariant(status);
        const label = getEnrollmentStatusLabel(status);

        return (
            <Badge variant={variant} className="text-xs">
                {label}
            </Badge>
        );
    }, [student.enrollment_status]);

    // Memoize payment status badge using utility functions
    const paymentStatusBadge = useMemo(() => {
        const variant = getPaymentStatusVariant(student.payment_status);
        const label = formatPaymentStatus(student.payment_status);

        return (
            <Badge variant={variant}>
                {label}
            </Badge>
        );
    }, [student.payment_status]);

    // Memoize attendance display using utility function
    const attendanceDisplay = useMemo(() => {
        const attendance = student.attendance_percentage;

        // If no class enrollment, show 'N/A'
        if (!student.enrollment_status) {
            return <span className="text-xs text-muted-foreground">N/A</span>;
        }

        const colorClass = getAttendanceColorClass(attendance);

        return (
            <span className={`font-medium ${colorClass}`}>
                {attendance.toFixed(1)}%
            </span>
        );
    }, [student.attendance_percentage, student.enrollment_status]);

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
                    {student.class_name ? (
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={student.class_name}>
                            {student.class_name}
                        </p>
                    ) : (
                        !student.enrollment_status && (
                            <p className="text-xs text-muted-foreground">
                                No class assigned
                            </p>
                        )
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
                    {paymentStatusBadge}
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
                    onEnrollClass={onEnrollClass}
                    onViewClasses={onViewClasses}
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
    /** Callback to navigate to student's class enrollments */
    onViewStudentClasses?: (student: PublicBranchStudent) => void;
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
    onDeleteStudent,
    onViewStudentClasses,
}: StudentsTableProps = {}) {
    const {
        branchStudents,
        listLoading,
        sort,
        setSort,
    } = useBranchStudentsStore();

    const { fetchStudentClassEnrollments } = useClassEnrollmentsStore();

    // State for enroll class dialog
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<PublicBranchStudent | null>(null);

    // State for view classes dialog
    const [viewClassesDialogOpen, setViewClassesDialogOpen] = useState(false);
    const [selectedStudentForViewClasses, setSelectedStudentForViewClasses] = useState<PublicBranchStudent | null>(null);

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

    // Class enrollment action handlers
    const handleEnrollClass = useCallback((student: PublicBranchStudent) => {
        console.log('[StudentsTable] Enroll in class:', student.id);
        setSelectedStudentForEnroll(student);
        setEnrollDialogOpen(true);
    }, []);

    const handleViewClasses = useCallback((student: PublicBranchStudent) => {
        console.log('[StudentsTable] View classes:', student.id);
        // Set the selected student and open the view classes dialog
        setSelectedStudentForViewClasses(student);
        setViewClassesDialogOpen(true);
        // Also call the external callback if provided
        if (onViewStudentClasses) {
            onViewStudentClasses(student);
        }
    }, [onViewStudentClasses]);

    // Handle enroll from view classes dialog
    const handleEnrollFromViewClasses = useCallback(() => {
        if (selectedStudentForViewClasses) {
            setSelectedStudentForEnroll(selectedStudentForViewClasses);
            setEnrollDialogOpen(true);
        }
    }, [selectedStudentForViewClasses]);

    const handleEnrollSuccess = useCallback(() => {
        // Refresh data after successful enrollment
        if (selectedStudentForEnroll) {
            fetchStudentClassEnrollments(selectedStudentForEnroll.student_id, selectedStudentForEnroll.branch_id);
        }
        setSelectedStudentForEnroll(null);
    }, [selectedStudentForEnroll, fetchStudentClassEnrollments]);

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
                            onEnrollClass={handleEnrollClass}
                            onViewClasses={handleViewClasses}
                        />
                    ))}
                </TableBody>
            </Table>

            {/* Class Enrollment Dialogs */}
            {selectedStudentForEnroll && (
                <EnrollClassDialog
                    open={enrollDialogOpen}
                    onOpenChange={setEnrollDialogOpen}
                    studentId={selectedStudentForEnroll.student_id}
                    branchId={selectedStudentForEnroll.branch_id}
                    branchStudentId={selectedStudentForEnroll.id}
                    studentName={selectedStudentForEnroll.student_name || undefined}
                    coachingCenterId={coachingCenterId}
                    onSuccess={handleEnrollSuccess}
                />
            )}

            {/* View Classes Dialog */}
            {selectedStudentForViewClasses && (
                <ViewClassesDialog
                    open={viewClassesDialogOpen}
                    onOpenChange={setViewClassesDialogOpen}
                    studentId={selectedStudentForViewClasses.student_id}
                    branchId={selectedStudentForViewClasses.branch_id}
                    branchStudentId={selectedStudentForViewClasses.id}
                    studentName={selectedStudentForViewClasses.student_name || undefined}
                    coachingCenterId={coachingCenterId}
                    onEnrollClick={handleEnrollFromViewClasses}
                />
            )}

            {/* Store-controlled dialogs for edit/drop */}
            <EditClassEnrollmentDialog />
            <DropClassEnrollmentDialog />
        </div>
    );
}
