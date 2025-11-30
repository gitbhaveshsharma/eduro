/**
 * LMS Entry Page
 * 
 * Main landing page for the LMS system that allows users to:
 * 1. Access their own coaching centers (navigate to /coach routes - unified view)
 * 2. Access assigned branches (navigate to /manager/branches/:branchId routes)
 * 
 * Flow:
 * - Coach A owns coaching center with branches → Goes to /coach (unified view)
 * - Coach B is assigned as branch manager of A's branch → Goes to /manager/branches/:branchId
 * - If B also owns a coaching center → Can choose between own center (/coach) or assigned branch (/manager)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Building2,
    MapPin,
    Crown,
    Shield,
    UserCog,
    ArrowRight,
    Briefcase,
    AlertCircle,
    GraduationCap,
    Users,
    LayoutDashboard
} from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter, CoachingBranch } from '@/lib/schema/coaching.types';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: {
        id: string;
        name: string;
        owner_id: string;
        manager_id: string | null
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

interface CoachingCenterWithBranches extends CoachingCenter {
    branches: CoachingBranch[];
    role: 'owner' | 'center_manager';
}

const roleConfig = {
    owner: {
        label: 'Owner',
        description: 'You own this coaching center',
        icon: Crown,
        color: 'bg-amber-500',
        badgeVariant: 'default' as const,
    },
    center_manager: {
        label: 'Center Manager',
        description: 'You manage this coaching center',
        icon: Shield,
        color: 'bg-blue-500',
        badgeVariant: 'secondary' as const,
    },
    branch_manager: {
        label: 'Branch Manager',
        description: 'You are assigned to manage this branch',
        icon: UserCog,
        color: 'bg-green-500',
        badgeVariant: 'outline' as const,
    },
};

/**
 * LMS Entry Page Component
 */
