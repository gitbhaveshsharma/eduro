/**
 * Reading Progress Hook
 * Manages reading progress for learning resources using localStorage
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ReadingProgress {
    resourceId: string;
    resourceSlug: string;
    progress: number; // 0-100 percentage
    lastReadSection: string;
    sectionsCompleted: string[];
    startedAt: string;
    lastReadAt: string;
    completed: boolean;
    timeSpentSeconds: number;
}

interface ReadingProgressStore {
    [resourceId: string]: ReadingProgress;
}

const STORAGE_KEY = 'learning_reading_progress';

// Get stored progress from localStorage
function getStoredProgress(): ReadingProgressStore {
    if (typeof window === 'undefined') return {};
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return {};
    }
}

// Save progress to localStorage
function saveProgress(progress: ReadingProgressStore): void {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Hook to manage reading progress for a specific resource
 */
export function useReadingProgress(resourceId: string, resourceSlug: string, totalSections: number) {
    const [progress, setProgress] = useState<ReadingProgress | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load progress on mount
    useEffect(() => {
        const stored = getStoredProgress();
        const existingProgress = stored[resourceId];
        
        if (existingProgress) {
            setProgress(existingProgress);
        } else {
            // Initialize new progress
            setProgress({
                resourceId,
                resourceSlug,
                progress: 0,
                lastReadSection: '',
                sectionsCompleted: [],
                startedAt: new Date().toISOString(),
                lastReadAt: new Date().toISOString(),
                completed: false,
                timeSpentSeconds: 0,
            });
        }
        setIsLoaded(true);
    }, [resourceId, resourceSlug]);

    // Mark a section as completed
    const markSectionComplete = useCallback((sectionId: string) => {
        if (!progress) return;

        const stored = getStoredProgress();
        const updatedSectionsCompleted = progress.sectionsCompleted.includes(sectionId)
            ? progress.sectionsCompleted
            : [...progress.sectionsCompleted, sectionId];

        const newProgress = Math.round((updatedSectionsCompleted.length / totalSections) * 100);

        const updatedProgress: ReadingProgress = {
            ...progress,
            sectionsCompleted: updatedSectionsCompleted,
            lastReadSection: sectionId,
            lastReadAt: new Date().toISOString(),
            progress: newProgress,
            completed: newProgress === 100,
        };

        stored[resourceId] = updatedProgress;
        saveProgress(stored);
        setProgress(updatedProgress);

        return updatedProgress;
    }, [progress, resourceId, totalSections]);

    // Update scroll progress (based on scroll position)
    const updateScrollProgress = useCallback((scrollPercentage: number) => {
        if (!progress) return;

        // Only update if the new progress is higher
        if (scrollPercentage <= progress.progress) return;

        const stored = getStoredProgress();
        const updatedProgress: ReadingProgress = {
            ...progress,
            progress: Math.min(scrollPercentage, 100),
            lastReadAt: new Date().toISOString(),
            completed: scrollPercentage >= 95,
        };

        stored[resourceId] = updatedProgress;
        saveProgress(stored);
        setProgress(updatedProgress);
    }, [progress, resourceId]);

    // Update time spent
    const updateTimeSpent = useCallback((additionalSeconds: number) => {
        if (!progress) return;

        const stored = getStoredProgress();
        const updatedProgress: ReadingProgress = {
            ...progress,
            timeSpentSeconds: progress.timeSpentSeconds + additionalSeconds,
            lastReadAt: new Date().toISOString(),
        };

        stored[resourceId] = updatedProgress;
        saveProgress(stored);
        setProgress(updatedProgress);
    }, [progress, resourceId]);

    // Reset progress
    const resetProgress = useCallback(() => {
        const stored = getStoredProgress();
        const newProgress: ReadingProgress = {
            resourceId,
            resourceSlug,
            progress: 0,
            lastReadSection: '',
            sectionsCompleted: [],
            startedAt: new Date().toISOString(),
            lastReadAt: new Date().toISOString(),
            completed: false,
            timeSpentSeconds: 0,
        };

        stored[resourceId] = newProgress;
        saveProgress(stored);
        setProgress(newProgress);
    }, [resourceId, resourceSlug]);

    return {
        progress,
        isLoaded,
        markSectionComplete,
        updateScrollProgress,
        updateTimeSpent,
        resetProgress,
    };
}

/**
 * Hook to get all reading progress (for dashboard/overview)
 */
export function useAllReadingProgress() {
    const [allProgress, setAllProgress] = useState<ReadingProgressStore>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = getStoredProgress();
        setAllProgress(stored);
        setIsLoaded(true);
    }, []);

    // Refresh from storage
    const refresh = useCallback(() => {
        const stored = getStoredProgress();
        setAllProgress(stored);
    }, []);

    // Get progress for a specific resource
    const getProgress = useCallback((resourceId: string): ReadingProgress | undefined => {
        return allProgress[resourceId];
    }, [allProgress]);

    // Get progress percentage for a resource
    const getProgressPercentage = useCallback((resourceId: string): number => {
        return allProgress[resourceId]?.progress ?? 0;
    }, [allProgress]);

    // Check if resource is started
    const isStarted = useCallback((resourceId: string): boolean => {
        const progress = allProgress[resourceId];
        return progress ? progress.progress > 0 : false;
    }, [allProgress]);

    // Check if resource is completed
    const isCompleted = useCallback((resourceId: string): boolean => {
        const progress = allProgress[resourceId];
        return progress?.completed ?? false;
    }, [allProgress]);

    // Get status string
    const getStatus = useCallback((resourceId: string): 'not-started' | 'in-progress' | 'completed' => {
        const progress = allProgress[resourceId];
        if (!progress || progress.progress === 0) return 'not-started';
        if (progress.completed) return 'completed';
        return 'in-progress';
    }, [allProgress]);

    // Get total stats
    const getStats = useCallback(() => {
        const values = Object.values(allProgress);
        return {
            total: values.length,
            completed: values.filter(p => p.completed).length,
            inProgress: values.filter(p => !p.completed && p.progress > 0).length,
            totalTimeSpent: values.reduce((sum, p) => sum + p.timeSpentSeconds, 0),
        };
    }, [allProgress]);

    // Clear all progress
    const clearAllProgress = useCallback(() => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
        setAllProgress({});
    }, []);

    return {
        allProgress,
        isLoaded,
        refresh,
        getProgress,
        getProgressPercentage,
        isStarted,
        isCompleted,
        getStatus,
        getStats,
        clearAllProgress,
    };
}

/**
 * Format time spent in a readable way
 */
export function formatTimeSpent(seconds: number): string {
    if (seconds < 60) return `${seconds} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
}

/**
 * Format date in a readable way
 */
export function formatLastRead(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}
