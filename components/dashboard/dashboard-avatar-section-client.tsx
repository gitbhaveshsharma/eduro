// components/dashboard/dashboard-avatar-section-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon, Shuffle } from 'lucide-react'
import { UserAvatar } from '@/components/avatar'
import { useProfileStore } from '@/lib/profile'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import type { Profile } from '@/lib/profile'

// Lazy load heavy avatar components - Only when user interacts
const AvatarManager = dynamic(
    () => import('@/components/avatar').then(mod => ({ default: mod.AvatarManager })),
    {
        loading: () => <div className="h-10 w-32 bg-muted animate-pulse rounded" />,
        ssr: false  // Don't server-render, load client-side only
    }
)

const AvatarGenerator = dynamic(
    () => import('@/components/avatar').then(mod => ({ default: mod.AvatarGenerator })),
    {
        loading: () => <div className="h-64 bg-muted animate-pulse rounded" />,
        ssr: false
    }
)

interface AvatarSectionClientProps {
    profile: Profile
}

// Client Component - Interactive features only
export function AvatarSectionClient({ profile }: AvatarSectionClientProps) {
    const [showAvatarDemo, setShowAvatarDemo] = useState(false)
    const { updateCurrentProfile } = useProfileStore()

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Avatar System Demo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Avatar size preview - Minimal client-side rendering */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="text-sm text-muted-foreground">Different sizes:</div>
                    <UserAvatar profile={profile} size="xs" />
                    <UserAvatar profile={profile} size="sm" />
                    <UserAvatar profile={profile} size="md" />
                    <UserAvatar profile={profile} size="lg" />
                    <UserAvatar profile={profile} size="xl" />
                </div>

                {/* Interactive controls */}
                <div className="flex flex-wrap gap-4">
                    {/* AvatarManager loads immediately (but is lazy-loaded) */}
                    <AvatarManager
                        profile={profile}
                        onAvatarUpdate={(avatar) => {
                            toast.success('Avatar updated!')
                        }}
                    />

                    {/* Toggle button for generator */}
                    <Button
                        variant="outline"
                        onClick={() => setShowAvatarDemo(!showAvatarDemo)}
                        className="flex items-center gap-2"
                    >
                        <Shuffle className="h-4 w-4" />
                        {showAvatarDemo ? 'Hide' : 'Show'} Avatar Options
                    </Button>
                </div>

                {/* AvatarGenerator only loads when button is clicked */}
                {showAvatarDemo && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium">Avatar Generator</h4>
                        <AvatarGenerator
                            onGenerate={async (avatar) => {
                                const success = await updateCurrentProfile({
                                    avatar_url: avatar
                                })
                                if (success) {
                                    toast.success('Avatar updated successfully!')
                                } else {
                                    toast.error('Failed to update avatar')
                                }
                            }}
                            onCancel={() => setShowAvatarDemo(false)}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
