/**
 * Teachers Table Component
 * 
 * Displays all branch teachers with sorting, filtering, and actions
 * Features: Sortable columns, status badges, action menus
 * Optimized: Prevents unnecessary re-renders, no duplicate API calls
 */

'use client';

import { useCallback, useMemo, memo } from 'react';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import type { PublicBranchTeacher, BranchTeacherSort } from '@/lib/branch-system/types/branch-teacher.types';
import {
    EXPERIENCE_LEVEL_OPTIONS,
} from '@/lib/branch-system/types/branch-teacher.types';
import {
    getExperienceLevelLabel,
} from '@/lib/branch-system/utils/branch-teacher.utils';
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
    GraduationCap,
    User,
    BookOpen,
} from 'lucide-react';

// Helper function to format subjects list
function formatSubjects(subjects: string[], maxShow: number = 2): string {
    if (subjects.length === 0) return 'No subjects';
    if (subjects.length <= maxShow) return subjects.join(', ');
    return `${subjects.slice(0, maxShow).join(', ')} +${subjects.length - maxShow} more`;
}

/**
 * Sortable Header Component - Memoized
 */
interface SortableHeaderProps {
    field: BranchTeacherSort['field'];
    label: string;
    currentSort: BranchTeacherSort | null;
    onSort: (field: BranchTeacherSort['field']) => void;
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
 * Teacher ID with Tooltip Component
 */
interface TeacherIdTooltipProps {
    teacherId: string;
    teacherName: string;
}

const TeacherIdTooltip = memo(function TeacherIdTooltip({
    teacherId,
    teacherName
}: TeacherIdTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                            <p className="font-medium text-sm leading-none">{teacherName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                ID: {teacherId.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs">
                        <p className="font-medium">Teacher ID:</p>
                        <p className="font-mono">{teacherId}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});

/**
 * Teacher Row Actions Component - Memoized
 */
interface TeacherRowActionsProps {
    teacher: PublicBranchTeacher;
    onView: (teacher: PublicBranchTeacher) => void;
    onEdit: (teacher: PublicBranchTeacher) => void;
    onDelete: (teacher: PublicBranchTeacher) => void;
}

const TeacherRowActions = memo(function TeacherRowActions({
    teacher,
    onView,
    onEdit,
    onDelete
}: TeacherRowActionsProps) {
    const handleView = useCallback(() => onView(teacher), [teacher, onView]);
    const handleEdit = useCallback(() => onEdit(teacher), [teacher, onEdit]);
    const handleDelete = useCallback(() => onDelete(teacher), [teacher, onDelete]);

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
                    Edit Assignment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Teacher Row Component - Memoized for performance
 */
interface TeacherRowProps {
    teacher: PublicBranchTeacher;
    onView: (teacher: PublicBranchTeacher) => void;
    onEdit: (teacher: PublicBranchTeacher) => void;
    onDelete: (teacher: PublicBranchTeacher) => void;
}

const TeacherRow = memo(function TeacherRow({
    teacher,
    onView,
    onEdit,
    onDelete
}: TeacherRowProps) {
    // Format subjects for display
    const subjectsDisplay = useMemo(() => {
        if (!teacher.teaching_subjects || teacher.teaching_subjects.length === 0) {
            return 'No subjects assigned';
        }
        return formatSubjects(teacher.teaching_subjects, 2);
    }, [teacher.teaching_subjects]);

    return (
        <TableRow>
            {/* Teacher Name & ID with Tooltip */}
            <TableCell>
                <div className="space-y-1">
                    <TeacherIdTooltip
                        teacherId={teacher.teacher_id}
                        teacherName={teacher.teacher_name || 'Unknown Teacher'}
                    />
                    <p className="text-xs text-muted-foreground">
                        {teacher.teacher_email}
                    </p>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell>
                <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </TableCell>

            {/* Experience Level */}
            <TableCell>
                <Badge variant={EXPERIENCE_LEVEL_OPTIONS[teacher.experience_level].color as any}>
                    {getExperienceLevelLabel(teacher.teaching_experience_years)}
                </Badge>
            </TableCell>

            {/* Subjects */}
            <TableCell>
                <div className="flex items-center gap-1 text-sm">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[150px]" title={teacher.teaching_subjects?.join(', ')}>
                        {subjectsDisplay}
                    </span>
                </div>
            </TableCell>

            {/* Experience Years */}
            <TableCell className="text-center">
                <span className="text-sm font-medium">
                    {teacher.teaching_experience_years !== null
                        ? `${teacher.teaching_experience_years} yrs`
                        : '-'}
                </span>
            </TableCell>

            {/* Availability */}
            <TableCell>
                <span className="text-sm text-muted-foreground truncate max-w-[150px]" title={teacher.availability_summary}>
                    {teacher.availability_summary || 'Not set'}
                </span>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
                <TeacherRowActions
                    teacher={teacher}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-render if teacher data hasn't changed
    return prevProps.teacher.id === nextProps.teacher.id &&
        prevProps.teacher.is_active === nextProps.teacher.is_active &&
        prevProps.teacher.experience_level === nextProps.teacher.experience_level &&
        prevProps.teacher.teaching_experience_years === nextProps.teacher.teaching_experience_years &&
        prevProps.teacher.teacher_name === nextProps.teacher.teacher_name;
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
            <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                No teachers match your current filters. Try adjusting your search criteria or assign a new teacher.
            </p>
        </div>
    );
});

/**
 * Props for Teachers Table Component
 */
interface TeachersTableProps {
    /** When provided, shows teachers for a single branch (branch manager view) */
    branchId?: string;
    /** When provided, shows teachers across all branches (coach/owner view) */
    coachingCenterId?: string;
    onViewTeacher?: (teacherId: string) => void;
    onEditTeacher?: (teacherId: string) => void;
    onDeleteTeacher?: (teacherId: string) => void;
}

/**
 * Main Teachers Table Component
 * Optimized: Uses existing data from store, no API calls
 */
export function TeachersTable({
    branchId,
    coachingCenterId,
    onViewTeacher,
    onEditTeacher,
    onDeleteTeacher
}: TeachersTableProps = {}) {
    const {
        branchTeachers,
        listLoading,
        sort,
        setSort,
    } = useBranchTeacherStore();

    // Memoize sort handler to prevent recreation
    const handleSort = useCallback((field: BranchTeacherSort['field']) => {
        const prevSort = sort;
        let newSort: BranchTeacherSort;

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
    const handleView = useCallback((teacher: PublicBranchTeacher) => {
        console.log('[TeachersTable] View teacher:', teacher.id);
        if (onViewTeacher) {
            onViewTeacher(teacher.id);
        }
    }, [onViewTeacher]);

    const handleEdit = useCallback((teacher: PublicBranchTeacher) => {
        console.log('[TeachersTable] Edit teacher:', teacher.id);
        if (onEditTeacher) {
            onEditTeacher(teacher.id);
        }
    }, [onEditTeacher]);

    const handleDelete = useCallback((teacher: PublicBranchTeacher) => {
        console.log('[TeachersTable] Delete teacher:', teacher.id);
        if (onDeleteTeacher) {
            onDeleteTeacher(teacher.id);
        }
    }, [onDeleteTeacher]);

    if (listLoading) {
        return <TableSkeleton />;
    }

    if (branchTeachers.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">
                            <SortableHeader
                                field="teacher_name"
                                label="Teacher"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[100px]">
                            <SortableHeader
                                field="is_active"
                                label="Status"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[120px]">
                            Experience
                        </TableHead>
                        <TableHead className="w-[150px]">
                            Subjects
                        </TableHead>
                        <TableHead className="w-[100px] text-center">
                            <SortableHeader
                                field="teaching_experience_years"
                                label="Years"
                                currentSort={sort}
                                onSort={handleSort}
                            />
                        </TableHead>
                        <TableHead className="w-[150px]">
                            Availability
                        </TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branchTeachers.map((teacher) => (
                        <TeacherRow
                            key={teacher.id}
                            teacher={teacher}
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
