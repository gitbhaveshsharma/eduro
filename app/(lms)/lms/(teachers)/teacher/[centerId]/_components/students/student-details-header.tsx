'use client';

/**
 * Student Profile Header Component
 * Enhanced with brand-consistent background illustrations and responsive mobile design
 * Features: Email copy/mailto actions with branded tooltips and toast notifications
 * Mobile: Copy icon button, click email to open mailto
 * Desktop: Hover tooltip with copy and mailto options, shows "Copied!" feedback
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/avatar/user-avatar';
import { Mail, Phone, Calendar, MapPin, Copy, ExternalLink, Check } from 'lucide-react';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';

interface StudentProfileHeaderProps {
    enrollment: any; // Ideally use a concrete type here
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export function StudentProfileHeader({ enrollment }: StudentProfileHeaderProps) {
    const [isCopied, setIsCopied] = useState(false);

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    /**
     * Get enrollment status badge variant
     * Uses CLASS_ENROLLMENT_STATUS_OPTIONS for consistent color mapping
     * Maps to custom badge variants: default, secondary, destructive, outline, success, warning
     */
    const getEnrollmentBadgeVariant = (status: string): BadgeVariant => {
        const normalizedStatus = status.toUpperCase() as ClassEnrollmentStatus;
        
        const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[normalizedStatus];
        if (!statusConfig) return 'secondary';

        // Direct mapping - your badge supports all these variants
        const colorMap: Record<string, BadgeVariant> = {
            'success': 'success',       // ENROLLED - Green
            'warning': 'warning',       // PENDING/SUSPENDED - Yellow/Orange
            'destructive': 'destructive', // DROPPED - Red
            'secondary': 'secondary',   // COMPLETED - Gray
            'muted': 'secondary',       // Not enrolled - Gray
            'outline': 'outline',       // Fallback
            'default': 'default',       // Fallback - Blue/Primary
        };

        return colorMap[statusConfig.color] || 'secondary';
    };

    /**
     * Get enrollment status label
     * Uses CLASS_ENROLLMENT_STATUS_OPTIONS for consistent labeling
     */
    const getEnrollmentStatusLabel = (status: string | null | undefined): string => {
        if (!status) return 'Not Enrolled';
        
        const normalizedStatus = status.toUpperCase() as ClassEnrollmentStatus;
        
        const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[normalizedStatus];
        return statusConfig?.label || status;
    };

    /**
     * Copy email to clipboard with toast notification and tooltip feedback
     */
    const handleCopyEmail = async (email: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await navigator.clipboard.writeText(email);
            setIsCopied(true);
            showSuccessToast('Email copied to clipboard!');
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy email:', err);
            showErrorToast('Failed to copy email. Please try again.');
        }
    };

    /**
     * Open mailto link
     */
    const handleMailTo = (email: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        window.location.href = `mailto:${email}`;
    };

    const enrollmentStatus = enrollment.enrollment_status || 'ENROLLED';
    const enrollmentBadgeVariant = getEnrollmentBadgeVariant(enrollmentStatus);
    const enrollmentStatusLabel = getEnrollmentStatusLabel(enrollmentStatus);

    return (
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-sm">
            {/* 🎨 Background Illustration Layer (Optimized for mobile) */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                {/* Primary Gradient Mesh - Adjusted for mobile */}
                <div className="absolute -top-[10%] -right-[10%] w-[70%] sm:w-[60%] h-[80%] sm:h-[120%] rounded-full bg-[radial-gradient(circle,var(--color-brand-secondary)_0%,transparent_70%)] opacity-10 sm:opacity-15 blur-2xl sm:blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] sm:w-[40%] h-[70%] sm:h-[100%] rounded-full bg-[radial-gradient(circle,var(--color-brand-primary)_0%,transparent_70%)] opacity-8 sm:opacity-10 blur-2xl sm:blur-3xl" />

                {/* Abstract Geometric Shapes (Scaled down on mobile) */}
                <svg
                    className="absolute bottom-0 right-0 h-3/4 sm:h-full w-auto text-brand-primary/5 translate-x-1/4 sm:translate-x-1/4"
                    viewBox="0 0 400 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="200" cy="400" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
                    <circle cx="200" cy="400" r="180" stroke="currentColor" strokeWidth="1" />
                    <circle cx="200" cy="400" r="240" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                {/* Highlight Pop (Hidden on mobile for cleaner look) */}
                <div className="hidden sm:block absolute bottom-12 right-1/3 w-2 h-2 rounded-full bg-brand-highlight opacity-40 animate-pulse" />

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* ✍️ Content Layer - Mobile-First Layout */}
            <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
                {/* Top Row: Avatar + Name + Badge (Mobile Optimized) */}
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar with Brand Ring */}
                    <div className="flex-shrink-0 relative">
                        <div className="absolute -inset-0.5 sm:-inset-1 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary opacity-20 blur-sm" />
                        <UserAvatar
                            userId={enrollment.student_id}
                            src={enrollment.student?.avatar_url}
                            fullName={enrollment.student?.full_name || enrollment.student_name}
                            size="lg"
                            className="border-2 border-background relative z-10 md:hidden"
                        />
                        <UserAvatar
                            userId={enrollment.student_id}
                            src={enrollment.student?.avatar_url}
                            fullName={enrollment.student?.full_name || enrollment.student_name}
                            size="xl"
                            className="border-2 border-background relative z-10 hidden md:block"
                        />
                    </div>

                    {/* Student Info + Badge */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 space-y-1">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-brand-primary dark:text-foreground truncate">
                                    {enrollment.student?.full_name || enrollment.student_name || 'N/A'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="h-0.5 sm:h-1 w-6 sm:w-8 rounded-full bg-brand-highlight flex-shrink-0" />
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider truncate">
                                        ID: {enrollment.student_id?.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Badge - Stacked on mobile if needed */}
                            <Badge 
                                variant={enrollmentBadgeVariant}
                                className=""
                            >
                                {enrollmentStatusLabel}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Contact Info Grid - Stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1 sm:pt-2">
                    {/* Email with Responsive Actions */}
                    {enrollment.student?.email && (
                        <>
                            {/* Desktop: Tooltip with Actions */}
                            <div className="hidden sm:block">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary group min-w-0 cursor-pointer hover:text-brand-primary transition-colors">
                                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:text-brand-primary flex-shrink-0" />
                                            <span className="truncate">{enrollment.student.email}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                        side="bottom" 
                                        align="start"
                                        sideOffset={8}
                                        className="p-1.5 border border-border shadow-lg"
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-[140px]">
                                            <button
                                                onClick={(e) => handleCopyEmail(enrollment.student.email, e)}
                                                className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left w-full group/btn"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500 animate-in zoom-in-50" />
                                                        <span className="font-medium text-green-500">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3.5 w-3.5 flex-shrink-0 group-hover/btn:text-brand-primary transition-colors" />
                                                        <span className="font-medium">Copy Email</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => handleMailTo(enrollment.student.email, e)}
                                                className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left w-full group/btn"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 group-hover/btn:text-brand-primary transition-colors" />
                                                <span className="font-medium">Send Email</span>
                                            </button>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Mobile: Email with Copy Button */}
                            <div className="flex items-center justify-between gap-2 min-w-0 sm:hidden">
                                <div 
                                    onClick={() => handleMailTo(enrollment.student.email)}
                                    className="flex items-center gap-2 text-xs text-text-secondary min-w-0 cursor-pointer active:text-brand-primary transition-colors"
                                >
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{enrollment.student.email}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyEmail(enrollment.student.email)}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                >
                                    {isCopied ? (
                                        <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in-50" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                    
                    {enrollment.student?.phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary group min-w-0">
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors group-hover:text-brand-primary flex-shrink-0" />
                            <span className="truncate">{enrollment.student.phone}</span>
                        </div>
                    )}
                    {enrollment.registration_date && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary min-w-0">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">Since {formatDate(enrollment.registration_date)}</span>
                        </div>
                    )}
                    {enrollment.student?.address && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary group min-w-0">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-secondary transition-colors group-hover:text-brand-primary flex-shrink-0" />
                            <span className="line-clamp-1 sm:line-clamp-2">{enrollment.student.address}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
