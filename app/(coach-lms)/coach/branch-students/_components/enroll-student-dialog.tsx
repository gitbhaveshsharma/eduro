/**
 * Enroll Student Dialog Component
 * 
 * Form for enrolling a new student in a branch
 * Features: Multi-section form with complete validation using enrollStudentSchema
 * Includes shadcn DatePicker for date fields and username search for students
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import {
    enrollStudentSchema,
    type EnrollStudentInput,
} from '@/lib/branch-system/validations/branch-students.validation';
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
import { Loader2, UserPlus, CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BranchSearchSelect } from '@/components/coaching/management/branch-search-select';
import { CoachingBranch } from '@/lib/schema/coaching.types';
import { ProfileAPI } from '@/lib/profile';
import { PublicProfile } from '@/lib/schema/profile.types';

/**
 * Enroll Student Dialog Props
 */
interface EnrollStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId?: string; // Default branch ID
}

/**
 * Main Enroll Student Dialog Component
 */
export function EnrollStudentDialog({ open, onOpenChange, branchId }: EnrollStudentDialogProps) {
    const { enrollStudent, loading } = useBranchStudentsStore();
    const [selectedBranch, setSelectedBranch] = useState<CoachingBranch | null>(null);

    // Student search states
    const [studentUsername, setStudentUsername] = useState("");
    const [searchingStudent, setSearchingStudent] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<PublicProfile | null>(null);
    const [studentSearchResults, setStudentSearchResults] = useState<PublicProfile[]>([]);
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [studentError, setStudentError] = useState<string | null>(null);

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

    // Initialize form
    const form = useForm<EnrollStudentInput>({
        resolver: zodResolver(enrollStudentSchema),
        defaultValues: {
            student_id: '',
            branch_id: branchId || '',
            class_id: null,
            enrollment_date: formatDateForInput(new Date()),
            expected_completion_date: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            parent_guardian_name: null,
            parent_guardian_phone: null,
            preferred_batch: null,
            special_requirements: null,
            student_notes: null,
            metadata: null,
        },
    });

    // Reset form when dialog opens or branchId changes
    useEffect(() => {
        if (open) {
            form.reset({
                student_id: '',
                branch_id: branchId || '',
                class_id: null,
                enrollment_date: formatDateForInput(new Date()),
                expected_completion_date: null,
                emergency_contact_name: null,
                emergency_contact_phone: null,
                parent_guardian_name: null,
                parent_guardian_phone: null,
                preferred_batch: null,
                special_requirements: null,
                student_notes: null,
                metadata: null,
            });
            // Reset student search states
            setSelectedStudent(null);
            setStudentUsername("");
            setStudentError(null);
            setStudentSearchResults([]);
            setShowStudentResults(false);
            // If a branchId was provided, clear any selectedBranch state
            if (branchId) setSelectedBranch(null);
        }
    }, [open, branchId, form]);

    // Handle student search by username
    const handleSearchStudent = async () => {
        if (!studentUsername.trim()) {
            setStudentError("Please enter a username");
            return;
        }

        setSearchingStudent(true);
        setStudentError(null);
        setStudentSearchResults([]);
        setShowStudentResults(false);

        try {
            const profile = await ProfileAPI.getProfileByUsername(studentUsername.trim());

            if (profile) {
                // Check if user has appropriate role (Student or general user roles)
                if (!['S', 'U', 'A', 'SA'].includes(profile.role || '')) {
                    setStudentError("User must have Student or appropriate role");
                    setStudentSearchResults([]);
                    setShowStudentResults(false);
                    return;
                }

                setStudentSearchResults([profile]);
                setShowStudentResults(true);
                setStudentError(null);
            } else {
                setStudentError("User not found");
                setStudentSearchResults([]);
                setShowStudentResults(false);
            }
        } catch (error) {
            console.error("Error searching student:", error);
            setStudentError("Failed to search user");
            setStudentSearchResults([]);
            setShowStudentResults(false);
        } finally {
            setSearchingStudent(false);
        }
    };

    // Select student from search results
    const handleSelectStudent = (profile: PublicProfile) => {
        setSelectedStudent(profile);
        setShowStudentResults(false);
        setStudentSearchResults([]);
        setStudentUsername("");
        setStudentError(null);
        form.setValue('student_id', profile.id);
        showSuccessToast(`Student selected: ${profile.full_name || profile.username}`);
    };

    // Clear selected student
    const handleClearStudent = () => {
        setSelectedStudent(null);
        setStudentUsername("");
        setStudentError(null);
        setStudentSearchResults([]);
        setShowStudentResults(false);
        form.setValue('student_id', '');
    };

    // Handle form submission
    const onSubmit = async (data: EnrollStudentInput) => {
        // Validate student selection
        if (!selectedStudent) {
            showErrorToast('Please select a student');
            return;
        }

        const loadingToastId = showLoadingToast('Enrolling student...');

        try {
            const success = await enrollStudent(data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Student enrolled successfully!');
                onOpenChange(false);
                form.reset();
                setSelectedStudent(null);
            } else {
                showErrorToast('Failed to enroll student. Please try again.');
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
            setSelectedStudent(null);
            setStudentUsername("");
            setStudentError(null);
            setStudentSearchResults([]);
            setShowStudentResults(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Enroll New Student
                    </DialogTitle>
                    <DialogDescription>
                        Search for a student by username and fill in their enrollment information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                            {/* Student Search & Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Student Information</h3>

                                {/* Selected Student Display */}
                                {selectedStudent && (
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {selectedStudent.avatar_url && (
                                                    <Image
                                                        src={selectedStudent.avatar_url}
                                                        alt={selectedStudent.full_name || selectedStudent.username}
                                                        width={40}
                                                        height={40}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {selectedStudent.full_name || selectedStudent.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{selectedStudent.username}
                                                        {selectedStudent.email && ` • ${selectedStudent.email}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearStudent}
                                                disabled={loading}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Student Search */}
                                {!selectedStudent && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search student by username"
                                                value={studentUsername}
                                                onChange={(e) => setStudentUsername(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSearchStudent();
                                                    }
                                                }}
                                                disabled={searchingStudent}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleSearchStudent}
                                                disabled={searchingStudent || !studentUsername.trim()}
                                            >
                                                {searchingStudent ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Searching
                                                    </>
                                                ) : (
                                                    "Search"
                                                )}
                                            </Button>
                                        </div>

                                        {/* Student Error */}
                                        {studentError && (
                                            <p className="text-sm text-destructive">{studentError}</p>
                                        )}

                                        {/* Student Search Results */}
                                        {showStudentResults && studentSearchResults.length > 0 && (
                                            <div className="border rounded-lg divide-y">
                                                {studentSearchResults.map((profile) => (
                                                    <div
                                                        key={profile.id}
                                                        className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                                        onClick={() => handleSelectStudent(profile)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {profile.avatar_url && (
                                                                <Image
                                                                    src={profile.avatar_url}
                                                                    alt={profile.full_name || profile.username}
                                                                    width={40}
                                                                    height={40}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {profile.full_name || profile.username}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    @{profile.username}
                                                                    {profile.email && ` • ${profile.email}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            Search for a student by their username to enroll them
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
                                            {/* <FormLabel>Branch *</FormLabel> */}
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
                                                The branch where the student will be enrolled
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="class_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter class UUID"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Assign student to a specific class
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Enrollment Dates */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Enrollment Dates</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="enrollment_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Enrollment Date *</FormLabel>
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
                                        name="expected_completion_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Expected Completion Date</FormLabel>
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
                                                                const enrollmentDate = parseDateFromString(form.getValues('enrollment_date'));
                                                                return enrollmentDate ? date < enrollmentDate : date < new Date();
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

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Contact Information</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Emergency Contact Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Emergency Contact Phone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+911234567890"
                                                        {...field}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>E.164 format (+country code + number)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="parent_guardian_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parent/Guardian Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Jane Doe" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="parent_guardian_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parent/Guardian Phone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+919876543210"
                                                        {...field}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>E.164 format (+country code + number)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Preferences */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Preferences & Notes</h3>

                                <FormField
                                    control={form.control}
                                    name="preferred_batch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preferred Batch</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Morning / Evening / Weekend" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="special_requirements"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Special Requirements</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Any special needs or accommodations..."
                                                    {...field}
                                                    value={field.value || ''}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="student_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes about the student..."
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
                                    disabled={loading || !selectedStudent}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enroll Student
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}