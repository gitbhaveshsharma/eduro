/**
 * Reaction Display Component
 * 
 * Shows existing reactions on a post/comment with counts and user interactions
 * Displays top reactions with smooth animations and hover effects
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Conditional import for framer-motion with fallbacks
let motion: any;
let AnimatePresence: any;

try {
    const framerMotion = require("framer-motion");
    motion = framerMotion.motion;
    AnimatePresence = framerMotion.AnimatePresence;
} catch {
    // Fallback components when framer-motion is not available
    motion = {
        div: React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />),
        button: React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />),
    };
    AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

import {
    useReactionStore,
    useReactionAnalytics,
    type ReactionSummary,
    type PublicReaction,
    type ReactionAnalytics,
} from "@/lib/reaction";

import {
    formatReactionEmoji,
    formatReactionName,
    formatReactionCount,
    sortReactionSummariesByCount,
    getDominantReaction,
    calculateReactionDiversity,
    getReactionSentiment,
    getReactionAriaLabel,
    getCategoryColor,
} from "@/lib/utils/reaction.utils";

export interface ReactionDisplayProps {
    /** Target type for reactions */
    targetType: 'POST' | 'COMMENT';
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is clicked (to toggle) */
    onReactionClick?: (reaction: PublicReaction) => void;
    /** Whether to show detailed analytics */
    showAnalytics?: boolean;
    /** Maximum reactions to display before showing "+X more" */
    maxDisplay?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Custom class name */
    className?: string;
    /** Whether to show user avatars in tooltip */
    showUserAvatars?: boolean;
    /** Callback when "more reactions" is clicked */
    onShowAllReactions?: () => void;
}

// Size configuration using a typed constant
const SIZE_CONFIG = {
    sm: {
        button: "h-6 px-2 text-xs",
        emoji: "text-sm",
        count: "text-xs",
        gap: "gap-1",
    },
    md: {
        button: "h-8 px-2.5 text-sm",
        emoji: "text-base",
        count: "text-sm",
        gap: "gap-1.5",
    },
    lg: {
        button: "h-10 px-3 text-base",
        emoji: "text-lg",
        count: "text-sm",
        gap: "gap-2",
    },
} as const;

