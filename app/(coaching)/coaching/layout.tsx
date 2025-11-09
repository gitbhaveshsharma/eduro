'use client';

import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { CoachingFilterPanelProvider } from "@/components/coaching/search/coaching-filter-panel-context";
import { PermissionGuard } from "@/components/permissions";
import { LOCATION_PERMISSION } from "@/lib/permissions";

export default function CoachingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CoachingFilterPanelProvider>
            <PermissionGuard
                permissions={[{
                    ...LOCATION_PERMISSION,
                    required: false,
                    autoRequest: true,
                }]}
                strategy="all"
                autoRequest={true}
                strictMode={false}

                showLoading={false}
                onAllGranted={() => {
                    // console.log('✅ [COACHING LAYOUT] Location permission granted for coaching discovery');
                }}
            >
                <ConditionalLayout
                    forceConfig={{
                        page: 'coaching',
                        headerType: 'universal',
                        title: 'Coaching',
                        sidebar: {
                            enabled: false,
                            defaultOpen: false,
                        },
                    }}
                >
                    {children}
                </ConditionalLayout>
            </PermissionGuard>
        </CoachingFilterPanelProvider>
    );
}
