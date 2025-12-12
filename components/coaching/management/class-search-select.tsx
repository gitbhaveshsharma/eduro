/**
 * Class Search Select Component
 * 
 * Reusable component for searching and selecting classes by name
 * Features:
 * - Debounced search (300ms)
 * - Branch manager: searches classes within their branch
 * - Coach: searches classes across all branches in their coaching center
 * - Loading states
 * - Clear selection option
 * - Displays class details with subject and branch info
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, GraduationCap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { BranchClass } from "@/lib/branch-system/types/branch-classes.types";

/**
 * Class with branch info for display
 */
interface ClassWithBranch extends BranchClass {
    branch?: {
        id: string;
        name: string;
        coaching_center_id?: string;
    } | null;
}

interface ClassSearchSelectProps {
    /** Currently selected class */
    selectedClass: ClassWithBranch | null;
    /** Callback when class is selected */
    onSelect: (cls: ClassWithBranch) => void;
    /** Callback when selection is cleared */
    onClear: () => void;
    /** Branch ID - for branch manager view (searches within this branch only) */
    branchId?: string;
    /** Coaching Center ID - for coach view (searches across all branches) */
    coachingCenterId?: string;
    /** Label text */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Error message */
    error?: string;
}

export function ClassSearchSelect({
    selectedClass,
    onSelect,
    onClear,
    branchId,
    coachingCenterId,
    label = "Class",
    placeholder = "Search for a class by name or subject",
    required = false,
    disabled = false,
    error,
}: ClassSearchSelectProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ClassWithBranch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search function
    const handleSearch = useCallback(
        async (query: string) => {
            if (query.trim().length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            // Need at least branch or coaching center context
            if (!branchId && !coachingCenterId) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            setShowResults(true);

            try {
                let dbQuery = supabase
                    .from("branch_classes")
                    .select(`
                        *,
                        branch:coaching_branches(id, name, coaching_center_id)
                    `)
                    .or(`class_name.ilike.%${query}%,subject.ilike.%${query}%`)
                    .eq("status", "ACTIVE")
                    .eq("is_visible", true)
                    .limit(10);

                // Filter by branch for branch manager view
                if (branchId) {
                    dbQuery = dbQuery.eq("branch_id", branchId);
                }
                // Filter by coaching center for coach view
                else if (coachingCenterId) {
                    // First get all branches for this coaching center
                    const { data: branches } = await supabase
                        .from("coaching_branches")
                        .select("id")
                        .eq("coaching_center_id", coachingCenterId)
                        .eq("status", "ACTIVE");

                    if (branches && branches.length > 0) {
                        const branchIds = branches.map((b: { id: string }) => b.id);
                        dbQuery = dbQuery.in("branch_id", branchIds);
                    } else {
                        setSearchResults([]);
                        setIsSearching(false);
                        return;
                    }
                }

                const { data, error: queryError } = await dbQuery;

                if (queryError) {
                    console.error("Class search error:", queryError);
                    setSearchResults([]);
                } else {
                    setSearchResults((data || []) as ClassWithBranch[]);
                }
            } catch (err) {
                console.error("Failed to search classes:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [supabase, branchId, coachingCenterId]
    );

    // Handle search input with debouncing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim().length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                handleSearch(searchQuery);
            }, 300); // 300ms debounce
        } else {
            setSearchResults([]);
            setShowResults(false);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, handleSearch]);

    // Handle class selection
    const handleSelectClass = (cls: ClassWithBranch) => {
        onSelect(cls);
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
    };

    // Handle clear selection
    const handleClearSelection = () => {
        onClear();
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <div className="space-y-2" ref={containerRef}>
            {label && (
                <Label htmlFor="class-search">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            {/* Selected Class Display */}
            {selectedClass && (
                <Card className="p-3 bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <GraduationCap className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm truncate">
                                        {selectedClass.class_name}
                                    </p>
                                    <Badge variant="secondary" className="text-xs">
                                        {selectedClass.subject}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    {selectedClass.branch?.name && (
                                        <span className="text-xs text-muted-foreground">
                                            {selectedClass.branch.name}
                                        </span>
                                    )}
                                    {selectedClass.grade_level && (
                                        <Badge variant="outline" className="text-xs">
                                            {selectedClass.grade_level}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSelection}
                            disabled={disabled}
                            className="h-8 w-8 p-0 flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Search Input */}
            {!selectedClass && (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="class-search"
                            type="text"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={disabled || (!branchId && !coachingCenterId)}
                            className={cn(
                                "pl-9",
                                error && "border-destructive focus-visible:ring-destructive"
                            )}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery.trim().length >= 2 && (
                        <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Searching classes...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="py-1">
                                    {searchResults.map((cls) => (
                                        <button
                                            key={cls.id}
                                            type="button"
                                            onClick={() => handleSelectClass(cls)}
                                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-start gap-2">
                                                <GraduationCap className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-medium text-sm truncate">
                                                            {cls.class_name}
                                                        </p>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {cls.subject}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                        {cls.branch?.name && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {cls.branch.name}
                                                            </span>
                                                        )}
                                                        {cls.grade_level && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {cls.grade_level}
                                                            </Badge>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            {cls.current_enrollment}/{cls.max_students} students
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No classes found matching &ldquo;{searchQuery}&rdquo;
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Helper Text */}
            {!selectedClass && !error && (
                <p className="text-xs text-muted-foreground">
                    {!branchId && !coachingCenterId
                        ? "Please select a branch first to search for classes"
                        : "Start typing to search classes (minimum 2 characters)"
                    }
                </p>
            )}
        </div>
    );
}
