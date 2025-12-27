import { ProfileAPI } from '@/lib/profile';
// This page uses server-side cookies (via Supabase server client). Next.js
// may attempt to statically prerender app routes during build; when a page
// accesses `cookies()` it becomes dynamic. Declare the page as dynamic so
// Next will render it at request-time and the cookies API is available.
export const dynamic = 'force-dynamic';
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
    } catch {
        // Don't throw - let client handle the fetch
        initialProfiles = [];
    }
    // console.log('🔷 NetworkPage - Fetched initial profiles on server:', { initialProfiles });
    return <NetworkPageClient initialProfiles={initialProfiles} />;
}
