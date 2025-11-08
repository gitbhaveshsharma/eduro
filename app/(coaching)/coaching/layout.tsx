import { Metadata } from "next";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { CoachingFilterPanelProvider } from "@/components/coaching/search/coaching-filter-panel-context";

export const metadata: Metadata = {
    title: "Coaching | Eduro",
    description: "Access coaching resources and support for your learning journey",
};

export default function CoachingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CoachingFilterPanelProvider>
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
        </CoachingFilterPanelProvider>
    );
}
