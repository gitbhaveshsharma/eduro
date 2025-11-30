/**
 * Classes Table Component - FIXED VERSION
 * 
 * Supports two modes:
 * 1. Branch mode (branchId) - Shows only classes for a specific branch
 * 2. Coaching Center mode (coachingCenterId) - Shows all classes across branches
 * 
 * Key fixes:
 * 1. Uses appropriate data source based on context
 * 2. Uses cached results on subsequent renders
 * 3. Automatically updates when classes are created/updated/deleted
 */

'use client';

import { useEffect, useState, memo, useCallback } from 'react';
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
    useSearchResults,
    useClassesLoading,
    useClassesUI,
    useClassesByBranch,
    useClassesByCoachingCenter,
    useBranchClassesStore,
    formatClassSchedule,
    getCapacityDisplay,
    formatClassStatus,
    calculateUtilization,
    type BranchClass,
    type PublicBranchClass,
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
 * Main Classes Table Component
 */
export function ClassesTable({ branchId, coachingCenterId }: ClassesTableProps) {
    const searchResults = useSearchResults();
    const { search: isSearching, fetchClasses: isLoading } = useClassesLoading();
    const { currentSort, currentFilters, currentPagination } = useClassesUI();
    const store = useBranchClassesStore();

    // Get classes from appropriate source based on context
    const branchClasses = useClassesByBranch(branchId || null);
    const coachingCenterClasses = useClassesByCoachingCenter(coachingCenterId || null);

    // Determine which classes to display
    // Priority: searchResults (when actively filtering) > context-specific classes
    const hasActiveSearch = searchResults && (
        currentFilters.search_query ||
        currentFilters.status ||
        currentFilters.grade_level ||
        currentFilters.subject ||
        currentFilters.has_available_seats
    );

    const contextClasses = branchId 
        ? branchClasses 
        : coachingCenterId 
            ? coachingCenterClasses 
            : [];

    // Use search results when filtering, otherwise use context-specific classes
    const classes = hasActiveSearch 
        ? (searchResults?.classes || []) 
        : contextClasses;

    const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: currentSort?.field || 'created_at',
        direction: currentSort?.direction || 'desc',
    });

    // ✅ FIX: Initialize data fetch based on context
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!hasInitialized) {
            console.log('🔍 ClassesTable: Initial load');
            
            if (branchId) {
                // Branch manager context - fetch branch-specific classes
                store.fetchClassesByBranch(branchId, false);
                store.setFilters({ branch_id: branchId });
            } else if (coachingCenterId) {
                // Coach context - fetch coaching center classes
                store.fetchClassesByCoachingCenter(coachingCenterId, false);
                store.setFilters({ coaching_center_id: coachingCenterId });
            } else {
                // Fallback to search (for generic usage)
                store.searchClasses(currentFilters, currentSort, currentPagination, false);
            }
            
            setHasInitialized(true);
        }
    }, [hasInitialized, branchId, coachingCenterId, store, currentFilters, currentSort, currentPagination]);

    // ✅ When filters/sort/pagination change AND we have active search, trigger new search
    useEffect(() => {
        if (hasInitialized && hasActiveSearch) {
            console.log('🔍 Filters/Sort/Pagination changed - searching');
            store.searchClasses(currentFilters, currentSort, currentPagination, false);
        }
    }, [currentFilters, currentSort, currentPagination, hasInitialized, hasActiveSearch, store]);

    // Handle column sorting
    const handleSort = (field: string) => {
        const newDirection =
            sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';

        setSortConfig({ field, direction: newDirection });

        // Update store sort (this will trigger the useEffect above)
        store.setSort({
            field: field as any,
            direction: newDirection,
        });
    };

    // Manual refresh function
    const handleRefresh = () => {
        console.log('🔄 Manual refresh - bypassing cache');
        if (branchId) {
            store.fetchClassesByBranch(branchId, true);
        } else if (coachingCenterId) {
            store.fetchClassesByCoachingCenter(coachingCenterId, true);
        } else {
            store.searchClasses(currentFilters, currentSort, currentPagination, true);
        }
    };

    // Show loading state only on initial load
    const isLoadingData = isSearching || isLoading;
    if (isLoadingData && classes.length === 0) {
        return <TableSkeleton />;
    }

    if (classes.length === 0 && !isLoadingData) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {classes.length} classes found
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoadingData}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
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