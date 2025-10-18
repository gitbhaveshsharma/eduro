'use client';

/**
 * Network Filter Context
 * 
 * Shared context for network page filters
 * Used by both the network page and the network header
 */

import { createContext, useContext } from 'react';

export interface NetworkFilterContextType {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedRole: string;
    onRoleChange: (value: string) => void;
    selectedSort: string;
    onSortChange: (value: string) => void;
    showVerifiedOnly: boolean;
    onVerifiedToggle: () => void;
    showOnlineOnly: boolean;
    onOnlineToggle: () => void;
    totalCount: number;
    isLoading: boolean;
    activeFiltersCount: number;
    onAdvancedFiltersClick: () => void;
    // Setters for child components to update state
    setTotalCount?: (count: number) => void;
    setIsLoading?: (loading: boolean) => void;
}

export const NetworkFilterContext = createContext<NetworkFilterContextType | null>(null);

export const useNetworkFilters = () => {
    const context = useContext(NetworkFilterContext);
    // Don't throw error - return null if not in context
    // This allows the header to work outside the network page too
    return context;
};
