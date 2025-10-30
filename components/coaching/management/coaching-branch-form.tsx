/**
 * Coaching Branch Form Component
 * 
 * Form for creating and updating coaching center branches
 * Only users with role 'C' (Coach) can create/edit branches
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { coachingBranchFormSchema, COACHING_VALIDATION_LIMITS } from "@/lib/validations/coaching.validation";
import { CoachingBranch } from "@/lib/schema/coaching.types";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { useCoachingStore } from "@/lib/coaching";

type CoachingBranchFormData = z.infer<typeof coachingBranchFormSchema>;

interface CoachingBranchFormProps {
    coachingCenterId: string;
    initialData?: Partial<CoachingBranch>;
    onSuccess?: () => void;
    onCancel: () => void;
}

export function CoachingBranchForm({
    coachingCenterId,
    initialData,
    onSuccess,
    onCancel,
}: CoachingBranchFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createCoachingBranch, updateCoachingBranch } = useCoachingStore();

    const isEditMode = !!initialData?.id;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CoachingBranchFormData>({
        resolver: zodResolver(coachingBranchFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            is_main_branch: initialData?.is_main_branch || false,
            is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
        },
    });

    const description = watch("description");
    const isMainBranch = watch("is_main_branch");
    const isActive = watch("is_active");

    // Handle form submission
    const handleFormSubmit = async (data: CoachingBranchFormData) => {
        setIsSubmitting(true);

        try {
            if (isEditMode && initialData?.id) {
                // Update existing branch
                const updateData = {
                    name: data.name,
                    description: data.description || null,
                    phone: data.phone || null,
                    email: data.email || null,
                    is_main_branch: data.is_main_branch,
                    is_active: data.is_active,
                };

                const result = await updateCoachingBranch(initialData.id, updateData);

                if (result) {
                    showSuccessToast("Branch updated successfully!");
                    onSuccess?.();
                } else {
                    showErrorToast("Failed to update branch");
                }
            } else {
                // Create new branch
                const branchData = {
                    coaching_center_id: coachingCenterId,
                    name: data.name,
                    description: data.description || null,
                    phone: data.phone || null,
                    email: data.email || null,
                    is_main_branch: data.is_main_branch,
                    is_active: data.is_active,
                };

                const result = await createCoachingBranch(branchData);

                if (result) {
                    showSuccessToast("Branch created successfully!");
                    onSuccess?.();
                } else {
                    showErrorToast("Failed to create branch");
                }
            }
        } catch (error) {
            console.error("Branch form submission error:", error);
            showErrorToast(error instanceof Error ? error.message : "Failed to save branch");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Branch Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter branch name (e.g., Main Branch, North Campus)"
                    maxLength={COACHING_VALIDATION_LIMITS.NAME_MAX}
                />
                {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    Give your branch a clear, descriptive name
                </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe this branch location, facilities, or special features"
                    rows={3}
                    maxLength={COACHING_VALIDATION_LIMITS.DESCRIPTION_MAX}
                />
                <div className="flex justify-between">
                    <div>
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {description?.length || 0} / {COACHING_VALIDATION_LIMITS.DESCRIPTION_MAX}
                    </p>
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contact Information</h3>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        {...register("phone")}
                        placeholder="+1234567890"
                        type="tel"
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        {...register("email")}
                        placeholder="branch@example.com"
                        type="email"
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                </div>
            </div>

            {/* Branch Settings */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Branch Settings</h3>

                {/* Main Branch Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_main_branch" className="text-base">
                            Main Branch
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Mark this as the primary/headquarters branch
                        </p>
                    </div>
                    <Switch
                        id="is_main_branch"
                        checked={isMainBranch}
                        onCheckedChange={(checked) => setValue("is_main_branch", checked)}
                    />
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_active" className="text-base">
                            Active Status
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {isActive
                                ? "Branch is currently active and visible"
                                : "Branch is inactive and hidden from public view"}
                        </p>
                    </div>
                    <Switch
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={(checked) => setValue("is_active", checked)}
                    />
                </div>
            </div>

            {/* Info Alert */}
            {!isEditMode && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        After creating the branch, you can add address information through the address management system.
                    </AlertDescription>
                </Alert>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditMode ? "Updating..." : "Creating..."}
                        </>
                    ) : (
                        isEditMode ? "Update Branch" : "Create Branch"
                    )}
                </Button>
            </div>
        </form>
    );
}
