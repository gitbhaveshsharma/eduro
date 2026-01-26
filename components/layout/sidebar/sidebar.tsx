"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SidebarProps, SidebarItem } from "../types";

/**
 * Sidebar Component
 * 
 * Reusable sidebar with responsive behavior:
 * - Desktop: Persistent sidebar that can be collapsed
 * - Mobile/Tablet: Overlay sidebar that slides in/out
 * 
 * Features:
 * - Configurable position (left/right)
 * - Configurable width
 * - Overlay mode for mobile
 * - Smooth animations
 * - Accessibility support
 * - Role-based item filtering
 * 
 * PERFORMANCE FIX: Uses Next.js Link with prefetch={false} instead of router.push()
 * to prevent slow RSC prefetching on every page navigation (was causing 1-2s delays)
 */
export function Sidebar({
    open,
    onOpenChange,
    config,
    items = [],
    title = 'Menu',
    className = ""
}: SidebarProps) {
    const {
        position = 'left',
        width = '280px',
        overlay = true,
        collapsible = true
    } = config;

    const pathname = usePathname();

    // Handle sidebar close on mobile after navigation
    const handleMobileClose = useCallback(() => {
        if (overlay) {
            onOpenChange(false);
        }
    }, [overlay, onOpenChange]);

    // Handle escape key to close sidebar
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open && collapsible) {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, collapsible, onOpenChange]);

    // NOTE: We no longer lock body scrolling when the overlay is open.
    // Instead we forward wheel/touch events from the backdrop to the window
    // so the underlying page can still be scrolled while the sidebar is open.
    const touchStartRef = useRef<number | null>(null);

    if (!config.enabled) return null;

    const isItemActive = (item: SidebarItem) => {
        if (!pathname || !item.href) return false;

        // Normalize paths by removing trailing slashes
        const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
        const normalizedItemHref = item.href.endsWith('/') && item.href !== '/' ? item.href.slice(0, -1) : item.href;

        // Special case: Map quiz routes to assignments nav item
        // e.g., /lms/teacher/{id}/quizzes/{quizId} should activate 'assignments' item
        if (normalizedPathname.includes('/quizzes/') && item.id === 'assignments') {
            // Check if there's a more specific match first
            const hasMoreSpecificMatch = items.some(otherItem => {
                if (otherItem.id === item.id || !otherItem.href) return false;
                const otherHref = otherItem.href.endsWith('/') && otherItem.href !== '/'
                    ? otherItem.href.slice(0, -1)
                    : otherItem.href;
                return (normalizedPathname === otherHref ||
                    normalizedPathname.startsWith(otherHref + '/')) &&
                    otherHref.length > normalizedItemHref.length;
            });
            if (!hasMoreSpecificMatch) return true;
        }

        // Check if this item matches (exact or child route)
        const isMatch = normalizedPathname === normalizedItemHref ||
            normalizedPathname.startsWith(normalizedItemHref + '/');

        if (!isMatch) return false;

        // Find the most specific match (longest matching href)
        // Only return true if this is the longest matching path
        const longestMatch = items.reduce<SidebarItem | null>((longest, otherItem) => {
            if (!otherItem.href) return longest;

            const otherHref = otherItem.href.endsWith('/') && otherItem.href !== '/'
                ? otherItem.href.slice(0, -1)
                : otherItem.href;

            const otherMatches = normalizedPathname === otherHref ||
                normalizedPathname.startsWith(otherHref + '/');

            if (!otherMatches) return longest;

            if (!longest || otherHref.length > (longest.href?.replace(/\/$/, '') || '').length) {
                return otherItem;
            }

            return longest;
        }, null);

        return longestMatch?.id === item.id;
    };

    return (
        <>
            {/* Overlay backdrop (mobile/tablet) */}
            {overlay && open && (
                <div
                    className={cn(
                        "fixed inset-0 bg-black/50 z-40",
                        "transition-opacity duration-300",
                        "lg:hidden" // Hide overlay on desktop
                    )}
                    onClick={() => collapsible && onOpenChange(false)}
                    // Forward wheel events to allow scrolling the underlying page
                    onWheel={(e) => {
                        // Prevent the overlay from swallowing the wheel; scroll the window instead
                        try {
                            window.scrollBy({ top: e.deltaY });
                        } catch (err) {
                            // ignore in non-browser env
                        }
                    }}
                    // Touch handlers: forward vertical touch movement to window scroll
                    onTouchStart={(e) => {
                        touchStartRef.current = e.touches?.[0]?.clientY ?? null;
                    }}
                    onTouchMove={(e) => {
                        const t = e.touches?.[0];
                        if (!t) return;
                        const prev = touchStartRef.current ?? t.clientY;
                        const delta = prev - t.clientY;
                        touchStartRef.current = t.clientY;
                        try {
                            window.scrollBy({ top: delta });
                        } catch (err) {
                            // ignore in non-browser env
                        }
                    }}
                />
            )}

            {/* Sidebar container */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 border-t border-gray-200",
                    "bg-white border-gray-200",
                    "flex flex-col",
                    "transition-transform duration-300 ease-in-out",
                    // Position
                    position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
                    // Transform based on open state - ALWAYS respect open state
                    position === 'left'
                        ? (open ? 'translate-x-0' : '-translate-x-full')
                        : (open ? 'translate-x-0' : 'translate-x-full'),
                    className
                )}
                style={{
                    width: width,
                    marginTop: '64px', // Account for header height
                }}
                aria-label={`${position} sidebar`}
                inert={!open ? "" : undefined}
            >
                {/* Sidebar header - Only show on mobile/tablet */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    {collapsible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                            aria-label="Close sidebar"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Desktop header with close button
                <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    {collapsible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                            aria-label="Close sidebar"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div> */}

                {/* Sidebar content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                    {items && items.length > 0 ? (
                        <nav className="space-y-2">
                            {items.map((item) => {
                                const Icon = item.icon;
                                const active = isItemActive(item);

                                // Use Next.js Link with prefetch={false} to prevent slow RSC prefetching
                                // This fixes the 1-2s delay on sidebar navigation
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href || '#'}
                                        prefetch={false}
                                        onClick={handleMobileClose}
                                        className={cn(
                                            "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg",
                                            "transition-all duration-200",
                                            "text-left",
                                            active
                                                ? "bg-brand-primary/10 text-brand-primary font-medium"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-5 w-5 flex-shrink-0 mt-0.5",
                                            active ? "text-brand-primary" : "text-gray-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate">
                                                    {item.label}
                                                </span>
                                                {item.badge && item.badge > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-brand-primary text-white rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No items to display</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

