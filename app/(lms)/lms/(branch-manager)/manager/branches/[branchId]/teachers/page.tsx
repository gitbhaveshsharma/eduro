/**
 * Branch Manager - Branch Teachers Page
 * 
 * Manage teachers for a specific branch with complete CRUD operations
 * Features: Dashboard, List view, Assign/Edit forms, Filters, and Analytics
 * 
 * OPTIMIZATION: Uses useBranchContext() from layout instead of loading branch data.
 * This prevents duplicate API calls since layout already loads the data.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useBranchContext } from '../layout';
import { BranchTeachersDashboard } from '../../../../../_components/branch-teachers/dashboard';
import { TeachersTable } from '../../../../../_components/branch-teachers/teachers-table';
import { AssignTeacherDialog } from '../../../../../_components/branch-teachers/assign-teacher-dialog';
import { EditTeacherDialog } from '../../../../../_components/branch-teachers/edit-teacher-dialog';
import { TeacherDetailsDialog } from '../../../../../_components/branch-teachers/teacher-details-dialog';
import { TeacherFilters } from '../../../../../_components/branch-teachers/teacher-filters';
import { DeleteAssignmentDialog } from '../../../../../_components/branch-teachers/delete-assignment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, LayoutDashboard, List, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Branch Teachers Page Component for Branch Managers
 * Manages teachers for a SPECIFIC branch (not all branches like coach page)
 */
export default function BranchTeachersPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    // Get branch from layout context (already loaded by layout)
    const { branch, isLoading, error, refetch } = useBranchContext();

    // Track if teachers have been fetched to prevent duplicate calls
    const teachersFetchedRef = useRef<string | null>(null);

    // Get branch teachers store - use stable selector
    const fetchBranchTeachers = useBranchTeacherStore((state) => state.fetchBranchTeachers);
    const branchTeachers = useBranchTeacherStore((state) => state.branchTeachers);
    const fetchAssignment = useBranchTeacherStore((state) => state.fetchAssignment);
    const openDetailsDialog = useBranchTeacherStore((state) => state.openDetailsDialog);
    const openEditDialog = useBranchTeacherStore((state) => state.openEditDialog);
    const openDeleteDialog = useBranchTeacherStore((state) => state.openDeleteDialog);

    /**
     * Load teachers data once when branch ID is available
     * Prevents duplicate API calls when switching tabs or re-rendering
     */
    useEffect(() => {
        if (!branch?.id) return;

        // Check if we've already fetched for this branch
        if (teachersFetchedRef.current === branch.id) {
            return;
        }

        // Check if we already have data in the store (from previous navigation)
        if (branchTeachers.length > 0) {
            teachersFetchedRef.current = branch.id;
            return;
        }

        // Fetch teachers data for this specific branch
        console.log('[BranchTeachersPage] 🔄 Fetching teachers for branch:', branch.id);
        fetchBranchTeachers(branch.id);
        teachersFetchedRef.current = branch.id;
    }, [branch?.id, fetchBranchTeachers, branchTeachers.length]);

    // Loading state - layout handles main loading, but show if context still loading
    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        );
    }

    // Error state - show error message with retry option
    if (error) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <Alert variant="destructive">
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
                        Branch Teachers
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage teacher assignments for {branch.name}
                    </p>
                </div>

                <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    size="lg"
                    className="gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Assign Teacher
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
                        Teachers
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab - Keep mounted to preserve state */}
                <TabsContent value="dashboard" className="mt-6" forceMount hidden={activeTab !== 'dashboard'}>

                    <BranchTeachersDashboard branchId={branch.id} />

                </TabsContent>

                {/* List Tab - Keep mounted to preserve state */}
                <TabsContent value="list" className="mt-6 space-y-4" forceMount hidden={activeTab !== 'list'}>
                    <Card className="p-4">
                        <CardContent className="p-0">
                            <TeacherFilters branchId={branch.id} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <TeachersTable
                                branchId={branch.id}
                                onViewTeacher={async (assignmentId: string) => {
                                    try {
                                        await fetchAssignment(assignmentId);
                                        openDetailsDialog();
                                    } catch (err) {
                                        console.error('Failed to load teacher for details:', err);
                                    }
                                }}
                                onEditTeacher={async (assignmentId: string) => {
                                    try {
                                        await fetchAssignment(assignmentId);
                                        openEditDialog();
                                    } catch (err) {
                                        console.error('Failed to load teacher for edit:', err);
                                    }
                                }}
                                onDeleteTeacher={async (assignmentId: string) => {
                                    try {
                                        await fetchAssignment(assignmentId);
                                        openDeleteDialog();
                                    } catch (err) {
                                        console.error('Failed to load teacher for delete:', err);
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialog Components */}
            <AssignTeacherDialog
                open={isAssignDialogOpen}
                onOpenChange={setIsAssignDialogOpen}
                branchId={branch.id}
            />
            <EditTeacherDialog />
            <TeacherDetailsDialog />
            <DeleteAssignmentDialog />
        </div>
    );
}
