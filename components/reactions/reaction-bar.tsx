/**
 * Reaction Bar Component
 * 
 * Shows top 5 popular reactions directly on the post (like Facebook/LinkedIn)
 * + Plus button to open full reaction picker
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactionPicker } from "./reaction-picker";
import {
    useReactionStore,
    useReactions,
    type PublicReaction,
} from "@/lib/reaction";
import {
    formatReactionEmoji,
    formatReactionName,
    sortByPopularity,
    getReactionAriaLabel,
} from "@/lib/utils/reaction.utils";

export interface ReactionBarProps {
    /** Target type for reactions */
    targetType: 'POST' | 'COMMENT';
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is selected */
    onReactionSelect: (reaction: PublicReaction) => void;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Custom class name */
    className?: string;
    /** Maximum reactions to show (default: 5) */
    maxReactions?: number;
    /** Whether to show hover effects */
    showHoverEffects?: boolean;
}

// Size configurations
const SIZE_CONFIG = {
    sm: {
        button: "h-8 w-8 text-sm",
        emoji: "text-base",
        gap: "gap-1",
        plusButton: "h-7 w-7",
    },
    md: {
        button: "h-10 w-10 text-base",
        emoji: "text-lg",
        gap: "gap-1.5",
        plusButton: "h-9 w-9",
    },
    lg: {
        button: "h-12 w-12 text-lg",
        emoji: "text-xl",
        gap: "gap-2",
        plusButton: "h-11 w-11",
    },
} as const;

export function ReactionBar({
    targetType,
    targetId,
    onReactionSelect,
    size = 'md',
    className,
    maxReactions = 5,
    showHoverEffects = true,
}: ReactionBarProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
    const plusButtonRef = useRef<HTMLButtonElement>(null);

    // Store hooks
    const { loadAllReactions } = useReactionStore();
    const allReactions = useReactions();

    // Load reactions on mount
    useEffect(() => {
        loadAllReactions();
    }, [loadAllReactions]);

    // Get top reactions sorted by popularity
    const topReactions = React.useMemo(() => {
        const sorted = sortByPopularity(allReactions);
        return sorted.slice(0, maxReactions);
    }, [allReactions, maxReactions]);

    const sizeClasses = SIZE_CONFIG[size];

    const handleReactionClick = (reaction: PublicReaction) => {
        onReactionSelect(reaction);
    };

    const handlePlusClick = () => {
        setIsPickerOpen(true);
    };

    const handlePickerSelect = (reaction: PublicReaction) => {
        onReactionSelect(reaction);
        setIsPickerOpen(false);
    };

    const handlePickerClose = () => {
        setIsPickerOpen(false);
    };

    if (topReactions.length === 0) {
        // Show loading state or just the plus button
        return (
            <div className={cn("flex items-center", sizeClasses.gap, className)}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                ref={plusButtonRef}
                                variant="outline"
                                size="sm"
                                onClick={handlePlusClick}
                                className={cn(
                                    sizeClasses.plusButton,
                                    "rounded-full border-2 border-gray-300 text-gray-500",
                                    "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600",
                                    "transition-all duration-200"
                                )}
                                aria-label="Add reaction"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                            <p>Add a reaction</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <ReactionPicker
                    isOpen={isPickerOpen}
                    targetType={targetType}
                    targetId={targetId}
                    triggerRef={plusButtonRef}
                    onReactionSelect={handlePickerSelect}
                    onClose={handlePickerClose}
                />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div
                className={cn("flex items-center", sizeClasses.gap, className)}
                role="group"
                aria-label="Quick reactions"
            >
                {/* Top Reactions */}
                {topReactions.map((reaction, index) => (
                    <Tooltip key={reaction.id}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactionClick(reaction)}
                                onMouseEnter={showHoverEffects ? () => setHoveredReaction(reaction.id) : undefined}
                                onMouseLeave={showHoverEffects ? () => setHoveredReaction(null) : undefined}
                                className={cn(
                                    sizeClasses.button,
                                    "rounded-full p-0 transition-all duration-200",
                                    "hover:bg-gray-100 hover:scale-110",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                                    hoveredReaction === reaction.id && showHoverEffects && "scale-110 shadow-lg"
                                )}
                                aria-label={getReactionAriaLabel(reaction)}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                <span className={cn(sizeClasses.emoji, "transition-transform duration-200")}>
                                    {formatReactionEmoji(reaction)}
                                </span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                            <div className="text-center">
                                <div className="font-medium">
                                    {formatReactionName(reaction)}
                                </div>
                                {reaction.description && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {reaction.description}
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {/* Plus Button for More Reactions */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            ref={plusButtonRef}
                            variant="outline"
                            size="sm"
                            onClick={handlePlusClick}
                            className={cn(
                                sizeClasses.plusButton,
                                "rounded-full border-2 border-gray-300 text-gray-500",
                                "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600",
                                "hover:scale-105 transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            )}
                            aria-label="More reactions"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                        <div className="text-center">
                            <div className="font-medium">More reactions</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Choose from all available reactions
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>

                {/* Reaction Picker Modal */}
                <ReactionPicker
                    isOpen={isPickerOpen}
                    targetType={targetType}
                    targetId={targetId}
                    triggerRef={plusButtonRef}
                    onReactionSelect={handlePickerSelect}
                    onClose={handlePickerClose}
                    position="top"
                />
            </div>
        </TooltipProvider>
    );
}

export default ReactionBar;