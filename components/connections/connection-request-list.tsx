'use client';

/**
 * Connection Request List Component
 * 
 * Displays list of received or sent connection requests in a grid layout.
 * Handles empty states and loading states with infinite scroll.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Inbox, Send, Loader2,
    RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ConnectionRequestCard } from './connection-request-card';
import { ConnectionRequestCardSkeleton } from './connection-request-card-skeleton';
import {
    useReceivedRequests,
    useSentRequests,
    useRequestsLoading,
    useFollowStore,
    type FollowerProfile,
} from '@/lib/follow';
import { cn } from '@/lib/utils';

const REQUESTS_PER_PAGE = 21; // 3 columns * 7 rows

interface ConnectionRequestListProps {
    defaultTab?: 'received' | 'sent';
    currentUser?: FollowerProfile;
    className?: string;
}

export function ConnectionRequestList({
    defaultTab = 'received',
    currentUser,
    className,
}: ConnectionRequestListProps) {
    const receivedRequests = useReceivedRequests();
    const sentRequests = useSentRequests();
    const isLoading = useRequestsLoading();

    // Controlled tab state that updates when defaultTab changes
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Infinite scroll state
    const [visibleReceivedCount, setVisibleReceivedCount] = useState(REQUESTS_PER_PAGE);
    const [visibleSentCount, setVisibleSentCount] = useState(REQUESTS_PER_PAGE);
    const receivedSentinelRef = useRef<HTMLDivElement | null>(null);
    const sentSentinelRef = useRef<HTMLDivElement | null>(null);

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
        // Reset visible counts on refresh
        setVisibleReceivedCount(REQUESTS_PER_PAGE);
        setVisibleSentCount(REQUESTS_PER_PAGE);
    };

    const pendingReceivedRequests = receivedRequests.filter(r => r.status === 'pending');
    const pendingSentRequests = sentRequests.filter(r => r.status === 'pending');

    // Infinite scroll for received requests
    const handleReceivedIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting) {
            setVisibleReceivedCount(prev => Math.min(prev + REQUESTS_PER_PAGE, pendingReceivedRequests.length));
        }
    }, [pendingReceivedRequests.length]);

    // Infinite scroll for sent requests
    const handleSentIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting) {
            setVisibleSentCount(prev => Math.min(prev + REQUESTS_PER_PAGE, pendingSentRequests.length));
        }
    }, [pendingSentRequests.length]);

    // Setup intersection observer for received requests
    useEffect(() => {
        const observer = new IntersectionObserver(handleReceivedIntersection, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        const sentinel = receivedSentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [handleReceivedIntersection]);

    // Setup intersection observer for sent requests
    useEffect(() => {
        const observer = new IntersectionObserver(handleSentIntersection, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        const sentinel = sentSentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [handleSentIntersection]);

    // Reset visible counts when requests change
    useEffect(() => {
        setVisibleReceivedCount(REQUESTS_PER_PAGE);
    }, [pendingReceivedRequests.length]);

    useEffect(() => {
        setVisibleSentCount(REQUESTS_PER_PAGE);
    }, [pendingSentRequests.length]);

    const visibleReceivedRequests = pendingReceivedRequests.slice(0, visibleReceivedCount);
    const visibleSentRequests = pendingSentRequests.slice(0, visibleSentCount);

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
                                <RefreshCw className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Refresh</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Received Requests */}
                <TabsContent value="received" className="space-y-4">
                    {isLoading && pendingReceivedRequests.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {Array.from({ length: Math.min(REQUESTS_PER_PAGE, 12) }).map((_, idx) => (
                                <ConnectionRequestCardSkeleton key={`skeleton-received-${idx}`} />
                            ))}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {visibleReceivedRequests.map((request, idx) => (
                                    <ConnectionRequestCard
                                        key={request.id}
                                        request={request}
                                        type="received"
                                        currentUser={currentUser}
                                        onRequestHandled={handleRefresh}
                                        index={idx}
                                    />
                                ))}
                                {/* Sentinel for infinite scroll */}
                                {visibleReceivedCount < pendingReceivedRequests.length && (
                                    <div ref={receivedSentinelRef} style={{ height: 1 }} />
                                )}
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* Sent Requests */}
                <TabsContent value="sent" className="space-y-4">
                    {isLoading && pendingSentRequests.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {Array.from({ length: Math.min(REQUESTS_PER_PAGE, 12) }).map((_, idx) => (
                                <ConnectionRequestCardSkeleton key={`skeleton-sent-${idx}`} />
                            ))}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {visibleSentRequests.map((request, idx) => (
                                    <ConnectionRequestCard
                                        key={request.id}
                                        request={request}
                                        type="sent"
                                        currentUser={currentUser}
                                        onRequestHandled={handleRefresh}
                                        index={idx}
                                    />
                                ))}
                                {/* Sentinel for infinite scroll */}
                                {visibleSentCount < pendingSentRequests.length && (
                                    <div ref={sentSentinelRef} style={{ height: 1 }} />
                                )}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}