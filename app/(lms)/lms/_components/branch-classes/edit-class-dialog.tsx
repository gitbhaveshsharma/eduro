/**
 * Edit Class Dialog Component
 * 
 * Dialog for editing existing branch classes
 * Pre-fills form with current class data
 * Features: Full validation, loading states, toast notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BranchClassesAPI,
    updateBranchClassSchema,
    useClass,
    useClassesUI,
    useBranchClassesStore,
    COMMON_GRADE_LEVELS,
    COMMON_SUBJECTS,
    DAYS_OF_WEEK,
    CLASS_STATUS_OPTIONS,
    FEE_FREQUENCY_OPTIONS,
    type UpdateBranchClassInput,
    type DayOfWeek,
} from '@/lib/branch-system/branch-classes';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import { ProfileAPI } from '@/lib/profile';
import { PublicProfile } from '@/lib/schema/profile.types';
import { AvatarUtils } from '@/lib/utils/avatar.utils';

/**
 * Edit Class Dialog Component
 */
export function EditClassDialog() {
    const store = useBranchClassesStore();
    const { isEditing, editingClassId } = useClassesUI();
    const classData = useClass(editingClassId || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teacherUsername, setTeacherUsername] = useState("");
    const [searchingTeacher, setSearchingTeacher] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<PublicProfile | null>(null);
    const [teacherSearchResults, setTeacherSearchResults] = useState<PublicProfile[]>([]);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [teacherError, setTeacherError] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
    const [selectedBranchName, setSelectedBranchName] = useState<string>("");

    // Normalize time value for HTML time input (expects HH:MM 24-hour)
    const normalizeTimeForInput = (time?: string | null): string => {
        if (!time) return '';
        const t = time.trim();
        // Match 12-hour with AM/PM e.g., 6:25 AM or 06:25:00 AM
        const ampm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([APMapm]{2})$/);
        if (ampm) {
            let hh = parseInt(ampm[1], 10);
            const mm = ampm[2];
            const meridian = ampm[4].toUpperCase();
            if (meridian === 'PM' && hh !== 12) hh += 12;
            if (meridian === 'AM' && hh === 12) hh = 0;
            return `${hh.toString().padStart(2, '0')}:${mm}`;
        }

        // Match 24-hour HH:MM(:SS)
        const hm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (hm) {
            const hh = hm[1].padStart(2, '0');
            const mm = hm[2];
            return `${hh}:${mm}`;
        }

        // Fallback: try Date parsing
        const parsed = new Date(t);
        if (!isNaN(parsed.getTime())) {
            const hh = parsed.getHours().toString().padStart(2, '0');
            const mm = parsed.getMinutes().toString().padStart(2, '0');
            return `${hh}:${mm}`;
        }

        return '';
    };

    // Format time for backend (HH:MM:SS)
    const formatTimeForBackend = (time?: string | null): string | null => {
        if (!time) return null;
        const t = time.trim();
        const ampm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([APMapm]{2})$/);
        if (ampm) {
            let hh = parseInt(ampm[1], 10);
            const mm = ampm[2];
            const ss = ampm[3] || '00';
            const meridian = ampm[4].toUpperCase();
            if (meridian === 'PM' && hh !== 12) hh += 12;
            if (meridian === 'AM' && hh === 12) hh = 0;
            return `${hh.toString().padStart(2, '0')}:${mm}:${ss}`;
        }

        const hm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (hm) {
            const hh = hm[1].padStart(2, '0');
            const mm = hm[2];
            const ss = hm[3] || '00';
            return `${hh}:${mm}:${ss}`;
        }

        const parsed = new Date(t);
        if (!isNaN(parsed.getTime())) {
            const hh = parsed.getHours().toString().padStart(2, '0');
            const mm = parsed.getMinutes().toString().padStart(2, '0');
            const ss = parsed.getSeconds().toString().padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        }

        // fallback: return as-is
        return t;
    };

    // Initialize form
    const form = useForm<UpdateBranchClassInput>({
        resolver: zodResolver(updateBranchClassSchema),
        defaultValues: {},
    });

    // Load class data into form when editing
    useEffect(() => {
        if (isEditing && classData) {
            const formData = {
                class_name: classData.class_name,
                subject: classData.subject,
                grade_level: classData.grade_level,
                description: classData.description,
                batch_name: classData.batch_name,
                start_date: classData.start_date,
                end_date: classData.end_date,
                class_days: classData.class_days,
                // Normalize times for HTML <input type="time"> which expects HH:MM
                start_time: normalizeTimeForInput(classData.start_time),
                end_time: normalizeTimeForInput(classData.end_time),
                max_students: classData.max_students,
                fees_frequency: classData.fees_frequency,
                status: classData.status,
                is_visible: classData.is_visible,
                teacher_id: classData.teacher_id,
            };
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [isEditing, classData]);

    // Load teacher info when editing
    useEffect(() => {
        const loadTeacherInfo = async () => {
            if (isEditing && classData?.teacher_id && !selectedTeacher) {
                try {
                    const profile = await ProfileAPI.getProfileById(classData.teacher_id);
                    if (profile) {
                        setSelectedTeacher(profile);
                    }
                } catch (error) {
                    console.error("Failed to load teacher info:", error);
                }
            }
        };

        loadTeacherInfo();
    }, [isEditing, classData?.teacher_id, selectedTeacher]);

    // Load branch info when editing
    useEffect(() => {
        if (isEditing && classData) {
            setSelectedBranchId(classData.branch_id);
            // Get branch name from classData if it has relations, otherwise show just ID
            setSelectedBranchName((classData as any).branch?.name || classData.branch_id);
        }
    }, [isEditing, classData]);

    // Handle form submission
    const onSubmit = async (data: UpdateBranchClassInput) => {
        if (!editingClassId) return;

        const toastId = showLoadingToast('Updating class...');
        setIsSubmitting(true);

        try {
            // Ensure times are formatted for backend (HH:MM:SS) and include teacher_id
            const finalData: UpdateBranchClassInput = {
                ...data,
                start_time: formatTimeForBackend(data.start_time as any) as any,
                end_time: formatTimeForBackend(data.end_time as any) as any,
                teacher_id: selectedTeacher?.id ?? data.teacher_id ?? null,
            };

            const success = await BranchClassesAPI.update(editingClassId, finalData);

            if (success) {
                showSuccessToast('Class updated successfully!');
                store.cancelEditing();
            } else {
                showErrorToast('Failed to update class. Please try again.');
            }
        } catch (error: any) {
            showErrorToast(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle dialog close
    const handleClose = () => {
        if (!isSubmitting) {
            form.reset();
            setSelectedTeacher(null);
            setTeacherUsername("");
            setTeacherError(null);
            setTeacherSearchResults([]);
            setShowTeacherResults(false);
            store.cancelEditing();
        }
    };

    // Watch class days for multi-select
    const selectedDays = form.watch('class_days') || [];

    // Toggle day selection
    const toggleDay = (day: DayOfWeek) => {
        const currentDays = selectedDays || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        form.setValue('class_days', newDays);
    };

    // Handle teacher search by username
    const handleSearchTeacher = async () => {
        if (!teacherUsername.trim()) {
            setTeacherError("Please enter a username");
            return;
        }

        setSearchingTeacher(true);
        setTeacherError(null);
        setTeacherSearchResults([]);
        setShowTeacherResults(false);

        try {
            const profile = await ProfileAPI.getProfileByUsername(teacherUsername.trim());

            if (profile) {
                // Check if user has appropriate role (Teacher, Coach, Admin)
                if (!['T', 'C', 'A', 'SA'].includes(profile.role || '')) {
                    setTeacherError("User must have Teacher, Coach, or Admin role");
                    setTeacherSearchResults([]);
                    setShowTeacherResults(false);
                    return;
                }

                setTeacherSearchResults([profile]);
                setShowTeacherResults(true);
                setTeacherError(null);
            } else {
                setTeacherError("User not found");
                setTeacherSearchResults([]);
                setShowTeacherResults(false);
            }
        } catch (error) {
            console.error("Error searching teacher:", error);
            setTeacherError("Failed to search user");
            setTeacherSearchResults([]);
            setShowTeacherResults(false);
        } finally {
            setSearchingTeacher(false);
        }
    };

    // Select teacher from search results
    const handleSelectTeacher = (profile: PublicProfile) => {
        setSelectedTeacher(profile);
        setShowTeacherResults(false);
        setTeacherSearchResults([]);
        setTeacherUsername("");
        setTeacherError(null);
        form.setValue('teacher_id', profile.id);
        showSuccessToast(`Teacher selected: ${profile.full_name || profile.username}`);
    };

    // Clear selected teacher
    const handleClearTeacher = () => {
        setSelectedTeacher(null);
        setTeacherUsername("");
        setTeacherError(null);
        setTeacherSearchResults([]);
        setShowTeacherResults(false);
        form.setValue('teacher_id', null);
    };

    if (!classData) return null;

    return (
        <Dialog open={isEditing} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" key={editingClassId}>
                <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>
                        Update the class details below
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Basic Information</h3>

                                <FormField
                                    control={form.control}
                                    name="class_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Mathematics Advanced" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Branch - Read Only */}
                                <div className="space-y-2">
                                    <FormLabel>Branch</FormLabel>
                                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                                        <span className="text-sm">{selectedBranchName}</span>
                                        <Badge variant="secondary" className="text-xs">Current</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Branch cannot be changed after class creation
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select subject" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COMMON_SUBJECTS.map((subject) => (
                                                        <SelectItem key={subject} value={subject}>
                                                            {subject}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="grade_level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grade Level</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select grade level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COMMON_GRADE_LEVELS.map((grade) => (
                                                        <SelectItem key={grade} value={grade}>
                                                            {grade}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe the class"
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="batch_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Batch Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Morning Batch" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Teacher Assignment */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Teacher Assignment</h3>

                                {/* Selected Teacher Display */}
                                {selectedTeacher && (
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={AvatarUtils.getSafeAvatarUrl(
                                                        selectedTeacher.avatar_url,
                                                        selectedTeacher.full_name || selectedTeacher.username || 'U'
                                                    )}
                                                    alt={selectedTeacher.full_name || selectedTeacher.username || 'Teacher'}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {selectedTeacher.full_name || selectedTeacher.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{selectedTeacher.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearTeacher}
                                                disabled={isSubmitting}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Teacher Search */}
                                {!selectedTeacher && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search by username"
                                                value={teacherUsername}
                                                onChange={(e) => setTeacherUsername(e.target.value)}
                                                disabled={searchingTeacher}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleSearchTeacher}
                                                disabled={searchingTeacher || !teacherUsername.trim()}
                                            >
                                                {searchingTeacher ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Searching
                                                    </>
                                                ) : (
                                                    "Search"
                                                )}
                                            </Button>
                                        </div>

                                        {/* Teacher Error */}
                                        {teacherError && (
                                            <p className="text-sm text-destructive">{teacherError}</p>
                                        )}

                                        {/* Teacher Search Results */}
                                        {showTeacherResults && teacherSearchResults.length > 0 && (
                                            <div className="border rounded-lg divide-y">
                                                {teacherSearchResults.map((profile) => (
                                                    <div
                                                        key={profile.id}
                                                        className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                                        onClick={() => handleSelectTeacher(profile)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={AvatarUtils.getSafeAvatarUrl(
                                                                    profile.avatar_url,
                                                                    profile.full_name || profile.username || 'U'
                                                                )}
                                                                alt={profile.full_name || profile.username || 'Teacher'}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {profile.full_name || profile.username}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    @{profile.username}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            Search for a teacher by their username to assign them to this class
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Schedule */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Schedule</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="class_days"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Class Days</FormLabel>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <Badge
                                                        key={day}
                                                        variant={selectedDays.includes(day) ? 'default' : 'outline'}
                                                        className="cursor-pointer"
                                                        onClick={() => toggleDay(day)}
                                                    >
                                                        {day.slice(0, 3)}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="start_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Capacity & Fees */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Capacity & Fees</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="max_students"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Students</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fees_frequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fee Frequency</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(FEE_FREQUENCY_OPTIONS).map(([value, { label }]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Status & Visibility */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Status & Visibility</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(CLASS_STATUS_OPTIONS).map(([value, { label }]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="is_visible"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Visible to students
                                                    </FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
