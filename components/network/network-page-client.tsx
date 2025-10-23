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

    // Log the initial profiles we received
    React.useEffect(() => {
        console.log('🔷 NetworkPageClient - Received initial profiles:', {
            count: initialProfiles?.length || 0,
            hasProfiles: (initialProfiles?.length || 0) > 0,
        });
    }, [initialProfiles]);

    React.useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filters = useNetworkFilters();

    // Map context to props expected by NetworkDiscovery
    const externalSearchQuery = filters?.searchQuery ?? '';
    const externalSelectedRole = filters?.selectedRole ?? 'all';
    const externalSelectedSort = filters?.selectedSort ?? 'created_at:desc';
    const externalShowVerifiedOnly = filters?.showVerifiedOnly ?? false;
    const externalShowOnlineOnly = filters?.showOnlineOnly ?? false;

    const handleTotalCountChange = (count: number) => {
        filters?.setTotalCount?.(count);
    };

    const handleLoadingChange = (loading: boolean) => {
        filters?.setIsLoading?.(loading);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-7xl mx-auto sm:py-6 lg:py-8 px-4 sm:px-6 space-y-4 sm:space-y-6">
                <div className={cn("transition-all duration-300", isSticky && "sticky top-15 z-40 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6")}>
                    {/* Updated Tab System */}
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-border max-w-md">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'discover'
                                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                                    : 'text-[#6B7280] hover:text-[#111827]'
                                }`}
                        >
                            Discover
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'suggestions'
                                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                                    : 'text-[#6B7280] hover:text-[#111827]'
                                }`}
                        >
                            Suggestions
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[400px]">
                    {/* Discover Tab with Animation */}
                    <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${activeTab === 'discover'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-4 pointer-events-none'
                        }`}>
                        <NetworkDiscovery
                            initialProfiles={initialProfiles}
                            searchQuery={externalSearchQuery}
                            selectedRole={externalSelectedRole}
                            selectedSort={externalSelectedSort}
                            showVerifiedOnly={externalShowVerifiedOnly}
                            showOnlineOnly={externalShowOnlineOnly}
                            onTotalCountChange={handleTotalCountChange}
                            onLoadingChange={handleLoadingChange}
                        />
                    </div>

                    {/* Suggestions Tab with Animation */}
                    <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${activeTab === 'suggestions'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-4 pointer-events-none'
                        }`}>
                        <Suspense fallback={<LoadingSpinner message="Loading suggestions..." />}>
                            <ConnectionSuggestions />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}