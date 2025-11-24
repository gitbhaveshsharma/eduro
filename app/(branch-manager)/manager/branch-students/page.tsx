/**
 * Branch Manager - Branch Students Management Page
 * 
 * Page for branch managers to manage students in their assigned branch
 * Features: Dashboard, List view, Enroll/Edit forms, Filters, and Analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BranchStudentsDashboard } from './_components/dashboard';
import { StudentsTable } from './_components/students-table';
import { EnrollStudentDialog } from '../../../(coach-lms)/coach/branch-students/_components/enroll-student-dialog';
import { EditEnrollmentDialog } from '../../../(coach-lms)/coach/branch-students/_components/edit-enrollment-dialog';
import { StudentDetailsDialog } from '../../../(coach-lms)/coach/branch-students/_components/student-details-dialog';
import { StudentFilters } from './_components/student-filters';
import { DeleteEnrollmentDialog } from '../../../(coach-lms)/coach/branch-students/_components/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

/**
 * Branch Manager Students Page Component
 */
export default function BranchManagerStudentsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [branchId, setBranchId] = useState<string | null>(null);

    // Get branch students store actions
    const {
        fetchEnrollment,
        openDetailsDialog,
        openEditDialog,
        openDeleteDialog,
    } = useBranchStudentsStore();

    // TODO: Get branch manager's assigned branch from user session/context
    // For now, you'll need to implement this based on your auth system
    useEffect(() => {
        // Example: Fetch branch manager's branch ID from auth context
        // const { data: managerData } = await getManagerProfile();
        // setBranchId(managerData.branch_id);

        // Placeholder - you'll need to replace this
        // setBranchId('your-branch-id-here');
    }, []);

    if (!branchId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Loading...</h2>
                    <p className="text-muted-foreground">Fetching branch information</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            {/* Page Header */}
            <div className="max-w-6xl mx-auto space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Branch Students</h1>
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
                        <BranchStudentsDashboard branchId={branchId} />
                    </TabsContent>

                    {/* List Tab */}
                    <TabsContent value="list" className="mt-6 space-y-4">
                        <StudentFilters branchId={branchId} />
                        <StudentsTable branchId={branchId} />
                    </TabsContent>
                </Tabs>

                {/* Dialogs */}
                <EnrollStudentDialog
                    open={isEnrollDialogOpen}
                    onOpenChange={setIsEnrollDialogOpen}
                    branchId={branchId}
                />
                <EditEnrollmentDialog />
                <StudentDetailsDialog />
                <DeleteEnrollmentDialog />
            </div>
        </div>
    );
}
