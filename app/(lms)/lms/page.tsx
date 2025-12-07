'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    LayoutDashboard,
    ArrowLeft,
    Bell,
    Home
} from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter, CoachingBranch } from '@/lib/schema/coaching.types';
import { UserAvatar } from '@/components/avatar';
import { useCurrentProfile } from '@/lib/profile';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

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
 * Memoized Header Component
 */
const LMSEntryHeader = memo(({
    notificationCount = 0,
    onNotificationClick,
    onBackClick
}: {
    notificationCount?: number;
    onNotificationClick?: () => void;
    onBackClick?: () => void;
}) => {
    const router = useRouter();
    const profile = useCurrentProfile();

    const handleBack = useCallback(() => {
        if (onBackClick) {
            onBackClick();
        } else {
            router.back();
        }
    }, [onBackClick, router]);

    const handleHome = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    const handleNotifications = useCallback(() => {
        if (onNotificationClick) {
            onNotificationClick();
        }
    }, [onNotificationClick]);

    const handleAvatarClick = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Left Side - Back Button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-10 w-full p-0 hover:bg-gray-100 rounded-lg"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5" /> Back
                        </Button>
                    </div>

                    {/* Center - Title */}
                    <div className="flex items-center justify-center flex-grow">
                        <h1 className="text-lg font-semibold">Tutrsy LMS</h1>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Feed/Home Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleHome}
                            className="h-10 p-0 hover:bg-gray-100 rounded-lg"
                        >
                            <Home className="h-5 w-5" /> Home
                        </Button>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNotifications}
                            className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                            aria-label="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {notificationCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </Badge>
                            )}
                        </Button>

                        {/* User Avatar */}
                        {profile && (
                            <UserAvatar
                                profile={profile}
                                size="sm"
                                showOnlineStatus
                                className="cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all"
                                onClick={handleAvatarClick}
                            />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});
LMSEntryHeader.displayName = 'LMSEntryHeader';

/**
 * Memoized Skeleton Loading Component
 */
const LMSDataSkeleton = memo(() => (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-2">
                        <CardHeader className="pb-3">
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
));
LMSDataSkeleton.displayName = 'LMSDataSkeleton';

/**
 * Memoized Coaching Center Card Component
 */
const CoachingCenterCard = memo(({
    center,
    onSelect
}: {
    center: CoachingCenterWithBranches;
    onSelect: (center: CoachingCenterWithBranches) => void;
}) => {
    const config = useMemo(() => roleConfig[center.role], [center.role]);
    const RoleIcon = config.icon;
    
    const activeBranches = useMemo(
        () => center.branches.filter(b => b.is_active),
        [center.branches]
    );

    const branchCountText = useMemo(
        () => `${activeBranches.length} Active Branch${activeBranches.length !== 1 ? 'es' : ''}`,
        [activeBranches.length]
    );

    const handleSelect = useCallback(() => {
        onSelect(center);
    }, [onSelect, center]);

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
                        <span>{branchCountText}</span>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleSelect}
                    className="w-full group-hover:bg-primary/90"
                >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Manage Center
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </CardContent>
        </Card>
    );
});
CoachingCenterCard.displayName = 'CoachingCenterCard';

/**
 * Memoized Assigned Branch Card Component
 */
const AssignedBranchCard = memo(({
    branch,
    onSelect
}: {
    branch: BranchWithRole;
    onSelect: (branch: BranchWithRole) => void;
}) => {
    const config = useMemo(() => roleConfig.branch_manager, []);
    const RoleIcon = config.icon;

    const handleSelect = useCallback(() => {
        onSelect(branch);
    }, [onSelect, branch]);

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
                    onClick={handleSelect}
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
});
AssignedBranchCard.displayName = 'AssignedBranchCard';

/**
 * LMS Entry Page Component - OPTIMIZED
 */
export default function LMSEntryPage() {
    const router = useRouter();
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ownedCenters, setOwnedCenters] = useState<CoachingCenterWithBranches[]>([]);
    const [assignedBranches, setAssignedBranches] = useState<BranchWithRole[]>([]);

    /**
     * Fetch user's coaching centers and assigned branches - MEMOIZED
     */
    const fetchData = useCallback(async () => {
        setIsDataLoading(true);
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

            // Process branches in a single pass
            for (const branch of branches) {
                if (branch.role === 'owner' || branch.role === 'center_manager') {
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
                    assignedBranchList.push(branch);
                }
            }

            const ownedCentersList = Array.from(centersMap.values());
            setOwnedCenters(ownedCentersList);
            setAssignedBranches(assignedBranchList);

            // Auto-redirect if only one option
            const totalOwnedCenters = ownedCentersList.length;
            const totalAssignedBranches = assignedBranchList.length;

            if (totalOwnedCenters === 1 && totalAssignedBranches === 0) {
                router.push('/lms/coach');
            } else if (totalOwnedCenters === 0 && totalAssignedBranches === 1) {
                router.push(`/lms/manager/branches/${assignedBranchList[0].id}/dashboard`);
            }
        } catch (err) {
            console.error('[LMSEntry] Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsDataLoading(false);
        }
    }, [router]);

    // Initial data fetch on mount
    useEffect(() => {
        const initializePage = async () => {
            await fetchData();
            setIsPageLoading(false);
        };

        initializePage();
    }, [fetchData]);

    /**
     * Stable navigation handlers - MEMOIZED
     */
    const handleSelectCoachingCenter = useCallback((center: CoachingCenterWithBranches) => {
        router.push('/lms/coach');
    }, [router]);

    const handleSelectAssignedBranch = useCallback((branch: BranchWithRole) => {
        router.push(`/lms/manager/branches/${branch.id}/dashboard`);
    }, [router]);

    const handleNotificationClick = useCallback(() => {
        router.push('/notifications');
    }, [router]);

    const handleCreateCenter = useCallback(() => {
        router.push('/coaching/create');
    }, [router]);

    const handleGoToDashboard = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    /**
     * Computed values - MEMOIZED
     */
    const hasNoAccess = useMemo(
        () => ownedCenters.length === 0 && assignedBranches.length === 0,
        [ownedCenters.length, assignedBranches.length]
    );

    const showSeparator = useMemo(
        () => ownedCenters.length > 0 && assignedBranches.length > 0,
        [ownedCenters.length, assignedBranches.length]
    );

    // ========================================
    // RENDER CONDITIONS
    // ========================================

    // Initial page loading state
    if (isPageLoading) {
        return (
            <LoadingSpinner
                title="Loading LMS"
                message="Setting up your learning management system..."
                size="lg"
                variant="primary"
                fullscreen
            />
        );
    }

    // Data loading state
    if (isDataLoading) {
        return (
            <>
                <LMSEntryHeader />
                <LMSDataSkeleton />
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                <LMSEntryHeader />
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
            </>
        );
    }

    // No access state
    if (hasNoAccess) {
        return (
            <>
                <LMSEntryHeader />
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
                                <Button onClick={handleCreateCenter}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Create Coaching Center
                                </Button>
                                <Button variant="outline" onClick={handleGoToDashboard}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Main content
    return (
        <>
            <LMSEntryHeader
                notificationCount={0}
                onNotificationClick={handleNotificationClick}
            />
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-8 p-6">
                    {/* Page Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Learning Management System</h1>
                        <p className="text-muted-foreground">
                            Select a coaching center or branch to manage
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
                    {showSeparator && <Separator className="my-8" />}

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
        </>
    );
}
