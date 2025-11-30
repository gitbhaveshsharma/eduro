/**
 * Student Filters Component
 * 
 * Advanced filtering controls for the students list
 * Features: Search, status filters, payment filters, attendance range
 */

'use client';

import { useState, useEffect } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { BranchStudentFilters, EnrollmentStatus, PaymentStatus } from '@/lib/branch-system/types/branch-students.types';
import { ENROLLMENT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/branch-students.types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Filter, RefreshCw } from 'lucide-react';

/**
 * Props for Student Filters Component
 */
interface StudentFiltersProps {
    coachingCenterId?: string; // Coaching center ID for fetching students
}

/**
 * Main Student Filters Component - Same style as ClassFilters
 */
export function StudentFilters({ coachingCenterId }: StudentFiltersProps = {}) {
    const { filters, setFilters, fetchCoachingCenterStudents } = useBranchStudentsStore();

    // Local state for immediate UI updates
    const [searchQuery, setSearchQuery] = useState(filters?.search_query || '');
    const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] = useState<EnrollmentStatus | 'all'>('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');
    const [selectedAttendanceMin, setSelectedAttendanceMin] = useState<string>('');
    const [selectedAttendanceMax, setSelectedAttendanceMax] = useState<string>('');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);

    // Apply filters to the store and trigger search
    const applyFilters = () => {
        const newFilters: BranchStudentFilters = {};

        if (searchQuery.trim()) {
            newFilters.search_query = searchQuery.trim();
        }

        if (selectedEnrollmentStatus !== 'all') {
            newFilters.enrollment_status = selectedEnrollmentStatus;
        }

        if (selectedPaymentStatus !== 'all') {
            newFilters.payment_status = selectedPaymentStatus;
        }

        if (selectedAttendanceMin) {
            newFilters.attendance_min = Number(selectedAttendanceMin);
        }

        if (selectedAttendanceMax) {
            newFilters.attendance_max = Number(selectedAttendanceMax);
        }

        if (showOverdueOnly) {
            newFilters.has_overdue_payment = true;
        }

        setFilters(Object.keys(newFilters).length > 0 ? newFilters : null);

        // Re-fetch coaching center students with new filters
        if (coachingCenterId) {
            fetchCoachingCenterStudents(coachingCenterId, newFilters);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedEnrollmentStatus('all');
        setSelectedPaymentStatus('all');
        setSelectedAttendanceMin('');
        setSelectedAttendanceMax('');
        setShowOverdueOnly(false);
        setFilters(null);

        // Re-fetch all coaching center students without filters
        if (coachingCenterId) {
            fetchCoachingCenterStudents(coachingCenterId);
        }
    };

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
                            onClick={() => setSearchQuery('')}
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
                    onValueChange={(value) => {
                        setSelectedEnrollmentStatus(value as EnrollmentStatus | 'all');
                        applyFilters();
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Enrollment Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Enrollment Status</SelectItem>
                        {Object.entries(ENROLLMENT_STATUS_OPTIONS).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Payment Status Filter */}
                <Select
                    value={selectedPaymentStatus}
                    onValueChange={(value) => {
                        setSelectedPaymentStatus(value as PaymentStatus | 'all');
                        applyFilters();
                    }}
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
                        placeholder="Min Attendance %"
                        value={selectedAttendanceMin}
                        onChange={(e) => {
                            setSelectedAttendanceMin(e.target.value);
                            setTimeout(applyFilters, 300);
                        }}
                        min="0"
                        max="100"
                        className="w-[140px]"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                        type="number"
                        placeholder="Max Attendance %"
                        value={selectedAttendanceMax}
                        onChange={(e) => {
                            setSelectedAttendanceMax(e.target.value);
                            setTimeout(applyFilters, 300);
                        }}
                        min="0"
                        max="100"
                        className="w-[140px]"
                    />
                </div>

                {/* Overdue Payments Toggle */}
                <Button
                    variant={showOverdueOnly ? 'default' : 'outline'}
                    onClick={() => {
                        setShowOverdueOnly(!showOverdueOnly);
                        applyFilters();
                    }}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Overdue Payments Only
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
                                onClick={() => setSearchQuery('')}
                            />
                        </Badge>
                    )}

                    {selectedEnrollmentStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Enrollment: {ENROLLMENT_STATUS_OPTIONS[selectedEnrollmentStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedEnrollmentStatus('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {selectedPaymentStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Payment: {PAYMENT_STATUS_OPTIONS[selectedPaymentStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedPaymentStatus('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {(selectedAttendanceMin || selectedAttendanceMax) && (
                        <Badge variant="secondary" className="gap-1">
                            Attendance: {selectedAttendanceMin || '0'}% - {selectedAttendanceMax || '100'}%
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedAttendanceMin('');
                                    setSelectedAttendanceMax('');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {showOverdueOnly && (
                        <Badge variant="secondary" className="gap-1">
                            Overdue Payments Only
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setShowOverdueOnly(false);
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}