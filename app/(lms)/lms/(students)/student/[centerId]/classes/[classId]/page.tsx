/**
 * Student Class Detail Page
 * Updated with Attendance Summary Modal
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { InfoRow } from '@/components/ui/info-row';
import {
    ArrowLeft,
    Calendar,
    Users,
    FileText,
    AlertCircle,
    CheckCircle,
    Info,
    TrendingUp,
    GraduationCap,
    Clock,
    BookOpen,
    BarChart3, // Added for attendance summary
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth-guard';

import { useStudentContext } from '../../layout';
import {
    useBranchClassesStore,
    useEnrollmentsByCenter,
    useClassesLoading,
    useClassesErrors,
    useClass,
} from '@/lib/branch-system/stores/branch-classes.store';
import {
    formatTime,
    formatDate,
    formatClassDays,
    getClassDisplayName,
    getSubjectColor,
    mapSubjectToId,
} from '@/lib/branch-system/utils/branch-classes.utils';
import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';

// Import attendance utilities and modal
import { StudentSummaryModal } from '../../../../../(teachers)/teacher/[centerId]/_components/attendances'; // Adjust path as needed
import {
    getAttendancePerformanceColor,
    getAttendancePerformanceLevel,
    ATTENDANCE_THRESHOLDS,
} from '@/lib/branch-system/utils/student-attendance.utils';

/**
 * Get enrollment status badge variant using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    if (!statusConfig) return 'secondary';

    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
    };

    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Get enrollment status label using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusLabel(status: string): string {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    return statusConfig?.label || status;
}

/**
 * Gets attendance performance badge variant based on percentage
 */
function getAttendancePerformanceVariant(percentage: number): 'success' | 'default' | 'warning' | 'secondary' | 'destructive' {
    const color = getAttendancePerformanceColor(percentage);

    const colorMap: Record<string, 'success' | 'default' | 'warning' | 'secondary' | 'destructive'> = {
        'green': 'success',
        'blue': 'default',
        'orange': 'warning',
        'yellow': 'secondary',
        'red': 'destructive',
    };

    return colorMap[color] || 'secondary';
}

/**
 * Get attendance progress variant
 */
function getAttendanceVariant(percentage: number): 'primary' | 'warning' | 'error' {
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
}

/**
 * Gets attendance color class based on performance color
 */
function getAttendanceColorClass(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    const classes: Record<string, string> = {
        'green': 'text-green-600 dark:text-green-500',
        'blue': 'text-blue-600 dark:text-blue-500',
        'orange': 'text-orange-600 dark:text-orange-500',
        'yellow': 'text-yellow-600 dark:text-yellow-500',
        'red': 'text-red-600 dark:text-red-500',
        'default': 'text-muted-foreground',
    };

    return classes[color] || classes['default'];
}

