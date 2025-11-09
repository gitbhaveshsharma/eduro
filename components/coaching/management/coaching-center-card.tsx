"use client";

import { useState } from "react";
import { CoachingCenter, COACHING_CATEGORY_METADATA } from "@/lib/schema/coaching.types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    Calendar,
    Edit,
    Trash2,
    Eye,
    Users,
    Loader2,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
} from "@/components/ui/dialog";
import { CoachingCenterUpdateForm } from "./coaching-center-update-form";
import { useCoachingStore } from "@/lib/coaching";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

interface CoachingCenterCardProps {
    center: CoachingCenter;
    branchCount?: number;
    onEdit?: (center: CoachingCenter) => void;
    onDelete?: (centerId: string) => void;
    onViewDashboard: (center: CoachingCenter) => void;
    isDeleting?: boolean;
    onEditSuccess?: () => void;
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-500",
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-red-500",
};

export function CoachingCenterCard({
    center,
    branchCount = 0,
    onEdit,
    onDelete,
    onViewDashboard,
    isDeleting = false,
    onEditSuccess,
}: CoachingCenterCardProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { updateCoachingCenter } = useCoachingStore();

    // Handle update via the form
    const handleUpdateSubmit = async (data: any, files: { logo?: File; cover?: File }) => {
        setIsUpdating(true);
        try {
            // Update the center data first (without files)
            const updated = await updateCoachingCenter(center.id, data);
            if (!updated) {
                showErrorToast("Failed to update coaching center");
                setIsUpdating(false);
                return;
            }

            // TODO: Handle file uploads separately using uploadCoachingLogo/uploadCoachingCover
            // For now, we'll just update the data. File upload integration can be added later.
            if (files.logo || files.cover) {
                console.warn("File upload not yet integrated in card. Use management flow for file updates.");
            }

            showSuccessToast("Coaching center updated successfully");
            setShowEditDialog(false);
            onEditSuccess?.();
        } catch (error) {
            console.error("Error updating center:", error);
            showErrorToast(error instanceof Error ? error.message : "Failed to update");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditClick = () => {
        if (onEdit) {
            // If onEdit callback provided, use that (legacy behavior)
            onEdit(center);
        } else {
            // Otherwise open the dialog modal
            setShowEditDialog(true);
        }
    };

    return (
        <>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                {center.cover_url && (
                    <div className="h-32 w-full overflow-hidden bg-muted">
                        <img
                            src={center.cover_url}
                            alt={`${center.name} cover`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        {/* Logo and Title */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            {center.logo_url ? (
                                <img
                                    src={center.logo_url}
                                    alt={`${center.name} logo`}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg leading-tight truncate">
                                    {center.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {COACHING_CATEGORY_METADATA[center.category]?.label || center.category}
                                </p>
                            </div>
                        </div>                    {/* Status Badge */}
                        <Badge
                            variant="secondary"
                            className={`${STATUS_COLORS[center.status]} text-white flex-shrink-0`}
                        >
                            {center.status}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Description */}
                    {center.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {center.description}
                        </p>
                    )}

                    {/* Info Grid */}
                    <div className="space-y-2">
                        {/* Established Year */}
                        {center.established_year && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground">Est. {center.established_year}</span>
                            </div>
                        )}

                        {/* Branch Count */}
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                                {branchCount} {branchCount === 1 ? "Branch" : "Branches"}
                            </span>
                        </div>

                        {/* Contact Info */}
                        {center.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground truncate">{center.phone}</span>
                            </div>
                        )}

                        {center.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground truncate">{center.email}</span>
                            </div>
                        )}

                        {center.website && (
                            <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a
                                    href={center.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate"
                                >
                                    Visit Website
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Subjects */}
                    {center.subjects && center.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {center.subjects.slice(0, 3).map((subject) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                    {subject}
                                </Badge>
                            ))}
                            {center.subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{center.subjects.length - 3} more
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Verification Status */}
                    {center.is_verified && (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                            Verified
                        </Badge>
                    )}
                    {center.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-500 text-white">
                            Featured
                        </Badge>
                    )}
                </CardContent>

                <CardFooter className="flex gap-2 pt-3 border-t">
                    {/* View Dashboard */}
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => onViewDashboard(center)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Dashboard
                    </Button>

                    {/* Edit */}
                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                        <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete with confirmation */}
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Coaching Center</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{center.name}</strong>? This
                                        action cannot be undone. All branches associated with this center will also
                                        be deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(center.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>

            {/* Edit Dialog Modal */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Coaching Center</DialogTitle>
                        <DialogDescription>
                            Update the details for {center.name}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        <CoachingCenterUpdateForm
                            initialData={center}
                            onSubmit={handleUpdateSubmit}
                            onCancel={() => setShowEditDialog(false)}
                            isLoading={isUpdating}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}
