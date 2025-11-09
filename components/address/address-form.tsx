/**
 * Address Form Component
 * 
 * Form for creating and editing addresses with validation
 */

'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAddressStore } from '@/lib/store/address.store';
import type { AddressCreate, AddressUpdate, AddressType } from '@/lib/schema/address.types';
import { useCurrentProfile } from '@/lib/profile';
import type { UserRole } from '@/lib/schema/profile.types';
import { usePinCode } from '@/hooks/use-pincode';
import {
    addressFormSchema,
    validateGoogleMapsUrl,
    ADDRESS_VALIDATION_LIMITS
} from '@/lib/validations/address.validation';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast';
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
import { Loader2, MapPin, Navigation, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
    addressId?: string; // If provided, edit mode; otherwise, create mode
    onSuccess?: () => void;
    onCancel?: () => void;
    defaultValues?: Partial<AddressCreate>;
}

const ALL_ADDRESS_TYPES: { value: AddressType; label: string; allowedRoles: UserRole[] }[] = [
    { value: 'HOME', label: 'Home', allowedRoles: ['SA', 'A', 'S', 'T', 'C'] },
    { value: 'HOSTEL', label: 'Hostel', allowedRoles: ['SA', 'A', 'S'] },
    { value: 'SCHOOL', label: 'School', allowedRoles: ['SA', 'A', 'S'] },
    { value: 'COLLEGE', label: 'College', allowedRoles: ['SA', 'A', 'S'] },
    { value: 'WORK', label: 'Work', allowedRoles: ['SA', 'A', 'T', 'C'] },
    { value: 'OFFICE', label: 'Office', allowedRoles: ['SA', 'A', 'T', 'C'] },
    { value: 'COACHING', label: 'Coaching Center', allowedRoles: ['SA', 'A', 'C'] },
    { value: 'BRANCH', label: 'Branch Office', allowedRoles: ['SA', 'A', 'C'] },
    { value: 'OTHER', label: 'Other', allowedRoles: ['SA', 'A', 'S', 'T', 'C'] },
];

