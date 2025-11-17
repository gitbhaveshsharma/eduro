'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, FileText, User, Edit, Trash2 } from 'lucide-react';
import {
    useCurrentAttendanceRecord,
    useAttendanceActions,
    formatAttendanceStatus,
    formatTime,
    formatDuration,
    formatAttendanceDate,
    calculateDurationMinutes,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export default function AttendanceDetailsDialog() {
    const currentRecord = useCurrentAttendanceRecord();
    const { setCurrentRecord, deleteAttendance } = useAttendanceActions();

    if (!currentRecord) return null;

    const duration = calculateDurationMinutes(
        currentRecord.check_in_time,
        currentRecord.check_out_time
    );

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this attendance record?')) return;

        const success = await deleteAttendance(currentRecord.id);

        if (success) {
            showSuccessToast('Attendance record deleted successfully');
            setCurrentRecord(null);
        } else {
            showErrorToast('Failed to delete attendance record');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            LATE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            EXCUSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            HOLIDAY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return colors[status] || '';
    };

    return (
        <Dialog open={!!currentRecord} onOpenChange={() => setCurrentRecord(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Attendance Details</span>
                        <Badge className={getStatusColor(currentRecord.attendance_status)}>
                            {formatAttendanceStatus(currentRecord.attendance_status, true)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Complete attendance record information
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[600px]">
                    <div className="space-y-6 pr-4">
                        {/* Student Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Student Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow label="Student" value={currentRecord.student?.full_name || 'N/A'} />
                                <InfoRow label="Student ID" value={currentRecord.student_id.slice(0, 8)} />
                            </div>
                        </div>

                        <Separator />

                        {/* Attendance Details */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Attendance Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow
                                    label="Date"
                                    value={formatAttendanceDate(currentRecord.attendance_date, 'long')}
                                />
                                <InfoRow
                                    label="Status"
                                    value={formatAttendanceStatus(currentRecord.attendance_status, true)}
                                />
                                <InfoRow label="Check In" value={formatTime(currentRecord.check_in_time)} />
                                <InfoRow label="Check Out" value={formatTime(currentRecord.check_out_time)} />
                                {duration !== null && (
                                    <InfoRow label="Duration" value={formatDuration(duration)} />
                                )}
                                {currentRecord.late_by_minutes > 0 && (
                                    <InfoRow
                                        label="Late By"
                                        value={`${currentRecord.late_by_minutes} minutes`}
                                        valueClassName="text-orange-600 dark:text-orange-400"
                                    />
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Class & Teacher Info */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Class & Teacher</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow label="Class" value={currentRecord.class?.class_name || 'N/A'} />
                                <InfoRow label="Teacher" value={currentRecord.teacher?.full_name || 'N/A'} />
                                <InfoRow label="Subject" value={currentRecord.class?.subject || 'N/A'} />
                                <InfoRow label="Grade" value={currentRecord.class?.grade_level || 'N/A'} />
                            </div>
                        </div>

                        {/* Teacher Remarks */}
                        {currentRecord.teacher_remarks && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Teacher Remarks
                                    </h3>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                        {currentRecord.teacher_remarks}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Excuse Reason */}
                        {currentRecord.excuse_reason && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Excuse Reason</h3>
                                    <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                                        {currentRecord.excuse_reason}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Metadata */}
                        <Separator />
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Record Metadata
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <InfoRow
                                    label="Created"
                                    value={new Date(currentRecord.created_at).toLocaleString()}
                                />
                                <InfoRow
                                    label="Last Updated"
                                    value={new Date(currentRecord.updated_at).toLocaleString()}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentRecord(null)}>
                            Close
                        </Button>
                        <Button className="gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Info Row Component
interface InfoRowProps {
    label: string;
    value: string | number;
    valueClassName?: string;
}

function InfoRow({ label, value, valueClassName = '' }: InfoRowProps) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-sm ${valueClassName}`}>{value}</p>
        </div>
    );
}
