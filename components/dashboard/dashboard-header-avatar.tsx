'use client'

import { AvatarManager } from '@/components/avatar'
import { useProfileStore } from '@/lib/profile'
import { toast } from 'sonner'
import type { Profile } from '@/lib/profile'

interface DashboardHeaderAvatarProps {
  profile: Profile
}

export function DashboardHeaderAvatar({ profile }: DashboardHeaderAvatarProps) {
  const updateCurrentProfile = useProfileStore(state => state.updateCurrentProfile)

  return (
    <AvatarManager
      profile={profile}
      size="2xl"
      className="rounded-full"
      showOnlineStatus={true}
      onAvatarUpdate={async (avatar) => {
        const success = await updateCurrentProfile({ avatar_url: avatar })
        if (success) toast.success('Avatar updated!')
        else toast.error('Failed to update avatar')
      }}
    />
  )
}
