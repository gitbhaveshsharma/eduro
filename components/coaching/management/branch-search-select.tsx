/**
 * Branch Search Select Component
 * 
 * Reusable component for searching and selecting branches by name
 * Features:
 * - Debounced search (300ms)
 * - Only shows branches owned by the current user
 * - Loading states
 * - Clear selection option
 * - Displays branch details
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Building2, Loader2 } from "lucide-react";
import { useCoachingStore } from "@/lib/store/coaching.store";
import { CoachingBranch } from "@/lib/schema/coaching.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BranchSearchSelectProps {
    selectedBranch: CoachingBranch | null;
    onSelect: (branch: CoachingBranch) => void;
    onClear: () => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

export function BranchSearchSelect({
    selectedBranch,
    onSelect,
    onClear,
    label = "Branch",
    placeholder = "Search for your branch by name",
    required = false,
    disabled = false,
    error,
}: BranchSearchSelectProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CoachingBranch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { searchBranchesByName } = useCoachingStore();

    // Debounced search function
    const handleSearch = useCallback(
        async (query: string) => {
            if (query.trim().length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            setShowResults(true);

            try {
                const branches = await searchBranchesByName(query, 10);
                setSearchResults(branches);
            } catch (error) {
                console.error("Failed to search branches:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [searchBranchesByName]
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

    // Handle branch selection
    const handleSelectBranch = (branch: CoachingBranch) => {
        onSelect(branch);
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
        <div className="space-y-2">
            <Label htmlFor="branch-search">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {/* Selected Branch Display */}
            {selectedBranch && (
                <Card className="p-3 bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm truncate">
                                        {selectedBranch.name}
                                    </p>
                                    {selectedBranch.is_main_branch && (
                                        <Badge variant="secondary" className="text-xs">
                                            Main Branch
                                        </Badge>
                                    )}
                                </div>
                                {selectedBranch.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                        {selectedBranch.description}
                                    </p>
                                )}
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
            {!selectedBranch && (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="branch-search"
                            type="text"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={disabled}
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
                                    Searching branches...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="py-1">
                                    {searchResults.map((branch) => (
                                        <button
                                            key={branch.id}
                                            type="button"
                                            onClick={() => handleSelectBranch(branch)}
                                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-start gap-2">
                                                <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-medium text-sm truncate">
                                                            {branch.name}
                                                        </p>
                                                        {branch.is_main_branch && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Main
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {branch.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                            {branch.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No branches found matching "{searchQuery}"
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
            {!selectedBranch && !error && (
                <p className="text-xs text-muted-foreground">
                    Start typing to search your branches (minimum 2 characters)
                </p>
            )}
        </div>
    );
}
