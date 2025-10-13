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
    sortByPopularity,
    getReactionAriaLabel,
} from "@/lib/utils/reaction.utils";

export interface ReactionBarProps {
    targetType: "POST" | "COMMENT";
    targetId: string;
    onReactionSelect: (reaction: PublicReaction) => void;
    size?: "sm" | "md" | "lg";
    className?: string;
    maxReactions?: number;
    showHoverEffects?: boolean;
}

// Size configurations
const SIZE_CONFIG = {
    sm: { button: "h-8 w-8 text-sm", emoji: "text-base", gap: "gap-1", plusButton: "h-7 w-7" },
    md: { button: "h-10 w-10 text-base", emoji: "text-lg", gap: "gap-1.5", plusButton: "h-9 w-9" },
    lg: { button: "h-12 w-12 text-lg", emoji: "text-xl", gap: "gap-2", plusButton: "h-11 w-11" },
} as const;

export function ReactionBar({
    targetType,
    targetId,
    onReactionSelect,
    size = "md",
    className,
    maxReactions = 5,
    showHoverEffects = true,
}: ReactionBarProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
    const plusButtonRef = useRef<HTMLButtonElement>(null);

    const { loadAllReactions } = useReactionStore();
    const allReactions = useReactions();

    useEffect(() => {
        loadAllReactions();
    }, [loadAllReactions]);

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
        // Return focus to trigger for a11y
        plusButtonRef.current?.focus();
    };

    return (
        <TooltipProvider>
            <div className={cn("flex items-center", sizeClasses.gap, className)} role="group" aria-label="Quick reactions">
                {topReactions.map((reaction, index) => (
                    <Button
                        key={reaction.id}
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
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className={cn(sizeClasses.emoji, "transition-transform duration-200")}>
                            {formatReactionEmoji(reaction)}
                        </span>
                    </Button>
                ))}

                {/* Plus button with tooltip */}
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
                            <div className="font-medium">Select more reactions</div>
                        </div>
                    </TooltipContent>
                </Tooltip>

                {/* Modal-centered picker when opened via plus */}
                <ReactionPicker
                    isOpen={isPickerOpen}
                    targetType={targetType}
                    targetId={targetId}
                    triggerRef={plusButtonRef}
                    position="auto"
                    modalOnOpen={true}
                    onReactionSelect={handlePickerSelect}
                    onClose={handlePickerClose}
                />
            </div>
        </TooltipProvider>
    );
}

export default ReactionBar;
