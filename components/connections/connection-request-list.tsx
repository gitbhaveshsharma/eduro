'use client';

/**
 * Connection Request List Component
 * 
 * Displays list of received or sent connection requests.
 * Handles empty states and loading states.
 */

import { useEffect, useState } from 'react';
import {
    Inbox, Send, Loader2,
    RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ItemGroup, ItemSeparator } from '@/components/ui/item';
import { ConnectionRequestCard } from './connection-request-card';
import {
    useReceivedRequests,
    useSentRequests,
    useRequestsLoading,
    useFollowStore,
    usePendingRequests,
} from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionRequestListProps {
    defaultTab?: 'received' | 'sent';
    className?: string;
}

export function ConnectionRequestList({
    defaultTab = 'received',
    className,
}: ConnectionRequestListProps) {
    const receivedRequests = useReceivedRequests();
    const sentRequests = useSentRequests();
    const isLoading = useRequestsLoading();
    const pendingRequests = usePendingRequests();

    // Controlled tab state that updates when defaultTab changes
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Update active tab when defaultTab prop changes
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        const store = useFollowStore.getState();
        store.loadReceivedRequests(undefined, undefined, 1, false);
        store.loadSentRequests(undefined, undefined, 1, false);
    }, []);

    const handleRefresh = () => {
        const store = useFollowStore.getState();
        store.loadReceivedRequests(undefined, undefined, 1, true);
        store.loadSentRequests(undefined, undefined, 1, true);
    };

    const pendingReceivedRequests = receivedRequests.filter(r => r.status === 'pending');
    const pendingSentRequests = sentRequests.filter(r => r.status === 'pending');

    return (
        <div className={cn('', className)}>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'sent')} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="received" className="flex items-center gap-2">
                            Received
                            {pendingReceivedRequests.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {pendingReceivedRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex items-center gap-2">
                            Sent
                            {pendingSentRequests.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {pendingSentRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {/* Show only icon on mobile */}
                                <RefreshCw className="h-4 w-4 md:hidden" />
                                {/* Show text on desktop/tablet */}
                                <span className="hidden md:inline">Refresh</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Received Requests */}
                <TabsContent value="received" className="space-y-4">
                    {isLoading && pendingReceivedRequests.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : pendingReceivedRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No connection requests</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                When someone wants to connect with you, their request will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-3">
                                {pendingReceivedRequests.length}{' '}
                                {pendingReceivedRequests.length === 1 ? 'request' : 'requests'} pending
                            </p>
                            <ItemGroup className="space-y-1 divide-y overflow-hidden">
                                {pendingReceivedRequests.map((request, index) => (
                                    <div key={request.id}>
                                        <ConnectionRequestCard
                                            request={request}
                                            type="received"
                                            onRequestHandled={handleRefresh}
                                        />
                                        {index < pendingReceivedRequests.length - 1 && <ItemSeparator />}
                                    </div>
                                ))}
                            </ItemGroup>
                        </>
                    )}
                </TabsContent>

                {/* Sent Requests */}
                <TabsContent value="sent" className="space-y-4">
                    {isLoading && pendingSentRequests.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : pendingSentRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Send className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Your sent connection requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-3">
                                {pendingSentRequests.length}{' '}
                                {pendingSentRequests.length === 1 ? 'request' : 'requests'} pending
                            </p>
                            <ItemGroup className="space-y-1 divide-y overflow-hidden">
                                {pendingSentRequests.map((request, index) => (
                                    <div key={request.id}>
                                        <ConnectionRequestCard
                                            request={request}
                                            type="sent"
                                            onRequestHandled={handleRefresh}
                                        />
                                        {index < pendingSentRequests.length - 1 && <ItemSeparator />}
                                    </div>
                                ))}
                            </ItemGroup>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
