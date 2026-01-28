/**
 * Student Quizzes Dashboard Component
 * 
 * Main dashboard for students to view and manage their quizzes.
 * Shows quizzes from enrolled classes with attempt status and scores.
 * 
 * IMPORTANT: Only shows quizzes for the current coaching center (centerId)
 * If student is enrolled in multiple centers, each center shows its own quizzes
 */

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileQuestion, X, LayoutGrid, List, RefreshCw } from 'lucide-react';

// Toast notifications
import {
    showSuccessToast,
    showErrorToast,
} from '@/lib/toast';

// Quiz store hooks
import {
    useQuizStore,
    useQuizzes,
    useQuizLoading,
    useQuizError,
} from '@/lib/branch-system/stores/quiz.store';

// Classes store hooks
import {
    useBranchClassesStore,
    useEnrollmentsByCenter,
    useClassesLoading,
} from '@/lib/branch-system/stores/branch-classes.store';

// Types and utils
import type { Quiz, QuizAttempt } from '@/lib/branch-system/types/quiz.types';
import {
    getQuizAvailabilityStatus,
    determineStudentQuizStatus,
    StudentQuizStatus,
} from '@/lib/branch-system/quiz';

// Child components
import { StudentQuizzesFilters, type StudentQuizStatusFilter } from './student-quizzes-filters';
import { StudentQuizCard } from './student-quiz-card';
import { StudentQuizListItem } from './student-quiz-list-item';

type ViewMode = 'grid' | 'list';

export interface StudentQuizzesDashboardProps {
    centerId: string;
    studentId: string;
    enrolledClassIds: string[];
}

