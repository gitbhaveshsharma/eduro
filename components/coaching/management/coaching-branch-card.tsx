/**
 * Coaching Branch Card Component
 * 
 * Display card for coaching center branches
 */

"use client";

import { CoachingBranch, PublicCoachingBranch } from "@/lib/schema/coaching.types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Phone,
    Mail,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
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

interface CoachingBranchCardProps {
    branch: CoachingBranch | PublicCoachingBranch;
    onEdit?: (branch: CoachingBranch | PublicCoachingBranch) => void;
    onDelete?: (branchId: string) => void;
    isDeleting?: boolean;
    showActions?: boolean;
}

export function CoachingBranchCard({
    branch,
    onEdit,
    onDelete,
    isDeleting = false,
    showActions = true,
}: CoachingBranchCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{branch.name}</h3>
                            {branch.is_main_branch && (
                                <Badge variant="secondary" className="bg-blue-500 text-white">
                                    Main
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {branch.is_active ? (
                                <Badge variant="secondary" className="bg-green-500 text-white gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-gray-500 text-white gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {branch.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {branch.description}
                    </p>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                    {branch.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{branch.phone}</span>
                        </div>
                    )}

                    {branch.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground truncate">{branch.email}</span>
                        </div>
                    )}

                    {!branch.phone && !branch.email && (
                        <p className="text-sm text-muted-foreground italic">
                            No contact information available
                        </p>
                    )}
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <p>Created: {new Date(branch.created_at).toLocaleDateString()}</p>
                    {branch.updated_at && (
                        <p>Updated: {new Date(branch.updated_at).toLocaleDateString()}</p>
                    )}
                </div>
            </CardContent>

            {/* Actions */}
            {showActions && (onEdit || onDelete) && (
                <CardFooter className="flex gap-2 pt-0 pb-4 px-6">
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onEdit(branch)}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                    )}

                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{branch.name}</strong>?
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(branch.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
