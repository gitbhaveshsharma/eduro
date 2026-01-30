/**
 * Teacher Attendance Dashboard Component
 * 
 * Main dashboard for managing student attendance
 * Features:
 * - Class selection filter
 * - Student list with quick attendance marking
 * - Integration with existing attendance dialogs
 * - Date picker for historical attendance
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth-guard';
import { useCurrentProfile } from '@/lib/profile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Branch system imports
import {
    useClassesByTeacher,
    useClassesLoading,
    useClassesErrors,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';

// Attendance imports
import {
    useFetchDailyAttendance,
    useMarkAttendance,
    useBulkMarkAttendance,
    useDailyAttendanceRecords,
    useAttendanceLoading,
    useAttendanceError,
    useOpenEditDialog,
    useOpenDeleteDialog,
    useFetchClassReport,
    useClassAttendanceReport,
    AttendanceStatus,
    type MarkAttendanceDTO,
    type BulkMarkAttendanceDTO,
} from '@/lib/branch-system/student-attendance';
import type { DailyAttendanceRecord, StudentAttendance } from '@/lib/branch-system/types/student-attendance.types';

// Local components
import { AttendanceHeader } from './attendance-header';
import { AttendanceClassFilter } from './attendance-class-filter';
import { AttendanceStudentList } from './attendance-student-list';
import { ClassReportCard } from './class-report-card';

// Existing dialogs
import EditAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/edit-attendance-dialog';
import { DeleteAttendanceDialog } from '@/app/(lms)/lms/_components/student-attendance/delete-attendance-dialog';

import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface TeacherAttendanceDashboardProps {
    centerId: string;
}

export function TeacherAttendanceDashboard({ centerId }: TeacherAttendanceDashboardProps) {
    const { userId } = useAuth();
    const currentProfile = useCurrentProfile();

    // Local state
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNoClasses, setShowNoClasses] = useState(false);

    // Store hooks for classes
    const { fetchClassesByTeacher } = useBranchClassesStore();
    const classes = useClassesByTeacher(userId || null);
    const { fetchClasses: classesLoading } = useClassesLoading();
    const { fetchClasses: classesError } = useClassesErrors();

    // Attendance hooks
    const fetchDailyAttendance = useFetchDailyAttendance();
    const markAttendance = useMarkAttendance();
    const bulkMarkAttendance = useBulkMarkAttendance();
    const dailyRecords = useDailyAttendanceRecords();
    const attendanceLoading = useAttendanceLoading();
    const attendanceError = useAttendanceError();
    const openEditDialog = useOpenEditDialog();
    const openDeleteDialog = useOpenDeleteDialog();
    // Class report hooks
    const fetchClassReport = useFetchClassReport();
    const classReport = useClassAttendanceReport();

    // Fetch teacher's classes on mount
    useEffect(() => {
        if (userId) {
            fetchClassesByTeacher(userId);
        }
    }, [userId, fetchClassesByTeacher]);

    // Auto-select first class when classes load
    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // Wait 100ms before showing "no classes" message
    useEffect(() => {
        if (!classesLoading && classes.length === 0) {
            const timer = setTimeout(() => {
                setShowNoClasses(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoClasses(false);
        }
    }, [classesLoading, classes.length]);

    // Fetch attendance when class or date changes
    useEffect(() => {
        if (selectedClassId) {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            fetchDailyAttendance(selectedClassId, dateString, true);
        }
    }, [selectedClassId, selectedDate, fetchDailyAttendance]);

    // Fetch class report when class changes
    useEffect(() => {
        if (selectedClassId) {
            fetchClassReport(selectedClassId, undefined, undefined, true); // Force refresh to avoid stale data
        }
    }, [selectedClassId, fetchClassReport]);

    // Get selected class info
    const selectedClass = useMemo(() => {
        return classes.find(c => c.id === selectedClassId);
    }, [classes, selectedClassId]);

    // Calculate attendance stats
    const stats = useMemo(() => {
        const total = dailyRecords.length;
        const marked = dailyRecords.filter(r => r.is_marked).length;
        return { total, marked };
    }, [dailyRecords]);

    // Handler: Change selected class
    const handleClassChange = useCallback((classId: string) => {
        setSelectedClassId(classId);
    }, []);

    // Handler: Refresh attendance data
    const handleRefresh = useCallback(() => {
        if (selectedClassId) {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            fetchDailyAttendance(selectedClassId, dateString, true);
        }
    }, [selectedClassId, selectedDate, fetchDailyAttendance]);

    // Handler: Mark individual attendance
    const handleMarkAttendance = useCallback(async (studentId: string, status: AttendanceStatus) => {
        if (!selectedClassId || !selectedClass || !currentProfile?.id) {
            showErrorToast('Unable to mark attendance. Please try again.');
            return;
        }

        setIsSubmitting(true);

        const payload: MarkAttendanceDTO = {
            student_id: studentId,
            class_id: selectedClassId,
            teacher_id: currentProfile.id,
            branch_id: selectedClass.branch_id,
            attendance_date: format(selectedDate, 'yyyy-MM-dd'),
            attendance_status: status,
            check_in_time: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE
                ? format(new Date(), 'HH:mm')
                : undefined,
            late_by_minutes: status === AttendanceStatus.LATE ? 15 : 0,
        };

        try {
            const success = await markAttendance(payload);
            if (success) {
                showSuccessToast(`Marked as ${status.toLowerCase()}`);
                // Refresh to get updated data
                handleRefresh();
            } else {
                showErrorToast('Failed to mark attendance');
            }
        } catch (err) {
            showErrorToast('Failed to mark attendance');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedClassId, selectedClass, currentProfile, selectedDate, markAttendance, handleRefresh]);

    // Handler: Mark all present
    const handleMarkAllPresent = useCallback(async () => {
        if (!selectedClassId || !selectedClass || !currentProfile?.id) {
            showErrorToast('Unable to mark attendance. Please try again.');
            return;
        }

        const unmarkedStudents = dailyRecords.filter(r => !r.is_marked);
        if (unmarkedStudents.length === 0) {
            showErrorToast('All students already have attendance marked');
            return;
        }

        setIsSubmitting(true);

        const payload: BulkMarkAttendanceDTO = {
            class_id: selectedClassId,
            teacher_id: currentProfile.id,
            branch_id: selectedClass.branch_id,
            attendance_date: format(selectedDate, 'yyyy-MM-dd'),
            attendance_records: unmarkedStudents.map(student => ({
                student_id: student.student_id,
                attendance_status: AttendanceStatus.PRESENT,
                check_in_time: format(new Date(), 'HH:mm'),
                late_by_minutes: 0,
            })),
        };

        try {
            const success = await bulkMarkAttendance(payload);
            if (success) {
                showSuccessToast(`Marked ${unmarkedStudents.length} students as present`);
                handleRefresh();
            } else {
                showErrorToast('Failed to mark bulk attendance');
            }
        } catch (err) {
            showErrorToast('Failed to mark bulk attendance');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedClassId, selectedClass, currentProfile, selectedDate, dailyRecords, bulkMarkAttendance, handleRefresh]);

    // Handler: Mark all absent
    const handleMarkAllAbsent = useCallback(async () => {
        if (!selectedClassId || !selectedClass || !currentProfile?.id) {
            showErrorToast('Unable to mark attendance. Please try again.');
            return;
        }

        const unmarkedStudents = dailyRecords.filter(r => !r.is_marked);
        if (unmarkedStudents.length === 0) {
            showErrorToast('All students already have attendance marked');
            return;
        }

        setIsSubmitting(true);

        const payload: BulkMarkAttendanceDTO = {
            class_id: selectedClassId,
            teacher_id: currentProfile.id,
            branch_id: selectedClass.branch_id,
            attendance_date: format(selectedDate, 'yyyy-MM-dd'),
            attendance_records: unmarkedStudents.map(student => ({
                student_id: student.student_id,
                attendance_status: AttendanceStatus.ABSENT,
                late_by_minutes: 0,
            })),
        };

        try {
            const success = await bulkMarkAttendance(payload);
            if (success) {
                showSuccessToast(`Marked ${unmarkedStudents.length} students as absent`);
                handleRefresh();
            } else {
                showErrorToast('Failed to mark bulk attendance');
            }
        } catch (err) {
            showErrorToast('Failed to mark bulk attendance');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedClassId, selectedClass, currentProfile, selectedDate, dailyRecords, bulkMarkAttendance, handleRefresh]);

    // Handler: Open bulk mark dialog (placeholder - can be extended)
    const handleBulkMark = useCallback(() => {
        // For now, just mark all present - can add custom dialog later
        handleMarkAllPresent();
    }, [handleMarkAllPresent]);

    // Handler: Edit attendance
    const handleEditAttendance = useCallback((record: DailyAttendanceRecord) => {
        // Convert DailyAttendanceRecord to StudentAttendance format for dialog
        if (!record.attendance_id) {
            showErrorToast('Cannot edit unmarked attendance');
            return;
        }

        const attendanceRecord: StudentAttendance = {
            id: record.attendance_id,
            student_id: record.student_id,
            class_id: record.class_id || selectedClassId || '',
            teacher_id: record.teacher_id || currentProfile?.id || '',
            branch_id: record.branch_id || selectedClass?.branch_id || '',
            attendance_date: record.attendance_date || format(selectedDate, 'yyyy-MM-dd'),
            attendance_status: record.attendance_status || AttendanceStatus.PRESENT,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            total_duration: null,
            late_by_minutes: record.late_by_minutes || 0,
            early_leave_minutes: record.early_leave_minutes || 0,
            teacher_remarks: record.teacher_remarks,
            excuse_reason: record.excuse_reason || null,
            metadata: {},
            created_at: record.created_at || new Date().toISOString(),
            updated_at: record.updated_at || new Date().toISOString(),
            student: {
                id: record.student_id,
                full_name: record.student_name,
                username: record.student_username,
                avatar_url: record.student_avatar,
            },
        };

        openEditDialog(attendanceRecord);
    }, [selectedClassId, selectedClass, currentProfile, selectedDate, openEditDialog]);

    // Handler: Delete attendance
    const handleDeleteAttendance = useCallback((record: DailyAttendanceRecord) => {
        if (!record.attendance_id) {
            showErrorToast('Cannot delete unmarked attendance');
            return;
        }

        const attendanceRecord: StudentAttendance = {
            id: record.attendance_id,
            student_id: record.student_id,
            class_id: record.class_id || selectedClassId || '',
            teacher_id: record.teacher_id || currentProfile?.id || '',
            branch_id: record.branch_id || selectedClass?.branch_id || '',
            attendance_date: record.attendance_date || format(selectedDate, 'yyyy-MM-dd'),
            attendance_status: record.attendance_status || AttendanceStatus.PRESENT,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            total_duration: null,
            late_by_minutes: record.late_by_minutes || 0,
            early_leave_minutes: record.early_leave_minutes || 0,
            teacher_remarks: record.teacher_remarks,
            excuse_reason: record.excuse_reason || null,
            metadata: {},
            created_at: record.created_at || new Date().toISOString(),
            updated_at: record.updated_at || new Date().toISOString(),
            student: {
                id: record.student_id,
                full_name: record.student_name,
                username: record.student_username,
                avatar_url: record.student_avatar,
            },
        };

        openDeleteDialog(attendanceRecord);
    }, [selectedClassId, selectedClass, currentProfile, selectedDate, openDeleteDialog]);

    // Loading skeleton state
    if (classesLoading || !showNoClasses && classes.length === 0) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-full" />
                </div>

                {/* Class Filter Skeleton */}
                <Skeleton className="h-10 w-full" />

                {/* Class Info Skeleton */}
                <Skeleton className="h-10 w-full" />

                {/* Report Card Skeleton */}
                <Skeleton className="h-48 w-full" />

                {/* Student List Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        );
    }

    // No classes state
    if (showNoClasses && classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                    You don&apos;t have any classes assigned yet. Please contact your
                    coaching center administrator to get assigned to classes.
                </p>
            </div>
        );
    }

    // Error state
    if (classesError) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{classesError}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <AttendanceHeader
                date={selectedDate}
                onDateChange={setSelectedDate}
                totalStudents={stats.total}
                markedCount={stats.marked}
                onRefresh={handleRefresh}
                isLoading={attendanceLoading.daily}
            />

            {/* Class Filter */}
            <AttendanceClassFilter
                classes={classes}
                selectedClassId={selectedClassId}
                onClassChange={handleClassChange}
                isLoading={classesLoading}
            />

            {/* Selected Class Info */}
            {selectedClass && (
                <div className="text-sm text-muted-foreground bg-secondary/10 px-4 py-2 rounded-lg">
                    <span className="font-medium">{selectedClass.class_name}</span>
                    {selectedClass.subject && (
                        <span> • {selectedClass.subject}</span>
                    )}
                    {selectedClass.grade_level && (
                        <span> • {selectedClass.grade_level}</span>
                    )}
                </div>
            )}

            {/* Class Report - Analytics */}
            {selectedClassId && (
                <ClassReportCard
                    report={classReport || null}
                    isLoading={attendanceLoading.summary}
                    className="mb-4"
                />
            )}

            {/* Student List */}
            <AttendanceStudentList
                records={dailyRecords}
                onMarkAttendance={handleMarkAttendance}
                onMarkAllPresent={handleMarkAllPresent}
                onMarkAllAbsent={handleMarkAllAbsent}
                onBulkMark={handleBulkMark}
                onEditAttendance={handleEditAttendance}
                onDeleteAttendance={handleDeleteAttendance}
                isLoading={attendanceLoading.daily}
                isSubmitting={isSubmitting}
                error={attendanceError}
                centerId={centerId}
                classId={selectedClassId || ''}
            />

            {/* Dialogs */}
            <EditAttendanceDialog />
            <DeleteAttendanceDialog />
        </div>
    );
}