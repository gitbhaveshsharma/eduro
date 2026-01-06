/**
 * Teacher Class Detail Page
 * 
 * Detailed view of a specific class for teachers
 * Route: /lms/teacher/[centerId]/classes/[classId]
 * 
 * Features:
 * - READ-ONLY view of class details
 * - Shows complete class information
 * - Student enrollment list
 * - Class schedule and timings
 * - Mobile-friendly layout
 */

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Clock,
    Users,
    MapPin,
    FileText,
    AlertCircle,
    CheckCircle,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTeacherContext } from '../../layout';
import {
    useClass,
    useClassesLoading,
    useClassesErrors,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';
import {
    formatTime,
    formatDate,
    formatClassDays,
    formatClassStatus,
    calculateAvailableSeats,
    calculateUtilization,
    getClassDisplayName,
    getSubjectColor,
    mapSubjectToId,
} from '@/lib/branch-system/utils/branch-classes.utils';

export default function TeacherClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { centerId } = useTeacherContext();

    const classId = params?.classId as string;

    // Store hooks
    const { fetchClassById } = useBranchClassesStore();
    const classData = useClass(classId);
    const { fetchClass } = useClassesLoading();
    const { fetchClass: fetchError } = useClassesErrors();

    // Fetch class details
    useEffect(() => {
        if (classId) {
            fetchClassById(classId);
        }
    }, [classId, fetchClassById]);

    // Handle back navigation
    const handleBack = () => {
        router.push(`/lms/teacher/${centerId}/classes`);
    };

    // Loading state
    if (fetchClass) {
        return (
            <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    // Error or not found state
    if (fetchError || !classData) {
        return (
            <div className="container max-w-5xl mx-auto px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Classes
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {fetchError || 'Class not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const displayName = getClassDisplayName(classData);
    const schedule = formatClassDays(classData.class_days);
    const timeRange = classData.start_time && classData.end_time
        ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
        : 'Time not set';
    const statusInfo = formatClassStatus(classData.status);
    const availableSeats = calculateAvailableSeats(classData);
    const utilization = calculateUtilization(classData);
    const subjectColor = getSubjectColor(mapSubjectToId(classData.subject));

    return (
        <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
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
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cn('text-sm', subjectColor)}>
                                {classData.subject}
                            </Badge>
                            <Badge
                                variant={
                                    statusInfo.color === 'green' ? 'default' :
                                        statusInfo.color === 'yellow' ? 'secondary' :
                                            'destructive'
                                }
                            >
                                {statusInfo.label}
                            </Badge>
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground">
                    {classData.description || 'No description available'}
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Grade Level</span>
                                <span className="text-sm font-medium">{classData.grade_level}</span>
                            </div>
                            {classData.batch_name && (
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground">Batch Name</span>
                                    <span className="text-sm font-medium">{classData.batch_name}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Fee Frequency</span>
                                <span className="text-sm font-medium capitalize">
                                    {classData.fees_frequency.toLowerCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Visibility</span>
                                <Badge variant={classData.is_visible ? 'default' : 'secondary'}>
                                    {classData.is_visible ? 'Visible' : 'Hidden'}
                                </Badge>
                            </div>
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
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Class Days</span>
                                <span className="text-sm font-medium text-right">
                                    {schedule || 'Not set'}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Class Time</span>
                                <span className="text-sm font-medium">{timeRange}</span>
                            </div>
                            <Separator />
                            {classData.start_date && (
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground">Start Date</span>
                                    <span className="text-sm font-medium">
                                        {formatDate(classData.start_date, 'medium')}
                                    </span>
                                </div>
                            )}
                            {classData.end_date && (
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground">End Date</span>
                                    <span className="text-sm font-medium">
                                        {formatDate(classData.end_date, 'medium')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Enrollment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Current Students</span>
                                <span className="text-sm font-medium">
                                    {classData.current_enrollment}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Maximum Capacity</span>
                                <span className="text-sm font-medium">
                                    {classData.max_students}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Available Seats</span>
                                <span className="text-sm font-medium text-primary">
                                    {availableSeats}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Utilization</span>
                                <span className="text-sm font-medium">{utilization}%</span>
                            </div>
                        </div>

                        {/* Utilization Progress Bar */}
                        <div className="space-y-2">
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className={cn(
                                        "h-2 rounded-full transition-all",
                                        utilization >= 90 ? "bg-destructive" :
                                            utilization >= 70 ? "bg-amber-500" :
                                                "bg-primary"
                                    )}
                                    style={{ width: `${utilization}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Prerequisites & Materials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Requirements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Prerequisites */}
                        {classData.prerequisites && classData.prerequisites.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Prerequisites</h4>
                                <ul className="space-y-1">
                                    {classData.prerequisites.map((prereq, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span>{prereq}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Materials Required */}
                        {classData.materials_required && classData.materials_required.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Materials Required</h4>
                                <ul className="space-y-1">
                                    {classData.materials_required.map((material, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span>{material}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(!classData.prerequisites || classData.prerequisites.length === 0) &&
                            (!classData.materials_required || classData.materials_required.length === 0) && (
                                <p className="text-sm text-muted-foreground">
                                    No prerequisites or materials specified
                                </p>
                            )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="default"
                            onClick={() => router.push(`/lms/teacher/${centerId}/students?class=${classId}`)}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            View Students
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/lms/teacher/${centerId}/attendance?class=${classId}`)}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Take Attendance
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
