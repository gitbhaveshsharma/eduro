/**
 * Class Filters Component
 * 
 * Provides filtering functionality for branch classes (client-side filtering)
 * 
 * Supports two modes:
 * 1. Branch mode (branchId) - For branch managers, branch filter is locked
 * 2. Coaching Center mode (coachingCenterId) - For coaches, can filter across branches
 * 
 * Features:
 * - Search by name, subject, description (client-side)
 * - Filter by status (Active, Inactive, Full, Completed)
 * - Filter by grade level
 * - Filter by subject
 * - Filter by branch (only in coaching center mode)
 * - Filter by availability
 * - Clear all filters button
 * 
 * NOTE: This component does NOT call any search API. It passes filters to the parent
 * component which applies them client-side to the already-fetched data.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
    CLASS_STATUS_OPTIONS,
    COMMON_GRADE_LEVELS,
    COMMON_SUBJECTS,
    type ClassStatus,
    type BranchClassFilters,
} from '@/lib/branch-system/branch-classes';
import { CoachingService } from '@/lib/service/coaching.service';
import {
    Search,
    Filter,
    X,
    RefreshCw,
} from 'lucide-react';

interface Branch {
    id: string;
    name: string;
}

interface ClassFiltersProps {
    /** Branch ID - locks filtering to a specific branch (for branch managers) */
    branchId?: string;
    /** Coaching Center ID - allows filtering across all branches of a coaching center (for coaches) */
    coachingCenterId?: string;
    /** Callback when filters change - passes the current filter state for client-side filtering */
    onFiltersChange?: (filters: BranchClassFilters) => void;
}

/**
 * Main Class Filters Component
 * 
 * This component manages filter state and notifies parent of changes.
 * Filtering is done client-side in the parent component (ClassesTable).
 */
export function ClassFilters({ branchId, coachingCenterId, onFiltersChange }: ClassFiltersProps) {
    // Determine the mode
    const isBranchMode = !!branchId;
    const isCoachingCenterMode = !!coachingCenterId;

    // Local state for immediate UI updates
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ClassStatus | 'all'>('all');
    const [selectedGrade, setSelectedGrade] = useState<string | 'all'>('all');
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedBranch, setSelectedBranch] = useState<string | 'all'>(branchId || 'all');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Fetch branches only in coaching center mode
    useEffect(() => {
        if (!isCoachingCenterMode) return;

        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                // Fetch branches for this coaching center only
                const result = await CoachingService.getBranchesByCenter(coachingCenterId);
                if (result.success && result.data) {
                    setBranches(result.data.map((b: any) => ({ id: b.id, name: b.name })));
                }
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, [coachingCenterId, isCoachingCenterMode]);

    // Build filters object and notify parent (client-side filtering)
    const buildFilters = useCallback((): BranchClassFilters => {
        const filters: BranchClassFilters = {};

        // Always include branch_id if in branch mode
        if (isBranchMode && branchId) {
            filters.branch_id = branchId;
        }

        // In coaching center mode, include coaching_center_id and optionally branch filter
        if (isCoachingCenterMode && coachingCenterId) {
            filters.coaching_center_id = coachingCenterId;
            if (selectedBranch !== 'all') {
                filters.branch_id = selectedBranch;
            }
        }

        if (searchQuery.trim()) {
            filters.search_query = searchQuery.trim();
        }

        if (selectedStatus !== 'all') {
            filters.status = selectedStatus;
        }

        if (selectedGrade !== 'all') {
            filters.grade_level = selectedGrade;
        }

        if (selectedSubject !== 'all') {
            filters.subject = selectedSubject;
        }

        if (showAvailableOnly) {
            filters.has_available_seats = true;
        }

        return filters;
    }, [
        branchId, coachingCenterId, isBranchMode, isCoachingCenterMode,
        searchQuery, selectedStatus, selectedGrade, selectedSubject,
        selectedBranch, showAvailableOnly
    ]);

    // Notify parent of filter changes (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const filters = buildFilters();
            onFiltersChange?.(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [buildFilters, onFiltersChange]);

    // Clear all filters (except locked branch filter)
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedGrade('all');
        setSelectedSubject('all');
        setSelectedBranch(branchId || 'all'); // Keep branch if locked
        setShowAvailableOnly(false);
    };

    // Check if any filters are active (beyond the locked context filters)
    const hasActiveFilters =
        searchQuery !== '' ||
        selectedStatus !== 'all' ||
        selectedGrade !== 'all' ||
        selectedSubject !== 'all' ||
        (isCoachingCenterMode && selectedBranch !== 'all') ||
        showAvailableOnly;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search classes by name, subject, or description..."
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
                {/* Branch Filter - Only show in coaching center mode */}
                {isCoachingCenterMode && (
                    <Select
                        value={selectedBranch}
                        onValueChange={setSelectedBranch}
                        disabled={loadingBranches}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={loadingBranches ? "Loading branches..." : "All Branches"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Status Filter */}
                <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as ClassStatus | 'all')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(CLASS_STATUS_OPTIONS).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Grade Level Filter */}
                <Select
                    value={selectedGrade}
                    onValueChange={setSelectedGrade}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {COMMON_GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                                {grade}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Subject Filter */}
                <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {COMMON_SUBJECTS.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                                {subject}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Available Seats Toggle */}
                <Button
                    variant={showAvailableOnly ? 'default' : 'outline'}
                    onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Available Seats Only
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

                    {isCoachingCenterMode && selectedBranch !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Branch: {branches.find(b => b.id === selectedBranch)?.name || selectedBranch}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSelectedBranch('all')}
                            />
                        </Badge>
                    )}

                    {selectedStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {CLASS_STATUS_OPTIONS[selectedStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSelectedStatus('all')}
                            />
                        </Badge>
                    )}

                    {selectedGrade !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Grade: {selectedGrade}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSelectedGrade('all')}
                            />
                        </Badge>
                    )}

                    {selectedSubject !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Subject: {selectedSubject}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSelectedSubject('all')}
                            />
                        </Badge>
                    )}

                    {showAvailableOnly && (
                        <Badge variant="secondary" className="gap-1">
                            Available Seats Only
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setShowAvailableOnly(false)}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}