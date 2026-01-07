// utils/subject-assets.ts
import type { Subject, SubjectId } from '@/components/dashboard/learning-dashboard/types';

/**
 * Returns subject image path from public/subject
 * Filename must match subject.id
 */
export function getSubjectImage(subject?: Subject): string {
    if (!subject?.id || subject.id === 'all') {
        return '/subjects/general_knowledge.png';
    }

    return `/subjects/${subject.id}.png`;
}

/**
 * Get subject image by SubjectId directly
 */
export function getSubjectImageById(subjectId: SubjectId): string {
    if (subjectId === 'all') {
        return '/subjects/general_knowledge.png';
    }

    return `/subjects/${subjectId}.png`;
}

/**
 * Check if subject image exists (useful for error handling)
 */
export function hasSubjectImage(subjectId: SubjectId): boolean {
    const validSubjects: SubjectId[] = [
        'english', 'physics', 'chemistry', 'mathematics', 'biology',
        'history', 'geography', 'science', 'computer', 'business_studies',
        'economics', 'hindi', 'music', 'physical_education', 'moral_science',
        'environmental', 'social_studies', 'accountancy', 'art_and_craft'
    ];

    return validSubjects.includes(subjectId);
}
