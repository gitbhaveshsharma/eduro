/**
 * Coaching Filter Panel Context
 * 
 * Global state management for filter panel visibility
 * Allows Universal Header's CoachingSearch to control filter panel on the page
 */

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CoachingFilterPanelContextType {
    isOpen: boolean;
    toggle: () => void;
    open: () => void;
    close: () => void;
}

const CoachingFilterPanelContext = createContext<CoachingFilterPanelContextType | undefined>(undefined);

export function CoachingFilterPanelProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <CoachingFilterPanelContext.Provider value={{ isOpen, toggle, open, close }}>
            {children}
        </CoachingFilterPanelContext.Provider>
    );
}

export function useCoachingFilterPanel() {
    const context = useContext(CoachingFilterPanelContext);
    if (context === undefined) {
        throw new Error('useCoachingFilterPanel must be used within CoachingFilterPanelProvider');
    }
    return context;
}
