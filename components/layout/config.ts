import {
    Home,
    BookOpen,
    Users,
    MessageCircle,
    Bell,
    User,
    Settings,
    Search,
    Plus,
    Calendar,
    FileText,
    Award,
    BarChart3,
    Filter,
    UserPlus,
    Heart,
    TrendingUp
} from "lucide-react";
import type { NavigationItem, PlatformType, DeviceType, LayoutConfig } from "./types";

/**
 * Navigation items configuration for different platforms
 */
export const COMMUNITY_NAV_ITEMS: NavigationItem[] = [
    {
        id: 'feed',
        label: 'Feed',
        icon: Home,
        href: '/feed',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'network',
        label: 'Network',
        icon: Users,
        href: '/network',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'messages',
        label: 'Messages',
        icon: MessageCircle,
        href: '/messages',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/notifications',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: User,
        href: '/profile',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    }
];

export const LMS_NAV_ITEMS: NavigationItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        href: '/dashboard',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'courses',
        label: 'Courses',
        icon: BookOpen,
        href: '/courses',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'assignments',
        label: 'Assignments',
        icon: FileText,
        href: '/assignments',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        href: '/calendar',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'grades',
        label: 'Grades',
        icon: Award,
        href: '/grades',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/analytics',
        platforms: ['lms'],
        devices: ['tablet', 'desktop'] // Role-based, but we'll handle this in the component
    }
];

/**
 * Network-specific navigation items for bottom navigation
 */
export const NETWORK_NAV_ITEMS: NavigationItem[] = [
    {
        id: 'discover',
        label: 'Discover',
        icon: Users,
        platforms: ['community'],
        devices: ['mobile', 'tablet']
    },
    {
        id: 'search',
        label: 'Search',
        icon: Search,
        platforms: ['community'],
        devices: ['mobile', 'tablet']
    },
    {
        id: 'filters',
        label: 'Filters',
        icon: Filter,
        platforms: ['community'],
        devices: ['mobile', 'tablet']
    },
    {
        id: 'requests',
        label: 'Requests',
        icon: Heart,
        platforms: ['community'],
        devices: ['mobile', 'tablet']
    },
    {
        id: 'trending',
        label: 'Trending',
        icon: TrendingUp,
        platforms: ['community'],
        devices: ['mobile', 'tablet']
    }
];

/**
 * Utility functions for layout configuration
 */
export class LayoutUtils {
    /**
     * Detect device type based on screen width
     */
    static getDeviceType(): DeviceType {
        if (typeof window === 'undefined') return 'desktop';

        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    /**
     * Detect if running in webview (mobile app)
     */
    static getViewType(): 'webview' | 'browser' {
        if (typeof window === 'undefined') return 'browser';

        // Check for common webview user agents or custom headers
        const userAgent = navigator.userAgent.toLowerCase();
        const isWebview =
            userAgent.includes('wv') || // Android WebView
            userAgent.includes('webview') ||
            (window.navigator as any).standalone === true || // iOS standalone
            (window as any).ReactNativeWebView || // React Native WebView
            (window as any).webkit?.messageHandlers; // iOS WKWebView

        return isWebview ? 'webview' : 'browser';
    }

    /**
     * Generate layout configuration based on platform and device
     */
    static generateConfig(
        platform: PlatformType,
        overrides?: Partial<LayoutConfig>
    ): LayoutConfig {
        const device = this.getDeviceType();
        const view = this.getViewType();

        const baseConfig: LayoutConfig = {
            platform,
            device,
            view,
            showHeader: true,
            // Show bottom navigation on mobile and tablet devices, or when running in a webview
            showBottomNav: device === 'mobile' || device === 'tablet' || view === 'webview',
            headerType: platform === 'community' ? 'community' : 'lms'
        };

        return { ...baseConfig, ...overrides };
    }

    /**
     * Filter navigation items based on platform and device
     */
    static filterNavigationItems(
        items: NavigationItem[],
        platform: PlatformType,
        device: DeviceType
    ): NavigationItem[] {
        return items.filter(item =>
            item.platforms.includes(platform) &&
            item.devices.includes(device)
        );
    }

    /**
     * Get navigation items for specific platform
     */
    static getNavigationItems(platform: PlatformType): NavigationItem[] {
        return platform === 'community' ? COMMUNITY_NAV_ITEMS : LMS_NAV_ITEMS;
    }

    /**
     * Check if bottom navigation should be shown
     */
    static shouldShowBottomNav(config: LayoutConfig): boolean {
        // Show bottom nav when configured and device is mobile/tablet, or when running inside a webview
        return (
            config.showBottomNav &&
            (config.device === 'mobile' || config.device === 'tablet' || config.view === 'webview')
        );
    }

    /**
     * Check if header should be shown
     */
    static shouldShowHeader(config: LayoutConfig): boolean {
        return config.showHeader;
    }
}

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
} as const;

/**
 * Z-index layers for layout components
 */
export const Z_INDEX = {
    header: 50,
    bottomNav: 40,
    sidebar: 30,
    modal: 60,
    toast: 70
} as const;