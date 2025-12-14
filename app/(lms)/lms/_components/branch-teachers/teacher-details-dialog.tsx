/**
 * Teacher Details Dialog Component
 * 
 * Displays detailed information about a teacher assignment
 * Shows all assignment data in a read-only format with proper formatting
 */

'use client';

import Image from 'next/image';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import {
    formatDate,
    formatCurrency,
    formatExperience,
    formatSubjects,
    formatAvailabilitySummary,
    getExperienceLevelLabel,
} from '@/lib/branch-system/utils/branch-teacher.utils';
import { DAYS_OF_WEEK_OPTIONS } from '@/lib/branch-system/types/branch-teacher.types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    User,
    Building2,
    BookOpen,
    Clock,
    DollarSign,
    Calendar,
    FileText,
    Activity,
} from 'lucide-react';
import { AvatarUtils } from '@/lib/utils/avatar.utils';

/**
 * Teacher Details Dialog Props
 */
interface TeacherDetailsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Main Teacher Details Dialog Component
 */
export function TeacherDetailsDialog({ open, onOpenChange }: TeacherDetailsDialogProps) {
    const {
        currentAssignment,
        isDetailsDialogOpen,
        closeDetailsDialog
    } = useBranchTeacherStore();

    // Use props or store state for dialog open state
    const isOpen = open ?? isDetailsDialogOpen;
    const handleOpenChange = (openValue: boolean) => {
        if (onOpenChange) {
            onOpenChange(openValue);
        } else if (!openValue) {
            closeDetailsDialog();
        }
    };

    if (!currentAssignment) {
        return null;
    }

    // Format available days
    const formatAvailableDays = () => {
        const days = currentAssignment.available_days;
        if (!days || days.length === 0) return 'Not specified';
        return days.map(day => DAYS_OF_WEEK_OPTIONS[day]?.short || day).join(', ');
    };

    // Format time range
    const formatTimeRange = () => {
        const start = currentAssignment.available_start_time;
        const end = currentAssignment.available_end_time;
        if (!start || !end) return 'Not specified';
        return `${start} - ${end}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Teacher Assignment Details
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information about this teacher assignment
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 pr-4 overflow-y-auto">
                    <div className="space-y-6 p-4">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            <Badge variant={currentAssignment.is_active ? 'default' : 'secondary'}>
                                {currentAssignment.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        {/* Teacher Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-4 w-4" />
                                    Teacher Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <Image
                                        src={AvatarUtils.getSafeAvatarUrl(
                                            null,
                                            currentAssignment.teacher_name || 'T'
                                        )}
                                        alt={currentAssignment.teacher_name || 'Teacher'}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {currentAssignment.teacher_name || 'N/A'}
                                        </p>
                                        {currentAssignment.teacher_username && (
                                            <p className="text-sm text-muted-foreground">
                                                @{currentAssignment.teacher_username}
                                            </p>
                                        )}
                                        {currentAssignment.teacher_email && (
                                            <p className="text-sm text-muted-foreground">
                                                {currentAssignment.teacher_email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Teacher ID</span>
                                        <span className="text-sm font-mono">{currentAssignment.teacher_id}</span>
                                    </div>
                                    {currentAssignment.teacher_phone && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Phone</span>
                                            <span className="text-sm">{currentAssignment.teacher_phone}</span>
                                        </div>
                                    )}
                                    {currentAssignment.teacher_qualification && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Qualification</span>
                                            <span className="text-sm">{currentAssignment.teacher_qualification}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Experience</span>
                                        <span className="text-sm">
                                            {formatExperience(currentAssignment.teaching_experience_years)}
                                            ({getExperienceLevelLabel(currentAssignment.teaching_experience_years)})
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Branch Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Building2 className="h-4 w-4" />
                                    Branch Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Branch ID</span>
                                        <span className="text-sm font-mono">{currentAssignment.branch_id}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Teaching Subjects */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="h-4 w-4" />
                                    Teaching Subjects
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentAssignment.teaching_subjects && currentAssignment.teaching_subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {currentAssignment.teaching_subjects.map((subject, index) => (
                                            <Badge key={index} variant="outline">
                                                {subject}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No subjects assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Availability */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-4 w-4" />
                                    Availability
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Available Days</span>
                                        <span className="text-sm">{formatAvailableDays()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Time Range</span>
                                        <span className="text-sm">{formatTimeRange()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compensation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-4 w-4" />
                                    Compensation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Hourly Rate</span>
                                        <span className="text-sm">
                                            {formatCurrency(currentAssignment.hourly_rate)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assignment Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-4 w-4" />
                                    Assignment Dates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Assignment Date</span>
                                        <span className="text-sm">
                                            {formatDate(currentAssignment.assignment_date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">End Date</span>
                                        <span className="text-sm">
                                            {formatDate(currentAssignment.assignment_end_date) || 'Not specified'}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Created</span>
                                        <span className="text-sm">
                                            {formatDate(currentAssignment.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Last Updated</span>
                                        <span className="text-sm">
                                            {formatDate(currentAssignment.updated_at)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {(currentAssignment.assignment_notes || currentAssignment.performance_notes) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-4 w-4" />
                                        Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {currentAssignment.assignment_notes && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Assignment Notes</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {currentAssignment.assignment_notes}
                                            </p>
                                        </div>
                                    )}
                                    {currentAssignment.performance_notes && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Performance Notes</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {currentAssignment.performance_notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Assignment ID */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-4 w-4" />
                                    Assignment ID
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-mono text-muted-foreground">
                                    {currentAssignment.id}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
