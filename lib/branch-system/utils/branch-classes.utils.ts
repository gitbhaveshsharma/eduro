/**
 * Branch Classes Utility Functions
 * 
 * Helper functions for branch class operations, formatting, and calculations
 * Pure functions with no side effects
 * 
 * @module branch-system/utils/branch-classes
 */

import type {
    BranchClass,
    PublicBranchClass,
    ClassStatus,
    DayOfWeek,
    FeeFrequency,
    ClassAvailability,
    ClassScheduleInfo,
    BranchClassStats,
} from '../types/branch-classes.types';

// ============================================================
// FORMATTING UTILITIES
// ============================================================

/**
 * Formats a time string to 12-hour format with AM/PM
 * @param time - Time in HH:MM:SS or HH:MM format
 * @returns Formatted time string (e.g., "02:30 PM")
 */
export function formatTime(time: string | null | undefined): string {
    if (!time) return '--';

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats a time string to 24-hour format
 * @param time - Time in HH:MM:SS or HH:MM format
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime24(time: string | null | undefined): string {
    if (!time) return '--';

    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
}

/**
 * Formats a date string to readable format
 * @param date - ISO date string
 * @param format - Format option ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export function formatDate(
    date: string | null | undefined,
    format: 'short' | 'medium' | 'long' = 'medium'
): string {
    if (!date) return '--';

    const dateObj = new Date(date);

    const options: Intl.DateTimeFormatOptions = {
        short: { month: 'short', day: 'numeric', year: 'numeric' },
        medium: { month: 'long', day: 'numeric', year: 'numeric' },
        long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    }[format] as Intl.DateTimeFormatOptions;

    return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Formats class days array to readable string
 * @param days - Array of day names
 * @returns Formatted string (e.g., "Mon, Wed, Fri")
 */
export function formatClassDays(days: DayOfWeek[] | null | undefined): string {
    if (!days || days.length === 0) return 'Not scheduled';

    // Sort days by week order
    const weekOrder: Record<DayOfWeek, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7,
    };

    const sortedDays = [...days].sort((a, b) => weekOrder[a] - weekOrder[b]);

    // Use abbreviations
    const abbreviations: Record<DayOfWeek, string> = {
        Monday: 'Mon',
        Tuesday: 'Tue',
        Wednesday: 'Wed',
        Thursday: 'Thu',
        Friday: 'Fri',
        Saturday: 'Sat',
        Sunday: 'Sun',
    };

    return sortedDays.map((day) => abbreviations[day]).join(', ');
}

/**
 * Formats class schedule as readable string
 * @param branchClass - Branch class object
 * @returns Formatted schedule string
 */
export function formatClassSchedule(branchClass: BranchClass | PublicBranchClass): string {
    const days = formatClassDays(branchClass.class_days);
    const time = branchClass.start_time && branchClass.end_time
        ? `${formatTime(branchClass.start_time)} - ${formatTime(branchClass.end_time)}`
        : 'Time not set';

    return `${days} • ${time}`;
}

/**
 * Formats fee frequency to readable string
 * @param frequency - Fee frequency enum
 * @returns Readable frequency string
 */
export function formatFeeFrequency(frequency: FeeFrequency): string {
    const labels: Record<FeeFrequency, string> = {
        MONTHLY: 'Monthly',
        QUARTERLY: 'Quarterly',
        YEARLY: 'Yearly',
    };

    return labels[frequency];
}

/**
 * Formats class status to readable string with styling info
 * @param status - Class status enum
 * @returns Object with label and color
 */
export function formatClassStatus(status: ClassStatus): {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
    description: string;
} {
    const statusInfo: Record<ClassStatus, { label: string; color: 'green' | 'yellow' | 'red' | 'gray'; description: string }> = {
        ACTIVE: {
            label: 'Active',
            color: 'green',
            description: 'Class is active and accepting students',
        },
        INACTIVE: {
            label: 'Inactive',
            color: 'yellow',
            description: 'Class is temporarily inactive',
        },
        FULL: {
            label: 'Full',
            color: 'red',
            description: 'Class has reached maximum capacity',
        },
        COMPLETED: {
            label: 'Completed',
            color: 'gray',
            description: 'Class has been completed',
        },
    };

    return statusInfo[status];
}

