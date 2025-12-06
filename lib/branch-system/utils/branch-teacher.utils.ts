/**
 * Branch Teacher Utility Functions
 * 
 * Helper functions for branch teacher operations
 * Data transformations, calculations, and formatting
 * 
 * @module branch-system/utils/branch-teacher
 */

import type {
    BranchTeacher,
    PublicBranchTeacher,
    TeacherAssignmentSummary,
    BranchTeacherStats,
    SubjectCoverageStats,
    DayOfWeek,
    ExperienceLevel,
} from '../types/branch-teacher.types';
import {
    EXPERIENCE_THRESHOLDS,
    DAYS_OF_WEEK_OPTIONS,
    EXPERIENCE_LEVEL_OPTIONS,
} from '../types/branch-teacher.types';

// ============================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================

/**
 * Converts BranchTeacher to PublicBranchTeacher
 * Removes sensitive internal fields and adds computed properties
 * 
 * @param teacher - Full branch teacher record
 * @returns Public-facing teacher data
 */
export function toPublicBranchTeacher(teacher: BranchTeacher): PublicBranchTeacher {
    const experienceLevel = getExperienceLevel(teacher.teaching_experience_years);
    const availabilitySummary = formatAvailabilitySummary(
        teacher.available_days,
        teacher.available_start_time,
        teacher.available_end_time
    );

    return {
        id: teacher.id,
        teacher_id: teacher.teacher_id,
        branch_id: teacher.branch_id,
        teacher_name: teacher.teacher_name,
        teacher_email: teacher.teacher_email,
        teacher_phone: teacher.teacher_phone,
        teacher_username: teacher.teacher_username,
        teacher_qualification: teacher.teacher_qualification,
        teacher_specialization: teacher.teacher_specialization,
        teaching_subjects: teacher.teaching_subjects,
        teaching_experience_years: teacher.teaching_experience_years,
        available_days: teacher.available_days,
        available_start_time: teacher.available_start_time,
        available_end_time: teacher.available_end_time,
        is_active: teacher.is_active,
        // Computed fields
        total_subjects_count: teacher.teaching_subjects.length,
        availability_summary: availabilitySummary,
        experience_level: experienceLevel,
    };
}

/**
 * Converts array of BranchTeachers to PublicBranchTeachers
 */
export function toPublicBranchTeachers(teachers: BranchTeacher[]): PublicBranchTeacher[] {
    return teachers.map(toPublicBranchTeacher);
}

// ============================================================
// EXPERIENCE CALCULATION FUNCTIONS
// ============================================================

/**
 * Gets experience level based on years of experience
 * 
 * @param years - Years of teaching experience
 * @returns Experience level category
 */
export function getExperienceLevel(years: number | null): ExperienceLevel {
    if (years === null || years < EXPERIENCE_THRESHOLDS.INTERMEDIATE) {
        return 'entry';
    }
    if (years < EXPERIENCE_THRESHOLDS.SENIOR) {
        return 'intermediate';
    }
    if (years < EXPERIENCE_THRESHOLDS.EXPERT) {
        return 'senior';
    }
    return 'expert';
}

/**
 * Gets experience level label
 * 
 * @param years - Years of teaching experience
 * @returns Human-readable experience level
 */
export function getExperienceLevelLabel(years: number | null): string {
    const level = getExperienceLevel(years);
    return EXPERIENCE_LEVEL_OPTIONS[level].label;
}

/**
 * Calculates average experience years for a group of teachers
 * 
 * @param teachers - Array of branch teachers
 * @returns Average experience years (0 if no data)
 */
export function calculateAverageExperience(teachers: BranchTeacher[]): number {
    const teachersWithExperience = teachers.filter(
        (t) => t.teaching_experience_years !== null
    );

    if (teachersWithExperience.length === 0) return 0;

    const totalExperience = teachersWithExperience.reduce(
        (sum, t) => sum + (t.teaching_experience_years || 0),
        0
    );

    return Number((totalExperience / teachersWithExperience.length).toFixed(1));
}