export default function StudentClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { centerId } = useStudentContext();
    const { userId, user } = useAuth();

    // State for attendance summary modal
    const [showAttendanceSummary, setShowAttendanceSummary] = useState(false);

    const classId = params?.classId as string;

    // Store hooks
    const { fetchEnrollmentsByCenter, fetchClassById } = useBranchClassesStore();
    const enrolledClasses = useEnrollmentsByCenter(userId || null, centerId || null);
    const classDetails = useClass(classId);
    const { upcomingClasses: isLoading, fetchClass: isLoadingClass } = useClassesLoading();
    const { upcomingClasses: fetchError, fetchClass: classError } = useClassesErrors();

    // Fetch data on mount
    useEffect(() => {
        if (userId && centerId) {
            fetchEnrollmentsByCenter(userId, centerId);
        }
        if (classId) {
            fetchClassById(classId);
        }
    }, [userId, centerId, classId, fetchEnrollmentsByCenter, fetchClassById]);

    // Find the enrolled class data
    const enrollmentData = useMemo(() => {
        if (!enrolledClasses || !classId) return null;
        return enrolledClasses.find((c: any) => c.class_id === classId) || null;
    }, [enrolledClasses, classId]);

    // Pre-calculate attendance metrics (must be before conditional returns)
    const attendancePercentage = enrollmentData?.attendance_percentage || 0;
    const attendancePerformance = useMemo(() => {
        return {
            level: getAttendancePerformanceLevel(attendancePercentage),
            color: getAttendancePerformanceColor(attendancePercentage),
            needsAttention: attendancePercentage < ATTENDANCE_THRESHOLDS.SATISFACTORY,
            colorClass: getAttendanceColorClass(attendancePercentage),
        };
    }, [attendancePercentage]);

    // Handle back navigation
    const handleBack = () => {
        router.push(`/lms/student/${centerId}/classes`);
    };

    // Handle view attendance summary
    const handleViewAttendanceSummary = () => {
        setShowAttendanceSummary(true);
    };

    // Handle navigate to detailed attendance
    const handleViewDetailedAttendance = () => {
        router.push(`/lms/student/${centerId}/attendance?class=${classId}`);
    };

    // Loading state
    if (isLoading || isLoadingClass) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    // Error or not found state
    if (fetchError || classError || (!enrollmentData && !classDetails)) {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Classes
                </Button>
                <Alert variant="destructive">
                    <AlertDescription>
                        {fetchError || classError || 'Class not found or you are not enrolled in this class'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Use enrollment data if available, otherwise use class details
    const displayName = enrollmentData?.class_name || classDetails?.class_name || 'Unknown Class';
    const subject = enrollmentData?.subject || classDetails?.subject || 'Unknown Subject';
    const description = enrollmentData?.description || classDetails?.description;
    const gradeLevel = enrollmentData?.grade_level || classDetails?.grade_level || 'N/A';
    const batchName = enrollmentData?.batch_name || classDetails?.batch_name;
    const classDays = enrollmentData?.class_days || classDetails?.class_days;
    const startTime = enrollmentData?.start_time || classDetails?.start_time;
    const endTime = enrollmentData?.end_time || classDetails?.end_time;
    const startDate = enrollmentData?.start_date || classDetails?.start_date;
    const endDate = enrollmentData?.end_date || classDetails?.end_date;

    const schedule = formatClassDays(classDays);
    const timeRange = startTime && endTime
        ? `${formatTime(startTime)} - ${formatTime(endTime)}`
        : 'Time not set';

    const subjectColor = getSubjectColor(mapSubjectToId(subject));

    // Enrollment specific data
    const enrollmentStatus = enrollmentData?.enrollment_status || 'ENROLLED';
    const statusVariant = getEnrollmentStatusVariant(enrollmentStatus);
    const statusLabel = getEnrollmentStatusLabel(enrollmentStatus);
    const currentGrade = enrollmentData?.current_grade;
    const preferredBatch = enrollmentData?.preferred_batch;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    size="sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            {/* Title Section */}
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground">
                            {displayName}
                        </h1>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={cn('text-sm', subjectColor)}>
                                {subject}
                            </Badge>
                            <Badge variant={statusVariant}>
                                {statusLabel}
                            </Badge>
                            {/* {attendancePercentage > 0 && (
                                <Badge
                                    variant={attendancePerformance.needsAttention ? "destructive" : "success"}
                                    className={cn('text-sm', attendancePerformance.needsAttention ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : '')}
                                >
                                    {attendancePercentage.toFixed(1)}% Attendance
                                </Badge>
                            )} */}
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground">
                    {description || 'No description available'}
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            My Enrollment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                                <span className="text-sm text-muted-foreground">Enrollment Status</span>
                                <Badge variant={statusVariant}>
                                    {statusLabel}
                                </Badge>
                            </div>
                            {currentGrade && (
                                <InfoRow
                                    label="Current Grade"
                                    value={currentGrade}
                                    valueClassName="font-semibold text-primary"
                                />
                            )}
                            {preferredBatch && (
                                <InfoRow
                                    label="Preferred Batch"
                                    value={preferredBatch}
                                />
                            )}
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Attendance</span>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={cn('h-4 w-4')} />
                                        <span className={cn('text-sm font-medium')}>
                                            {attendancePercentage.toFixed(1)}%
                                        </span>
                                        <Badge
                                            variant={getAttendancePerformanceVariant(attendancePercentage)}
                                            className="text-xs"
                                        >
                                            {attendancePerformance.level}
                                        </Badge>
                                    </div>
                                </div>
                                <Progress
                                    value={attendancePercentage}
                                    variant={getAttendanceVariant(attendancePercentage)}
                                    className="h-2"
                                />
                                {attendancePercentage < ATTENDANCE_THRESHOLDS.SATISFACTORY && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Maintain {ATTENDANCE_THRESHOLDS.SATISFACTORY}% attendance to be eligible for exams
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Attendance Actions */}
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleViewAttendanceSummary}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Attendance Summary
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Schedule & Timing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow
                            label="Class Days"
                            value={schedule || 'Not set'}
                            valueClassName="text-right"
                        />
                        <InfoRow
                            label="Class Time"
                            value={timeRange}
                        />

                        {startDate && (
                            <InfoRow
                                label="Start Date"
                                value={formatDate(startDate, 'medium')}
                            />
                        )}
                        {endDate && (
                            <InfoRow
                                label="End Date"
                                value={formatDate(endDate, 'medium')}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Class Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow
                            label="Subject"
                            value={subject}
                        />
                        <InfoRow
                            label="Grade Level"
                            value={gradeLevel}
                        />
                        {batchName && (
                            <InfoRow
                                label="Batch"
                                value={batchName}
                            />
                        )}
                        {classDetails?.fees_frequency && (
                            <InfoRow
                                label="Fee Frequency"
                                value={classDetails.fees_frequency.charAt(0).toUpperCase() + classDetails.fees_frequency.slice(1).toLowerCase()}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Prerequisites & Materials - Only show if class details available */}
                {classDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Prerequisites */}
                            {classDetails.prerequisites && classDetails.prerequisites.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Prerequisites</h4>
                                    <ul className="space-y-1">
                                        {classDetails.prerequisites.map((prereq, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <span>{prereq}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Materials Required */}
                            {classDetails.materials_required && classDetails.materials_required.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Materials Required</h4>
                                    <ul className="space-y-1">
                                        {classDetails.materials_required.map((material, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <span>{material}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(!classDetails.prerequisites || classDetails.prerequisites.length === 0) &&
                                (!classDetails.materials_required || classDetails.materials_required.length === 0) && (
                                    <p className="text-sm text-muted-foreground">
                                        No prerequisites or materials specified
                                    </p>
                                )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="default"
                            onClick={handleViewDetailedAttendance}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            View Detailed Attendance
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/lms/student/${centerId}/assignments?class=${classId}`)}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            View Assignments
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleViewAttendanceSummary}
                            className="ml-auto"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Attendance Summary
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Summary Modal */}
            {userId && user && (
                <StudentSummaryModal
                    open={showAttendanceSummary}
                    onOpenChange={setShowAttendanceSummary}
                    studentId={userId}
                    studentName={(user as any).full_name || user.email || 'Student'}
                    studentAvatar={(user as any).avatar_url}
                    classId={classId}
                />
            )}
        </div>
    );
}