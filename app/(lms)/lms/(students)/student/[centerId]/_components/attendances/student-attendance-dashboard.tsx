/**
 * Student Attendance Dashboard Component
 * 
 * Main dashboard for students to view their attendance records
 * Features:
 * - Class selection filter (filter by enrolled class)
 * - Date range picker for historical records
 * - Attendance summary with performance metrics
 * - READ-ONLY view (students cannot modify attendance)
 * 
 * IMPORTANT: This only shows attendance for the current coaching center (centerId)
 * If student is enrolled in multiple centers, each center shows its own attendance
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/hooks/use-auth-guard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DateRange } from 'react-day-picker';

// Branch system imports - Classes
import {
    useBranchClassesStore,
    useEnrollmentsByCenter,
    useClassesLoading,
    useClassesErrors,
} from '@/lib/branch-system/stores/branch-classes.store';

// Attendance imports
import {
    useFetchStudentAttendance,
    useFetchStudentSummary,
    useAttendanceRecords,
    useAttendanceSummary,
    useAttendanceLoading,
    useAttendanceError,
    useResetAttendanceFilters,
    AttendanceStatus,
} from '@/lib/branch-system/student-attendance';

// Local components
import { StudentAttendanceHeader } from './student-attendance-header';
import { StudentAttendanceClassFilter } from './student-attendance-class-filter';
import { StudentAttendanceSummaryCard } from './student-attendance-summary-card';
import { StudentAttendanceRecordList } from './student-attendance-record-list';

import { showErrorToast } from '@/lib/toast';

interface StudentAttendanceDashboardProps {
    centerId: string;
}

export function StudentAttendanceDashboard({ centerId }: StudentAttendanceDashboardProps) {
    const { userId } = useAuth();

    // Default date range: current month
    const defaultDateRange: DateRange = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    };

    // Local state
    const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [showNoClasses, setShowNoClasses] = useState(false);

    // Store hooks for enrolled classes
    const { fetchEnrollmentsByCenter } = useBranchClassesStore();
    const enrolledClasses = useEnrollmentsByCenter(userId || null, centerId || null);
    const { upcomingClasses: classesLoading } = useClassesLoading();
    const { upcomingClasses: classesError } = useClassesErrors();

    // Attendance hooks
    const fetchStudentAttendance = useFetchStudentAttendance();
    const fetchStudentSummary = useFetchStudentSummary();
    const attendanceRecords = useAttendanceRecords();
    const attendanceSummary = useAttendanceSummary();
    const attendanceLoading = useAttendanceLoading();
    const attendanceError = useAttendanceError();
    const resetFilters = useResetAttendanceFilters();

    // Fetch enrolled classes on mount
    useEffect(() => {
        if (userId && centerId) {
            fetchEnrollmentsByCenter(userId, centerId);
        }
    }, [userId, centerId, fetchEnrollmentsByCenter]);

    // Wait before showing "no classes" message
    useEffect(() => {
        if (!classesLoading && (!enrolledClasses || enrolledClasses.length === 0)) {
            const timer = setTimeout(() => {
                setShowNoClasses(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoClasses(false);
        }
    }, [classesLoading, enrolledClasses]);

    // Reset attendance filters when centerId changes
    useEffect(() => {
        resetFilters();
    }, [centerId, resetFilters]);

    // Fetch attendance when filters change
    useEffect(() => {
        if (!userId) return;

        // Build params for attendance fetch
        const params: Record<string, unknown> = {
            sort_by: 'attendance_date' as const,
            sort_order: 'desc' as const,
        };

        // Add date range filter
        if (dateRange?.from) {
            params.date_from = format(dateRange.from, 'yyyy-MM-dd');
        }
        if (dateRange?.to) {
            params.date_to = format(dateRange.to, 'yyyy-MM-dd');
        }

        // Add class filter - IMPORTANT: Filter by class for this center only
        if (selectedClassId) {
            params.class_id = selectedClassId;
        } else if (enrolledClasses && enrolledClasses.length > 0) {
            // If no specific class selected, we still need to filter to this center's classes
            // The attendance service should handle this via the class IDs
        }

        // Fetch attendance for the student
        fetchStudentAttendance(userId, params, true);
    }, [userId, dateRange, selectedClassId, enrolledClasses, fetchStudentAttendance]);

    // Fetch summary when class filter changes
    useEffect(() => {
        if (!userId) return;

        const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
        const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

        fetchStudentSummary(
            userId,
            selectedClassId || undefined,
            fromDate,
            toDate,
            true
        );
    }, [userId, selectedClassId, dateRange, fetchStudentSummary]);

    // Filter records by selected class (for this center only)
    const filteredRecords = useMemo(() => {
        if (!attendanceRecords) return [];

        // Get class IDs for this center
        const centerClassIds = new Set(enrolledClasses?.map(c => c.class_id) || []);

        // Filter records to only show this center's classes
        let filtered = attendanceRecords.filter(record =>
            centerClassIds.has(record.class_id)
        );

        // Further filter by selected class if specified
        if (selectedClassId) {
            filtered = filtered.filter(record => record.class_id === selectedClassId);
        }

        return filtered;
    }, [attendanceRecords, enrolledClasses, selectedClassId]);

    // Calculate stats from filtered records
    const stats = useMemo(() => {
        const total = filteredRecords.length;
        const present = filteredRecords.filter(r => r.attendance_status === AttendanceStatus.PRESENT).length;
        const absent = filteredRecords.filter(r => r.attendance_status === AttendanceStatus.ABSENT).length;
        const late = filteredRecords.filter(r => r.attendance_status === AttendanceStatus.LATE).length;

        return { total, present, absent, late };
    }, [filteredRecords]);

    // Handler: Change selected class
    const handleClassChange = useCallback((classId: string | null) => {
        setSelectedClassId(classId);
    }, []);

    // Handler: Refresh attendance data
    const handleRefresh = useCallback(() => {
        if (userId) {
            const params: Record<string, unknown> = {
                sort_by: 'attendance_date' as const,
                sort_order: 'desc' as const,
            };

            if (dateRange?.from) {
                params.date_from = format(dateRange.from, 'yyyy-MM-dd');
            }
            if (dateRange?.to) {
                params.date_to = format(dateRange.to, 'yyyy-MM-dd');
            }
            if (selectedClassId) {
                params.class_id = selectedClassId;
            }

            fetchStudentAttendance(userId, params, true);

            // Also refresh summary
            const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
            const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
            fetchStudentSummary(userId, selectedClassId || undefined, fromDate, toDate, true);
        }
    }, [userId, dateRange, selectedClassId, fetchStudentAttendance, fetchStudentSummary]);

    // Handler: Date range change
    const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
        setDateRange(range);
    }, []);

    // Get selected class info
    const selectedClass = useMemo(() => {
        if (!selectedClassId || !enrolledClasses) return null;
        return enrolledClasses.find(c => c.class_id === selectedClassId);
    }, [enrolledClasses, selectedClassId]);

    // Loading skeleton state
    if (classesLoading || (!showNoClasses && (!enrolledClasses || enrolledClasses.length === 0))) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-full" />
                </div>

                {/* Class Filter Skeleton */}
                <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-11 w-32 rounded-full" />
                    ))}
                </div>

                {/* Summary Card Skeleton */}
                <Skeleton className="h-40 w-full" />

                {/* Records List Skeleton */}
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // No classes enrolled state
    if (showNoClasses && (!enrolledClasses || enrolledClasses.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <CalendarDays className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Classes Enrolled</h3>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                    You haven&apos;t enrolled in any classes at this coaching center yet.
                    Please contact your coaching center to get enrolled.
                </p>
            </div>
        );
    }

    // Error state for classes
    if (classesError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{classesError}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Picker and Stats */}
            <StudentAttendanceHeader
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                totalRecords={stats.total}
                presentCount={stats.present}
                absentCount={stats.absent}
                lateCount={stats.late}
                onRefresh={handleRefresh}
                isLoading={attendanceLoading.list}
            />

            {/* Class Filter */}
            <StudentAttendanceClassFilter
                classes={enrolledClasses || []}
                selectedClassId={selectedClassId}
                onClassChange={handleClassChange}
                isLoading={classesLoading}
                showAllOption={true}
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

            {/* Attendance Summary Card */}
            <StudentAttendanceSummaryCard
                summary={attendanceSummary}
                isLoading={attendanceLoading.summary}
            />

            {/* Attendance Records List */}
            <StudentAttendanceRecordList
                records={filteredRecords}
                isLoading={attendanceLoading.list}
                error={attendanceError}
                showClassName={!selectedClassId} // Show class name when viewing all classes
            />
        </div>
    );
}
