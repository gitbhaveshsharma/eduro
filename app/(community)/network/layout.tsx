'use client';

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConditionalLayout } from "@/components/layout";
import { NetworkFilterContext } from './network-context';
import type { NetworkFilterContextType } from './network-context';

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();

    // Initialize filter state from URL params (for navigation from other pages)
    const initialQuery = searchParams?.get('q') ?? '';
    const initialRole = searchParams?.get('role') ?? 'all';
    const initialSort = searchParams?.get('sort') ?? 'created_at:desc';

    // Shared filter state - managed at layout level so header can access it
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedRole, setSelectedRole] = useState(initialRole);
    const [selectedSort, setSelectedSort] = useState(initialSort);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Sync with URL params when they change (e.g., user navigates with search query)
    useEffect(() => {
        if (!searchParams) return;

        const q = searchParams.get('q');
        const role = searchParams.get('role');
        const sort = searchParams.get('sort');

        if (q !== null && q !== searchQuery) {
            console.log('🟣 NetworkLayout - Syncing search from URL:', q);
            setSearchQuery(q);
        }
        if (role !== null && role !== selectedRole) {
            console.log('🟣 NetworkLayout - Syncing role from URL:', role);
            setSelectedRole(role);
        }
        if (sort !== null && sort !== selectedSort) {
            console.log('🟣 NetworkLayout - Syncing sort from URL:', sort);
            setSelectedSort(sort);
        }
    }, [searchParams]);

    // ✅ Memoize ALL callbacks with useCallback
    const onSearchChange = useCallback((value: string) => {
        console.log('🟣 NetworkLayout - Search changing to:', value);
        setSearchQuery(value);
    }, []);

    const onRoleChange = useCallback((value: string) => {
        console.log('🟣 NetworkLayout - Role changing to', value);
        setSelectedRole(value);
    }, []);

    const onSortChange = useCallback((value: string) => {
        console.log('🟣 NetworkLayout - Sort changing to:', value);
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