// ============================================================
// AVAILABILITY FUNCTIONS
// ============================================================

/**
 * Formats availability summary for display
 * 
 * @param days - Available days
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Formatted availability string
 */
export function formatAvailabilitySummary(
    days: DayOfWeek[] | null,
    startTime: string | null,
    endTime: string | null
): string {
    if (!days || days.length === 0) {
        return 'No availability set';
    }

    // Sort days by order
    const sortedDays = [...days].sort(
        (a, b) => DAYS_OF_WEEK_OPTIONS[a].order - DAYS_OF_WEEK_OPTIONS[b].order
    );

    // Get short day names
    const dayNames = sortedDays.map((d) => DAYS_OF_WEEK_OPTIONS[d].short);

    // Format day range (e.g., "Mon-Fri" or "Mon, Wed, Fri")
    let dayString: string;
    if (isConsecutiveDays(sortedDays)) {
        dayString = `${dayNames[0]}-${dayNames[dayNames.length - 1]}`;
    } else {
        dayString = dayNames.join(', ');
    }

    // Add time if available
    if (startTime && endTime) {
        const formattedStart = formatTime(startTime);
        const formattedEnd = formatTime(endTime);
        return `${dayString} (${formattedStart}-${formattedEnd})`;
    }

    return dayString;
}

/**
 * Checks if days are consecutive
 * 
 * @param days - Array of days (should be sorted)
 * @returns True if days are consecutive
 */
export function isConsecutiveDays(days: DayOfWeek[]): boolean {
    if (days.length <= 1) return true;

    for (let i = 1; i < days.length; i++) {
        const prevOrder = DAYS_OF_WEEK_OPTIONS[days[i - 1]].order;
        const currOrder = DAYS_OF_WEEK_OPTIONS[days[i]].order;
        if (currOrder - prevOrder !== 1) {
            return false;
        }
    }

    return true;
}

/**
 * Checks if teacher is available on a specific day
 * 
 * @param teacher - Branch teacher record
 * @param day - Day to check
 * @returns True if available
 */
export function isAvailableOnDay(teacher: BranchTeacher, day: DayOfWeek): boolean {
    if (!teacher.available_days || !teacher.is_active) {
        return false;
    }
    return teacher.available_days.includes(day);
}

/**
 * Gets teachers available on a specific day
 * 
 * @param teachers - Array of teachers
 * @param day - Day to filter by
 * @returns Teachers available on that day
 */
export function getTeachersAvailableOnDay(
    teachers: BranchTeacher[],
    day: DayOfWeek
): BranchTeacher[] {
    return teachers.filter((t) => isAvailableOnDay(t, day));
}

/**
 * Calculates total weekly hours for a teacher
 * 
 * @param teacher - Branch teacher record
 * @returns Total weekly hours (null if not calculable)
 */
export function calculateWeeklyHours(teacher: BranchTeacher): number | null {
    if (
        !teacher.available_days ||
        !teacher.available_start_time ||
        !teacher.available_end_time
    ) {
        return null;
    }

    const dailyHours = calculateTimeDifferenceHours(
        teacher.available_start_time,
        teacher.available_end_time
    );

    if (dailyHours === null) return null;

    return Number((dailyHours * teacher.available_days.length).toFixed(1));
}

/**
 * Calculates time difference in hours
 * 
 * @param startTime - Start time (HH:MM or HH:MM:SS)
 * @param endTime - End time (HH:MM or HH:MM:SS)
 * @returns Hours difference (null if invalid)
 */
export function calculateTimeDifferenceHours(
    startTime: string,
    endTime: string
): number | null {
    try {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        const diffMinutes = endMinutes - startMinutes;
        if (diffMinutes <= 0) return null;

        return Number((diffMinutes / 60).toFixed(2));
    } catch {
        return null;
    }
}

