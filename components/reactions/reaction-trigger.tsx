/**
 * Reaction Trigger Component
 * 
 * A button that triggers the reaction picker with smooth animations
 * Can be used in posts, comments, or any interactive content
 */

"use client";

import React, { useState, useRef } from "react";
import { Heart, Smile, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactionPicker } from "./reaction-picker";
import { type PublicReaction } from "@/lib/reaction";

export interface ReactionTriggerProps {
    /** Target type for reactions */
    targetType: 'POST' | 'COMMENT';
    /** Target ID for reactions */
    targetId: string;
    /** Callback when a reaction is selected */
    onReactionSelect: (reaction: PublicReaction) => void;
    /** Button variant */
    variant?: 'default' | 'ghost' | 'outline';
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Icon to display */
    icon?: 'heart' | 'smile' | 'plus';
    /** Custom text label */
    label?: string;
    /** Whether to show label */
    showLabel?: boolean;
    /** Custom class name */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Custom tooltip text */
    tooltip?: string;
    /** Animation style */
    animation?: 'bounce' | 'pulse' | 'none';
}

export function ReactionTrigger({
    targetType,
    targetId,
    onReactionSelect,
    variant = 'ghost',
    size = 'md',
    icon = 'smile',
    label,
    showLabel = false,
    className,
    disabled = false,
    tooltip,
    animation = 'bounce',
}: ReactionTriggerProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleClick = () => {
        if (!disabled) {
            setIsPickerOpen(true);
        }
    };

    const handleReactionSelect = (reaction: PublicReaction) => {
        onReactionSelect(reaction);
        setIsPickerOpen(false);
    };

    const getIcon = () => {
        switch (icon) {
            case 'heart':
                return Heart;
            case 'plus':
                return Plus;
            default:
                return Smile;
        }
    };

    const Icon = getIcon();

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    button: "h-7 px-2",
                    icon: "h-3.5 w-3.5",
                    text: "text-xs",
                };
            case 'lg':
                return {
                    button: "h-11 px-4",
                    icon: "h-5 w-5",
                    text: "text-base",
                };
            default:
                return {
                    button: "h-9 px-3",
                    icon: "h-4 w-4",
                    text: "text-sm",
                };
        }
    };

    const sizeClasses = getSizeClasses();

    const getAnimationClasses = () => {
        if (animation === 'none' || disabled) return "";

        const baseClasses = "transition-all duration-200";

        switch (animation) {
            case 'pulse':
                return `${baseClasses} ${isHovered ? 'animate-pulse' : ''}`;
            case 'bounce':
                return `${baseClasses} ${isHovered ? 'animate-bounce' : ''}`;
            default:
                return baseClasses;
        }
    };

    const buttonContent = (
        <Button
            ref={triggerRef}
            variant={variant}
            size="sm"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
            className={cn(
                sizeClasses.button,
                "relative",
                getAnimationClasses(),
                isHovered && !disabled && "scale-105",
                className
            )}
        >
            <Icon
                className={cn(
                    sizeClasses.icon,
                    showLabel && "mr-2",
                    isHovered && !disabled && icon === 'heart' && "text-red-500"
                )}
            />
            {showLabel && (
                <span className={sizeClasses.text}>
                    {label || 'React'}
                </span>
            )}

            {/* Hover glow effect */}
            {isHovered && !disabled && (
                <div
                    className="absolute inset-0 rounded-md bg-current opacity-10 pointer-events-none"
                    style={{
                        animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                />
            )}
        </Button>
    );

    const triggerButton = tooltip ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ) : buttonContent;

    return (
        <>
            {triggerButton}

            {/* Reaction Picker */}
            <ReactionPicker
                isOpen={isPickerOpen}
                targetType={targetType}
                targetId={targetId}
                triggerRef={triggerRef}
                onReactionSelect={handleReactionSelect}
                onClose={() => setIsPickerOpen(false)}
            />
        </>
    );
}

export default ReactionTrigger;