"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
    value?: string; // Format: "hh:mm AM/PM" or "HH:mm" depending on outputFormat
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
    error?: string;
    required?: boolean;
    outputFormat?: '12h' | '24h'; // Output format: 12-hour (default) or 24-hour
}

interface TimeComponents {
    hours: string;
    minutes: string;
    period: "AM" | "PM";
}

/**
 * Parse time string into components (12-hour format only)
 * Valid format: "hh:mm AM/PM"
 */
const parseTime = (value?: string): TimeComponents => {
    if (!value) {
        return { hours: "12", minutes: "00", period: "AM" };
    }

    const trimmed = value.trim().toUpperCase();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

    if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3] as "AM" | "PM";

        // Validate hours are in range 1-12
        if (hours >= 1 && hours <= 12) {
            return {
                hours: String(hours).padStart(2, "0"),
                minutes,
                period,
            };
        }
    }

    return { hours: "12", minutes: "00", period: "AM" };
};

/**
 * Format components into time string
 */
const formatTime = (components: TimeComponents): string => {
    return `${components.hours}:${components.minutes} ${components.period}`;
};

/**
 * Convert 12-hour time to 24-hour format
 */
const convertTo24Hour = (components: TimeComponents): string => {
    let hours = parseInt(components.hours, 10);
    const minutes = components.minutes;
    const period = components.period;

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
};

/**
 * Parse 24-hour time string into components
 */
const parse24HourTime = (time24h: string): TimeComponents => {
    const match = time24h.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return { hours: "12", minutes: "00", period: "AM" };
    }

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return {
        hours: String(displayHours).padStart(2, "0"),
        minutes,
        period,
    };
};

/**
 * Validate and normalize time input
 */
const normalizeTime = (components: TimeComponents): TimeComponents => {
    let hours = Math.max(1, Math.min(12, parseInt(components.hours, 10) || 1));
    let minutes = Math.max(0, Math.min(59, parseInt(components.minutes, 10) || 0));

    return {
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        period: components.period,
    };
};

/**
 * Zod validation for time string
 */
export const timePickerSchema = {
    validate: (value: string): { success: boolean; error?: string } => {
        if (!value.trim()) {
            return { success: false, error: "Time is required" };
        }

        const trimmed = value.trim().toUpperCase();
        const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

        if (!match) {
            return { success: false, error: 'Invalid format. Use "hh:mm AM/PM"' };
        }

        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3] as "AM" | "PM";

        if (hours < 1 || hours > 12) {
            return { success: false, error: "Hours must be between 1 and 12" };
        }

        if (minutes < 0 || minutes > 59) {
            return { success: false, error: "Minutes must be between 0 and 59" };
        }

        if (period !== "AM" && period !== "PM") {
            return { success: false, error: "Period must be AM or PM" };
        }

        return { success: true };
    },
};

/**
 * Reusable Time Picker Component with strict validation
 * Only accepts valid 12-hour format time entries
 */
