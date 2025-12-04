'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, UserCheck, UserX, Clock, Building2, GraduationCap, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    useBulkMarkAttendance,
    AttendanceStatus,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { CoachingAPI } from '@/lib/coaching';
import { BranchClassesAPI, useClassesByBranch, useBranchClassesStore } from '@/lib/branch-system/branch-classes';
import { useBranchStudentsStore } from '@/lib/branch-system/branch-students';
import type { CoachingBranch } from '@/lib/schema/coaching.types';
import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';
import type { BranchStudent } from '@/lib/branch-system/types/branch-students.types';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import { useCurrentProfile } from '@/lib/profile';

interface BulkMarkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coachingCenterId?: string;
    branchId?: string;
}

export default function BulkMarkDialog({
    open,
    onOpenChange,
    coachingCenterId,
    branchId: propBranchId
}: BulkMarkDialogProps) {
    // Date and attendance state
    const [date, setDate] = useState<Date>(new Date());
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);

    // Selection state for cascading dropdowns
    const [branches, setBranches] = useState<CoachingBranch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(propBranchId || '');
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // Loading states
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Students state
    const [students, setStudents] = useState<(BranchStudent & { profile?: { full_name?: string; avatar_url?: string; username?: string } })[]>([]);

    // Hooks
    const bulkMarkAttendance = useBulkMarkAttendance();
    const currentProfile = useCurrentProfile();
    const classes = useClassesByBranch(selectedBranchId || null);
    const { fetchClassesByBranch } = useBranchClassesStore();
    const { fetchClassStudents, studentEnrollments, listLoading: studentsLoading } = useBranchStudentsStore();

    // Determine view mode
    const isCoachView = !!coachingCenterId && !propBranchId;
    const isBranchView = !!propBranchId;

    // For branch view, auto-set the branch ID and fetch classes immediately
    useEffect(() => {
        if (isBranchView && propBranchId && open) {
            setSelectedBranchId(propBranchId);
        }
    }, [isBranchView, propBranchId, open]);

    // Fetch branches when dialog opens (for coach view)
    useEffect(() => {
        if (!open) return;

        const loadBranches = async () => {
            if (isCoachView && coachingCenterId) {
                setLoadingBranches(true);
                try {
                    const result = await CoachingAPI.getBranchesByCenter(coachingCenterId);
                    if (result.success && result.data) {
                        setBranches(result.data);
                    }
                } catch (error) {
                    console.error('Failed to load branches:', error);
                    showErrorToast('Failed to load branches');
                } finally {
                    setLoadingBranches(false);
                }
            }
        };

        loadBranches();
    }, [open, isCoachView, coachingCenterId]);



    // Fetch classes when branch is selected
    useEffect(() => {
        if (!selectedBranchId) return;

        const loadClasses = async () => {
            setLoadingClasses(true);
            setSelectedClassId('');
            setStudents([]);
            setSelectedStudents(new Set());

            try {
                await fetchClassesByBranch(selectedBranchId);
            } catch (error) {
                console.error('Failed to load classes:', error);
                showErrorToast('Failed to load classes');
            } finally {
                setLoadingClasses(false);
            }
        };

        loadClasses();
    }, [selectedBranchId, fetchClassesByBranch]);

    // Fetch students when class is selected
    useEffect(() => {
        if (!selectedClassId) return;

        const loadStudents = async () => {
            setLoadingStudents(true);
            setSelectedStudents(new Set());

            try {
                await fetchClassStudents(selectedClassId, { enrollment_status: 'ENROLLED' });
            } catch (error) {
                console.error('Failed to load students:', error);
                showErrorToast('Failed to load students');
            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudents();
    }, [selectedClassId, fetchClassStudents]);

    // Update students from store when enrollments change
    useEffect(() => {
        if (studentEnrollments && studentEnrollments.length > 0) {
            setStudents(studentEnrollments as any);
        }
    }, [studentEnrollments]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedStudents(new Set());
            if (!propBranchId) {
                setSelectedBranchId('');
            }
            setSelectedClassId('');
            setStudents([]);
        }
    }, [open, propBranchId]);

    const toggleStudent = useCallback((studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedStudents(new Set(students.map(s => s.student_id)));
    }, [students]);

    const deselectAll = useCallback(() => {
        setSelectedStudents(new Set());
    }, []);

    const handleBulkMark = async () => {
        if (selectedStudents.size === 0) {
            showErrorToast('Please select at least one student');
            return;
        }

        if (!selectedClassId) {
            showErrorToast('Please select a class');
            return;
        }

        if (!selectedBranchId) {
            showErrorToast('Please select a branch');
            return;
        }

        const attendanceRecords = Array.from(selectedStudents).map(studentId => ({
            student_id: studentId,
            attendance_status: bulkStatus,
            check_in_time: format(new Date(), 'HH:mm'),
            late_by_minutes: bulkStatus === AttendanceStatus.LATE ? 15 : 0,
            teacher_remarks: `Bulk marked as ${bulkStatus}`,
        }));

        const success = await bulkMarkAttendance({
            class_id: selectedClassId,
            teacher_id: currentProfile?.id || '',
            branch_id: selectedBranchId,
            attendance_date: format(date, 'yyyy-MM-dd'),
            attendance_records: attendanceRecords,
        });

        if (success) {
            showSuccessToast(`Attendance marked for ${selectedStudents.size} students`);
            setSelectedStudents(new Set());
            onOpenChange(false);
        } else {
            showErrorToast('Failed to mark bulk attendance');
        }
    };

    // Get selected class info for display
    const selectedClass = useMemo(() => {
        return classes.find(c => c.id === selectedClassId);
    }, [classes, selectedClassId]);

    // Get selected branch info for display
    const selectedBranch = useMemo(() => {
        return branches.find(b => b.id === selectedBranchId);
    }, [branches, selectedBranchId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col ">
                <DialogHeader>
                    <DialogTitle>Bulk Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Select branch, class, and students to mark attendance for multiple students at once
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="space-y-4">
                        {/* Date Picker */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        {format(date, 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Branch Selection (only for coach view) */}
                        {isCoachView && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Select Branch
                                </label>
                                <Select
                                    value={selectedBranchId}
                                    onValueChange={setSelectedBranchId}
                                    disabled={loadingBranches}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={loadingBranches ? "Loading branches..." : "Select a branch"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {branches.length === 0 && !loadingBranches && (
                                    <p className="text-sm text-muted-foreground">No branches found</p>
                                )}
                            </div>
                        )}

                        {/* Class Selection - Always show when branch is selected */}
                        {selectedBranchId && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Select Class
                                </label>
                                <Select
                                    value={selectedClassId}
                                    onValueChange={setSelectedClassId}
                                    disabled={loadingClasses || !selectedBranchId}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select a class"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{cls.class_name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {cls.subject}
                                                    </Badge>
                                                    {cls.batch_name && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {cls.batch_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {classes.length === 0 && !loadingClasses && selectedBranchId && (
                                    <p className="text-sm text-muted-foreground">No classes found for this branch</p>
                                )}
                            </div>
                        )}

                        {/* Students Selection Header */}
                        {selectedClassId && (
                            <>
                                <div className="flex items-center justify-between pt-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Select Students
                                        {selectedClass && (
                                            <Badge variant="outline">
                                                {selectedClass.class_name} - {selectedClass.subject}
                                            </Badge>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={selectAll}
                                            disabled={students.length === 0}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={deselectAll}
                                            disabled={selectedStudents.size === 0}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>
                                </div>

                                {/* Quick Status Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={bulkStatus === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                                        onClick={() => setBulkStatus(AttendanceStatus.PRESENT)}
                                        className="gap-2"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Present
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={bulkStatus === AttendanceStatus.ABSENT ? 'default' : 'outline'}
                                        onClick={() => setBulkStatus(AttendanceStatus.ABSENT)}
                                        className="gap-2"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Absent
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={bulkStatus === AttendanceStatus.LATE ? 'default' : 'outline'}
                                        onClick={() => setBulkStatus(AttendanceStatus.LATE)}
                                        className="gap-2"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Late
                                    </Button>
                                </div>

                                {/* Student List */}
                                <ScrollArea className="h-[300px] border rounded-lg p-4">
                                    {loadingStudents || studentsLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-muted-foreground">Loading students...</span>
                                        </div>
                                    ) : students.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <Users className="w-12 h-12 mb-2 opacity-50" />
                                            <p>No enrolled students found in this class</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {students.map((student) => {
                                                const studentName = (student as any).profile?.full_name ||
                                                    (student as any).student?.full_name ||
                                                    `Student ${student.student_id.slice(0, 8)}`;
                                                const avatarUrl = (student as any).profile?.avatar_url ||
                                                    (student as any).student?.avatar_url;
                                                const username = (student as any).profile?.username ||
                                                    (student as any).student?.username;

                                                return (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => toggleStudent(student.student_id)}
                                                    >
                                                        <Checkbox
                                                            checked={selectedStudents.has(student.student_id)}
                                                            onCheckedChange={() => toggleStudent(student.student_id)}
                                                        />
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                            {avatarUrl ? (
                                                                <img
                                                                    src={AvatarUtils.getSafeAvatarUrl(avatarUrl, studentName)}
                                                                    alt={studentName}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-medium">
                                                                    {studentName.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{studentName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {username ? `@${username}` : `ID: ${student.student_id.slice(0, 8)}...`}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant={student.enrollment_status === 'ENROLLED' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {student.enrollment_status}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </ScrollArea>

                                {/* Selected Count */}
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">
                                        {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                                    </Badge>
                                    <Badge variant="outline">
                                        Total: {students.length} students
                                    </Badge>
                                </div>
                            </>
                        )}

                        {/* Info message when no class selected */}
                        {!selectedClassId && selectedBranchId && !loadingClasses && classes.length > 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <GraduationCap className="w-12 h-12 mb-2 opacity-50" />
                                <p>Please select a class to view students</p>
                            </div>
                        )}

                        {/* Info message when no branch selected (coach view) */}
                        {isCoachView && !selectedBranchId && !loadingBranches && branches.length > 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Building2 className="w-12 h-12 mb-2 opacity-50" />
                                <p>Please select a branch to view classes</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkMark}
                                disabled={selectedStudents.size === 0 || !selectedClassId || !selectedBranchId}
                            >
                                Mark Attendance ({selectedStudents.size})
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