// ============================================================
// SUBJECT FUNCTIONS
// ============================================================

/**
 * Gets unique subjects across all teachers
 * 
 * @param teachers - Array of teachers
 * @returns Unique subject list
 */
export function getUniqueSubjects(teachers: BranchTeacher[]): string[] {
    const allSubjects = teachers.flatMap((t) => t.teaching_subjects);
    return [...new Set(allSubjects)].sort();
}

/**
 * Gets teachers by subject
 * 
 * @param teachers - Array of teachers
 * @param subject - Subject to filter by
 * @returns Teachers who teach that subject
 */
export function getTeachersBySubject(
    teachers: BranchTeacher[],
    subject: string
): BranchTeacher[] {
    const subjectLower = subject.toLowerCase().trim();
    return teachers.filter((t) =>
        t.teaching_subjects.some((s) => s.toLowerCase().trim() === subjectLower)
    );
}

/**
 * Checks if a subject is covered by at least one teacher
 * 
 * @param teachers - Array of teachers
 * @param subject - Subject to check
 * @returns True if covered
 */
export function isSubjectCovered(
    teachers: BranchTeacher[],
    subject: string
): boolean {
    return getTeachersBySubject(teachers, subject).some((t) => t.is_active);
}

/**
 * Calculates subject coverage statistics
 * 
 * @param teachers - Array of teachers
 * @returns Array of subject coverage stats
 */
export function calculateSubjectCoverageStats(
    teachers: BranchTeacher[]
): SubjectCoverageStats[] {
    const subjects = getUniqueSubjects(teachers);

    return subjects.map((subject) => {
        const subjectTeachers = getTeachersBySubject(teachers, subject);
        const totalExperience = subjectTeachers.reduce(
            (sum, t) => sum + (t.teaching_experience_years || 0),
            0
        );

        return {
            subject,
            teacher_count: subjectTeachers.length,
            total_experience_years: totalExperience,
            average_experience_years:
                subjectTeachers.length > 0
                    ? Number((totalExperience / subjectTeachers.length).toFixed(1))
                    : 0,
            teachers: subjectTeachers.map((t) => ({
                teacher_id: t.teacher_id,
                teacher_name: t.teacher_name,
                experience_years: t.teaching_experience_years,
            })),
        };
    });
}

// ============================================================
// STATISTICS CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculates teacher assignment summary
 * 
 * @param assignments - Array of teacher assignments
 * @returns Assignment summary statistics
 */
export function calculateTeacherAssignmentSummary(
    assignments: BranchTeacher[]
): TeacherAssignmentSummary {
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter((a) => a.is_active).length;

    const uniqueBranches = new Set(assignments.map((a) => a.branch_id));
    const allSubjects = [...new Set(assignments.flatMap((a) => a.teaching_subjects))];

    const assignmentsWithRate = assignments.filter((a) => a.hourly_rate !== null);
    const averageHourlyRate =
        assignmentsWithRate.length > 0
            ? Number(
                (
                    assignmentsWithRate.reduce((sum, a) => sum + (a.hourly_rate || 0), 0) /
                    assignmentsWithRate.length
                ).toFixed(2)
            )
            : null;

    return {
        total_assignments: totalAssignments,
        active_assignments: activeAssignments,
        total_branches: uniqueBranches.size,
        total_subjects: allSubjects,
        average_hourly_rate: averageHourlyRate,
    };
}

/**
 * Calculates branch teacher statistics
 * 
 * @param teachers - Array of branch teachers
 * @returns Branch-wide teacher statistics
 */
