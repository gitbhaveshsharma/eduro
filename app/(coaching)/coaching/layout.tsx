"use client"
import { useState } from "react";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CoachingFilterPanelProvider } from "@/components/coaching/search/coaching-filter-panel-context";
import { PermissionGuard } from "@/components/permissions";
import { LOCATION_PERMISSION } from "@/lib/permissions";

export default function CoachingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <CoachingFilterPanelProvider>
            <PermissionGuard
                permissions={[{
                    ...LOCATION_PERMISSION,
                    required: false,
                    autoRequest: true,
                }]}
                strategy="all"
                autoRequest
                strictMode={false}
                showLoading={false}
                onAllGranted={() => setIsLoading(false)}
                onDenied={() => setIsLoading(false)}
            >
                {isLoading ? (
                    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
                        <LoadingSpinner
                            title="Discover Best Coaching"
                            message="Loading coaching marketplace..."
                            size="lg"
                        />

                    </div>
                ) : (
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
                )}
            </PermissionGuard>
        </CoachingFilterPanelProvider>
    );
}
