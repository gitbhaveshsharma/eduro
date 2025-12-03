'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, X, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import { cn } from '@/lib/utils';

/**
 * Student enrollment data from the student_enrollment_details view
 */
interface StudentEnrollment {
    enrollment_id: string;
    student_id: string;
    student_name: string | null;
    student_username: string | null;
    branch_id: string;
    branch_name: string | null;
    coaching_center_name: string | null;
    class_id: string | null;
    class_name: string | null;
    subject: string | null;
    enrollment_status: string;
    avatar_url?: string | null;
}

interface StudentSearchProps {
    /** Coaching center ID to filter students */
    coachingCenterId?: string;
    /** Branch ID to filter students */
    branchId?: string;
    /** Class ID to filter students */
    classId?: string;
    /** Currently selected student */
    selectedStudent?: StudentEnrollment | null;
    /** Callback when student is selected */
    onSelect: (student: StudentEnrollment | null) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Show only enrolled students */
    enrolledOnly?: boolean;
    /** Disable the search */
    disabled?: boolean;
}

export default function StudentSearch({
    coachingCenterId,
    branchId,
    classId,
    selectedStudent,
    onSelect,
    placeholder = 'Search by username or name...',
    enrolledOnly = true,
    disabled = false,
}: StudentSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<StudentEnrollment[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const supabase = createClient();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search function
    const searchStudents = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        // Need at least coaching center or branch context
        if (!coachingCenterId && !branchId) {
            setError('No context available for search');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Build query using the student_enrollment_details view
            let dbQuery = supabase
                .from('student_enrollment_details')
                .select(`
                    enrollment_id,
                    student_id,
                    student_name,
                    student_username,
                    branch_id,
                    branch_name,
                    coaching_center_name,
                    class_id,
                    class_name,
                    subject,
                    enrollment_status
                `)
                .or(`student_username.ilike.%${query}%,student_name.ilike.%${query}%`);

            // Apply context filters
            if (branchId) {
                dbQuery = dbQuery.eq('branch_id', branchId);
            } else if (coachingCenterId) {
                // For coaching center, we need to get all branches first
                // The view should have a coaching_center_id or we filter by branches
                // Since the view joins through branches, we can use coaching_center_name
                // But better to filter by branches belonging to the coaching center

                // Get branches for this coaching center first
                const { data: branches } = await supabase
                    .from('coaching_branches')
                    .select('id')
                    .eq('coaching_center_id', coachingCenterId)
                    .eq('status', 'ACTIVE');

                if (branches && branches.length > 0) {
                    const branchIds = branches.map((b: { id: string }) => b.id);
                    dbQuery = dbQuery.in('branch_id', branchIds);
                }
            }

            // Filter by class if provided
            if (classId) {
                dbQuery = dbQuery.eq('class_id', classId);
            }

            // Filter by enrollment status if enrolledOnly
            if (enrolledOnly) {
                dbQuery = dbQuery.eq('enrollment_status', 'ENROLLED');
            }

            // Limit results
            dbQuery = dbQuery.limit(10);

            const { data, error: queryError } = await dbQuery;

            if (queryError) {
                console.error('Search error:', queryError);
                setError('Failed to search students');
                setResults([]);
            } else {
                // Fetch avatar URLs for the results
                const studentIds = (data || []).map((s: StudentEnrollment) => s.student_id);
                let avatarMap: Record<string, string | null> = {};

                if (studentIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, avatar_url')
                        .in('id', studentIds);

                    if (profiles) {
                        avatarMap = profiles.reduce((acc: Record<string, string | null>, p: { id: string; avatar_url: string | null }) => {
                            acc[p.id] = p.avatar_url;
                            return acc;
                        }, {} as Record<string, string | null>);
                    }
                }

                const resultsWithAvatars = (data || []).map((s: StudentEnrollment) => ({
                    ...s,
                    avatar_url: avatarMap[s.student_id] || null,
                }));

                setResults(resultsWithAvatars);
                setShowResults(true);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [supabase, coachingCenterId, branchId, classId, enrolledOnly]);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchStudents(value);
        }, 300);
    };

    // Handle student selection
    const handleSelect = (student: StudentEnrollment) => {
        onSelect(student);
        setSearchQuery('');
        setShowResults(false);
        setResults([]);
    };

    // Clear selection
    const handleClear = () => {
        onSelect(null);
        setSearchQuery('');
        inputRef.current?.focus();
    };

    return (
        <div ref={searchRef} className="relative">
            {/* Selected Student Display */}
            {selectedStudent ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {selectedStudent.avatar_url ? (
                            <img
                                src={AvatarUtils.getSafeAvatarUrl(
                                    selectedStudent.avatar_url,
                                    selectedStudent.student_name || 'S'
                                )}
                                alt={selectedStudent.student_name || 'Student'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                            {selectedStudent.student_name || 'Unknown Student'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {selectedStudent.student_username && (
                                <span>@{selectedStudent.student_username}</span>
                            )}
                            {selectedStudent.class_name && (
                                <Badge variant="outline" className="text-xs">
                                    {selectedStudent.class_name}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        disabled={disabled}
                        className="shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                /* Search Input */
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        disabled={disabled}
                        className="pl-10 pr-10"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            )}

            {/* Search Results Dropdown */}
            {showResults && !selectedStudent && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                    {error ? (
                        <div className="p-4 text-center text-sm text-destructive">
                            {error}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {searchQuery.length < 2
                                ? 'Type at least 2 characters to search'
                                : 'No students found'}
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[300px]">
                            <div className="p-1">
                                {results.map((student) => (
                                    <button
                                        key={student.enrollment_id}
                                        type="button"
                                        onClick={() => handleSelect(student)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left",
                                            "focus:outline-none focus:bg-muted/50"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {student.avatar_url ? (
                                                <img
                                                    src={AvatarUtils.getSafeAvatarUrl(
                                                        student.avatar_url,
                                                        student.student_name || 'S'
                                                    )}
                                                    alt={student.student_name || 'Student'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium">
                                                    {(student.student_name || 'S').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {student.student_name || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {student.student_username && (
                                                    <span>@{student.student_username}</span>
                                                )}
                                                {student.branch_name && (
                                                    <span className="truncate">• {student.branch_name}</span>
                                                )}
                                            </div>
                                        </div>
                                        {student.class_name && (
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {student.class_name}
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Loading skeleton for student search
 */
export function StudentSearchSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
        </div>
    );
}
