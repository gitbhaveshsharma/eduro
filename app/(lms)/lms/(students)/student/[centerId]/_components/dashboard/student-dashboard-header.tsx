'use client';

import { GraduationCap, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CoachingCenter } from '@/lib/schema/coaching.types';

interface StudentDashboardHeaderProps {
    coachingCenter: CoachingCenter;
    studentName?: string;
    isRefreshing?: boolean;
    onRefresh?: () => void;
    lastUpdated?: Date | null;
}

export function StudentDashboardHeader({
    coachingCenter,
    studentName,
    isRefreshing = false,
    onRefresh,
    lastUpdated
}: StudentDashboardHeaderProps) {
    const formattedTime = lastUpdated
        ? lastUpdated.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        : null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-8 shadow-sm">
            {/* 🎨 Background Illustration Layer (Matching Teacher Portal) */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[150%] rounded-full bg-[radial-gradient(circle,var(--color-brand-primary)_0%,transparent_70%)] opacity-10 blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[100%] rounded-full bg-[radial-gradient(circle,var(--color-brand-secondary)_0%,transparent_70%)] opacity-15 blur-3xl" />

                {/* Abstract Geometric Circles */}
                <svg
                    className="absolute top-0 right-0 h-full w-auto text-brand-secondary/10"
                    viewBox="0 0 400 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="400" cy="400" r="160" stroke="currentColor" strokeWidth="2" strokeDasharray="12 12" />
                    <circle cx="400" cy="400" r="220" stroke="currentColor" strokeWidth="1" />
                    <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* ✍️ Content Layer */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-5 lg:flex-1">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-brand-primary dark:text-foreground">
                            {coachingCenter.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            {/* Subtle accent line using Highlight color */}
                            <div className="h-1 w-12 rounded-full bg-brand-highlight" />
                            <p className="text-base md:text-lg font-medium text-muted-foreground">
                                Student Portal
                            </p>
                        </div>

                        <p className="max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
                            {studentName ? `Welcome back, ${studentName}! ` : 'Welcome to your dashboard. '}
                            Access your courses, track your performance, and stay updated with your learning journey.
                        </p>
                    </div>
                </div>

                {/* Action Controls
                <div className="flex flex-col sm:flex-row items-start lg:items-end flex-wrap gap-3 shrink-0">
                    {onRefresh && (
                        <div className="flex flex-col sm:items-end gap-1.5">
                            {formattedTime && (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 ml-1">
                                    Last synced: {formattedTime}
                                </span>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="bg-background/50 backdrop-blur-sm hover:bg-background gap-2 border-border/60"
                            >
                                <RefreshCw className={cn(
                                    'h-3.5 w-3.5 transition-transform',
                                    isRefreshing && 'animate-spin'
                                )} />
                                <span>{isRefreshing ? 'Updating...' : 'Refresh Data'}</span>
                            </Button>
                        </div>
                    )}
                </div> */}
            </div>
        </div>
    );
}