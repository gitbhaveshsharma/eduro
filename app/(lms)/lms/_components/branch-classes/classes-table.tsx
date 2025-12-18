/**
 * Classes Table Component - CONTEXT-BASED VERSION
 * 
 * Supports two modes (similar to receipts-table.tsx):
 * 1. Branch mode (branchId) - Shows only classes for a specific branch
 * 2. Coaching Center mode (coachingCenterId) - Shows all classes across branches
 * 
 * Key features:
 * 1. Uses fetchClassesByBranch or fetchClassesByCoachingCenter based on context
 * 2. Client-side filtering (no search API calls)
 * 3. Uses cached results on subsequent renders
 * 4. Automatically updates when classes are created/updated/deleted
 */

'use client';

import { useEffect, useState, memo, useCallback, useMemo } from 'react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useClassesLoading,
    useClassesByBranch,
    useClassesByCoachingCenter,
    useBranchClassesStore,
    formatClassSchedule,
    getCapacityDisplay,
    formatClassStatus,
    calculateUtilization,
    type BranchClass,
    type PublicBranchClass,
    type BranchClassFilters,
} from '@/lib/branch-system/branch-classes';
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    ArrowUpDown,
    Users,
    Calendar,
    RefreshCw,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

interface ClassesTableProps {
    /** Branch ID - shows only classes for this specific branch */
    branchId?: string;
    /** Coaching Center ID - shows all classes across all branches of this coaching center */
    coachingCenterId?: string;
    /** Filter criteria from ClassFilters component */
    filters?: BranchClassFilters;
}

/**
 * Table Header Cell with Sorting
 */
const SortableHeader = memo(function SortableHeader({
    label,
    field,
    currentSort,
    onSort,
}: {
    label: string;
    field: string;
    currentSort: { field: string; direction: 'asc' | 'desc' };
    onSort: (field: string) => void;
}) {
    const isActive = currentSort.field === field;
    const direction = currentSort.direction;

    const handleClick = useCallback(() => {
        onSort(field);
    }, [field, onSort]);

    return (
        <TableHead>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleClick}
                className="hover:bg-transparent font-semibold"
            >
                <div className="flex items-center gap-2">
                    {label}
                    {!isActive && (
                        <ArrowUpDown className="h-4 w-4 " />
                    )}
                    {isActive && direction === 'asc' && (
                        <ArrowUp className="h-4 w-4 text-secondary" />
                    )}
                    {isActive && direction === 'desc' && (
                        <ArrowDown className="h-4 w-4 " />
                    )}
                </div>
            </Button>
        </TableHead>
    );
});
/**
 * Class Row Actions Menu
 */
function ClassRowActions({ classItem }: { classItem: BranchClass | PublicBranchClass }) {
    const store = useBranchClassesStore();

    const handleView = () => {
        store.setSelectedClass(classItem.id);
    };

    const handleEdit = () => {
        store.startEditing(classItem.id);
    };

    const handleDelete = () => {
        store.setSelectedClass(classItem.id);
        store.openDeleteDialog?.(classItem.id);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Class
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Class
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Loading Skeleton for Table
 */
function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-8 rounded-full" />
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
        <div className="text-center py-12 border rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
            <p className="text-muted-foreground mb-4">
                No classes match your current filters. Try adjusting your search.
            </p>
        </div>
    );
}

/**
 * Client-side filter function
 */
