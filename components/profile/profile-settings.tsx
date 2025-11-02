/**
 * Profile Settings Component
 * 
 * Manages user notification preferences and account settings
 */

"use client";

import { useState } from 'react';
import { Profile, ProfileUpdate } from '@/lib/schema/profile.types';
import { useProfileStore } from '@/lib/store/profile.store';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    Save,
    Bell,
    Mail,
    MessageSquare,
    Phone,
    Globe,
    RotateCcw
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ProfileSettingsProps {
    profile: Profile;
    onSuccess?: () => void;
    className?: string;
}

export function ProfileSettings({ profile, onSuccess, className = '' }: ProfileSettingsProps) {
    const { updateCurrentProfile } = useProfileStore();
    const [isSaving, setIsSaving] = useState(false);

    // Notification preferences state
    const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications);
    const [pushNotifications, setPushNotifications] = useState(profile.push_notifications);
    const [chatNotifications, setChatNotifications] = useState(profile.chat_notifications);
    const [whatsappNotifications, setWhatsappNotifications] = useState(profile.whatsapp_notifications);
    const [smsNotifications, setSmsNotifications] = useState(profile.sms_notifications);

    // Preferences state
    const [languagePreference, setLanguagePreference] = useState(profile.language_preference);
    const [timezone, setTimezone] = useState(profile.timezone);

    // Check if any changes were made
    const hasChanges =
        emailNotifications !== profile.email_notifications ||
        pushNotifications !== profile.push_notifications ||
        chatNotifications !== profile.chat_notifications ||
        whatsappNotifications !== profile.whatsapp_notifications ||
        smsNotifications !== profile.sms_notifications ||
        languagePreference !== profile.language_preference ||
        timezone !== profile.timezone;

    // Handle save
    const handleSave = async () => {
        if (!hasChanges) {
            showSuccessToast('No changes to save');
            return;
        }

        setIsSaving(true);

        try {
            const updates: ProfileUpdate = {
                email_notifications: emailNotifications,
                push_notifications: pushNotifications,
                chat_notifications: chatNotifications,
                whatsapp_notifications: whatsappNotifications,
                sms_notifications: smsNotifications,
                language_preference: languagePreference,
                timezone: timezone,
            };

            const success = await updateCurrentProfile(updates);

            if (success) {
                showSuccessToast('Settings updated successfully');
                onSuccess?.();
            } else {
                showErrorToast('Failed to update settings. Please try again.');
            }
        } catch (error) {
            console.error('Settings update error:', error);
            showErrorToast('An error occurred while updating settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle reset
    const handleReset = () => {
        setEmailNotifications(profile.email_notifications);
        setPushNotifications(profile.push_notifications);
        setChatNotifications(profile.chat_notifications);
        setWhatsappNotifications(profile.whatsapp_notifications);
        setSmsNotifications(profile.sms_notifications);
        setLanguagePreference(profile.language_preference);
        setTimezone(profile.timezone);
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Notification Preferences & Preferences in one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Preferences
                        </CardTitle>
                        <CardDescription>
                            Manage how you receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Email Notifications */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-start space-x-3">
                                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div className="space-y-1">
                                    <Label htmlFor="email-notifications" className="text-base cursor-pointer">
                                        Email Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications via email
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={emailNotifications}
                                onCheckedChange={setEmailNotifications}
                            />
                        </div>

                        <Separator />

                        {/* Push Notifications */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-start space-x-3">
                                <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div className="space-y-1">
                                    <Label htmlFor="push-notifications" className="text-base cursor-pointer">
                                        Push Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive push notifications in your browser
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={pushNotifications}
                                onCheckedChange={setPushNotifications}
                            />
                        </div>

                        <Separator />

                        {/* Chat Notifications */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-start space-x-3">
                                <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div className="space-y-1">
                                    <Label htmlFor="chat-notifications" className="text-base cursor-pointer">
                                        Chat Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified about new chat messages
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="chat-notifications"
                                checked={chatNotifications}
                                onCheckedChange={setChatNotifications}
                            />
                        </div>

                        <Separator />

                        {/* WhatsApp Notifications */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-start space-x-3">
                                <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp-notifications" className="text-base cursor-pointer">
                                        WhatsApp Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive important updates via WhatsApp
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="whatsapp-notifications"
                                checked={whatsappNotifications}
                                onCheckedChange={setWhatsappNotifications}
                            />
                        </div>

                        <Separator />

                        {/* SMS Notifications */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-start space-x-3">
                                <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div className="space-y-1">
                                    <Label htmlFor="sms-notifications" className="text-base cursor-pointer">
                                        SMS Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get SMS for critical notifications
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="sms-notifications"
                                checked={smsNotifications}
                                onCheckedChange={setSmsNotifications}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Preferences
                        </CardTitle>
                        <CardDescription>
                            Customize your experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Language Preference */}
                        <div className="space-y-3">
                            <Label htmlFor="language">Language Preference</Label>
                            <Select value={languagePreference} onValueChange={setLanguagePreference}>
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                                    <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                                    <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                                    <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                                    <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                                    <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                                    <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Choose your preferred language for the interface
                            </p>
                        </div>

                        <Separator />

                        {/* Timezone */}
                        <div className="space-y-3">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger id="timezone">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                                    <SelectItem value="Asia/Kolkata">IST (Indian Standard Time)</SelectItem>
                                    <SelectItem value="America/New_York">EST (Eastern Standard Time)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">PST (Pacific Standard Time)</SelectItem>
                                    <SelectItem value="Europe/London">GMT (Greenwich Mean Time)</SelectItem>
                                    <SelectItem value="Asia/Dubai">GST (Gulf Standard Time)</SelectItem>
                                    <SelectItem value="Asia/Singapore">SGT (Singapore Time)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">JST (Japan Standard Time)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Set your timezone for accurate timestamps
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset Changes
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}