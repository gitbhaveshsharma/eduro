"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import dayjs, { Dayjs } from "dayjs";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Dynamic imports for heavy MUI dependencies - reduces initial bundle by ~300KB
const TextField = dynamic(() => import("@mui/material/TextField"), {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full" />
});
const LocalizationProvider = dynamic(
    () => import("@mui/x-date-pickers/LocalizationProvider").then(mod => ({ default: mod.LocalizationProvider })),
    { ssr: false }
);
const MuiTimePicker = dynamic(
    () => import("@mui/x-date-pickers/TimePicker").then(mod => ({ default: mod.TimePicker })),
    { ssr: false, loading: () => <Skeleton className="h-10 w-full" /> }
);

// Lazy load adapter and renderers
const getAdapterAndRenderers = async () => {
    const [{ AdapterDayjs }, { renderTimeViewClock }] = await Promise.all([
        import("@mui/x-date-pickers/AdapterDayjs"),
        import("@mui/x-date-pickers/timeViewRenderers")
    ]);
    return { AdapterDayjs, renderTimeViewClock };
};

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
    const [adapter, setAdapter] = React.useState<any>(null);
    const [clockRenderer, setClockRenderer] = React.useState<any>(null);

    // Lazy load adapter on mount
    React.useEffect(() => {
        getAdapterAndRenderers().then(({ AdapterDayjs, renderTimeViewClock }) => {
            setAdapter(() => AdapterDayjs);
            setClockRenderer(() => renderTimeViewClock);
        });
    }, []);

    if (!adapter) {
        return <Skeleton className="h-10 w-full" />;
    }

    return (
        <LocalizationProvider dateAdapter={adapter}>
            <MuiTimePicker
                label={label}
                value={parsed}
                ampm={ampm} // Enable AM/PM
                onChange={(newValue: Dayjs | null) => {
                    const formatted = formatDayjsToHHMM(newValue, ampm);
                    onChange?.(formatted);
                }}
                viewRenderers={useClockView && clockRenderer ? {
                    hours: clockRenderer,
                    minutes: clockRenderer,
                    seconds: clockRenderer,
                } : undefined}
                slotProps={{
                    textField: {
                        className: className,
                        size: "small"
                    }
                }}
            />
        </LocalizationProvider>
    );
}

export default TimePicker;