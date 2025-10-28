/**
 * Create Review Dialog Component
 * 
 * Modal dialog for creating and editing reviews
 * Includes rating inputs, text fields, and validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { ReviewAPI } from '@/lib/review';
import { validateTitle, validateComment } from '@/lib/validations/review.validation';
import type { CreateReviewInput, UpdateReviewInput } from '@/lib/validations/review.validation';
import type { ReviewWithDetails } from '@/lib/schema/review.types';

interface CreateReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: string;
    branchName?: string;
    existingReview?: ReviewWithDetails;
    onSuccess?: () => void;
    // Provide current user's profile and role so the dialog can use them
    userProfile?: any;
    userRole?: string;
}

interface RatingInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

function RatingInput({ label, value, onChange, required }: RatingInputProps) {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
        <div className="space-y-2">
            <Label>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        onMouseEnter={() => setHoveredRating(rating)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => onChange(rating.toString())}
                        className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1 transition-all"
                    >
                        <Star
                            className={cn(
                                'h-8 w-8 transition-all',
                                (hoveredRating >= rating || parseInt(value) >= rating)
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-300'
                            )}
                        />
                    </button>
                ))}
                {value && (
                    <span className="ml-2 text-sm font-medium">{value}/5</span>
                )}
            </div>
        </div>
    );
}

export function CreateReviewDialog({
    open,
    onOpenChange,
    branchId,
    branchName,
    existingReview,
    onSuccess,
    userProfile,
    userRole
}: CreateReviewDialogProps) {
    const isEditing = !!existingReview;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: existingReview?.title || '',
        comment: existingReview?.comment || '',
        overall_rating: existingReview?.overall_rating || '',
        teaching_quality: existingReview?.teaching_quality || '',
        infrastructure: existingReview?.infrastructure || '',
        staff_support: existingReview?.staff_support || '',
        value_for_money: existingReview?.value_for_money || '',
        is_anonymous: existingReview?.is_anonymous || false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (existingReview) {
            setFormData({
                title: existingReview.title || '',
                comment: existingReview.comment || '',
                overall_rating: existingReview.overall_rating || '',
                teaching_quality: existingReview.teaching_quality || '',
                infrastructure: existingReview.infrastructure || '',
                staff_support: existingReview.staff_support || '',
                value_for_money: existingReview.value_for_money || '',
                is_anonymous: existingReview.is_anonymous || false,
            });
        }
    }, [existingReview]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate title
        const titleValidation = validateTitle(formData.title);
        if (!titleValidation.valid) {
            newErrors.title = titleValidation.error!;
        }

        // Validate overall rating
        if (!formData.overall_rating) {
            newErrors.overall_rating = 'Overall rating is required';
        }

        // Validate comment (required for low ratings)
        if (formData.overall_rating && ['1', '2'].includes(formData.overall_rating)) {
            const commentValidation = validateComment(formData.comment);
            if (!commentValidation.valid) {
                newErrors.comment = commentValidation.error || 'Comment is required for ratings 1-2';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            showErrorToast('Please fix the errors before submitting');
            return;
        }

        setLoading(true);

        try {
            if (isEditing && existingReview) {
                // Update existing review
                const updateData: UpdateReviewInput = {
                    title: formData.title,
                    comment: formData.comment || undefined,
                    overall_rating: formData.overall_rating as any,
                    teaching_quality: formData.teaching_quality as any || undefined,
                    infrastructure: formData.infrastructure as any || undefined,
                    staff_support: formData.staff_support as any || undefined,
                    value_for_money: formData.value_for_money as any || undefined,
                };

                const updated = await ReviewAPI.updateReview(existingReview.id, updateData);

                if (updated) {
                    showSuccessToast('Review updated successfully!');
                    onSuccess?.();
                    onOpenChange(false);
                } else {
                    showErrorToast('Failed to update review');
                }
            } else {
                // Create new review
                // Derive reviewer_user_type from provided userRole or profile
                const mapRoleToReviewerType = (role?: string) => {
                    if (!role) return 'STUDENT';
                    const r = role.toUpperCase();
                    // Map common short codes to more descriptive types used by API
                    if (r === 'S' || r === 'STUDENT') return 'STUDENT';
                    if (r === 'T' || r === 'TEACHER') return 'TEACHER';
                    if (r === 'C' || r === 'COACH' || r === 'COACHING') return 'COACH';
                    if (r === 'A' || r === 'ADMIN') return 'ADMIN';
                    return 'STUDENT';
                };

                const createData: CreateReviewInput = {
                    coaching_branch_id: branchId,
                    reviewer_user_type: mapRoleToReviewerType(userRole || (userProfile as any)?.role) as any,
                    title: formData.title,
                    comment: formData.comment || undefined,
                    overall_rating: formData.overall_rating as any,
                    teaching_quality: formData.teaching_quality as any || undefined,
                    infrastructure: formData.infrastructure as any || undefined,
                    staff_support: formData.staff_support as any || undefined,
                    value_for_money: formData.value_for_money as any || undefined,
                    is_anonymous: formData.is_anonymous,
                };

                const created = await ReviewAPI.createReview(createData);

                if (created) {
                    showSuccessToast('Review submitted successfully!');
                    onSuccess?.();
                    onOpenChange(false);
                    // Reset form
                    setFormData({
                        title: '',
                        comment: '',
                        overall_rating: '',
                        teaching_quality: '',
                        infrastructure: '',
                        staff_support: '',
                        value_for_money: '',
                        is_anonymous: false,
                    });
                } else {
                    showErrorToast('Failed to submit review');
                }
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showErrorToast('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Your Review' : 'Write a Review'}
                    </DialogTitle>
                    <DialogDescription>
                        {branchName && !isEditing && (
                            <>Sharing your experience with <strong>{branchName}</strong></>
                        )}
                        {isEditing && 'Update your review details below'}
                    </DialogDescription>
                </DialogHeader>

                <DialogBody>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Overall Rating */}
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <RatingInput
                                label="Overall Rating *"
                                value={formData.overall_rating}
                                onChange={(value) => setFormData({ ...formData, overall_rating: value })}
                                required
                            />
                            {errors.overall_rating && (
                                <p className="text-sm text-destructive mt-2">{errors.overall_rating}</p>
                            )}
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-medium">
                                Review Title *
                            </Label>
                            <Input
                                id="title"
                                placeholder="Sum up your experience"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={cn(
                                    'w-full',
                                    errors.title ? 'border-destructive' : ''
                                )}
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">{errors.title}</p>
                            )}
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-base font-medium">
                                Your Review {['1', '2'].includes(formData.overall_rating) && <span className="text-destructive">*</span>}
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Share details of your experience..."
                                rows={5}
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                className={cn(
                                    'resize-none',
                                    errors.comment ? 'border-destructive' : ''
                                )}
                            />
                            {errors.comment && (
                                <p className="text-sm text-destructive">{errors.comment}</p>
                            )}
                            <p className="text-xs text-muted-foreground text-right">
                                {formData.comment.length}/2000 characters
                            </p>
                        </div>

                        {/* Category Ratings */}
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                Category Ratings (Optional)
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <RatingInput
                                    label="Teaching Quality"
                                    value={formData.teaching_quality}
                                    onChange={(value) => setFormData({ ...formData, teaching_quality: value })}
                                />

                                <RatingInput
                                    label="Infrastructure"
                                    value={formData.infrastructure}
                                    onChange={(value) => setFormData({ ...formData, infrastructure: value })}
                                />

                                <RatingInput
                                    label="Staff Support"
                                    value={formData.staff_support}
                                    onChange={(value) => setFormData({ ...formData, staff_support: value })}
                                />

                                <RatingInput
                                    label="Value for Money"
                                    value={formData.value_for_money}
                                    onChange={(value) => setFormData({ ...formData, value_for_money: value })}
                                />
                            </div>
                        </div>

                        {/* Anonymous Option */}
                        {!isEditing && (
                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Post Anonymously</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Your identity will not be revealed
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_anonymous}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                                />
                            </div>
                        )}
                    </form>
                </DialogBody>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? 'Update Review' : 'Submit Review'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}