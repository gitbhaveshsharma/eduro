'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import {
    useDailyAttendanceRecords,
    useAttendanceLoading,
    useDailyAttendanceStats,
    useClassAttendanceReport,
    useFetchCoachingCenterDailyAttendance,
    useFetchBranchDailyAttendance,
    useFetchClassReport,
    AttendanceStatus,
    formatAttendanceDate,
    getAttendancePerformanceColor,
    getAttendancePerformanceLevel,
} from '@/lib/branch-system/student-attendance';
import { showErrorToast } from '@/lib/toast';

/**
 * Dashboard Props
 * For coach view: pass coachingCenterId
 * For branch manager view: pass branchId
 */
interface DashboardProps {
    coachingCenterId?: string;
    branchId?: string;
}

export default function Dashboard({ coachingCenterId, branchId }: DashboardProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [debugInfo, setDebugInfo] = useState<{
        fetchType: 'coaching' | 'branch' | 'none';
        lastFetch: string | null;
        dataSource: string;
    }>({ fetchType: 'none', lastFetch: null, dataSource: '' });

    // Track if we've already fetched for this date/id combo
    const lastFetchRef = useRef<string | null>(null);

    // Use individual stable hooks instead of useAttendanceActions
    const dailyRecords = useDailyAttendanceRecords();
    const loading = useAttendanceLoading();
    const stats = useDailyAttendanceStats();
    const classReport = useClassAttendanceReport();

    const fetchCoachingCenterDailyAttendance = useFetchCoachingCenterDailyAttendance();
    const fetchBranchDailyAttendance = useFetchBranchDailyAttendance();
    const fetchClassReport = useFetchClassReport();

    // Determine which fetch function to use based on context
    const isCoachView = !!coachingCenterId && !branchId;
    const isBranchView = !!branchId;

    // Log data whenever it changes
    useEffect(() => {
        console.group('📊 Dashboard Data Log');
        console.log('🔍 Current Context:', {
            coachingCenterId,
            branchId,
            isCoachView,
            isBranchView
        });

        console.log('📈 Daily Records:', {
            count: dailyRecords.length,
            records: dailyRecords,
            sample: dailyRecords.length > 0 ? dailyRecords[0] : 'No records'
        });

        console.log('📊 Stats:', stats);
        console.log('🏫 Class Report:', classReport);
        console.log('⏳ Loading States:', loading);
        console.groupEnd();
    }, [dailyRecords, stats, classReport, loading, coachingCenterId, branchId]);

    useEffect(() => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const fetchKey = `${isCoachView ? coachingCenterId : branchId}-${dateString}`;

        // Prevent duplicate fetches
        if (lastFetchRef.current === fetchKey) {
            return;
        }

        const fetchAttendance = async () => {
            try {
                if (isCoachView && coachingCenterId) {
                    console.group('🎯 Fetching Coaching Center Data');
                    console.log('📅 Date:', dateString);
                    console.log('🏢 Coaching Center ID:', coachingCenterId);
                    console.log('🔄 Fetch Key:', fetchKey);

                    const result = await fetchCoachingCenterDailyAttendance(coachingCenterId, dateString);

                    console.log('✅ Fetch Result:', result);
                    console.log('📊 Records after fetch:', dailyRecords.length);
                    console.log('📈 Stats after fetch:', stats);
                    console.groupEnd();

                    lastFetchRef.current = fetchKey;
                    setDebugInfo({
                        fetchType: 'coaching',
                        lastFetch: fetchKey,
                        dataSource: `coaching-center-${coachingCenterId}`
                    });

                } else if (isBranchView && branchId) {
                    console.group('🏢 Fetching Branch Data');
                    console.log('📅 Date:', dateString);
                    console.log('🏢 Branch ID:', branchId);
                    console.log('🔄 Fetch Key:', fetchKey);

                    const result = await fetchBranchDailyAttendance(branchId, dateString);

                    console.log('✅ Fetch Result:', result);
                    console.log('📊 Records after fetch:', dailyRecords.length);
                    console.log('📈 Stats after fetch:', stats);
                    console.groupEnd();

                    lastFetchRef.current = fetchKey;
                    setDebugInfo({
                        fetchType: 'branch',
                        lastFetch: fetchKey,
                        dataSource: `branch-${branchId}`
                    });
                }
            } catch (error) {
                console.error('❌ Fetch Error:', error);
                showErrorToast('Failed to fetch attendance data');
                console.error('[Dashboard] Fetch error:', error);
            }
        };

        if (coachingCenterId || branchId) {
            console.log('🚀 Triggering fetch for:', {
                date: dateString,
                coachingCenterId,
                branchId,
                previousFetchKey: lastFetchRef.current
            });
            fetchAttendance();
        } else {
            console.warn('⚠️ No ID provided for fetch - both coachingCenterId and branchId are undefined');
        }
    }, [selectedDate, coachingCenterId, branchId, isCoachView, isBranchView, fetchCoachingCenterDailyAttendance, fetchBranchDailyAttendance]);

    // Calculate attendance rate
    const attendanceRate = stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0;

    const performanceColor = getAttendancePerformanceColor(attendanceRate);

    // Show message if no context available
    if (!coachingCenterId && !branchId) {
        console.warn('❌ No context provided to Dashboard component');
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        Unable to load attendance data. Please ensure you have access to a coaching center or branch.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Debug panel (can be removed in production)
    const showDebugPanel = process.env.NODE_ENV === 'development';
    if (showDebugPanel) {
        console.log('🔧 Debug Info:', debugInfo);
    }

    if (loading.daily && dailyRecords.length === 0) {
        console.log('⏳ Showing skeleton loader');
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Debug Panel (Development Only) */}
            {showDebugPanel && (
                <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Debug Information
                                </h3>
                                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                                    <p>Fetch Type: <Badge variant="outline">{debugInfo.fetchType}</Badge></p>
                                    <p>Data Source: {debugInfo.dataSource || 'None'}</p>
                                    <p>Records: {dailyRecords.length}</p>
                                    <p>Stats: {JSON.stringify(stats)}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    console.log('🔄 Manual Refresh Triggered');
                                    console.log('Current State:', {
                                        dailyRecords,
                                        stats,
                                        classReport,
                                        debugInfo
                                    });
                                }}
                            >
                                Refresh Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Date Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">
                        {formatAttendanceDate(format(selectedDate, 'yyyy-MM-dd'), 'full')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Overview of today's attendance statistics
                        {debugInfo.dataSource && (
                            <span className="ml-2 text-xs text-blue-600">
                                ({debugInfo.dataSource})
                            </span>
                        )}
                    </p>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            {format(selectedDate, 'MMM dd, yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                                if (date) {
                                    console.log('📅 Date changed to:', date);
                                    setSelectedDate(date);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Students"
                    value={stats.total}
                    icon={Users}
                    description={`${stats.marked} marked, ${stats.unmarked} unmarked`}
                    variant="default"
                />

                <StatCard
                    title="Present"
                    value={stats.present}
                    icon={UserCheck}
                    description={`${attendanceRate}% attendance rate`}
                    variant="success"
                    trend={attendanceRate >= 85 ? 'up' : attendanceRate >= 75 ? 'stable' : 'down'}
                />

                <StatCard
                    title="Absent"
                    value={stats.absent}
                    icon={UserX}
                    description={stats.absent > 0 ? 'Requires attention' : 'No absences'}
                    variant="error"
                />

                <StatCard
                    title="Late Arrivals"
                    value={stats.late}
                    icon={Clock}
                    description={`${stats.excused} excused absences`}
                    variant="warning"
                />
            </div>

            {/* Attendance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Collection Rate Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Attendance Collection</span>
                            <Badge variant={performanceColor === 'green' ? 'default' : performanceColor === 'red' ? 'destructive' : 'secondary'}>
                                {getAttendancePerformanceLevel(attendanceRate)}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Marked Attendance</span>
                                <span className="font-semibold">
                                    {stats.marked} / {stats.total}
                                </span>
                            </div>
                            <Progress
                                value={(stats.marked / stats.total) * 100}
                                className="h-2"
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm">Present</span>
                                </div>
                                <span className="text-sm font-medium">{stats.present}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                    <span className="text-sm">Late</span>
                                </div>
                                <span className="text-sm font-medium">{stats.late}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm">Absent</span>
                                </div>
                                <span className="text-sm font-medium">{stats.absent}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-sm">Excused</span>
                                </div>
                                <span className="text-sm font-medium">{stats.excused}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Class Performance Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Class Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {classReport ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                                        <p className="text-2xl font-bold">{classReport.total_sessions}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {classReport.average_attendance.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Total Records
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {classReport.total_student_records}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Perfect Attendance
                                        </span>
                                        <Badge variant="secondary">
                                            {classReport.students_with_perfect_attendance} students
                                        </Badge>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Overall Health</span>
                                            <span className="font-medium">
                                                {classReport.average_attendance >= 90 ? 'Excellent' :
                                                    classReport.average_attendance >= 75 ? 'Good' : 'Needs Attention'}
                                            </span>
                                        </div>
                                        <Progress
                                            value={classReport.average_attendance}
                                            className="h-2"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                <p>No class data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Unmarked Students Alert */}
            {stats.unmarked > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                                    Unmarked Attendance
                                </h3>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                    {stats.unmarked} student{stats.unmarked > 1 ? 's have' : ' has'} not been marked for attendance today.
                                    Please mark their attendance to complete the daily record.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Absences */}
            {stats.absent > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserX className="w-5 h-5" />
                            Today's Absences
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64">
                            <div className="space-y-3">
                                {dailyRecords
                                    .filter(record => record.attendance_status === AttendanceStatus.ABSENT)
                                    .map((record) => (
                                        <div
                                            key={record.student_id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={AvatarUtils.getSafeAvatarUrl(
                                                            record.student_avatar,
                                                            record.student_name || 'S'
                                                        )}
                                                        alt={record.student_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{record.student_name}</p>
                                                    {record.student_username ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            @{record.student_username}
                                                            {record.class_name && ` • ${record.class_name}`}
                                                        </p>
                                                    ) : record.teacher_remarks ? (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {record.teacher_remarks}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {record.branch_name && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {record.branch_name}
                                                    </Badge>
                                                )}
                                                <Badge variant="destructive">Absent</Badge>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    description: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    trend?: 'up' | 'down' | 'stable';
}

function StatCard({ title, value, icon: Icon, description, variant = 'default', trend }: StatCardProps) {
    const variantStyles = {
        default: 'text-blue-600 dark:text-blue-400',
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-orange-600 dark:text-orange-400',
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${variantStyles[variant]}`} />
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{value}</div>
                    {TrendIcon && (
                        <TrendIcon className={`w-4 h-4 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

// Dashboard Skeleton
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-9 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}