// ============================================================
// CALCULATION UTILITIES
// ============================================================

/**
 * Calculates available seats in a class
 * @param branchClass - Branch class object
 * @returns Number of available seats
 */
export function calculateAvailableSeats(branchClass: BranchClass | PublicBranchClass): number {
    return Math.max(0, branchClass.max_students - branchClass.current_enrollment);
}

/**
 * Calculates class capacity utilization percentage
 * @param branchClass - Branch class object
 * @returns Utilization percentage (0-100)
 */
export function calculateUtilization(branchClass: BranchClass | PublicBranchClass): number {
    if (branchClass.max_students === 0) return 0;
    return Math.round((branchClass.current_enrollment / branchClass.max_students) * 100);
}

/**
 * Calculates duration of class in minutes
 * @param startTime - Start time (HH:MM:SS or HH:MM)
 * @param endTime - End time (HH:MM:SS or HH:MM)
 * @returns Duration in minutes
 */
export function calculateClassDuration(
    startTime: string | null | undefined,
    endTime: string | null | undefined
): number {
    if (!startTime || !endTime) return 0;

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
}

/**
 * Formats class duration to readable string
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Formatted duration string (e.g., "1h 30m")
 */
export function formatClassDuration(
    startTime: string | null | undefined,
    endTime: string | null | undefined
): string {
    const minutes = calculateClassDuration(startTime, endTime);

    if (minutes === 0) return '--';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculates total weekly hours for a class
 * @param branchClass - Branch class object
 * @returns Total weekly hours
 */
export function calculateWeeklyHours(branchClass: BranchClass | PublicBranchClass): number {
    const daysPerWeek = branchClass.class_days?.length || 0;
    const minutesPerClass = calculateClassDuration(branchClass.start_time, branchClass.end_time);
    const totalMinutesPerWeek = daysPerWeek * minutesPerClass;

    return Math.round((totalMinutesPerWeek / 60) * 10) / 10; // Round to 1 decimal
}

// ============================================================
// VALIDATION & CHECKING UTILITIES
// ============================================================

/**
 * Checks if a class is full
 * @param branchClass - Branch class object
 * @returns True if class is full
 */
export function isClassFull(branchClass: BranchClass | PublicBranchClass): boolean {
    return branchClass.current_enrollment >= branchClass.max_students;
}

/**
 * Checks if a class is available for enrollment
 * @param branchClass - Branch class object
 * @returns True if class is available
 */
export function isClassAvailable(branchClass: BranchClass | PublicBranchClass): boolean {
    const isVisible = 'is_visible' in branchClass ? branchClass.is_visible : true;

    return (
        branchClass.status === 'ACTIVE' &&
        isVisible &&
        !isClassFull(branchClass)
    );
}

/**
 * Gets class availability information
 * @param branchClass - Branch class object
 * @returns Availability information object
 */
export function getClassAvailability(branchClass: BranchClass | PublicBranchClass): ClassAvailability {
    const isFull = isClassFull(branchClass);
    const availableSeats = calculateAvailableSeats(branchClass);
    const isVisible = 'is_visible' in branchClass ? branchClass.is_visible : true;

    let canEnroll = true;
    let reason: string | undefined;

    if (branchClass.status !== 'ACTIVE') {
        canEnroll = false;
        reason = `Class is ${branchClass.status.toLowerCase()}`;
    } else if (!isVisible) {
        canEnroll = false;
        reason = 'Class is not visible';
    } else if (isFull) {
        canEnroll = false;
        reason = 'Class is full';
    }

    return {
        class_id: branchClass.id,
        is_available: canEnroll,
        available_seats: availableSeats,
        is_full: isFull,
        can_enroll: canEnroll,
        reason,
    };
}

/**
 * Checks if class has started
 * @param branchClass - Branch class object
 * @returns True if class has started
 */
export function hasClassStarted(branchClass: BranchClass | PublicBranchClass): boolean {
    if (!branchClass.start_date) return false;
    return new Date(branchClass.start_date) <= new Date();
}

/**
 * Checks if class has ended
 * @param branchClass - Branch class object
 * @returns True if class has ended
 */
export function hasClassEnded(branchClass: BranchClass | PublicBranchClass): boolean {
    if (!branchClass.end_date) return false;
    return new Date(branchClass.end_date) < new Date();
}

/**
 * Gets class time status
 * @param branchClass - Branch class object
 * @returns Status string
 */
export function getClassTimeStatus(branchClass: BranchClass | PublicBranchClass): 'upcoming' | 'ongoing' | 'completed' {
    if (hasClassEnded(branchClass)) return 'completed';
    if (hasClassStarted(branchClass)) return 'ongoing';
    return 'upcoming';
}

// ============================================================
// TRANSFORMATION UTILITIES
// ============================================================

/**
 * Converts BranchClass to PublicBranchClass
 * @param branchClass - Full branch class object
 * @returns Public branch class object
 */
export function toPublicBranchClass(branchClass: BranchClass | BranchClass & { branch?: any; teacher?: any }): PublicBranchClass {
    const base: PublicBranchClass = {
        id: branchClass.id,
        branch_id: branchClass.branch_id,
        class_name: branchClass.class_name,
        subject: branchClass.subject,
        description: branchClass.description,
        grade_level: branchClass.grade_level,
        batch_name: branchClass.batch_name,
        start_date: branchClass.start_date,
        end_date: branchClass.end_date,
        class_days: branchClass.class_days,
        start_time: branchClass.start_time,
        end_time: branchClass.end_time,
        max_students: branchClass.max_students,
        current_enrollment: branchClass.current_enrollment,
        fees_frequency: branchClass.fees_frequency,
        status: branchClass.status,
        prerequisites: branchClass.prerequisites,
        materials_required: branchClass.materials_required,
        created_at: branchClass.created_at,
        updated_at: branchClass.updated_at,
        is_full: isClassFull(branchClass),
        available_seats: calculateAvailableSeats(branchClass),
    };

    // Map optional relation: branch
    if ((branchClass as any).branch) {
        try {
            const b = (branchClass as any).branch;
            base.branch = {
                id: b.id,
                name: b.name,
                coaching_center_id: b.coaching_center_id,
            };
        } catch (err) {
            // ignore if unexpected shape
        }
    }

    // Map optional relation: teacher
    if ((branchClass as any).teacher) {
        try {
            const t = (branchClass as any).teacher;
            base.teacher = {
                id: t.id,
                full_name: t.full_name || t.name || null,
                username: t.username || null,
                avatar_url: t.avatar_url ?? null,
            };
        } catch (err) {
            // ignore if unexpected shape
        }
    }

    return base;
}

/**
 * Creates class schedule info from branch class
 * @param branchClass - Branch class object
 * @param teacherName - Teacher's name (optional)
 * @returns Array of schedule info objects (one per class day)
 */
export function createClassScheduleInfo(
    branchClass: BranchClass | PublicBranchClass,
    teacherName: string | null = null
): ClassScheduleInfo[] {
    if (!branchClass.class_days || !branchClass.start_time || !branchClass.end_time) {
        return [];
    }

    const durationMinutes = calculateClassDuration(branchClass.start_time, branchClass.end_time);

    return branchClass.class_days.map((day) => ({
        class_id: branchClass.id,
        class_name: branchClass.class_name,
        subject: branchClass.subject,
        day,
        start_time: branchClass.start_time!,
        end_time: branchClass.end_time!,
        duration_minutes: durationMinutes,
        teacher_name: teacherName,
    }));
}

// ============================================================
// FILTERING & SORTING UTILITIES
// ============================================================

/**
 * Filters classes by search query
 * @param classes - Array of branch classes
 * @param query - Search query string
 * @returns Filtered array
 */
export function filterClassesBySearch(
    classes: (BranchClass | PublicBranchClass)[],
    query: string
): (BranchClass | PublicBranchClass)[] {
    if (!query || query.trim() === '') return classes;

    const lowerQuery = query.toLowerCase().trim();

    return classes.filter((cls) => {
        return (
            cls.class_name.toLowerCase().includes(lowerQuery) ||
            cls.subject.toLowerCase().includes(lowerQuery) ||
            cls.grade_level.toLowerCase().includes(lowerQuery) ||
            (cls.description && cls.description.toLowerCase().includes(lowerQuery)) ||
            (cls.batch_name && cls.batch_name.toLowerCase().includes(lowerQuery))
        );
    });
}

/**
 * Sorts classes by field
 * @param classes - Array of branch classes
 * @param field - Field to sort by
 * @param direction - Sort direction
 * @returns Sorted array
 */
export function sortClasses<T extends BranchClass | PublicBranchClass>(
    classes: T[],
    field: keyof T,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    const sorted = [...classes].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return aVal - bVal;
        }

        return 0;
    });

    return direction === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Groups classes by subject
 * @param classes - Array of branch classes
 * @returns Object with subjects as keys and class arrays as values
 */
