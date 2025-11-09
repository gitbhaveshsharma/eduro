/**
 * Settings System Types
 * 
 * Type definitions for settings items, categories, and search functionality
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Settings category types
 */
export type SettingsCategory =
    | 'profile'
    | 'account'
    | 'privacy'
    | 'notifications'
    | 'coaching'
    | 'branches'
    | 'schedule'
    | 'preferences'
    | 'security';

/**
 * Settings item priority for search relevance
 */
export type SettingsPriority = 'high' | 'medium' | 'low';

/**
 * User role type for settings access control
 */
export type UserRole = 'S' | 'T' | 'C' | 'A' | 'SA';

/**
 * Individual settings item configuration
 */
export interface SettingsItem {
    id: string;
    name: string;
    description: string;
    category: SettingsCategory;
    icon: LucideIcon;
    href: string;
    keywords?: string[]; // Additional search keywords
    priority?: SettingsPriority;
    roles?: UserRole[]; // If undefined, visible to all roles
    badge?: number; // Optional notification badge
}

/**
 * Settings category configuration
 */
export interface SettingsCategoryConfig {
    id: SettingsCategory;
    label: string;
    description: string;
    icon: LucideIcon;
    priority: number; // For sorting categories
}

/**
 * Settings search result with relevance score
 */
export interface SettingsSearchResult extends SettingsItem {
    relevanceScore: number; // 0-100, higher is more relevant
    matchedFields: ('name' | 'description' | 'category' | 'keywords')[]; // Fields that matched the search
}

/**
 * Settings search filter options
 */
export interface SettingsSearchFilter {
    categories?: SettingsCategory[];
    roles?: UserRole[];
    minPriority?: SettingsPriority;
}

/**
 * Settings search context state
 */
export interface SettingsSearchContextValue {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: SettingsSearchResult[];
    isSearching: boolean;
    filter: SettingsSearchFilter;
    setFilter: (filter: SettingsSearchFilter) => void;
    clearSearch: () => void;
}
