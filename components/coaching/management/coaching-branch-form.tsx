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
import { Loader2, AlertCircle, Search, X, CheckCircle2, MapPin } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { coachingBranchFormSchema, COACHING_VALIDATION_LIMITS } from "@/lib/validations/coaching.validation";
import { CoachingBranch } from "@/lib/schema/coaching.types";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { useCoachingStore } from "@/lib/coaching";
import { ProfileAPI } from "@/lib/profile";
import type { PublicProfile } from "@/lib/schema/profile.types";
import { AddressManager } from "@/components/address/address-manager";
import type { Address } from "@/lib/schema/address.types";
import { useAddressStore } from "@/lib/store/address.store";

type CoachingBranchFormData = z.infer<typeof coachingBranchFormSchema>;

interface CoachingBranchFormProps {
    coachingCenterId: string;
    centerOwnerId: string; // The owner of the coaching center (default manager)
    initialData?: Partial<CoachingBranch>;
    onSuccess?: () => void;
    onCancel: () => void;
}

export function CoachingBranchForm({
    coachingCenterId,
    centerOwnerId,
    initialData,
    onSuccess,
    onCancel,
}: CoachingBranchFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [managerUsername, setManagerUsername] = useState("");
    const [searchingManager, setSearchingManager] = useState(false);
    const [selectedManager, setSelectedManager] = useState<PublicProfile | null>(null);
    const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [managerError, setManagerError] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [showAddressManager, setShowAddressManager] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const { createCoachingBranch, updateCoachingBranch } = useCoachingStore();
    const { linkAddressToEntity, getAddressByEntity, unlinkAddressFromEntity } = useAddressStore();

    const isEditMode = !!initialData?.id;

    // Load existing linked address when in edit mode
    useEffect(() => {
        const loadBranchAddress = async () => {
            if (isEditMode && initialData?.id && !selectedAddress) {
                setLoadingAddress(true);
                try {
                    const address = await getAddressByEntity('branch', initialData.id);
                    if (address) {
                        setSelectedAddress(address);
                    }
                } catch (error) {
                    console.error("Failed to load branch address:", error);
                } finally {
                    setLoadingAddress(false);
                }
            }
        };

        loadBranchAddress();
    }, [isEditMode, initialData?.id, getAddressByEntity, selectedAddress]);

    // Load manager info when editing
    useEffect(() => {
        const loadManagerInfo = async () => {
            if (isEditMode && initialData?.manager_id && !selectedManager) {
                try {
                    const profile = await ProfileAPI.getProfileById(initialData.manager_id);
                    if (profile) {
                        setSelectedManager(profile);
                    }
                } catch (error) {
                    console.error("Failed to load manager info:", error);
                }
            }
        };

        loadManagerInfo();
    }, [isEditMode, initialData?.manager_id, selectedManager]);

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

    // Handle manager search by username
    const handleSearchManager = async () => {
        if (!managerUsername.trim()) {
            setManagerError("Please enter a username");
            return;
        }

        setSearchingManager(true);
        setManagerError(null);
        setSearchResults([]);
        setShowSearchResults(false);

        try {
            const profile = await ProfileAPI.getProfileByUsername(managerUsername.trim());

            if (profile) {
                // Check if user has appropriate role (Coach, Teacher, Admin)
                if (!['C', 'T', 'A', 'SA'].includes(profile.role || '')) {
                    setManagerError("User must have Coach, Teacher, or Admin role");
                    setSearchResults([]);
                    setShowSearchResults(false);
                    return;
                }

                setSearchResults([profile]);
                setShowSearchResults(true);
                setManagerError(null);
            } else {
                setManagerError("User not found");
                setSearchResults([]);
                setShowSearchResults(false);
            }
        } catch (error) {
            console.error("Error searching manager:", error);
            setManagerError("Failed to search user");
            setSearchResults([]);
            setShowSearchResults(false);
        } finally {
            setSearchingManager(false);
        }
    };

    // Select manager from search results
    const handleSelectManager = (profile: PublicProfile) => {
        setSelectedManager(profile);
        setShowSearchResults(false);
        setSearchResults([]);
        setManagerUsername("");
        setManagerError(null);
        showSuccessToast(`Manager selected: ${profile.full_name || profile.username}`);
    };

    // Clear selected manager
    const handleClearManager = () => {
        setSelectedManager(null);
        setManagerUsername("");
        setManagerError(null);
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const [showConfirmRemoveManager, setShowConfirmRemoveManager] = useState(false);
    const [isRemovingManager, setIsRemovingManager] = useState(false);

    // Called when user confirms removal in modal
    const handleConfirmRemoveManager = async () => {
        // If not editing an existing branch, just clear selection locally
        if (!isEditMode || !initialData?.id) {
            handleClearManager();
            setShowConfirmRemoveManager(false);
            return;
        }

        setIsRemovingManager(true);

        try {
            // Reset manager to center owner (business rule) by assigning centerOwnerId
            const updateData = {
                manager_id: centerOwnerId,
            } as Partial<import("@/lib/schema/coaching.types").CoachingBranch>;

            const result = await updateCoachingBranch(initialData.id, updateData as any);

            if (result) {
                // Clear selected manager in UI
                setSelectedManager(null);
                showSuccessToast("Manager removed and reverted to center owner");
                // Optionally notify parent to refresh list
                onSuccess?.();
            } else {
                showErrorToast("Failed to remove manager");
            }
        } catch (error) {
            console.error("Failed to remove manager:", error);
            showErrorToast(error instanceof Error ? error.message : "Failed to remove manager");
        } finally {
            setIsRemovingManager(false);
            setShowConfirmRemoveManager(false);
        }
    };

    // Handle address unlinking
    const handleUnlinkAddress = async () => {
        if (!selectedAddress) return;

        try {
            const unlinked = await unlinkAddressFromEntity(selectedAddress.id);
            if (unlinked) {
                setSelectedAddress(null);
                showSuccessToast("Address unlinked from branch successfully!");
            } else {
                showErrorToast("Failed to unlink address");
            }
        } catch (error) {
            console.error('Failed to unlink address:', error);
            showErrorToast("Failed to unlink address");
        }
    };

    // Handle form submission
    const handleFormSubmit = async (data: CoachingBranchFormData) => {
        setIsSubmitting(true);

        try {
            // Determine manager_id: use selected manager, or default to center owner
            const managerId = selectedManager?.id || centerOwnerId;

            if (isEditMode && initialData?.id) {
                // Update existing branch
                const updateData = {
                    name: data.name,
                    description: data.description || null,
                    phone: data.phone || null,
                    email: data.email || null,
                    is_main_branch: data.is_main_branch,
                    is_active: data.is_active,
                    manager_id: managerId,
                };

                const result = await updateCoachingBranch(initialData.id, updateData);

                if (result) {
                    // Link address to branch if selected
                    if (selectedAddress) {
                        const addressLinked = await linkAddressToEntity(
                            selectedAddress.id,
                            'branch',
                            initialData.id
                        );
                        if (!addressLinked) {
                            showErrorToast("Branch updated but failed to link address");
                        }
                    }

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
                    manager_id: managerId, // Default to center owner or selected manager
                };

                const createdBranch = await createCoachingBranch(branchData);

                if (createdBranch) {
                    // Link address to branch if selected
                    if (selectedAddress) {
                        const addressLinked = await linkAddressToEntity(
                            selectedAddress.id,
                            'branch',
                            createdBranch.id
                        );
                        if (!addressLinked) {
                            showErrorToast("Branch created but failed to link address");
                        }
                    }

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

            {/* Confirm remove manager dialog (reusable) */}
            <ConfirmDialog
                open={showConfirmRemoveManager}
                onOpenChange={setShowConfirmRemoveManager}
                title={`Remove manager from ${initialData?.name || 'this branch'}?`}
                description={
                    <>
                        Are you sure you want to remove <strong>{selectedManager?.full_name || selectedManager?.username}</strong> as the manager for <strong>{initialData?.name || 'this branch'}</strong>? This will revert the branch manager to the coaching center owner.
                    </>
                }
                confirmLabel={isRemovingManager ? "Removing..." : "Remove Manager"}
                cancelLabel="Cancel"
                intent="danger"
                onConfirm={handleConfirmRemoveManager}
            />

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

            {/* Branch Manager */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Branch Manager</h3>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        By default, the coaching center owner will be set as the branch manager.
                        You can optionally assign a different user as the manager by searching their username.
                    </AlertDescription>
                </Alert>

                {/* Always show manager search input */}
                <div className="space-y-2">
                    <Label htmlFor="manager_username">Search Manager by Username</Label>
                    <div className="flex gap-2">
                        <Input
                            id="manager_username"
                            value={managerUsername}
                            onChange={(e) => setManagerUsername(e.target.value)}
                            placeholder="Enter username (e.g., john_doe)"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSearchManager();
                                }
                            }}
                            disabled={searchingManager}
                        />
                        <Button
                            type="button"
                            onClick={handleSearchManager}
                            disabled={searchingManager || !managerUsername.trim()}
                            variant="outline"
                        >
                            {searchingManager ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {managerError && (
                        <p className="text-sm text-destructive">{managerError}</p>
                    )}

                    {/* Search Results */}
                    {showSearchResults && searchResults.length > 0 && (
                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="text-sm">Search Results</CardTitle>
                                <CardDescription>Click to select as branch manager</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {searchResults.map((profile) => (
                                    <div
                                        key={profile.id}
                                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => handleSelectManager(profile)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {profile.full_name || "N/A"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    @{profile.username}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Role: {profile.role === 'C' ? 'Coach' :
                                                        profile.role === 'T' ? 'Teacher' :
                                                            profile.role === 'A' ? 'Admin' :
                                                                profile.role === 'SA' ? 'Super Admin' :
                                                                    profile.role}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Leave blank to use the center owner as the default manager
                    </p>
                </div>

                {/* Show selected manager info */}
                {selectedManager && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Currently Selected Manager</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowConfirmRemoveManager(true)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm">
                                <span className="text-muted-foreground">Name:</span>{" "}
                                <span className="font-medium">{selectedManager.full_name || "N/A"}</span>
                            </p>
                            <p className="text-sm">
                                <span className="text-muted-foreground">Username:</span>{" "}
                                <span className="font-medium">{`@${selectedManager.username}`}</span>
                            </p>
                            <p className="text-sm">
                                <span className="text-muted-foreground">Role:</span>{" "}
                                <span className="font-medium">
                                    {selectedManager.role === 'C' ? 'Coach' :
                                        selectedManager.role === 'T' ? 'Teacher' :
                                            selectedManager.role === 'A' ? 'Admin' :
                                                selectedManager.role === 'SA' ? 'Super Admin' :
                                                    selectedManager.role}
                                </span>
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            You can search for a different manager above to change the assignment
                        </p>
                    </div>
                )}
            </div>

            {/* Branch Location/Address */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Branch Location</h3>
                    {selectedAddress && !showAddressManager && !loadingAddress && (
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

                {/* Loading State */}
                {loadingAddress && (
                    <Card>
                        <CardContent className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading address...</span>
                        </CardContent>
                    </Card>
                )}

                {/* Show selected address */}
                {!loadingAddress && !showAddressManager && selectedAddress && (
                    <Card className="border-primary">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">Selected Branch Address</CardTitle>
                                    <CardDescription>{selectedAddress.address_type}</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleUnlinkAddress}
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

                {/* Show "Add Address" button when no address */}
                {!loadingAddress && !showAddressManager && !selectedAddress && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressManager(true)}
                        className="w-full"
                    >
                        <MapPin className="h-4 w-4 mr-2" />
                        Add or Select Branch Address
                    </Button>
                )}

                {/* Show address manager/selector */}
                {!loadingAddress && showAddressManager && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle>Manage Branch Address</CardTitle>
                                    <CardDescription>
                                        Select an existing address or create a new one for this branch
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
                                    showSuccessToast("Address selected for branch. Please remember to click 'Create Branch' or 'Update Branch' to apply changes.");
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