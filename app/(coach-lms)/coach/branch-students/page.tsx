/**
 * Branch Students Management Page
 * 
 * Main page for coaches to manage branch student enrollments with complete CRUD operations
 * Features: Dashboard, List view, Enroll/Edit forms, Filters, and Analytics
 */

'use client';

import { useState } from 'react';
import { BranchStudentsDashboard } from './_components/dashboard';
import { StudentsTable } from './_components/students-table';
import { EnrollStudentDialog } from './_components/enroll-student-dialog';
import { EditEnrollmentDialog } from './_components/edit-enrollment-dialog';
import { StudentDetailsDialog } from './_components/student-details-dialog';
import { StudentFilters } from './_components/student-filters';
import { DeleteEnrollmentDialog } from './_components/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, List } from 'lucide-react';

/**
 * Branch Students Page Component
 */
export default function BranchStudentsPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Students</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage student enrollments, track attendance, and monitor payments
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                        <List className="h-4 w-4" />
                        All Students
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <BranchStudentsDashboard />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="space-y-6">
                    <StudentFilters />
                    <StudentsTable />
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
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
