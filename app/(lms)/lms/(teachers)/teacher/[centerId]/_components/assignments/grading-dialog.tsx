/**
 * Grading Dialog Component
 * 
 * Dialog for teachers to grade student submissions
 * Supports score input, feedback, and private notes
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
    Loader2,
    User,
    Calendar,
    Clock,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradeSubmissionSchema, updateGradeSchema } from '@/lib/branch-system/assignment';
import type { SubmissionForGrading, GradeSubmissionDTO, UpdateGradeDTO } from '@/lib/branch-system/types/assignment.types';
import { GradingStatus, formatDateTime } from '@/lib/branch-system/assignment';
import type { z } from 'zod';

// Helper to get initials from a name
function getInitials(name: string): string {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Form data type
type GradeFormData = z.infer<typeof gradeSubmissionSchema>;

export interface GradingDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Submission to grade */
    submission: SubmissionForGrading | null;
    /** Assignment max score */
    maxScore: number;
    /** Grader user ID */
    graderId?: string;
    /** Callback on successful grading */
    onSubmit: (data: GradeSubmissionDTO) => Promise<void>;
    /** Whether form is submitting */
    isLoading?: boolean;
}

export function GradingDialog({
    open,
    onOpenChange,
    submission,
    maxScore,
    graderId = '',
    onSubmit,
    isLoading = false,
}: GradingDialogProps) {
    const [scorePercentage, setScorePercentage] = useState<number>(0);

    const isUpdate = submission?.grading_status !== GradingStatus.NOT_GRADED;

    const form = useForm<GradeFormData>({
        resolver: zodResolver(isUpdate ? updateGradeSchema : gradeSubmissionSchema),
        defaultValues: {
            submission_id: submission?.id || '',
            graded_by: graderId,
            score: submission?.score || 0,
            feedback: submission?.feedback || '',
            private_notes: submission?.private_notes || '',
        },
    });

    // Reset form when submission or dialog open state changes
    useEffect(() => {
        if (submission && open) {
            const initialScore = submission.score || 0;
            form.reset({
                submission_id: submission.id,
                graded_by: graderId,
                score: initialScore,
                feedback: submission.feedback || '',
                private_notes: submission.private_notes || '',
            });
            setScorePercentage(maxScore > 0 ? (initialScore / maxScore) * 100 : 0);
        }
    }, [submission?.id, open, graderId, maxScore]);

    // Watch score changes to update percentage
    const currentScore = form.watch('score');
    useEffect(() => {
        if (maxScore > 0) {
            setScorePercentage((currentScore / maxScore) * 100);
        }
    }, [currentScore, maxScore]);

    // Handle form submission
    const handleSubmit = async (data: GradeFormData) => {
        try {
            await onSubmit(data as GradeSubmissionDTO);
            onOpenChange(false);
        } catch (error) {
            console.error('Grading error:', error);
        }
    };

    // Get score color based on percentage
    const getScoreColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    // Get slider color based on percentage
    const getSliderColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-green-500';
        if (percentage >= 70) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (!submission) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>
                        {isUpdate ? 'Update Grade' : 'Grade Submission'}
                    </DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? 'Update the grade and feedback for this submission'
                            : 'Review the submission and assign a grade'
                        }
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-6">
                        {/* Student Info */}
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={submission.student_avatar || undefined}
                                    alt={submission.student_name || 'Student'}
                                />
                                <AvatarFallback>
                                    {getInitials(submission.student_name || 'S')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {submission.student_name || 'Unknown Student'}
                                </p>
                                {submission.student_username && (
                                    <p className="text-sm text-muted-foreground">
                                        @{submission.student_username}
                                    </p>
                                )}
                            </div>
                            {submission.is_late && (
                                <Badge variant="destructive">Late Submission</Badge>
                            )}
                        </div>

                        {/* Submission Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Submitted:</span>
                                <span className="font-medium">
                                    {formatDateTime(submission.submitted_at, 'short')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Attempt:</span>
                                <span className="font-medium">
                                    #{submission.attempt_number}
                                </span>
                            </div>
                        </div>

                        {/* Submission Content Preview */}
                        {submission.submission_text && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Student&apos;s Submission
                                </h4>
                                <div className="p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
                                    <p className="text-sm whitespace-pre-wrap">
                                        {submission.submission_text}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Grading Form */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                {/* Score Input */}
                                <FormField
                                    control={form.control}
                                    name="score"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Score</FormLabel>
                                            <div className="space-y-4">
                                                {/* Score Display */}
                                                <div className="flex items-end justify-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={maxScore}
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = Math.min(Math.max(0, parseInt(e.target.value) || 0), maxScore);
                                                            field.onChange(value);
                                                        }}
                                                        className={cn(
                                                            'w-24 text-center text-2xl font-bold h-14',
                                                            getScoreColor(scorePercentage)
                                                        )}
                                                    />
                                                    <span className="text-2xl text-muted-foreground pb-2">
                                                        / {maxScore}
                                                    </span>
                                                    <span className={cn(
                                                        'text-lg font-medium pb-2',
                                                        getScoreColor(scorePercentage)
                                                    )}>
                                                        ({Math.round(scorePercentage)}%)
                                                    </span>
                                                </div>

                                                {/* Score Slider */}
                                                <Slider
                                                    value={[field.value]}
                                                    onValueChange={([value]) => field.onChange(value)}
                                                    max={maxScore}
                                                    step={1}
                                                    className={cn(
                                                        '[&>span:first-child]:h-2',
                                                        `[&_[role=slider]]:${getSliderColor(scorePercentage)}`
                                                    )}
                                                />

                                                {/* Quick Score Buttons */}
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {[100, 90, 80, 70, 60, 50, 0].map((percent) => (
                                                        <Button
                                                            key={percent}
                                                            type="button"
                                                            variant={Math.round(scorePercentage) === percent ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => field.onChange(Math.round((percent / 100) * maxScore))}
                                                            className="h-8"
                                                        >
                                                            {percent}%
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Feedback */}
                                <FormField
                                    control={form.control}
                                    name="feedback"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Feedback for Student</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Provide constructive feedback for the student..."
                                                    className="resize-none"
                                                    rows={4}
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                This feedback will be visible to the student
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Private Notes */}
                                <FormField
                                    control={form.control}
                                    name="private_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Private Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add private notes for your records..."
                                                    className="resize-none"
                                                    rows={2}
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Only visible to teachers, not the student
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex-shrink-0 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={form.handleSubmit(handleSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpdate ? 'Update Grade' : 'Submit Grade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
