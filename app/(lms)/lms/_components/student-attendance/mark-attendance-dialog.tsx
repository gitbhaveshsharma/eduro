'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
    useAttendanceActions,
    AttendanceStatus,
    markAttendanceSchema,
    formatAttendanceStatus,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface MarkAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function MarkAttendanceDialog({ open, onOpenChange }: MarkAttendanceDialogProps) {
    const [date, setDate] = useState<Date>(new Date());
    const { markAttendance } = useAttendanceActions();

    const form = useForm({
        resolver: zodResolver(markAttendanceSchema),
        defaultValues: {
            student_id: '',
            class_id: 'default-class-id',
            teacher_id: 'current-teacher-id',
            branch_id: 'current-branch-id',
            attendance_date: format(new Date(), 'yyyy-MM-dd'),
            attendance_status: AttendanceStatus.PRESENT,
            check_in_time: format(new Date(), 'HH:mm'),
            check_out_time: '',
            late_by_minutes: 0,
            teacher_remarks: '',
        },
    });

    const onSubmit = async (data: any) => {
        const success = await markAttendance({
            ...data,
            attendance_date: format(date, 'yyyy-MM-dd'),
        });

        if (success) {
            showSuccessToast('Attendance marked successfully');
            form.reset();
            onOpenChange(false);
        } else {
            showErrorToast('Failed to mark attendance');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Mark attendance for a student with detailed information
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Student ID */}
                        <FormField
                            control={form.control}
                            name="student_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Student ID *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter student UUID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <FormLabel>Attendance Date *</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start gap-2">
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

                        {/* Attendance Status */}
                        <FormField
                            control={form.control}
                            name="attendance_status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attendance Status *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(AttendanceStatus).map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {formatAttendanceStatus(status, true)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Check In Time */}
                        <FormField
                            control={form.control}
                            name="check_in_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Check In Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Check Out Time */}
                        <FormField
                            control={form.control}
                            name="check_out_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Check Out Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Late Minutes */}
                        <FormField
                            control={form.control}
                            name="late_by_minutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Late By (minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Teacher Remarks */}
                        <FormField
                            control={form.control}
                            name="teacher_remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teacher Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add any remarks or notes..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Mark Attendance</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
