/**
 * Address Form Component
 * 
 * Form for creating and editing addresses with validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useAddressStore } from '@/lib/store/address.store';
import { AddressValidationUtils } from '@/lib/utils/address.utils';
import type { AddressCreate, AddressUpdate, AddressType } from '@/lib/schema/address.types';
import { INDIAN_STATES } from '@/lib/schema/address.types';
import { useCurrentProfile } from '@/lib/profile';
import type { UserRole } from '@/lib/schema/profile.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddressFormProps {
    addressId?: string; // If provided, edit mode; otherwise, create mode
    onSuccess?: () => void;
    onCancel?: () => void;
    defaultValues?: Partial<AddressCreate>;
}

const ALL_ADDRESS_TYPES: { value: AddressType; label: string; allowedRoles: UserRole[] }[] = [
    { value: 'HOME', label: 'Home', allowedRoles: ['SA', 'A', 'S', 'T', 'C'] },
    { value: 'HOSTEL', label: 'Hostel', allowedRoles: ['SA', 'A', 'S'] }, // Only students
    { value: 'SCHOOL', label: 'School', allowedRoles: ['SA', 'A', 'S'] }, // Only students
    { value: 'COLLEGE', label: 'College', allowedRoles: ['SA', 'A', 'S'] }, // Only students
    { value: 'WORK', label: 'Work', allowedRoles: ['SA', 'A', 'T', 'C'] }, // Teachers & Coaches
    { value: 'OFFICE', label: 'Office', allowedRoles: ['SA', 'A', 'T', 'C'] }, // Teachers & Coaches
    { value: 'COACHING', label: 'Coaching Center', allowedRoles: ['SA', 'A', 'C'] }, // Only coaches/admins
    { value: 'BRANCH', label: 'Branch Office', allowedRoles: ['SA', 'A', 'C'] }, // Only coaches/admins
    { value: 'OTHER', label: 'Other', allowedRoles: ['SA', 'A', 'S', 'T', 'C'] },
];

/**
 * Filter address types based on user role
 */
const getAvailableAddressTypes = (userRole?: UserRole): { value: AddressType; label: string }[] => {
    if (!userRole) {
        // If no role, return basic types
        return [
            { value: 'HOME', label: 'Home' },
            { value: 'OTHER', label: 'Other' },
        ];
    }

    return ALL_ADDRESS_TYPES
        .filter(type => type.allowedRoles.includes(userRole))
        .map(({ value, label }) => ({ value, label }));
};

