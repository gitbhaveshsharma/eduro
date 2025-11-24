/**
 * Branch Students Management Page
 * 
 * Main page for coaches to manage branch student enrollments with complete CRUD operations
 * Features: Dashboard, List view, Enroll/Edit forms, Filters, and Analytics
 * Optimized: Prevents duplicate API calls when switching tabs
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BranchStudentsDashboard } from './_components/dashboard';
import { StudentsTable } from './_components/students-table';
import { EnrollStudentDialog } from './_components/enroll-student-dialog';
import { EditEnrollmentDialog } from './_components/edit-enrollment-dialog';
import { StudentDetailsDialog } from './_components/student-details-dialog';
import { StudentFilters } from './_components/student-filters';
import { DeleteEnrollmentDialog } from './_components/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, LayoutDashboard, List, AlertCircle } from 'lucide-react';
import {
    useMyCoachingCenters,
    useMyCoachingCentersLoading,
    useMyCoachingCentersError,
    useCoachingStore
} from '@/lib/coaching';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

/**
 * Branch Students Page Component for Coaches
 * Manages students across ALL branches of the coaching center
 */
export default function BranchStudentsPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

    // Track if students have been fetched to prevent duplicate calls
    const studentsFetchedRef = useRef<string | null>(null);
    const isInitialLoadRef = useRef(true);

    // Get coaching centers data from store
    const myCoachingCenters = useMyCoachingCenters();
    const loading = useMyCoachingCentersLoading();
    const error = useMyCoachingCentersError();
    const { loadMyCoachingCenters } = useCoachingStore();

    // Get branch students store
    const {
        fetchCoachingCenterStudents,
        branchStudents,
        fetchEnrollment,
        openDetailsDialog,
        openEditDialog,
        openDeleteDialog,
    } = useBranchStudentsStore();

    /**
     * Load coaching centers on component mount
     * Only triggers once to prevent duplicate API calls
     */
    const loadCenters = useCallback(async () => {
        if (loading || hasAttemptedLoad) return;

        console.log('[BranchStudentsPage] Loading coaching centers...');
        await loadMyCoachingCenters();
        setHasAttemptedLoad(true);
    }, [loading, hasAttemptedLoad, loadMyCoachingCenters]);

    useEffect(() => {
        loadCenters();
    }, [loadCenters]);

    // Extract primary coaching center ID
    const coachingCenterId = myCoachingCenters?.[0]?.id ?? null;

    /**
     * Load students data once when coaching center ID is available
     * Prevents duplicate API calls when switching tabs
     */
    useEffect(() => {
        if (!coachingCenterId) return;

        // Check if we've already fetched for this coaching center
        if (studentsFetchedRef.current === coachingCenterId) {
            console.log('[BranchStudentsPage] 🚫 Students already fetched, skipping duplicate call');
            return;
        }

        // Check if we already have data in the store (from previous navigation)
        if (branchStudents.length > 0 && !isInitialLoadRef.current) {
            console.log('[BranchStudentsPage] 📦 Using cached student data from store');
            studentsFetchedRef.current = coachingCenterId;
            return;
        }

        // Fetch students data
        console.log('[BranchStudentsPage] 🔄 Fetching students for coaching center:', coachingCenterId);
        fetchCoachingCenterStudents(coachingCenterId);
        studentsFetchedRef.current = coachingCenterId;
        isInitialLoadRef.current = false;
    }, [coachingCenterId, fetchCoachingCenterStudents, branchStudents.length]);

    /**
     * Retry function for failed data loads
     */
    const handleRetry = useCallback(() => {
        setHasAttemptedLoad(false);
        studentsFetchedRef.current = null; // Reset fetch tracking
        isInitialLoadRef.current = true; // Reset initial load flag
        loadCenters();
    }, [loadCenters]);

    // Loading state - show fullscreen spinner until data is completely loaded
    if (loading || !coachingCenterId) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    title="Loading Coaching Center"
                    message="Please wait while we fetch your coaching center data..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    // Error state - show error message with retry option
    if (error) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-6 p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                            {error}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={handleRetry} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Success state - render full page content only when data is ready
    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            All Students - Coaching Center
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage student enrollments across all your branches, track attendance, and monitor payments
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsEnrollDialogOpen(true)}
                        size="lg"
                        className="gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Enroll Student
                    </Button>
                </div>

                {/* Main Content Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                        console.log('[BranchStudentsPage] 📑 Switching to tab:', value);
                        setActiveTab(value as 'dashboard' | 'list');
                    }}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 max-w-sm">
                        <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            All Students
                        </TabsTrigger>
                    </TabsList>

                    {/* Dashboard Tab - Keep mounted to preserve state */}
                    <TabsContent value="dashboard" className="mt-6" forceMount hidden={activeTab !== 'dashboard'}>
                        <BranchStudentsDashboard coachingCenterId={coachingCenterId} />
                    </TabsContent>

                    {/* List Tab - Keep mounted to preserve state */}
                    <TabsContent value="list" className="mt-6 space-y-4" forceMount hidden={activeTab !== 'list'}>
                        <StudentFilters coachingCenterId={coachingCenterId} />
                        <StudentsTable
                            coachingCenterId={coachingCenterId}
                            onViewStudent={async (studentId: string) => {
                                try {
                                    await fetchEnrollment(studentId);
                                    openDetailsDialog();
                                } catch (err) {
                                    console.error('Failed to load enrollment for details:', err);
                                }
                            }}
                            onEditStudent={async (studentId: string) => {
                                try {
                                    await fetchEnrollment(studentId);
                                    openEditDialog();
                                } catch (err) {
                                    console.error('Failed to load enrollment for edit:', err);
                                }
                            }}
                            onDeleteStudent={async (studentId: string) => {
                                try {
                                    await fetchEnrollment(studentId);
                                    openDeleteDialog();
                                } catch (err) {
                                    console.error('Failed to load enrollment for delete:', err);
                                }
                            }}
                        />
                    </TabsContent>
                </Tabs>

                {/* Dialog Components */}
                <EnrollStudentDialog
                    open={isEnrollDialogOpen}
                    onOpenChange={setIsEnrollDialogOpen}
                />
                <EditEnrollmentDialog />
                <StudentDetailsDialog />
                <DeleteEnrollmentDialog />
            </div>
        </div>
    );
}
