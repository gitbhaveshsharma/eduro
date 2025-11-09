# 🚀 Browser Permission System - Quick Start Guide

## 🎯 Common Use Cases

### 1. Location Permission for Coaching Pages

```tsx
// app/coaching/layout.tsx
"use client";

import { PermissionGuard } from "@/components/permissions";
import { LOCATION_PERMISSION } from "@/lib/permissions";

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGuard
      permissions={[
        {
          ...LOCATION_PERMISSION,
          requestMessage: "Enable location to find coaching centers near you",
        },
      ]}
      strategy="all"
      autoRequest={false}
    >
      {children}
    </PermissionGuard>
  );
}
```

### 2. Notification Toggle in Settings

```tsx
// components/settings/notification-toggle.tsx
"use client";

import { usePermission } from "@/hooks/use-browser-permission";
import { BrowserPermissionType } from "@/lib/permissions";
import { Switch } from "@/components/ui/switch";

export function NotificationToggle() {
  const { isGranted, request, isRequesting } = usePermission(
    BrowserPermissionType.NOTIFICATIONS
  );

  return (
    <div className="flex items-center justify-between">
      <div>
        <h4>Push Notifications</h4>
        <p className="text-sm text-muted-foreground">
          Receive updates and alerts
        </p>
      </div>
      <Switch
        checked={isGranted}
        onCheckedChange={request}
        disabled={isRequesting}
      />
    </div>
  );
}
```

### 3. Location-Based Feature Hook

```tsx
// hooks/use-nearby-coaches.ts
"use client";

import { useEffect, useState } from "react";
import { usePermission } from "@/hooks/use-browser-permission";
import { BrowserPermissionType } from "@/lib/permissions";

export function useNearbyCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);

  const location = usePermission(BrowserPermissionType.GEOLOCATION, {
    recheckOnMount: true,
    onGranted: async () => {
      setLoading(true);
      try {
        // Get user location
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );

        // Fetch nearby coaches
        const response = await fetch("/api/coaches/nearby", {
          method: "POST",
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        });

        const data = await response.json();
        setCoaches(data.coaches);
      } finally {
        setLoading(false);
      }
    },
  });

  return {
    coaches,
    loading,
    hasPermission: location.isGranted,
    requestPermission: location.request,
    isRequesting: location.isRequesting,
  };
}

// Usage in component:
function CoachingList() {
  const { coaches, loading, hasPermission, requestPermission } =
    useNearbyCoaches();

  if (!hasPermission) {
    return <button onClick={requestPermission}>Find Nearby Coaches</button>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {coaches.map((coach) => (
        <CoachCard key={coach.id} coach={coach} />
      ))}
    </div>
  );
}
```

### 4. Video Call Component

```tsx
// components/video-call/video-call.tsx
"use client";

import { withPermissionGuard } from "@/components/permissions";
import { PERMISSION_PRESETS } from "@/lib/permissions";

function VideoCallComponent() {
  // Camera and microphone are guaranteed to be available here
  return (
    <div>
      <video id="local-stream" />
      <video id="remote-stream" />
      <button>End Call</button>
    </div>
  );
}

// Automatically requests camera and microphone permissions
export default withPermissionGuard(VideoCallComponent, {
  permissions: PERMISSION_PRESETS.VIDEO_CALL,
  strategy: "all",
  combinedPrompt: true,
  autoRequest: false,
});
```

### 5. Share Button with Clipboard

```tsx
// components/share-button.tsx
"use client";

import { PermissionGate } from "@/components/permissions";
import { BrowserPermissionType } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export function ShareButton({ url }: { url: string }) {
  const handleShare = async () => {
    await navigator.clipboard.writeText(url);
    // Show toast
  };

  return (
    <PermissionGate
      type={BrowserPermissionType.CLIPBOARD_WRITE}
      autoRequest={false}
      showPrompt={false}
      fallback={
        <Button disabled variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share (requires clipboard access)
        </Button>
      }
    >
      <Button onClick={handleShare} variant="outline">
        <Share2 className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
    </PermissionGate>
  );
}
```

### 6. Network Page with Location

```tsx
// app/network/layout.tsx
'use client';

import { PermissionProvider } from '@/lib/permissions';
import { BrowserPermissionType } from '@/lib/permissions';

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider
      initialPermissions={[BrowserPermissionType.GEOLOCATION]}
      watchChanges={true}
    >
      {children}
    </PermissionProvider>
  );
}

// Then in any child component:
import { usePermissionContext } from '@/lib/permissions';

function NearbyUsers() {
  const { isGranted, request } = usePermissionContext();
  const hasLocation = isGranted(BrowserPermissionType.GEOLOCATION);

  if (!hasLocation) {
    return <button onClick={() => request({...})}>Show nearby users</button>;
  }

  return <UserList />;
}
```

### 7. Conditional Feature Rendering