export function AddressForm({ addressId, onSuccess, onCancel, defaultValues }: AddressFormProps) {
    const profile = useCurrentProfile();
    const userRole = profile?.role;

    const {
        loadAddress,
        createAddress,
        updateAddress,
        extractCoordinatesFromMapsUrl,
    } = useAddressStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractingCoords, setExtractingCoords] = useState(false);

    // Get available address types based on user role
    const availableAddressTypes = getAvailableAddressTypes(userRole);

    // Form state
    const [formData, setFormData] = useState<Partial<AddressCreate>>({
        address_type: 'HOME',
        country: 'India',
        is_primary: false,
        is_active: true,
        ...defaultValues,
    });

    // Load existing address if editing
    useEffect(() => {
        if (addressId) {
            loadExistingAddress();
        }
    }, [addressId]);

    const loadExistingAddress = async () => {
        if (!addressId) return;

        setLoading(true);
        const address = await loadAddress(addressId);
        if (address) {
            setFormData({
                address_type: address.address_type,
                label: address.label || undefined,
                state: address.state,
                district: address.district,
                pin_code: address.pin_code,
                country: address.country,
                address_line_1: address.address_line_1 || undefined,
                address_line_2: address.address_line_2 || undefined,
                city: address.city || undefined,
                sub_district: address.sub_district || undefined,
                village_town: address.village_town || undefined,
                latitude: address.latitude || undefined,
                longitude: address.longitude || undefined,
                google_maps_url: address.google_maps_url || undefined,
                google_place_id: address.google_place_id || undefined,
                google_plus_code: address.google_plus_code || undefined,
                postal_address: address.postal_address || undefined,
                delivery_instructions: address.delivery_instructions || undefined,
                is_primary: address.is_primary,
                is_active: address.is_active,
            });
        }
        setLoading(false);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleExtractCoordinates = () => {
        if (!formData.google_maps_url) return;

        setExtractingCoords(true);
        const coords = extractCoordinatesFromMapsUrl(formData.google_maps_url);

        if (coords) {
            setFormData((prev) => ({
                ...prev,
                latitude: coords.latitude,
                longitude: coords.longitude,
            }));
        }
        setExtractingCoords(false);
    };

    const validateForm = (): boolean => {
        // Required fields
        if (!formData.state || !formData.district || !formData.pin_code) {
            setError('Please fill in all required fields (State, District, PIN Code)');
            return false;
        }

        // Validate PIN code
        const pinValidation = AddressValidationUtils.validatePinCode(formData.pin_code);
        if (!pinValidation.valid) {
            setError(pinValidation.error || 'Invalid PIN code');
            return false;
        }

        // Validate coordinates if provided
        if (formData.latitude !== undefined && formData.longitude !== undefined) {
            const coordValidation = AddressValidationUtils.validateCoordinates(
                formData.latitude,
                formData.longitude
            );
            if (!coordValidation.valid) {
                setError(coordValidation.error || 'Invalid coordinates');
                return false;
            }
        }

        // Validate Google Maps URL if provided
        if (formData.google_maps_url) {
            const urlValidation = AddressValidationUtils.validateGoogleMapsUrl(
                formData.google_maps_url
            );
            if (!urlValidation.valid) {
                setError(urlValidation.error || 'Invalid Google Maps URL');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let success: boolean;

            if (addressId) {
                // Update existing address
                success = await updateAddress(addressId, formData as AddressUpdate);
            } else {
                // Create new address
                success = await createAddress(formData as AddressCreate);
            }

            if (success) {
                onSuccess?.();
            } else {
                setError('Failed to save address. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Address Type and Label */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="address_type">
                        Address Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.address_type}
                        onValueChange={(value) => handleInputChange('address_type', value as AddressType)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableAddressTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {userRole && (
                        <p className="text-xs text-muted-foreground">
                            Address types are filtered based on your role
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="label">Custom Label</Label>
                    <Input
                        id="label"
                        placeholder="e.g., My Home, Main Office"
                        value={formData.label || ''}
                        onChange={(e) => handleInputChange('label', e.target.value)}
                        maxLength={100}
                    />
                </div>
            </div>

            {/* Address Lines */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                        id="address_line_1"
                        placeholder="House/Building number, Street name"
                        value={formData.address_line_1 || ''}
                        onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                        maxLength={200}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                        id="address_line_2"
                        placeholder="Landmark, Area"
                        value={formData.address_line_2 || ''}
                        onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                        maxLength={200}
                    />
                </div>
            </div>

            {/* Location Details */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="city">City/Town</Label>
                    <Input
                        id="city"
                        placeholder="City or Town name"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="village_town">Village/Town</Label>
                    <Input
                        id="village_town"
                        placeholder="Village or Town"
                        value={formData.village_town || ''}
                        onChange={(e) => handleInputChange('village_town', e.target.value)}
                    />
                </div>
            </div>

            {/* District and Sub-district */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="district">
                        District <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="district"
                        placeholder="District name"
                        value={formData.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sub_district">Sub-district/Tehsil/Taluka</Label>
                    <Input
                        id="sub_district"
                        placeholder="Sub-district"
                        value={formData.sub_district || ''}
                        onChange={(e) => handleInputChange('sub_district', e.target.value)}
                    />
                </div>
            </div>

            {/* State and PIN Code */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="state">
                        State <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.state}
                        onValueChange={(value) => handleInputChange('state', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                            {INDIAN_STATES.map((state) => (
                                <SelectItem key={state.code} value={state.name}>
                                    {state.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pin_code">
                        PIN Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="pin_code"
                        placeholder="6-digit PIN code"
                        value={formData.pin_code || ''}
                        onChange={(e) => handleInputChange('pin_code', e.target.value)}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                    />
                </div>
            </div>

            {/* Google Maps Integration */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <h3 className="font-semibold">Location Details (Optional)</h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="google_maps_url">Google Maps URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="google_maps_url"
                            placeholder="https://maps.google.com/..."
                            value={formData.google_maps_url || ''}
                            onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExtractCoordinates}
                            disabled={!formData.google_maps_url || extractingCoords}
                        >
                            {extractingCoords ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Navigation className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste a Google Maps link to automatically extract coordinates
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                            id="latitude"
                            type="number"
                            step="any"
                            placeholder="e.g., 28.6139"
                            value={formData.latitude || ''}
                            onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                            id="longitude"
                            type="number"
                            step="any"
                            placeholder="e.g., 77.2090"
                            value={formData.longitude || ''}
                            onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                    </div>
                </div>
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
                <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                <Textarea
                    id="delivery_instructions"
                    placeholder="Any specific instructions for delivery (landmarks, gate numbers, etc.)"
                    value={formData.delivery_instructions || ''}
                    onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                    maxLength={500}
                    rows={3}
                />
            </div>

            {/* Primary Address Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                    <Label htmlFor="is_primary">Set as Primary Address</Label>
                    <p className="text-sm text-muted-foreground">
                        Use this address as your default address
                    </p>
                </div>
                <Switch
                    id="is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) => handleInputChange('is_primary', checked)}
                />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {addressId ? 'Update Address' : 'Add Address'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