export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
    (
        {
            value,
            onChange,
            label,
            placeholder = "Select time",
            disabled = false,
            className,
            inputClassName,
            error,
            required,
            outputFormat = '12h', // Default to 12-hour format for backward compatibility
        },
        ref
    ) => {
        const [open, setOpen] = React.useState(false);
        const [internalValue, setInternalValue] = React.useState(value || "");
        const [components, setComponents] = React.useState<TimeComponents>(() => {
            // Parse input value based on format
            if (!value) return { hours: "12", minutes: "00", period: "AM" };

            // Check if it's 24-hour format (HH:mm)
            if (outputFormat === '24h' || value.match(/^\d{1,2}:\d{2}$/)) {
                return parse24HourTime(value);
            }

            // Otherwise parse as 12-hour format
            return parseTime(value);
        });
        const [inputError, setInputError] = React.useState("");

        // Update internal state when value prop changes
        React.useEffect(() => {
            if (value !== undefined) {
                let parsed: TimeComponents;

                // Parse based on input format
                if (value.match(/^\d{1,2}:\d{2}$/)) {
                    // 24-hour format
                    parsed = parse24HourTime(value);
                } else {
                    // 12-hour format
                    parsed = parseTime(value);
                }

                const normalized = normalizeTime(parsed);
                setInternalValue(formatTime(normalized));
                setComponents(normalized);
                setInputError("");
            }
        }, [value]);

        const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newHours = e.target.value.replace(/\D/g, "").slice(0, 2);
            if (newHours === "" || newHours === "0") return;

            const hours = parseInt(newHours, 10);
            if (hours < 1 || hours > 12) {
                setInputError("Hours must be 1-12");
                return;
            }

            setInputError("");
            const newComponents = normalizeTime({
                ...components,
                hours: String(hours).padStart(2, "0"),
            });
            setComponents(newComponents);
            const formatted = formatTime(newComponents);
            setInternalValue(formatted);

            // Output in requested format
            const output = outputFormat === '24h' ? convertTo24Hour(newComponents) : formatted;
            onChange?.(output);
        };

        const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newMinutes = e.target.value.replace(/\D/g, "").slice(0, 2);
            if (newMinutes === "") return;

            const minutes = parseInt(newMinutes, 10);
            if (minutes < 0 || minutes > 59) {
                setInputError("Minutes must be 0-59");
                return;
            }

            setInputError("");
            const newComponents = normalizeTime({
                ...components,
                minutes: String(minutes).padStart(2, "0"),
            });
            setComponents(newComponents);
            const formatted = formatTime(newComponents);
            setInternalValue(formatted);

            // Output in requested format
            const output = outputFormat === '24h' ? convertTo24Hour(newComponents) : formatted;
            onChange?.(output);
        };

        const handlePeriodChange = (period: "AM" | "PM") => {
            setInputError("");
            const newComponents = { ...components, period };
            setComponents(newComponents);
            const formatted = formatTime(newComponents);
            setInternalValue(formatted);

            // Output in requested format
            const output = outputFormat === '24h' ? convertTo24Hour(newComponents) : formatted;
            onChange?.(output);
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setInternalValue(val);
            setInputError("");
        };

        const handleInputBlur = () => {
            if (!internalValue.trim()) {
                const newComponents: TimeComponents = { hours: "12", minutes: "00", period: "AM" };
                setComponents(newComponents);
                setInputError("");
                onChange?.("");
                return;
            }

            const validation = timePickerSchema.validate(internalValue);
            if (!validation.success) {
                setInputError(validation.error || "Invalid time");
                return;
            }

            const parsed = parseTime(internalValue);
            const normalized = normalizeTime(parsed);
            const formatted = formatTime(normalized);

            setInputError("");
            setInternalValue(formatted);
            setComponents(normalized);

            // Output in requested format
            const output = outputFormat === '24h' ? convertTo24Hour(normalized) : formatted;
            onChange?.(output);
        };

        const handleClear = () => {
            setInternalValue("");
            setComponents({ hours: "12", minutes: "00", period: "AM" });
            setInputError("");
            onChange?.("");
            setOpen(false);
        };

        const handleQuickSet = (hours: number, minutes: number = 0) => {
            setInputError("");
            const period = hours >= 12 ? "PM" : "AM";
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

            const newComponents: TimeComponents = {
                hours: String(displayHours).padStart(2, "0"),
                minutes: String(minutes).padStart(2, "0"),
                period,
            };

            setComponents(newComponents);
            const formatted = formatTime(newComponents);
            setInternalValue(formatted);

            // Output in requested format
            const output = outputFormat === '24h' ? convertTo24Hour(newComponents) : formatted;
            onChange?.(output);
        };

        return (
            <div className={cn("w-full", className)}>
                {label && (
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-between text-left font-normal",
                                !internalValue && "text-muted-foreground",
                                (error || inputError) && "border-destructive",
                                inputClassName
                            )}
                            disabled={disabled}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                {internalValue || placeholder}
                            </span>
                            {internalValue && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClear();
                                    }}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.stopPropagation();
                                            handleClear();
                                        }
                                    }}
                                >
                                    ✕
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="start">
                        <div className="space-y-4">
                            {/* Direct Input with validation */}
                            <div>
                                <input
                                    ref={ref}
                                    type="text"
                                    value={internalValue}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    placeholder="hh:mm AM/PM"
                                    className={cn(
                                        "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                        inputError && "border-destructive"
                                    )}
                                />
                                {inputError && (
                                    <p className="text-xs text-destructive mt-1">{inputError}</p>
                                )}
                            </div>

                            {/* Time Selector */}
                            <div className="grid grid-cols-5 gap-2">
                                {/* Hours */}
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={components.hours}
                                        onChange={handleHourChange}
                                        min="1"
                                        max="12"
                                        className="w-full px-2 py-2 border border-input rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Minutes */}
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        Minutes
                                    </label>
                                    <input
                                        type="number"
                                        value={components.minutes}
                                        onChange={handleMinuteChange}
                                        min="0"
                                        max="59"
                                        className="w-full px-2 py-2 border border-input rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Period Selector */}
                                <div className="col-span-1">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        Period
                                    </label>
                                    <div className="flex gap-1">
                                        <Button
                                            variant={components.period === "AM" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePeriodChange("AM")}
                                            className="flex-1 text-xs"
                                        >
                                            AM
                                        </Button>
                                        <Button
                                            variant={components.period === "PM" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePeriodChange("PM")}
                                            className="flex-1 text-xs"
                                        >
                                            PM
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Set Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Quick select
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickSet(0, 0)}
                                        className="text-xs"
                                    >
                                        Midnight
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickSet(6, 0)}
                                        className="text-xs"
                                    >
                                        6 AM
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickSet(12, 0)}
                                        className="text-xs"
                                    >
                                        Noon
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickSet(18, 0)}
                                        className="text-xs"
                                    >
                                        6 PM
                                    </Button>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-2 pt-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    className="flex-1"
                                >
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                    className="flex-1"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {error && !inputError && (
                    <p className="text-xs text-destructive mt-1">{error}</p>
                )}
            </div>
        );
    }
);

TimePicker.displayName = "TimePicker";

export default TimePicker;