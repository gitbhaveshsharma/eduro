import React from "react";
import { ConditionalLayout } from "@/components/layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Discussions - Eduro",
    description: "Join discussions on various topics in the Eduro community.",
    generator: "Next.js",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div >
            <ConditionalLayout platform="community">
                {children}
            </ConditionalLayout>
        </div>
    );
}
