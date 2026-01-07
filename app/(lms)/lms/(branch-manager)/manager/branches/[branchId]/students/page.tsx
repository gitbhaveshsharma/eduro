/**
 * Branch Manager - Branch Students Page
 * 
 * Manage student enrollments for a specific branch
 * Features: Dashboard tab, Students list tab, filters, dialogs
 * 
 * Similar structure to branch-classes page with tabs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBranchContext } from '../layout';
import { BranchStudentsDashboard } from '@/app/(lms)/lms/_components/branch-students/dashboard';
import { StudentsTable } from '@/app/(lms)/lms/_components/branch-students/students-table';
import { StudentFilters } from '@/app/(lms)/lms/_components/branch-students/student-filters';
import { EnrollStudentDialog } from '@/app/(lms)/lms/_components/branch-students/enroll-student-dialog';
import { EditEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/edit-enrollment-dialog';
import { StudentDetailsDialog } from '@/app/(lms)/lms/_components/branch-students/student-details-dialog';
import { DeleteEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/delete-enrollment-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

export default function BranchStudentsPage() {
    const { branch, isLoading } = useBranchContext();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

    const {
        fetchBranchStudents,
        branchStudents,
        fetchEnrollment,
        openDetailsDialog,
        openEditDialog,
        openDeleteDialog,
        setCurrentEnrollment,
    } = useBranchStudentsStore();

    // Helper to convert PublicBranchStudent to BranchStudent format
    const convertToBranchStudent = useCallback((studentId: string) => {
        const student = branchStudents.find(s => s.id === studentId);
        if (!student) return null;

        return {
            id: student.id,
            student_id: student.student_id,
            branch_id: student.branch_id,
            student_name: student.student_name,
            student_email: student.student_email,
            student_phone: student.student_phone,
            payment_status: student.payment_status,
            next_payment_due: student.next_payment_due,
            registration_date: student.registration_date,
            created_at: student.created_at,
            updated_at: student.updated_at,
            total_fees_due: student.outstanding_balance || 0,
            total_fees_paid: 0,
            last_payment_date: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            parent_guardian_name: null,
            parent_guardian_phone: null,
            student_notes: null,
            metadata: null,
        };
    }, [branchStudents]);

    // Fetch students for this specific branch
    useEffect(() => {
        if (branch?.id) {
            fetchBranchStudents(branch.id);
        }
    }, [branch?.id, fetchBranchStudents]);

    // Action handlers
    const handleViewStudent = useCallback(async (studentId: string) => {
        try {
            const branchStudent = convertToBranchStudent(studentId);
            if (!branchStudent) {
                console.error('Student not found');
                return;
            }
            setCurrentEnrollment(branchStudent);
            openDetailsDialog();
        } catch (err) {
            console.error('Failed to load student details:', err);
        }
    }, [convertToBranchStudent, setCurrentEnrollment, openDetailsDialog]);

    const handleEditStudent = useCallback(async (studentId: string) => {
        try {
            const branchStudent = convertToBranchStudent(studentId);
            if (!branchStudent) {
                console.error('Student not found');
                return;
            }
            setCurrentEnrollment(branchStudent);
            openEditDialog();
        } catch (err) {
            console.error('Failed to load student for edit:', err);
        }
    }, [convertToBranchStudent, setCurrentEnrollment, openEditDialog]);

    const handleDeleteStudent = useCallback(async (studentId: string) => {
        try {
            const branchStudent = convertToBranchStudent(studentId);
            if (!branchStudent) {
                console.error('Student not found');
                return;
            }
            setCurrentEnrollment(branchStudent);
            openDeleteDialog();
        } catch (err) {
            console.error('Failed to load student for delete:', err);
        }
    }, [convertToBranchStudent, setCurrentEnrollment, openDeleteDialog]);

    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
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
                        Manage student enrollments for <strong>{branch.name}</strong>
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

            {/* Main Content with Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>All Students</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-6">
                    <BranchStudentsDashboard branchId={branch.id} />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="mt-6">
                    <Card className="mb-4">
                        <CardContent className="pt-6">
                            <StudentFilters branchId={branch.id} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <StudentsTable
                                branchId={branch.id}
                                onViewStudent={handleViewStudent}
                                onEditStudent={handleEditStudent}
                                onDeleteStudent={handleDeleteStudent}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
