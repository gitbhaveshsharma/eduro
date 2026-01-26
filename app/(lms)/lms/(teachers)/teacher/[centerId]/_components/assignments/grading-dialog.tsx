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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Loader2,
    User,
    Calendar,
    Clock,
    FileText,
    AlertCircle,
    Download,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradeSubmissionSchema, updateGradeSchema } from '@/lib/branch-system/assignment';
import type { SubmissionForGrading, GradeSubmissionDTO, UpdateGradeDTO } from '@/lib/branch-system/types/assignment.types';
import { GradingStatus, formatDateTime, formatFileSize } from '@/lib/branch-system/assignment';
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

    // Get score color based on percentage - Updated with brand colors
    const getScoreColor = (percentage: number) => {
        if (percentage >= 90) return 'text-success'; // Green #10B981
        if (percentage >= 70) return 'text-brand-secondary'; // Sky Blue #3B82F6
        if (percentage >= 50) return 'text-warning'; // Amber #F59E0B
        return 'text-error'; // Red #EF4444
    };

    // Get slider color based on percentage - Updated with brand colors
    const getSliderColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-success'; // Green #10B981
        if (percentage >= 70) return 'bg-brand-secondary'; // Sky Blue #3B82F6
        if (percentage >= 50) return 'bg-warning'; // Amber #F59E0B
        return 'bg-error'; // Red #EF4444
    };

    // Get slider track color class
    const getSliderTrackClass = (percentage: number) => {
        if (percentage >= 90) return '[&_[role=slider]]:bg-success [&>span:first-child]:bg-success/30';
        if (percentage >= 70) return '[&_[role=slider]]:bg-brand-secondary [&>span:first-child]:bg-brand-secondary/30';
        if (percentage >= 50) return '[&_[role=slider]]:bg-warning [&>span:first-child]:bg-warning/30';
        return '[&_[role=slider]]:bg-error [&>span:first-child]:bg-error/30';
    };

    if (!submission) return null;

    // Determine display value for maximum allowed submissions (type-safe fallback)
    const maxAttemptsDisplay = ((submission as any).max_submissions ?? (submission as any).maxAttempts ?? (submission as any).max_submission_attempts) ?? 'unlimited';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col scrollbar-modern">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-brand-primary">
                        {isUpdate ? 'Update Grade' : 'Grade Submission'}
                    </DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? 'Update the grade and feedback for this submission'
                            : 'Review the submission and assign a grade'
                        }
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto scrollbar-modern pr-4">
                    <TooltipProvider>
                        <div className="p-4 space-y-6">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                                <Avatar className="h-12 w-12 border-2 border-brand-primary/20">
                                    <AvatarImage
                                        src={submission.student_avatar || undefined}
                                        alt={submission.student_name || 'Student'}
                                    />
                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                                        {getInitials(submission.student_name || 'S')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-foreground">
                                        {submission.student_name || 'Unknown Student'}
                                    </p>
                                    {submission.student_username && (
                                        <p className="text-sm text-muted-foreground">
                                            @{submission.student_username}
                                        </p>
                                    )}
                                </div>
                                {submission.is_late && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="destructive" className="bg-error text-error-foreground">
                                                Late Submission
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Student submitted after the due date</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>

                            {/* Submission Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <Calendar className="h-4 w-4 " />
                                            <span className="text-muted-foreground">Submitted:</span>
                                            <span className="font-medium text-foreground">
                                                {formatDateTime(submission.submitted_at, 'short')}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Date and time when student submitted</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-muted-foreground">Attempt:</span>
                                            <span className="font-medium text-foreground">
                                                #{submission.attempt_number}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Submission attempt number</p>
                                        <p className="text-xs text-muted-foreground">
                                            Out of {maxAttemptsDisplay} attempts
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Submission Content Preview */}
                            {submission.submission_text && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                            <FileText className="h-4 w-4 text-brand-primary" />
                                            Student&apos;s Submission
                                        </h4>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                                                    <Info className="h-3 w-3" />
                                                    {submission.submission_text.length} characters
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Length of text submission</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border max-h-40 overflow-y-auto scrollbar-thin">
                                        <p className="text-sm whitespace-pre-wrap text-foreground">
                                            {submission.submission_text}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Submitted File Preview */}
                            {submission.submission_file && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                        <FileText className="h-4 w-4" />
                                        Submitted File
                                    </h4>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 rounded-md bg-brand-primary/10">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate text-foreground">
                                                    {submission.submission_file.file_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(submission.submission_file.file_size)}
                                                </p>
                                            </div>
                                        </div>
                                        {submission.submission_file.download_url && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-brand-secondary-foreground"
                                                        asChild
                                                    >
                                                        <a
                                                            href={submission.submission_file.download_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Download submitted file</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Separator className="bg-border" />

                            {/* Grading Form */}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                    {/* Score Input */}
                                    <FormField
                                        control={form.control}
                                        name="score"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Score</FormLabel>
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
                                                                'w-24 text-center text-2xl font-bold h-14 border-brand-primary/30 focus:border-brand-primary focus:ring-brand-primary',
                                                                getScoreColor(scorePercentage)
                                                            )}
                                                        />
                                                        <span className="text-2xl text-muted-foreground pb-2">
                                                            / {maxScore}
                                                        </span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className={cn(
                                                                    'text-lg font-medium pb-2 cursor-help',
                                                                    getScoreColor(scorePercentage)
                                                                )}>
                                                                    ({Math.round(scorePercentage)}%)
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Percentage score</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {scorePercentage >= 90 ? 'Excellent' :
                                                                        scorePercentage >= 70 ? 'Good' :
                                                                            scorePercentage >= 50 ? 'Average' :
                                                                                'Needs Improvement'}
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>

                                                    {/* Score Slider */}
                                                    <div className="px-4">
                                                        <Slider
                                                            value={[field.value]}
                                                            onValueChange={([value]) => field.onChange(value)}
                                                            max={maxScore}
                                                            step={1}
                                                            className={cn(
                                                                getSliderTrackClass(scorePercentage)
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Quick Score Buttons */}
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {[100, 90, 80, 70, 60, 50, 0].map((percent) => {
                                                            const scoreForPercent = Math.round((percent / 100) * maxScore);
                                                            return (
                                                                <Tooltip key={percent}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant={Math.round(scorePercentage) === percent ? 'default' : 'outline'}
                                                                            size="sm"
                                                                            onClick={() => field.onChange(scoreForPercent)}
                                                                            className={cn(
                                                                                'h-8 transition-all',
                                                                                Math.round(scorePercentage) === percent
                                                                                    ? 'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90'
                                                                                    : 'border-border hover:bg-accent hover:text-accent-foreground'
                                                                            )}
                                                                        >
                                                                            {percent}%
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Set score to {scoreForPercent} points</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <FormMessage className="text-error" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Feedback */}
                                    <FormField
                                        control={form.control}
                                        name="feedback"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-foreground">Feedback for Student</FormLabel>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                                                                <Info className="h-3 w-3" />
                                                                Optional but recommended
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Provide constructive feedback to help student improve</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Provide constructive feedback for the student..."
                                                        className="resize-none border-border focus:border-brand-primary focus:ring-brand-primary"
                                                        rows={4}
                                                        {...field}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This feedback will be visible to the student
                                                </FormDescription>
                                                <FormMessage className="text-error" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Private Notes */}
                                    <FormField
                                        control={form.control}
                                        name="private_notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Private Notes (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Add private notes for your records..."
                                                        className="resize-none border-border focus:border-brand-secondary focus:ring-brand-secondary"
                                                        rows={2}
                                                        {...field}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Only visible to teachers, not the student
                                                </FormDescription>
                                                <FormMessage className="text-error" />
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </div>
                    </TooltipProvider>
                </ScrollArea>

                <DialogFooter className="flex-shrink-0 border-t border-border pt-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="border-border hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Close without saving changes</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={isLoading}
                                className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90 focus:ring-brand-primary"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUpdate ? 'Update Grade' : 'Submit Grade'}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isUpdate ? 'Save updated grade and feedback' : 'Submit final grade and feedback'}</p>
                        </TooltipContent>
                    </Tooltip>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}