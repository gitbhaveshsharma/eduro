/**
 * Coach Dashboard Page
 * 
 * Main dashboard for coaching center owners/managers
 * Shows coaching center overview, branch information, and quick stats
 * 
 * OPTIMIZATION: Uses useCoachContext() from layout for coaching center data.
 * Only fetches branches and stats, not the coaching center itself.
 */

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Building2,
    MapPin,
    Users,
    BookOpen,
    Calendar,
    DollarSign,
    Phone,
    Mail,
    Globe,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { useCoachContext } from './layout';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingBranch } from '@/lib/schema/coaching.types';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeBranches: number;
    pendingFees: number;
    attendanceRate: number;
}

export default function CoachDashboardPage() {
    const router = useRouter();
    const { coachingCenter, coachingCenterId, isLoading: contextLoading } = useCoachContext();

    const [branches, setBranches] = useState<CoachingBranch[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref to track if we've already fetched for this center
    const fetchedForCenterRef = useRef<string | null>(null);

    /**
     * Fetch branches and stats for the coaching center - ONLY ONCE per center
     */
    useEffect(() => {
        if (!coachingCenterId) return;

        // Prevent duplicate fetches
        if (fetchedForCenterRef.current === coachingCenterId) {
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch branches
                const branchesResult = await CoachingAPI.getBranchesByCenter(coachingCenterId);
                if (branchesResult.success && branchesResult.data) {
                    setBranches(branchesResult.data);
                    setStats({
                        totalStudents: 0,
                        totalTeachers: 0,
                        totalClasses: 0,
                        activeBranches: branchesResult.data.filter((b: CoachingBranch) => b.is_active).length,
                        pendingFees: 0,
                        attendanceRate: 0,
                    });
                }
                fetchedForCenterRef.current = coachingCenterId;
            } catch (err) {
                console.error('[CoachDashboard] Error fetching dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [coachingCenterId]);

    // Loading state
    if (contextLoading || (isLoading && !stats)) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-lg" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!coachingCenter) {
        return null;
    }

    const activeBranches = branches.filter(b => b.is_active);
    const mainBranch = branches.find(b => b.is_main_branch);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to your coaching center management dashboard
                </p>
            </div>

            {/* Coaching Center Info Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {coachingCenter.logo_url ? (
                                <img
                                    src={coachingCenter.logo_url}
                                    alt={coachingCenter.name}
                                    className="h-16 w-16 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-primary" />
                                </div>
                            )}
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {coachingCenter.name}
                                    {coachingCenter.is_verified && (
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                    )}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {coachingCenter.description || 'No description provided'}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {coachingCenter.is_verified && (
                                <Badge variant="secondary">Verified</Badge>
                            )}
                            {coachingCenter.is_featured && (
                                <Badge variant="default">Featured</Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Contact Info */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                            {coachingCenter.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{coachingCenter.phone}</span>
                                </div>
                            )}
                            {coachingCenter.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{coachingCenter.email}</span>
                                </div>
                            )}
                            {coachingCenter.website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={coachingCenter.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {coachingCenter.website}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Category & Subjects */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                            <Badge variant="outline">{coachingCenter.category?.replace(/_/g, ' ')}</Badge>
                            {coachingCenter.subjects && coachingCenter.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {coachingCenter.subjects.slice(0, 3).map((subject, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {subject}
                                        </Badge>
                                    ))}
                                    {coachingCenter.subjects.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{coachingCenter.subjects.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Established */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Established</h4>
                            <p className="text-sm">
                                {coachingCenter.established_year || 'Not specified'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/lms/coach/branch-students')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Branches</p>
                                <p className="text-2xl font-bold">{stats?.activeBranches || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/lms/coach/branch-classes')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                                <p className="text-2xl font-bold">{stats?.totalClasses || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/lms/coach/student-fees')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Fees</p>
                                <p className="text-2xl font-bold">₹{stats?.pendingFees || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Branches Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Branches</h2>
                    <Badge variant="success">{branches.length} Total</Badge>
                </div>

                {branches.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No branches found</p>
                            <Button className="mt-4" variant="outline">
                                Add Branch
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {branches.map((branch) => (
                            <Card key={branch.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${branch.is_main_branch ? 'bg-primary/10' : 'bg-green-100'}`}>
                                                <MapPin className={`h-4 w-4 ${branch.is_main_branch ? 'text-primary' : 'text-green-600'}`} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{branch.name}</CardTitle>
                                                {branch.is_main_branch && (
                                                    <Badge variant="secondary" className="text-xs mt-1">Main Branch</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {branch.description || 'No description'}
                                    </p>
                                    {(branch.phone || branch.email) && (
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            {branch.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            )}
                                            {branch.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{branch.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => router.push('/lms/coach/branch-students')}
                    >
                        <Users className="h-6 w-6" />
                        <span>Manage Students</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => router.push('/lms/coach/branch-classes')}
                    >
                        <BookOpen className="h-6 w-6" />
                        <span>Manage Classes</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => router.push('/lms/coach/student-attendance')}
                    >
                        <Calendar className="h-6 w-6" />
                        <span>Track Attendance</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => router.push('/lms/coach/student-fees')}
                    >
                        <DollarSign className="h-6 w-6" />
                        <span>Collect Fees</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
