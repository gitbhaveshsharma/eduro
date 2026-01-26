/**
 * Attendance Student Item Component
 * 
 * Individual student row with attendance status and quick actions
 */

'use client';

import { useState } from 'react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
} from '@/components/ui/item';
import {
    UserCheck,
    UserX,
    Clock,
    FileText,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Edit,
    Trash2,
    BarChart3,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AttendanceStatus,
    formatAttendanceStatus,
    ATTENDANCE_STATUS_CONFIG,
} from '@/lib/branch-system/student-attendance';
import type { DailyAttendanceRecord } from '@/lib/branch-system/types/student-attendance.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { StudentSummaryModal } from './student-attendance-summary-modal';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface AttendanceStudentItemProps {
    record: DailyAttendanceRecord;
    onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
    onEditAttendance: (record: DailyAttendanceRecord) => void;
    onDeleteAttendance: (record: DailyAttendanceRecord) => void;
    isSubmitting?: boolean;
    centerId: string;
    classId: string;
}

/**
 * Get badge variant based on attendance status
 */
function getStatusBadgeVariant(status: AttendanceStatus | null): BadgeVariant {
    if (!status) return 'outline';

    const variants: Record<AttendanceStatus, BadgeVariant> = {
        [AttendanceStatus.PRESENT]: 'success',
        [AttendanceStatus.ABSENT]: 'destructive',
        [AttendanceStatus.LATE]: 'warning',
        [AttendanceStatus.EXCUSED]: 'secondary',
        [AttendanceStatus.HOLIDAY]: 'outline',
    };

    return variants[status] || 'outline';
}

/**
 * Get status icon
 */
function getStatusIcon(status: AttendanceStatus | null) {
    if (!status) return null;

    const icons: Record<AttendanceStatus, React.ReactNode> = {
        [AttendanceStatus.PRESENT]: <CheckCircle2 className="h-3.5 w-3.5" />,
        [AttendanceStatus.ABSENT]: <XCircle className="h-3.5 w-3.5" />,
        [AttendanceStatus.LATE]: <Clock className="h-3.5 w-3.5" />,
        [AttendanceStatus.EXCUSED]: <FileText className="h-3.5 w-3.5" />,
        [AttendanceStatus.HOLIDAY]: <FileText className="h-3.5 w-3.5" />,
    };

    return icons[status];
}

export function AttendanceStudentItem({
    record,
    onMarkAttendance,
    onEditAttendance,
    onDeleteAttendance,
    isSubmitting = false,
    centerId,
    classId,
}: AttendanceStudentItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    // Don't fetch summary on mount - only fetch when modal opens
    // This prevents showing stale data from previous students

    const isMarked = record.is_marked;
    const status = record.attendance_status;

    const statusConfig = status ? ATTENDANCE_STATUS_CONFIG[status] : null;
    const badgeVariant = getStatusBadgeVariant(status);

    return (
        <TooltipProvider delayDuration={200}>
            <Item
                variant="default"
                className={cn(
                    'group/item hover:shadow-sm transition-all duration-200',
                    'items-center gap-4 px-4 py-3 cursor-pointer'
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setSummaryModalOpen(true)}
            >
                {/* Student Avatar */}
                <ItemMedia variant="icon">
                    <UserAvatar
                        profile={{
                            id: record.student_id,
                            full_name: record.student_name,
                            avatar_url: record.student_avatar,
                        }}
                        size="md"
                        fallbackToInitials={true}
                    />
                </ItemMedia>

                {/* Student Info */}
                <ItemContent className="min-w-0 flex-1">
                    <ItemTitle className="truncate font-medium text-sm">
                        {record.student_name || 'Unknown Student'}
                    </ItemTitle>
                    <ItemDescription className="flex items-center gap-2 text-xs">{isMarked ? (
                        <Badge variant={badgeVariant} className="gap-1 text-xs h-5">
                            {getStatusIcon(status)}
                            <span>{formatAttendanceStatus(status!, false)}</span>
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">Not marked</span>
                    )}
                        {record.check_in_time && (
                            <span className="text-muted-foreground">
                                • {record.check_in_time}
                            </span>
                        )}
                        {record.late_by_minutes > 0 && (
                            <span className="text-orange-600">
                                • {record.late_by_minutes}m late
                            </span>
                        )}
                    </ItemDescription>
                </ItemContent>

                {/* Quick Actions */}
                <ItemActions className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Quick Mark Buttons - Show when not marked or on hover */}
                    {(!isMarked || isHovered) && (
                        <div className={cn(
                            'flex items-center gap-1 transition-opacity',
                            isMarked && !isHovered && 'opacity-0'
                        )}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkAttendance(record.student_id, AttendanceStatus.PRESENT);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        <UserCheck className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Present</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkAttendance(record.student_id, AttendanceStatus.ABSENT);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        <UserX className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Absent</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkAttendance(record.student_id, AttendanceStatus.LATE);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Late By 15m</TooltipContent>
                            </Tooltip>
                        </div>
                    )}

                    {/* View Summary Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSummaryModalOpen(true);
                                }}
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Analytics</TooltipContent>
                    </Tooltip>

                    {/* More Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {/* Status Options */}
                            {Object.values(AttendanceStatus).map((statusOption) => (
                                <DropdownMenuItem
                                    key={statusOption}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAttendance(record.student_id, statusOption);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <span className="mr-2">
                                        {ATTENDANCE_STATUS_CONFIG[statusOption].emoji}
                                    </span>
                                    {ATTENDANCE_STATUS_CONFIG[statusOption].label}
                                </DropdownMenuItem>
                            ))}

                            {isMarked && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditAttendance(record);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteAttendance(record);
                                        }}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ItemActions>
            </Item>

            {/* Student Summary Modal */}
            <StudentSummaryModal
                open={summaryModalOpen}
                onOpenChange={setSummaryModalOpen}
                studentId={record.student_id}
                studentName={record.student_name}
                studentAvatar={record.student_avatar}
                classId={classId}
            />
        </TooltipProvider>
    );
}
