/**
 * Assignments Header Component
 * 
 * Header component for the assignments page
 * Displays title, count, view toggle, and create button
 * Reusable for different user roles (teacher, student, coach)
 */

'use client';

import { Button } from '@/components/ui/button';
import { Grid3x3, List, Plus } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

export interface AssignmentsHeaderProps {
    /** Total number of assignments to display */
    totalAssignments: number;
    /** Current view mode */
    viewMode: ViewMode;
    /** Callback when view mode changes */
    onViewModeChange: (mode: ViewMode) => void;
    /** Optional title override (default: "Assignments") */
    title?: string;
    /** Whether to show the create button */
    showCreateButton?: boolean;
    /** Callback when create button is clicked */
    onCreateClick?: () => void;
    /** Whether create action is loading */
    isCreating?: boolean;
}

export function AssignmentsHeader({
    totalAssignments,
    viewMode,
    onViewModeChange,
    title = 'Assignments',
    showCreateButton = false,
    onCreateClick,
    isCreating = false,
}: AssignmentsHeaderProps) {
    return (
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-1">
                    {totalAssignments} {totalAssignments === 1 ? 'assignment' : 'assignments'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('grid')}
                        className="px-3 h-8"
                    >
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('list')}
                        className="px-3 h-8"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>

                {/* Create Button */}
                {showCreateButton && onCreateClick && (
                    <Button
                        onClick={onCreateClick}
                        disabled={isCreating}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Assignment</span>
                        <span className="sm:hidden">Create</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
