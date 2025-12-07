'use client';

import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    UserCheck,
    UserX,
    Clock,
    FileText,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    User,
    Calendar
} from 'lucide-react';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import {
    useDailyAttendanceRecords,
    useFetchDailyAttendance,
    useFetchBranchDailyAttendance,
    useFetchCoachingCenterDailyAttendance,
    useMarkAttendance,
    useSetCurrentRecord,
    useOpenDeleteDialog,
    useOpenEditDialog,
    useAttendanceLoading,
    AttendanceStatus,
    formatAttendanceStatus,
    formatTime,
    DailyAttendanceRecord,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { useCurrentProfile } from '@/lib/profile';
import AttendanceFilters from './attendance-filters';

/**
 * Student Info with Tooltip Component
 */
interface StudentInfoTooltipProps {
    studentId: string;
    studentName: string;
    studentUsername?: string | null;
    studentAvatar?: string | null;
}

const StudentInfoTooltip = memo(function StudentInfoTooltip({
    studentId,
    studentName,
    studentUsername,
    studentAvatar
}: StudentInfoTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 cursor-help">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                                src={AvatarUtils.getSafeAvatarUrl(
                                    studentAvatar,
                                    studentName || 'S'
                                )}
                                alt={studentName}
                                className="w-10 h-10 object-cover"
                            />
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="font-medium text-sm leading-none">{studentName}</p>
                            {studentUsername ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    @{studentUsername}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ID: {studentId.slice(0, 8)}...
                                </p>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs">
                        <p className="font-medium">Student ID:</p>
                        <p className="font-mono">{studentId}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});

/**
 * Quick Mark Actions Component
 */
interface QuickMarkActionsProps {
    studentId: string;
    studentName: string;
    checkInTime: string;
    onCheckInChange: (time: string) => void;
    onMark: (status: AttendanceStatus) => void;
}

const QuickMarkActions = memo(function QuickMarkActions({
    studentId,
    studentName,
    checkInTime,
    onCheckInChange,
    onMark
}: QuickMarkActionsProps) {
    return (
        <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1"
                    onClick={() => onMark(AttendanceStatus.PRESENT)}
                >
                    <UserCheck className="w-3 h-3" />
                    Present
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1"
                    onClick={() => onMark(AttendanceStatus.ABSENT)}
                >
                    <UserX className="w-3 h-3" />
                    Absent
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1"
                    onClick={() => onMark(AttendanceStatus.LATE)}
                >
                    <Clock className="w-3 h-3" />
                    Late
                </Button>
            </div>
            <Input
                type="time"
                className="w-32 h-7 text-xs"
                value={checkInTime}
                onChange={(e) => onCheckInChange(e.target.value)}
            />
        </div>
    );
});

/**
 * Attendance Row Actions Component
 */
interface AttendanceRowActionsProps {
    record: DailyAttendanceRecord;
    onView: (record: DailyAttendanceRecord) => void;
    onEdit: (record: DailyAttendanceRecord) => void;
    onDelete: (record: DailyAttendanceRecord) => void;
}

