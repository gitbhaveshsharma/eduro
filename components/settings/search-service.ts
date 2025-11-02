/**
 * Settings Search Service
 * 
 * Provides search functionality for settings items with:
 * - Fuzzy matching
 * - Relevance scoring
 * - Multi-field search (name, description, category, keywords)
 * - Role-based filtering
 */

import type {
    SettingsItem,
    SettingsSearchResult,
    SettingsSearchFilter,
    UserRole,
} from './types';
import { SETTINGS_ITEMS, getSettingsItemsByRole } from './settings-data';

/**
 * Calculate relevance score for a settings item based on search query
 * Returns a score from 0-100, higher is more relevant
 */
function calculateRelevanceScore(
    item: SettingsItem,
    query: string,
    matchedFields: Set<string>
): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Name match (highest priority)
    if (item.name.toLowerCase().includes(lowerQuery)) {
        matchedFields.add('name');
        // Exact match
        if (item.name.toLowerCase() === lowerQuery) {
            score += 50;
        }
        // Starts with query
        else if (item.name.toLowerCase().startsWith(lowerQuery)) {
            score += 40;
        }
        // Contains query
        else {
            score += 30;
        }
    }

    // Description match
    if (item.description.toLowerCase().includes(lowerQuery)) {
        matchedFields.add('description');
        score += 20;
    }

    // Category match
    if (item.category.toLowerCase().includes(lowerQuery)) {
        matchedFields.add('category');
        score += 15;
    }

    // Keywords match
    if (item.keywords) {
        const keywordMatches = item.keywords.filter(keyword =>
            keyword.toLowerCase().includes(lowerQuery)
        );
        if (keywordMatches.length > 0) {
            matchedFields.add('keywords');
            score += 10 * keywordMatches.length; // Bonus for multiple keyword matches
        }
    }

    // Priority boost
    if (item.priority === 'high') {
        score += 5;
    } else if (item.priority === 'medium') {
        score += 2;
    }

    return Math.min(score, 100); // Cap at 100
}

/**
 * Search settings items with fuzzy matching and relevance scoring
 */
export function searchSettings(
    query: string,
    userRole?: UserRole,
    filter?: SettingsSearchFilter
): SettingsSearchResult[] {
    // If query is empty, return all items sorted by priority
    if (!query.trim()) {
        const items = getSettingsItemsByRole(userRole);
        return items.map(item => ({
            ...item,
            relevanceScore: 0,
            matchedFields: [],
        }));
    }

    // Get items available to user based on role
    let items = getSettingsItemsByRole(userRole);

    // Apply category filter
    if (filter?.categories && filter.categories.length > 0) {
        items = items.filter(item => filter.categories!.includes(item.category));
    }

    // Apply priority filter
    if (filter?.minPriority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const minPriorityValue = priorityOrder[filter.minPriority];
        items = items.filter(item => {
            const itemPriority = item.priority || 'low';
            return priorityOrder[itemPriority] >= minPriorityValue;
        });
    }

    // Calculate relevance and create search results
    const results: SettingsSearchResult[] = [];

    for (const item of items) {
        const matchedFields = new Set<string>();
        const relevanceScore = calculateRelevanceScore(item, query, matchedFields);

        // Only include items with a match
        if (relevanceScore > 0) {
            results.push({
                ...item,
                relevanceScore,
                matchedFields: Array.from(matchedFields) as any[],
            });
        }
    }

    // Sort by relevance score (descending), then by name
    results.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
        }
        return a.name.localeCompare(b.name);
    });

    return results;
}

/**
 * Get search suggestions based on partial query
 * Returns up to 5 most relevant suggestions
 */
export function getSearchSuggestions(
    query: string,
    userRole?: UserRole,
    maxSuggestions: number = 5
): string[] {
    if (!query.trim()) {
        return [];
    }

    const items = getSettingsItemsByRole(userRole);
    const suggestions = new Set<string>();

    const lowerQuery = query.toLowerCase();

    // Collect suggestions from names
    for (const item of items) {
        if (item.name.toLowerCase().includes(lowerQuery)) {
            suggestions.add(item.name);
        }

        // Add matching keywords
        if (item.keywords) {
            for (const keyword of item.keywords) {
                if (keyword.toLowerCase().includes(lowerQuery)) {
                    suggestions.add(keyword);
                }
            }
        }

        if (suggestions.size >= maxSuggestions) {
            break;
        }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Get popular/recommended settings items
 */
export function getPopularSettings(userRole?: UserRole, limit: number = 5): SettingsItem[] {
    const items = getSettingsItemsByRole(userRole);

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return items
        .sort((a, b) => {
            const aPriority = a.priority || 'low';
            const bPriority = b.priority || 'low';
            return priorityOrder[bPriority] - priorityOrder[aPriority];
        })
        .slice(0, limit);
}
