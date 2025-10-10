/**
 * Reaction System Component
 * 
 * Complete reaction system that combines display and trigger functionality
 * Perfect for posts, comments, and any interactive content
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ReactionDisplay } from "./reaction-display";
import { ReactionTrigger } from "./reaction-trigger";
import { type PublicReaction } from "@/lib/reaction";

export interface ReactionSystemProps {
    /** Target type for reactions */
    targetType: 'POST' | 'COMMENT';
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is added/removed */
    onReactionChange?: (reaction: PublicReaction, action: 'add' | 'remove') => void;
    /** Whether to show analytics */
    showAnalytics?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Layout orientation */
    layout?: 'horizontal' | 'vertical';
    /** Custom class name */
    className?: string;
    /** Whether the user can interact */
    interactive?: boolean;
    /** Trigger button style */
    triggerVariant?: 'default' | 'ghost' | 'outline';
    /** Maximum reactions to display */
    maxDisplay?: number;
}

export function ReactionSystem({
    targetType,
    targetId,
    onReactionChange,
    showAnalytics = false,
    size = 'md',
    layout = 'horizontal',
    className,
    interactive = true,
    triggerVariant = 'ghost',
    maxDisplay = 6,
}: ReactionSystemProps) {

    const handleReactionSelect = (reaction: PublicReaction) => {
        // In a real implementation, you would check if user already reacted
        // and either add or remove the reaction accordingly
        onReactionChange?.(reaction, 'add');
    };

    const handleReactionClick = (reaction: PublicReaction) => {
        // This handles clicking on existing reactions (to remove)
        onReactionChange?.(reaction, 'remove');
    };

    if (layout === 'vertical') {
        return (
            <div className={cn("flex flex-col gap-3", className)}>
                <ReactionDisplay
                    targetType={targetType}
                    targetId={targetId}
                    onReactionClick={interactive ? handleReactionClick : undefined}
                    showAnalytics={showAnalytics}
                    maxDisplay={maxDisplay}
                    size={size}
                />

                {interactive && (
                    <ReactionTrigger
                        targetType={targetType}
                        targetId={targetId}
                        onReactionSelect={handleReactionSelect}
                        variant={triggerVariant}
                        size={size}
                        showLabel={true}
                        tooltip="Add a reaction"
                    />
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <ReactionDisplay
                targetType={targetType}
                targetId={targetId}
                onReactionClick={interactive ? handleReactionClick : undefined}
                showAnalytics={showAnalytics}
                maxDisplay={maxDisplay}
                size={size}
            />

            {interactive && (
                <ReactionTrigger
                    targetType={targetType}
                    targetId={targetId}
                    onReactionSelect={handleReactionSelect}
                    variant={triggerVariant}
                    size={size}
                    tooltip="Add a reaction"
                    animation="bounce"
                />
            )}
        </div>
    );
}

export default ReactionSystem;