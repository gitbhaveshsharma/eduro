/**
 * Assign Teacher Dialog Component
 * 
 * Form for assigning a new teacher to a branch
 * Features: Multi-section form with complete validation using assignTeacherSchema
 * Includes shadcn DatePicker for date fields and username search for teachers
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import {
    assignTeacherSchema,
    type AssignTeacherInput,
} from '@/lib/branch-system/validations/branch-teacher.validation';
import { DAYS_OF_WEEK_OPTIONS, type DayOfWeek } from '@/lib/branch-system/types/branch-teacher.types';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BranchSearchSelect } from '@/components/coaching/management/branch-search-select';
import { CoachingBranch } from '@/lib/schema/coaching.types';
import { ProfileAPI } from '@/lib/profile';
import { PublicProfile } from '@/lib/schema/profile.types';
import { AvatarUtils } from '@/lib/utils/avatar.utils';

/**
 * Assign Teacher Dialog Props
 */
interface AssignTeacherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId?: string; // Default branch ID
}

/**
 * Main Assign Teacher Dialog Component
 */
export function AssignTeacherDialog({ open, onOpenChange, branchId }: AssignTeacherDialogProps) {
    const { assignTeacher, loading } = useBranchTeacherStore();
    const [selectedBranch, setSelectedBranch] = useState<CoachingBranch | null>(null);

    // Teacher search states
    const [teacherUsername, setTeacherUsername] = useState("");
    const [searchingTeacher, setSearchingTeacher] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<PublicProfile | null>(null);
    const [teacherSearchResults, setTeacherSearchResults] = useState<PublicProfile[]>([]);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [teacherError, setTeacherError] = useState<string | null>(null);

    // Subject input state
    const [subjectsInput, setSubjectsInput] = useState('');

    // Format date for form submission (YYYY-MM-DD)
    const formatDateForInput = (date: Date | undefined): string => {
        if (!date) return '';
        return format(date, 'yyyy-MM-dd');
    };

    // Parse date from string to Date object (accepts undefined/null)
    const parseDateFromString = (dateString?: string | null): Date | undefined => {
        if (!dateString) return undefined;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? undefined : date;
    };

    // Initialize form with correct schema fields
    const form = useForm<AssignTeacherInput>({
        resolver: zodResolver(assignTeacherSchema),
        defaultValues: {
            teacher_id: '',
            branch_id: branchId || '',
            teaching_subjects: [],
            assignment_date: formatDateForInput(new Date()),
            assignment_end_date: null,
            teaching_experience_years: null,
            hourly_rate: null,
            available_days: null,
            available_start_time: null,
            available_end_time: null,
            assignment_notes: null,
            metadata: null,
        },
    });

    // Reset form when dialog opens or branchId changes
    useEffect(() => {
        if (open) {
            form.reset({
                teacher_id: '',
                branch_id: branchId || '',
                teaching_subjects: [],
                assignment_date: formatDateForInput(new Date()),
                assignment_end_date: null,
                teaching_experience_years: null,
                hourly_rate: null,
                available_days: null,
                available_start_time: null,
                available_end_time: null,
                assignment_notes: null,
                metadata: null,
            });
            // Reset teacher search states
            setSelectedTeacher(null);
            setTeacherUsername("");
            setTeacherError(null);
            setTeacherSearchResults([]);
            setShowTeacherResults(false);
            setSubjectsInput('');
            // If a branchId was provided, clear any selectedBranch state
            if (branchId) setSelectedBranch(null);
        }
    }, [open, branchId, form]);

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
                // Check if user has appropriate role (Teacher or general user roles)
                if (!['T', 'U', 'A', 'SA'].includes(profile.role || '')) {
                    setTeacherError("User must have Teacher or appropriate role");
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
        form.setValue('teacher_id', '');
    };

    // Handle form submission
    const onSubmit = async (data: AssignTeacherInput) => {
        // Validate teacher selection
        if (!selectedTeacher) {
            showErrorToast('Please select a teacher');
            return;
        }

        const loadingToastId = showLoadingToast('Assigning teacher...');

        try {
            const success = await assignTeacher(data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Teacher assigned successfully!');
                onOpenChange(false);
                form.reset();
                setSelectedTeacher(null);
            } else {
                showErrorToast('Failed to assign teacher. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    // Handle dialog close
    const handleClose = () => {
        if (!loading) {
            form.reset();
            setSelectedTeacher(null);
            setTeacherUsername("");
            setTeacherError(null);
            setTeacherSearchResults([]);
            setShowTeacherResults(false);
            setSubjectsInput('');
            onOpenChange(false);
        }
    };

    // Handle subjects input
    const handleAddSubject = () => {
        if (subjectsInput.trim()) {
            const currentSubjects = form.getValues('teaching_subjects') || [];
            if (!currentSubjects.includes(subjectsInput.trim())) {
                form.setValue('teaching_subjects', [...currentSubjects, subjectsInput.trim()]);
            }
            setSubjectsInput('');
        }
    };

    const handleRemoveSubject = (subject: string) => {
        const currentSubjects = form.getValues('teaching_subjects') || [];
        form.setValue('teaching_subjects', currentSubjects.filter((s: string) => s !== subject));
    };

    // Handle available days toggle
    const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
        const currentDays = form.getValues('available_days') || [];
        if (checked) {
            form.setValue('available_days', [...currentDays, day]);
        } else {
            form.setValue('available_days', currentDays.filter((d: DayOfWeek) => d !== day));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Assign New Teacher
                    </DialogTitle>
                    <DialogDescription>
                        Search for a teacher by username and fill in their assignment information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                            {/* Teacher Search & Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Teacher Information</h3>

                                {/* Selected Teacher Display */}
                                {selectedTeacher && (
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={AvatarUtils.getSafeAvatarUrl(
                                                        selectedTeacher.avatar_url,
                                                        selectedTeacher.full_name || selectedTeacher.username || 'U'
                                                    )}
                                                    alt={selectedTeacher.full_name || selectedTeacher.username || 'Teacher'}
                                                    width={40}
                                                    height={40}
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
                                                disabled={loading}
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
                                                placeholder="Search teacher by username"
                                                value={teacherUsername}
                                                onChange={(e) => setTeacherUsername(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSearchTeacher();
                                                    }
                                                }}
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
                                                            <Image
                                                                src={AvatarUtils.getSafeAvatarUrl(
                                                                    profile.avatar_url,
                                                                    profile.full_name || profile.username || 'U'
                                                                )}
                                                                alt={profile.full_name || profile.username || 'Teacher'}
                                                                width={40}
                                                                height={40}
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
                                            Search for a teacher by their username to assign them
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Branch Information */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Branch Information</h3>

                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={() => (
                                        <FormItem>
                                            {/* Show BranchSearchSelect only when branchId is not provided */}
                                            {!branchId ? (
                                                <BranchSearchSelect
                                                    selectedBranch={selectedBranch}
                                                    onSelect={(branch) => {
                                                        setSelectedBranch(branch);
                                                        form.setValue('branch_id', branch.id);
                                                    }}
                                                    onClear={() => {
                                                        setSelectedBranch(null);
                                                        form.setValue('branch_id', '');
                                                    }}
                                                    required
                                                    error={form.formState.errors.branch_id?.message}
                                                />
                                            ) : (
                                                <FormControl>
                                                    <Input placeholder="Branch UUID" value={branchId} disabled />
                                                </FormControl>
                                            )}
                                            <FormDescription>
                                                The branch where the teacher will be assigned
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Teaching Subjects */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Teaching Subjects</h3>

                                <FormField
                                    control={form.control}
                                    name="teaching_subjects"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subjects *</FormLabel>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter subject name"
                                                        value={subjectsInput}
                                                        onChange={(e) => setSubjectsInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddSubject();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleAddSubject}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {(field.value?.length || 0) > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {field.value?.map((subject: string) => (
                                                            <span
                                                                key={subject}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                                                            >
                                                                {subject}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSubject(subject)}
                                                                    className="hover:text-destructive"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <FormDescription>
                                                Add subjects this teacher will teach
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="teaching_experience_years"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teaching Experience (Years)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 5"
                                                    min={0}
                                                    max={60}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Assignment Dates */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Assignment Dates</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="assignment_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Assignment Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal inline-flex items-center px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(parseDateFromString(field.value) || new Date(), 'PPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={parseDateFromString(field.value)}
                                                            onSelect={(date) => {
                                                                field.onChange(formatDateForInput(date));
                                                            }}
                                                            disabled={(date) => date < new Date('1900-01-01')}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="assignment_end_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Assignment End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal inline-flex items-center px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(parseDateFromString(field.value) || new Date(), 'PPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={parseDateFromString(field.value)}
                                                            onSelect={(date) => {
                                                                field.onChange(formatDateForInput(date));
                                                            }}
                                                            disabled={(date) => {
                                                                const assignDate = parseDateFromString(form.getValues('assignment_date'));
                                                                return assignDate ? date < assignDate : date < new Date();
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Availability Schedule */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="available_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Days</FormLabel>
                                            <div className="grid grid-cols-4 gap-2">
                                                {Object.entries(DAYS_OF_WEEK_OPTIONS).map(([day, config]) => (
                                                    <div key={day} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`day-${day}`}
                                                            checked={(field.value || []).includes(day as DayOfWeek)}
                                                            onCheckedChange={(checked) => handleDayToggle(day as DayOfWeek, checked as boolean)}
                                                        />
                                                        <label
                                                            htmlFor={`day-${day}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {config.short}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <FormDescription>
                                                Select the days the teacher is available
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="available_start_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Available Start Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value || null)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="available_end_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Available End Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value || null)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Hourly Rate */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Compensation</h3>

                                <FormField
                                    control={form.control}
                                    name="hourly_rate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hourly Rate</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 500"
                                                    step="0.01"
                                                    min={0}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Hourly rate for the teacher
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Notes */}
                            <div className="space-y-4">

                                <FormField
                                    control={form.control}
                                    name="assignment_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assignment Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes about the assignment..."
                                                    {...field}
                                                    value={field.value || ''}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !selectedTeacher}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Assign Teacher
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