export function calculateBranchTeacherStats(teachers: BranchTeacher[]): BranchTeacherStats {
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter((t) => t.is_active).length;
    const inactiveTeachers = teachers.filter((t) => !t.is_active).length;

    // Teachers by subject
    const teachersBySubject: Record<string, number> = {};
    teachers.forEach((t) => {
        t.teaching_subjects.forEach((subject) => {
            teachersBySubject[subject] = (teachersBySubject[subject] || 0) + 1;
        });
    });

    // Teachers by experience level
    const teachersByExperience: Record<ExperienceLevel, number> = {
        entry: 0,
        intermediate: 0,
        senior: 0,
        expert: 0,
    };
    teachers.forEach((t) => {
        const level = getExperienceLevel(t.teaching_experience_years);
        teachersByExperience[level]++;
    });

    // Teachers by available day
    const teachersByAvailableDay: Record<DayOfWeek, number> = {
        MONDAY: 0,
        TUESDAY: 0,
        WEDNESDAY: 0,
        THURSDAY: 0,
        FRIDAY: 0,
        SATURDAY: 0,
        SUNDAY: 0,
    };
    teachers.forEach((t) => {
        if (t.available_days) {
            t.available_days.forEach((day) => {
                teachersByAvailableDay[day]++;
            });
        }
    });

    // Average experience
    const averageExperience = calculateAverageExperience(teachers);

    // Average hourly rate
    const teachersWithRate = teachers.filter((t) => t.hourly_rate !== null);
    const averageHourlyRate =
        teachersWithRate.length > 0
            ? Number(
                (
                    teachersWithRate.reduce((sum, t) => sum + (t.hourly_rate || 0), 0) /
                    teachersWithRate.length
                ).toFixed(2)
            )
            : null;

    return {
        total_teachers: totalTeachers,
        active_teachers: activeTeachers,
        inactive_teachers: inactiveTeachers,
        on_leave_teachers: 0, // Would need assignment_status field
        teachers_by_subject: teachersBySubject,
        teachers_by_experience: teachersByExperience,
        teachers_by_available_day: teachersByAvailableDay,
        average_experience_years: averageExperience,
        average_hourly_rate: averageHourlyRate,
    };
}

// ============================================================
// ATTENTION & FILTERING FUNCTIONS
// ============================================================

/**
 * Checks if teacher assignment is ending soon
 * 
 * @param teacher - Branch teacher record
 * @param daysAhead - Days threshold (default 30)
 * @returns True if assignment is ending soon
 */
export function isAssignmentEndingSoon(
    teacher: BranchTeacher,
    daysAhead: number = 30
): boolean {
    if (!teacher.assignment_end_date) return false;

    const endDate = new Date(teacher.assignment_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return endDate >= today && endDate <= futureDate;
}

/**
 * Gets teachers needing attention (inactive, ending soon)
 * 
 * @param teachers - Array of teachers
 * @param daysAhead - Days threshold for ending soon
 * @returns Teachers needing attention
 */
export function getTeachersNeedingAttention(
    teachers: BranchTeacher[],
    daysAhead: number = 30
): BranchTeacher[] {
    return teachers.filter(
        (t) => !t.is_active || isAssignmentEndingSoon(t, daysAhead)
    );
}

/**
 * Filters teachers by active status
 * 
 * @param teachers - Array of teachers
 * @param activeOnly - Whether to include only active teachers
 * @returns Filtered teachers
 */
export function filterActiveTeachers(
    teachers: BranchTeacher[],
    activeOnly: boolean = true
): BranchTeacher[] {
    return activeOnly ? teachers.filter((t) => t.is_active) : teachers;
}

/**
 * Filters teachers by experience level
 * 
 * @param teachers - Array of teachers
 * @param level - Experience level to filter by
 * @returns Teachers with that experience level
 */
export function filterByExperienceLevel(
    teachers: BranchTeacher[],
    level: ExperienceLevel
): BranchTeacher[] {
    return teachers.filter(
        (t) => getExperienceLevel(t.teaching_experience_years) === level
    );
}

// ============================================================
// FORMATTING FUNCTIONS
// ============================================================

/**
 * Formats time from HH:MM:SS to HH:MM AM/PM
 * 
 * @param time - Time string (HH:MM or HH:MM:SS)
 * @returns Formatted time string
 */
export function formatTime(time: string): string {
    try {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
        return time;
    }
}

/**
 * Formats currency amount
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: INR)
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number | null,
    currency: string = 'INR'
): string {
    if (amount === null) return 'N/A';

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formats phone number for display
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null): string {
    if (!phone) return 'N/A';

    // If it's an Indian number, format it nicely
    if (phone.startsWith('+91') && phone.length === 13) {
        return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }

    return phone;
}

/**
 * Formats date for display
 * 
 * @param dateString - ISO date string
 * @param format - Format style ('short' | 'long' | 'full')
 * @returns Formatted date string
 */
export function formatDate(
    dateString: string | null,
    format: 'short' | 'long' | 'full' = 'short'
): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const optionsMap: Record<'short' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
        short: { day: '2-digit', month: 'short', year: 'numeric' },
        long: { day: '2-digit', month: 'long', year: 'numeric' },
        full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    };

    return date.toLocaleDateString('en-IN', optionsMap[format]);
}

