// lib/utils/subject-assets.ts
/**
 * Complete Subject Assets Utility
 * Centralized subject configuration for entire LMS app
 * Icons, colors, images for Learning Dashboard + Attendance + Teachers
 */

import type { Subject, SubjectId } from '@/components/dashboard/learning-dashboard/types';

/**
 * Complete subject configuration - SINGLE SOURCE OF TRUTH
 */
const SUBJECT_CONFIG: Record<SubjectId, {
    icon: string;
    color: string;
    image: string;
    name: string;
}> = {
    // Core Subjects
    all: {
        icon: '📖',
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        image: '/subjects/general_knowledge.png',
        name: 'All Subjects'
    },
    english: {
        icon: '📚',
        color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        image: '/subjects/english.png',
        name: 'English'
    },
    physics: {
        icon: '⚛️',
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        image: '/subjects/physics.png',
        name: 'Physics'
    },
    chemistry: {
        icon: '🧪',
        color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        image: '/subjects/chemistry.png',
        name: 'Chemistry'
    },
    mathematics: {
        icon: '📐',
        color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        image: '/subjects/mathematics.png',
        name: 'Mathematics'
    },
    biology: {
        icon: '🧬',
        color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        image: '/subjects/biology.png',
        name: 'Biology'
    },
    history: {
        icon: '🏛️',
        color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        image: '/subjects/history.png',
        name: 'History'
    },
    geography: {
        icon: '🌍',
        color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        image: '/subjects/geography.png',
        name: 'Geography'
    },
    science: {
        icon: '🔬',
        color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
        image: '/subjects/science.png',
        name: 'Science'
    },
    computer: {
        icon: '💻',
        color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
        image: '/subjects/computer.png',
        name: 'Computer'
    },

    // Commerce Subjects
    business_studies: {
        icon: '💼',
        color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        image: '/subjects/business_studies.png',
        name: 'Business Studies'
    },
    economics: {
        icon: '📈',
        color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
        image: '/subjects/economics.png',
        name: 'Economics'
    },
    accountancy: {
        icon: '💰',
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
        image: '/subjects/accountancy.png',
        name: 'Accountancy'
    },

    // Language Subjects
    hindi: {
        icon: '📖',
        color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        image: '/subjects/hindi.png',
        name: 'Hindi'
    },

    // Arts & Activity Subjects
    music: {
        icon: '🎵',
        color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        image: '/subjects/music.png',
        name: 'Music'
    },
    'physical_education': {
        icon: '⚽',
        color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        image: '/subjects/physical_education.png',
        name: 'Physical Education'
    },
    'art_and_craft': {
        icon: '🎨',
        color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
        image: '/subjects/art_and_craft.png',
        name: 'Art & Craft'
    },

    // Other Subjects
    'moral_science': {
        icon: '🙏',
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
        image: '/subjects/moral_science.png',
        name: 'Moral Science'
    },
    environmental: {
        icon: '🌱',
        color: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
        image: '/subjects/environmental.png',
        name: 'Environmental'
    },
    'social_studies': {
        icon: '👥',
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        image: '/subjects/social_studies.png',
        name: 'Social Studies'
    }
};

/**
 * Get complete subject configuration
 */
export function getSubjectConfig(subjectId: SubjectId): {
    icon: string;
    color: string;
    image: string;
    name: string;
} {
    return SUBJECT_CONFIG[subjectId] || SUBJECT_CONFIG.all;
}

/**
 * Get subject icon (used by AttendanceClassFilter)
 */
export function getSubjectIcon(subjectId: SubjectId): string {
    return getSubjectConfig(subjectId).icon;
}

/**
 * Get Tailwind color config for subject (used by AttendanceClassFilter)
 */
export function getSubjectColor(subjectId: SubjectId): string {
    return getSubjectConfig(subjectId).color;
}

/**
 * Get subject image path
 */
export function getSubjectImage(subject?: Subject): string {
    if (!subject?.id || subject.id === 'all') {
        return '/subjects/general_knowledge.png';
    }
    return getSubjectConfig(subject.id).image;
}

/**
 * Get subject image by SubjectId directly
 */
export function getSubjectImageById(subjectId: SubjectId): string {
    return getSubjectConfig(subjectId).image;
}

/**
 * Get subject display name
 */
export function getSubjectName(subjectId: SubjectId): string {
    return getSubjectConfig(subjectId).name;
}

/**
 * Check if subject image exists
 */
export function hasSubjectImage(subjectId: SubjectId): boolean {
    return Object.keys(SUBJECT_CONFIG).includes(subjectId);
}

/**
 * Get all subject configurations (for dropdowns, lists)
 */
export function getAllSubjects(): Subject[] {
    return Object.entries(SUBJECT_CONFIG).map(([id, config]) => ({
        id: id as SubjectId,
        name: config.name,
        icon: config.icon,
        color: config.color
    }));
}

/**
 * Validate if subjectId is valid
 */
export function isValidSubjectId(subjectId: string): subjectId is SubjectId {
    return Object.keys(SUBJECT_CONFIG).includes(subjectId as SubjectId);
}