export const ReactionDisplay = React.memo(function ReactionDisplay({
    targetType,
    targetId,
    onReactionClick,
    showAnalytics = false,
    maxDisplay = 6,
    size = 'md',
    className,
    showUserAvatars = false,
    onShowAllReactions,
}: ReactionDisplayProps) {
    const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Store hooks
    const { loadReactionAnalytics, getReactionById } = useReactionStore();
    const analytics = useReactionAnalytics(targetType, targetId);

    // Load analytics on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await loadReactionAnalytics(targetType, targetId);
            setIsLoading(false);
        };
        loadData();
    }, [targetType, targetId, loadReactionAnalytics]);

    // Memoize sorted reactions using utility function
    const sortedReactions = useMemo(() => {
        if (!analytics?.reactions_breakdown) return [];
        return sortReactionSummariesByCount(analytics.reactions_breakdown);
    }, [analytics?.reactions_breakdown]);

    // Memoize displayed reactions
    const displayedReactions = useMemo(() =>
        sortedReactions.slice(0, maxDisplay),
        [sortedReactions, maxDisplay]
    );

    // Calculate hidden count
    const hiddenCount = useMemo(() =>
        Math.max(0, sortedReactions.length - maxDisplay),
        [sortedReactions.length, maxDisplay]
    );

    // Get total reactions
    const totalReactions = analytics?.total_reactions ?? 0;

    // Calculate analytics insights using utilities
    const analyticsInsights = useMemo(() => {
        if (!analytics?.reactions_breakdown) return null;

        return {
            diversity: calculateReactionDiversity(analytics.reactions_breakdown),
            sentiment: getReactionSentiment(analytics.reactions_breakdown),
            dominant: getDominantReaction(analytics.reactions_breakdown),
        };
    }, [analytics?.reactions_breakdown]);

    // Memoized callback for reaction click
    const handleReactionClick = useCallback((reactionSummary: ReactionSummary) => {
        const reaction = getReactionById(reactionSummary.reaction_id);
        if (reaction && onReactionClick) {
            onReactionClick(reaction);
        }
    }, [getReactionById, onReactionClick]);

    // Memoized callback for hover events
    const handleMouseEnter = useCallback((reactionId: number) => {
        setHoveredReaction(reactionId);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoveredReaction(null);
    }, []);

    // Memoized callback for showing all reactions
    const handleShowAllReactions = useCallback(() => {
        if (onShowAllReactions) {
            onShowAllReactions();
        }
    }, [onShowAllReactions]);

    // Get size classes using utility constant
    const sizeClasses = SIZE_CONFIG[size];

    // Loading skeleton
    if (isLoading) {
        return (
            <div
                className={cn("flex items-center", sizeClasses.gap, className)}
                role="status"
                aria-label="Loading reactions"
            >
                {/* Loading skeleton */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full bg-gray-200 animate-pulse",
                            sizeClasses.button.replace('h-', 'h-').split(' ')[0],
                            size === 'sm' && "w-12",
                            size === 'md' && "w-16",
                            size === 'lg' && "w-20"
                        )}
                    />
                ))}
            </div>
        );
    }

    // Empty state
    if (!analytics || sortedReactions.length === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <div
                className={cn("flex items-center", sizeClasses.gap, className)}
                role="group"
                aria-label={`${totalReactions} reaction${totalReactions === 1 ? '' : 's'} on this ${targetType.toLowerCase()}`}
            >
                {/* Live region for accessibility */}
                <div
                    className="sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {totalReactions > 0 && (
                        `${totalReactions} reaction${totalReactions === 1 ? '' : 's'} total`
                    )}
                </div>

                <AnimatePresence mode="popLayout">
                    {displayedReactions.map((reactionSummary, index) => {
                        // Create a minimal PublicReaction object for utility functions
                        const reactionData: Pick<PublicReaction, 'emoji_unicode' | 'name' | 'id' | 'category'> = {
                            id: reactionSummary.reaction_id,
                            emoji_unicode: reactionSummary.emoji_unicode,
                            name: reactionSummary.reaction_name,
                            category: reactionSummary.category,
                        };

                        const categoryColor = getCategoryColor(reactionSummary.category);
                        const isHovered = hoveredReaction === reactionSummary.reaction_id;

                        return (
                            <motion.div
                                key={reactionSummary.reaction_id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    duration: 0.2,
                                    delay: index * 0.05,
                                    ease: "easeOut",
                                }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={reactionSummary.user_reacted ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleReactionClick(reactionSummary)}
                                            onMouseEnter={() => handleMouseEnter(reactionSummary.reaction_id)}
                                            onMouseLeave={handleMouseLeave}
                                            className={cn(
                                                sizeClasses.button,
                                                "relative rounded-full border-2 transition-all duration-200",
                                                reactionSummary.user_reacted
                                                    ? "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                                                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                                                isHovered && "scale-105 shadow-md"
                                            )}
                                            aria-label={getReactionAriaLabel(
                                                reactionData as PublicReaction,
                                                reactionSummary.count
                                            )}
                                            aria-pressed={reactionSummary.user_reacted}
                                        >
                                            <span className={cn(sizeClasses.emoji, "mr-1")}>
                                                {formatReactionEmoji(reactionData as PublicReaction)}
                                            </span>
                                            <span className={sizeClasses.count}>
                                                {formatReactionCount(reactionSummary.count)}
                                            </span>

                                            {/* Glow effect for user's reactions */}
                                            {reactionSummary.user_reacted && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-blue-200 opacity-30"
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent
                                        side="top"
                                        className="max-w-xs"
                                        sideOffset={8}
                                    >
                                        <div className="text-center">
                                            <div className="font-medium">
                                                {formatReactionName(reactionData as PublicReaction)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {reactionSummary.count === 1
                                                    ? '1 person reacted'
                                                    : `${formatReactionCount(reactionSummary.count)} people reacted`
                                                }
                                            </div>
                                            {reactionSummary.user_reacted && (
                                                <div className="text-xs text-blue-600 mt-1 font-medium">
                                                    ✓ You reacted with this
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* More reactions indicator */}
                {hiddenCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: displayedReactions.length * 0.05 }}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="outline"
                                    onClick={handleShowAllReactions}
                                    className={cn(
                                        sizeClasses.button,
                                        "rounded-full border-2 border-gray-200 bg-white text-gray-500",
                                        "hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                                    )}
                                    role="button"
                                    aria-label={`Show ${hiddenCount} more reaction${hiddenCount === 1 ? '' : 's'}`}
                                >
                                    +{hiddenCount}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                                <div className="text-center">
                                    <div className="font-medium">
                                        {hiddenCount} more reaction{hiddenCount === 1 ? '' : 's'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Click to see all reactions
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </motion.div>
                )}

                {/* Analytics info with insights */}
                {showAnalytics && totalReactions > 0 && analyticsInsights && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="ml-3 text-xs text-gray-500"
                        role="status"
                        aria-label="Reaction analytics"
                    >
                        <div>
                            {formatReactionCount(totalReactions)} total reaction{totalReactions === 1 ? '' : 's'}
                        </div>
                        {analytics.unique_users > 0 && (
                            <div className="mt-0.5">
                                from {analytics.unique_users} user{analytics.unique_users === 1 ? '' : 's'}
                            </div>
                        )}
                        {analyticsInsights.dominant && (
                            <div className="mt-0.5 font-medium">
                                Most popular: {formatReactionEmoji({
                                    emoji_unicode: analyticsInsights.dominant.emoji_unicode
                                } as PublicReaction)}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </TooltipProvider>
    );
});

export default ReactionDisplay;
