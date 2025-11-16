/**
 * Students Table Component
 * 
 * Displays all branch students with sorting, filtering, and actions
 * Features: Sortable columns, status badges, action menus
 */

'use client';

import { useState } from 'react';
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
 * Sortable Header Component
 */
interface SortableHeaderProps {
    field: BranchStudentSort['field'];
    label: string;
    currentSort: BranchStudentSort | null;
    onSort: (field: BranchStudentSort['field']) => void;
}

function SortableHeader({ field, label, currentSort, onSort }: SortableHeaderProps) {
    const isActive = currentSort?.field === field;
    const direction = currentSort?.direction;

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort(field)}
            className="hover:bg-transparent font-semibold"
        >
            {label}
            {!isActive && <ArrowUpDown className="ml-2 h-4 w-4" />}
            {isActive && direction === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
            {isActive && direction === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
        </Button>
    );
}

/**
 * Student Row Actions Component
 */
interface StudentRowActionsProps {
    student: PublicBranchStudent;
    onView: (student: PublicBranchStudent) => void;
    onEdit: (student: PublicBranchStudent) => void;
    onDelete: (student: PublicBranchStudent) => void;
}

function StudentRowActions({ student, onView, onEdit, onDelete }: StudentRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(student)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(student)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Enrollment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onDelete(student)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Table Skeleton Loader
 */
function TableSkeleton() {
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
}

/**
 * Empty State Component
 */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                No students match your current filters. Try adjusting your search criteria or enroll a new student.
            </p>
        </div>
    );
}

/**
 * Main Students Table Component
 */
export function StudentsTable() {
    const {
        branchStudents,
        listLoading,
        sort,
        setSort,
        setCurrentEnrollment,
    } = useBranchStudentsStore();

    const [selectedStudent, setSelectedStudent] = useState<PublicBranchStudent | null>(null);

    // Handle sorting
    const handleSort = (field: BranchStudentSort['field']) => {
        if (sort?.field === field) {
            // Toggle direction
            setSort({
                field,
                direction: sort.direction === 'asc' ? 'desc' : 'asc',
            });
        } else {
            // New field, default to descending
            setSort({ field, direction: 'desc' });
        }
    };

    // Handle actions
    const handleView = (student: PublicBranchStudent) => {
        setSelectedStudent(student);
        // This will trigger the StudentDetailsDialog to open
        // You'll need to add state management for this
    };

    const handleEdit = (student: PublicBranchStudent) => {
        setSelectedStudent(student);
        // This will trigger the EditEnrollmentDialog to open
        // You'll need to add state management for this
    };

    const handleDelete = (student: PublicBranchStudent) => {
        setSelectedStudent(student);
        // This will trigger the DeleteEnrollmentDialog to open
        // You'll need to add state management for this
    };

    // Get attendance color
    const getAttendanceColor = (percentage: number) => {
        if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'text-green-600';
        if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'text-blue-600';
        if (percentage >= ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'text-orange-600';
        return 'text-red-600';
    };

    // Get payment urgency badge
    const getPaymentUrgencyBadge = (student: PublicBranchStudent) => {
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
    };

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
                        <TableRow key={student.id}>
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
                                    {getPaymentUrgencyBadge(student)}
                                </div>
                            </TableCell>

                            {/* Attendance */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Progress
                                        value={student.attendance_percentage}
                                        className="h-2 w-[60px]"
                                    />
                                    <span className={`text-sm font-medium ${getAttendanceColor(student.attendance_percentage)}`}>
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
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