const getAvailableAddressTypes = (userRole?: UserRole): { value: AddressType; label: string }[] => {
    if (!userRole) {
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
    const [gettingLocation, setGettingLocation] = useState(false);

    // PIN code hook for validation and data fetching
    const {
        isLoading: pinCodeLoading,
        data: pinCodeData,
        error: pinCodeError,
        isValid: pinCodeValid,
        fetchPinCodeData,
        validatePinCode: validatePinCodeFormat,
        reset: resetPinCode
    } = usePinCode();

    const availableAddressTypes = getAvailableAddressTypes(userRole);

    // Form state with proper validation
    const [formData, setFormData] = useState<Partial<AddressCreate>>({
        address_type: 'HOME',
        country: 'India',
        is_primary: false,
        is_active: true,
        ...defaultValues,
    });

    // Form validation state
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Load existing address if editing
    useEffect(() => {
        if (addressId) {
            loadExistingAddress();
        }
    }, [addressId]);

    // Fetch PIN code data when PIN code changes
    useEffect(() => {
        const pinCode = formData.pin_code?.trim();

        if (!pinCode) {
            resetPinCode();
            setFormData(prev => ({ ...prev, state: '', district: '' }));
            return;
        }

        if (pinCode.length !== 6) {
            resetPinCode();
            setFormData(prev => ({ ...prev, state: '', district: '' }));
            return;
        }

        if (!validatePinCodeFormat(pinCode)) {
            resetPinCode();
            setFormData(prev => ({ ...prev, state: '', district: '' }));
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchPinCodeData(pinCode);
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [formData.pin_code, fetchPinCodeData, validatePinCodeFormat, resetPinCode]);

    // Auto-fill state and district when PIN code data is fetched
    useEffect(() => {
        if (pinCodeValid && pinCodeData) {
            setFormData((prev) => ({
                ...prev,
                state: pinCodeData.state,
                district: pinCodeData.district,
            }));
            // Clear validation errors for state and district
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.state;
                delete newErrors.district;
                return newErrors;
            });
        }
    }, [pinCodeValid, pinCodeData]);

    const loadExistingAddress = async () => {
        if (!addressId) return;

        setLoading(true);
        try {
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
        } catch (error) {
            setError('Failed to load address');
        } finally {
            setLoading(false);
        }
    };

    const validateField = (field: string, value: any): string | null => {
        switch (field) {
            case 'pin_code':
                if (!value) return 'PIN code is required';
                if (value.length !== 6) return 'PIN code must be 6 digits';
                if (!/^\d+$/.test(value)) return 'PIN code must contain only numbers';
                return null;

            case 'state':
                if (!value) return 'State is required';
                if (value.length < 2) return 'State name is too short';
                return null;

            case 'district':
                if (!value) return 'District is required';
                if (value.length < 2) return 'District name is too short';
                return null;

            case 'address_line_1':
                if (value && value.length > ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX) {
                    return `Address line 1 must be less than ${ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX} characters`;
                }
                return null;

            case 'address_line_2':
                if (value && value.length > ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX) {
                    return `Address line 2 must be less than ${ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX} characters`;
                }
                return null;

            case 'city':
                if (value && value.length > ADDRESS_VALIDATION_LIMITS.CITY_MAX) {
                    return `City must be less than ${ADDRESS_VALIDATION_LIMITS.CITY_MAX} characters`;
                }
                return null;

            case 'label':
                if (value && value.length > ADDRESS_VALIDATION_LIMITS.LABEL_MAX) {
                    return `Label must be less than ${ADDRESS_VALIDATION_LIMITS.LABEL_MAX} characters`;
                }
                return null;

            case 'google_maps_url':
                if (value) {
                    const urlValidation = validateGoogleMapsUrl(value);
                    if (!urlValidation.valid) return urlValidation.error || 'Invalid Google Maps URL';
                }
                return null;

            case 'latitude':
                if (value !== undefined && value !== null) {
                    if (value < -90 || value > 90) return 'Latitude must be between -90 and 90';
                    if (formData.longitude === undefined || formData.longitude === null) {
                        return 'Longitude must be provided with latitude';
                    }
                }
                return null;

            case 'longitude':
                if (value !== undefined && value !== null) {
                    if (value < -180 || value > 180) return 'Longitude must be between -180 and 180';
                    if (formData.latitude === undefined || formData.latitude === null) {
                        return 'Latitude must be provided with longitude';
                    }
                }
                return null;

            default:
                return null;
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Validate the field
        const error = validateField(field, value);
        setValidationErrors(prev => ({
            ...prev,
            [field]: error || ''
        }));

        // Clear general error when user starts typing
        setError(null);
    };

    const handleExtractCoordinates = () => {
        if (!formData.google_maps_url) return;

        setExtractingCoords(true);
        try {
            const coords = extractCoordinatesFromMapsUrl(formData.google_maps_url);

            if (coords) {
                setFormData((prev) => ({
                    ...prev,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                }));
                showSuccessToast('Coordinates extracted successfully!');
            } else {
                showErrorToast('Could not extract coordinates from the URL');
            }
        } catch (error) {
            showErrorToast('Failed to extract coordinates');
        } finally {
            setExtractingCoords(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            showErrorToast('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }));
                setGettingLocation(false);
                showSuccessToast('Location retrieved successfully!');
            },
            (error) => {
                setGettingLocation(false);
                let errorMessage = 'Failed to get your location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }

                showErrorToast(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validate all fields
        const fieldsToValidate = [
            'pin_code', 'state', 'district', 'address_line_1', 'address_line_2',
            'city', 'label', 'google_maps_url', 'latitude', 'longitude'
        ];

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field as keyof typeof formData]);
            if (error) {
                errors[field] = error;
            }
        });

        // Special validation for coordinates
        if ((formData.latitude !== undefined && formData.latitude !== null) !==
            (formData.longitude !== undefined && formData.longitude !== null)) {
            errors.coordinates = 'Both latitude and longitude must be provided together';
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setError('Please fix the validation errors above');
            return false;
        }

        // Required fields validation
        if (!formData.state || !formData.district || !formData.pin_code) {
            setError('Please fill in all required fields (State, District, PIN Code)');
            return false;
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
                success = await updateAddress(addressId, formData as AddressUpdate);
            } else {
                success = await createAddress(formData as AddressCreate);
            }

            if (success) {
                showSuccessToast(addressId ? 'Address updated successfully!' : 'Address created successfully!');
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
                        maxLength={ADDRESS_VALIDATION_LIMITS.LABEL_MAX}
                    />
                    {validationErrors.label && (
                        <p className="text-xs text-destructive">{validationErrors.label}</p>
                    )}
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
                        maxLength={ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX}
                    />
                    {validationErrors.address_line_1 && (
                        <p className="text-xs text-destructive">{validationErrors.address_line_1}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                        id="address_line_2"
                        placeholder="Landmark, Area"
                        value={formData.address_line_2 || ''}
                        onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                        maxLength={ADDRESS_VALIDATION_LIMITS.ADDRESS_LINE_MAX}
                    />
                    {validationErrors.address_line_2 && (
                        <p className="text-xs text-destructive">{validationErrors.address_line_2}</p>
                    )}
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
                        maxLength={ADDRESS_VALIDATION_LIMITS.CITY_MAX}
                    />
                    {validationErrors.city && (
                        <p className="text-xs text-destructive">{validationErrors.city}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="village_town">Village/Town</Label>
                    <Input
                        id="village_town"
                        placeholder="Village or Town"
                        value={formData.village_town || ''}
                        onChange={(e) => handleInputChange('village_town', e.target.value)}
                        maxLength={ADDRESS_VALIDATION_LIMITS.VILLAGE_TOWN_MAX}
                    />
                </div>
            </div>

            {/* PIN Code - Now drives State and District */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="pin_code">
                        PIN Code <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="pin_code"
                            placeholder="6-digit PIN code"
                            value={formData.pin_code || ''}
                            onChange={(e) => handleInputChange('pin_code', e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            pattern="[0-9]{6}"
                            required
                            className="flex-1"
                        />
                        {pinCodeLoading && (
                            <Loader2 className="h-4 w-4 animate-spin mt-2" />
                        )}
                    </div>
                    {validationErrors.pin_code && (
                        <p className="text-xs text-destructive">{validationErrors.pin_code}</p>
                    )}
                    {pinCodeError && (
                        <p className="text-xs text-destructive">{pinCodeError}</p>
                    )}
                    {pinCodeValid && pinCodeData && (
                        <p className="text-xs text-green-600">
                            ✓ Found: {pinCodeData.district}, {pinCodeData.state}
                        </p>
                    )}
                </div>

                {/* State and District - Auto-filled and read-only */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="state">
                            State <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="state"
                            placeholder="Enter PIN code to auto-fill state"
                            value={formData.state || ''}
                            readOnly
                            className="bg-muted"
                        />
                        {validationErrors.state && (
                            <p className="text-xs text-destructive">{validationErrors.state}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="district">
                            District <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="district"
                            placeholder="Enter PIN code to auto-fill district"
                            value={formData.district || ''}
                            readOnly
                            className="bg-muted"
                        />
                        {validationErrors.district && (
                            <p className="text-xs text-destructive">{validationErrors.district}</p>
                        )}
                    </div>
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
                    {validationErrors.google_maps_url && (
                        <p className="text-xs text-destructive">{validationErrors.google_maps_url}</p>
                    )}
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
                        {validationErrors.latitude && (
                            <p className="text-xs text-destructive">{validationErrors.latitude}</p>
                        )}
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
                        {validationErrors.longitude && (
                            <p className="text-xs text-destructive">{validationErrors.longitude}</p>
                        )}
                    </div>
                </div>
                {validationErrors.coordinates && (
                    <p className="text-xs text-destructive">{validationErrors.coordinates}</p>
                )}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                >
                    {gettingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                    )}
                    Use Current Location
                </Button>
            </div>

            {/* Address Instructions */}
            <div className="space-y-2">
                <Label htmlFor="address_instructions">Address Instructions</Label>
                <Textarea
                    id="delivery_instructions"
                    placeholder="Any specific instructions for locating you (landmarks, gate numbers, etc.)"
                    value={formData.delivery_instructions || ''}
                    onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                    maxLength={ADDRESS_VALIDATION_LIMITS.DELIVERY_INSTRUCTIONS_MAX}
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