/**
 * Explorer Cards Component
 * Cards for discovering coaching classes and connecting with learners
 * Uses actual PNG images from public/explore with SVG fallbacks
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';

interface ExplorerCardProps {
    title: string;
    description: string;
    icon: 'search' | 'users' | 'create';
    href: string;
    gradient: string;
    decoration: string;
    badgeText: string;
    badgeColor: string;
    imageSrc: string;
    imageAlt: string;
}

function ExplorerCard({
    title,
    description,
    icon,
    href,
    gradient,
    decoration,
    badgeText,
    badgeColor,
    imageSrc,
    imageAlt
}: ExplorerCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);

        // Simulate API call or async operation
        setTimeout(() => {
            setLoading(false);
            router.push(href);
        }, 1000);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (loading) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // If not clicking on button, navigate directly
        const target = e.target as HTMLElement;
        const isButton = target.closest('button');

        if (!isButton) {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                router.push(href);
            }, 1000);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="h-full cursor-pointer"
        >
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl p-0 gap-0 group h-full flex flex-col">
                {/* Header with badge */}
                <div className="relative p-2 flex-shrink-0">
                    <div className="absolute top-5 left-5 z-10">
                        <Badge
                            variant="secondary"
                            className={cn(
                                'text-xs font-medium px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm border border-border/30',
                                badgeColor
                            )}
                        >
                            <MapPin className="w-3 h-3 mr-1" />
                            {badgeText}
                        </Badge>
                    </div>

                    {/* Image Container with Gradient Overlay */}
                    <div
                        className={cn(
                            'h-32 w-full relative overflow-hidden rounded-2xl',
                            gradient
                        )}
                    >
                        {/* Background PNG Image */}
                        <div className="absolute inset-0">
                            <Image
                                src={imageSrc}
                                alt={imageAlt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority={false}
                                onError={(e) => {
                                    // If image fails to load, show gradient background
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Gradient Overlay for better text contrast */}
                        <div className={cn(
                            'absolute inset-0 bg-gradient-to-br opacity-50',
                            gradient
                        )} />

                        {/* Decorative SVG pattern overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                                className={cn('w-32 h-32', decoration)}
                                viewBox="0 0 100 100"
                                fill="currentColor"
                                style={{ opacity: 0.3 }}
                            >
                                {/* Modern geometric pattern */}
                                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                {/* Icon in center */}
                                <path
                                    d={icon === 'search' ?
                                        "M50 30 L65 45 L60 50 L50 40 L40 50 L35 45 Z M45 45 A5 5 0 1 0 55 45 A5 5 0 1 0 45 45" :
                                        icon === 'users' ?
                                            "M35 40 A10 10 0 1 1 65 40 A10 10 0 1 1 35 40 M30 55 Q50 70 70 55 M40 65 Q50 75 60 65" :
                                            "M50 35 L50 65 M35 50 L65 50"
                                    }
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-grow flex flex-col">
                    {/* Title */}
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-grow">
                        {description}
                    </p>

                    {/* Explore Button with loading state */}
                    <Button
                        variant="outline"
                        size="sm"
                        loading={loading}
                        loadingText={loading ? "Exploring..." : undefined}
                        onClick={handleClick}
                        className="w-full rounded-full px-4 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors mt-2 group/btn flex-shrink-0"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>Explore now</span>
                            {!loading && (
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            )}
                        </div>
                    </Button>
                </div>
            </Card>
        </div>
    );
}

interface ExplorerCardsProps {
    userRole?: 'S' | 'T' | 'C' | string; // S = Student, T = Teacher, C = Coaching
}

export function ExplorerCards({ userRole = 'S' }: ExplorerCardsProps) {
    const isStudent = userRole === 'S';
    const isTeacher = userRole === 'T';
    const isCoaching = userRole === 'C';

    // Determine badge text based on user role
    const getBadgeText = () => {
        if (isStudent) return 'Nearby';
        if (isTeacher) return 'Create';
        if (isCoaching) return 'Manage';
        return 'Explore';
    };

    // Determine title and description based on role
    const getCoachingCardInfo = () => {
        if (isStudent) {
            return {
                title: 'Find top coaching',
                description: 'Discover top coaching classes around your area with verified reviews',
            };
        } else {
            return {
                title: 'Create your coaching',
                description: 'Create and manage your coaching classes to reach more students',
            };
        }
    };

    const coachingCardInfo = getCoachingCardInfo();

    const explorerData: ExplorerCardProps[] = [
        {
            title: coachingCardInfo.title,
            description: coachingCardInfo.description,
            icon: isStudent ? 'search' : 'create',
            href: '/coaching',
            gradient: 'from-blue-500/20 to-indigo-500/10',
            decoration: 'text-blue-400',
            badgeText: getBadgeText(),
            badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
            imageSrc: '/explore/discovering_coaching.png',
            imageAlt: 'Discover coaching classes',
        },
        {
            title: 'Connect with community',
            description: 'Make connections with learners, coaches, and teachers around your area',
            icon: 'users',
            href: '/network',
            gradient: 'from-purple-500/20 to-pink-500/10',
            decoration: 'text-purple-400',
            badgeText: 'Network',
            badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
            imageSrc: '/explore/learning_community.png',
            imageAlt: 'Learning community',
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                    Explore the Tutrsy environment
                </h2>
                {explorerData.length > 2 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-primary hover:text-primary/80 h-fit px-3 py-1.5"
                    >
                        View all
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explorerData.map((card, index) => (
                    <ExplorerCard
                        key={index}
                        {...card}
                    />
                ))}
            </div>
        </div>
    );
}