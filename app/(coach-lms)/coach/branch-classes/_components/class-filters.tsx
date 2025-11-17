/**
 * Class Filters Component
 * 
 * Provides filtering and search functionality for branch classes
 * Features:
 * - Search by name, subject, description
 * - Filter by status (Active, Inactive, Full, Completed)
 * - Filter by grade level
 * - Filter by subject
 * - Filter by availability
 * - Clear all filters button
 */

'use client';

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
import {
    BranchClassesAPI,
    useBranchClassesStore,
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

/**
 * Main Class Filters Component
 */
export function ClassFilters() {
    const store = useBranchClassesStore();
    const currentFilters = store.ui.currentFilters;

    // Local state for immediate UI updates
    const [searchQuery, setSearchQuery] = useState(currentFilters.search_query || '');
    const [selectedStatus, setSelectedStatus] = useState<ClassStatus | 'all'>('all');
    const [selectedGrade, setSelectedGrade] = useState<string | 'all'>('all');
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Fetch user's branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                const result = await CoachingService.searchBranchesByName('', 100);
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
    }, []);

    // Apply filters to the store and trigger search
    const applyFilters = () => {
        const filters: BranchClassFilters = {};

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

        if (selectedBranch !== 'all') {
            filters.branch_id = selectedBranch;
        }

        if (showAvailableOnly) {
            filters.has_available_seats = true;
        }

        store.setFilters(filters);
        BranchClassesAPI.search(filters);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedGrade('all');
        setSelectedSubject('all');
        setSelectedBranch('all');
        setShowAvailableOnly(false);
        store.setFilters({});
        BranchClassesAPI.search({});
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Check if any filters are active
    const hasActiveFilters =
        searchQuery !== '' ||
        selectedStatus !== 'all' ||
        selectedGrade !== 'all' ||
        selectedSubject !== 'all' ||
        selectedBranch !== 'all' ||
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
                {/* Branch Filter */}
                <Select
                    value={selectedBranch}
                    onValueChange={(value) => {
                        setSelectedBranch(value);
                        applyFilters();
                    }}
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

                {/* Status Filter */}
                <Select
                    value={selectedStatus}
                    onValueChange={(value) => {
                        setSelectedStatus(value as ClassStatus | 'all');
                        applyFilters();
                    }}
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
                    onValueChange={(value) => {
                        setSelectedGrade(value);
                        applyFilters();
                    }}
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
                    onValueChange={(value) => {
                        setSelectedSubject(value);
                        applyFilters();
                    }}
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
                    onClick={() => {
                        setShowAvailableOnly(!showAvailableOnly);
                        applyFilters();
                    }}
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

                    {selectedBranch !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Branch: {branches.find(b => b.id === selectedBranch)?.name || selectedBranch}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedBranch('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {selectedStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {CLASS_STATUS_OPTIONS[selectedStatus].label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedStatus('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {selectedGrade !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Grade: {selectedGrade}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedGrade('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {selectedSubject !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Subject: {selectedSubject}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setSelectedSubject('all');
                                    applyFilters();
                                }}
                            />
                        </Badge>
                    )}

                    {showAvailableOnly && (
                        <Badge variant="secondary" className="gap-1">
                            Available Seats Only
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    setShowAvailableOnly(false);
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