export function StudentQuizzesDashboard({
    centerId,
    studentId,
    enrolledClassIds,
}: StudentQuizzesDashboardProps) {
    const router = useRouter();

    // ============================================================
    // STORE HOOKS
    // ============================================================
    const quizzes = useQuizzes();
    const loading = useQuizLoading();
    const error = useQuizError();

    const {
        fetchQuizzes,
        fetchStudentAttemptsForQuizzes,
        getAttemptsByQuizId,
        clearError,
    } = useQuizStore();

    const { fetchEnrollmentsByCenter } = useBranchClassesStore();
    const enrolledClasses = useEnrollmentsByCenter(studentId, centerId);
    const { upcomingClasses: classesLoading } = useClassesLoading();

    // ============================================================
    // LOCAL STATE
    // ============================================================
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StudentQuizStatusFilter>('all');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ============================================================
    // DATA FETCHING
    // ============================================================

    // Fetch enrolled classes on mount
    useEffect(() => {
        if (studentId && centerId) {
            fetchEnrollmentsByCenter(studentId, centerId);
        }
    }, [studentId, centerId, fetchEnrollmentsByCenter]);

    // Fetch quizzes for enrolled classes
    const fetchStudentQuizzes = useCallback(async (forceRefresh = false) => {
        if (enrolledClassIds.length === 0) return;

        // Fetch active quizzes for this center's enrolled classes
        // Note: forceRefresh doesn't affect the store's fetchQuizzes - it always fetches fresh data
        await fetchQuizzes({
            is_active: true,
            coaching_center_id: centerId,
        });
    }, [enrolledClassIds, centerId, fetchQuizzes]);

    // Fetch quizzes on mount and when dependencies change
    useEffect(() => {
        fetchStudentQuizzes();
    }, [fetchStudentQuizzes]);

    // Fetch student attempts for all quizzes using store batch method
    useEffect(() => {
        if (!studentId || quizzes.length === 0) return;

        const studentQuizzes = quizzes.filter(q => enrolledClassIds.includes(q.class_id));
        const quizIds = studentQuizzes.map(q => q.id);

        if (quizIds.length > 0) {
            fetchStudentAttemptsForQuizzes(quizIds, studentId);
        }
    }, [quizzes.length, studentId, enrolledClassIds.length, fetchStudentAttemptsForQuizzes]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchStudentQuizzes(true);
        setIsRefreshing(false);
        showSuccessToast('Quizzes refreshed');
    };

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    const getFriendlyErrorMessage = (errorMsg: string): string => {
        const lowerError = errorMsg.toLowerCase();
        if (lowerError.includes('unauthorized')) return "You don't have permission to view these quizzes.";
        if (lowerError.includes('not found')) return "Quizzes not found.";
        return errorMsg.length > 100 ? "An unexpected error occurred." : errorMsg;
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    // Filter quizzes for enrolled classes only
    const studentQuizzes = useMemo(() => {
        return quizzes.filter(q =>
            enrolledClassIds.includes(q.class_id) && q.is_active
        );
    }, [quizzes, enrolledClassIds]);

    // Get available classes from quizzes
    const availableClasses = useMemo(() => {
        const classMap = new Map<string, string>();
        studentQuizzes.forEach(q => {
            if (q.class_id && q.class?.class_name) {
                classMap.set(q.class_id, q.class.class_name);
            }
        });
        return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
    }, [studentQuizzes]);

    // Get enrolled class data for filter pills
    const enrolledClassData = useMemo(() => {
        return enrolledClasses || [];
    }, [enrolledClasses]);

    // Apply filters
    const filteredQuizzes = useMemo(() => {
        let filtered = studentQuizzes;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(q =>
                q.title.toLowerCase().includes(query) ||
                q.description?.toLowerCase().includes(query) ||
                q.class?.class_name?.toLowerCase().includes(query)
            );
        }

        // Class filter
        if (classFilter !== 'all') {
            filtered = filtered.filter(q => q.class_id === classFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(q => {
                const attempts = getAttemptsByQuizId(q.id, studentId);
                const latestAttempt = attempts.length > 0
                    ? [...attempts].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
                    : null;
                const studentStatus = determineStudentQuizStatus(latestAttempt, q);
                const availability = getQuizAvailabilityStatus(q.available_from, q.available_to);

                switch (statusFilter) {
                    case 'available':
                        return availability.status === 'active' &&
                            (studentStatus === StudentQuizStatus.NOT_STARTED || studentStatus === StudentQuizStatus.IN_PROGRESS);
                    case 'in_progress':
                        return studentStatus === StudentQuizStatus.IN_PROGRESS;
                    case 'completed':
                        return studentStatus === StudentQuizStatus.COMPLETED ||
                            studentStatus === StudentQuizStatus.PASSED ||
                            studentStatus === StudentQuizStatus.FAILED ||
                            studentStatus === StudentQuizStatus.TIMED_OUT;
                    case 'passed':
                        return studentStatus === StudentQuizStatus.PASSED;
                    case 'failed':
                        return studentStatus === StudentQuizStatus.FAILED;
                    case 'upcoming':
                        return availability.status === 'upcoming';
                    case 'ended':
                        return availability.status === 'ended';
                    default:
                        return true;
                }
            });
        }

        // Sort by available_from (most recent first)
        return filtered.sort((a, b) =>
            new Date(b.available_from).getTime() - new Date(a.available_from).getTime()
        );
    }, [studentQuizzes, searchQuery, statusFilter, classFilter, getAttemptsByQuizId, studentId]);

    // Calculate stats
    const stats = useMemo(() => {
        let total = 0;
        let available = 0;
        let inProgress = 0;
        let completed = 0;
        let passed = 0;

        studentQuizzes.forEach(quiz => {
            total++;
            const attempts = getAttemptsByQuizId(quiz.id, studentId);
            const latestAttempt = attempts.length > 0
                ? [...attempts].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
                : null;
            const studentStatus = determineStudentQuizStatus(latestAttempt, quiz);
            const availability = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

            if (availability.status === 'active' && studentStatus === StudentQuizStatus.NOT_STARTED) {
                available++;
            }
            if (studentStatus === StudentQuizStatus.IN_PROGRESS) {
                inProgress++;
            }
            if ([StudentQuizStatus.COMPLETED, StudentQuizStatus.PASSED, StudentQuizStatus.FAILED, StudentQuizStatus.TIMED_OUT].includes(studentStatus)) {
                completed++;
            }
            if (studentStatus === StudentQuizStatus.PASSED) {
                passed++;
            }
        });

        return { total, available, inProgress, completed, passed };
    }, [studentQuizzes, getAttemptsByQuizId, studentId]);

    const friendlyErrorMessage = useMemo(() =>
        error?.message ? getFriendlyErrorMessage(error.message) : null,
        [error]
    );

    // ============================================================
    // EVENT HANDLERS
    // ============================================================
    const handleViewDetails = (quizId: string) => {
        router.push(`/lms/student/${centerId}/quizzes/${quizId}`);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setClassFilter('all');
    };

    const handleClassFilterChange = (classId: string | null) => {
        setClassFilter(classId || 'all');
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (loading.quizzes && studentQuizzes.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-11 w-32 rounded-full" />
                    ))}
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
            {error?.message && (
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
                    <h2 className="text-2xl font-bold tracking-tight">My Quizzes</h2>
                    <p className="text-muted-foreground">
                        {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} found
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
                    <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-emerald-600">{stats.passed}</p>
                    <p className="text-xs text-muted-foreground">Passed</p>
                </div>
            </div>

            {/* Empty State */}
            {studentQuizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
                    <FileQuestion className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mt-4">No Quizzes Yet</h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">
                        You don&apos;t have any quizzes yet. Quizzes will appear here when your teachers create them.
                    </p>
                </div>
            ) : (
                <>


                    {/* Filters */}
                    <StudentQuizzesFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        classFilter={classFilter}
                        onClassFilterChange={setClassFilter}
                        availableClasses={availableClasses}
                        onClearFilters={handleClearFilters}
                    />

                    {/* Quiz List */}
                    {filteredQuizzes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 border rounded-xl bg-card">
                            <FileQuestion className="h-10 w-10 text-muted-foreground" />
                            <h3 className="text-md font-medium mt-3">No matching quizzes</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Try adjusting your filters
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredQuizzes.map((quiz) => (
                                <StudentQuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    studentAttempts={getAttemptsByQuizId(quiz.id, studentId)}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredQuizzes.map((quiz) => (
                                <StudentQuizListItem
                                    key={quiz.id}
                                    quiz={quiz}
                                    studentAttempts={getAttemptsByQuizId(quiz.id, studentId)}
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