export default function LMSEntryPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ownedCenters, setOwnedCenters] = useState<CoachingCenterWithBranches[]>([]);
    const [assignedBranches, setAssignedBranches] = useState<BranchWithRole[]>([]);

    /**
     * Fetch user's coaching centers and assigned branches
     */
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch all accessible branches with roles
            const branchesResult = await CoachingAPI.getAllAccessibleBranches();

            if (!branchesResult.success || !branchesResult.data) {
                setError(branchesResult.error || 'Failed to load data');
                return;
            }

            const { branches } = branchesResult.data;

            // Separate owned/managed centers from assigned branches
            const centersMap = new Map<string, CoachingCenterWithBranches>();
            const assignedBranchList: BranchWithRole[] = [];

            for (const branch of branches) {
                if (branch.role === 'owner' || branch.role === 'center_manager') {
                    // Group branches by coaching center for owned/managed centers
                    const centerId = branch.coaching_center?.id;
                    if (centerId) {
                        if (!centersMap.has(centerId)) {
                            // Fetch full center details
                            const centerResult = await CoachingAPI.getCenter(centerId);
                            if (centerResult.success && centerResult.data) {
                                centersMap.set(centerId, {
                                    ...centerResult.data,
                                    branches: [],
                                    role: branch.role,
                                });
                            }
                        }
                        const center = centersMap.get(centerId);
                        if (center) {
                            center.branches.push(branch);
                        }
                    }
                } else if (branch.role === 'branch_manager') {
                    // These are assigned branches (user is NOT owner/center_manager)
                    assignedBranchList.push(branch);
                }
            }

            setOwnedCenters(Array.from(centersMap.values()));
            setAssignedBranches(assignedBranchList);

            // Auto-redirect if only one option
            const totalOwnedCenters = centersMap.size;
            const totalAssignedBranches = assignedBranchList.length;

            if (totalOwnedCenters === 1 && totalAssignedBranches === 0) {
                // Only one coaching center owned, go directly to coach route
                router.push('/lms/coach/branch-students');
            } else if (totalOwnedCenters === 0 && totalAssignedBranches === 1) {
                // Only one assigned branch, go directly to manager route
                router.push(`/lms/manager/branches/${assignedBranchList[0].id}/dashboard`);
            }
        } catch (err) {
            console.error('Error fetching LMS data:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * Navigate to coaching center (unified coach view)
     */
    const handleSelectCoachingCenter = (center: CoachingCenterWithBranches) => {
        // Navigate to coach route - unified view for all branches of this center
        router.push('/lms/coach/branch-students');
    };

    /**
     * Navigate to assigned branch (branch manager view)
     */
    const handleSelectAssignedBranch = (branch: BranchWithRole) => {
        // Navigate to manager route with branch ID
        router.push(`/lms/manager/branches/${branch.id}/dashboard`);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-6 p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={fetchData} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // No access state
    if (ownedCenters.length === 0 && assignedBranches.length === 0) {
        return (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center py-16">
                        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <GraduationCap className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3">Welcome to LMS</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            You don&apos;t have any coaching centers or branch assignments yet.
                            Create a coaching center or get assigned to a branch to access the LMS.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => router.push('/coaching/create')}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Create Coaching Center
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard')}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8 p-6">
                {/* Page Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Management System</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Select your coaching center or assigned branch to manage students, classes, attendance, and fees.
                    </p>
                </div>

                {/* Owned/Managed Coaching Centers */}
                {ownedCenters.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Your Coaching Centers</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Coaching centers you own or manage. Access unified management across all branches.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ownedCenters.map((center) => (
                                <CoachingCenterCard
                                    key={center.id}
                                    center={center}
                                    onSelect={handleSelectCoachingCenter}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Separator if both sections exist */}
                {ownedCenters.length > 0 && assignedBranches.length > 0 && (
                    <Separator className="my-8" />
                )}

                {/* Assigned Branches */}
                {assignedBranches.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-green-600" />
                            <h2 className="text-xl font-semibold">Assigned Branches</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Branches where you are assigned as the branch manager. Manage students and operations for each branch.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {assignedBranches.map((branch) => (
                                <AssignedBranchCard
                                    key={branch.id}
                                    branch={branch}
                                    onSelect={handleSelectAssignedBranch}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Coaching Center Card Component
 */
function CoachingCenterCard({
    center,
    onSelect
}: {
    center: CoachingCenterWithBranches;
    onSelect: (center: CoachingCenterWithBranches) => void;
}) {
    const config = roleConfig[center.role];
    const RoleIcon = config.icon;
    const activeBranches = center.branches.filter(b => b.is_active);

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {center.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {center.description || 'No description'}
                        </CardDescription>
                    </div>
                    {center.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${config.color} text-white`}>
                        <RoleIcon className="h-3 w-3" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                {/* Branch Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{activeBranches.length} Active Branch{activeBranches.length !== 1 ? 'es' : ''}</span>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={() => onSelect(center)}
                    className="w-full group-hover:bg-primary/90"
                >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Manage Center
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Assigned Branch Card Component
 */
function AssignedBranchCard({
    branch,
    onSelect
}: {
    branch: BranchWithRole;
    onSelect: (branch: BranchWithRole) => void;
}) {
    const config = roleConfig.branch_manager;
    const RoleIcon = config.icon;

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-green-500/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            {branch.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {branch.description || 'No description'}
                        </CardDescription>
                    </div>
                    {branch.is_main_branch && (
                        <Badge variant="secondary" className="text-xs">Main</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${config.color} text-white`}>
                        <RoleIcon className="h-3 w-3" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                {/* Coaching Center Name */}
                {branch.coaching_center && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{branch.coaching_center.name}</span>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    onClick={() => onSelect(branch)}
                    variant="outline"
                    className="w-full group-hover:bg-green-50 group-hover:border-green-500 group-hover:text-green-700"
                >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Branch
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </CardContent>
        </Card>
    );
}
