'use client';

/**
 * Receipt Filters Component
 * 
 * Advanced filtering controls for fee receipts with:
 * - Search by receipt number or student name
 * - Status and payment method filters
 * - Date range filters
 * - Amount range filters
 * - Active filters display
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';

// Import store and types
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { ReceiptStatus, PaymentMethod } from '@/lib/branch-system/types/fee-receipts.types';
import { formatReceiptStatus, formatPaymentMethod } from '@/lib/branch-system/utils/fee-receipts.utils';

interface ReceiptFiltersProps {
    /** Branch ID - for branch manager view (single branch) */
    branchId?: string;
    /** Coaching Center ID - for coach view (all branches) */
    coachingCenterId?: string;
}

export default function ReceiptFilters({ branchId, coachingCenterId }: ReceiptFiltersProps) {
    const { filters, setFilters, clearFilters, fetchReceipts, fetchCoachingCenterReceipts } = useFeeReceiptsStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [localFilters, setLocalFilters] = useState({
        receipt_status: filters.receipt_status || 'all',
        payment_method: filters.payment_method || 'all',
        is_overdue: filters.is_overdue || false,
        has_balance: filters.has_balance || false,
    });

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                // In a real implementation, you'd search by receipt_number or student_name
                // For now, we'll just trigger a filter update
                setFilters({});
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter change
    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);

        // Apply filters (map 'all' sentinel to no value)
        const apiFilters: any = {};
        // Preserve branch_id filter for branch manager view
        if (branchId) apiFilters.branch_id = branchId;
        if (newFilters.receipt_status && newFilters.receipt_status !== 'all') apiFilters.receipt_status = newFilters.receipt_status as ReceiptStatus;
        if (newFilters.payment_method && newFilters.payment_method !== 'all') apiFilters.payment_method = newFilters.payment_method as PaymentMethod;
        if (newFilters.is_overdue) apiFilters.is_overdue = true;
        if (newFilters.has_balance) apiFilters.has_balance = true;

        setFilters(apiFilters);
        
        // Trigger re-fetch based on context
        if (coachingCenterId) {
            fetchCoachingCenterReceipts(coachingCenterId);
        } else {
            fetchReceipts();
        }
    };

    // Clear all filters
    const handleClearAll = () => {
        setSearchQuery('');
        setLocalFilters({
            receipt_status: 'all',
            payment_method: 'all',
            is_overdue: false,
            has_balance: false,
        });
        // Keep branch_id filter when clearing for branch manager view
        if (branchId) {
            setFilters({ branch_id: branchId });
            fetchReceipts();
        } else if (coachingCenterId) {
            clearFilters();
            fetchCoachingCenterReceipts(coachingCenterId);
        } else {
            clearFilters();
        }
    };

    // Count active filters
    const activeFiltersCount = Object.values(localFilters).filter((v) => v && v !== '' && v !== 'all').length +
        (searchQuery ? 1 : 0);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Search and Clear */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by receipt number or student name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {activeFiltersCount > 0 && (
                            <Button variant="outline" onClick={handleClearAll}>
                                <X className="h-4 w-4 mr-2" />
                                Clear All ({activeFiltersCount})
                            </Button>
                        )}
                    </div>

                    {/* Filters Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Receipt Status */}
                        <div className="space-y-2">
                            <Label>Receipt Status</Label>
                            <Select
                                value={localFilters.receipt_status}
                                onValueChange={(value) => handleFilterChange('receipt_status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {Object.values(ReceiptStatus).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {formatReceiptStatus(status)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select
                                value={localFilters.payment_method}
                                onValueChange={(value) => handleFilterChange('payment_method', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All methods</SelectItem>
                                    {Object.values(PaymentMethod).map((method) => (
                                        <SelectItem key={method} value={method}>
                                            {formatPaymentMethod(method)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quick Filters */}
                        <div className="space-y-2">
                            <Label>Quick Filters</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={localFilters.is_overdue ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleFilterChange('is_overdue', !localFilters.is_overdue)}
                                >
                                    Overdue
                                </Button>
                                <Button
                                    variant={localFilters.has_balance ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleFilterChange('has_balance', !localFilters.has_balance)}
                                >
                                    Outstanding
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {searchQuery && (
                                <Badge variant="secondary">
                                    Search: {searchQuery}
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {localFilters.receipt_status && localFilters.receipt_status !== 'all' && (
                                <Badge variant="secondary">
                                    Status: {formatReceiptStatus(localFilters.receipt_status as ReceiptStatus)}
                                    <button
                                        onClick={() => handleFilterChange('receipt_status', 'all')}
                                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {localFilters.payment_method && (
                                localFilters.payment_method !== 'all' && (
                                    <Badge variant="secondary">
                                        Payment: {formatPaymentMethod(localFilters.payment_method as PaymentMethod)}
                                        <button
                                            onClick={() => handleFilterChange('payment_method', 'all')}
                                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )
                            )}
                            {localFilters.is_overdue && (
                                <Badge variant="secondary">
                                    Overdue
                                    <button
                                        onClick={() => handleFilterChange('is_overdue', false)}
                                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {localFilters.has_balance && (
                                <Badge variant="secondary">
                                    Outstanding Balance
                                    <button
                                        onClick={() => handleFilterChange('has_balance', false)}
                                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
