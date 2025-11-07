/**
 * Coaching Branch Manager Component
 * 
 * Manages branches for a specific coaching center
 * Only users with role 'C' (Coach) can manage branches
 */

"use client";

import { useState, useEffect } from "react";
import { useCoachingStore } from "@/lib/coaching";
import { CoachingBranch, PublicCoachingBranch } from "@/lib/schema/coaching.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Loader2,
    Plus,
    MapPin,
    AlertCircle,
} from "lucide-react";
import { CoachingBranchForm } from "./coaching-branch-form";
import { CoachingBranchCard } from "./coaching-branch-card";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

interface CoachingBranchManagerProps {
    coachingCenterId: string;
    coachingCenterName: string;
    centerOwnerId: string; // Owner of the coaching center (default branch manager)
}

export function CoachingBranchManager({
    coachingCenterId,
    coachingCenterName,
    centerOwnerId,
}: CoachingBranchManagerProps) {
    const [branches, setBranches] = useState<CoachingBranch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingBranch, setEditingBranch] = useState<CoachingBranch | null>(null);

    const { loadBranchesByCenter, deleteCoachingBranch } = useCoachingStore();

    // Load branches on mount
    useEffect(() => {
        loadBranchesData();
    }, [coachingCenterId]);

    const loadBranchesData = async () => {
        setIsLoading(true);
        try {
            const result = await loadBranchesByCenter(coachingCenterId, true);
            // loadBranchesByCenter returns an array (possibly empty)
            if (result && Array.isArray(result)) {
                setBranches(result);
            } else if (Array.isArray(result)) {
                setBranches(result);
            } else {
                // In case the store changes to return void, try reading from cache
                setBranches([]);
            }
        } catch (error) {
            console.error("Error loading branches:", error);
            showErrorToast("Failed to load branches");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle create branch
    const handleCreateBranch = () => {
        setShowCreateDialog(true);
        setEditingBranch(null);
    };

    // Handle edit branch
    const handleEditBranch = (branch: CoachingBranch) => {
        setEditingBranch(branch);
        setShowCreateDialog(true);
    };

    // Handle delete branch
    const handleDeleteBranch = async (branchId: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteCoachingBranch(branchId);
            if (result) {
                showSuccessToast("Branch deleted successfully");
                await loadBranchesData();
            } else {
                showErrorToast("Failed to delete branch");
            }
        } catch (error) {
            console.error("Error deleting branch:", error);
            showErrorToast(error instanceof Error ? error.message : "Failed to delete branch");
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle form success
    const handleFormSuccess = async () => {
        setShowCreateDialog(false);
        setEditingBranch(null);
        await loadBranchesData();
    };

    // Handle form cancel
    const handleFormCancel = () => {
        setShowCreateDialog(false);
        setEditingBranch(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Branch Locations</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage branches for {coachingCenterName}
                    </p>
                </div>
                <Button onClick={handleCreateBranch}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                </Button>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <p className="text-sm text-muted-foreground">Loading branches...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : branches.length === 0 ? (
                /* Empty State */
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Branches Yet</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Add your first branch to start managing multiple locations for this coaching center.
                        </p>
                        <Button onClick={handleCreateBranch}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Branch
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Branches Grid */
                <>
                    <Alert variant="info" className="mb-4">
                        <AlertTitle>Branch Overview</AlertTitle>
                        <AlertDescription>
                            You have {branches.length} {branches.length === 1 ? "branch" : "branches"}.
                            {" "}{branches.filter(b => b.is_active).length} active,
                            {" "}{branches.filter(b => !b.is_active).length} inactive.
                        </AlertDescription>
                    </Alert>
                    <div className="">
                        {branches.map((branch) => (
                            <CoachingBranchCard
                                key={branch.id}
                                branch={branch}
                                onEdit={handleEditBranch}
                                onDelete={handleDeleteBranch}
                                isDeleting={isDeleting}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                {/* Match the review dialog pattern: keep max width but avoid forcing an outer overflow
                    on DialogContent which creates a second scrollbar. Let the form/dialog body
                    manage its own scrolling if needed (same approach as create-review-dialog). */}
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBranch ? "Edit Branch" : "Create New Branch"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBranch
                                ? "Update the branch information below"
                                : "Add a new branch location for your coaching center"}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        <CoachingBranchForm
                            coachingCenterId={coachingCenterId}
                            centerOwnerId={centerOwnerId}
                            initialData={editingBranch || undefined}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </DialogBody>                    {/* DialogFooter is intentionally left empty because the form contains its own actions.
                        If you prefer footer-level actions (Cancel/Save) outside the form, we can move them
                        here and wire them to the form via refs or callbacks. */}
                    <DialogFooter />
                </DialogContent>
            </Dialog>
        </div>
    );
}
