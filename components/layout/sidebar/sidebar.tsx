"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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

    const router = useRouter();
    const pathname = usePathname();

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

    // Prevent body scroll when sidebar overlay is open on mobile
    useEffect(() => {
        if (open && overlay) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [open, overlay]);

    if (!config.enabled) return null;

    const handleItemClick = (item: SidebarItem) => {
        if (item.href) {
            router.push(item.href);
            // Close sidebar on mobile after navigation
            if (overlay) {
                onOpenChange(false);
            }
        }
    };

    const isItemActive = (item: SidebarItem) => {
        return pathname === item.href || pathname?.startsWith(item.href + '/');
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
                    aria-hidden="true"
                />
            )}

            {/* Sidebar container */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50",
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
                aria-hidden={!open}
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

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
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
                                    </button>
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

