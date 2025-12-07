'use client';

import { useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    useRecordToEdit,
    useIsEditDialogOpen,
    useCloseEditDialog,
    useUpdateAttendance,
    AttendanceStatus,
    updateAttendanceSchema,
    formatAttendanceStatus,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export default function EditAttendanceDialog() {
    const currentRecord = useRecordToEdit();
    const isOpen = useIsEditDialogOpen();
    const closeEditDialog = useCloseEditDialog();
    const updateAttendance = useUpdateAttendance();

    const form = useForm({
        resolver: zodResolver(updateAttendanceSchema),
        defaultValues: {
            id: '',
            attendance_status: AttendanceStatus.PRESENT,
            check_in_time: '',
            check_out_time: '',
            late_by_minutes: 0,
            early_leave_minutes: 0,
            teacher_remarks: '',
            excuse_reason: '',
        },
    });

    useEffect(() => {
        if (currentRecord) {
            const formData = {
                id: currentRecord.id,
                attendance_status: currentRecord.attendance_status,
                check_in_time: currentRecord.check_in_time || '',
                check_out_time: currentRecord.check_out_time || '',
                late_by_minutes: currentRecord.late_by_minutes || 0,
                early_leave_minutes: currentRecord.early_leave_minutes || 0,
                teacher_remarks: currentRecord.teacher_remarks || '',
                excuse_reason: currentRecord.excuse_reason || '',
            };
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [currentRecord]);

    const onSubmit = async (data: any) => {
        const success = await updateAttendance(data);

        if (success) {
            showSuccessToast('Attendance updated successfully');
            closeEditDialog();
        } else {
            showErrorToast('Failed to update attendance');
        }
    };
    if (!currentRecord) return null;

    return (
        <Dialog open={!!isOpen} onOpenChange={() => closeEditDialog()}>
            <DialogContent className="  max-w-3xl max-h-[95vh] flex flex-col " key={currentRecord?.id}>
                <DialogHeader>
                    <DialogTitle>Edit Attendance</DialogTitle>
                    <DialogDescription>
                        Update attendance details for {currentRecord.student?.full_name}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className=" flex-1 min-h-0 p-4 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-4">
                            {/* Attendance Status */}
                            <FormField
                                control={form.control}
                                name="attendance_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Attendance Status *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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

                            {/* Early Leave Minutes */}
                            <FormField
                                control={form.control}
                                name="early_leave_minutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Early Leave (minutes)</FormLabel>
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

                            {/* Excuse Reason */}
                            <FormField
                                control={form.control}
                                name="excuse_reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Excuse Reason</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add excuse reason if applicable..."
                                                className="resize-none"
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => closeEditDialog()}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Update Attendance</Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
