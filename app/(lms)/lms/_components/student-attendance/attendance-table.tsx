'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
    useFetchBranchDailyAttendance,
    useFetchCoachingCenterDailyAttendance,
    useMarkAttendance,
    useSetCurrentRecord,
    useAttendanceLoading,
    AttendanceStatus,
    formatAttendanceStatus,
    formatTime,
    DailyAttendanceRecord,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import AttendanceFilters from './attendance-filters';

/**
 * AttendanceTable Props
 * For branch manager view: pass branchId
 * For coach view: pass coachingCenterId
 */
interface AttendanceTableProps {
    branchId?: string;
    coachingCenterId?: string;
}

export default function AttendanceTable({ branchId, coachingCenterId }: AttendanceTableProps) {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedClass, setSelectedClass] = useState('all');
    const [studentUsername, setStudentUsername] = useState('');
    const [checkInTimes, setCheckInTimes] = useState<Record<string, string>>({});

    // Track if we've already fetched
    const lastFetchRef = useRef<string | null>(null);

    const dailyRecords = useDailyAttendanceRecords();
    const loading = useAttendanceLoading();
    const fetchDailyAttendance = useFetchDailyAttendance();
    const fetchBranchDailyAttendance = useFetchBranchDailyAttendance();
    const fetchCoachingCenterDailyAttendance = useFetchCoachingCenterDailyAttendance();
    const markAttendance = useMarkAttendance();
    const setCurrentRecord = useSetCurrentRecord();

    // Determine which fetch function to use based on context
    const isBranchView = !!branchId;
    const isCoachView = !!coachingCenterId && !branchId;

    useEffect(() => {
        const fetchKey = `${branchId || coachingCenterId || selectedClass}-${selectedDate}`;

        // Prevent duplicate fetches
        if (lastFetchRef.current === fetchKey) {
            return;
        }

        const fetchAttendance = async () => {
            if (isBranchView && branchId) {
                await fetchBranchDailyAttendance(branchId, selectedDate);
                lastFetchRef.current = fetchKey;
            } else if (isCoachView && coachingCenterId) {
                await fetchCoachingCenterDailyAttendance(coachingCenterId, selectedDate);
                lastFetchRef.current = fetchKey;
            } else if (selectedClass && selectedClass !== 'all') {
                // Fallback to class-based fetch
                await fetchDailyAttendance(selectedClass, selectedDate);
                lastFetchRef.current = fetchKey;
            }
        };

        fetchAttendance();
    }, [selectedDate, selectedClass, branchId, coachingCenterId, isBranchView, isCoachView, fetchDailyAttendance, fetchBranchDailyAttendance, fetchCoachingCenterDailyAttendance]);

    // Client-side filtering for username and class
    const filteredRecords = useMemo(() => {
        let records = dailyRecords;

        // Filter by class if selected (not 'all')
        if (selectedClass && selectedClass !== 'all') {
            records = records.filter(r => r.class_name); // Keep records that match the class context
        }

        // Filter by username (partial match, case-insensitive)
        if (studentUsername) {
            const searchTerm = studentUsername.toLowerCase();
            records = records.filter(r =>
                r.student_username?.toLowerCase().includes(searchTerm) ||
                r.student_name?.toLowerCase().includes(searchTerm)
            );
        }

        return records;
    }, [dailyRecords, selectedClass, studentUsername]);

    const handleQuickMark = async (
        studentId: string,
        studentName: string,
        status: AttendanceStatus
    ) => {
        const checkInTime = checkInTimes[studentId] || format(new Date(), 'HH:mm');
        const lateMinutes = status === AttendanceStatus.LATE ? 15 : 0;

        // Use the branchId from props if available
        const effectiveBranchId = branchId || 'current-branch-id';

        const success = await markAttendance({
            student_id: studentId,
            class_id: selectedClass !== 'all' ? selectedClass : '',
            teacher_id: 'current-teacher-id', // Replace with actual teacher ID from auth
            branch_id: effectiveBranchId,
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

    const handleViewDetails = (record: DailyAttendanceRecord) => {
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
                branchId={branchId}
                coachingCenterId={coachingCenterId}
                studentUsername={studentUsername}
                onStudentUsernameChange={setStudentUsername}
            />

            {/* Attendance Table */}
            <div className="border rounded-lg">
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Class / Branch</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Late By</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <div className="text-muted-foreground">
                                            <p className="text-lg font-semibold">No students found</p>
                                            <p className="text-sm mt-1">
                                                {studentUsername
                                                    ? `No students match "${studentUsername}"`
                                                    : 'Add students to this class to start marking attendance'
                                                }
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record, index) => (
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
                                                    {record.student_username ? (
                                                        <p className="text-xs text-muted-foreground">@{record.student_username}</p>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: {record.student_id.slice(0, 8)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Class / Branch Info */}
                                        <TableCell>
                                            <div className="text-sm">
                                                {record.class_name && (
                                                    <p className="font-medium">{record.class_name}</p>
                                                )}
                                                {record.branch_name && (
                                                    <p className="text-xs text-muted-foreground">{record.branch_name}</p>
                                                )}
                                                {!record.class_name && !record.branch_name && (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
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
                        <span className="font-semibold">{filteredRecords.length}</span>
                        {filteredRecords.length !== dailyRecords.length && (
                            <span className="text-xs text-muted-foreground ml-1">
                                (of {dailyRecords.length})
                            </span>
                        )}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Marked: </span>
                        <span className="font-semibold text-green-600">
                            {filteredRecords.filter(r => r.is_marked).length}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Unmarked: </span>
                        <span className="font-semibold text-orange-600">
                            {filteredRecords.filter(r => !r.is_marked).length}
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
