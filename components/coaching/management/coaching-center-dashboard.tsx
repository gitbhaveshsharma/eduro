"use client";

import { useState, useEffect } from "react";
import { CoachingCenter, PublicCoachingBranch } from "@/lib/schema/coaching.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Edit,
    Phone,
    Mail,
    Globe,
} from "lucide-react";
import { CoachingAPI } from "@/lib/coaching";
import { showErrorToast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachingBranchManager } from "./coaching-branch-manager";

interface CoachingCenterDashboardProps {
    // Accept either a full center object or just its id. Some callers pass only
    // an id (e.g. from a selected list) while others may pass the full object.
    center?: CoachingCenter;
    centerId?: string | null;
    onEdit?: () => void;
    onCreateBranch?: () => void;
}

export function CoachingCenterDashboard({
    center: centerProp,
    centerId,
    onEdit,
    onCreateBranch,
}: CoachingCenterDashboardProps) {
    // Local center state: prefer the passed object, otherwise load by id
    const [localCenter, setLocalCenter] = useState<CoachingCenter | null>(
        centerProp || null
    );

    const [branches, setBranches] = useState<PublicCoachingBranch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);

    // Keep localCenter in sync with prop
    useEffect(() => {
        if (centerProp) setLocalCenter(centerProp);
    }, [centerProp]);

    // Load center if we only received an id
    useEffect(() => {
        const idToLoad = localCenter?.id || centerId;
        if (!localCenter && idToLoad) {
            // load center details
            (async () => {
                try {
                    const res = await CoachingAPI.getCenter(idToLoad!);
                    if (res.success && res.data) {
                        setLocalCenter(res.data);
                    } else {
                        showErrorToast(res.error || "Failed to load center details");
                    }
                } catch (err) {
                    console.error('Error loading center:', err);
                    showErrorToast('Failed to load center details');
                }
            })();
        }
        // only run when centerId or localCenter.id changes
    }, [centerId, localCenter?.id]);

    const loadBranches = async () => {
        setIsLoadingBranches(true);
        try {
            const centerIdentifier = localCenter?.id || centerId;
            if (!centerIdentifier) {
                setBranches([]);
                return;
            }

            const result = await CoachingAPI.getBranchesByCenter(centerIdentifier);
            if (result.success && result.data) {
                setBranches(result.data);
            } else {
                showErrorToast(result.error || "Failed to load branches");
            }
        } catch (error) {
            console.error("Error loading branches:", error);
            showErrorToast("Failed to load branches");
        } finally {
            setIsLoadingBranches(false);
        }
    };

    // Trigger branch load when we have a center id
    useEffect(() => {
        const idToLoad = localCenter?.id || centerId;
        if (idToLoad) {
            loadBranches();
        }
    }, [localCenter?.id, centerId]);

    const activeBranches = branches.filter((b) => b.is_active).length;
    const mainBranch = branches.find((b) => b.is_main_branch);

    // If we don't have a center yet, show a placeholder
    if (!localCenter) {
        return (
            <div className="py-12">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        );
    }

    const center = localCenter as CoachingCenter;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    {center.logo_url ? (
                        <img
                            src={center.logo_url}
                            alt={`${center.name} logo`}
                            className="w-16 h-16 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold">{center.name}</h2>
                        <p className="text-muted-foreground">{center.category}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge
                                variant="secondary"
                                className={
                                    center.status === "ACTIVE"
                                        ? "bg-green-500 text-white"
                                        : center.status === "INACTIVE"
                                            ? "bg-red-500 text-white"
                                            : "bg-gray-500 text-white"
                                }
                            >
                                {center.status}
                            </Badge>
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
                        </div>
                    </div>
                </div>
                {onEdit && (
                    <Button onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Center
                    </Button>
                )}
            </div>

            {/* Cover Image */}
            {center.cover_url && (
                <div className="h-48 w-full rounded-lg overflow-hidden">
                    <img
                        src={center.cover_url}
                        alt={`${center.name} cover`}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{branches.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activeBranches} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Established</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {center.established_year || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {center.established_year
                                ? `${new Date().getFullYear() - center.established_year} years ago`
                                : "Not specified"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Subjects Offered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {center.subjects?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {center.target_audience?.length || 0} target audiences
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="branches">
                        Branches ({branches.length})
                    </TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Description */}
                    {center.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {center.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Subjects */}
                    {center.subjects && center.subjects.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Subjects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {center.subjects.map((subject) => (
                                        <Badge key={subject} variant="secondary">
                                            {subject}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Target Audience */}
                    {center.target_audience && center.target_audience.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Target Audience</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {center.target_audience.map((audience) => (
                                        <Badge key={audience} variant="outline">
                                            {audience}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Branches Tab */}
                <TabsContent value="branches" className="space-y-4">
                    <CoachingBranchManager
                        coachingCenterId={center.id}
                        coachingCenterName={center.name}
                        centerOwnerId={center.owner_id}
                    />
                </TabsContent>                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>
                                Contact details for {center.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {center.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{center.phone}</p>
                                    </div>
                                </div>
                            )}

                            {center.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{center.email}</p>
                                    </div>
                                </div>
                            )}

                            {center.website && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Website</p>
                                        <a
                                            href={center.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {center.website}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {!center.phone && !center.email && !center.website && (
                                <p className="text-sm text-muted-foreground">
                                    No contact information available. Click "Edit Center" to add contact
                                    details.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {mainBranch && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Main Branch Location</CardTitle>
                                <CardDescription>
                                    Primary location for {center.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="font-medium">{mainBranch.name}</p>
                                {mainBranch.phone && (
                                    <p className="text-sm text-muted-foreground">
                                        Phone: {mainBranch.phone}
                                    </p>
                                )}
                                {mainBranch.email && (
                                    <p className="text-sm text-muted-foreground">
                                        Email: {mainBranch.email}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
