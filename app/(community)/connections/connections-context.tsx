'use client';

/**
 * Connections Context
 * 
 * Shared context for connections page state
 * Used by the connections page, header, and connection components
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ConnectionsContextType {
    // Search
    searchQuery: string;
    onSearchChange: (value: string) => void;

    // Stats
    totalConnections: number;
    setTotalConnections: (count: number) => void;

    // Loading
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // Active tab
    activeTab: 'connections' | 'requests' | 'suggestions';
    setActiveTab: (tab: 'connections' | 'requests' | 'suggestions') => void;
}

export const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

export const useConnectionsContext = () => {
    const context = useContext(ConnectionsContext);
    // Don't throw error - return null if not in context
    // This allows components to work outside the connections page too
    return context;
};

interface ConnectionsProviderProps {
    children: ReactNode;
    defaultTab?: 'connections' | 'requests' | 'suggestions';
}

export function ConnectionsProvider({
    children,
    defaultTab = 'connections'
}: ConnectionsProviderProps) {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Stats state
    const [totalConnections, setTotalConnections] = useState(0);

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Active tab state
    const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'suggestions'>(defaultTab);

    // Memoized handlers
    const onSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const value: ConnectionsContextType = {
        searchQuery,
        onSearchChange,
        totalConnections,
        setTotalConnections,
        isLoading,
        setIsLoading,
        activeTab,
        setActiveTab,
    };

    return (
        <ConnectionsContext.Provider value={value}>
            {children}
        </ConnectionsContext.Provider>
    );
}
