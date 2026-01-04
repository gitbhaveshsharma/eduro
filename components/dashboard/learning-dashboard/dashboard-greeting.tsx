/**
 * Dashboard Greeting Header Component
 * Shows personalized greeting with time of day and AI button
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { Profile } from '@/lib/schema/profile.types';

interface DashboardGreetingProps {
    profile: Profile | null;
    onAskAI?: () => void;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

export function DashboardGreeting({ profile, onAskAI }: DashboardGreetingProps) {
    const [greeting, setGreeting] = useState('Hello');
    const firstName = profile?.full_name?.split(' ')[0] || 'there';

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    return (
        <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-highlight tracking-tight">
                {greeting}, {firstName} 👋
            </h1>

            <Button
                onClick={onAskAI}
                className="border-brand-highlight/30 bg-brand-highlight/5 hover:bg-brand-highlight hover:text-white shadow-sm gap-2 rounded-full px-5 py-2.5 h-auto transition-all"
                variant="outline"
            >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Ask AI</span>
            </Button>
        </div>
    );
}
