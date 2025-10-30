/**
 * Utility functions for Branch Classes
 */

import type { BranchClass } from '../types/branch-class.types';
import { ClassStatus } from '../types/branch-class.types';

/**
 * Check if a class is accepting enrollments
 */
export function isClassAcceptingEnrollments(branchClass: BranchClass): boolean {
  return (
    branchClass.status === ClassStatus.ACTIVE &&
    branchClass.is_visible &&
    branchClass.current_enrollment < branchClass.max_students
  );
}

/**
 * Get available seats in a class
 */
export function getAvailableSeats(branchClass: BranchClass): number {
  return Math.max(0, branchClass.max_students - branchClass.current_enrollment);
}

/**
 * Calculate class utilization percentage
 */
export function getClassUtilization(branchClass: BranchClass): number {
  if (branchClass.max_students === 0) return 0;
  return Math.round((branchClass.current_enrollment / branchClass.max_students) * 100);
}

/**
 * Check if class has started
 */
export function hasClassStarted(branchClass: BranchClass): boolean {
  if (!branchClass.start_date) return false;
  return new Date(branchClass.start_date) <= new Date();
}

/**
 * Check if class has ended
 */
export function hasClassEnded(branchClass: BranchClass): boolean {
  if (!branchClass.end_date) return false;
  return new Date(branchClass.end_date) < new Date();
}

/**
 * Get class status badge color
 */
export function getStatusColor(status: ClassStatus): string {
  switch (status) {
    case ClassStatus.ACTIVE:
      return 'green';
    case ClassStatus.INACTIVE:
      return 'gray';
    case ClassStatus.FULL:
      return 'orange';
    case ClassStatus.COMPLETED:
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Format class schedule for display
 */
export function formatClassSchedule(branchClass: BranchClass): string {
  if (!branchClass.class_days || branchClass.class_days.length === 0) {
    return 'Schedule not set';
  }

  const days = branchClass.class_days.join(', ');
  const time = branchClass.start_time && branchClass.end_time
    ? `${formatTime(branchClass.start_time)} - ${formatTime(branchClass.end_time)}`
    : '';

  return time ? `${days} • ${time}` : days;
}

/**
 * Format time from HH:MM:SS to HH:MM AM/PM
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get days of week short names
 */
export function getDayShortName(day: string): string {
  const dayMap: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };
  return dayMap[day] || day;
}

/**
 * Sort classes by custom criteria
 */
export function sortClasses(
  classes: BranchClass[],
  sortBy: 'name' | 'enrollment' | 'date' | 'utilization'
): BranchClass[] {
  return [...classes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.class_name.localeCompare(b.class_name);
      case 'enrollment':
        return b.current_enrollment - a.current_enrollment;
      case 'date':
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case 'utilization':
        return getClassUtilization(b) - getClassUtilization(a);
      default:
        return 0;
    }
  });
}

/**
 * Filter classes by criteria
 */
export function filterClasses(
  classes: BranchClass[],
  filters: {
    searchTerm?: string;
    status?: ClassStatus;
    subject?: string;
    grade?: string;
    availableOnly?: boolean;
  }
): BranchClass[] {
  return classes.filter(branchClass => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        branchClass.class_name.toLowerCase().includes(searchLower) ||
        branchClass.subject.toLowerCase().includes(searchLower) ||
        branchClass.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.status && branchClass.status !== filters.status) {
      return false;
    }

    if (filters.subject && branchClass.subject !== filters.subject) {
      return false;
    }

    if (filters.grade && branchClass.grade_level !== filters.grade) {
      return false;
    }

    if (filters.availableOnly && !isClassAcceptingEnrollments(branchClass)) {
      return false;
    }

    return true;
  });
}

/**
 * Group classes by subject
 */
export function groupClassesBySubject(classes: BranchClass[]): Map<string, BranchClass[]> {
  const groups = new Map<string, BranchClass[]>();
  
  classes.forEach(branchClass => {
    const existing = groups.get(branchClass.subject) || [];
    groups.set(branchClass.subject, [...existing, branchClass]);
  });

  return groups;
}

/**
 * Get unique subjects from classes
 */
export function getUniqueSubjects(classes: BranchClass[]): string[] {
  return Array.from(new Set(classes.map(c => c.subject))).sort();
}

/**
 * Get unique grade levels from classes
 */
export function getUniqueGradeLevels(classes: BranchClass[]): string[] {
  return Array.from(new Set(classes.map(c => c.grade_level))).sort();
}

/**
 * Calculate total capacity across classes
 */
export function getTotalCapacity(classes: BranchClass[]): number {
  return classes.reduce((sum, c) => sum + c.max_students, 0);
}

/**
 * Calculate total enrollment across classes
 */
export function getTotalEnrollment(classes: BranchClass[]): number {
  return classes.reduce((sum, c) => sum + c.current_enrollment, 0);
}

/**
 * Calculate average utilization across classes
 */
export function getAverageUtilization(classes: BranchClass[]): number {
  if (classes.length === 0) return 0;
  const totalUtil = classes.reduce((sum, c) => sum + getClassUtilization(c), 0);
  return Math.round(totalUtil / classes.length);
}