```tsx
// components/features/location-aware.tsx
"use client";

import { usePermission } from "@/hooks/use-browser-permission";
import { BrowserPermissionType } from "@/lib/permissions";
import { PermissionBanner } from "@/components/permissions";

export function LocationAwareFeature() {
  const location = usePermission(BrowserPermissionType.GEOLOCATION, {
    recheckOnMount: true,
  });

  return (
    <div>
      {/* Base feature works without location */}
      <AllCoachingCenters />

      {/* Enhanced feature when permission granted */}
      {location.isGranted && (
        <div className="mt-4">
          <h3>🎯 Near You</h3>
          <NearbyCoachingCenters />
        </div>
      )}

      {/* Show banner to enable */}
      {location.isPrompt && (
        <PermissionBanner
          config={{
            type: BrowserPermissionType.GEOLOCATION,
            requestMessage: "Enable location to see coaching centers near you",
          }}
          onRequest={location.request}
          isRequesting={location.isRequesting}
        />
      )}
    </div>
  );
}
```

### 8. Multiple Permissions with States

```tsx
// components/media/media-setup.tsx
"use client";

import { usePermissions } from "@/hooks/use-browser-permission";
import { BrowserPermissionType } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Circle } from "lucide-react";

export function MediaSetup() {
  const { states, allGranted, requestAll, request, isRequesting } =
    usePermissions([
      { type: BrowserPermissionType.CAMERA, required: true },
      { type: BrowserPermissionType.MICROPHONE, required: true },
    ]);

  const getIcon = (state: string) => {
    switch (state) {
      case "granted":
        return <CheckCircle2 className="text-green-500" />;
      case "denied":
        return <XCircle className="text-red-500" />;
      default:
        return <Circle className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2>Setup Your Media</h2>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 border rounded">
          {getIcon(states.get(BrowserPermissionType.CAMERA) || "prompt")}
          <span>Camera</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => request(BrowserPermissionType.CAMERA)}
            className="ml-auto"
          >
            {states.get(BrowserPermissionType.CAMERA) === "granted"
              ? "Granted"
              : "Grant"}
          </Button>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded">
          {getIcon(states.get(BrowserPermissionType.MICROPHONE) || "prompt")}
          <span>Microphone</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => request(BrowserPermissionType.MICROPHONE)}
            className="ml-auto"
          >
            {states.get(BrowserPermissionType.MICROPHONE) === "granted"
              ? "Granted"
              : "Grant"}
          </Button>
        </div>
      </div>

      <Button
        onClick={requestAll}
        disabled={isRequesting || allGranted}
        className="w-full"
      >
        {allGranted ? "All Permissions Granted ✓" : "Grant All Permissions"}
      </Button>
    </div>
  );
}
```

## 🎨 Styling Tips

### Custom Permission Card

```tsx
import { PermissionPrompt } from "@/components/permissions";

<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <PermissionPrompt
    config={LOCATION_PERMISSION}
    onRequest={handleRequest}
    onCancel={handleCancel}
  />
</div>;
```

### Inline Banner Style

```tsx
import { PermissionBanner } from "@/components/permissions";

<div className="mb-4">
  <PermissionBanner
    config={config}
    onRequest={request}
    onDismiss={() => setShowBanner(false)}
  />
</div>;
```

## ⚡ Performance Tips

1. **Use Permission Gate for Optional Features**

```tsx
<PermissionGate type={BrowserPermissionType.CLIPBOARD_WRITE} showPrompt={false}>
  <ShareButton />
</PermissionGate>
```

2. **Cache Permission Checks**

```tsx
const location = usePermission(BrowserPermissionType.GEOLOCATION, {
  cache: true,
  cacheDuration: 10 * 60 * 1000, // 10 minutes
});
```

3. **Progressive Enhancement**

```tsx
// Show basic version, enhance when permission granted
<BaseFeature />;
{
  isGranted && <EnhancedFeature />;
}
```

## 🔥 Pro Tips

1. **Never auto-request on page load** - Always user-initiated
2. **Provide clear context** - Explain WHY you need the permission
3. **Handle denied gracefully** - Offer alternatives or manual input
4. **Test in different browsers** - Chrome, Firefox, Safari behave differently
5. **HTTPS required** - Many permissions don't work on HTTP
6. **User gesture required** - Permission requests must be triggered by user action

## 📦 Import Cheat Sheet

```tsx
// Hooks
import { usePermission, usePermissions } from "@/hooks/use-browser-permission";

// Components
import {
  PermissionGuard,
  PermissionGate,
  withPermissionGuard,
} from "@/components/permissions";

// UI
import {
  PermissionPrompt,
  PermissionBanner,
  PermissionDenied,
} from "@/components/permissions";

// Types & Presets
import {
  BrowserPermissionType,
  LOCATION_PERMISSION,
  NOTIFICATION_PERMISSION,
  PERMISSION_PRESETS,
} from "@/lib/permissions";

// Context
import { usePermissionContext, PermissionProvider } from "@/lib/permissions";

// Manager (advanced)
import { permissionManager } from "@/lib/permissions";
```

---

Happy coding! 🎉
