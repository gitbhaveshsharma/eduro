/**
 * Coaching Branch Profile Page Component
 * 
 * Displays detailed information about a specific coaching branch
 * Shows branch details, manager info, address, and reviews
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    type PublicCoachingBranch,
    CoachingDisplayUtils
} from '@/lib/coaching';
import { type Address } from '@/lib/address';
import {
    Building2,
    Phone,
    Mail,
    User,
    MapPin,
    Navigation,
    Clock
} from 'lucide-react';
import Link from 'next/link';

interface CoachingBranchProfileProps {
    branch: PublicCoachingBranch;
    centerName: string;
    centerSlug: string;
    address?: Address | null;
    managerName?: string | null;
}

export function CoachingBranchProfile({
    branch,
    centerName,
    centerSlug,
    address,
    managerName
}: CoachingBranchProfileProps) {
    const branchTypeDisplay = CoachingDisplayUtils.getBranchTypeDisplay(branch.is_main_branch);

    return (
        <div className="space-y-6">
            {/* Back to Center Link */}
            <div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/coaching/${centerSlug}`}>
                        ← Back to {centerName}
                    </Link>
                </Button>
            </div>

            {/* Branch Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <CardTitle className="text-3xl">{branch.name}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    {branchTypeDisplay.icon} {branchTypeDisplay.label}
                                </Badge>

                                <Badge
                                    variant="secondary"
                                    className={branch.is_active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : ""
                                    }
                                >
                                    {branch.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Description */}
                    {branch.description && (
                        <div>
                            <p className="text-base leading-relaxed">{branch.description}</p>
                        </div>
                    )}

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Information
                        </h3>

                        <div className="grid gap-3">
                            {branch.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a
                                        href={`tel:${branch.phone}`}
                                        className="text-primary hover:underline"
                                    >
                                        {branch.phone}
                                    </a>
                                </div>
                            )}

                            {branch.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a
                                        href={`mailto:${branch.email}`}
                                        className="text-primary hover:underline"
                                    >
                                        {branch.email}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manager Information */}
                    {managerName && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Branch Manager
                                </h3>
                                <p className="text-base">{managerName}</p>
                            </div>
                        </>
                    )}

                    {/* Address Information */}
                    {address && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            {address.address_line_1 && <p>{address.address_line_1}</p>}
                                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                                            <p>
                                                {[address.city, address.district, address.state, address.pin_code]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                            {address.country && <p>{address.country}</p>}
                                        </div>
                                    </div>

                                    {/* Map Link */}
                                    {address.latitude && address.longitude && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a
                                                href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Navigation className="h-4 w-4 mr-2" />
                                                Get Directions
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Timestamps */}
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                            Added {CoachingDisplayUtils.formatLastUpdated(branch.created_at)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
