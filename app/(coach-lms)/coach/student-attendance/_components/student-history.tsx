'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, Award } from 'lucide-react';
import {
    useAttendanceRecords,
    useAttendanceSummary,
    useAttendanceActions,
    useAttendanceLoading,
    formatAttendanceDate,
    formatAttendanceStatus,
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
    AttendanceStatus,
} from '@/lib/branch-system/student-attendance';

export default function StudentHistory() {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'term' | 'all'>('month');

    const records = useAttendanceRecords();
    const summary = useAttendanceSummary();
    const loading = useAttendanceLoading();
    const { fetchStudentAttendance, fetchStudentSummary } = useAttendanceActions();

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentAttendance(selectedStudent);
            fetchStudentSummary(selectedStudent);
        }
    }, [selectedStudent, fetchStudentAttendance, fetchStudentSummary]);

    if (loading.list && !records.length) {
        return <HistorySkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Student Selector */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Enter Student ID to view history..."
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="max-w-md"
                    />
                </div>
                <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="term">This Term</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Attendance Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-3xl font-bold">
                                    {summary.attendance_percentage.toFixed(1)}%
                                </div>
                                <Progress value={summary.attendance_percentage} className="h-2" />
                                <Badge
                                    variant={
                                        getAttendancePerformanceColor(summary.attendance_percentage) === 'green'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {getAttendancePerformanceLevel(summary.attendance_percentage)}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{summary.total_days}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.present_days} present
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Absences
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{summary.absent_days}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.excused_days} excused
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Late Arrivals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{summary.late_days}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Avg: {summary.average_late_minutes.toFixed(1)}m
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Performance Insights */}
            {summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Performance Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                                {summary.attendance_percentage >= 95 ? (
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-8 h-8 text-red-600" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">Attendance Trend</p>
                                    <p className="text-xs text-muted-foreground">
                                        {summary.attendance_percentage >= 95 ? 'Excellent' : 'Needs Improvement'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <Calendar className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium">Consistency</p>
                                    <p className="text-xs text-muted-foreground">
                                        {summary.late_days <= 2 ? 'Very Consistent' : 'Irregular'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <Award className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium">Overall Rating</p>
                                    <p className="text-xs text-muted-foreground">
                                        {getAttendancePerformanceLevel(summary.attendance_percentage)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance History */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {records.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No attendance records found</p>
                                    <p className="text-sm mt-1">Enter a student ID to view their history</p>
                                </div>
                            ) : (
                                records.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">
                                                    {formatAttendanceDate(record.attendance_date, 'long')}
                                                </p>
                                                {record.teacher_remarks && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {record.teacher_remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                record.attendance_status === AttendanceStatus.PRESENT
                                                    ? 'default'
                                                    : record.attendance_status === AttendanceStatus.ABSENT
                                                        ? 'destructive'
                                                        : 'secondary'
                                            }
                                        >
                                            {formatAttendanceStatus(record.attendance_status, true)}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

function HistorySkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1 max-w-md" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-9 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
