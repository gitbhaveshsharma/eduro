'use client';

/**
 * Profile QR Code Dialog Component
 * 
 * Displays a QR code for sharing profile links with download functionality.
 */

import { memo, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/avatar';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import type { PublicProfile } from '@/lib/schema/profile.types';
import { Download, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ProfileQRCodeDialogProps {
    profile: PublicProfile;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProfileQRCodeDialog = memo(function ProfileQRCodeDialog({
    profile,
    open,
    onOpenChange,
}: ProfileQRCodeDialogProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${ProfileUrlUtils.getProfileUrl(profile.username || profile.id)}`;

    // QR code size - keep it consistent
    const QR_SIZE = 200;

    useEffect(() => {
        if (open) {
            generateQRCode();
        }
    }, [open, profileUrl]);

    const generateQRCode = async () => {
        setIsGenerating(true);
        try {
            // Dynamically import QRCode only on client side
            const QRCode = (await import('qrcode')).default;

            if (canvasRef.current) {
                // Generate QR code on canvas with specified size
                await QRCode.toCanvas(canvasRef.current, profileUrl, {
                    width: QR_SIZE,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF',
                    },
                    errorCorrectionLevel: 'M',
                });

                // Store data URL for download
                setQrDataUrl(canvasRef.current.toDataURL('image/png'));
            }
        } catch (err) {
            console.error('QR Code generation error:', err);
            showErrorToast('Failed to generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!qrDataUrl) {
            showErrorToast('QR code not ready');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `${profile.username || profile.id}-tutrsy-profile.png`;
            link.href = qrDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSuccessToast('QR code downloaded!');
        } catch (err) {
            console.error('Download error:', err);
            showErrorToast('Failed to download QR code');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            showSuccessToast('Profile link copied!');
        } catch (err) {
            showErrorToast('Failed to copy link');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 to-secondary/5">
                <DialogHeader>
                    <DialogTitle className="text-center">Share Profile</DialogTitle>
                    <DialogDescription className="text-center">
                        Scan this QR code to view the profile
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-6 py-6">
                    {/* Profile Info */}
                    <div className="flex flex-col items-center space-y-3">
                        <UserAvatar
                            profile={profile}
                            size="lg"
                            showOnlineStatus={false}
                        />
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">{displayName}</h3>
                            {profile.username && (
                                <p className="text-sm text-muted-foreground">
                                    @{profile.username}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="relative bg-white p-4 rounded-lg shadow-sm border-2 border-border">
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            className="block"
                            width={QR_SIZE}
                            height={QR_SIZE}
                        />
                    </div>

                    {/* Platform Branding */}
                    <div className="flex items-center justify-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">T</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Tutrsy
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex w-full gap-3 px-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCopyLink}
                        >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Copy Link
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={handleDownload}
                            disabled={isGenerating || !qrDataUrl}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});