const AttendanceRowActions = memo(function AttendanceRowActions({
    record,
    onView,
    onEdit,
    onDelete
}: AttendanceRowActionsProps) {
    const handleView = useCallback(() => onView(record), [record, onView]);
    const handleEdit = useCallback(() => onEdit(record), [record, onEdit]);
    const handleDelete = useCallback(() => onDelete(record), [record, onDelete]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Attendance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Attendance Row Component
 */
interface AttendanceRowProps {
    record: DailyAttendanceRecord;
    index: number;
    checkInTime: string;
    onCheckInChange: (studentId: string, time: string) => void;
    onQuickMark: (record: DailyAttendanceRecord, status: AttendanceStatus) => void;
    onView: (record: DailyAttendanceRecord) => void;
    onEdit: (record: DailyAttendanceRecord) => void;
    onDelete: (record: DailyAttendanceRecord) => void;
}

const AttendanceRow = memo(function AttendanceRow({
    record,
    index,
    checkInTime,
    onCheckInChange,
    onQuickMark,
    onView,
    onEdit,
    onDelete
}: AttendanceRowProps) {
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

    return (
        <TableRow>
            {/* Index */}
            <TableCell className="font-medium">{index + 1}</TableCell>

            {/* Student Info */}
            <TableCell>
                <StudentInfoTooltip
                    studentId={record.student_id}
                    studentName={record.student_name}
                    studentUsername={record.student_username}
                    studentAvatar={record.student_avatar}
                />
            </TableCell>

            {/* Class / Branch */}
            <TableCell>
                <div className="text-sm space-y-0.5">
                    {record.class_name && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium">{record.class_name}</p>
                        </div>
                    )}
                    {record.branch_name && (
                        <p className="text-xs text-muted-foreground pl-4">
                            {record.branch_name}
                        </p>
                    )}
                    {!record.class_name && !record.branch_name && (
                        <span className="text-muted-foreground">-</span>
                    )}
                </div>
            </TableCell>

            {/* Status / Quick Actions */}
            <TableCell>
                {record.is_marked ? (
                    getStatusBadge(record.attendance_status)
                ) : (
                    <QuickMarkActions
                        studentId={record.student_id}
                        studentName={record.student_name}
                        checkInTime={checkInTime}
                        onCheckInChange={(time) => onCheckInChange(record.student_id, time)}
                        onMark={(status) => onQuickMark(record, status)}
                    />
                )}
            </TableCell>

            {/* Check In/Out Times */}
            <TableCell>
                <div className="space-y-1 text-sm">
                    <div>
                        <span className="text-muted-foreground text-xs">In: </span>
                        <span className="font-medium">{formatTime(record.check_in_time)}</span>
                    </div>
                    {record.check_out_time && (
                        <div>
                            <span className="text-muted-foreground text-xs">Out: </span>
                            <span className="font-medium">{formatTime(record.check_out_time)}</span>
                        </div>
                    )}
                </div>
            </TableCell>

            {/* Late Minutes */}
            <TableCell>
                {record.late_by_minutes > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {record.late_by_minutes}m
                    </Badge>
                )}
            </TableCell>

            {/* Remarks */}
            <TableCell>
                {record.teacher_remarks && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[250px]">
                        <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{record.teacher_remarks}</span>
                    </div>
                )}
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
                {record.is_marked && (
                    <AttendanceRowActions
                        record={record}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                )}
            </TableCell>
        </TableRow>
    );
});

/**
 * Table Skeleton
 */
const TableSkeleton = memo(function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-8 w-[60px]" />
                </div>
            ))}
        </div>
    );
});

/**
 * Empty State
 */
const EmptyState = memo(function EmptyState({ studentUsername }: { studentUsername?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                {studentUsername
                    ? `No students match "${studentUsername}"`
                    : 'Add students to this class to start marking attendance'
                }
            </p>
        </div>
    );
});

/**
 * AttendanceTable Props
 */
interface AttendanceTableProps {
    branchId?: string;
    coachingCenterId?: string;
}

/**
 * Main Attendance Table Component
 */
