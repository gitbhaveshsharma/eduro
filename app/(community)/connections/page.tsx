'use client';

/**
 * Connections Page
 * 
 * Main page for viewing and managing connections.
 * LinkedIn-style connections: request → accept → mutual connection
 * Includes tabs for: My Connections, Requests, and Suggestions.
 */

import { useEffect, useState } from 'react';
import { Users, Inbox, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    ConnectionStats,
    ConnectionList,
    ConnectionRequestList,
    ConnectionSuggestions,
} from '@/components/connections';
import {
    useFollowStats,
    useFollowStore,
    usePendingRequests,
    useSentRequests,
} from '@/lib/follow';
import { useCurrentProfile } from '@/lib/profile';
import { useConnectionsContext } from './connections-context';

export default function ConnectionsPage() {
    const stats = useFollowStats();
    const receivedRequests = usePendingRequests(); // Pending requests I received
    const sentRequests = useSentRequests(); // Requests I sent (pending)
    const profile = useCurrentProfile();

    // Get context for shared state
    const connectionsContext = useConnectionsContext();
    const activeTab = connectionsContext?.activeTab ?? 'connections';
    const setActiveTab = connectionsContext?.setActiveTab;

    // State for controlling which request tab to show when clicking stats
    const [requestTab, setRequestTab] = useState<'received' | 'sent'>('received');

    // Load initial data
    useEffect(() => {
        const store = useFollowStore.getState();
        store.loadStats();
        store.loadReceivedRequests();
        store.loadSentRequests();
    }, []);

    // Update total connections in context when data changes
    useEffect(() => {
        if (connectionsContext?.setTotalConnections && stats) {
            // Total is mutual connections (where both are connected)
            connectionsContext.setTotalConnections(stats.mutual_follows ?? 0);
        }
    }, [stats, connectionsContext]);

    // Map current profile to FollowerProfile shape for components
    const currentUser = profile ? {
        id: profile.id,
        username: profile.username || null,
        full_name: profile.full_name || null,
        avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : null,
        bio: profile.bio || null,
        role: (profile.role || 'S') as 'SA' | 'A' | 'S' | 'T' | 'C',
        is_verified: !!profile.is_verified,
        is_online: !!profile.is_online,
        follower_count: stats?.followers ?? 0,
        following_count: stats?.following ?? 0,
        created_at: profile.created_at || new Date().toISOString(),
    } : undefined;

    const handleTabChange = (value: string) => {
        if (setActiveTab) {
            setActiveTab(value as 'connections' | 'requests' | 'suggestions');
        }
    };

    // Handle stat clicks - open appropriate tab
    const handleStatClick = (stat: 'connections' | 'received' | 'sent') => {
        if (stat === 'connections') {
            handleTabChange('connections');
        } else {
            // For received/sent, open requests tab with appropriate sub-tab
            setRequestTab(stat);
            handleTabChange('requests');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Stats */}
            <ConnectionStats
                stats={stats}
                receivedRequestsCount={receivedRequests.length}
                sentRequestsCount={sentRequests.filter(r => r.status === 'pending').length}
                isLoading={!stats}
                onStatClick={handleStatClick}
            />

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-3 ">
                    <TabsTrigger value="connections" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">My Connections</span>
                        <span className="sm:hidden">Connections</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2">
                        <Inbox className="h-4 w-4" />
                        <span className="hidden sm:inline">Requests</span>
                        <span className="sm:hidden">Requests</span>
                        {receivedRequests.length > 0 && (
                            <Badge
                                variant="destructive"
                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                            >
                                {receivedRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Suggestions</span>
                        <span className="sm:hidden">Suggestions</span>
                    </TabsTrigger>
                </TabsList>

                {/* My Connections Tab - Show only mutual connections */}
                <TabsContent value="connections" className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">My Connections</h2>
                            <p className="text-sm text-muted-foreground">
                                {stats?.mutual_follows || 0} mutual {stats?.mutual_follows === 1 ? 'connection' : 'connections'}
                            </p>
                        </div>

                        {/* Show mutual connections only */}
                        <ConnectionList
                            type="connections"
                            currentUser={currentUser}
                            showSearch={true}
                            showFilters
                            showMutualBadge={false}
                        />
                    </div>
                </TabsContent>

                {/* Connection Requests Tab */}
                <TabsContent value="requests" className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Connection Requests</h2>
                        <ConnectionRequestList defaultTab={requestTab} />
                    </div>
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Suggested Connections</h2>
                        <ConnectionSuggestions
                            currentUser={currentUser}
                            limit={15}
                            showRefreshButton
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}