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
    TrendingUp,
    Menu,
    X,
    Building2,
    UserCog,
    LayoutDashboard,
    GraduationCap,
    DollarSign,
    ArrowLeft,
    MapPin
} from "lucide-react";
import type { NavigationItem, PlatformType, DeviceType, LayoutConfig, HeaderItem, PageType, SidebarItem } from "./types";

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
        devices: ['mobile', 'tablet']
    },
    {
        id: 'lms',
        label: 'LMS',
        icon: BookOpen,
        href: '/lms',
        platforms: ['community'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    {
        id: 'coaching',
        label: 'Coaching',
        icon: Building2,
        href: '/coaching',
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
    // {
    //     id: 'messages',
    //     label: 'Messages',
    //     icon: MessageCircle,
    //     href: '/messages',
    //     platforms: ['community'],
    //     devices: ['mobile', 'tablet', 'desktop']
    // },
];

export const LMS_NAV_ITEMS: NavigationItem[] = [
    {
        id: 'dashboard',
        label: 'HOME',
        icon: Home,
        href: '/dashboard',
        platforms: ['lms'],
        devices: ['mobile', 'tablet']
    },
    {
        id: 'lms',
        label: 'LMS',
        icon: BookOpen,
        href: '/lms',
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
        devices: ['mobile', 'tablet',]
    },
    {
        id: 'feed',
        label: 'Feed',
        icon: Plus,
        href: '/feed',
        platforms: ['lms'],
        devices: ['mobile', 'tablet', 'desktop']
    },
    // {
    //     id: 'grades',
    //     label: 'Grades',
    //     icon: Award,
    //     href: '/grades',
    //     platforms: ['lms'],
    //     devices: ['mobile', 'tablet', 'desktop']
    // },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/analytics',
        platforms: ['lms'],
        devices: ['tablet'] // Role-based, but we'll handle this in the component
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
 * ============================================================================
 * HEADER ITEMS CONFIGURATION (Page-based, not platform-based)
 * ============================================================================
 */


// /**
//  * Network page header items
//  */
// export const NETWORK_HEADER_ITEMS: HeaderItem[] = [
//     {
//         id: 'feed',
//         label: 'Feed',
//         icon: Home,
//         action: {
//             type: 'navigate',
//             href: '/feed'
//         },
//         showOn: {
//             devices: ['desktop'],
//             pages: ['network']
//         }
//     },
//     {
//         id: 'role-filter',
//         label: 'Role',
//         icon: Users,
//         action: {
//             type: 'dropdown'
//         },
//         showOn: {
//             devices: ['mobile', 'tablet', 'desktop'],
//             pages: ['network']
//         }
//     },
//     {
//         id: 'sort-filter',
//         label: 'Sort',
//         icon: Filter,
//         action: {
//             type: 'dropdown'
//         },
//         showOn: {
//             devices: ['mobile', 'tablet', 'desktop'],
//             pages: ['network']
//         }
//     }
// ];

/**
 * Dashboard (LMS) header items
 */
export const DASHBOARD_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        action: {
            type: 'navigate',
            href: '/dashboard'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['dashboard']
        }
    },
    {
        id: 'courses',
        label: 'Courses',
        icon: BookOpen,
        action: {
            type: 'navigate',
            href: '/courses'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['dashboard']
        }
    },
    {
        id: 'assignments',
        label: 'Assignments',
        icon: FileText,
        action: {
            type: 'navigate',
            href: '/assignments'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['dashboard']
        }
    },
    {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        action: {
            type: 'navigate',
            href: '/calendar'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['dashboard']
        }
    },
    {
        id: 'feed',
        label: 'Feed',
        icon: Plus,
        action: {
            type: 'navigate',
            href: '/feed'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['dashboard']
        }
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        action: {
            type: 'navigate',
            href: '/analytics'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['dashboard']
        }
    }
];

/**
 * Settings page header items
 */
export const SETTINGS_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'back',
        label: 'Back',
        icon: Home,
        action: {
            type: 'navigate',
            href: '/dashboard'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['settings']
        }
    }
];

/**
 * Coaching page header items
 */
