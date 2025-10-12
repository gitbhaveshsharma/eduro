/**
 * Post Reactions Component
 * 
 * Complete reaction system for posts that combines:
 * 1. Display of existing reactions with counts
 * 2. Quick reaction bar (top 5 popular reactions + plus button)
 * 3. Reaction picker modal
 */

"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ReactionDisplay } from "./reaction-display";
import { ReactionBar } from "./reaction-bar";
import { type PublicReaction } from "@/lib/reaction";

export interface PostReactionsProps {
    /** Target type for reactions */
    targetType: 'POST' | 'COMMENT';
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is added/removed */
    onReactionChange?: (reaction: PublicReaction, action: 'add' | 'remove') => void;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Layout style */
    layout?: 'stacked' | 'inline';
    /** Custom class name */
    className?: string;
    /** Whether to show detailed analytics */
    showAnalytics?: boolean;
    /** Maximum reaction display count */
    maxDisplay?: number;
}

export function PostReactions({
    targetType,
    targetId,
    onReactionChange,
    size = 'md',
    layout = 'stacked',
    className,
    showAnalytics = false,
    maxDisplay = 5,
}: PostReactionsProps) {
    const [hasReactions, setHasReactions] = useState(false);

    const handleReactionSelect = (reaction: PublicReaction) => {
        // When user selects a reaction from the bar or picker
        // This will either add the reaction or switch to it if they had a different one
        onReactionChange?.(reaction, 'add');
    };

    const handleReactionClick = (reaction: PublicReaction) => {
        // When user clicks on an existing reaction chip
        // This will toggle it (remove if it's theirs, or switch to it)
        onReactionChange?.(reaction, 'remove');
    };

    const handleShowAllReactions = () => {
        // Handle showing all reactions modal (future enhancement)
        console.log('Show all reactions modal');
    };

    if (layout === 'inline') {
        return (
            <div className={cn("flex items-center gap-4", className)}>
                {/* Existing Reactions */}
                <ReactionDisplay
                    targetType={targetType}
                    targetId={targetId}
                    onReactionClick={handleReactionClick}
                    showAnalytics={showAnalytics}
                    maxDisplay={maxDisplay}
                    size={size}
                    onShowAllReactions={handleShowAllReactions}
                />
            </div>
        );
    }

    // Stacked layout (default)
    return (
        <div className={cn("space-y-3", className)}>
            {/* Existing Reactions */}
            <ReactionDisplay
                targetType={targetType}
                targetId={targetId}
                onReactionClick={handleReactionClick}
                showAnalytics={showAnalytics}
                maxDisplay={maxDisplay}
                size={size}
                onShowAllReactions={handleShowAllReactions}
            />
        </div>
    );
}

export default PostReactions;