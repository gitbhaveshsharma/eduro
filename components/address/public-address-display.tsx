/**
 * Public Address Display Component
 * 
 * Reusable component to display address information for:
 * - User profiles
 * - Coaching centers
 * - Branches
 * - Any entity with an address
 */

'use client';

import { useEffect, useState } from 'react';
import { useAddressStore } from '@/lib/store/address.store';
import { AddressDisplayUtils, AddressUrlUtils } from '@/lib/utils/address.utils';
import type { Address, PublicAddress } from '@/lib/schema/address.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    MapPin,
    Navigation,
    ExternalLink,
    Phone,
    Mail,
    CheckCircle2,
    AlertCircle,
    Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicAddressDisplayProps {
    // Provide ONE of these to fetch the address
    userId?: string;
    branchId?: string;
    coachingId?: string;
    addressId?: string;

    // Or provide address directly
    address?: Address | PublicAddress;

    // Display options
    title?: string;
    description?: string;
    showMap?: boolean;
    showDirections?: boolean;
    showCopyButton?: boolean;
    compact?: boolean;
    className?: string;
}

export function PublicAddressDisplay({
    userId,
    branchId,
    coachingId,
    addressId,
    address: providedAddress,
    title = 'Address',
    description,
    showMap = true,
    showDirections = true,
    showCopyButton = true,
    compact = false,
    className = ''
}: PublicAddressDisplayProps) {
    const { toast } = useToast();
    const [address, setAddress] = useState<Address | PublicAddress | null>(providedAddress || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        loadAddress,
        loadPublicAddresses,
    } = useAddressStore();

    useEffect(() => {
        if (providedAddress) {
            setAddress(providedAddress);
            return;
        }

        loadAddressData();
    }, [userId, branchId, coachingId, addressId, providedAddress]);

    const loadAddressData = async () => {
        setLoading(true);
        setError(null);

        try {
            if (addressId) {
                // Load specific address by ID
                const addr = await loadAddress(addressId);
                if (addr) {
                    setAddress(addr);
                } else {
                    setError('Address not found');
                }
            } else if (userId) {
                // Load user's primary or first address
                const addresses = await loadPublicAddresses(userId);
                if (addresses && addresses.length > 0) {
                    setAddress(addresses[0]);
                } else {
                    setError('No address found for this user');
                }
            } else if (branchId || coachingId) {
                // Load branch or coaching center address using AddressService directly
                const { AddressService } = await import('@/lib/service/address.service');

                const filters = branchId
                    ? { branch_id: branchId, is_active: true }
                    : { address_type: 'COACHING' as const, is_active: true };

                const result = await AddressService.searchAddresses(
                    filters,
                    { field: 'created_at', direction: 'desc' },
                    1,
                    1
                );

                if (result.success && result.data && result.data.addresses.length > 0) {
                    setAddress(result.data.addresses[0]);
                } else {
                    setError(branchId ? 'No address found for this branch' : 'No address found for this coaching center');
                }
            }
        } catch (err) {
            console.error('Error loading address:', err);
            setError('Failed to load address');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAddress = () => {
        if (!address) return;

        const formattedAddress = AddressDisplayUtils.formatSingleLine(address);
        navigator.clipboard.writeText(formattedAddress);

        toast({
            title: 'Address copied',
            description: 'The address has been copied to your clipboard.',
        });
    };

    const handleOpenMap = () => {
        if (!address) return;
        const mapsUrl = AddressUrlUtils.getGoogleMapsUrl(address as Address);
        window.open(mapsUrl, '_blank');
    };

    const handleGetDirections = () => {
        if (!address) return;
        const directionsUrl = AddressUrlUtils.getDirectionsUrl(address as Address);
        window.open(directionsUrl, '_blank');
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
            </Card>
        );
    }

    if (error || !address) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'No address available'}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const formattedLines = AddressDisplayUtils.formatMultiLine(address);
    const shortSummary = AddressDisplayUtils.getShortSummary(address);
    const isFullAddress = 'address_line_1' in address;

    if (compact) {
        return (
            <div className={`flex items-start gap-3 ${className}`}>
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                        {shortSummary}
                    </p>
                    {'pin_code' in address && address.pin_code && (
                        <p className="text-xs text-muted-foreground mt-1">
                            PIN: {address.pin_code}
                        </p>
                    )}
                </div>
                {showMap && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={handleOpenMap}
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription className="mt-1.5">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {address.is_verified && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600 dark:text-green-500" />
                            Verified
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Address Lines */}
                <div className="space-y-1">
                    {formattedLines.map((line, index) => (
                        <p
                            key={index}
                            className={index === 0 ? 'font-medium' : 'text-sm text-muted-foreground'}
                        >
                            {line}
                        </p>
                    ))}
                </div>

                {/* Status Badges */}
                {isFullAddress && (address as Address).address_type && (
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                        <Badge variant="secondary">
                            {AddressDisplayUtils.getAddressTypeLabel((address as Address).address_type)}
                        </Badge>
                        {address.pin_code && (
                            <Badge variant="outline">
                                PIN: {address.pin_code}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                    {showMap && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenMap}
                            className="flex-1"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Map
                        </Button>
                    )}

                    {showDirections && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGetDirections}
                            className="flex-1"
                        >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                        </Button>
                    )}

                    {showCopyButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyAddress}
                            className="px-3"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Additional Contact Info (if available) */}
                {isFullAddress && (
                    <div className="space-y-2 pt-2 border-t">
                        {(address as Address).delivery_instructions && (
                            <div className="text-sm text-muted-foreground">
                                <strong>Instructions:</strong> {(address as Address).delivery_instructions}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
