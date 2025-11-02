/**
 * Profile Form Component
 * 
 * Form for editing user profile information
 * Role field is non-editable with tooltip explaining why
 */

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Profile, ProfileUpdate } from '@/lib/schema/profile.types';
import { ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import { useProfileStore } from '@/lib/store/profile.store';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast';
import {
    profileFormSchema,
    validateUsernameFormat,
    PROFILE_VALIDATION_LIMITS
} from '@/lib/validations/profile.validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Save,
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Globe,
    Briefcase,
    GraduationCap,
    AlertTriangle,
    Info,
    Lock
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AddressCard, AddressManager } from '../address';

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    profile: Profile;
    onSuccess?: () => void;
    className?: string;
}

export function ProfileForm({ profile, onSuccess, className = '' }: ProfileFormProps) {
    const { updateCurrentProfile } = useProfileStore();
    const [isSaving, setIsSaving] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    // Initialize form
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
        setValue,
        reset
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            full_name: profile.full_name,
            username: profile.username,
            bio: profile.bio,
            phone: profile.phone,
            timezone: profile.timezone,
            language_preference: profile.language_preference,
            expertise_areas: profile.expertise_areas,
            years_of_experience: profile.years_of_experience,
            hourly_rate: profile.hourly_rate,
            grade_level: profile.grade_level,
            subjects_of_interest: profile.subjects_of_interest,
            learning_goals: profile.learning_goals,
        }
    });

    const watchedUsername = watch('username');
    const watchedExpertiseInput = watch('expertise_areas');
    const watchedSubjectsInput = watch('subjects_of_interest');

    // Check username availability
    const checkUsername = async (username: string) => {
        if (!username || username === profile.username) {
            setUsernameAvailable(null);
            return;
        }

        const validation = validateUsernameFormat(username);
        if (!validation.valid) {
            setUsernameAvailable(false);
            showWarningToast(validation.error || 'Invalid username format');
            return;
        }

        setCheckingUsername(true);
        const { checkUsernameAvailability } = useProfileStore.getState();
        const available = await checkUsernameAvailability(username);
        setUsernameAvailable(available);
        setCheckingUsername(false);

        if (!available) {
            showWarningToast('Username is already taken');
        }
    };

    // Handle form submission
    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);

        try {
            // Clean up empty strings and convert to null
            const updates: ProfileUpdate = {
                ...data,
                phone: data.phone === '' ? null : data.phone,
                full_name: data.full_name === '' ? null : data.full_name,
                username: data.username === '' ? null : data.username,
                bio: data.bio === '' ? null : data.bio,
            };

            const success = await updateCurrentProfile(updates);

            if (success) {
                showSuccessToast('Profile updated successfully');
                reset(data); // Reset form dirty state
                onSuccess?.();
            } else {
                showErrorToast('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showErrorToast('An error occurred while updating your profile');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        reset();
        showWarningToast('Changes discarded');
    };

    const isTeacherOrCoach = profile.role === 'T' || profile.role === 'C';
    const isStudent = profile.role === 'S';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
            {/* Basic Information & Contact Information in one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>
                            Update your basic profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                {...register('full_name')}
                                placeholder="Enter your full name"
                                className={errors.full_name ? 'border-destructive' : ''}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-destructive">{errors.full_name.message}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    {...register('username')}
                                    placeholder="Choose a unique username"
                                    className={errors.username ? 'border-destructive' : ''}
                                    onBlur={(e) => checkUsername(e.target.value)}
                                />
                                {checkingUsername && (
                                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {!checkingUsername && usernameAvailable === true && watchedUsername !== profile.username && (
                                    <span className="absolute right-3 top-3 text-xs text-green-600">Available ✓</span>
                                )}
                                {!checkingUsername && usernameAvailable === false && (
                                    <span className="absolute right-3 top-3 text-xs text-destructive">Taken ✗</span>
                                )}
                            </div>
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username.message}</p>
                            )}
                        </div>

                        {/* Role - Non-editable */}
                        <div className="space-y-2">
                            <Label htmlFor="role" className="flex items-center gap-2">
                                Role
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Lock className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">
                                                You cannot edit your role directly. Contact support team to update your role.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="role"
                                    value={ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                />
                                <Badge
                                    variant="secondary"
                                    className="absolute right-3 top-2.5"
                                >
                                    Non-editable
                                </Badge>
                            </div>
                            <Alert className="bg-red-50 border-red-200  text-red-600">
                                <AlertTriangle className="h-4 w-4 " />
                                <AlertDescription className="ml-2 text-sm text-red-800">
                                    To update your role, please contact our support team at support@eduro.com
                                </AlertDescription>
                            </Alert>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                {...register('bio')}
                                placeholder="Tell us about yourself"
                                rows={4}
                                className={errors.bio ? 'border-destructive' : ''}
                            />
                            {errors.bio && (
                                <p className="text-sm text-destructive">{errors.bio.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {watch('bio')?.length || 0} / {PROFILE_VALIDATION_LIMITS.BIO_MAX} characters
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Contact Information
                        </CardTitle>
                        <CardDescription>
                            Update your contact details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Email - Non-editable */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                Email
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Email cannot be changed for security reasons</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email || ''}
                                disabled
                                className="bg-muted cursor-not-allowed"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                {...register('phone')}
                                type="tel"
                                placeholder="+1234567890"
                                className={errors.phone ? 'border-destructive' : ''}
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone.message}</p>
                            )}
                        </div>
                        {/* Address management */}
                        <div className="space-y-2">
                            <AddressManager
                                showAddButton={true}
                                allowEdit={true}
                                allowDelete={true}
                                allowSetPrimary={true}
                                maxAddresses={5}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Role-specific sections - Full width on mobile, could be side by side on larger screens if both exist */}
            {(isTeacherOrCoach || isStudent) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Teacher/Coach Specific Fields */}
                    {isTeacherOrCoach && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Professional Information
                                </CardTitle>
                                <CardDescription>
                                    Update your professional details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Years of Experience */}
                                    <div className="space-y-2">
                                        <Label htmlFor="years_of_experience">Years of Experience</Label>
                                        <Input
                                            id="years_of_experience"
                                            type="number"
                                            {...register('years_of_experience', { valueAsNumber: true })}
                                            min="0"
                                            max="100"
                                            placeholder="0"
                                            className={errors.years_of_experience ? 'border-destructive' : ''}
                                        />
                                        {errors.years_of_experience && (
                                            <p className="text-sm text-destructive">{errors.years_of_experience.message}</p>
                                        )}
                                    </div>

                                    {/* Hourly Rate */}
                                    <div className="space-y-2">
                                        <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                                        <Input
                                            id="hourly_rate"
                                            type="number"
                                            {...register('hourly_rate', { valueAsNumber: true })}
                                            min="0"
                                            max="10000"
                                            placeholder="0"
                                            className={errors.hourly_rate ? 'border-destructive' : ''}
                                        />
                                        {errors.hourly_rate && (
                                            <p className="text-sm text-destructive">{errors.hourly_rate.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Expertise Areas */}
                                <div className="space-y-2">
                                    <Label>Expertise Areas</Label>
                                    <Input
                                        placeholder="Enter comma-separated areas (e.g., Math, Physics, Chemistry)"
                                        value={watchedExpertiseInput?.join(', ') || ''}
                                        onChange={(e) => {
                                            const areas = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                                            setValue('expertise_areas', areas, { shouldDirty: true });
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Separate multiple areas with commas
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Student Specific Fields */}
                    {isStudent && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Academic Information
                                </CardTitle>
                                <CardDescription>
                                    Update your academic details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Grade Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="grade_level">Grade Level</Label>
                                    <Input
                                        id="grade_level"
                                        {...register('grade_level')}
                                        placeholder="e.g., 10th Grade, Class 12"
                                        className={errors.grade_level ? 'border-destructive' : ''}
                                    />
                                    {errors.grade_level && (
                                        <p className="text-sm text-destructive">{errors.grade_level.message}</p>
                                    )}
                                </div>

                                {/* Subjects of Interest */}
                                <div className="space-y-2">
                                    <Label>Subjects of Interest</Label>
                                    <Input
                                        placeholder="Enter comma-separated subjects (e.g., Math, Science, English)"
                                        value={watchedSubjectsInput?.join(', ') || ''}
                                        onChange={(e) => {
                                            const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                            setValue('subjects_of_interest', subjects, { shouldDirty: true });
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Separate multiple subjects with commas
                                    </p>
                                </div>

                                {/* Learning Goals */}
                                <div className="space-y-2">
                                    <Label htmlFor="learning_goals">Learning Goals</Label>
                                    <Textarea
                                        id="learning_goals"
                                        {...register('learning_goals')}
                                        placeholder="Describe what you want to achieve"
                                        rows={4}
                                        className={errors.learning_goals ? 'border-destructive' : ''}
                                    />
                                    {errors.learning_goals && (
                                        <p className="text-sm text-destructive">{errors.learning_goals.message}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {watch('learning_goals')?.length || 0} / {PROFILE_VALIDATION_LIMITS.LEARNING_GOALS_MAX} characters
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={!isDirty || isSaving}
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!isDirty || isSaving || (usernameAvailable === false && watchedUsername !== profile.username)}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}