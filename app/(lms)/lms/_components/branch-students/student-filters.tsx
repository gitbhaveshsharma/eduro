/**
 * Student Filters Component
 * 
 * Advanced filtering controls for the students list
 * Features: Search, status filters, payment filters, attendance range
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { BranchStudentFilters, PaymentStatus } from '@/lib/branch-system/types/branch-students.types';
import { PAYMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/branch-students.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, RefreshCw } from 'lucide-react';

/**
 * Props for Student Filters Component
 */
interface StudentFiltersProps {
    /** When provided, filters for a single branch (branch manager view) */
    branchId?: string;
    /** When provided, filters across all branches (coach/owner view) */
    coachingCenterId?: string;
}

/**
 * Main Student Filters Component - Same style as ClassFilters
 */
export function StudentFilters({ branchId, coachingCenterId }: StudentFiltersProps = {}) {
    const { setFilters, fetchCoachingCenterStudents, fetchBranchStudents } = useBranchStudentsStore();

    // Local state for immediate UI updates
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] = useState<ClassEnrollmentStatus | 'all'>('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');
    const [selectedAttendanceMin, setSelectedAttendanceMin] = useState<string>('');
    const [selectedAttendanceMax, setSelectedAttendanceMax] = useState<string>('');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);

    // Track if this is the initial mount to avoid unnecessary fetches
    const isInitialMount = useRef(true);

    // Build filters object from current state
    const buildFilters = useCallback((overrides?: Partial<{
        search: string;
        enrollment: ClassEnrollmentStatus | 'all';
        payment: PaymentStatus | 'all';
        attendanceMin: string;
        attendanceMax: string;
        overdue: boolean;
    }>): BranchStudentFilters => {
        const search = overrides?.search ?? searchQuery;
        const enrollment = overrides?.enrollment ?? selectedEnrollmentStatus;
        const payment = overrides?.payment ?? selectedPaymentStatus;
        const attMin = overrides?.attendanceMin ?? selectedAttendanceMin;
        const attMax = overrides?.attendanceMax ?? selectedAttendanceMax;
        const overdue = overrides?.overdue ?? showOverdueOnly;

        const newFilters: BranchStudentFilters = {};

        if (search.trim()) {
            newFilters.search_query = search.trim();
        }

        if (enrollment !== 'all') {
            newFilters.enrollment_status = enrollment;
        }

        if (payment !== 'all') {
            newFilters.payment_status = payment;
        }

        if (attMin) {
            newFilters.attendance_min = Number(attMin);
        }

        if (attMax) {
            newFilters.attendance_max = Number(attMax);
        }

        if (overdue) {
            newFilters.has_overdue_payment = true;
        }

        return newFilters;
    }, [searchQuery, selectedEnrollmentStatus, selectedPaymentStatus, selectedAttendanceMin, selectedAttendanceMax, showOverdueOnly]);

    // Apply filters and fetch data
    const applyFiltersAndFetch = useCallback((filters: BranchStudentFilters) => {
        const hasFilters = Object.keys(filters).length > 0;
        setFilters(hasFilters ? filters : null);

        // Re-fetch students with new filters based on view type
        if (branchId) {
            fetchBranchStudents(branchId, hasFilters ? filters : undefined);
        } else if (coachingCenterId) {
            fetchCoachingCenterStudents(coachingCenterId, hasFilters ? filters : undefined);
        }
    }, [branchId, coachingCenterId, setFilters, fetchBranchStudents, fetchCoachingCenterStudents]);

    // Debounced search effect
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            const filters = buildFilters();
            applyFiltersAndFetch(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, buildFilters, applyFiltersAndFetch]);

    // Handle enrollment status change
    const handleEnrollmentStatusChange = useCallback((value: string) => {
        const newStatus = value as ClassEnrollmentStatus | 'all';
        setSelectedEnrollmentStatus(newStatus);
        const filters = buildFilters({ enrollment: newStatus });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    // Handle payment status change
    const handlePaymentStatusChange = useCallback((value: string) => {
        const newStatus = value as PaymentStatus | 'all';
        setSelectedPaymentStatus(newStatus);
        const filters = buildFilters({ payment: newStatus });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    // Handle attendance min change with debounce
    const handleAttendanceMinChange = useCallback((value: string) => {
        setSelectedAttendanceMin(value);
        // Use setTimeout to get updated value for buildFilters
        setTimeout(() => {
            const filters = buildFilters({ attendanceMin: value });
            applyFiltersAndFetch(filters);
        }, 300);
    }, [buildFilters, applyFiltersAndFetch]);

    // Handle attendance max change with debounce
    const handleAttendanceMaxChange = useCallback((value: string) => {
        setSelectedAttendanceMax(value);
        // Use setTimeout to get updated value for buildFilters
        setTimeout(() => {
            const filters = buildFilters({ attendanceMax: value });
            applyFiltersAndFetch(filters);
        }, 300);
    }, [buildFilters, applyFiltersAndFetch]);

    // Handle overdue toggle
    const handleOverdueToggle = useCallback(() => {
        const newValue = !showOverdueOnly;
        setShowOverdueOnly(newValue);
        const filters = buildFilters({ overdue: newValue });
        applyFiltersAndFetch(filters);
    }, [showOverdueOnly, buildFilters, applyFiltersAndFetch]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedEnrollmentStatus('all');
        setSelectedPaymentStatus('all');
        setSelectedAttendanceMin('');
        setSelectedAttendanceMax('');
        setShowOverdueOnly(false);
        setFilters(null);

        // Re-fetch all students without filters
        if (branchId) {
            fetchBranchStudents(branchId);
        } else if (coachingCenterId) {
            fetchCoachingCenterStudents(coachingCenterId);
        }
    }, [branchId, coachingCenterId, setFilters, fetchBranchStudents, fetchCoachingCenterStudents]);

    // Clear individual filter handlers
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        const filters = buildFilters({ search: '' });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    const clearEnrollmentStatus = useCallback(() => {
        setSelectedEnrollmentStatus('all');
        const filters = buildFilters({ enrollment: 'all' });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    const clearPaymentStatus = useCallback(() => {
        setSelectedPaymentStatus('all');
        const filters = buildFilters({ payment: 'all' });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    const clearAttendanceRange = useCallback(() => {
        setSelectedAttendanceMin('');
        setSelectedAttendanceMax('');
        const filters = buildFilters({ attendanceMin: '', attendanceMax: '' });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    const clearOverdue = useCallback(() => {
        setShowOverdueOnly(false);
        const filters = buildFilters({ overdue: false });
        applyFiltersAndFetch(filters);
    }, [buildFilters, applyFiltersAndFetch]);

    // Check if any filters are active
    const hasActiveFilters =
        searchQuery !== '' ||
        selectedEnrollmentStatus !== 'all' ||
        selectedPaymentStatus !== 'all' ||
        selectedAttendanceMin !== '' ||
        selectedAttendanceMax !== '' ||
        showOverdueOnly;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={clearSearch}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Clear All
                    </Button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
                {/* Enrollment Status Filter */}
                <Select
                    value={selectedEnrollmentStatus}
                    onValueChange={handleEnrollmentStatusChange}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Enrollment Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Enrollment Status</SelectItem>
                        {Object.entries(CLASS_ENROLLMENT_STATUS_OPTIONS).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Payment Status Filter */}
                <Select
                    value={selectedPaymentStatus}
                    onValueChange={handlePaymentStatusChange}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Payment Status</SelectItem>
                        {Object.entries(PAYMENT_STATUS_OPTIONS).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Attendance Range */}
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Min %"
                        value={selectedAttendanceMin}
                        onChange={(e) => handleAttendanceMinChange(e.target.value)}
                        min="0"
                        max="100"
                        className="w-[100px]"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                        type="number"
                        placeholder="Max %"
                        value={selectedAttendanceMax}
                        onChange={(e) => handleAttendanceMaxChange(e.target.value)}
                        min="0"
                        max="100"
                        className="w-[100px]"
                    />
                </div>

                {/* Overdue Payments Toggle */}
                <Button
                    variant={showOverdueOnly ? 'default' : 'outline'}
                    onClick={handleOverdueToggle}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Overdue Only
                </Button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Active filters:</span>

                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {searchQuery}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={clearSearch}
                            />
                        </Badge>
                    )}

                    {selectedEnrollmentStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {CLASS_ENROLLMENT_STATUS_OPTIONS[selectedEnrollmentStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={clearEnrollmentStatus}
                            />
                        </Badge>
                    )}

                    {selectedPaymentStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Payment: {PAYMENT_STATUS_OPTIONS[selectedPaymentStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={clearPaymentStatus}
                            />
                        </Badge>
                    )}

                    {(selectedAttendanceMin || selectedAttendanceMax) && (
                        <Badge variant="secondary" className="gap-1">
                            Attendance: {selectedAttendanceMin || '0'}% - {selectedAttendanceMax || '100'}%
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={clearAttendanceRange}
                            />
                        </Badge>
                    )}

                    {showOverdueOnly && (
                        <Badge variant="secondary" className="gap-1">
                            Overdue Payments Only
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={clearOverdue}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}