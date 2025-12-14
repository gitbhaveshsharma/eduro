'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Users,
    BookOpen,
    DollarSign,
    Calendar,
    MapPin,
    GraduationCap,
    Star,
    CheckCircle2
} from 'lucide-react';
import { StatCard } from './stat-card';

interface StatsOverviewProps {
    stats: {
        totalStudents: number;
        totalTeachers: number;
        totalClasses: number;
        activeBranches: number;
        totalBranches: number;
        pendingFees: number;
        attendanceRate: number;
        avgRating: number;
        totalReviews: number;
    };
    onStudentsClick?: () => void;
    onClassesClick?: () => void;
    onFeesClick?: () => void;
    onAttendanceClick?: () => void;
}

export const StatsOverview = memo(({
    stats,
    onStudentsClick,
    onClassesClick,
    onFeesClick,
    onAttendanceClick
}: StatsOverviewProps) => {
    const formattedPendingFees = `₹${stats.pendingFees.toLocaleString('en-IN')}`;
    const formattedAttendanceRate = `${(stats.attendanceRate * 100).toFixed(1)}%`;
    const formattedAvgRating = stats.avgRating.toFixed(1);
    const branchesCountLabel = `${stats.activeBranches}/${stats.totalBranches}`;

    return (
        <>
            {/* Quick Stats - Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    onClick={onStudentsClick}
                />

                <StatCard
                    title="Total Teachers"
                    value={stats.totalTeachers}
                    icon={GraduationCap}
                    iconBgColor="bg-indigo-100"
                    iconColor="text-indigo-600"
                />

                <StatCard
                    title="Total Classes"
                    value={stats.totalClasses}
                    icon={BookOpen}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                    onClick={onClassesClick}
                />

                <StatCard
                    title="Active Branches"
                    value={branchesCountLabel}
                    icon={MapPin}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
            </div>

            {/* Quick Stats - Row 2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Pending Fees"
                    value={formattedPendingFees}
                    icon={DollarSign}
                    iconBgColor="bg-amber-100"
                    iconColor="text-amber-600"
                    onClick={onFeesClick}
                />

                <StatCard
                    title="Attendance Rate"
                    value={formattedAttendanceRate}
                    icon={Calendar}
                    iconBgColor="bg-teal-100"
                    iconColor="text-teal-600"
                    onClick={onAttendanceClick}
                />

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                                <p className="text-2xl font-bold flex items-center gap-1">
                                    {formattedAvgRating}
                                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Star className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <StatCard
                    title="Total Reviews"
                    value={stats.totalReviews}
                    icon={CheckCircle2}
                    iconBgColor="bg-pink-100"
                    iconColor="text-pink-600"
                />
            </div>
        </>
    );
});

StatsOverview.displayName = 'StatsOverview';
