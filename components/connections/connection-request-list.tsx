'use client';

/**
 * Connection Request List Component
 * 
 * Displays list of received or sent connection requests.
 * Handles empty states and loading states.
 */

import { useEffect } from 'react';
import { Inbox, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
    const { loadReceivedRequests, loadSentRequests } = useFollowStore();
    const receivedRequests = useReceivedRequests();
    const sentRequests = useSentRequests();
    const isLoading = useRequestsLoading();
    const pendingRequests = usePendingRequests();

    useEffect(() => {
        loadReceivedRequests(undefined, undefined, 1, false);
        loadSentRequests(undefined, undefined, 1, false);
    }, []);

    const handleRefresh = () => {
        loadReceivedRequests(undefined, undefined, 1, true);
        loadSentRequests(undefined, undefined, 1, true);
    };

    const pendingReceivedRequests = receivedRequests.filter(r => r.status === 'pending');
    const pendingSentRequests = sentRequests.filter(r => r.status === 'pending');

    return (
        <div className={cn('', className)}>
            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="received" className="relative">
                            Received
                            {pendingReceivedRequests.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {pendingReceivedRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            Sent
                            {pendingSentRequests.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                                    {pendingSentRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Refresh'
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
                            <p className="text-sm text-muted-foreground">
                                {pendingReceivedRequests.length}{' '}
                                {pendingReceivedRequests.length === 1 ? 'request' : 'requests'} pending
                            </p>
                            <div className="space-y-3">
                                {pendingReceivedRequests.map((request) => (
                                    <ConnectionRequestCard
                                        key={request.id}
                                        request={request}
                                        type="received"
                                        onRequestHandled={handleRefresh}
                                    />
                                ))}
                            </div>
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
                            <p className="text-sm text-muted-foreground">
                                {pendingSentRequests.length}{' '}
                                {pendingSentRequests.length === 1 ? 'request' : 'requests'} pending
                            </p>
                            <div className="space-y-3">
                                {pendingSentRequests.map((request) => (
                                    <ConnectionRequestCard
                                        key={request.id}
                                        request={request}
                                        type="sent"
                                        onRequestHandled={handleRefresh}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
