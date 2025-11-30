/**
 * Branch Manager - Branch Selection Page
 * 
 * Entry page for branch managers to select which branch to manage
 * Shows only branches where user is assigned as branch manager (not owner/center manager)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MapPin,
    Building2,
    UserCog,
    ArrowRight,
    AlertCircle,
    ArrowLeft,
    Users
} from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingBranch } from '@/lib/schema/coaching.types';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: {
        id: string;
        name: string;
        owner_id: string;
        manager_id: string | null;
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

export default function BranchSelectionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assignedBranches, setAssignedBranches] = useState<BranchWithRole[]>([]);

    /**
     * Fetch user's assigned branches
     */
    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await CoachingAPI.getAllAccessibleBranches();

            if (!result.success || !result.data) {
                setError(result.error || 'Failed to load branches');
                return;
            }

            // Filter only branches where user is branch manager (not owner/center manager)
            const branchManagerBranches = result.data.branches.filter(
                (b) => b.role === 'branch_manager'
            );

            setAssignedBranches(branchManagerBranches);

            // Auto-redirect if only one branch
            if (branchManagerBranches.length === 1) {
                router.push(`/lms/manager/branches/${branchManagerBranches[0].id}/dashboard`);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    /**
     * Navigate to branch dashboard
     */
    const handleSelectBranch = (branch: BranchWithRole) => {
        router.push(`/lms/manager/branches/${branch.id}/dashboard`);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto space-y-6 p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-56 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-4 mt-4">
                        <Button onClick={fetchBranches}>Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/lms')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to LMS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // No branches state
    if (assignedBranches.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center py-16">
                        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <UserCog className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3">No Assigned Branches</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            You don&apos;t have any branches assigned to you as a branch manager.
                            Contact a coaching center owner to get assigned to a branch.
                        </p>
                        <Button onClick={() => router.push('/lms')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to LMS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-6xl mx-auto space-y-6 p-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/lms')}
                    className="-ml-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to LMS
                </Button>

                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Select Branch</h1>
                    <p className="text-muted-foreground mt-1">
                        Choose a branch to manage its students, classes, and operations.
                    </p>
                </div>

                {/* Branch Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedBranches.map((branch) => (
                        <Card
                            key={branch.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-green-500/20"
                        >
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
                                    <div className="p-1.5 rounded-full bg-green-500 text-white">
                                        <UserCog className="h-3 w-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Branch Manager</p>
                                        <p className="text-xs text-muted-foreground">
                                            You are assigned to manage this branch
                                        </p>
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
                                    onClick={() => handleSelectBranch(branch)}
                                    variant="outline"
                                    className="w-full group-hover:bg-green-50 group-hover:border-green-500 group-hover:text-green-700"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Manage Branch
                                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
