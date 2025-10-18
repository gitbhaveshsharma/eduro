'use client';

/**
 * Network Page - Redesigned with Smooth Tab Transitions
 * 
 * Main page for discovering and connecting with users.
 * Fully responsive and optimized for web view in mobile apps.
 * 
 * Filter state is managed in the layout so the header can access it
 */

import { useState, useEffect } from 'react';
import { Users, Search, Sparkles } from 'lucide-react';
import { ConnectionSuggestions } from '@/components/connections';
import { NetworkDiscovery } from '@/components/network/network-discovery';
import { useNetworkFilters } from './network-context';
import { cn } from '@/lib/utils';

type NetworkTab = 'discover' | 'suggestions';

export default function NetworkPage() {
    const [activeTab, setActiveTab] = useState<NetworkTab>('discover');
    const [isSticky, setIsSticky] = useState(false);

    // Get filter state from context (managed in layout)
    const filters = useNetworkFilters();

    // Handle scroll for sticky tabs
    useEffect(() => {
        const handleScroll = () => {
            // Show sticky when scrolled down more than 50px
            const showSticky = window.scrollY > 50;
            setIsSticky(showSticky);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!filters) {
        return <div>Loading...</div>;
    }

    const {
        searchQuery,
        selectedRole,
        selectedSort,
        showVerifiedOnly,
        showOnlineOnly,
        setTotalCount,
        setIsLoading,
    } = filters;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-7xl mx-auto sm:py-6 lg:py-8 px-4 sm:px-6 space-y-4 sm:space-y-6">
                {/* Sticky Tab Navigation - Same design always */}
                <div className={cn(
                    "transition-all duration-300",
                    isSticky && "sticky top-15 z-40 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 "
                )}>
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-border max-w-md">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'discover'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Discover</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'suggestions'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Suggestions</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content with Smooth Transitions */}
                <div className="relative min-h-[400px]">
                    {/* Discover Tab */}
                    <div
                        className={`transition-all duration-300 ease-in-out ${activeTab === 'discover'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-4 pointer-events-none absolute inset-0'
                            }`}
                    >
                        <NetworkDiscovery
                            searchQuery={searchQuery}
                            selectedRole={selectedRole}
                            selectedSort={selectedSort}
                            showVerifiedOnly={showVerifiedOnly}
                            showOnlineOnly={showOnlineOnly}
                            onTotalCountChange={setTotalCount}
                            onLoadingChange={setIsLoading}
                        />
                    </div>

                    {/* Suggestions Tab */}
                    <div
                        className={`transition-all duration-300 ease-in-out ${activeTab === 'suggestions'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-4 pointer-events-none absolute inset-0'
                            }`}
                    >
                        <ConnectionSuggestions />
                    </div>
                </div>
            </div>
        </div>
    );
}