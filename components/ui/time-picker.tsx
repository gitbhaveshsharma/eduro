"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker as MuiTimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from "dayjs";

interface TimePickerProps {
    value?: string; // expects "HH:mm" but will handle 12-hour format
    onChange?: (value: string) => void;
    label?: string;
    className?: string;
    useClockView?: boolean;
    ampm?: boolean; // Add this prop to control AM/PM
}

const parseHHMMToDayjs = (hhmm?: string): Dayjs | null => {
    if (!hhmm) return null;

    // Handle both 24-hour (HH:mm) and 12-hour (hh:mm AM/PM) formats
    const timeString = hhmm.toUpperCase();
    let hours: number, minutes: number;

    if (timeString.includes('AM') || timeString.includes('PM')) {
        // Parse 12-hour format
        const [time, period] = timeString.split(' ');
        const [hh, mm] = time.split(':');
        hours = parseInt(hh, 10);
        minutes = parseInt(mm, 10);

        // Convert to 24-hour format for internal storage
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else {
        // Parse 24-hour format
        const [hh, mm] = hhmm.split(':');
        hours = parseInt(hh, 10);
        minutes = parseInt(mm, 10);
    }

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
};

const formatDayjsToHHMM = (d: Dayjs | null | undefined, ampm: boolean = true): string => {
    if (!d) return "";

    if (ampm) {
        // Return in 12-hour format with AM/PM
        return d.format('hh:mm A');
    } else {
        // Return in 24-hour format
        const hh = String(d.hour()).padStart(2, "0");
        const mm = String(d.minute()).padStart(2, "0");
        return `${hh}:${mm}`;
    }
};

export function TimePicker({
    value,
    onChange,
    label,
    className,
    useClockView = true,
    ampm = true // Default to AM/PM format
}: TimePickerProps) {
    const parsed = React.useMemo(() => parseHHMMToDayjs(value), [value]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiTimePicker
                label={label}
                value={parsed}
                ampm={ampm} // Enable AM/PM
                onChange={(newValue) => {
                    const formatted = formatDayjsToHHMM(newValue as Dayjs | null, ampm);
                    onChange?.(formatted);
                }}
                viewRenderers={useClockView ? {
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                    seconds: renderTimeViewClock,
                } : undefined}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        className={className}
                        size="small"
                    />
                )}
            />
        </LocalizationProvider>
    );
}

export default TimePicker;