export function groupClassesBySubject(
    classes: (BranchClass | PublicBranchClass)[]
): Record<string, (BranchClass | PublicBranchClass)[]> {
    return classes.reduce((groups, cls) => {
        const subject = cls.subject;
        if (!groups[subject]) {
            groups[subject] = [];
        }
        groups[subject].push(cls);
        return groups;
    }, {} as Record<string, (BranchClass | PublicBranchClass)[]>);
}

/**
 * Groups classes by grade level
 * @param classes - Array of branch classes
 * @returns Object with grade levels as keys and class arrays as values
 */
export function groupClassesByGrade(
    classes: (BranchClass | PublicBranchClass)[]
): Record<string, (BranchClass | PublicBranchClass)[]> {
    return classes.reduce((groups, cls) => {
        const grade = cls.grade_level;
        if (!groups[grade]) {
            groups[grade] = [];
        }
        groups[grade].push(cls);
        return groups;
    }, {} as Record<string, (BranchClass | PublicBranchClass)[]>);
}

// ============================================================
// STATISTICS UTILITIES
// ============================================================

/**
 * Calculates statistics for an array of classes
 * @param classes - Array of branch classes
 * @returns Statistics object
 */
export function calculateClassStats(classes: (BranchClass | PublicBranchClass)[]): BranchClassStats {
    const totalClasses = classes.length;
    const activeClasses = classes.filter((c) => c.status === 'ACTIVE').length;
    const inactiveClasses = classes.filter((c) => c.status === 'INACTIVE').length;
    const fullClasses = classes.filter((c) => c.status === 'FULL').length;
    const completedClasses = classes.filter((c) => c.status === 'COMPLETED').length;

    const totalStudentsEnrolled = classes.reduce((sum, c) => sum + c.current_enrollment, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + c.max_students, 0);
    const averageUtilization = totalCapacity > 0
        ? Math.round((totalStudentsEnrolled / totalCapacity) * 100)
        : 0;

    const classesBySubject = classes.reduce((acc, cls) => {
        acc[cls.subject] = (acc[cls.subject] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const classesByGrade = classes.reduce((acc, cls) => {
        acc[cls.grade_level] = (acc[cls.grade_level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const classesByStatus = classes.reduce((acc, cls) => {
        acc[cls.status] = (acc[cls.status] || 0) + 1;
        return acc;
    }, {} as Record<ClassStatus, number>);

    return {
        total_classes: totalClasses,
        active_classes: activeClasses,
        inactive_classes: inactiveClasses,
        full_classes: fullClasses,
        completed_classes: completedClasses,
        total_students_enrolled: totalStudentsEnrolled,
        total_capacity: totalCapacity,
        average_utilization: averageUtilization,
        classes_by_subject: classesBySubject,
        classes_by_grade: classesByGrade,
        classes_by_status: classesByStatus,
    };
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/**
 * Generates a display name for a class
 * @param branchClass - Branch class object
 * @returns Display name string
 */
export function getClassDisplayName(branchClass: BranchClass | PublicBranchClass): string {
    const parts = [branchClass.class_name];

    if (branchClass.batch_name) {
        parts.push(`(${branchClass.batch_name})`);
    }

    return parts.join(' ');
}

/**
 * Generates a subtitle for a class
 * @param branchClass - Branch class object
 * @returns Subtitle string
 */
export function getClassSubtitle(branchClass: BranchClass | PublicBranchClass): string {
    return `${branchClass.subject} • ${branchClass.grade_level}`;
}

/**
 * Generates capacity display string
 * @param branchClass - Branch class object
 * @returns Capacity string (e.g., "25/30 students")
 */
export function getCapacityDisplay(branchClass: BranchClass | PublicBranchClass): string {
    return `${branchClass.current_enrollment}/${branchClass.max_students} students`;
}

/**
 * Generates availability badge text
 * @param branchClass - Branch class object
 * @returns Badge text
 */
export function getAvailabilityBadgeText(branchClass: BranchClass | PublicBranchClass): string {
    const availableSeats = calculateAvailableSeats(branchClass);

    if (availableSeats === 0) return 'Full';
    if (availableSeats <= 5) return `${availableSeats} seats left`;

    return 'Available';
}

// ============================================================
// UPCOMING CLASSES MAPPING
// ============================================================

/**
 * Maps subject name to SubjectId for the UI
 * @param subject - Subject name from database
 * @returns SubjectId compatible with UI types
 */
export function mapSubjectToId(subject: string): string {
    const subjectMap: Record<string, string> = {
        'Mathematics': 'mathematics',
        'Math': 'mathematics',
        'Physics': 'physics',
        'Chemistry': 'chemistry',
        'Biology': 'biology',
        'English': 'english',
        'Hindi': 'hindi',
        'History': 'history',
        'Geography': 'geography',
        'Science': 'science',
        'Computer Science': 'computer',
        'Computer': 'computer',
        'Accountancy': 'accountancy',
        'Business Studies': 'business_studies',
        'Economics': 'economics',
        'Music': 'music',
        'Physical Education': 'physical_education',
        'Moral Science': 'moral_science',
        'Environmental Science': 'environmental',
        'Social Studies': 'social_studies',
        'Art and Craft': 'art_and_craft',
    };

    return subjectMap[subject] || 'science';
}

/**
 * Gets subject color class based on subject ID
 * @param subjectId - Subject identifier
 * @returns Tailwind color class
 */
export function getSubjectColor(subjectId: string): string {
    const colorMap: Record<string, string> = {
        'mathematics': 'bg-blue-100 text-blue-800',
        'physics': 'bg-indigo-100 text-indigo-800',
        'chemistry': 'bg-purple-100 text-purple-800',
        'biology': 'bg-green-100 text-green-800',
        'english': 'bg-orange-100 text-orange-800',
        'hindi': 'bg-red-100 text-red-800',
        'history': 'bg-amber-100 text-amber-800',
        'geography': 'bg-teal-100 text-teal-800',
        'science': 'bg-emerald-100 text-emerald-800',
        'computer': 'bg-cyan-100 text-cyan-800',
        'accountancy': 'bg-lime-100 text-lime-800',
        'business_studies': 'bg-green-100 text-green-800',
        'economics': 'bg-yellow-100 text-yellow-800',
    };

    return colorMap[subjectId] || 'bg-gray-100 text-gray-800';
}

/**
 * Maps UpcomingClassData from RPC to UpcomingClass UI type
 * @param data - Data from get_upcoming_classes RPC
 * @param index - Optional index for avatar variation
 * @returns UpcomingClass object for UI display
 */
export function mapUpcomingClassData(
    data: import('../types/branch-classes.types').UpcomingClassData,
    index: number = 0
): {
    id: string;
    title: string;
    subject: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
    startTime: string;
    participants: {
        avatars: string[];
        count: number;
    };
} {
    const subjectId = mapSubjectToId(data.subject);
    const subjectColor = getSubjectColor(subjectId);

    // Static dummy avatars pool
    const dummyAvatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    ];

    // Select 3 avatars based on index to vary across classes
    const selectedAvatars = [
        dummyAvatars[index % dummyAvatars.length],
        dummyAvatars[(index + 1) % dummyAvatars.length],
        dummyAvatars[(index + 2) % dummyAvatars.length],
    ];

    // Generate dummy participant count (25-45 students)
    const dummyCount = 25 + Math.floor(Math.random() * 21);

    // Capitalize class name - title case each word
    const capitalizedClassName = data.class_name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Capitalize subject name
    const capitalizedSubject = data.subject
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return {
        id: data.class_id,
        title: capitalizedClassName, 
        subject: {
            id: subjectId,
            name: capitalizedSubject, 
            icon: '📚',
            color: subjectColor,
        },
        startTime: formatTime(data.start_time),
        participants: {
            avatars: selectedAvatars,
            count: dummyCount,
        },
    };
}
