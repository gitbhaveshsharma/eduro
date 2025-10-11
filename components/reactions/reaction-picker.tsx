"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Heart, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Conditional import for framer-motion with fallbacks
let motion: any;
let AnimatePresence: any;

try {
    const framerMotion = require("framer-motion");
    motion = framerMotion.motion;
    AnimatePresence = framerMotion.AnimatePresence;
} catch {
    motion = {
        div: React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />),
        button: React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />),
    };
    AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

import {
    useReactionStore,
    useReactions,
    useTrendingReactions,
    useQuickReactions,
    type PublicReaction,
    type ReactionCategory,
} from "@/lib/reaction";

import {
    formatReactionEmoji,
    formatReactionName,
    getCategoryDisplayName,
    getCategoryColor,
    filterBySearch,
    filterByCategory,
    filterTrendingOnly,
    getReactionAriaLabel,
    getReactionPickerAriaDescription,
} from "@/lib/utils/reaction.utils";

import { REACTION_CATEGORIES } from "@/lib/schema/reaction.types";

export interface ReactionPickerProps {
    isOpen: boolean;
    targetType: "POST" | "COMMENT";
    targetId: string;
    triggerRef?: React.RefObject<HTMLElement>;
    onReactionSelect: (reaction: PublicReaction) => void;
    onClose: () => void;
    className?: string;
    position?: "top" | "bottom" | "auto";
    maxWidth?: number;
    // New: open as centered modal, locks scroll
    modalOnOpen?: boolean;
}

interface CategoryConfig {
    key: "quick" | "trending" | "all" | ReactionCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

export function ReactionPicker({
    isOpen,
    targetType,
    targetId,
    triggerRef,
    onReactionSelect,
    onClose,
    className,
    position = "auto",
    maxWidth = 320,
    modalOnOpen = false,
}: ReactionPickerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<"quick" | "trending" | "all" | ReactionCategory>("quick");
    const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    const pickerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastActiveElementRef = useRef<HTMLElement | null>(null);

    const { loadAllReactions, loadQuickReactions, loadTrendingReactions, addToRecentlyUsed } = useReactionStore();

    const allReactions = useReactions();
    const trendingReactions = useTrendingReactions();
    const quickReactions = useQuickReactions();

    // Load reactions when opening
    useEffect(() => {
        if (isOpen) {
            loadAllReactions();
            loadQuickReactions();
            loadTrendingReactions();
        }
    }, [isOpen, loadAllReactions, loadQuickReactions, loadTrendingReactions]);

    // Capture last focused for restore when using modal
    useEffect(() => {
        if (isOpen && modalOnOpen) {
            lastActiveElementRef.current = (document.activeElement as HTMLElement) ?? null;
        }
    }, [isOpen, modalOnOpen]);

    // Centered modal: lock scroll and focus search
    useEffect(() => {
        if (!isOpen) return;

        if (modalOnOpen) {
            const original = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = original;
            };
        }
    }, [isOpen, modalOnOpen]);

    // Restore focus when closing modal
    useEffect(() => {
        if (!isOpen && modalOnOpen) {
            lastActiveElementRef.current?.focus?.();
        }
    }, [isOpen, modalOnOpen]);

