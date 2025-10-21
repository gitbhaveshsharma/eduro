"use client";

import React, { Suspense, lazy } from 'react';
import { Users, Search, Sparkles } from 'lucide-react';
import { NetworkDiscovery } from '@/components/network/network-discovery';
import { useNetworkFilters } from '@/app/(community)/network/network-context';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load the suggestions component
const ConnectionSuggestions = lazy(() =>
  import('@/components/connections').then(module => ({ default: module.ConnectionSuggestions }))
);

// This client component receives `initialProfiles` from the server page and
// hydrates the rest of the interactivity on the client. It delegates fetching
// to NetworkDiscovery which will use the provided initial data.
export default function NetworkPageClient({ initialProfiles }: { initialProfiles?: any[] }) {
    const [activeTab, setActiveTab] = React.useState<'discover' | 'suggestions'>('discover');
    const [isSticky, setIsSticky] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-7xl mx-auto sm:py-6 lg:py-8 px-4 sm:px-6 space-y-4 sm:space-y-6">
                <div className={cn("transition-all duration-300", isSticky && "sticky top-15 z-40 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6")}>
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-border max-w-md">
                        <button onClick={() => setActiveTab('discover')} className="flex-1 py-2.5 px-4">Discover</button>
                        <button onClick={() => setActiveTab('suggestions')} className="flex-1 py-2.5 px-4">Suggestions</button>
                    </div>
                </div>

                <div className="relative min-h-[400px]">
                    <div className={cn("transition-opacity duration-300 ease-in-out", activeTab === 'discover' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none')}>
                        <NetworkDiscovery initialProfiles={initialProfiles} />
                    </div>

                    {activeTab === 'suggestions' && (
                        <Suspense fallback={<LoadingSpinner message="Loading suggestions..." />}>
                            <div className={cn("transition-opacity duration-300 ease-in-out", activeTab === 'suggestions' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none')}>
                                <ConnectionSuggestions />
                            </div>
                        </Suspense>
                    )}
                </div>
            </div>
        </div>
    );
}
