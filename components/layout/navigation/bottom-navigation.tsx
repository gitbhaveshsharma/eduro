"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { BottomNavProps, NavigationItem } from "../types";

export function BottomNavigation({
    config,
    activeRoute,
    navigationItems,
    onItemClick,
    className = ""
}: BottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleItemClick = async (item: NavigationItem) => {
        // If a global handler is provided, call it and respect its return value
        if (onItemClick) {
            try {
                const result = await onItemClick(item as NavigationItem) as unknown as boolean | void;
                if (result === false) return; // handler prevented navigation
            } catch (e) {
                // If handler throws, don't navigate by default
                return;
            }
        }

        // If the item has its own onClick, call it and respect return value
        if (item.onClick) {
            try {
                const res = await item.onClick() as unknown as boolean | void;
                if (res === false) return; // item handler prevented navigation
            } catch (e) {
                // If handler throws, don't navigate
                return;
            }
        }

        // Navigate if href is provided
        if (item.href) {
            router.push(item.href);
        }
    };

    const isItemActive = (item: NavigationItem) => {
        if (activeRoute) {
            return activeRoute === item.id;
        }

        // Default: check if current pathname matches item href
        if (!pathname || !item.href) return false;

        // Normalize paths by removing trailing slashes
        const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
        const normalizedItemHref = item.href.endsWith('/') && item.href !== '/' ? item.href.slice(0, -1) : item.href;

        // For exact match routes (most specific first to avoid multiple active items)
        // Strategy: Exact match ONLY, no startsWith to prevent parent routes from staying active
        return normalizedPathname === normalizedItemHref;
    };

    // Don't render if we shouldn't show bottom nav
    if (!config.showBottomNav) return null;

    // Filter items based on current config
    const filteredItems = navigationItems.filter(item =>
        item.platforms.includes(config.platform) &&
        item.devices.includes(config.device)
    );

    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-40",
            "bg-white border-t border-gray-200 shadow-lg",
            "safe-bottom", // For iOS safe area
            className
        )}>
            <div className="max-w-screen-xl mx-auto">
                <div className="flex items-center justify-around px-2 py-2">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item);

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center",
                                    "min-w-0 flex-1 px-1 py-2 rounded-lg",
                                    "transition-all duration-200 ease-in-out",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    isActive
                                        ? "text-primary bg-primary/5"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                )}
                                aria-label={item.label}
                            >
                                <div className="relative">
                                    <Icon className={cn(
                                        "h-6 w-6 transition-transform duration-200",
                                        isActive ? "scale-110 text-[var(--color-brand-primary)]" : "scale-100"
                                    )} />

                                    {/* Badge for notifications */}
                                    {item.badge && item.badge > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs rounded-full"
                                        >
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </Badge>
                                    )}
                                </div>

                                <span className={cn(
                                    "text-xs font-medium mt-1 leading-none",
                                    "max-w-full truncate",
                                    isActive ? "text-[var(--color-brand-primary)]" : "text-inherit"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}