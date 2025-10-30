/**
 * Address Card Component
 * 
 * Displays a single address with actions and status indicators
 */

'use client';

import type { Address } from '@/lib/schema/address.types';
import { AddressDisplayUtils, AddressCompletionUtils, AddressUrlUtils } from '@/lib/utils/address.utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Home,
    Building,
    GraduationCap,
    MapPin,
    Star,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle2,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface AddressCardProps {
    address: Address;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetPrimary?: () => void;
    onSelect?: () => void;
    showActions?: boolean;
    showCompletion?: boolean;
    compact?: boolean;
}

export function AddressCard({
    address,
    onEdit,
    onDelete,
    onSetPrimary,
    onSelect,
    showActions = true,
    showCompletion = true,
    compact = false
}: AddressCardProps) {
    const displayName = AddressDisplayUtils.getDisplayName(address);
    const formattedAddress = AddressDisplayUtils.formatMultiLine(address);
    const typeColor = AddressDisplayUtils.getAddressTypeColor(address.address_type);
    const completionPercentage = AddressCompletionUtils.calculateCompletionPercentage(address);
    const isDeliveryReady = AddressCompletionUtils.isDeliveryReady(address);
    const mapsUrl = AddressUrlUtils.getGoogleMapsUrl(address);

    const getTypeIcon = () => {
        switch (address.address_type) {
            case 'HOME':
                return <Home className="h-4 w-4" />;
            case 'WORK':
            case 'OFFICE':
                return <Building className="h-4 w-4" />;
            case 'SCHOOL':
            case 'COLLEGE':
            case 'COACHING':
                return <GraduationCap className="h-4 w-4" />;
            default:
                return <MapPin className="h-4 w-4" />;
        }
    };

    return (
        <Card
            className={`group transition-all hover:shadow-md ${address.is_primary ? 'border-primary ring-2 ring-primary/20' : ''
                } ${onSelect ? 'cursor-pointer' : ''}`}
            onClick={onSelect}
        >
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg bg-${typeColor}-100 dark:bg-${typeColor}-900/20 flex-shrink-0`}>
                            {getTypeIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base line-clamp-1">
                                    {displayName}
                                </h3>
                                {address.is_primary && (
                                    <Badge variant="default" className="text-xs">
                                        <Star className="h-3 w-3 mr-1" />
                                        Primary
                                    </Badge>
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {AddressDisplayUtils.getAddressTypeLabel(address.address_type)}
                            </Badge>
                        </div>
                    </div>

                    {/* Actions */}
                    {showActions && (onEdit || onDelete || onSetPrimary) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onSetPrimary && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onSetPrimary();
                                    }}>
                                        <Star className="h-4 w-4 mr-2" />
                                        Set as Primary
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete();
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Address Details */}
                <div className="space-y-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                        {formattedAddress.map((line, index) => (
                            <p key={index} className="line-clamp-1">{line}</p>
                        ))}
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                        {address.is_verified && (
                            <Badge variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                Verified
                            </Badge>
                        )}
                        {isDeliveryReady && (
                            <Badge variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-blue-500" />
                                Delivery Ready
                            </Badge>
                        )}
                        {address.pin_code && (
                            <Badge variant="outline" className="text-xs">
                                PIN: {address.pin_code}
                            </Badge>
                        )}
                    </div>

                    {/* Completion Progress */}
                    {showCompletion && !compact && completionPercentage < 100 && (
                        <div className="pt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Profile Completion</span>
                                <span className="font-medium">{completionPercentage}%</span>
                            </div>
                            <Progress value={completionPercentage} className="h-1.5" />
                        </div>
                    )}

                    {/* Footer Actions */}
                    {!compact && (
                        <div className="flex items-center gap-2 pt-3 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(mapsUrl, '_blank');
                                }}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View on Map
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
