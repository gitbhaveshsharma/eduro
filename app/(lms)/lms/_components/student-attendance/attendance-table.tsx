'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCheck, UserX, Clock, FileText, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import {
    useDailyAttendanceRecords,
    useFetchDailyAttendance,
    useMarkAttendance,
    useSetCurrentRecord,
    useAttendanceLoading,
    AttendanceStatus,
    formatAttendanceStatus,
    formatTime,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import AttendanceFilters from './attendance-filters';

export default function AttendanceTable() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedClass, setSelectedClass] = useState('default-class-id');
    const [checkInTimes, setCheckInTimes] = useState<Record<string, string>>({});

    const dailyRecords = useDailyAttendanceRecords();
    const loading = useAttendanceLoading();
    const fetchDailyAttendance = useFetchDailyAttendance();
    const markAttendance = useMarkAttendance();
    const setCurrentRecord = useSetCurrentRecord();

    useEffect(() => {
        fetchDailyAttendance(selectedClass, selectedDate);
    }, [selectedClass, selectedDate, fetchDailyAttendance]);

    const handleQuickMark = async (
        studentId: string,
        studentName: string,
        status: AttendanceStatus
    ) => {
        const checkInTime = checkInTimes[studentId] || format(new Date(), 'HH:mm');
        const lateMinutes = status === AttendanceStatus.LATE ? 15 : 0;

        const success = await markAttendance({
            student_id: studentId,
            class_id: selectedClass,
            teacher_id: 'current-teacher-id', // Replace with actual teacher ID from auth
            branch_id: 'current-branch-id', // Replace with actual branch ID
            attendance_date: selectedDate,
            attendance_status: status,
            check_in_time: checkInTime,
            late_by_minutes: lateMinutes,
            teacher_remarks: `Quick marked as ${formatAttendanceStatus(status)}`,
        });

        if (success) {
            showSuccessToast(`${studentName} marked as ${formatAttendanceStatus(status)}`);
        } else {
            showErrorToast(`Failed to mark attendance for ${studentName}`);
        }
    };

    const handleViewDetails = (record: typeof dailyRecords[0]) => {
        // This would set the current record for the details dialog
        // The actual attendance record ID would need to be fetched
        console.log('View details for:', record);
    };

    const getStatusBadge = (status: AttendanceStatus | null) => {
        if (!status) return <Badge variant="outline">Unmarked</Badge>;

        const variants: Record<AttendanceStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
            [AttendanceStatus.PRESENT]: 'default',
            [AttendanceStatus.ABSENT]: 'destructive',
            [AttendanceStatus.LATE]: 'secondary',
            [AttendanceStatus.EXCUSED]: 'outline',
            [AttendanceStatus.HOLIDAY]: 'secondary',
        };

        return (
            <Badge variant={variants[status]}>
                {formatAttendanceStatus(status, true)}
            </Badge>
        );
    };

    if (loading.daily && dailyRecords.length === 0) {
        return <TableSkeleton />;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <AttendanceFilters
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
            />

            {/* Attendance Table */}
            <div className="border rounded-lg">
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Late By</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="text-muted-foreground">
                                            <p className="text-lg font-semibold">No students found</p>
                                            <p className="text-sm mt-1">
                                                Add students to this class to start marking attendance
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dailyRecords.map((record, index) => (
                                    <TableRow key={record.student_id}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>

                                        {/* Student Info */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={AvatarUtils.getSafeAvatarUrl(
                                                            record.student_avatar,
                                                            record.student_name || 'S'
                                                        )}
                                                        alt={record.student_name}
                                                        className="w-10 h-10 object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{record.student_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {record.student_id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Status Badge */}
                                        <TableCell>
                                            {record.is_marked ? (
                                                getStatusBadge(record.attendance_status)
                                            ) : (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs gap-1"
                                                        onClick={() => handleQuickMark(
                                                            record.student_id,
                                                            record.student_name,
                                                            AttendanceStatus.PRESENT
                                                        )}
                                                    >
                                                        <UserCheck className="w-3 h-3" />
                                                        Present
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs gap-1"
                                                        onClick={() => handleQuickMark(
                                                            record.student_id,
                                                            record.student_name,
                                                            AttendanceStatus.ABSENT
                                                        )}
                                                    >
                                                        <UserX className="w-3 h-3" />
                                                        Absent
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs gap-1"
                                                        onClick={() => handleQuickMark(
                                                            record.student_id,
                                                            record.student_name,
                                                            AttendanceStatus.LATE
                                                        )}
                                                    >
                                                        <Clock className="w-3 h-3" />
                                                        Late
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Check In Time */}
                                        <TableCell>
                                            {record.is_marked ? (
                                                <span className="text-sm">{formatTime(record.check_in_time)}</span>
                                            ) : (
                                                <Input
                                                    type="time"
                                                    className="w-24 h-7 text-xs"
                                                    value={checkInTimes[record.student_id] || format(new Date(), 'HH:mm')}
                                                    onChange={(e) => setCheckInTimes(prev => ({
                                                        ...prev,
                                                        [record.student_id]: e.target.value
                                                    }))}
                                                />
                                            )}
                                        </TableCell>

                                        {/* Check Out Time */}
                                        <TableCell>
                                            <span className="text-sm">{formatTime(record.check_out_time)}</span>
                                        </TableCell>

                                        {/* Late Minutes */}
                                        <TableCell>
                                            {record.late_by_minutes > 0 && (
                                                <Badge variant="outline" className="text-orange-600">
                                                    {record.late_by_minutes}m
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Remarks */}
                                        <TableCell>
                                            {record.teacher_remarks && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="line-clamp-1">{record.teacher_remarks}</span>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            {record.is_marked && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex gap-6 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-semibold">{dailyRecords.length}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Marked: </span>
                        <span className="font-semibold text-green-600">
                            {dailyRecords.filter(r => r.is_marked).length}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Unmarked: </span>
                        <span className="font-semibold text-orange-600">
                            {dailyRecords.filter(r => !r.is_marked).length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Table Skeleton
function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="border rounded-lg p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        </div>
    );
}
