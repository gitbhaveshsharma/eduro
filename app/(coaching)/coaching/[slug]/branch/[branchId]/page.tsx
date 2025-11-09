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

export default function CoachingBranchProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const branchId = params?.branchId as string;

    const { loadCoachingCenterBySlug, loadCoachingBranch } = useCoachingStore();
    const { loadAddress } = useAddressStore();

    const [center, setCenter] = useState<PublicCoachingCenter | null>(null);
    const [branch, setBranch] = useState<PublicCoachingBranch | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadBranchData = useCallback(async () => {
        if (!slug || !branchId) return;

        setLoading(true);
        setError(null);

        try {
            // 1) Load center by slug (populates store)
            await loadCoachingCenterBySlug(slug);
            const storeState = useCoachingStore.getState();
            const centerData = storeState.currentCoachingCenter;

            if (!centerData) {
                setError('Coaching center not found');
                return;
            }
            setCenter(centerData as unknown as PublicCoachingCenter);

            // 2) Load branch by id
            const branchData = await loadCoachingBranch(branchId);
            if (!branchData) {
                setError('Branch not found');
                return;
            }
            setBranch(branchData as PublicCoachingBranch);

            // 3) Optional address loading (enable when schema supports it)
            // if (branchData.metadata?.address_id) {
            //   const addr = await loadAddress(branchData.metadata.address_id);
            //   setAddress(addr || null);
            // }
        } catch (err) {
            console.error('Failed to load branch:', err);
            setError('Failed to load branch details');
        } finally {
            setLoading(false);
        }
    }, [slug, branchId, loadCoachingCenterBySlug, loadCoachingBranch, loadAddress]);

    useEffect(() => {
        loadBranchData();
    }, [loadBranchData]);

    if (loading) {
        // Use the same full-screen spinner pattern used on the center slug page
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <LoadingSpinner
                    message={`Loading ${slug} / branch...`}
                    size="lg"
                    variant="primary"
                    fullscreen
                />
            </div>
        );
    }

    if (error || !center || !branch) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Branch not found'}
                    </AlertDescription>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push(`/coaching/${slug}`)}
                    >
                        Back to Coaching Center
                    </Button>
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
