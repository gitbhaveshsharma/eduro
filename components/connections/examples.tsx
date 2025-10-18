'use client';

/**
 * Connection Integration Examples
 * 
 * Example components showing how to integrate the connection system
 * into existing profile pages, user cards, and other UI elements.
 */

import { ConnectionButton, ConnectionCard, ConnectionStats } from '@/components/connections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/avatar';
import { Badge } from '@/components/ui/badge';
import { useConnection, useConnectionStats, useMutualConnection } from '@/hooks/use-connections';
import type { FollowerProfile } from '@/lib/follow';

// ============================================
// Example 1: Simple Profile Header with Connection Button
// ============================================

interface ProfileHeaderProps {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
}

export function ProfileHeaderWithConnection({ user, currentUser }: ProfileHeaderProps) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <UserAvatar profile={user} size="xl" showOnlineStatus />
                    <div>
                        <h2 className="text-2xl font-bold">{user.full_name}</h2>
                        <p className="text-muted-foreground">@{user.username}</p>
                    </div>
                </div>

                {/* Connection button - shows only if not viewing own profile */}
                {currentUser?.id !== user.id && (
                    <ConnectionButton
                        targetUser={user}
                        currentUser={currentUser}
                        size="default"
                    />
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// Example 2: User Card in Feed
// ============================================

interface FeedUserCardProps {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
}

export function FeedUserCard({ user, currentUser }: FeedUserCardProps) {
    const { isConnected } = useConnection(user.id);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <UserAvatar profile={user} size="md" showOnlineStatus />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{user.full_name}</h3>
                                {isConnected && (
                                    <Badge variant="secondary" className="text-xs">
                                        Connected
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                    </div>

                    <ConnectionButton
                        targetUser={user}
                        currentUser={currentUser}
                        size="sm"
                        showText={false}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// Example 3: Profile Page with Stats and Connection
// ============================================

interface ProfilePageProps {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
}

export function ProfilePageWithConnections({ user, currentUser }: ProfilePageProps) {
    const { stats } = useConnectionStats(user.id);
    const { isConnected } = useConnection(user.id);
    const { isMutual } = useMutualConnection(user.id);

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <UserAvatar profile={user} size="2xl" showOnlineStatus />

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold">{user.full_name}</h1>
                                    {isMutual && (
                                        <Badge variant="default">Mutual Connection</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">@{user.username}</p>
                                {user.is_verified && (
                                    <Badge variant="outline" className="mt-2">Verified</Badge>
                                )}
                            </div>
                        </div>

                        {currentUser?.id !== user.id && (
                            <ConnectionButton
                                targetUser={user}
                                currentUser={currentUser}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Connection Stats */}
            <ConnectionStats stats={stats} />

            {/* More profile content... */}
        </div>
    );
}

// ============================================
// Example 4: Simple List Item with Connection
// ============================================

interface ListItemWithConnectionProps {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
    onClick?: () => void;
}

export function ListItemWithConnection({
    user,
    currentUser,
    onClick
}: ListItemWithConnectionProps) {
    const { isConnected, isLoading, connect, disconnect } = useConnection(user.id);

    const handleConnectionToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering onClick
        if (isConnected) {
            await disconnect();
        } else {
            await connect();
        }
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <UserAvatar profile={user} size="md" showOnlineStatus />
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                </div>
            </div>

            {currentUser?.id !== user.id && (
                <ConnectionButton
                    targetUser={user}
                    currentUser={currentUser}
                    size="sm"
                    variant={isConnected ? "outline" : "default"}
                    className="ml-2"
                />
            )}
        </div>
    );
}

// ============================================
// Example 5: Minimal Connection Indicator
// ============================================

interface ConnectionIndicatorProps {
    userId: string;
}

export function ConnectionIndicator({ userId }: ConnectionIndicatorProps) {
    const { isConnected } = useConnection(userId);
    const { isMutual } = useMutualConnection(userId);

    if (!isConnected) return null;

    return (
        <Badge variant={isMutual ? "default" : "secondary"} className="text-xs">
            {isMutual ? "Mutual Connection" : "Connected"}
        </Badge>
    );
}

// ============================================
// Example 6: Compact User Card with Connection
// ============================================

export function CompactUserCardWithConnection({
    user,
    currentUser
}: {
    user: FollowerProfile;
    currentUser?: FollowerProfile;
}) {
    return (
        <ConnectionCard
            user={user}
            currentUser={currentUser}
            showStats={true}
            showMutualBadge={true}
            className="max-w-md"
        />
    );
}

// ============================================
// Usage in Your Components
// ============================================

/*
// In a profile page:
import { ProfilePageWithConnections } from '@/components/connections/examples';

export default function UserProfile({ user, currentUser }) {
  return (
    <ProfilePageWithConnections
      user={user}
      currentUser={currentUser}
    />
  );
}

// In a user list:
import { ListItemWithConnection } from '@/components/connections/examples';

export function UserList({ users, currentUser }) {
  return (
    <div className="space-y-2">
      {users.map(user => (
        <ListItemWithConnection
          key={user.id}
          user={user}
          currentUser={currentUser}
          onClick={() => router.push(`/profile/${user.username}`)}
        />
      ))}
    </div>
  );
}

// In a feed/post:
import { FeedUserCard } from '@/components/connections/examples';

export function PostAuthor({ author, currentUser }) {
  return (
    <FeedUserCard
      user={author}
      currentUser={currentUser}
    />
  );
}

// Quick connection button anywhere:
import { ConnectionButton } from '@/components/connections';

<ConnectionButton
  targetUser={user}
  currentUser={currentUser}
  size="sm"
/>

// Connection status badge:
import { ConnectionIndicator } from '@/components/connections/examples';

<ConnectionIndicator userId={user.id} />
*/
