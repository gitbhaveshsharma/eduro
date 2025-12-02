'use client';

import { useState } from 'react';
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
import { Calendar as CalendarIcon, UserCheck, UserX, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
    useBulkMarkAttendance,
    AttendanceStatus,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface BulkMarkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function BulkMarkDialog({ open, onOpenChange }: BulkMarkDialogProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);

    const bulkMarkAttendance = useBulkMarkAttendance();

    // Mock students data - replace with actual data
    const mockStudents = [
        { id: '1', name: 'John Doe', avatar: null },
        { id: '2', name: 'Jane Smith', avatar: null },
        { id: '3', name: 'Bob Johnson', avatar: null },
    ];

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedStudents(new Set(mockStudents.map(s => s.id)));
    };

    const deselectAll = () => {
        setSelectedStudents(new Set());
    };

    const handleBulkMark = async () => {
        if (selectedStudents.size === 0) {
            showErrorToast('Please select at least one student');
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
            class_id: 'default-class-id',
            teacher_id: 'current-teacher-id',
            branch_id: 'current-branch-id',
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col ">
                <DialogHeader>
                    <DialogTitle>Bulk Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Select students and mark attendance for multiple students at once
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="space-y-4">
                        {/* Date Picker */}
                        <div className="flex items-center gap-4">
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

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={selectAll}>
                                    Select All
                                </Button>
                                <Button size="sm" variant="outline" onClick={deselectAll}>
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
                        <ScrollArea className="h-[400px] border rounded-lg p-4">
                            <div className="space-y-2">
                                {mockStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        <Checkbox
                                            checked={selectedStudents.has(student.id)}
                                            onCheckedChange={() => toggleStudent(student.id)}
                                        />
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {student.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Selected Count */}
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                            </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleBulkMark}>
                                Mark Attendance
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
