'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Building2, GraduationCap, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    useMarkAttendance,
    AttendanceStatus,
    markAttendanceSchema,
    formatAttendanceStatus,
} from '@/lib/branch-system/student-attendance';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentProfile } from '@/lib/profile';
import { CoachingAPI } from '@/lib/coaching';
import { useClassesByBranch, useBranchClassesStore } from '@/lib/branch-system/branch-classes';
import type { CoachingBranch } from '@/lib/schema/coaching.types';
import StudentSearch from './student-search';

interface MarkAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coachingCenterId?: string;
    branchId?: string;
}

interface SelectedStudent {
    enrollment_id: string;
    student_id: string;
    student_name: string | null;
    student_username: string | null;
    branch_id: string;
    branch_name: string | null;
    coaching_center_name: string | null;
    class_id: string | null;
    class_name: string | null;
    subject: string | null;
    enrollment_status: string;
    avatar_url?: string | null;
}

export default function MarkAttendanceDialog({
    open,
    onOpenChange,
    coachingCenterId,
    branchId: propBranchId
}: MarkAttendanceDialogProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);

    // Branch and class selection state
    const [branches, setBranches] = useState<CoachingBranch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(propBranchId || '');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Hooks
    const markAttendance = useMarkAttendance();
    const currentProfile = useCurrentProfile();
    const classes = useClassesByBranch(selectedBranchId || null);
    const { fetchClassesByBranch } = useBranchClassesStore();

    // Determine view mode
    const isCoachView = !!coachingCenterId && !propBranchId;
    const isBranchView = !!propBranchId;

    const form = useForm({
        resolver: zodResolver(markAttendanceSchema),
        defaultValues: {
            student_id: '',
            class_id: '',
            teacher_id: '',
            branch_id: '',
            attendance_date: format(new Date(), 'yyyy-MM-dd'),
            attendance_status: AttendanceStatus.PRESENT,
            check_in_time: format(new Date(), 'HH:mm'),
            check_out_time: '',
            late_by_minutes: 0,
            teacher_remarks: '',
        },
    });

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
                } finally {
                    setLoadingBranches(false);
                }
            }
        };

        loadBranches();
    }, [open, isCoachView, coachingCenterId]);

    // For branch view, auto-set the branch ID
    useEffect(() => {
        if (isBranchView && propBranchId && open) {
            setSelectedBranchId(propBranchId);
        }
    }, [isBranchView, propBranchId, open]);

    // Fetch classes when branch is selected
    useEffect(() => {
        if (!selectedBranchId) return;

        const loadClasses = async () => {
            setLoadingClasses(true);
            setSelectedClassId('');

            try {
                await fetchClassesByBranch(selectedBranchId);
            } catch (error) {
                console.error('Failed to load classes:', error);
            } finally {
                setLoadingClasses(false);
            }
        };

        loadClasses();
    }, [selectedBranchId, fetchClassesByBranch]);

    // Update form when student is selected
    useEffect(() => {
        if (selectedStudent) {
            form.setValue('student_id', selectedStudent.student_id);
            if (selectedStudent.branch_id) {
                form.setValue('branch_id', selectedStudent.branch_id);
                setSelectedBranchId(selectedStudent.branch_id);
            }
            if (selectedStudent.class_id) {
                form.setValue('class_id', selectedStudent.class_id);
                setSelectedClassId(selectedStudent.class_id);
            }
        } else {
            form.setValue('student_id', '');
        }
    }, [selectedStudent, form]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedStudent(null);
            form.reset();
            if (!propBranchId) {
                setSelectedBranchId('');
            }
            setSelectedClassId('');
        }
    }, [open, propBranchId, form]);

    const onSubmit = async (data: any) => {
        if (!selectedStudent) {
            showErrorToast('Please select a student');
            return;
        }

        const success = await markAttendance({
            ...data,
            student_id: selectedStudent.student_id,
            class_id: selectedClassId || selectedStudent.class_id || '',
            teacher_id: currentProfile?.id || '',
            branch_id: selectedBranchId || selectedStudent.branch_id,
            attendance_date: format(date, 'yyyy-MM-dd'),
        });

        if (success) {
            showSuccessToast('Attendance marked successfully');
            form.reset();
            setSelectedStudent(null);
            onOpenChange(false);
        } else {
            showErrorToast('Failed to mark attendance');
        }
    };

    // Get selected class info
    const selectedClass = useMemo(() => {
        return classes.find(c => c.id === selectedClassId);
    }, [classes, selectedClassId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Search for a student by username or name and mark their attendance
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">

                            {/* Branch Selection (only for coach view) */}
                            {isCoachView && (
                                <div className="space-y-2">
                                    <FormLabel className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Select Branch
                                    </FormLabel>
                                    <Select
                                        value={selectedBranchId}
                                        onValueChange={(value) => {
                                            setSelectedBranchId(value);
                                            setSelectedStudent(null);
                                        }}
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
                                </div>
                            )}

                            {/* Class Selection (optional - to filter student search) */}
                            {selectedBranchId && (
                                <div className="space-y-2">
                                    <FormLabel className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Select Class (Optional)
                                    </FormLabel>
                                    <Select
                                        value={selectedClassId}
                                        onValueChange={(value) => {
                                            // Radix Select disallows SelectItem with empty string value.
                                            // Use sentinel 'ALL' for "All Classes" option and map it
                                            // back to empty string internally to represent no specific class.
                                            if (value === 'ALL') {
                                                setSelectedClassId('');
                                            } else {
                                                setSelectedClassId(value);
                                            }
                                            setSelectedStudent(null);
                                        }}
                                        disabled={loadingClasses}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingClasses ? "Loading branches..." : "All classes"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Classes</SelectItem>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{cls.class_name}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {cls.subject}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Student Search */}
                            <div className="space-y-2">
                                <FormLabel>Student *</FormLabel>
                                <StudentSearch
                                    coachingCenterId={coachingCenterId}
                                    branchId={selectedBranchId || propBranchId}
                                    classId={selectedClassId || undefined}
                                    selectedStudent={selectedStudent}
                                    onSelect={(student) => setSelectedStudent(student as SelectedStudent | null)}
                                    placeholder="Search by username or name..."
                                    disabled={!selectedBranchId && !propBranchId}
                                />
                                {!selectedBranchId && !propBranchId && isCoachView && (
                                    <p className="text-xs text-muted-foreground">
                                        Please select a branch first to search for students
                                    </p>
                                )}
                            </div>

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
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!selectedStudent}
                                >
                                    Mark Attendance
                                </Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
