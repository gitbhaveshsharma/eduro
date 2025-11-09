/**
 * Coaching Branch Card Component - Improved Version
 * 
 * Display card for coaching center branches with better structure
 */

"use client";

import { useState, useEffect } from "react";
import { CoachingBranch } from "@/lib/schema/coaching.types";
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
    User,
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
import { ProfileAPI } from "@/lib/profile";
import type { PublicProfile } from "@/lib/schema/profile.types";
import { useAddressStore } from "@/lib/store/address.store";
import type { Address } from "@/lib/schema/address.types";

interface CoachingBranchCardProps {
    branch: CoachingBranch;
    onEdit?: (branch: CoachingBranch) => void;
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
    const [manager, setManager] = useState<PublicProfile | null>(null);
    const [loadingManager, setLoadingManager] = useState(false);
    const [address, setAddress] = useState<Address | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const { getAddressByEntity } = useAddressStore();

    // Load manager information
    useEffect(() => {
        const loadManager = async () => {
            if (branch.manager_id) {
                setLoadingManager(true);
                try {
                    const profile = await ProfileAPI.getProfileById(branch.manager_id);
                    if (profile) {
                        setManager(profile);
                    }
                } catch (error) {
                    console.error("Failed to load manager:", error);
                } finally {
                    setLoadingManager(false);
                }
            }
        };

        loadManager();
    }, [branch.manager_id]);

    // Load address information
    useEffect(() => {
        const loadAddress = async () => {
            if (branch.id) {
                setLoadingAddress(true);
                try {
                    const linkedAddress = await getAddressByEntity('branch', branch.id);
                    if (linkedAddress) {
                        setAddress(linkedAddress);
                    }
                } catch (error) {
                    console.error("Failed to load address:", error);
                } finally {
                    setLoadingAddress(false);
                }
            }
        };

        loadAddress();
    }, [branch.id, getAddressByEntity]);

    return (
        <Card className="overflow-hidden border border-gray-200 p-0">
            <CardContent className="p-6">
                {/* Header Section */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-xl text-gray-900 leading-tight">
                            {branch.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {branch.is_main_branch && (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                                    Main
                                </Badge>
                            )}
                            {branch.is_active ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Active
                                </Badge>
                            ) : (
                                <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0 gap-1.5">
                                    <XCircle className="h-3.5 w-3.5" />
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {branch.description && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {branch.description}
                        </p>
                    )}
                </div>

                <div className="h-px bg-gray-200 my-5" />

                {/* Three Column Grid: Contact Info, Branch Manager, Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Contact Information
                        </h4>
                        <div className="space-y-2.5">
                            {branch.phone ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 flex-shrink-0">
                                        <Phone className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm text-gray-700">{branch.phone}</span>
                                </div>
                            ) : null}

                            {branch.email ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 flex-shrink-0">
                                        <Mail className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <span className="text-sm text-gray-700 truncate">{branch.email}</span>
                                </div>
                            ) : null}

                            {!branch.phone && !branch.email && (
                                <p className="text-sm text-gray-400 italic pl-12">
                                    No contact information available
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Branch Manager */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Branch Manager
                        </h4>
                        {branch.manager_id ? (
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 flex-shrink-0">
                                    <User className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {loadingManager ? (
                                        <div className="flex items-center gap-2 py-1">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            <span className="text-sm text-gray-400">Loading...</span>
                                        </div>
                                    ) : manager ? (
                                        <div className="space-y-1.5">
                                            <p className="font-medium text-gray-900 text-sm">{manager.full_name || "N/A"}</p>
                                            <p className="text-xs text-gray-500">@{manager.username}</p>
                                            <Badge variant="outline" className="text-xs font-normal mt-1">
                                                {manager.role === 'C' ? 'Coach' :
                                                    manager.role === 'T' ? 'Teacher' :
                                                        manager.role === 'A' ? 'Admin' :
                                                            manager.role === 'SA' ? 'Super Admin' :
                                                                manager.role}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic py-1">Manager info unavailable</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic pl-12">No manager assigned</p>
                        )}
                    </div>

                    {/* Address */}
                    <div className="space-y-3 lg:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Branch Address
                        </h4>
                        {loadingAddress ? (
                            <div className="flex items-center gap-2 py-1 pl-12">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-400">Loading address...</span>
                            </div>
                        ) : address ? (
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 flex-shrink-0">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="space-y-1">
                                        {address.label && (
                                            <p className="font-medium text-sm text-gray-900">{address.label}</p>
                                        )}
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">{address.address_type}</p>
                                        {address.address_line_1 && (
                                            <p className="text-sm text-gray-600">{address.address_line_1}</p>
                                        )}
                                        {address.address_line_2 && (
                                            <p className="text-sm text-gray-600">{address.address_line_2}</p>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            {[
                                                address.city,
                                                address.district,
                                                address.state,
                                                address.pin_code
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic pl-12">No address linked</p>
                        )}
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {new Date(branch.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}</span>
                        {branch.updated_at && (
                            <span>Updated: {new Date(branch.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Action Buttons */}
            {showActions && (onEdit || onDelete) && (
                <CardFooter className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 font-medium hover:bg-white"
                            onClick={() => onEdit(branch)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
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
                                    className="flex-1 font-medium hover:bg-white hover:border-red-300 hover:text-red-600"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{branch.name}</strong>?
                                        This action cannot be undone and all associated data will be permanently removed.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(branch.id)}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                    >
                                        Delete Branch
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