export const COACHING_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'back',
        label: 'Home',
        icon: Home,
        action: {
            type: 'navigate',
            href: '/dashboard'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['coaching']
        }
    },
    {
        id: 'feed',
        label: 'Feed',
        icon: Plus,
        action: {
            type: 'navigate',
            href: '/feed'
        },
        showOn: {
            devices: ['desktop'],
            pages: ['coaching']
        }
    }
];

/**
 * LMS Coach page header items (for coaching center owners)
 */
export const LMS_COACH_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: Home,
        action: {
            type: 'navigate',
            href: '/dashboard'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-coach']
        }
    },
    {
        id: 'feed',
        label: 'Feed',
        icon: Plus,
        action: {
            type: 'navigate',
            href: '/feed'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-coach']
        }
    },
    {
        id: 'lms-home',
        label: 'LMS',
        icon: BookOpen,
        action: {
            type: 'navigate',
            href: '/lms'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-coach']
        }
    }
];

/**
 * LMS Branch Manager page header items (for assigned branch managers)
 */
export const LMS_BRANCH_MANAGER_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: Home,
        action: {
            type: 'navigate',
            href: '/dashboard'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-branch-manager']
        }
    },
    {
        id: 'feed',
        label: 'Feed',
        icon: Plus,
        action: {
            type: 'navigate',
            href: '/feed'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-branch-manager']
        }
    },
    {
        id: 'lms-home',
        label: 'LMS',
        icon: BookOpen,
        action: {
            type: 'navigate',
            href: '/lms'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['lms-branch-manager']
        }
    }
];

/**
 * Profile page header items
 */
export const PROFILE_HEADER_ITEMS: HeaderItem[] = [
    {
        id: 'edit',
        label: 'Edit Profile',
        icon: Settings,
        action: {
            type: 'navigate',
            href: '/settings/profile'
        },
        showOn: {
            devices: ['desktop', 'tablet'],
            pages: ['profile']
        }
    }
];

/**
 * ============================================================================
 * SIDEBAR ITEMS CONFIGURATION (Role-based access control)
 * ============================================================================
 */

/**
 * Settings page sidebar items with role-based access
 */
export const SETTINGS_SIDEBAR_ITEMS: SidebarItem[] = [
    {
        id: 'overview',
        label: 'Overview',
        icon: Settings,
        href: '/settings',
        description: 'View all available settings',
        // No roles specified = visible to all
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: UserCog,
        href: '/settings/profiles',
        description: 'Manage your personal information and preferences',
        // No roles specified = visible to all
    },
    {
        id: 'coaching-center',
        label: 'Coaching Center',
        icon: Building2,
        href: '/settings/coaching-center',
        description: 'Manage your coaching centers and courses',
        roles: ['C', 'A', 'SA'], // Only visible to Coaches, Admins, and Super Admins
    }
];

/**
 * LMS Branch Manager sidebar items
 * These items use relative paths that will be prefixed with the branch base path
 * Note: The actual href will be constructed dynamically based on branchId
 */
export const LMS_BRANCH_MANAGER_SIDEBAR_ITEMS: SidebarItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: 'dashboard',
        description: 'Overview and analytics',
    },
    {
        id: 'students',
        label: 'Students',
        icon: Users,
        href: 'students',
        description: 'Manage student enrollments',
    },
    {
        id: 'teachers',
        label: 'Teachers',
        icon: GraduationCap,
        href: 'teachers',
        description: 'Manage branch teachers',
    },
    {
        id: 'classes',
        label: 'Classes',
        icon: BookOpen,
        href: 'classes',
        description: 'Manage classes and batches',
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: Calendar,
        href: 'attendance',
        description: 'Track student attendance',
    },
    {
        id: 'fees',
        label: 'Fees',
        icon: DollarSign,
        href: 'fees',
        description: 'Manage fee collection',
    },
];

/**
 * LMS Coach sidebar items (for unified coach view across all branches)
 */
