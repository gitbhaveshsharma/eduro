/**
 * Branch Manager - Branch Attendance Page
 * 
 * Track and manage student attendance for a specific branch
 * Features: Dashboard tab, Attendance list tab, filters, dialogs
 * 
 * Similar structure to branch-classes and branch-students pages with tabs
 */

'use client';

import { useState, useEffect } from 'react';
import { useBranchContext } from '../layout';
import Dashboard from '@/app/(lms)/lms/_components/student-attendance/dashboard';
import AttendanceTable from '@/app/(lms)/lms/_components/student-attendance/attendance-table';
import MarkAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/mark-attendance-dialog';
import BulkMarkDialog from '@/app/(lms)/lms/_components/student-attendance/bulk-mark-dialog';
import EditAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/edit-attendance-dialog';
import AttendanceDetailsDialog from '@/app/(lms)/lms/_components/student-attendance/attendance-details-dialog';
import { DeleteAttendanceDialog } from '@/app/(lms)/lms/_components/student-attendance/delete-attendance-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutDashboard, List, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFetchBranchDailyAttendance } from '@/lib/branch-system/student-attendance';

export default function BranchAttendancePage() {
    const { branch, isLoading } = useBranchContext();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

    const fetchBranchDailyAttendance = useFetchBranchDailyAttendance();

    // Fetch attendance for this specific branch on mount
    useEffect(() => {
        if (branch?.id) {
            fetchBranchDailyAttendance(branch.id);
        }
    }, [branch?.id, fetchBranchDailyAttendance]);

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
                    <h1 className="text-3xl font-bold tracking-tight">Branch Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage student attendance for <strong>{branch.name}</strong>
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="lg" className="gap-2">
                            <Plus className="h-5 w-5" />
                            Mark Attendance
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsMarkDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Mark Individual
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsBulkDialogOpen(true)}>
                            <Users className="h-4 w-4 mr-2" />
                            Bulk Mark Attendance
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                        <span>All Attendance</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-6">
                    <Dashboard branchId={branch.id} />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <AttendanceTable branchId={branch.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <MarkAttendanceDialog
                open={isMarkDialogOpen}
                onOpenChange={setIsMarkDialogOpen}
                branchId={branch.id}
            />
            <BulkMarkDialog
                open={isBulkDialogOpen}
                onOpenChange={setIsBulkDialogOpen}
                branchId={branch.id}
            />
            <EditAttendanceDialog />
            <AttendanceDetailsDialog />
            <DeleteAttendanceDialog />
        </div>
    );
}
