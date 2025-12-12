'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import { Calendar as CalendarIcon, Building2, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import {
    useMarkAttendance,
    AttendanceStatus,
    type MarkAttendanceDTO,
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
    branchId: propBranchId,
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

    type FormValues = MarkAttendanceDTO;

    // No zodResolver — we build the final payload with dynamic IDs in onSubmit
    const form = useForm<FormValues>({
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
                    // Error handled silently
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
                // Error handled silently
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

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!selectedStudent) {
            showErrorToast('Please select a student');
            return;
        }

        // Get effective IDs
        const effectiveClassId = selectedClassId || selectedStudent.class_id;
        const effectiveBranchId = selectedBranchId || selectedStudent.branch_id;
        const effectiveTeacherId = currentProfile?.id;

        // Validate required UUIDs
        if (!effectiveClassId) {
            showErrorToast('Please select a class for the student');
            return;
        }
        if (!effectiveBranchId) {
            showErrorToast('Please select a branch');
            return;
        }
        if (!effectiveTeacherId) {
            showErrorToast('Unable to identify teacher. Please ensure you are logged in.');
            return;
        }

        const payload: MarkAttendanceDTO = {
            ...data,
            student_id: selectedStudent.student_id,
            class_id: effectiveClassId,
            teacher_id: effectiveTeacherId,
            branch_id: effectiveBranchId,
            attendance_date: format(date, 'yyyy-MM-dd'),
        };

        try {
            const success = await markAttendance(payload);
            if (success) {
                showSuccessToast('Attendance marked successfully');
                form.reset();
                setSelectedStudent(null);
                onOpenChange(false);
            } else {
                showErrorToast('Failed to mark attendance');
            }
        } catch (err) {
            showErrorToast('Failed to mark attendance');
        }
    };

    // Get selected class info (if you need it later)
    const selectedClass = useMemo(() => {
        return classes.find((c) => c.id === selectedClassId);
    }, [classes, selectedClassId]);

    const isLargeScreen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Search for a student by username or name and mark their attendance
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 p-4"
                        >
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
                                            <SelectValue
                                                placeholder={loadingBranches ? 'Loading branches...' : 'Select a branch'}
                                            />
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
                                        value={selectedClassId || 'ALL'}
                                        onValueChange={(value) => {
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
                                            <SelectValue
                                                placeholder={loadingClasses ? 'Loading classes...' : 'All classes'}
                                            />
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
                                    onSelect={(student) =>
                                        setSelectedStudent(student as SelectedStudent | null)
                                    }
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

                            {/* Time & Late Row - Responsive Layout */}
                            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4">
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
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const parsed = value === '' ? 0 : Number.parseInt(value, 10);
                                                        field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Attendance Date (moved here for large screen grouping) */}
                                <div className="lg:hidden">
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
                                </div>
                            </div>

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
                            <div className="flex justify-end gap-2 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!selectedStudent}>
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
