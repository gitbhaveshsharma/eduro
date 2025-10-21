import { ProfileAPI } from '@/lib/profile';
import type { PublicProfile } from '@/lib/schema/profile.types';
import NetworkPageClient from '@/components/network/network-page-client';

// Server component: fetch initial profiles on the server so the first page
// and first avatars are included in the HTML payload (discoverable by the
// browser early) which reduces LCP resource load delay.
export default async function NetworkPage() {
    // Fetch the first page of profiles server-side
    let initialProfiles: any[] = [];
    try {
        const res = await ProfileAPI.searchProfiles({}, { field: 'created_at', direction: 'desc' }, 1, 12);
        initialProfiles = res.profiles || [];
    } catch (err) {
        console.error('Failed to fetch initial profiles on server:', err);
    }

    return <NetworkPageClient initialProfiles={initialProfiles} />;
}