function filterClasses(classes: BranchClass[], filters: BranchClassFilters): BranchClass[] {
    return classes.filter((cls) => {
        // Search query filter
        if (filters.search_query) {
            const query = filters.search_query.toLowerCase();
            const matchesName = cls.class_name?.toLowerCase().includes(query);
            const matchesSubject = cls.subject?.toLowerCase().includes(query);
            const matchesDescription = cls.description?.toLowerCase().includes(query);
            const matchesBatch = cls.batch_name?.toLowerCase().includes(query);

            if (!matchesName && !matchesSubject && !matchesDescription && !matchesBatch) {
                return false;
            }
        }

        // Status filter
        if (filters.status && cls.status !== filters.status) {
            return false;
        }

        // Grade level filter
        if (filters.grade_level && cls.grade_level !== filters.grade_level) {
            return false;
        }

        // Subject filter
        if (filters.subject && cls.subject !== filters.subject) {
            return false;
        }

        // Branch filter (for coaching center mode)
        if (filters.branch_id && cls.branch_id !== filters.branch_id) {
            return false;
        }

        // Available seats filter
        if (filters.has_available_seats) {
            const hasSeats = (cls.max_students || 0) > (cls.current_enrollment || 0);
            if (!hasSeats) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Client-side sort function
 */
function sortClasses(
    classes: BranchClass[],
    field: string,
    direction: 'asc' | 'desc'
): BranchClass[] {
    return [...classes].sort((a, b) => {
        let aValue: any = a[field as keyof BranchClass];
        let bValue: any = b[field as keyof BranchClass];

        // Handle null/undefined
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // String comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        // Number/Date comparison
        if (direction === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });
}

/**
 * Main Classes Table Component
 */
export function ClassesTable({ branchId, coachingCenterId, filters = {} }: ClassesTableProps) {
    const { fetchClasses: isLoading } = useClassesLoading();
    const store = useBranchClassesStore();

    // Get classes from appropriate source based on context (like receipts-table.tsx)
    const branchClasses = useClassesByBranch(branchId || null);
    const coachingCenterClasses = useClassesByCoachingCenter(coachingCenterId || null);

    // Determine which classes to use based on context
    const rawClasses = branchId
        ? branchClasses
        : coachingCenterId
            ? coachingCenterClasses
            : [];

    // Local sorting state
    const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: 'created_at',
        direction: 'desc',
    });

    // Fetch classes on mount based on branchId or coachingCenterId (like receipts-table.tsx)
    useEffect(() => {
        if (coachingCenterId) {
            // Coach view - fetch all branches of coaching center
            console.log('[ClassesTable] Fetching classes for coaching center:', coachingCenterId);
            store.fetchClassesByCoachingCenter(coachingCenterId);
        } else if (branchId) {
            // Branch manager view - fetch single branch
            console.log('[ClassesTable] Fetching classes for branch:', branchId);
            store.fetchClassesByBranch(branchId);
        }
        // Note: If neither branchId nor coachingCenterId is provided,
        // no fetch is performed - this component requires context
    }, [branchId, coachingCenterId, store]);

    // Apply client-side filtering and sorting
    const classes = useMemo(() => {
        let result = filterClasses(rawClasses, filters);
        result = sortClasses(result, sortConfig.field, sortConfig.direction);
        return result;
    }, [rawClasses, filters, sortConfig]);

    // Handle column sorting (client-side)
    const handleSort = useCallback((field: string) => {
        setSortConfig((prev) => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    // Manual refresh function
    const handleRefresh = useCallback(() => {
        console.log('[ClassesTable] Manual refresh - bypassing cache');
        if (branchId) {
            store.fetchClassesByBranch(branchId, true);
        } else if (coachingCenterId) {
            store.fetchClassesByCoachingCenter(coachingCenterId, true);
        }
    }, [branchId, coachingCenterId, store]);

    // Show loading state only on initial load
    if (isLoading && rawClasses.length === 0) {
        return <TableSkeleton />;
    }

    if (classes.length === 0 && !isLoading) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {classes.length} {classes.length === 1 ? 'class' : 'classes'} found
                    {rawClasses.length !== classes.length && (
                        <span className="ml-1">(filtered from {rawClasses.length})</span>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader
                                label="Class Name"
                                field="class_name"
                                currentSort={sortConfig}
                                onSort={handleSort}
                            />
                            <TableHead>Branch</TableHead>
                            <SortableHeader
                                label="Subject"
                                field="subject"
                                currentSort={sortConfig}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="Grade"
                                field="grade_level"
                                currentSort={sortConfig}
                                onSort={handleSort}
                            />
                            <TableHead>Schedule</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.map((classItem) => {
                            const status = formatClassStatus(classItem.status);
                            const utilization = calculateUtilization(classItem);

                            return (
                                <TableRow key={classItem.id}>
                                    {/* Class Name */}
                                    <TableCell className="font-medium">
                                        <div>
                                            <div>{classItem.class_name}</div>
                                            {classItem.batch_name && (
                                                <div className="text-xs text-muted-foreground">
                                                    {classItem.batch_name}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Branch Name */}
                                    <TableCell>
                                        <div className="text-sm">
                                            {(classItem as any).branch?.name || 'N/A'}
                                        </div>
                                    </TableCell>

                                    {/* Subject */}
                                    <TableCell>{classItem.subject}</TableCell>

                                    {/* Grade Level */}
                                    <TableCell>
                                        <Badge variant="outline">{classItem.grade_level}</Badge>
                                    </TableCell>

                                    {/* Schedule */}
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 text-sm max-w-[200px]">
                                                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="text-muted-foreground truncate">
                                                            {formatClassSchedule(classItem)}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{formatClassSchedule(classItem)}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>

                                    {/* Capacity */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span>{getCapacityDisplay(classItem)}</span>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${utilization >= 90
                                                        ? 'bg-red-500'
                                                        : utilization >= 70
                                                            ? 'bg-orange-500'
                                                            : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${utilization}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        <Badge
                                            variant={
                                                status.color === 'green'
                                                    ? 'default'
                                                    : status.color === 'yellow'
                                                        ? 'secondary'
                                                        : status.color === 'red'
                                                            ? 'destructive'
                                                            : 'outline'
                                            }
                                        >
                                            {status.label}
                                        </Badge>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <ClassRowActions classItem={classItem} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}