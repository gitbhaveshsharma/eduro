/**
 * Branch Students Management Page
 * 
 * Main page for coaches to manage branch student enrollments with complete CRUD operations
 * Features: Dashboard, List view, Enroll/Edit forms, Filters, and Analytics
 * 
 * OPTIMIZATION: Uses useCoachContext() from layout instead of loading coaching centers.
 * This prevents duplicate API calls since layout already loads the data.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { BranchStudentsDashboard } from '../../../_components/branch-students/dashboard';
import { StudentsTable } from '../../../_components/branch-students/students-table';
import { EnrollStudentDialog } from '../../../_components/branch-students/enroll-student-dialog';
import { EditEnrollmentDialog } from '../../../_components/branch-students/edit-enrollment-dialog';
import { StudentDetailsDialog } from '../../../_components/branch-students/student-details-dialog';
import { StudentFilters } from '../../../_components/branch-students/student-filters';
import { DeleteEnrollmentDialog } from '../../../_components/branch-students/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, LayoutDashboard, List, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { Card, CardContent } from '@/components/ui/card';
import { useCoachContext } from '../layout';

/**
 * Branch Students Page Component for Coaches
 * Manages students across ALL branches of the coaching center
 */
export default function BranchStudentsPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

    // Get coaching center from layout context (already loaded by layout)
    const { coachingCenterId, isLoading, error, refetch } = useCoachContext();

    // Track if students have been fetched to prevent duplicate calls
    const studentsFetchedRef = useRef<string | null>(null);

    // Get branch students store - use stable selector
    const fetchCoachingCenterStudents = useBranchStudentsStore((state) => state.fetchCoachingCenterStudents);
    const branchStudents = useBranchStudentsStore((state) => state.branchStudents);
    const fetchEnrollment = useBranchStudentsStore((state) => state.fetchEnrollment);
    const openDetailsDialog = useBranchStudentsStore((state) => state.openDetailsDialog);
    const openEditDialog = useBranchStudentsStore((state) => state.openEditDialog);
    const openDeleteDialog = useBranchStudentsStore((state) => state.openDeleteDialog);

    /**
     * Load students data once when coaching center ID is available
     * Prevents duplicate API calls when switching tabs or re-rendering
     */
    useEffect(() => {
        if (!coachingCenterId) return;

        // Check if we've already fetched for this coaching center
        if (studentsFetchedRef.current === coachingCenterId) {
            return;
        }

        // Check if we already have data in the store (from previous navigation)
        if (branchStudents.length > 0) {
            studentsFetchedRef.current = coachingCenterId;
            return;
        }

        // Fetch students data
        console.log('[BranchStudentsPage] 🔄 Fetching students for coaching center:', coachingCenterId);
        fetchCoachingCenterStudents(coachingCenterId);
        studentsFetchedRef.current = coachingCenterId;
    }, [coachingCenterId, fetchCoachingCenterStudents, branchStudents.length]);

    // Loading state - layout handles main loading, but show if context still loading
    if (isLoading || !coachingCenterId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner
                    title="Loading Students"
                    message="Please wait while we fetch student data..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    // Error state - show error message with retry option
    if (error) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                        {error}
                    </AlertDescription>
                </Alert>
                <Button onClick={refetch} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    // Success state - render full page content only when data is ready
    return (
        <div className="space-y-6">
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
                onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')}
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
                    <Card className="p-4">
                        <CardContent className="p-0">
                            <StudentFilters coachingCenterId={coachingCenterId} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
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
                        </CardContent>
                    </Card>
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
    );
}