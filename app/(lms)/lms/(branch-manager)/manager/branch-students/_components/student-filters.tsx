/**
 * Branch Manager - Student Filters Component
 * 
 * Advanced filtering controls for the students list
 * Adapted for branch manager use
 */

'use client';

import { useState, useEffect } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { BranchStudentFilters, EnrollmentStatus, PaymentStatus } from '@/lib/branch-system/types/branch-students.types';
import { ENROLLMENT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/branch-students.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';

interface StudentFiltersProps {
    branchId: string;
}

export function StudentFilters({ branchId }: StudentFiltersProps) {
    const { filters, setFilters, fetchBranchStudents } = useBranchStudentsStore();

    const [searchQuery, setSearchQuery] = useState(filters?.search_query || '');
    const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | 'all'>('all');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all');
    const [attendanceMin, setAttendanceMin] = useState<string>('');
    const [attendanceMax, setAttendanceMax] = useState<string>('');
    const [hasOverduePayment, setHasOverduePayment] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Apply filters
    const applyFilters = () => {
        const newFilters: BranchStudentFilters = { branch_id: branchId };

        if (searchQuery.trim()) {
            newFilters.search_query = searchQuery.trim();
        }

        if (enrollmentStatus !== 'all') {
            newFilters.enrollment_status = enrollmentStatus as EnrollmentStatus;
        }

        if (paymentStatus !== 'all') {
            newFilters.payment_status = paymentStatus as PaymentStatus;
        }

        if (attendanceMin) {
            newFilters.attendance_min = Number(attendanceMin);
        }

        if (attendanceMax) {
            newFilters.attendance_max = Number(attendanceMax);
        }

        if (hasOverduePayment) {
            newFilters.has_overdue_payment = true;
        }

        setFilters(Object.keys(newFilters).length > 1 ? newFilters : null);
        fetchBranchStudents(branchId, newFilters);
    };

    // Handle filter changes
    const handleEnrollmentStatusChange = (value: string) => {
        setEnrollmentStatus(value as EnrollmentStatus | 'all');
        setTimeout(applyFilters, 0);
    };

    const handlePaymentStatusChange = (value: string) => {
        setPaymentStatus(value as PaymentStatus | 'all');
        setTimeout(applyFilters, 0);
    };

    const handleAttendanceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAttendanceMin(e.target.value);
        setTimeout(applyFilters, 300);
    };

    const handleAttendanceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAttendanceMax(e.target.value);
        setTimeout(applyFilters, 300);
    };

    const handleOverduePaymentChange = (checked: boolean) => {
        setHasOverduePayment(checked);
        setTimeout(applyFilters, 0);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setEnrollmentStatus('all');
        setPaymentStatus('all');
        setAttendanceMin('');
        setAttendanceMax('');
        setHasOverduePayment(false);
        setFilters(null);
        fetchBranchStudents(branchId);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery || enrollmentStatus !== 'all' || paymentStatus !== 'all' ||
        attendanceMin || attendanceMax || hasOverduePayment;

    // Get active filters count
    const activeFiltersCount = [
        searchQuery,
        enrollmentStatus !== 'all',
        paymentStatus !== 'all',
        attendanceMin,
        attendanceMax,
        hasOverduePayment,
    ].filter(Boolean).length;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Filters</h3>
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary">{activeFiltersCount} active</Badge>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Search */}
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Enrollment Status */}
                        <div className="space-y-2">
                            <Label htmlFor="enrollment-status">Enrollment Status</Label>
                            <Select value={enrollmentStatus} onValueChange={handleEnrollmentStatusChange}>
                                <SelectTrigger id="enrollment-status">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {Object.entries(ENROLLMENT_STATUS_OPTIONS).map(([status, config]) => (
                                        <SelectItem key={status} value={status}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Status */}
                        <div className="space-y-2">
                            <Label htmlFor="payment-status">Payment Status</Label>
                            <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                                <SelectTrigger id="payment-status">
                                    <SelectValue placeholder="All payment statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payment Statuses</SelectItem>
                                    {Object.entries(PAYMENT_STATUS_OPTIONS).map(([status, config]) => (
                                        <SelectItem key={status} value={status}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Attendance Range */}
                        <div className="space-y-2">
                            <Label>Attendance Range (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={attendanceMin}
                                    onChange={handleAttendanceMinChange}
                                    min="0"
                                    max="100"
                                    className="w-full"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={attendanceMax}
                                    onChange={handleAttendanceMaxChange}
                                    min="0"
                                    max="100"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Filters */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="overdue-payment"
                                checked={hasOverduePayment}
                                onCheckedChange={handleOverduePaymentChange}
                            />
                            <Label
                                htmlFor="overdue-payment"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Show only students with overdue payments
                            </Label>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {searchQuery && (
                                <Badge variant="secondary" className="gap-1">
                                    Search: {searchQuery}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => setSearchQuery('')}
                                    />
                                </Badge>
                            )}
                            {enrollmentStatus !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Status: {ENROLLMENT_STATUS_OPTIONS[enrollmentStatus as EnrollmentStatus].label}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => setEnrollmentStatus('all')}
                                    />
                                </Badge>
                            )}
                            {paymentStatus !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Payment: {PAYMENT_STATUS_OPTIONS[paymentStatus as PaymentStatus].label}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => setPaymentStatus('all')}
                                    />
                                </Badge>
                            )}
                            {(attendanceMin || attendanceMax) && (
                                <Badge variant="secondary" className="gap-1">
                                    Attendance: {attendanceMin || '0'}% - {attendanceMax || '100'}%
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                            setAttendanceMin('');
                                            setAttendanceMax('');
                                        }}
                                    />
                                </Badge>
                            )}
                            {hasOverduePayment && (
                                <Badge variant="secondary" className="gap-1">
                                    Overdue Payments
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => setHasOverduePayment(false)}
                                    />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