    // Calculate anchored position for non-modal mode
    useEffect(() => {
        if (!isOpen || modalOnOpen) return;
        if (triggerRef?.current && pickerRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const pickerRect = pickerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let top = triggerRect.bottom + 8;
            let left = triggerRect.left;

            if (position === "top" || (position === "auto" && top + pickerRect.height > viewportHeight - 20)) {
                top = triggerRect.top - pickerRect.height - 8;
            }
            if (left + maxWidth > viewportWidth - 20) {
                left = viewportWidth - maxWidth - 20;
            }
            if (left < 20) {
                left = 20;
            }
            setPickerPosition({ top, left });
        }
    }, [isOpen, triggerRef, position, maxWidth, modalOnOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isOpen) return;
            // In modal mode, clicking the backdrop should close
            if (modalOnOpen) {
                if (event.target instanceof HTMLElement && event.target.dataset?.role === "picker-backdrop") {
                    onClose();
                }
                return;
            }
            // Anchored mode
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                triggerRef?.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, triggerRef, modalOnOpen]);

    // Escape key closes
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
            // rudimentary focus trap: tab cycles inside when modal
            if (modalOnOpen && isOpen && event.key === "Tab") {
                const focusables = pickerRef.current?.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables || focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement as HTMLElement | null;
                if (event.shiftKey) {
                    if (active === first) {
                        last.focus();
                        event.preventDefault();
                    }
                } else {
                    if (active === last) {
                        first.focus();
                        event.preventDefault();
                    }
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, modalOnOpen]);

    // Filtering
    const getFilteredReactions = (): PublicReaction[] => {
        let reactions: PublicReaction[] = [];
        switch (activeCategory) {
            case "quick":
                reactions = quickReactions;
                break;
            case "trending":
                reactions = filterTrendingOnly(allReactions);
                break;
            case "all":
                reactions = allReactions;
                break;
            default:
                reactions = filterByCategory(allReactions, activeCategory);
                break;
        }
        if (searchQuery.trim()) {
            reactions = filterBySearch(reactions, searchQuery);
        }
        return reactions;
    };

    const handleReactionClick = (reaction: PublicReaction) => {
        addToRecentlyUsed(reaction);
        onReactionSelect(reaction);
        onClose();
    };

    const categories: CategoryConfig[] = [
        { key: "quick", label: "Quick", icon: Sparkles, color: "#8B5CF6" },
        { key: "trending", label: "Trending", icon: TrendingUp, color: "#F59E0B" },
        { key: "all", label: "All", icon: Heart, color: "#EF4444" },
        ...Object.values(REACTION_CATEGORIES).map((cat) => ({
            key: cat as ReactionCategory,
            label: getCategoryDisplayName(cat),
            icon: Heart,
            color: getCategoryColor(cat),
        })),
    ];

    const filteredReactions = getFilteredReactions();
    const totalReactionCount = filteredReactions.length;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        data-role="picker-backdrop"
                        className={cn(
                            "fixed inset-0 z-40",
                            modalOnOpen ? "bg-black/40" : "" // darken only in modal
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* Picker */}
            <motion.div
                ref={pickerRef}
                className={cn(
                    modalOnOpen
                        ? "fixed inset-0 z-50 flex items-center justify-center p-4"
                        : "fixed z-50",
                    className
                )}
                style={
                    modalOnOpen
                        ? undefined
                        : {
                            top: pickerPosition.top,
                            left: pickerPosition.left,
                            width: maxWidth,
                            maxHeight: "400px",
                        }
                }
                initial={{ opacity: 0, scale: modalOnOpen ? 0.98 : 0.95, y: modalOnOpen ? 0 : -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: modalOnOpen ? 0.98 : 0.95, y: modalOnOpen ? 0 : -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                role="dialog"
                aria-modal={modalOnOpen || undefined}
                aria-label="Reaction picker"
                aria-description={getReactionPickerAriaDescription(targetType, totalReactionCount)}
            >
                <div
                    className={cn(
                        "bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden",
                        modalOnOpen ? "w-full max-w-md max-h-[80vh]" : ""
                    )}
                >
                    {/* Header */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-900">Add Reaction</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                aria-label="Close reaction picker"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search reactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 text-sm"
                                aria-label="Search reactions"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide" role="tablist">
                            {categories.map((category) => {
                                const Icon = category.icon;
                                const isActive = activeCategory === category.key;

                                return (
                                    <Button
                                        key={category.key}
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setActiveCategory(category.key)}
                                        className={cn(
                                            "flex-shrink-0 h-8 px-3 text-xs",
                                            isActive && "text-white",
                                            !isActive && "text-gray-600 hover:text-gray-900"
                                        )}
                                        style={isActive ? { backgroundColor: category.color } : undefined}
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-label={`Filter by ${category.label}`}
                                    >
                                        <Icon className="h-3 w-3 mr-1" />
                                        {category.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reactions Grid */}
                    <ScrollArea className={cn(modalOnOpen ? "max-h-[60vh]" : "h-64")}>
                        <div className="p-3">
                            {filteredReactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-2xl mb-2">🔍</div>
                                    <p className="text-sm">{searchQuery ? "No reactions found" : "No reactions available"}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-2" role="grid">
                                    {filteredReactions.map((reaction) => (
                                        <motion.button
                                            key={reaction.id}
                                            onClick={() => handleReactionClick(reaction)}
                                            onHoverStart={() => setHoveredReaction(reaction.id)}
                                            onHoverEnd={() => setHoveredReaction(null)}
                                            className={cn(
                                                "relative aspect-square rounded-lg border-2 border-transparent",
                                                "flex items-center justify-center transition-all duration-200",
                                                "hover:border-blue-200 hover:bg-blue-50",
                                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                            )}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            title={formatReactionName(reaction)}
                                            aria-label={getReactionAriaLabel(reaction)}
                                            role="gridcell"
                                        >
                                            <span className="text-xl">{formatReactionEmoji(reaction)}</span>

                                            {reaction.is_trending && (
                                                <motion.div
                                                    className="absolute -top-1 -right-1"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                >

                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Hovered reaction tooltip */}
                    <AnimatePresence>
                        {hoveredReaction && (
                            <motion.div
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.1 }}
                            >
                                <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                                    {formatReactionName(filteredReactions.find((r) => r.id === hoveredReaction)!)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}

export default ReactionPicker;