export const LMS_COACH_SIDEBAR_ITEMS: SidebarItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/lms/coach',
        description: 'Coaching center overview',
    },
    {
        id: 'branch-students',
        label: 'All Students',
        icon: Users,
        href: '/lms/coach/branch-students',
        description: 'Manage students across all branches',
    },
    {
        id: 'branch-classes',
        label: 'All Classes',
        icon: BookOpen,
        href: '/lms/coach/branch-classes',
        description: 'Manage classes across all branches',
    },
    {
        id: 'branch-teachers',
        label: 'All Teachers',
        icon: GraduationCap,
        href: '/lms/coach/branch-teachers',
        description: 'Manage teachers across all branches',
    },
    {
        id: 'student-attendance',
        label: 'Attendance',
        icon: Calendar,
        href: '/lms/coach/student-attendance',
        description: 'Track attendance across branches',
    },
    {
        id: 'student-fees',
        label: 'Fees',
        icon: DollarSign,
        href: '/lms/coach/student-fees',
        description: 'Manage fee collection',
    },
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

    /**
     * Get header items for a specific page
     */
    static getHeaderItemsForPage(page: PageType): HeaderItem[] {
        switch (page) {
            // case 'feed':
            //     return FEED_HEADER_ITEMS;
            // case 'network':
            //     return NETWORK_HEADER_ITEMS;
            case 'coaching':
                return COACHING_HEADER_ITEMS;
            case 'dashboard':
                return DASHBOARD_HEADER_ITEMS;
            case 'settings':
                return SETTINGS_HEADER_ITEMS;
            case 'profile':
                return PROFILE_HEADER_ITEMS;
            case 'lms-coach':
                return LMS_COACH_HEADER_ITEMS;
            case 'lms-branch-manager':
                return LMS_BRANCH_MANAGER_HEADER_ITEMS;
            default:
                return [];
        }
    }

    /**
     * Filter header items based on current context
     */
    static filterHeaderItems(
        items: HeaderItem[],
        page: PageType,
        device: DeviceType,
        platform?: PlatformType
    ): HeaderItem[] {
        return items.filter(item => {
            // Check device match
            if (item.showOn?.devices && !item.showOn.devices.includes(device)) {
                return false;
            }

            // Check page match
            if (item.showOn?.pages && !item.showOn.pages.includes(page)) {
                return false;
            }

            // Check platform match
            if (item.showOn?.platforms && platform && !item.showOn.platforms.includes(platform)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Generate default sidebar config based on device and page
     */
    static getDefaultSidebarConfig(device: DeviceType, page?: PageType) {
        // Sidebar is disabled by default, can be enabled per page
        return {
            enabled: false,
            defaultOpen: device === 'desktop',
            position: 'left' as const,
            width: '280px',
            collapsible: true,
            overlay: device !== 'desktop'
        };
    }

    /**
     * Get sidebar items for a specific page
     */
    static getSidebarItemsForPage(page: PageType): SidebarItem[] {
        switch (page) {
            case 'settings':
                return SETTINGS_SIDEBAR_ITEMS;
            case 'lms-branch-manager':
                return LMS_BRANCH_MANAGER_SIDEBAR_ITEMS;
            case 'lms-coach':
                return LMS_COACH_SIDEBAR_ITEMS;
            default:
                return [];
        }
    }

    /**
     * Get branch manager sidebar items with dynamic hrefs based on branchId
     */
    static getBranchManagerSidebarItems(branchId: string): SidebarItem[] {
        return LMS_BRANCH_MANAGER_SIDEBAR_ITEMS.map(item => ({
            ...item,
            href: `/lms/manager/branches/${branchId}/${item.href}`,
        }));
    }

    /**
     * Filter sidebar items based on user role
     */
    static filterSidebarItemsByRole(
        items: SidebarItem[],
        userRole?: 'S' | 'T' | 'C' | 'A' | 'SA'
    ): SidebarItem[] {
        if (!userRole) {
            // If no role provided, only show items without role restrictions
            return items.filter(item => !item.roles || item.roles.length === 0);
        }

        return items.filter(item => {
            // If no roles specified, visible to all
            if (!item.roles || item.roles.length === 0) {
                return true;
            }
            // Check if user's role is in the allowed roles
            return item.roles.includes(userRole);
        });
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