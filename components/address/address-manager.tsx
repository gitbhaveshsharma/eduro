/**
 * Address Manager Component
 * 
 * Complete address management interface for users to:
 * - View all their addresses
 * - Add new addresses
 * - Edit existing addresses
 * - Delete addresses
 * - Set primary address
 * - View address completion status
 */

'use client';

import { useEffect, useState } from 'react';
import { useAddressStore } from '@/lib/store/address.store';
import { AddressDisplayUtils } from '@/lib/utils/address.utils';
import type { Address, AddressType } from '@/lib/schema/address.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Home,
    Building,
    Plus,
    Edit,
    Trash2,
    Star,
    MapPin,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Scroll
} from 'lucide-react';
import { AddressForm } from './address-form';
import { AddressCard } from './address-card';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface AddressManagerProps {
    onAddressSelect?: (address: Address) => void;
    showAddButton?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    allowSetPrimary?: boolean;
    maxAddresses?: number;
}

export function AddressManager({
    onAddressSelect,
    showAddButton = true,
    allowEdit = true,
    allowDelete = true,
    allowSetPrimary = true,
    maxAddresses
}: AddressManagerProps) {
    const { toast } = useToast();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    const {
        currentUserAddresses,
        primaryAddress,
        currentAddressesLoading,
        currentAddressesError,
        loadCurrentUserAddresses,
        deleteAddress,
        setPrimaryAddress
    } = useAddressStore();

    useEffect(() => {
        loadCurrentUserAddresses();
    }, [loadCurrentUserAddresses]);

    const handleDelete = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        const success = await deleteAddress(addressId);
        if (success) {
            toast({
                title: 'Address deleted',
                description: 'The address has been successfully deleted.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete address. Primary addresses cannot be deleted.',
            });
        }
    };

    const handleSetPrimary = async (addressId: string) => {
        const success = await setPrimaryAddress(addressId);
        if (success) {
            toast({
                title: 'Primary address updated',
                description: 'This address is now your primary address.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to set primary address.',
            });
        }
    };

    const handleAddressCreated = () => {
        setShowAddForm(false);
        loadCurrentUserAddresses(); // Refresh the list
        toast({
            title: 'Address added',
            description: 'Your new address has been successfully added.',
        });
    };

    const handleAddressUpdated = () => {
        setEditingAddressId(null);
        loadCurrentUserAddresses(); // Refresh the list
        toast({
            title: 'Address updated',
            description: 'Your address has been successfully updated.',
        });
    };

    const canAddMore = !maxAddresses || currentUserAddresses.length < maxAddresses;

    if (currentAddressesLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        );
    }

    if (currentAddressesError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{currentAddressesError}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">My Addresses</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your saved addresses
                        {maxAddresses && ` (${currentUserAddresses.length}/${maxAddresses})`}
                    </p>
                </div>
                {showAddButton && canAddMore && !showAddForm && !editingAddressId && (
                    <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                    </Button>
                )}
            </div>

            {/* Add Address Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new address
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        <AddressForm
                            onSuccess={handleAddressCreated}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </DialogBody>

                    {/* DialogFooter is intentionally left empty because the form contains its own actions. */}
                    <DialogFooter />
                </DialogContent>
            </Dialog>

            {/* Edit Address Dialog */}
            <Dialog open={!!editingAddressId} onOpenChange={(open) => !open && setEditingAddressId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Address</DialogTitle>
                        <DialogDescription>
                            Update your address details
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        <AddressForm
                            addressId={editingAddressId || undefined}
                            onSuccess={handleAddressUpdated}
                            onCancel={() => setEditingAddressId(null)}
                        />
                    </DialogBody>

                    {/* DialogFooter is intentionally left empty because the form contains its own actions. */}
                    <DialogFooter />
                </DialogContent>
            </Dialog>

            {/* Address List */}
            {currentUserAddresses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <MapPin className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Add your first address to get started
                        </p>
                        {showAddButton && (
                            <Button onClick={() => setShowAddForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Address
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 mordern-scrollbar">
                    <ScrollArea className=" max-h-76 overflow-y-auto">
                        <div className="space-y-4 pr-2">
                            {currentUserAddresses.map((address) => (
                                <AddressCard
                                    key={address.id}
                                    address={address}
                                    onEdit={allowEdit ? () => setEditingAddressId(address.id) : undefined}
                                    onDelete={allowDelete ? () => handleDelete(address.id) : undefined}
                                    onSetPrimary={allowSetPrimary && !address.is_primary ? () => handleSetPrimary(address.id) : undefined}
                                    onSelect={onAddressSelect ? () => onAddressSelect(address) : undefined}
                                    showActions={allowEdit || allowDelete || allowSetPrimary}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Max Addresses Warning */}
            {maxAddresses && currentUserAddresses.length >= maxAddresses && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You have reached the maximum number of addresses ({maxAddresses}).
                        Delete an existing address to add a new one.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
