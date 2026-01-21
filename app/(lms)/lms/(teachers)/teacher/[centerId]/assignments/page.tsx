/**
 * Teacher Assignments & Quizzes Page
 * 
 * Main page for teachers to manage their assignments and quizzes
 * Route: /lms/teacher/[centerId]/assignments
 * 
 * Features:
 * - Tab-based navigation between Assignments and Quizzes
 * - Smooth slide/fade animations between tabs
 * - View all assignments/quizzes for teacher's classes
 * - Create, edit, publish, close items
 * - View submissions and grade students
 * - Mobile-friendly responsive design
 */

'use client';

import { useState } from 'react';
import { useTeacherContext } from '../layout';
import { TeacherAssignmentsDashboard } from '../_components/assignments';
import { TeacherQuizzesDashboard } from '../_components/qizes';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';
import { cn } from '@/lib/utils';

type TabValue = 'assignments' | 'quizzes';

export default function TeacherAssignmentsPage() {
    const { coachingCenter, isLoading, error, centerId } = useTeacherContext();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<TabValue>('assignments');

    // Loading state
    if (isLoading || !userId) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error || !coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Coaching center not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
                className="w-full"
            >
                {/* Shadcn TabsList styled similar to network client */}
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-white p-1 rounded-lg shadow-sm border border-border h-auto">
                    <TabsTrigger
                        value="assignments"
                        className={cn(
                            "py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200",
                            "data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white data-[state=active]:shadow-sm",
                            "data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#111827]",
                            "data-[state=inactive]:bg-transparent"
                        )}
                    >
                        <span className="hidden sm:inline">Assignments</span>
                        <span className="sm:hidden">Assign.</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="quizzes"
                        className={cn(
                            "py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200",
                            "data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white data-[state=active]:shadow-sm",
                            "data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#111827]",
                            "data-[state=inactive]:bg-transparent"
                        )}
                    >
                        Quizzes
                    </TabsTrigger>
                </TabsList>

                {/* Animated content with absolute positioning */}
                <div className="relative min-h-[400px] mt-6">
                    {/* Assignments Tab with Animation */}
                    <div
                        className={cn(
                            "absolute inset-0 transition-all duration-300 ease-in-out",
                            activeTab === 'assignments'
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 translate-x-4 pointer-events-none'
                        )}
                    >
                        <TeacherAssignmentsDashboard
                            centerId={centerId}
                            teacherId={userId}
                            userRole="teacher"
                        />
                    </div>

                    {/* Quizzes Tab with Animation */}
                    <div
                        className={cn(
                            "absolute inset-0 transition-all duration-300 ease-in-out",
                            activeTab === 'quizzes'
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 -translate-x-4 pointer-events-none'
                        )}
                    >
                        <TeacherQuizzesDashboard
                            centerId={centerId}
                            teacherId={userId}
                            userRole="teacher"
                        />
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
