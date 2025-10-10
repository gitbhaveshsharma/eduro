'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Shield, Users, BookOpen, AlertCircle } from 'lucide-react'
import { useProfileStore } from '@/lib/store/profile.store'
import { showSuccessToast, showErrorToast } from '@/lib/toast'

interface TermsConditionsStepProps {
    onNext: () => void
    onPrevious: () => void
    loading: boolean
}

export function TermsConditionsStep({
    onNext,
    onPrevious,
    loading
}: TermsConditionsStepProps) {
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const { updateCurrentProfile } = useProfileStore()

    const canProceed = acceptedTerms && acceptedPrivacy

    const handleNext = async () => {
        if (!canProceed) return
        
        setIsProcessing(true)
        try {
            // Update profile with terms acceptance
            const success = await updateCurrentProfile({ is_agree: true })
            
            if (success) {
                showSuccessToast('Terms and conditions accepted successfully!')
                onNext() // This will handle the onboarding level update and redirect
            } else {
                showErrorToast('Failed to save terms acceptance. Please try again.')
            }
        } catch (error) {
            console.error('Error accepting terms:', error)
            showErrorToast('An error occurred while accepting terms. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
                <p className="text-muted-foreground text-lg">
                    Please review and accept our terms to complete your registration
                </p>
            </div>

            {/* Terms Card */}
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Legal Agreement
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Terms of Service */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Terms of Service
                        </h3>
                        <ScrollArea className="h-48 w-full rounded-md border p-4">
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <div>
                                    <h4 className="font-medium text-foreground">1. Acceptance of Terms</h4>
                                    <p>By creating an account on Eduro, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-foreground">2. User Accounts</h4>
                                    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">3. Educational Content</h4>
                                    <p>All educational materials and content provided through our platform are for educational purposes only. We strive to ensure accuracy but do not guarantee the completeness of all information.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">4. User Conduct</h4>
                                    <p>Users must maintain respectful behavior, refrain from sharing inappropriate content, and follow community guidelines at all times.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">5. Intellectual Property</h4>
                                    <p>All content, trademarks, and intellectual property on Eduro are owned by us or our licensors. Users may not reproduce or distribute content without permission.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">6. Service Availability</h4>
                                    <p>We strive to maintain service availability but do not guarantee uninterrupted access. Maintenance and updates may temporarily affect service.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">7. Limitation of Liability</h4>
                                    <p>Eduro shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">8. Termination</h4>
                                    <p>We reserve the right to terminate accounts that violate these terms or engage in harmful activities on our platform.</p>
                                </div>
                            </div>
                        </ScrollArea>
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="terms"
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I accept the Terms of Service
                            </label>
                        </div>
                    </div>

                    {/* Privacy Policy */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Privacy Policy
                        </h3>
                        <ScrollArea className="h-48 w-full rounded-md border p-4">
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <div>
                                    <h4 className="font-medium text-foreground">1. Information We Collect</h4>
                                    <p>We collect information you provide during registration, profile setup, and platform usage to enhance your educational experience.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">2. How We Use Your Information</h4>
                                    <p>Your data is used to personalize your learning experience, connect you with relevant opportunities, and improve our services.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">3. Information Sharing</h4>
                                    <p>We do not sell your personal information. We may share data with educational partners only with your explicit consent.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">4. Data Security</h4>
                                    <p>We implement industry-standard security measures to protect your personal information from unauthorized access or disclosure.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">5. Your Rights</h4>
                                    <p>You have the right to access, update, or delete your personal information. Contact our support team for assistance with data requests.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">6. Cookies and Tracking</h4>
                                    <p>We use cookies to improve site functionality and analyze usage patterns. You can manage cookie preferences in your browser settings.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">7. Third-Party Services</h4>
                                    <p>Our platform may integrate with third-party educational tools. Their privacy practices are governed by their respective policies.</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-foreground">8. Policy Updates</h4>
                                    <p>We may update this privacy policy periodically. Users will be notified of significant changes via email or platform notifications.</p>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="privacy"
                                checked={acceptedPrivacy}
                                onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                            />
                            <label
                                htmlFor="privacy"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I accept the Privacy Policy
                            </label>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-amber-800 mb-1">Important Notice</h4>
                                <p className="text-amber-700 text-sm">
                                    By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by both our Terms of Service and Privacy Policy. 
                                    These agreements are essential for maintaining a safe and effective learning environment for all users.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Community Guidelines Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-800 mb-2">Community Guidelines</h4>
                                <ul className="text-blue-700 text-sm space-y-1">
                                    <li>• Treat all users with respect and kindness</li>
                                    <li>• Share educational content responsibly</li>
                                    <li>• Report inappropriate behavior or content</li>
                                    <li>• Maintain academic integrity in all interactions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={loading}
                >
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!canProceed || loading || isProcessing}
                    className="min-w-[150px]"
                >
                    {(loading || isProcessing) ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Completing...
                        </div>
                    ) : (
                        'Complete Registration'
                    )}
                </Button>
            </div>
        </div>
    )
}