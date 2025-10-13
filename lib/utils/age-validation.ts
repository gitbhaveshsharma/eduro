/**
 * Age Validation Utility
 * 
 * Utility functions for validating age based on user role
 */

export type UserRole = 'SA' | 'A' | 'S' | 'T' | 'C';

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    
    return age
}

/**
 * Validate age based on user role
 * Returns error message if invalid, null if valid
 */
export function validateAgeForRole(dateOfBirth: string, role: UserRole): string | null {
    if (!dateOfBirth || !role) return null
    
    const age = calculateAge(dateOfBirth)
    
    switch (role) {
        case 'S': // Student
            if (age < 5 || age > 26) {
                return `Students must be between 5 and 26 years old (current age: ${age})`
            }
            break
        case 'T': // Teacher
        case 'C': // Coach/Coaching Center
            if (age < 15) {
                return `Teachers and Coaches must be at least 15 years old (current age: ${age})`
            }
            break
        case 'SA': // Super Admin
        case 'A': // Admin
            // No age restrictions for admin roles
            break
    }
    
    return null
}

/**
 * Check if a profile has valid age for their role
 */
export function isValidProfileAge(profile: { date_of_birth: string | null, role: UserRole }): boolean {
    if (!profile.date_of_birth) return true // Allow null dates for now
    
    const error = validateAgeForRole(profile.date_of_birth, profile.role)
    return error === null
}

/**
 * Validate age and show user-friendly message
 */
export function getAgeValidationResult(dateOfBirth: string, role: UserRole): {
    isValid: boolean;
    message: string;
    currentAge: number;
} {
    const currentAge = calculateAge(dateOfBirth)
    const error = validateAgeForRole(dateOfBirth, role)
    
    if (error) {
        return {
            isValid: false,
            message: error,
            currentAge
        }
    }
    
    let validRangeMsg = ''
    switch (role) {
        case 'S':
            validRangeMsg = 'Students: 5-26 years old'
            break
        case 'T':
        case 'C':
            validRangeMsg = 'Teachers/Coaches: 15+ years old'
            break
        default:
            validRangeMsg = 'No age restrictions'
    }
    
    return {
        isValid: true,
        message: `Valid age for ${role === 'S' ? 'Student' : role === 'T' ? 'Teacher' : role === 'C' ? 'Coach' : 'Admin'} (${validRangeMsg})`,
        currentAge
    }
}