/**
 * Settings Components
 * 
 * Export all settings-related components, utilities, and types
 */

// Components
export { SettingsSearch } from './settings-search';
export { SettingsOverview } from './settings-overview';

// Data and Configuration
export {
    SETTINGS_CATEGORIES,
    SETTINGS_ITEMS,
    getSettingsItemsByRole,
    getSettingsByCategory,
    getAvailableCategories,
} from './settings-data';

// Search Service
export {
    searchSettings,
    getSearchSuggestions,
    getPopularSettings,
} from './search-service';

// Types
export type {
    SettingsCategory,
    SettingsPriority,
    UserRole,
    SettingsItem,
    SettingsCategoryConfig,
    SettingsSearchResult,
    SettingsSearchFilter,
    SettingsSearchContextValue,
} from './types';
