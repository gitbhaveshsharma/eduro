'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, UserCheck, Users } from 'lucide-react';
import Dashboard from '../../../_components/student-attendance/dashboard';
import AttendanceTable from '../../../_components/student-attendance/attendance-table';
import MarkAttendanceDialog from '../../../_components/student-attendance/mark-attendance-dialog';
import BulkMarkDialog from '../../../_components/student-attendance/bulk-mark-dialog';
import AttendanceDetailsDialog from '../../../_components/student-attendance/attendance-details-dialog';
import EditAttendanceDialog from '../../../_components/student-attendance/edit-attendance-dialog';
import StudentHistory from '../../../_components/student-attendance/student-history';

export default function StudentAttendancePage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showMarkDialog, setShowMarkDialog] = useState(false);
    const [showBulkDialog, setShowBulkDialog] = useState(false);

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

                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowMarkDialog(true)}
                        className="gap-2"
                    >
                        <UserCheck className="w-4 h-4" />
                        Mark Attendance
                    </Button>
                    <Button
                        onClick={() => setShowBulkDialog(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Bulk Mark
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="gap-2">
                        <UserCheck className="w-4 h-4" />
                        Daily Attendance
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <Users className="w-4 h-4" />
                        Student History
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <Dashboard />
                </TabsContent>

                {/* Daily Attendance Tab */}
                <TabsContent value="attendance" className="space-y-6">
                    <AttendanceTable />
                </TabsContent>

                {/* Student History Tab */}
                <TabsContent value="history" className="space-y-6">
                    <StudentHistory />
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <MarkAttendanceDialog
                open={showMarkDialog}
                onOpenChange={setShowMarkDialog}
            />

            <BulkMarkDialog
                open={showBulkDialog}
                onOpenChange={setShowBulkDialog}
            />

            <AttendanceDetailsDialog />

            <EditAttendanceDialog />
        </div>
    );
}
