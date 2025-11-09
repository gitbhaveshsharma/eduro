'use client';

/**
 * Connections Page
 * 
 * Main page for viewing and managing connections.
 * Includes tabs for: My Connections, Requests, and Suggestions.
 */

import { useEffect } from 'react';
import { Users, Inbox, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/lib/follow';
import type { FollowerProfile } from '@/lib/follow';

interface ConnectionsPageProps {
    currentUser?: FollowerProfile;
    defaultTab?: 'connections' | 'requests' | 'suggestions';
}

export default function ConnectionsPage({
    currentUser,
    defaultTab = 'connections',
}: ConnectionsPageProps) {
    const { loadStats, loadReceivedRequests } = useFollowStore();
    const stats = useFollowStats();
    const pendingRequests = usePendingRequests();

    useEffect(() => {
        // Initialize connection data
        loadStats();
        loadReceivedRequests();
    }, []);

    return (
        <div className=" max-w-7xl mx-auto  space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            {/* Page Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Connections</h1>
                <p className="text-muted-foreground">
                    Manage your connections, requests, and discover new people to connect with.
                </p>
            </div>

            {/* Stats */}
            <ConnectionStats
                stats={stats}
                isLoading={!stats}
            />

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connections" className="gap-2">
                        <Users className="h-4 w-4" />
                        My Connections
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2 relative">
                        <Inbox className="h-4 w-4" />
                        Requests
                        {pendingRequests.length > 0 && (
                            <Badge
                                variant="destructive"
                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                            >
                                {pendingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Suggestions
                    </TabsTrigger>
                </TabsList>

                {/* My Connections Tab */}
                <TabsContent value="connections" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Connections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="connections" className="w-full">
                                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                                    <TabsTrigger value="connections">
                                        Connections
                                        {stats && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({stats.followers})
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="connected">
                                        Connected With
                                        {stats && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({stats.following})
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="connections">
                                    <ConnectionList
                                        type="connections"
                                        currentUser={currentUser}
                                        showSearch
                                        showFilters
                                        showMutualBadge
                                    />
                                </TabsContent>

                                <TabsContent value="connected">
                                    <ConnectionList
                                        type="connected"
                                        currentUser={currentUser}
                                        showSearch
                                        showFilters
                                        showMutualBadge
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Connection Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ConnectionRequestList defaultTab="received" />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Suggested Connections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ConnectionSuggestions
                                currentUser={currentUser}
                                limit={15}
                                showRefreshButton
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