export default function AttendanceTable({ branchId, coachingCenterId }: AttendanceTableProps) {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedClass, setSelectedClass] = useState('all');
    const [studentUsername, setStudentUsername] = useState('');
    const [checkInTimes, setCheckInTimes] = useState<Record<string, string>>({});

    const lastFetchRef = useRef<string | null>(null);

    const dailyRecords = useDailyAttendanceRecords();
    const loading = useAttendanceLoading();
    const fetchDailyAttendance = useFetchDailyAttendance();
    const fetchBranchDailyAttendance = useFetchBranchDailyAttendance();
    const fetchCoachingCenterDailyAttendance = useFetchCoachingCenterDailyAttendance();
    const markAttendance = useMarkAttendance();
    const setCurrentRecord = useSetCurrentRecord();
    const openDeleteDialog = useOpenDeleteDialog();
    const openEditDialog = useOpenEditDialog();
    const currentProfile = useCurrentProfile();

    const isBranchView = !!branchId;
    const isCoachView = !!coachingCenterId && !branchId;

    // Fetch attendance data
    useEffect(() => {
        const fetchKey = `${branchId || coachingCenterId || selectedClass}-${selectedDate}`;

        if (lastFetchRef.current === fetchKey) return;

        const fetchAttendance = async () => {
            if (isBranchView && branchId) {
                await fetchBranchDailyAttendance(branchId, selectedDate);
                lastFetchRef.current = fetchKey;
            } else if (isCoachView && coachingCenterId) {
                await fetchCoachingCenterDailyAttendance(coachingCenterId, selectedDate);
                lastFetchRef.current = fetchKey;
            } else if (selectedClass && selectedClass !== 'all') {
                await fetchDailyAttendance(selectedClass, selectedDate);
                lastFetchRef.current = fetchKey;
            }
        };

        fetchAttendance();
    }, [selectedDate, selectedClass, branchId, coachingCenterId, isBranchView, isCoachView, fetchDailyAttendance, fetchBranchDailyAttendance, fetchCoachingCenterDailyAttendance]);

    // Filter records
    const filteredRecords = useMemo(() => {
        let records = dailyRecords;

        if (selectedClass && selectedClass !== 'all') {
            records = records.filter(r => r.class_name);
        }

        if (studentUsername) {
            const searchTerm = studentUsername.toLowerCase();
            records = records.filter(r =>
                r.student_username?.toLowerCase().includes(searchTerm) ||
                r.student_name?.toLowerCase().includes(searchTerm)
            );
        }

        return records;
    }, [dailyRecords, selectedClass, studentUsername]);

    // Handlers
    const handleCheckInChange = useCallback((studentId: string, time: string) => {
        setCheckInTimes(prev => ({ ...prev, [studentId]: time }));
    }, []);

    const handleQuickMark = useCallback(async (
        record: DailyAttendanceRecord,
        status: AttendanceStatus
    ) => {
        const checkInTime = checkInTimes[record.student_id] || format(new Date(), 'HH:mm');
        const lateMinutes = status === AttendanceStatus.LATE ? 15 : 0;

        // Get effective IDs from record, props, or current profile
        const effectiveBranchId = record.branch_id || branchId;
        const effectiveClassId = record.class_id || (selectedClass !== 'all' ? selectedClass : null);
        const effectiveTeacherId = record.teacher_id || currentProfile?.id;

        // Validate required UUIDs
        if (!effectiveBranchId) {
            showErrorToast('Branch ID is required. Please select a branch or class.');
            return;
        }
        if (!effectiveClassId) {
            showErrorToast('Class ID is required. Please select a class first.');
            return;
        }
        if (!effectiveTeacherId) {
            showErrorToast('Teacher ID is required. Please ensure you are logged in.');
            return;
        }

        const success = await markAttendance({
            student_id: record.student_id,
            class_id: effectiveClassId,
            teacher_id: effectiveTeacherId,
            branch_id: effectiveBranchId,
            attendance_date: selectedDate,
            attendance_status: status,
            check_in_time: checkInTime,
            late_by_minutes: lateMinutes,
            teacher_remarks: `Quick marked as ${formatAttendanceStatus(status)}`,
        });

        if (success) {
            showSuccessToast(`${record.student_name} marked as ${formatAttendanceStatus(status)}`);
        } else {
            showErrorToast(`Failed to mark attendance for ${record.student_name}`);
        }
    }, [checkInTimes, branchId, selectedClass, selectedDate, markAttendance, currentProfile]);

    const handleView = useCallback((record: DailyAttendanceRecord) => {
        // Set the current record to open the details dialog
        if (record.attendance_id) {
            setCurrentRecord({
                id: record.attendance_id,
                student_id: record.student_id,
                class_id: record.class_id || '',
                teacher_id: record.teacher_id || '',
                branch_id: record.branch_id || '',
                attendance_date: record.attendance_date || selectedDate,
                attendance_status: record.attendance_status || AttendanceStatus.PRESENT,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                total_duration: null,
                late_by_minutes: record.late_by_minutes || 0,
                early_leave_minutes: record.early_leave_minutes || 0,
                teacher_remarks: record.teacher_remarks,
                excuse_reason: record.excuse_reason ?? null,
                metadata: {},
                created_at: record.created_at || new Date().toISOString(),
                updated_at: record.updated_at || new Date().toISOString(),
                student: {
                    id: record.student_id,
                    full_name: record.student_name,
                    username: record.student_username || null,
                    avatar_url: record.student_avatar || null,
                },
                class: record.class_id ? {
                    id: record.class_id,
                    class_name: record.class_name || '',
                    subject: record.subject || '',
                    grade_level: record.grade_level || '',
                } : undefined,
                teacher: record.teacher_id ? {
                    id: record.teacher_id,
                    full_name: record.teacher_name || '',
                } : undefined,
            });
        }
    }, [setCurrentRecord, selectedDate]);

    const handleEdit = useCallback((record: DailyAttendanceRecord) => {
        // Open edit dialog with the selected record (avoid using currentRecord which is for view)
        if (record.attendance_id) {
            openEditDialog({
                id: record.attendance_id,
                student_id: record.student_id,
                class_id: record.class_id || '',
                teacher_id: record.teacher_id || '',
                branch_id: record.branch_id || '',
                attendance_date: record.attendance_date || selectedDate,
                attendance_status: record.attendance_status || AttendanceStatus.PRESENT,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                total_duration: null,
                late_by_minutes: record.late_by_minutes || 0,
                early_leave_minutes: record.early_leave_minutes || 0,
                teacher_remarks: record.teacher_remarks,
                excuse_reason: record.excuse_reason ?? null,
                metadata: {},
                created_at: record.created_at || new Date().toISOString(),
                updated_at: record.updated_at || new Date().toISOString(),
                student: {
                    id: record.student_id,
                    full_name: record.student_name,
                    username: record.student_username || null,
                    avatar_url: record.student_avatar || null,
                },
                class: record.class_id ? {
                    id: record.class_id,
                    class_name: record.class_name || '',
                    subject: record.subject || '',
                    grade_level: record.grade_level || '',
                } : undefined,
                teacher: record.teacher_id ? {
                    id: record.teacher_id,
                    full_name: record.teacher_name || '',
                } : undefined,
            });
        }
    }, [openEditDialog, selectedDate]);

    const handleDelete = useCallback((record: DailyAttendanceRecord) => {
        // Open delete dialog with the record to delete
        if (record.attendance_id) {
            openDeleteDialog({
                id: record.attendance_id,
                student_id: record.student_id,
                class_id: record.class_id || '',
                teacher_id: record.teacher_id || '',
                branch_id: record.branch_id || '',
                attendance_date: record.attendance_date || selectedDate,
                attendance_status: record.attendance_status || AttendanceStatus.PRESENT,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                total_duration: null,
                late_by_minutes: record.late_by_minutes || 0,
                early_leave_minutes: record.early_leave_minutes || 0,
                teacher_remarks: record.teacher_remarks,
                excuse_reason: record.excuse_reason ?? null,
                metadata: {},
                created_at: record.created_at || new Date().toISOString(),
                updated_at: record.updated_at || new Date().toISOString(),
                student: {
                    id: record.student_id,
                    full_name: record.student_name,
                    username: record.student_username || null,
                    avatar_url: record.student_avatar || null,
                },
                class: record.class_id ? {
                    id: record.class_id,
                    class_name: record.class_name || '',
                    subject: record.subject || '',
                    grade_level: record.grade_level || '',
                } : undefined,
                teacher: record.teacher_id ? {
                    id: record.teacher_id,
                    full_name: record.teacher_name || '',
                } : undefined,
            });
        }
    }, [openDeleteDialog, selectedDate]);

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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="w-[240px]">Student</TableHead>
                            <TableHead className="w-[180px]">Class / Branch</TableHead>
                            <TableHead className="w-[200px]">Status</TableHead>
                            <TableHead className="w-[130px]">Time</TableHead>
                            <TableHead className="w-[100px]">Late By</TableHead>
                            <TableHead className="w-[250px]">Remarks</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <EmptyState studentUsername={studentUsername} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecords.map((record, index) => (
                                <AttendanceRow
                                    key={record.student_id}
                                    record={record}
                                    index={index}
                                    checkInTime={checkInTimes[record.student_id] || format(new Date(), 'HH:mm')}
                                    onCheckInChange={handleCheckInChange}
                                    onQuickMark={handleQuickMark}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex gap-6 text-sm flex-wrap">
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