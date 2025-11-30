/**
 * Branch Manager - Branch Students Management Page
 * 
 * Page for branch managers to manage students in their assigned branch
 * Features: 
 * - Branch selection if user has multiple branches
 * - Dashboard view with analytics
 * - List view with student table
 * - Enroll/Edit forms and filters
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BranchStudentsDashboard } from './_components/dashboard';
import { StudentsTable } from './_components/students-table';
import { BranchSelection } from './_components/branch-selection';
import { EnrollStudentDialog } from '../../../_components/branch-students/enroll-student-dialog';
import { EditEnrollmentDialog } from '../../../_components/branch-students/edit-enrollment-dialog';
import { StudentDetailsDialog } from '../../../_components/branch-students/student-details-dialog';
import { StudentFilters } from './_components/student-filters';
import { DeleteEnrollmentDialog } from '../../../_components/branch-students/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Plus,
    LayoutDashboard,
    List,
    ArrowLeft,
    Building2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { CoachingAPI, type CoachingBranch } from '@/lib/coaching';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: {
        id: string;
        name: string;
        owner_id: string;
        manager_id: string | null
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

/**
 * Branch Manager Students Page Component
 */
export default function BranchManagerStudentsPage() {
    const router = useRouter();

    // We'll read the `branch` param from the URL on the client using
    // `window.location.search` inside effects. Avoids `useSearchParams()`
    // which can trigger Next's CSR-bailout/prerender warnings.

    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [branchId, setBranchId] = useState<string | null>(null);
    const [branches, setBranches] = useState<BranchWithRole[]>([]);
    const [currentBranch, setCurrentBranch] = useState<BranchWithRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get branch students store actions
    const {
        fetchEnrollment,
        openDetailsDialog,
        openEditDialog,
        openDeleteDialog,
    } = useBranchStudentsStore();

    // Fetch accessible branches for current user
    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await CoachingAPI.getAllAccessibleBranches();

            if (result.success && result.data) {
                setBranches(result.data.branches);

                // If only one branch, auto-select it
                if (result.data.branches.length === 1) {
                    const singleBranch = result.data.branches[0];
                    setBranchId(singleBranch.id);
                    setCurrentBranch(singleBranch);
                }
                // If branch ID is in URL, set it (read from window.search at runtime)
                else {
                    try {
                        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                        const urlBranchId = params?.get('branch');

                        if (urlBranchId) {
                            const selectedBranch = result.data.branches.find(b => b.id === urlBranchId);
                            if (selectedBranch) {
                                setBranchId(selectedBranch.id);
                                setCurrentBranch(selectedBranch);
                            } else {
                                // Invalid branch ID in URL, clear it
                                setBranchId(null);
                                setCurrentBranch(null);
                            }
                        }
                    } catch (err) {
                        // ignore URL parsing errors
                    }
                }
            } else {
                setError(result.error || 'Failed to load branches');
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Handle branch selection
    const handleSelectBranch = (selectedBranchId: string) => {
        const selectedBranch = branches.find(b => b.id === selectedBranchId);
        if (selectedBranch) {
            setBranchId(selectedBranchId);
            setCurrentBranch(selectedBranch);
            // Update URL with branch ID
            router.push(`/manager/branch-students?branch=${selectedBranchId}`);
        }
    };

    // Handle back to branch selection
    const handleBackToSelection = () => {
        setBranchId(null);
        setCurrentBranch(null);
        router.push('/manager/branch-students');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-6 p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-48 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={fetchBranches} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // No branches state
    if (branches.length === 0) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center py-12">
                        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Branches Found</h2>
                        <p className="text-muted-foreground mb-6">
                            You don&apos;t have access to any branches yet.
                            You need to be assigned as a branch manager or own a coaching center.
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Branch Selection View (when no branch is selected and multiple branches exist)
    if (!branchId && branches.length > 1) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-6 p-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Select Branch</h1>
                        <p className="text-muted-foreground mt-1">
                            Choose a branch to manage its students
                        </p>
                    </div>

                    <BranchSelection
                        branches={branches}
                        onSelectBranch={handleSelectBranch}
                    />
                </div>
            </div>
        );
    }

    // Student Management View (branch is selected)
    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            {/* Page Header */}
            <div className="max-w-6xl mx-auto space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* Back button if multiple branches */}
                        {branches.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToSelection}
                                className="mb-2 -ml-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Branch Selection
                            </Button>
                        )}

                        <h1 className="text-3xl font-bold tracking-tight">Branch Students</h1>

                        {currentBranch && (
                            <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {currentBranch.coaching_center?.name} &bull; {currentBranch.name}
                                </span>
                            </div>
                        )}

                        <p className="text-muted-foreground mt-1">
                            Manage student enrollments, track attendance, and monitor payments for your branch
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

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')} className="w-full">
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

                    {/* Dashboard Tab */}
                    <TabsContent value="dashboard" className="mt-6">
                        <BranchStudentsDashboard branchId={branchId!} />
                    </TabsContent>

                    {/* List Tab */}
                    <TabsContent value="list" className="mt-6 space-y-4">
                        <StudentFilters branchId={branchId!} />
                        <StudentsTable branchId={branchId!} />
                    </TabsContent>
                </Tabs>

                {/* Dialogs */}
                <EnrollStudentDialog
                    open={isEnrollDialogOpen}
                    onOpenChange={setIsEnrollDialogOpen}
                    branchId={branchId!}
                />
                <EditEnrollmentDialog />
                <StudentDetailsDialog />
                <DeleteEnrollmentDialog />
            </div>
        </div>
    );
}
