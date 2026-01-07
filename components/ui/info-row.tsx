import { cn } from '@/lib/utils';

interface InfoRowProps {
    label: string;
    value: string | number | null | undefined;
    valueClassName?: string;
    labelClassName?: string;
}

export function InfoRow({
    label,
    value,
    valueClassName,
    labelClassName
}: InfoRowProps) {
    return (
        <div className="flex justify-between  py-2 items-start border-b border-muted last:border-0">
            <span className={cn("text-sm text-muted-foreground", labelClassName)}>
                {label}
            </span>
            <span className={cn("text-sm font-medium", valueClassName)}>
                {value ?? 'N/A'}
            </span>
        </div>
    );
}
