/**
 * Coaching Branch Profile Page
 * 
 * Public-facing profile page for a specific coaching branch
 * Shows branch details, address, manager info, and reviews
 * Accessible at: /coaching/[slug]/branch/[branchId]
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useCoachingStore,
    type PublicCoachingCenter,
    type PublicCoachingBranch
} from '@/lib/coaching';
import { useAddressStore, type Address } from '@/lib/address';
import { CoachingBranchProfile } from '@/components/coaching/public/coaching-branch-profile';
import { CoachingReviewsSection } from '@/components/coaching/public/coaching-reviews-section';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    useEffect(() => {
        if (slug && branchId) {
            loadBranchData();
        }
    }, [slug, branchId]);

    const loadBranchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load coaching center
            await loadCoachingCenterBySlug(slug);

            // Get center from store (loadCoachingCenterBySlug doesn't return data)
            const storeState = useCoachingStore.getState();
            const centerData = storeState.currentCoachingCenter;

            if (!centerData) {
                setError('Coaching center not found');
                return;
            }

            setCenter(centerData as unknown as PublicCoachingCenter);

            // Load branch
            const branchData = await loadCoachingBranch(branchId);

            if (!branchData) {
                setError('Branch not found');
                return;
            }

            setBranch(branchData as PublicCoachingBranch);

            // Load address if branch has one (assuming branches store address_id in metadata)
            // For now, we'll skip address loading as it requires database schema update
            // You can add this later based on your branch-address relationship

        } catch (err) {
            console.error('Failed to load branch:', err);
            setError('Failed to load branch details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (error || !center || !branch) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
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
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Branch Profile */}
                <CoachingBranchProfile
                    branch={branch}
                    centerName={center.name}
                    centerSlug={slug}
                    address={address}
                    managerName={null} // Can be loaded from profile if needed
                />

                {/* Branch Reviews */}
                <CoachingReviewsSection
                    coachingCenterId={center.id}
                    centerName={center.name}
                    centerSlug={slug}
                    branchIds={[branch.id]}
                />
            </div>
        </div>
    );
}
