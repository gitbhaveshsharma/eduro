/**
 * Branch Manager - Branch Attendance Page
 * 
 * Track and manage student attendance for a specific branch
 * TODO: Implement attendance tracking functionality
 */

'use client';

import { useBranchContext } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Construction } from 'lucide-react';

export default function BranchAttendancePage() {
    const { branch, isLoading } = useBranchContext();

    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Branch Attendance</h1>
                <p className="text-muted-foreground mt-1">
                    Track student attendance for {branch.name}
                </p>
            </div>

            {/* Coming Soon Card */}
            <Card className="border-dashed">
                <CardHeader className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Construction className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        Attendance tracking for this branch is under development.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                        You will be able to mark daily attendance, view attendance reports,
                        and track student participation.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
