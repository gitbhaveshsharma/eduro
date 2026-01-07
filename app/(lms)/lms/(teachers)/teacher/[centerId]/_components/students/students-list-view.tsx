'use client';

import { UserAvatar } from '@/components/avatar/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
    ItemSeparator,
} from '@/components/ui/item';
import {
    User,
    TrendingUp,
    Eye,
    Cake,
    Sparkles,
    PartyPopper,
    GraduationCap,
} from 'lucide-react';
import type { TeacherStudent } from '@/lib/branch-system/types/branch-students.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    CLASS_ATTENDANCE_THRESHOLDS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StudentsListViewProps {
    students: TeacherStudent[];
    onViewDetails: (studentId: string) => void;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Get attendance badge variant based on percentage
 * Uses CLASS_ATTENDANCE_THRESHOLDS constant
 */
function getAttendanceBadgeVariant(percentage: number): BadgeVariant {
    if (percentage >= CLASS_ATTENDANCE_THRESHOLDS.EXCELLENT) return 'default';
    if (percentage >= CLASS_ATTENDANCE_THRESHOLDS.GOOD) return 'secondary';
    if (percentage >= CLASS_ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'warning';
    return 'destructive';
}

/**
 * Check if today is the student's birthday
 */
function isBirthdayToday(dateOfBirth: string | null): boolean {
    if (!dateOfBirth) return false;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    return (
        today.getMonth() === birthDate.getMonth() &&
        today.getDate() === birthDate.getDate()
    );
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string | null): number | null {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age > 0 ? age : null;
}

/**
 * Get enrollment status badge variant
 * Uses CLASS_ENROLLMENT_STATUS_OPTIONS for consistent color mapping
 */
function getEnrollmentBadgeVariant(status: string): BadgeVariant {
    const normalizedStatus = status.toUpperCase() as ClassEnrollmentStatus;
    
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[normalizedStatus];
    if (!statusConfig) return 'secondary';

    const colorMap: Record<string, BadgeVariant> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
        'muted': 'secondary',
    };

    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Get enrollment status label
 * Uses CLASS_ENROLLMENT_STATUS_OPTIONS for consistent labeling
 */
function getEnrollmentStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Not Enrolled';
    
    const normalizedStatus = status.toUpperCase() as ClassEnrollmentStatus;
    
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[normalizedStatus];
    return statusConfig?.label || status;
}

export function StudentsListView({ students, onViewDetails }: StudentsListViewProps) {
    if (!students || students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    No students match your search criteria. Try adjusting your filters.
                </p>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-2">
                {students.map((student, index) => {
                    const attendancePercentage = student.attendance_percentage || 0;
                    const attendanceBadgeVariant = getAttendanceBadgeVariant(attendancePercentage);
                    const hasBirthday = isBirthdayToday(student.date_of_birth);
                    const age = calculateAge(student.date_of_birth);
                    const enrollmentBadgeVariant = student.enrollment_status 
                        ? getEnrollmentBadgeVariant(student.enrollment_status)
                        : 'secondary';
                    const enrollmentStatusLabel = getEnrollmentStatusLabel(student.enrollment_status);

                    return (
                        <div key={student.student_id}>
                            <Item
                                variant="default"
                                className={cn(
                                    'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                                    'items-stretch gap-6 px-5 py-4',
                                    hasBirthday && 'bg-gradient-to-r from-pink-50/50 via-purple-50/30 to-blue-50/50 border-pink-200/50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20'
                                )}
                            >
                                {/* Student Avatar with Birthday Indicator */}
                                <ItemMedia variant="icon">
                                    <div className="relative rounded-full overflow-visible flex-shrink-0">
                                        {/* Birthday celebration ring */}
                                        {hasBirthday && (
                                            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full animate-pulse" />
                                        )}
                                        
                                        <div className={cn(
                                            "relative w-full h-full rounded-full overflow-hidden",
                                            hasBirthday && "ring-2 ring-white dark:ring-gray-900"
                                        )}>
                                            <UserAvatar
                                                profile={{
                                                    id: student.student_id,
                                                    full_name: student.student_name,
                                                    avatar_url: student.avatar_url,
                                                }}
                                                size="lg"
                                                fallbackToInitials={true}
                                            />
                                        </div>

                                        {/* Birthday badge overlay */}
                                        {hasBirthday && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-1 shadow-lg ring-2 ring-white dark:ring-gray-900 cursor-help z-10">
                                                        <Cake className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent 
                                                    side="right" 
                                                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white border-none shadow-xl"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <PartyPopper className="h-4 w-4 animate-bounce" />
                                                        <span className="font-semibold">
                                                            🎉 Happy {age ? `${age}th` : ''} Birthday! 🎂
                                                        </span>
                                                        <Sparkles className="h-4 w-4 animate-pulse" />
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </ItemMedia>

                                {/* Content - 2 lines like class list */}
                                <ItemContent>
                                    {/* Line 1: Student Name + Enrollment Badge + Birthday Sparkle */}
                                    <ItemTitle className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary",
                                            hasBirthday && "bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
                                        )}>
                                            {student.student_name || 'Unknown Student'}
                                        </span>
                                        
                                        {/* Enrollment Status Badge */}
                                        {student.enrollment_status && (
                                            <Badge
                                                variant={enrollmentBadgeVariant}
                                                className="text-xs font-medium hidden sm:inline-flex"
                                            >
                                                {enrollmentStatusLabel}
                                            </Badge>
                                        )}

                                        {/* Birthday Sparkle Icon */}
                                        {hasBirthday && (
                                            <Sparkles className="h-4 w-4 text-pink-500 animate-pulse flex-shrink-0" />
                                        )}
                                    </ItemTitle>

                                    {/* Line 2: Class Name + Attendance (same line on desktop) */}
                                    <ItemDescription>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                                            {/* Class Name */}
                                            {student.class_name && (
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate" title={student.class_name}>
                                                        {student.class_name}
                                                    </span>
                                                </span>
                                            )}

                                            {/* Attendance */}
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>Attendance:</span>
                                                <Badge 
                                                    variant={attendanceBadgeVariant}
                                                    className="text-xs h-5 px-2 font-medium"
                                                >
                                                    {attendancePercentage}%
                                                </Badge>
                                            </span>
                                        </div>
                                    </ItemDescription>
                                </ItemContent>

                                {/* Actions */}
                                <ItemActions>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewDetails(student.student_id)}
                                        className="gap-1.5 h-8 px-2 sm:px-3"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="hidden sm:inline">View</span>
                                    </Button>
                                </ItemActions>
                            </Item>

                            {index < students.length - 1 && <ItemSeparator />}
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
