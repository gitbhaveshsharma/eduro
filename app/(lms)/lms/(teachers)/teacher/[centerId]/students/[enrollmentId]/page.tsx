/**
 * Teacher Student Detail Page
 * 
 * Detailed view of a specific student for teachers
 * Route: /lms/teacher/[centerId]/students/[enrollmentId]
 * 
 * Features:
 * - READ-ONLY view of student details
 * - Shows comprehensive student information
 * - Attendance statistics and history
 * - Emergency contact information
 * - Quick actions (Mark Attendance, Assign Assignment, Assign Quiz)
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
import { InfoRow } from '@/components/ui/info-row';
import { UserAvatar } from '@/components/avatar/user-avatar';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Calendar,
    BookOpen,
    TrendingUp,
    ClipboardCheck,
    FileText,
    GraduationCap,
    AlertCircle,
    CheckCircle2,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTeacherContext } from '../../layout';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { useState } from 'react';
import MarkAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/mark-attendance-dialog';

export default function TeacherStudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { centerId } = useTeacherContext();

    const enrollmentId = params?.enrollmentId as string;

    // Store hooks
    const fetchEnrollment = useBranchStudentsStore(state => state.fetchEnrollmentWithRelations);
    const enrollment = useBranchStudentsStore(state => state.currentEnrollmentWithRelations);
    const enrollmentLoading = useBranchStudentsStore(state => state.enrollmentLoading);
    const error = useBranchStudentsStore(state => state.error);

    // Dialog states
    const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);

    // Fetch enrollment details
    useEffect(() => {
        if (enrollmentId) {
            console.log('[TeacherStudentDetailPage] Fetching enrollment:', enrollmentId);
            fetchEnrollment(enrollmentId);
        }
    }, [enrollmentId, fetchEnrollment]);

    // Handle back navigation
    const handleBack = () => {
        router.push(`/lms/teacher/${centerId}/students`);
    };

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string | null): string | null => {
        if (!dateOfBirth) return null;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age > 0 ? `${age} years` : null;
    };

    // Format date
    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get attendance badge variant
    const getAttendanceBadgeVariant = (
        percentage: number | null
    ): 'default' | 'secondary' | 'destructive' => {
        if (percentage === null) return 'secondary';
        if (percentage >= 90) return 'default';
        if (percentage >= 75) return 'secondary';
        return 'destructive';
    };

    // Action handlers
    const handleMarkAttendance = () => {
        if (!enrollment?.branch_id) {
            toast({
                title: 'Error',
                description: 'Unable to mark attendance. Branch information not available.',
                variant: 'destructive',
            });
            return;
        }
        setIsMarkAttendanceOpen(true);
    };

    const handleAssignAssignment = () => {
        if (!enrollment) return;
        toast({
            title: 'Assign Assignment',
            description: 'Assignment feature coming soon. You will be able to assign assignments to this student.',
        });
        // TODO: Implement assignment feature
    };

    const handleAssignQuiz = () => {
        if (!enrollment) return;
        toast({
            title: 'Assign Quiz',
            description: 'Quiz feature coming soon. You will be able to assign quizzes to this student.',
        });
        // TODO: Implement quiz feature
    };

    // Loading state
    if (enrollmentLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </div>
        );
    }

    // Error or not found state
    if (error || !enrollment) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Students
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Student enrollment not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const age = calculateAge(enrollment.date_of_birth);
    const attendanceBadgeVariant = getAttendanceBadgeVariant(enrollment.attendance_percentage);

    return (
        <>
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

                {/* Student Header Section */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <UserAvatar
                                profile={{
                                    id: enrollment.student_id,
                                    full_name: enrollment.student_name,
                                    avatar_url: enrollment.avatar_url,
                                }}
                                size="2xl"
                                fallbackToInitials={true}
                                className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-3">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground truncate">
                                        {enrollment.student_name || 'Unknown Student'}
                                    </h1>
                                    {enrollment.student_email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                            <Mail className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{enrollment.student_email}</span>
                                        </div>
                                    )}
                                    {enrollment.student_phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Phone className="h-4 w-4 flex-shrink-0" />
                                            {enrollment.student_phone}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                        {enrollment.enrollment_status}
                                    </Badge>
                                    {enrollment.attendance_percentage !== null && (
                                        <Badge variant={attendanceBadgeVariant}>
                                            {enrollment.attendance_percentage}% Attendance
                                        </Badge>
                                    )}
                                    {enrollment.class_name && (
                                        <Badge variant="secondary">
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            {enrollment.class_name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button
                                onClick={handleMarkAttendance}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Mark Attendance
                            </Button>
                            <Button
                                onClick={handleAssignAssignment}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Assign Assignment
                            </Button>
                            <Button
                                onClick={handleAssignQuiz}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Assign Quiz
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Class Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Class Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow
                                label="Class"
                                value={enrollment.class_name || 'N/A'}
                            />
                            <InfoRow
                                label="Subject"
                                value={enrollment.subject_name || 'N/A'}
                            />
                            <InfoRow
                                label="Branch"
                                value={enrollment.branch_name || 'N/A'}
                            />
                            <InfoRow
                                label="Enrollment Date"
                                value={formatDate(enrollment.enrollment_date)}
                            />
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {age && (
                                <InfoRow
                                    label="Age"
                                    value={age}
                                />
                            )}
                            {enrollment.date_of_birth && (
                                <InfoRow
                                    label="Date of Birth"
                                    value={formatDate(enrollment.date_of_birth)}
                                />
                            )}
                            {enrollment.emergency_contact_name && (
                                <>
                                    <Separator />
                                    <div className="space-y-3 pt-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Emergency Contact
                                        </p>
                                        <InfoRow
                                            label="Name"
                                            value={enrollment.emergency_contact_name}
                                        />
                                        {enrollment.emergency_contact_phone && (
                                            <InfoRow
                                                label="Phone"
                                                value={enrollment.emergency_contact_phone}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attendance Statistics */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Attendance Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Present"
                                    value={enrollment.total_days_present ?? 0}
                                    variant="success"
                                />
                                <StatCard
                                    icon={AlertCircle}
                                    label="Absent"
                                    value={enrollment.total_days_absent ?? 0}
                                    variant="danger"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Percentage"
                                    value={`${enrollment.attendance_percentage ?? 0}%`}
                                    variant="default"
                                />
                                <StatCard
                                    icon={Calendar}
                                    label="Total Days"
                                    value={
                                        (enrollment.total_days_present ?? 0) +
                                        (enrollment.total_days_absent ?? 0)
                                    }
                                    variant="default"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Mark Attendance Dialog */}
            {enrollment.branch_id && (
                <MarkAttendanceDialog
                    open={isMarkAttendanceOpen}
                    onOpenChange={setIsMarkAttendanceOpen}
                    branchId={enrollment.branch_id}
                />
            )}
        </>
    );
}

// Helper Components

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'danger';
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'bg-card border-border',
        success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    };

    const iconStyles = {
        default: 'text-muted-foreground',
        success: 'text-green-600 dark:text-green-400',
        danger: 'text-red-600 dark:text-red-400',
    };

    return (
        <div className={cn('p-4 rounded-lg border', variantStyles[variant])}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', iconStyles[variant])} />
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
