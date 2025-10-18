'use client';

import React, { useState } from "react";
import { ConditionalLayout } from "@/components/layout";
import { NetworkFilterContext } from './network-context';
import type { NetworkFilterContextType } from './network-context';

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    // Shared filter state - managed at layout level so header can access it
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedSort, setSelectedSort] = useState('created_at:desc');
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate active filters count
    const activeFiltersCount = [
        showVerifiedOnly,
        showOnlineOnly,
        selectedRole !== 'all',
        searchQuery !== '',
    ].filter(Boolean).length;

    const handleAdvancedFiltersClick = () => {
        // TODO: Open advanced filters modal/sheet
        console.log('Open advanced filters');
    };

    // Context value
    const filterContextValue: NetworkFilterContextType = {
        searchQuery,
        onSearchChange: (value) => {
            setSearchQuery(value);
        },
        selectedRole,
        onRoleChange: (value) => {
            setSelectedRole(value);
        },
        selectedSort,
        onSortChange: (value) => {
            setSelectedSort(value);
        },
        showVerifiedOnly,
        onVerifiedToggle: () => {
            setShowVerifiedOnly(!showVerifiedOnly);
        },
        showOnlineOnly,
        onOnlineToggle: () => {
            setShowOnlineOnly(!showOnlineOnly);
        },
        totalCount,
        isLoading,
        activeFiltersCount,
        onAdvancedFiltersClick: handleAdvancedFiltersClick,
        // Export setters so page can update these
        setTotalCount,
        setIsLoading,
    };

    return (
        <NetworkFilterContext.Provider value={filterContextValue}  >
            <ConditionalLayout platform="community" forceConfig={{ page: 'network', headerType: 'network', bottomNavType: 'network' }}>
                {children}
            </ConditionalLayout>
        </NetworkFilterContext.Provider>
    );
}
