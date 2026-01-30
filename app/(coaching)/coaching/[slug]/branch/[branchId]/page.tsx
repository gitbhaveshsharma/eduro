/**
 * Coaching Branch Profile Page
 * 
 * Public-facing profile page for a specific coaching branch
 * Modern UI, optimized renders, and consistent loading UX
 * Accessible at: /coaching/[slug]/branch/[branchId]
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useCoachingStore,
    type PublicCoachingCenter,
    type PublicCoachingBranch
} from '@/lib/coaching';
import { useAddressStore, type Address } from '@/lib/address';
import { CoachingBranchProfile } from '@/components/coaching/public/coaching-branch-profile';
import { BranchReviewsSection } from '@/components/coaching/public/branch-reviews-section';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries

export default function CoachingBranchProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const branchId = params?.branchId as string;

    const { loadCoachingCenterBySlug, loadCoachingBranch } = useCoachingStore();
    const { getAddressByEntity } = useAddressStore();

    const [center, setCenter] = useState<PublicCoachingCenter | null>(null);
    const [branch, setBranch] = useState<PublicCoachingBranch | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const loadBranchData = useCallback(async (attemptNumber: number = 1) => {
        if (!slug || !branchId) return;

        setLoading(true);
        setError(null);
        setRetryCount(attemptNumber);

        try {
            // 1) Load center by slug (populates store)
            await loadCoachingCenterBySlug(slug);
            const storeState = useCoachingStore.getState();
            const centerData = storeState.currentCoachingCenter;

            if (!centerData) {
                throw new Error('Coaching center not found');
            }
            setCenter(centerData as unknown as PublicCoachingCenter);

            // 2) Load branch by id
            const branchData = await loadCoachingBranch(branchId);
            if (!branchData) {
                throw new Error('Branch not found');
            }
            setBranch(branchData as PublicCoachingBranch);

            // 3) Load branch address
            const addressData = await getAddressByEntity('branch', branchId);
            setAddress(addressData || null);

            // Success - reset retry count
            setRetryCount(0);
            setLoading(false);
        } catch (err) {
            console.error(`Failed to load branch (attempt ${attemptNumber}/${MAX_RETRIES}):`, err);

            // Retry logic
            if (attemptNumber < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                await sleep(RETRY_DELAY);
                await loadBranchData(attemptNumber + 1);
            } else {
                // Max retries reached, show error
                setError(
                    err instanceof Error && err.message.includes('not found')
                        ? err.message
                        : 'Failed to load branch details. Please try again later.'
                );
                setLoading(false);
            }
        }
    }, [slug, branchId, loadCoachingCenterBySlug, loadCoachingBranch, getAddressByEntity]);

    useEffect(() => {
        loadBranchData(1);
    }, [loadBranchData]);

    if (loading) {
        // Show retry attempt in loading message
        const loadingMessage = retryCount > 1
            ? `Loading ${slug} / branch... (Attempt ${retryCount}/${MAX_RETRIES})`
            : `Loading ${slug} / branch...`;

        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <LoadingSpinner
                    message={loadingMessage}
                    size="lg"
                    variant="primary"
                    fullscreen
                />
            </div>
        );
    }

    if (error || !center || !branch) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md shadow-lg">
                    <AlertDescription>
                        {error || 'Branch not found'}
                    </AlertDescription>
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setError(null);
                                loadBranchData(1);
                            }}
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/coaching/${slug}`)}
                        >
                            Back to Coaching Center
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 lg:py-12 space-y-8">
                {/* Branch Profile */}
                <CoachingBranchProfile
                    branch={branch}
                    centerName={center.name}
                    centerSlug={slug}
                    address={address}
                    managerName={null}
                />

                {/* Branch Reviews */}
                <BranchReviewsSection
                    branchId={branch.id}
                    branchName={branch.name}
                />
            </div>
        </div>
    );
}