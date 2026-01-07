/**
 * Teacher Student Detail Dialog
 * 
 * Shows detailed student information with actions:
 * - Mark Attendance
 * - Assign Assignment
 * - Assign Quiz
 * - View full profile
 */

'use client';

import { useEffect, useState } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { BranchStudentWithRelations } from '@/lib/branch-system/types/branch-students.types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/avatar/user-avatar';
import {
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    BookOpen,
    TrendingUp,
    ClipboardCheck,
    FileText,
    GraduationCap,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MarkAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/mark-attendance-dialog';

interface StudentDetailDialogProps {
    enrollmentId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssignAssignment?: (studentId: string, enrollmentId: string) => void;
    onAssignQuiz?: (studentId: string, enrollmentId: string) => void;
}

export function StudentDetailDialog({
    enrollmentId,
    open,
    onOpenChange,
    onAssignAssignment,
    onAssignQuiz,
}: StudentDetailDialogProps) {
    const fetchEnrollment = useBranchStudentsStore(state => state.fetchEnrollmentWithRelations);
    const currentEnrollmentWithRelations = useBranchStudentsStore(
        state => state.currentEnrollmentWithRelations
    );
    const enrollmentLoading = useBranchStudentsStore(state => state.enrollmentLoading);
    const error = useBranchStudentsStore(state => state.error);

    const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    // Fetch enrollment details when dialog opens
    useEffect(() => {
        if (open && enrollmentId) {
            console.log('[StudentDetailDialog] Fetching enrollment:', enrollmentId);
            fetchEnrollment(enrollmentId);
        }
    }, [open, enrollmentId, fetchEnrollment]);

    // Update selected branch ID when enrollment loads
    useEffect(() => {
        if (currentEnrollmentWithRelations?.branch_id) {
            setSelectedBranchId(currentEnrollmentWithRelations.branch_id);
        }
    }, [currentEnrollmentWithRelations]);

    const enrollment = currentEnrollmentWithRelations;

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

    // Get attendance badge variant
    const getAttendanceBadgeVariant = (
        percentage: number | null
    ): 'default' | 'secondary' | 'destructive' => {
        if (percentage === null) return 'secondary';
        if (percentage >= 90) return 'default';
        if (percentage >= 75) return 'secondary';
        return 'destructive';
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

    const handleMarkAttendance = () => {
        if (!enrollment?.branch_id) {
            console.error('[StudentDetailDialog] No branch ID available');
            return;
        }
        setIsMarkAttendanceOpen(true);
    };

    const handleAssignAssignment = () => {
        if (enrollment && onAssignAssignment) {
            onAssignAssignment(enrollment.student_id, enrollment.enrollment_id);
        }
    };

    const handleAssignQuiz = () => {
        if (enrollment && onAssignQuiz) {
            onAssignQuiz(enrollment.student_id, enrollment.enrollment_id);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>Student Details</DialogTitle>
                        <DialogDescription>
                            View student information and perform actions
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6">
                        {enrollmentLoading ? (
                            <StudentDetailSkeleton />
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        ) : enrollment ? (
                            <div className="space-y-6 pb-6">
                                {/* Student Header */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <UserAvatar
                                                profile={{
                                                    id: enrollment.student_id,
                                                    full_name: enrollment.student_name,
                                                    avatar_url: enrollment.avatar_url,
                                                }}
                                                size="xl"
                                                fallbackToInitials={true}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-2xl font-bold truncate">
                                                    {enrollment.student_name || 'Unknown Student'}
                                                </h3>
                                                {enrollment.student_email && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <Mail className="h-4 w-4" />
                                                        {enrollment.student_email}
                                                    </div>
                                                )}
                                                {enrollment.student_phone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <Phone className="h-4 w-4" />
                                                        {enrollment.student_phone}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <Badge variant="outline">
                                                        {enrollment.enrollment_status}
                                                    </Badge>
                                                    {enrollment.attendance_percentage !== null && (
                                                        <Badge
                                                            variant={getAttendanceBadgeVariant(
                                                                enrollment.attendance_percentage
                                                            )}
                                                        >
                                                            {enrollment.attendance_percentage}% Attendance
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
                                        <CardTitle className="text-base">Quick Actions</CardTitle>
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
                                                disabled={!onAssignAssignment}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Assign Assignment
                                            </Button>
                                            <Button
                                                onClick={handleAssignQuiz}
                                                className="w-full justify-start"
                                                variant="outline"
                                                disabled={!onAssignQuiz}
                                            >
                                                <GraduationCap className="h-4 w-4 mr-2" />
                                                Assign Quiz
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Class Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            Class Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Attendance Statistics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Attendance
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

                                {/* Personal Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {enrollment.date_of_birth && (
                                                <InfoRow
                                                    label="Age"
                                                    value={calculateAge(enrollment.date_of_birth) || 'N/A'}
                                                />
                                            )}
                                            {enrollment.emergency_contact_name && (
                                                <>
                                                    <Separator />
                                                    <div className="space-y-2">
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
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <User className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    No student information available
                                </p>
                            </div>
                        )}
                    </ScrollArea>

                    <div className="px-6 py-4 border-t flex justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mark Attendance Dialog */}
            {selectedBranchId && enrollment && (
                <MarkAttendanceDialog
                    open={isMarkAttendanceOpen}
                    onOpenChange={setIsMarkAttendanceOpen}
                    branchId={selectedBranchId}
                />
            )}
        </>
    );
}

// Helper Components

interface InfoRowProps {
    label: string;
    value: string | number;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

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
        <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function StudentDetailSkeleton() {
    return (
        <div className="space-y-6 pb-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
