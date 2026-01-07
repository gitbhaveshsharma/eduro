'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, Globe } from 'lucide-react';
import type { CoachingCenter } from '@/lib/schema/coaching.types';

interface CoachingCenterInfoProps {
    coachingCenter: CoachingCenter;
}

export const CoachingCenterInfo = memo(({ coachingCenter }: CoachingCenterInfoProps) => (
    <Card>
        <CardHeader className="pb-3">
            {/* Mobile: Column Layout | Desktop: Row Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Logo Section - Full width on mobile, fixed size on desktop */}
                <div className="flex flex-col lg:flex-row items-start gap-4 flex-1">
                    {/* Logo - Full width on mobile */}
                    <div className="w-full lg:w-16 flex-shrink-0">
                        {coachingCenter.logo_url ? (
                            <Image
                                src={coachingCenter.logo_url}
                                alt={coachingCenter.name}
                                width={64}
                                height={64}
                                className="w-full lg:w-16 h-auto lg:h-16 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-full lg:w-16 h-32 lg:h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-12 w-12 lg:h-8 lg:w-8 text-primary" />
                            </div>
                        )}

                        {/* Verified Badge - Below logo on mobile only */}
                        {coachingCenter.is_verified && (
                            <Badge variant="secondary" className="mt-2 lg:hidden">
                                Verified
                            </Badge>
                        )}
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 min-w-0 space-y-2 w-full lg:w-auto">
                        <CardTitle className="text-xl flex flex-wrap items-center gap-2">
                            <span className="break-words">{coachingCenter.name}</span>

                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                            {coachingCenter.description || 'No description provided'}
                        </CardDescription>
                    </div>
                </div>

                {/* Badges - Hidden on mobile (shown below logo instead), visible on desktop */}
                <div className="hidden lg:flex gap-2 flex-shrink-0 lg:ml-4">
                    {coachingCenter.is_verified && (
                        <Badge variant="secondary">Verified</Badge>
                    )}
                    {coachingCenter.is_featured && (
                        <Badge variant="default">Featured</Badge>
                    )}
                </div>

                {/* Featured Badge - Show on mobile below description */}
                {coachingCenter.is_featured && (
                    <div className="lg:hidden">
                        <Badge variant="default">Featured</Badge>
                    </div>
                )}
            </div>
        </CardHeader>

        <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Contact Info */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Contact</h4>
                    <div className="space-y-2">
                        {coachingCenter.phone && (
                            <div className="flex items-start gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span className="break-all">{coachingCenter.phone}</span>
                            </div>
                        )}
                        {coachingCenter.email && (
                            <div className="flex items-start gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span className="break-all">{coachingCenter.email}</span>
                            </div>
                        )}
                        {coachingCenter.website && (
                            <div className="flex items-start gap-2 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <a
                                    href={coachingCenter.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all"
                                >
                                    Website
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category & Subjects */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Category</h4>
                    <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                            {coachingCenter.category?.replace(/_/g, ' ')}
                        </Badge>
                        {coachingCenter.subjects && coachingCenter.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {coachingCenter.subjects.slice(0, 3).map((subject, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {subject}
                                    </Badge>
                                ))}
                                {coachingCenter.subjects.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{coachingCenter.subjects.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Established */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Established</h4>
                    <p className="text-sm">
                        {coachingCenter.established_year || 'Not specified'}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
));

CoachingCenterInfo.displayName = 'CoachingCenterInfo';
