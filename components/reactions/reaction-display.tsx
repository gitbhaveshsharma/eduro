/**
 * Reaction Display Component
 * 
 * Shows existing reactions on a post/comment with counts and user interactions
 * Displays top reactions with smooth animations and hover effects
 * On hover (200ms), reveals a floating ReactionBar with bubble-pop animation
 * 
 * ✅ Uses PostReactionStore for real-time reaction updates
 * ✅ Proper subscription management with automatic cleanup
 * ✅ Optimized re-renders with selective state subscriptions
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

import { ReactionBar } from "./reaction-bar";

// ✅ Import PostReactionStore hooks
import { useReactionSubscription } from "@/lib/store/post-reaction.store";

export interface ReactionDisplayProps {
    /** Target type for reactions */
    targetType: "POST" | "COMMENT";
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is clicked (to toggle) */
    onReactionClick?: (reaction: PublicReaction) => void;
    /** Whether to show detailed analytics */
    showAnalytics?: boolean;
    /** Maximum reactions to display before showing "+X more" */
    maxDisplay?: number;
    /** Size variant */
    size?: "sm" | "md" | "lg";
    /** Custom class name */
    className?: string;
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
    size = "md",
    className,
    onShowAllReactions,
}: ReactionDisplayProps) {
    const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Flyout state and refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const flyoutRef = useRef<HTMLDivElement | null>(null);
    const hoverTimerRef = useRef<number | null>(null);

    const [isGroupHover, setIsGroupHover] = useState(false);
    const [isFlyoutHover, setIsFlyoutHover] = useState(false);
    const [isFocusInside, setIsFocusInside] = useState(false);
    const [showBar, setShowBar] = useState(false);

    // Store hooks
    const { loadReactionAnalytics, getReactionById, loadAllReactions } = useReactionStore();
    const analytics = useReactionAnalytics(targetType, targetId);

    // ✅ FIXED: Use the proper hook for subscription management
    // This handles all subscription logic automatically with proper cleanup
    useReactionSubscription(targetType, targetId, true);

    // ✅ Load analytics on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await loadReactionAnalytics(targetType, targetId);
            } catch (error) {
                console.error('[ReactionDisplay] Error loading analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [targetType, targetId, loadReactionAnalytics]);

    // Default reaction id to show when there are no reactions
    const DEFAULT_REACTION_ID = 1;
    const defaultReaction = getReactionById(DEFAULT_REACTION_ID) as PublicReaction | null;

    // Ensure reactions catalog is loaded so defaultReaction can be resolved
    useEffect(() => {
        if (!defaultReaction) {
            // Fire-and-forget: load the reaction catalog so getReactionById can find id 1
            loadAllReactions().catch(() => undefined);
        }
    }, [defaultReaction, loadAllReactions]);

    // Memoize sorted reactions using utility function
    const sortedReactions = useMemo(() => {
        if (!analytics?.reactions_breakdown) return [];
        return sortReactionSummariesByCount(analytics.reactions_breakdown);
    }, [analytics?.reactions_breakdown]);

    // Memoize displayed reactions
    const displayedReactions = useMemo(
        () => sortedReactions.slice(0, maxDisplay),
        [sortedReactions, maxDisplay]
    );

    // Calculate hidden count
    const hiddenCount = useMemo(
        () => Math.max(0, sortedReactions.length - maxDisplay),
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

    // Reaction click
    const handleReactionClick = useCallback(
        (reactionSummary: ReactionSummary) => {
            const reaction = getReactionById(reactionSummary.reaction_id);
            if (reaction && onReactionClick) {
                onReactionClick(reaction);
            }
        },
        [getReactionById, onReactionClick]
    );

    // Chip hover
    const handleMouseEnterChip = useCallback((reactionId: number) => {
        setHoveredReaction(reactionId);
    }, []);

    const handleMouseLeaveChip = useCallback(() => {
        setHoveredReaction(null);
    }, []);

    // Flyout timing and visibility
    const openBarWithDelay = useCallback(() => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = window.setTimeout(() => setShowBar(true), 200);
    }, []);

    const cancelBarDelay = useCallback(() => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const maybeCloseBar = useCallback(() => {
        if (!isGroupHover && !isFlyoutHover && !isFocusInside) {
            setShowBar(false);
        }
    }, [isGroupHover, isFlyoutHover, isFocusInside]);

    const onGroupPointerEnter = useCallback(() => {
        setIsGroupHover(true);
        openBarWithDelay();
    }, [openBarWithDelay]);

    const onGroupPointerLeave = useCallback(() => {
        setIsGroupHover(false);
        cancelBarDelay();
        window.setTimeout(maybeCloseBar, 80);
    }, [cancelBarDelay, maybeCloseBar]);

    const onFlyoutPointerEnter = useCallback(() => {
        setIsFlyoutHover(true);
    }, []);

    const onFlyoutPointerLeave = useCallback(() => {
        setIsFlyoutHover(false);
        window.setTimeout(maybeCloseBar, 80);
    }, [maybeCloseBar]);

    // Focus tracking on the group
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const onFocusIn = () => setIsFocusInside(true);
        const onFocusOut = () => {
            setIsFocusInside(false);
            window.setTimeout(maybeCloseBar, 80);
        };

        node.addEventListener("focusin", onFocusIn);
        node.addEventListener("focusout", onFocusOut);
        return () => {
            node.removeEventListener("focusin", onFocusIn);
            node.removeEventListener("focusout", onFocusOut);
        };
    }, [maybeCloseBar]);

    // Close on outside click/tap
    useEffect(() => {
        const onDocPointerDown = (e: PointerEvent) => {
            const group = containerRef.current;
            const fly = flyoutRef.current;
            const target = e.target as Node;
            const insideGroup = !!(group && group.contains(target));
            const insideFly = !!(fly && fly.contains(target));
            if (!insideGroup && !insideFly) {
                setIsGroupHover(false);
                setIsFlyoutHover(false);
                setIsFocusInside(false);
                cancelBarDelay();
                setShowBar(false);
            }
        };
        document.addEventListener("pointerdown", onDocPointerDown);
        return () => {
            document.removeEventListener("pointerdown", onDocPointerDown);
        };
    }, [cancelBarDelay]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
        };
    }, []);

    // Get size classes
    const sizeClasses = SIZE_CONFIG[size];

    // Loading skeleton
    if (isLoading) {
        return (
            <div
                className={cn("flex items-center", sizeClasses.gap, className)}
                role="status"
                aria-label="Loading reactions"
            >
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full bg-gray-200 animate-pulse",
                            sizeClasses.button.replace("h-", "h-").split(" ")[0],
                            size === "sm" && "w-12",
                            size === "md" && "w-16",
                            size === "lg" && "w-20"
                        )}
                    />
                ))}
            </div>
        );
    }

    // If there's no analytics or no reactions yet, still render a minimal control
    const shouldRenderEmptyControl = !analytics || sortedReactions.length === 0;

    if (shouldRenderEmptyControl) {
        return (
            <div className={cn("relative inline-flex items-center", sizeClasses.gap, className)}>
                {/* Provide a simple ReactionBar trigger so users can add the first reaction */}
                <div
                    ref={containerRef}
                    className="relative"
                    onPointerEnter={() => openBarWithDelay()}
                    onPointerLeave={() => {
                        cancelBarDelay();
                        maybeCloseBar();
                    }}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (defaultReaction) {
                                onReactionClick?.(defaultReaction as PublicReaction);
                            } else {
                                setShowBar((v) => !v);
                            }
                        }}
                        className={cn(sizeClasses.button, "rounded-full")}
                        aria-label="Add reaction"
                    >
                        {defaultReaction ? (
                            <>
                                <span className={cn(sizeClasses.emoji, "mr-1")}>
                                    {formatReactionEmoji(defaultReaction)}
                                </span>
                                <span className={sizeClasses.count}>{defaultReaction.name}</span>
                            </>
                        ) : (
                            <ThumbsUp />
                        )}
                    </Button>

                    <AnimatePresence>
                        {showBar && (
                            <motion.div
                                ref={flyoutRef}
                                key="reaction-bar-empty-flyout"
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: -8, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.12 }}
                                className={cn("absolute -top-2 left-0 z-20 translate-y-[-100%]")}
                                onPointerEnter={onFlyoutPointerEnter}
                                onPointerLeave={onFlyoutPointerLeave}
                                role="dialog"
                                aria-label="Quick reactions"
                            >
                                <div className="rounded-full border border-gray-200 bg-white/90 px-2 py-1 shadow-lg">
                                    <ReactionBar
                                        targetType={targetType}
                                        targetId={targetId}
                                        onReactionSelect={(reaction) => {
                                            onReactionClick?.(reaction);
                                            setShowBar(false);
                                        }}
                                        size={size}
                                        className="px-0"
                                        maxReactions={5}
                                        showHoverEffects
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative inline-flex items-center", sizeClasses.gap, className)}
            role="group"
            aria-label={`${totalReactions} reaction${totalReactions === 1 ? "" : "s"} on this ${targetType.toLowerCase()}`}
            onPointerEnter={onGroupPointerEnter}
            onPointerLeave={onGroupPointerLeave}
        >
            {/* Floating ReactionBar (bubble pop) */}
            <AnimatePresence>
                {showBar && (
                    <motion.div
                        ref={flyoutRef}
                        key="reaction-bar-flyout"
                        initial={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: -8, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className={cn("absolute -top-2 left-0 z-20", "translate-y-[-100%]")}
                        onPointerEnter={onFlyoutPointerEnter}
                        onPointerLeave={onFlyoutPointerLeave}
                        role="dialog"
                        aria-label="Quick reactions"
                    >
                        <div
                            className={cn(
                                "rounded-full border border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-lg",
                                "px-2 py-1"
                            )}
                        >
                            <ReactionBar
                                targetType={targetType}
                                targetId={targetId}
                                onReactionSelect={(reaction) => {
                                    onReactionClick?.(reaction);
                                    setShowBar(false);
                                }}
                                size={size}
                                className="px-0"
                                maxReactions={5}
                                showHoverEffects
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live region for accessibility */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {totalReactions > 0 && `${totalReactions} reaction${totalReactions === 1 ? "" : "s"} total`}
            </div>

            <AnimatePresence mode="popLayout">
                {displayedReactions.map((reactionSummary, index) => {
                    const reactionData: Pick<PublicReaction, "emoji_unicode" | "name" | "id" | "category"> = {
                        id: reactionSummary.reaction_id,
                        emoji_unicode: reactionSummary.emoji_unicode,
                        name: reactionSummary.reaction_name,
                        category: reactionSummary.category,
                    };

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
                            <Button
                                variant={reactionSummary.user_reacted ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleReactionClick(reactionSummary)}
                                onMouseEnter={() => handleMouseEnterChip(reactionSummary.reaction_id)}
                                onMouseLeave={handleMouseLeaveChip}
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

                                {reactionSummary.user_reacted && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-blue-200 opacity-30"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </Button>
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
                    <Badge
                        variant="outline"
                        onClick={onShowAllReactions}
                        className={cn(
                            sizeClasses.button,
                            "rounded-full border-2 border-gray-200 bg-white text-gray-500",
                            "hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                        )}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onShowAllReactions?.();
                            }
                        }}
                        aria-label={`Show ${hiddenCount} more reaction${hiddenCount === 1 ? "" : "s"}`}
                    >
                        +{hiddenCount}
                    </Badge>
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
                        {formatReactionCount(totalReactions)} total reaction{totalReactions === 1 ? "" : "s"}
                    </div>
                    {analytics.unique_users > 0 && (
                        <div className="mt-0.5">
                            from {analytics.unique_users} user{analytics.unique_users === 1 ? "" : "s"}
                        </div>
                    )}
                    {analyticsInsights.dominant && (
                        <div className="mt-0.5 font-medium">
                            Most popular:{" "}
                            {formatReactionEmoji({
                                emoji_unicode: analyticsInsights.dominant.emoji_unicode,
                            } as PublicReaction)}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
});

export default ReactionDisplay;
