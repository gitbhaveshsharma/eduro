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
import { useAddressStore } from "@/lib/store/address.store";

type CoachingCenterFormData = z.infer<typeof coachingCenterFormSchema>;

interface CoachingCenterUpdateFormProps {
    initialData?: Partial<CoachingCenterFormData> & {
        id?: string;
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
    const [loadingAddress, setLoadingAddress] = useState(false);
    const { linkAddressToEntity, getAddressByEntity, unlinkAddressFromEntity } = useAddressStore();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty, touchedFields },
        trigger,
        setError,
        clearErrors,
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
        mode: "onChange",
    });

    const description = watch("description");
    const phoneValue = watch("phone");

    // Phone number formatting and validation
    const formatPhoneNumber = (value: string): string => {
        const cleaned = value.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) {
            return cleaned;
        }
        if (cleaned.length <= 12) {
            return cleaned;
        }
        return cleaned.slice(0, 12);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        setValue("phone", formattedValue, { shouldValidate: true });
    };

    const handlePhoneBlur = () => {
        trigger("phone");
    };

    // Update form when subjects or target audience changes
    useEffect(() => {
        setValue("subjects", subjects.length > 0 ? subjects : null, { shouldValidate: true });
    }, [subjects, setValue]);

    useEffect(() => {
        setValue("target_audience", targetAudience.length > 0 ? targetAudience : null, { shouldValidate: true });
    }, [targetAudience, setValue]);

    // Load linked address when editing
    useEffect(() => {
        if (initialData?.id && !selectedAddress && !loadingAddress) {
            setLoadingAddress(true);
            getAddressByEntity('coaching', initialData.id)
                .then((address) => {
                    if (address) {
                        setSelectedAddress(address);
                    }
                })
                .catch((error) => {
                    console.error('Failed to load linked address:', error);
                })
                .finally(() => {
                    setLoadingAddress(false);
                });
        }
    }, [initialData?.id, selectedAddress, loadingAddress, getAddressByEntity]);

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

    // Handle address unlinking
    const handleUnlinkAddress = async () => {
        if (!selectedAddress) return;

        try {
            const unlinked = await unlinkAddressFromEntity(selectedAddress.id);
            if (unlinked) {
                setSelectedAddress(null);
                showSuccessToast("Address unlinked from coaching center successfully!");
            } else {
                showErrorToast("Failed to unlink address");
            }
        } catch (error) {
            console.error('Failed to unlink address:', error);
            showErrorToast("Failed to unlink address");
        }
    };

    // Handle form submission
    const handleFormSubmit = async (data: CoachingCenterFormData) => {
        try {
            const isValid = await trigger();
            if (!isValid) {
                showErrorToast("Please fix the validation errors before submitting");
                return;
            }

            const files: { logo?: File; cover?: File } = {};
            if (logoFile) files.logo = logoFile;
            if (coverFile) files.cover = coverFile;

            await onSubmit(data, files);

            // Link address to coaching center if selected
            if (selectedAddress && initialData?.id) {
                const addressLinked = await linkAddressToEntity(
                    selectedAddress.id,
                    'coaching',
                    initialData.id
                );
                if (!addressLinked) {
                    showErrorToast("Center updated but failed to link address");
                } else {
                    showSuccessToast("Address linked to coaching center successfully!");
                }
            }
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
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Center Logo</CardTitle>
                        <CardDescription>Upload your coaching center logo (Max 5MB)</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>

                {/* Cover Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cover Image</CardTitle>
                        <CardDescription>Upload your cover image (Max 10MB)</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </div>

            {/* Basic Information & Center Location - Two Column Grid (half / half on large screens) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information - 1/2 width */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Enter the basic details about your coaching center</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                {/* Left Column */}
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
                                            onValueChange={(value) => setValue("category", value as CoachingCategory, { shouldValidate: true })}
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
                                    <div className="space-y-4">
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
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center Location - 1/2 width */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Center Location</CardTitle>
                            <CardDescription>
                                Select or add the physical location of your coaching center
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Loading State */}
                                {loadingAddress && (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Loading address...</span>
                                    </div>
                                )}

                                {!loadingAddress && !showAddressManager && selectedAddress && (
                                    <div className="space-y-3">
                                        <div className="p-3 border rounded-lg bg-muted/50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-sm">Selected Address</p>
                                                    <p className="text-xs text-muted-foreground">{selectedAddress.address_type}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleUnlinkAddress}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1 text-xs">
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
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddressManager(true)}
                                            className="w-full"
                                        >
                                            <MapPin className="h-4 w-4 mr-2" />
                                            Change Address
                                        </Button>
                                    </div>
                                )}

                                {!loadingAddress && !showAddressManager && !selectedAddress && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAddressManager(true)}
                                        className="w-full h-24 border-2 border-dashed"
                                    >
                                        <div className="flex flex-col items-center">
                                            <MapPin className="h-6 w-6 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">Add Center Address</span>
                                        </div>
                                    </Button>
                                )}

                                {!loadingAddress && showAddressManager && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium">Select Address</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowAddressManager(false)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto scrollbar-modern">
                                            <AddressManager
                                                onAddressSelect={(address) => {
                                                    setSelectedAddress(address);
                                                    setShowAddressManager(false);
                                                    showSuccessToast("Address selected for coaching center. Please remember to click 'Update Center' to apply changes.");
                                                }}
                                                showAddButton={true}
                                                allowEdit={true}
                                                allowDelete={true}
                                                allowSetPrimary={false}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Subjects and Target Audience - Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subjects Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subjects</CardTitle>
                        <CardDescription>
                            Add subjects offered at your center
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                            <div className="flex flex-wrap gap-2">
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
                    </CardContent>
                </Card>

                {/* Target Audience Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Target Audience</CardTitle>
                        <CardDescription>
                            Specify who your coaching center serves
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                            <div className="flex flex-wrap gap-2">
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
                    </CardContent>
                </Card>
            </div>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How students can reach your center</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    {...register("phone")}
                                    placeholder="+1234567890 or 1234567890"
                                    type="tel"
                                    onChange={handlePhoneChange}
                                    onBlur={handlePhoneBlur}
                                    maxLength={15}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                                )}
                                {phoneValue && !errors.phone && (
                                    <p className="text-xs text-green-600 mt-1">✓ Valid phone number format</p>
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
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
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

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    onValueChange={(value) => setValue("status", value as CoachingStatus, { shouldValidate: true })}
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || Object.keys(errors).length > 0}
                >
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