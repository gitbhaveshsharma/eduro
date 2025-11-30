/**
 * Branch Manager - Branch Students Page
 * 
 * Manage student enrollments for a specific branch
 * Features: Table view, filters, enroll/edit/delete dialogs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBranchContext } from '../layout';
import { StudentsTable } from '@/app/(lms)/lms/_components/branch-students/students-table';
import { StudentFilters } from '@/app/(lms)/lms/_components/branch-students/student-filters';
import { EnrollStudentDialog } from '@/app/(lms)/lms/_components/branch-students/enroll-student-dialog';
import { EditEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/edit-enrollment-dialog';
import { StudentDetailsDialog } from '@/app/(lms)/lms/_components/branch-students/student-details-dialog';
import { DeleteEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/delete-enrollment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users } from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

export default function BranchStudentsPage() {
    const { branch, isLoading } = useBranchContext();
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

    const {
        fetchBranchStudents,
        fetchEnrollment,
        openDetailsDialog,
        openEditDialog,
        openDeleteDialog,
    } = useBranchStudentsStore();

    // Fetch students for this specific branch
    useEffect(() => {
        if (branch?.id) {
            fetchBranchStudents(branch.id);
        }
    }, [branch?.id, fetchBranchStudents]);

    // Action handlers
    const handleViewStudent = useCallback(async (studentId: string) => {
        try {
            await fetchEnrollment(studentId);
            openDetailsDialog();
        } catch (err) {
            console.error('Failed to load enrollment for details:', err);
        }
    }, [fetchEnrollment, openDetailsDialog]);

    const handleEditStudent = useCallback(async (studentId: string) => {
        try {
            await fetchEnrollment(studentId);
            openEditDialog();
        } catch (err) {
            console.error('Failed to load enrollment for edit:', err);
        }
    }, [fetchEnrollment, openEditDialog]);

    const handleDeleteStudent = useCallback(async (studentId: string) => {
        try {
            await fetchEnrollment(studentId);
            openDeleteDialog();
        } catch (err) {
            console.error('Failed to load enrollment for delete:', err);
        }
    }, [fetchEnrollment, openDeleteDialog]);

    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Students</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage student enrollments for {branch.name}
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

            {/* Filters */}
            <Card className="p-4">
                <CardContent className="p-0">
                    <StudentFilters branchId={branch.id} />
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
                <CardContent className="p-6">
                    <StudentsTable
                        branchId={branch.id}
                        onViewStudent={handleViewStudent}
                        onEditStudent={handleEditStudent}
                        onDeleteStudent={handleDeleteStudent}
                    />
                </CardContent>
            </Card>

            {/* Dialogs */}
            <EnrollStudentDialog
                open={isEnrollDialogOpen}
                onOpenChange={setIsEnrollDialogOpen}
                branchId={branch.id}
            />
            <EditEnrollmentDialog />
            <StudentDetailsDialog />
            <DeleteEnrollmentDialog />
        </div>
    );
}
