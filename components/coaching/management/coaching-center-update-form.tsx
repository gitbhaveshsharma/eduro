"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Plus, AlertCircle, Image as ImageIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { coachingCenterFormSchema, COACHING_VALIDATION_LIMITS } from "@/lib/validations/coaching.validation";
import {
    CoachingCategory,
    CoachingStatus,
    COACHING_CATEGORY_METADATA,
    CoachingCenter
} from "@/lib/schema/coaching.types";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { AddressManager } from "@/components/address/address-manager";
import type { Address } from "@/lib/schema/address.types";

type CoachingCenterFormData = z.infer<typeof coachingCenterFormSchema>;

/**
 * CoachingCenterUpdateForm - Update Only
 * 
 * This form is used ONLY for updating existing coaching centers.
 * Creating new coaching centers is not allowed through this form.
 * Users must use the appropriate flow to create coaching centers.
 * 
 * This form is reusable and can be used in settings or management pages.
 */
interface CoachingCenterUpdateFormProps {
    // initialData may be undefined when the parent hasn't loaded the center yet.
    // The form is primarily for updating existing centers, but we must guard
    // against missing data to avoid runtime crashes.
    initialData?: Partial<CoachingCenterFormData> & {
        id?: string; // optional here to avoid runtime access errors
        logo_url?: string | null;
        cover_url?: string | null;
    };
    onSubmit: (data: CoachingCenterFormData, files: { logo?: File; cover?: File }) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function CoachingCenterUpdateForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: CoachingCenterUpdateFormProps) {
    // Validate that we have a coaching center to update. This form is update-only.
    // If the parent opened this form for "create" flows (no initialData), show
    // a helpful informational alert and a button to go back/close the form.
    if (!initialData || !initialData.id) {
        return (
            <Alert>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <AlertDescription>
                            This form is for editing an existing coaching center only.
                            It cannot be used to create a new center. Please select a coaching center
                            from the list to edit its details.
                        </AlertDescription>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            Back to centers
                        </Button>
                    </div>
                </div>
            </Alert>
        );
    }
    const [subjects, setSubjects] = useState<string[]>(initialData?.subjects || []);
    const [targetAudience, setTargetAudience] = useState<string[]>(
        initialData?.target_audience || []
    );
    const [subjectInput, setSubjectInput] = useState("");
    const [audienceInput, setAudienceInput] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        initialData?.logo_url || null
    );
    const [coverPreview, setCoverPreview] = useState<string | null>(
        initialData?.cover_url || null
    );
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [showAddressManager, setShowAddressManager] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CoachingCenterFormData>({
        resolver: zodResolver(coachingCenterFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            established_year: initialData?.established_year || undefined,
            category: initialData?.category || undefined,
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            website: initialData?.website || "",
            status: initialData?.status || "DRAFT",
        },
    });

    const description = watch("description");

    // Update form when subjects or target audience changes
    useEffect(() => {
        setValue("subjects", subjects.length > 0 ? subjects : null);
    }, [subjects, setValue]);

    useEffect(() => {
        setValue("target_audience", targetAudience.length > 0 ? targetAudience : null);
    }, [targetAudience, setValue]);

    // Handle logo file selection
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showErrorToast("Logo file size must be less than 5MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                showErrorToast("Logo must be an image file");
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle cover file selection
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showErrorToast("Cover image file size must be less than 10MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                showErrorToast("Cover image must be an image file");
                return;
            }
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add subject
    const addSubject = () => {
        const trimmed = subjectInput.trim();
        if (trimmed && !subjects.includes(trimmed)) {
            if (subjects.length >= COACHING_VALIDATION_LIMITS.SUBJECTS_MAX) {
                showErrorToast(
                    `You can add up to ${COACHING_VALIDATION_LIMITS.SUBJECTS_MAX} subjects`
                );
                return;
            }
            setSubjects([...subjects, trimmed]);
            setSubjectInput("");
        }
    };

    // Remove subject
    const removeSubject = (subject: string) => {
        setSubjects(subjects.filter((s) => s !== subject));
    };

    // Add target audience
    const addAudience = () => {
        const trimmed = audienceInput.trim();
        if (trimmed && !targetAudience.includes(trimmed)) {
            if (targetAudience.length >= COACHING_VALIDATION_LIMITS.TARGET_AUDIENCE_MAX) {
                showErrorToast(
                    `You can add up to ${COACHING_VALIDATION_LIMITS.TARGET_AUDIENCE_MAX} target audiences`
                );
                return;
            }
            setTargetAudience([...targetAudience, trimmed]);
            setAudienceInput("");
        }
    };

    // Remove target audience
    const removeAudience = (audience: string) => {
        setTargetAudience(targetAudience.filter((a) => a !== audience));
    };

    // Handle form submission
    const handleFormSubmit = async (data: CoachingCenterFormData) => {
        try {
            const files: { logo?: File; cover?: File } = {};
            if (logoFile) files.logo = logoFile;
            if (coverFile) files.cover = coverFile;

            await onSubmit(data, files);
        } catch (error) {
            console.error("Form submission error:", error);
            showErrorToast("Failed to submit form");
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Logo and Cover Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <div className="flex flex-col gap-2">
                        {logoPreview ? (
                            <div className="relative w-full h-32 border-2 border-dashed rounded-lg overflow-hidden">
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setLogoFile(null);
                                        setLogoPreview(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <label
                                htmlFor="logo-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Upload Logo</span>
                                <span className="text-xs text-muted-foreground">(Max 5MB)</span>
                            </label>
                        )}
                        <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                    </div>
                </div>

                {/* Cover Upload */}
                <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image</Label>
                    <div className="flex flex-col gap-2">
                        {coverPreview ? (
                            <div className="relative w-full h-32 border-2 border-dashed rounded-lg overflow-hidden">
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setCoverFile(null);
                                        setCoverPreview(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <label
                                htmlFor="cover-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Upload Cover</span>
                                <span className="text-xs text-muted-foreground">(Max 10MB)</span>
                            </label>
                        )}
                        <Input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverChange}
                        />
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">
                        Center Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        {...register("name")}
                        placeholder="Enter coaching center name"
                        maxLength={COACHING_VALIDATION_LIMITS.NAME_MAX}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="category">
                        Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        onValueChange={(value) => setValue("category", value as CoachingCategory)}
                        defaultValue={initialData?.category}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(COACHING_CATEGORY_METADATA).map(([value, meta]) => (
                                <SelectItem key={value} value={value}>
                                    {meta.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && (
                        <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe your coaching center"
                        rows={4}
                        maxLength={COACHING_VALIDATION_LIMITS.DESCRIPTION_MAX}
                    />
                    <div className="flex justify-between mt-1">
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

                <div>
                    <Label htmlFor="established_year">Established Year</Label>
                    <Input
                        id="established_year"
                        type="number"
                        {...register("established_year", {
                            setValueAs: (v) => (v === "" ? undefined : parseInt(v)),
                        })}
                        placeholder="e.g., 2010"
                        min={COACHING_VALIDATION_LIMITS.ESTABLISHED_YEAR_MIN}
                        max={COACHING_VALIDATION_LIMITS.ESTABLISHED_YEAR_MAX}
                    />
                    {errors.established_year && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.established_year.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Subjects */}
            <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="flex gap-2">
                    <Input
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        placeholder="Add subject"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addSubject();
                            }
                        }}
                    />
                    <Button type="button" onClick={addSubject} size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {subjects.map((subject) => (
                            <Badge key={subject} variant="secondary" className="gap-1">
                                {subject}
                                <button
                                    type="button"
                                    onClick={() => removeSubject(subject)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    {subjects.length} / {COACHING_VALIDATION_LIMITS.SUBJECTS_MAX} subjects
                </p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="flex gap-2">
                    <Input
                        value={audienceInput}
                        onChange={(e) => setAudienceInput(e.target.value)}
                        placeholder="Add target audience"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addAudience();
                            }
                        }}
                    />
                    <Button type="button" onClick={addAudience} size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {targetAudience.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {targetAudience.map((audience) => (
                            <Badge key={audience} variant="secondary" className="gap-1">
                                {audience}
                                <button
                                    type="button"
                                    onClick={() => removeAudience(audience)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    {targetAudience.length} / {COACHING_VALIDATION_LIMITS.TARGET_AUDIENCE_MAX} audiences
                </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
                <div>
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

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        {...register("email")}
                        placeholder="contact@example.com"
                        type="email"
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        {...register("website")}
                        placeholder="https://example.com"
                        type="url"
                    />
                    {errors.website && (
                        <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
                    )}
                </div>
            </div>

            {/* Center Location/Address */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Center Location</h3>
                    {selectedAddress && !showAddressManager && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressManager(true)}
                        >
                            <MapPin className="h-4 w-4 mr-2" />
                            Change Address
                        </Button>
                    )}
                </div>
                {!showAddressManager && selectedAddress && (
                    <Card className="border-primary">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">Selected Center Address</CardTitle>
                                    <CardDescription>{selectedAddress.address_type}</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedAddress(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {selectedAddress.label && (
                                <p className="font-medium">{selectedAddress.label}</p>
                            )}
                            {selectedAddress.address_line_1 && (
                                <p className="text-muted-foreground">{selectedAddress.address_line_1}</p>
                            )}
                            {selectedAddress.address_line_2 && (
                                <p className="text-muted-foreground">{selectedAddress.address_line_2}</p>
                            )}
                            <p className="text-muted-foreground">
                                {[selectedAddress.city, selectedAddress.district, selectedAddress.state, selectedAddress.pin_code]
                                    .filter(Boolean)
                                    .join(', ')}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!showAddressManager && !selectedAddress && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressManager(true)}
                        className="w-full"
                    >
                        <MapPin className="h-4 w-4 mr-2" />
                        Add or Select Center Address
                    </Button>
                )}

                {showAddressManager && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle>Manage Center Address</CardTitle>
                                    <CardDescription>
                                        Select an existing address or create a new one for this coaching center
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddressManager(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AddressManager
                                onAddressSelect={(address) => {
                                    setSelectedAddress(address);
                                    setShowAddressManager(false);
                                    showSuccessToast("Address selected for coaching center");
                                }}
                                showAddButton={true}
                                allowEdit={true}
                                allowDelete={true}
                                allowSetPrimary={false}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Status */}
            <div>
                <Label htmlFor="status">Status</Label>
                <Select
                    onValueChange={(value) => setValue("status", value as CoachingStatus)}
                    defaultValue={initialData?.status || "DRAFT"}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                {errors.status && (
                    <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Update Center"
                    )}
                </Button>
            </div>
        </form>
    );
}
