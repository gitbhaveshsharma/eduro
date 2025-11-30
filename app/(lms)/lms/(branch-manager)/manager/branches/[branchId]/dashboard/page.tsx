/**
 * Branch Manager - Branch Dashboard Page
 * 
 * Dashboard view for a specific branch showing:
 * - Student enrollment statistics
 * - Attendance overview
 * - Payment status
 * - Recent activity
 */

'use client';

import { useEffect } from 'react';
import { useBranchContext } from '../layout';
import { BranchStudentsDashboard } from '@/app/(lms)/lms/_components/branch-students/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MapPin,
    Building2,
    Phone,
    Mail,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

export default function BranchDashboardPage() {
    const { branch, coachingCenter, isLoading } = useBranchContext();
    const { fetchBranchStudents } = useBranchStudentsStore();

    // Fetch students for this specific branch
    useEffect(() => {
        if (branch?.id) {
            fetchBranchStudents(branch.id);
        }
    }, [branch?.id, fetchBranchStudents]);

    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Branch Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Overview and analytics for {branch.name}
                </p>
            </div>

            {/* Branch Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {branch.name}
                                    {branch.is_main_branch && (
                                        <Badge variant="secondary">Main Branch</Badge>
                                    )}
                                    {branch.is_active && (
                                        <Badge variant="default" className="bg-green-500">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-4 w-4" />
                                    {coachingCenter?.name}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {branch.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{branch.phone}</span>
                            </div>
                        )}
                        {branch.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{branch.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Created {new Date(branch.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    {branch.description && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            {branch.description}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Students Dashboard - uses branchId for single branch data */}
            <BranchStudentsDashboard branchId={branch.id} />
        </div>
    );
}
