'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NETWORK_NAV_ITEMS, LayoutUtils } from '../config';
import { NavigationItem } from '../types';
import { useAuthStore } from '@/lib/auth-store';

// // ✅ Dynamic import framer-motion with SSR disabled to reduce initial bundle
// const MotionComponents = dynamic(
//   () => import('framer-motion').then(mod => ({
//     default: {
//       motion: mod.motion,
//       AnimatePresence: mod.AnimatePresence
//     }
//   })),
//   { ssr: false }
// );

// Fallback for SSR
const FallbackMotion = {
    motion: {
        div: ({ children, className, ...props }: any) => <div className={className}>{children}</div>,
        nav: ({ children, className, ...props }: any) => <nav className={className}>{children}</nav>,
        span: ({ children, className, ...props }: any) => <span className={className}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
};

// Hook to get motion components
function useMotion() {
    const [motion, setMotion] = React.useState<any>(FallbackMotion);

    React.useEffect(() => {
        import('framer-motion').then(mod => {
            setMotion({ motion: mod.motion, AnimatePresence: mod.AnimatePresence });
        });
    }, []);

    return motion;
}

interface NetworkBottomNavigationProps {
    activeItem?: string;
    onItemClick?: (item: NavigationItem) => void;
    className?: string;
    showLabels?: boolean;
    variant?: 'default' | 'floating' | 'minimal';
    connectionRequests?: number; // Badge count for requests
    onSearchToggle?: () => void;
    onFiltersToggle?: () => void;
    isSearchOpen?: boolean;
    isFiltersOpen?: boolean;
}

/**
 * NetworkBottomNavigation - Specialized bottom navigation for network discovery
 * 
 * Features:
 * - Network-specific actions (discover, search, filters, requests, trending)
 * - Badge notifications for connection requests
 * - Interactive toggles for search and filters
 * - Responsive design with device detection
 * - Motion animations for state changes
 * - Follows conditional layout patterns
 */
export function NetworkBottomNavigation({
    activeItem = 'discover',
    onItemClick,
    className,
    showLabels = true,
    variant = 'default',
    connectionRequests = 0,
    onSearchToggle,
    onFiltersToggle,
    isSearchOpen = false,
    isFiltersOpen = false
}: NetworkBottomNavigationProps) {
    const { user } = useAuthStore();
    const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>(() => {
        // server-safe default
        if (typeof window === 'undefined') return 'desktop';
        return LayoutUtils.getDeviceType();
    });

    React.useEffect(() => {
        const onResize = () => setDevice(LayoutUtils.getDeviceType());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const [touchedItem, setTouchedItem] = useState<string | null>(null);

    // Get motion components (lazy loaded)
    const { motion, AnimatePresence } = useMotion();

    // Filter navigation items based on current device
    const visibleItems = NETWORK_NAV_ITEMS.filter(item => {
        if (device === 'mobile') return item.devices.includes('mobile');
        if (device === 'tablet') return item.devices.includes('tablet');
        return item.devices.includes('desktop');
    });

    const handleItemClick = useCallback((item: NavigationItem) => {
        // Handle special toggle actions
        if (item.id === 'search' && onSearchToggle) {
            onSearchToggle();
            return;
        }

        if (item.id === 'filters' && onFiltersToggle) {
            onFiltersToggle();
            return;
        }

        // Standard navigation
        onItemClick?.(item);
    }, [onItemClick, onSearchToggle, onFiltersToggle]);

    const handleTouchStart = useCallback((itemId: string) => {
        setTouchedItem(itemId);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setTouchedItem(null);
    }, []);

    const getItemState = useCallback((item: NavigationItem) => {
        const isActive = activeItem === item.id;
        const isToggled = (item.id === 'search' && isSearchOpen) ||
            (item.id === 'filters' && isFiltersOpen);
        const isTouched = touchedItem === item.id;

        return { isActive, isToggled, isTouched };
    }, [activeItem, isSearchOpen, isFiltersOpen, touchedItem]);

    const renderNavigationItem = useCallback((item: NavigationItem) => {
        const { isActive, isToggled, isTouched } = getItemState(item);
        const IconComponent = item.icon;
        const hasNotification = item.id === 'requests' && connectionRequests > 0;

        return (
            <motion.div
                key={item.id}
                className="relative flex-1 flex flex-col items-center justify-center"
                initial={false}
                animate={{
                    scale: isTouched ? 0.95 : 1,
                }}
                transition={{ duration: 0.1 }}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "relative flex flex-col items-center justify-center",
                        "h-auto p-2 min-h-[48px] w-full rounded-lg",
                        "transition-all duration-200 ease-in-out",
                        "hover:bg-primary/10 active:bg-primary/20",
                        variant === 'floating' && "shadow-sm hover:shadow-md",
                        variant === 'minimal' && "hover:bg-transparent",
                        (isActive || isToggled) && [
                            "bg-primary/15 text-primary",
                            "shadow-sm border border-primary/20"
                        ],
                        isTouched && "bg-primary/25"
                    )}
                    onClick={() => handleItemClick(item)}
                    onTouchStart={() => handleTouchStart(item.id)}
                    onTouchEnd={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                >
                    {/* Icon Container */}
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: isActive || isToggled ? 1.1 : 1,
                                rotate: isToggled ? 180 : 0
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            <IconComponent
                                className={cn(
                                    "h-5 w-5 transition-colors duration-200",
                                    (isActive || isToggled) ? "text-primary" : "text-muted-foreground",
                                    isTouched && "text-primary"
                                )}
                            />
                        </motion.div>

                        {/* Notification Badge */}
                        <AnimatePresence>
                            {hasNotification && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Badge
                                        variant="destructive"
                                        className={cn(
                                            "h-4 min-w-[16px] px-1 text-xs font-medium",
                                            "flex items-center justify-center rounded-full",
                                            connectionRequests > 9 && "px-1.5"
                                        )}
                                    >
                                        {connectionRequests > 99 ? '99+' : connectionRequests}
                                    </Badge>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Label */}
                    <AnimatePresence>
                        {showLabels && (
                            <motion.span
                                initial={{ opacity: 0, y: 2 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 2 }}
                                transition={{ duration: 0.15, delay: 0.05 }}
                                className={cn(
                                    "text-xs font-medium mt-1 leading-none",
                                    "transition-colors duration-200",
                                    (isActive || isToggled) ? "text-primary" : "text-muted-foreground",
                                    isTouched && "text-primary",
                                    variant === 'minimal' && "hidden"
                                )}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Active Indicator */}
                    <AnimatePresence>
                        {(isActive || isToggled) && variant !== 'minimal' && (
                            <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                exit={{ scaleX: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "absolute bottom-0 left-1/2 transform -translate-x-1/2",
                                    "h-0.5 w-6 bg-primary rounded-full"
                                )}
                            />
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        );
    }, [
        getItemState,
        connectionRequests,
        handleItemClick,
        handleTouchStart,
        handleTouchEnd,
        showLabels,
        variant,
        device
    ]);

    if (!user || visibleItems.length === 0) {
        return null;
    }

    return (
        <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40",
                "bg-background/95 backdrop-blur-sm",
                "border-t border-border/40",
                "safe-area-pb", // For devices with safe area insets
                variant === 'floating' && [
                    "mx-4 mb-4 rounded-2xl border",
                    "shadow-lg bg-background/98"
                ],
                variant === 'minimal' && [
                    "bg-transparent border-transparent backdrop-blur-none"
                ],
                className
            )}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className={cn(
                "flex items-center justify-around",
                "px-2 py-1",
                variant === 'floating' && "px-4 py-2",
                variant === 'minimal' && "px-1 py-0.5"
            )}>
                {visibleItems.map(renderNavigationItem)}
            </div>

            {/* Background Gradient for Floating Variant */}
            {variant === 'floating' && (
                <div className={cn(
                    "absolute inset-0 -z-10 rounded-2xl",
                    "bg-gradient-to-t from-background to-background/80"
                )} />
            )}
        </motion.nav>
    );
}

NetworkBottomNavigation.displayName = 'NetworkBottomNavigation';

export default NetworkBottomNavigation;