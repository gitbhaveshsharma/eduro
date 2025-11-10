/**
 * Coaching Location Card - Production Ready
 * Separate card component for location and branch information
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Address } from '@/lib/address';
import { type PublicCoachingCenter } from '@/lib/coaching';
import {
    MapPin,
    Navigation,
    Building,
    Phone,
    Globe
} from 'lucide-react';

interface CoachingLocationCardProps {
    center: PublicCoachingCenter;
    address?: Address | null;
    className?: string;
}

export const CoachingLocationCard = memo(function CoachingLocationCard({
    center,
    address,
    className = ''
}: CoachingLocationCardProps) {
    // Check if we have any location content to show
    const hasLocationContent = Boolean(
        address ||
        (typeof center.total_branches === 'number' && center.total_branches > 0) ||
        center.phone ||
        center.website
    );

    if (!hasLocationContent) {
        return null;
    }

    return (
        <Card className={`border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-green-500" />
                    </div>
                    Coaching Location & Contact
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Branch Information */}
                {typeof center.total_branches === 'number' && center.total_branches > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Multiple Branches</p>
                            <p className="text-sm text-muted-foreground">
                                {center.total_branches} branch{center.total_branches !== 1 ? 'es' : ''} available
                            </p>
                        </div>
                    </div>
                )}

                {/* Address Details */}
                {address && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                {address.label && (
                                    <p className="font-medium text-foreground text-sm">
                                        {address.label}
                                    </p>
                                )}

                                <div className="space-y-1 text-sm text-foreground/80">
                                    {address.address_line_1 && (
                                        <p className="font-medium">{address.address_line_1}</p>
                                    )}
                                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                                    <p className="text-muted-foreground">
                                        {[address.city, address.district, address.state, address.pin_code]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                    {address.country && (
                                        <p className="text-muted-foreground">{address.country}</p>
                                    )}
                                </div>

                                {/* Get Directions Action */}
                                {address.latitude && address.longitude && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="mt-2"
                                    >
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center"
                                        >
                                            <Navigation className="h-3.5 w-3.5 mr-2" />
                                            Get Directions
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                {(center.phone || center.website) && (
                    <div className="pt-2 border-t border-border/50">
                        <h4 className="font-medium text-sm mb-3 text-foreground/70">Contact Information</h4>
                        <div className="space-y-3">
                            {/* Phone Number */}
                            {center.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-md">
                                        <Phone className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Phone</p>
                                        <a
                                            href={`tel:${center.phone}`}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {center.phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Website */}
                            {center.website && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-md">
                                        <Globe className="h-3.5 w-3.5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Website</p>
                                        <a
                                            href={center.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                                        >
                                            {center.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});