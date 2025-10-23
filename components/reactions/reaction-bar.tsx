"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    useReactionStore,
    useReactions,
    type PublicReaction,
} from "@/lib/reaction";
import {
    formatReactionEmoji,
    getReactionAriaLabel,
} from "@/lib/utils/reaction.utils";

export interface ReactionBarProps {
    targetType: "POST" | "COMMENT";
    targetId: string;
    onReactionSelect: (reaction: PublicReaction) => void;
    size?: "sm" | "md" | "lg";
    className?: string;
    showHoverEffects?: boolean;
}

const SIZE_CONFIG = {
    sm: { button: "h-8 w-8 text-sm", emoji: "text-base", gap: "gap-1" },
    md: { button: "h-10 w-10 text-base", emoji: "text-lg", gap: "gap-1.5" },
    lg: { button: "h-12 w-12 text-lg", emoji: "text-xl", gap: "gap-2" },
} as const;

// Number of reactions to show at a time
const VISIBLE_COUNT = 5;

export function ReactionBar({
    targetType,
    targetId,
    onReactionSelect,
    size = "md",
    className,
    showHoverEffects = true,
}: ReactionBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sizeClasses = SIZE_CONFIG[size];

    const { loadAllReactions } = useReactionStore();
    const allReactions = useReactions();

    React.useEffect(() => {
        loadAllReactions();
    }, [loadAllReactions]);

    // Scroll functions
    function scrollLeft() {
        if (scrollRef.current) {
            const itemWidth = scrollRef.current.scrollWidth / allReactions.length;
            scrollRef.current.scrollBy({
                left: -itemWidth * VISIBLE_COUNT,
                behavior: "smooth",
            });
        }
    }

    function scrollRight() {
        if (scrollRef.current) {
            const itemWidth = scrollRef.current.scrollWidth / allReactions.length;
            scrollRef.current.scrollBy({
                left: itemWidth * VISIBLE_COUNT,
                behavior: "smooth",
            });
        }
    }

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                {/* Left Arrow */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollLeft}
                    aria-label="Scroll left"
                    tabIndex={0}
                >
                    <ChevronLeft />
                </Button>
                {/* Reaction buttons in a horizontally scrollable row */}
                <div
                    ref={scrollRef}
                    className={
                        // restrict width for only 5 visible items, hide overflow
                        cn(
                            "flex gap-2 overflow-x-auto scrollbar-hide px-1",
                            sizeClasses.gap,
                            className
                        )
                    }
                    style={{
                        maxWidth: `calc(${VISIBLE_COUNT} * 48px)`, // for 5 buttons each ~48px wide
                        scrollBehavior: "smooth",
                    }}
                    role="group"
                    aria-label="Reaction choices"
                >
                    {allReactions.map((reaction) => (
                        <Tooltip key={reaction.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onReactionSelect(reaction)}
                                    aria-label={getReactionAriaLabel(reaction)}
                                    className={cn(
                                        sizeClasses.button,
                                        "rounded-full p-0 flex-shrink-0 transition-all duration-200",
                                        "hover:bg-gray-100 hover:scale-110",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                    )}
                                    style={{ minWidth: 48, width: 48 }}
                                >
                                    <span className={cn(sizeClasses.emoji, "transition-transform duration-200")}>
                                        {formatReactionEmoji(reaction)}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                                <div className="text-center font-medium">{reaction.name}</div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
                {/* Right Arrow */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollRight}
                    aria-label="Scroll right"
                    tabIndex={0}
                >
                    <ChevronRight />
                </Button>
            </div>
        </TooltipProvider>
    );
}

export default ReactionBar;
