'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserCheck, Users, LayoutDashboard, List, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Dashboard from '../../../_components/student-attendance/dashboard';
import AttendanceTable from '../../../_components/student-attendance/attendance-table';
import MarkAttendanceDialog from '../../../_components/student-attendance/mark-attendance-dialog';
import BulkMarkDialog from '../../../_components/student-attendance/bulk-mark-dialog';
import AttendanceDetailsDialog from '../../../_components/student-attendance/attendance-details-dialog';
import EditAttendanceDialog from '../../../_components/student-attendance/edit-attendance-dialog';
import { DeleteAttendanceDialog } from '../../../_components/student-attendance/delete-attendance-dialog';
import { useCoachContext } from '../layout';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StudentAttendancePage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance'>('dashboard');
    const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

    // Get coaching center ID from layout context
    const { coachingCenterId, isLoading } = useCoachContext();

    // Show loading state while context is loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner message="Loading attendance data..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track student attendance efficiently
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
                            <UserCheck className="h-4 w-4 mr-2" />
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
                onValueChange={(value) => setActiveTab(value as 'dashboard' | 'attendance')}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>Daily Attendance</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-6">
                    <Dashboard coachingCenterId={coachingCenterId ?? undefined} />
                </TabsContent>

                {/* Daily Attendance Tab */}
                <TabsContent value="attendance" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <AttendanceTable coachingCenterId={coachingCenterId ?? undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <MarkAttendanceDialog
                open={isMarkDialogOpen}
                onOpenChange={setIsMarkDialogOpen}
                coachingCenterId={coachingCenterId ?? undefined}
            />

            <BulkMarkDialog
                open={isBulkDialogOpen}
                onOpenChange={setIsBulkDialogOpen}
                coachingCenterId={coachingCenterId ?? undefined}
            />

            <AttendanceDetailsDialog />

            <EditAttendanceDialog />

            <DeleteAttendanceDialog />
        </div>
    );
}