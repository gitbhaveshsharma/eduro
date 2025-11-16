/**
 * Classes Table Component
 * 
 * Displays all branch classes in a sortable, filterable table
 * Features:
 * - Sorting by multiple columns
 * - Status badges with colors
 * - Quick actions (view, edit, delete)
 * - Capacity indicators
 * - Schedule display
 */

'use client';

import { useState } from 'react';
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
} from 'lucide-react';

/**
 * Table Header Cell with Sorting
 */
function SortableHeader({
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

    return (
        <TableHead className="cursor-pointer select-none" onClick={() => onSort(field)}>
            <div className="flex items-center gap-2">
                {label}
                <ArrowUpDown className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
        </TableHead>
    );
}

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
        // Delete dialog will handle the actual deletion
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
export function ClassesTable() {
    const searchResults = useSearchResults();
    const { search: isSearching } = useClassesLoading();
    const { currentSort } = useClassesUI();
    const store = useBranchClassesStore();

    const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: currentSort?.field || 'created_at',
        direction: currentSort?.direction || 'desc',
    });

    // Handle column sorting
    const handleSort = (field: string) => {
        const newDirection =
            sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';

        setSortConfig({ field, direction: newDirection });

        // Update store sort
        store.setSort({
            field: field as any,
            direction: newDirection,
        });
    };

    // Show loading state
    if (isSearching) {
        return <TableSkeleton />;
    }

    // Get classes from search results or show empty state
    const classes = searchResults?.classes || [];

    if (classes.length === 0) {
        return <EmptyState />;
    }

    return (
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

                                {/* Subject */}
                                <TableCell>{classItem.subject}</TableCell>

                                {/* Grade Level */}
                                <TableCell>
                                    <Badge variant="outline">{classItem.grade_level}</Badge>
                                </TableCell>

                                {/* Schedule */}
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            {formatClassSchedule(classItem)}
                                        </span>
                                    </div>
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
                                                className={`h-1.5 rounded-full transition-all ${utilization >= 90 ? 'bg-red-500' :
                                                        utilization >= 70 ? 'bg-orange-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: `${utilization}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    <Badge variant={
                                        status.color === 'green' ? 'default' :
                                            status.color === 'yellow' ? 'secondary' :
                                                status.color === 'red' ? 'destructive' : 'outline'
                                    }>
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
    );
}
