'use client';

import React, { useState, useCallback, useMemo } from "react";
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

    // ✅ Memoize ALL callbacks with useCallback
    const onSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const onRoleChange = useCallback((value: string) => {
        setSelectedRole(value);
    }, []);

    const onSortChange = useCallback((value: string) => {
        setSelectedSort(value);
    }, []);

    const onVerifiedToggle = useCallback(() => {
        setShowVerifiedOnly(prev => !prev);
    }, []);

    const onOnlineToggle = useCallback(() => {
        setShowOnlineOnly(prev => !prev);
    }, []);

    const handleAdvancedFiltersClick = useCallback(() => {
        // TODO: Open advanced filters modal/sheet
        console.log('Open advanced filters');
    }, []);

    // Calculate active filters count - wrap in useMemo if expensive
    const activeFiltersCount = useMemo(() => {
        return [
            showVerifiedOnly,
            showOnlineOnly,
            selectedRole !== 'all',
            searchQuery !== '',
        ].filter(Boolean).length;
    }, [showVerifiedOnly, showOnlineOnly, selectedRole, searchQuery]);

    // ✅ Memoize the entire context value object
    const filterContextValue = useMemo<NetworkFilterContextType>(() => ({
        searchQuery,
        onSearchChange,
        selectedRole,
        onRoleChange,
        selectedSort,
        onSortChange,
        showVerifiedOnly,
        onVerifiedToggle,
        showOnlineOnly,
        onOnlineToggle,
        totalCount,
        isLoading,
        activeFiltersCount,
        onAdvancedFiltersClick: handleAdvancedFiltersClick,
        setTotalCount,
        setIsLoading,
    }), [
        searchQuery,
        onSearchChange,
        selectedRole,
        onRoleChange,
        selectedSort,
        onSortChange,
        showVerifiedOnly,
        onVerifiedToggle,
        showOnlineOnly,
        onOnlineToggle,
        totalCount,
        isLoading,
        activeFiltersCount,
        handleAdvancedFiltersClick,
    ]);

    return (
        <NetworkFilterContext.Provider value={filterContextValue}>
            <ConditionalLayout
                platform="community"
                forceConfig={{
                    page: 'network',
                    headerType: 'network',
                    bottomNavType: 'network'
                }}
            >
                {children}
            </ConditionalLayout>
        </NetworkFilterContext.Provider>
    );
}
