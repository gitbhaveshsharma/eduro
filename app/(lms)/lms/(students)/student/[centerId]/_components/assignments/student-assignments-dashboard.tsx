/**
 * Student Assignments Dashboard Component
 * 
 * Main dashboard for students to view and manage their assignments.
 * Shows published assignments from enrolled classes with submission status.
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, X, LayoutGrid, List, RefreshCw } from 'lucide-react';

// Toast notifications
import {
    showSuccessToast,
} from '@/lib/toast';

// Assignment store hooks
import {
    useAssignmentStore,
    useAssignments,
    useAssignmentLoading,
    useAssignmentError,
    useCurrentSubmission,
} from '@/lib/branch-system/stores/assignment.store';

// Types
import { AssignmentStatus } from '@/lib/branch-system/assignment';

// Child components
import { StudentAssignmentsFilters } from './student-assignments-filters';
import { StudentAssignmentCard } from './student-assignment-card';
import { StudentAssignmentList } from './student-assignment-list';

type ViewMode = 'grid' | 'list';
type StatusFilterType = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

export interface StudentAssignmentsDashboardProps {
    centerId: string;
    studentId: string;
    enrolledClassIds: string[];
}

export function StudentAssignmentsDashboard({
    centerId,
    studentId,
    enrolledClassIds,
}: StudentAssignmentsDashboardProps) {
    const router = useRouter();

    // ============================================================
    // STORE HOOKS
    // ============================================================
    const assignments = useAssignments();
    const loading = useAssignmentLoading();
    const error = useAssignmentError();
    const currentSubmission = useCurrentSubmission();

    const {
        fetchAssignments,
        fetchStudentSubmission,
        clearError,
    } = useAssignmentStore();

    // ============================================================
    // LOCAL STATE
    // ============================================================
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ============================================================
    // DATA FETCHING
    // ============================================================
    const fetchStudentAssignments = useCallback(async (forceRefresh = false) => {
        if (enrolledClassIds.length === 0) return;

        // Fetch published assignments for enrolled classes with student submissions
        await fetchAssignments({
            status: AssignmentStatus.PUBLISHED,
            class_id: classFilter !== 'all' ? classFilter : undefined,
            student_id: studentId, // Include student_id to fetch submissions
        }, forceRefresh);
    }, [enrolledClassIds, classFilter, studentId, fetchAssignments]);

    // Fetch data on mount
    useEffect(() => {
        fetchStudentAssignments();
    }, [fetchStudentAssignments]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchStudentAssignments(true);
        setIsRefreshing(false);
        showSuccessToast('Assignments refreshed');
    };

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    const getFriendlyErrorMessage = (error: string): string => {
        const lowerError = error.toLowerCase();
        if (lowerError.includes('unauthorized')) return "You don't have permission to view these assignments.";
        if (lowerError.includes('not found')) return "Assignments not found.";
        return error.length > 100 ? "An unexpected error occurred." : error;
    };

    // Check if due date is overdue
    const isOverdue = (dueDate: string): boolean => {
        return new Date(dueDate) < new Date();
    };

    // Check if due date is coming soon (within 2 days)
    const isDueSoon = (dueDate: string): boolean => {
        const due = new Date(dueDate);
        const now = new Date();
        const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 2;
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    // Filter assignments for enrolled classes and published status only
    const studentAssignments = useMemo(() => {
        return assignments.filter(a =>
            enrolledClassIds.includes(a.class_id) &&
            a.status === AssignmentStatus.PUBLISHED
        );
    }, [assignments, enrolledClassIds]);

    // Get available classes from assignments
    const availableClasses = useMemo(() => {
        const classMap = new Map<string, string>();
        studentAssignments.forEach(a => {
            if (a.class_id && a.class?.class_name) {
                classMap.set(a.class_id, a.class.class_name);
            }
        });
        return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
    }, [studentAssignments]);

    // Apply filters
    const filteredAssignments = useMemo(() => {
        let filtered = studentAssignments;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.description?.toLowerCase().includes(query) ||
                a.class?.class_name?.toLowerCase().includes(query)
            );
        }

        // Class filter
        if (classFilter !== 'all') {
            filtered = filtered.filter(a => a.class_id === classFilter);
        }

        // Status filter (student submission status)
        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => {
                const submission = a.student_submission;
                const overdue = a.due_date && isOverdue(a.due_date);

                switch (statusFilter) {
                    case 'pending':
                        return !submission && !overdue;
                    case 'submitted':
                        return submission && submission.grading_status === 'NOT_GRADED';
                    case 'graded':
                        return submission && submission.grading_status === 'MANUAL_GRADED';
                    case 'overdue':
                        return !submission && overdue;
                    default:
                        return true;
                }
            });
        }

        // Sort by due date (nearest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.due_date).getTime();
            const dateB = new Date(b.due_date).getTime();
            return dateA - dateB;
        });
    }, [studentAssignments, searchQuery, statusFilter, classFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = studentAssignments.length;
        const pending = studentAssignments.filter(a => !a.student_submission && !isOverdue(a.due_date)).length;
        const submitted = studentAssignments.filter(a => a.student_submission && a.student_submission.grading_status === 'NOT_GRADED').length;
        const graded = studentAssignments.filter(a => a.student_submission?.grading_status === 'MANUAL_GRADED').length;
        const overdue = studentAssignments.filter(a => !a.student_submission && isOverdue(a.due_date)).length;

        return { total, pending, submitted, graded, overdue };
    }, [studentAssignments]);

    const friendlyErrorMessage = useMemo(() => error ? getFriendlyErrorMessage(error) : null, [error]);

    // ============================================================
    // EVENT HANDLERS
    // ============================================================
    const handleViewDetails = (assignmentId: string) => {
        router.push(`/lms/student/${centerId}/assignments/${assignmentId}`);
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (loading.list) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <div className="flex items-start gap-3 w-full">
                        <AlertDescription className="flex-1">{friendlyErrorMessage}</AlertDescription>
                        <button onClick={clearError} className="shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </Alert>
            )}

            {/* Header */}
            <div className="flex flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Assignments</h2>
                    <p className="text-muted-foreground">
                        {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-10 w-10"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
                    <p className="text-xs text-muted-foreground">Graded</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
            </div>

            {/* Empty State */}
            {studentAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mt-4">No Assignments Yet</h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">
                        You don&apos;t have any assignments yet. Assignments will appear here when your teachers publish them.
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <StudentAssignmentsFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        classFilter={classFilter}
                        onClassChange={setClassFilter}
                        availableClasses={availableClasses}
                    />

                    {/* Assignment List */}
                    {filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 border rounded-xl bg-card">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <h3 className="text-md font-medium mt-3">No matching assignments</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Try adjusting your filters
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAssignments.map((assignment) => (
                                <StudentAssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    studentId={studentId}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAssignments.map((assignment) => (
                                <StudentAssignmentList
                                    key={assignment.id}
                                    assignment={assignment}
                                    studentId={studentId}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