/**
 * Formats experience years for display
 * 
 * @param years - Years of experience
 * @returns Formatted experience string
 */
export function formatExperience(years: number | null): string {
    if (years === null) return 'Not specified';
    if (years === 0) return 'Fresher';
    if (years === 1) return '1 year';
    return `${years} years`;
}

/**
 * Formats subjects array for display
 * 
 * @param subjects - Array of subjects
 * @param maxDisplay - Maximum subjects to display (rest shown as +N more)
 * @returns Formatted subjects string
 */
export function formatSubjects(
    subjects: string[],
    maxDisplay: number = 3
): string {
    if (subjects.length === 0) return 'No subjects';
    if (subjects.length <= maxDisplay) return subjects.join(', ');

    const displayed = subjects.slice(0, maxDisplay).join(', ');
    const remaining = subjects.length - maxDisplay;
    return `${displayed} +${remaining} more`;
}

/**
 * Formats available days for display
 * 
 * @param days - Array of available days
 * @returns Formatted days string
 */
export function formatAvailableDays(days: DayOfWeek[] | null): string {
    if (!days || days.length === 0) return 'No days set';

    const sortedDays = [...days].sort(
        (a, b) => DAYS_OF_WEEK_OPTIONS[a].order - DAYS_OF_WEEK_OPTIONS[b].order
    );

    return sortedDays.map((d) => DAYS_OF_WEEK_OPTIONS[d].short).join(', ');
}

// ============================================================
// SORTING FUNCTIONS
// ============================================================

/**
 * Sorts teachers by experience (descending)
 * 
 * @param teachers - Array of teachers
 * @returns Sorted array
 */
export function sortByExperience(teachers: BranchTeacher[]): BranchTeacher[] {
    return [...teachers].sort(
        (a, b) => (b.teaching_experience_years || 0) - (a.teaching_experience_years || 0)
    );
}

/**
 * Sorts teachers by name (ascending)
 * 
 * @param teachers - Array of teachers
 * @returns Sorted array
 */
export function sortByName(teachers: BranchTeacher[]): BranchTeacher[] {
    return [...teachers].sort((a, b) =>
        a.teacher_name.localeCompare(b.teacher_name)
    );
}

/**
 * Sorts teachers by assignment date (newest first)
 * 
 * @param teachers - Array of teachers
 * @returns Sorted array
 */
export function sortByAssignmentDate(teachers: BranchTeacher[]): BranchTeacher[] {
    return [...teachers].sort(
        (a, b) => new Date(b.assignment_date).getTime() - new Date(a.assignment_date).getTime()
    );
}

/**
 * Sorts teachers by hourly rate (highest first)
 * 
 * @param teachers - Array of teachers
 * @returns Sorted array
 */
export function sortByHourlyRate(teachers: BranchTeacher[]): BranchTeacher[] {
    return [...teachers].sort(
        (a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0)
    );
}
