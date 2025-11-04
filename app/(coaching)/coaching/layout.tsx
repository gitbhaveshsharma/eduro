import { Metadata } from "next";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

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
        // Enable search in header for coaching page
        >
            {children}
        </ConditionalLayout>
    );
}
