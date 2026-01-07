'use client';

import type { CoachingCenter } from '@/lib/schema/coaching.types';

interface DashboardHeaderProps {
    coachingCenter: CoachingCenter;
}

export function DashboardHeader({ coachingCenter }: DashboardHeaderProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-8 shadow-sm">
            {/* 🎨 Background Illustration Layer */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                {/* Primary Gradient Mesh */}
                <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[150%] rounded-full bg-[radial-gradient(circle,var(--color-brand-secondary)_0%,transparent_70%)] opacity-20 blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[100%] rounded-full bg-[radial-gradient(circle,var(--color-brand-primary)_0%,transparent_70%)] opacity-10 blur-3xl" />

                {/* Abstract Geometric Shapes */}
                <svg
                    className="absolute top-0 right-0 h-full w-auto text-brand-primary/5"
                    viewBox="0 0 400 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="400" cy="0" r="160" stroke="currentColor" strokeWidth="2" strokeDasharray="12 12" />
                    <circle cx="400" cy="0" r="220" stroke="currentColor" strokeWidth="1" />
                    <circle cx="400" cy="0" r="280" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                {/* Highlight Pop (The Orange Color) */}
                <div className="absolute top-10 right-1/4 w-2 h-2 rounded-full bg-brand-highlight opacity-40 animate-pulse" />

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] [mask-image:linear-gradient(to_bottom,white,transparent)]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* ✍️ Content Layer */}
            <div className="relative z-10 flex flex-col gap-2">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-brand-primary dark:text-foreground">
                        {coachingCenter.name}
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Subtle accent line using Highlight color */}
                        <div className="h-1 w-12 rounded-full bg-brand-highlight" />
                        <p className="text-base md:text-lg font-medium text-muted-foreground">
                            Teacher Portal
                        </p>
                    </div>
                </div>

                <p className="max-w-md text-sm md:text-base text-text-secondary leading-relaxed">
                    Manage your classes, track student progress, and organize your teaching schedule from one central dashboard.
                </p>
            </div>
        </div>
    );
}