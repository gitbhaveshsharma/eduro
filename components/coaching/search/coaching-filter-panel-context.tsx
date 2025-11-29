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

/**
 * Hook to access the coaching filter panel context
 * Returns null if used outside CoachingFilterPanelProvider (safe fallback)
 */
export function useCoachingFilterPanel(): CoachingFilterPanelContextType {
    const context = useContext(CoachingFilterPanelContext);

    // Return a safe default if context is not available
    // This allows the component to work outside the provider (on subpages)
    if (context === undefined) {
        return {
            isOpen: false,
            toggle: () => { },
            open: () => { },
            close: () => { },
        };
    }

    return context;
}
