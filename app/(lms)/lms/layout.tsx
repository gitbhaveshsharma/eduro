// create layout.tsx  simple file
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "LMS - Tutrsy",
    description: "Manage your learning centers and courses with Tutrsy LMS.",
    generator: "Next.js",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            {children}
        </div>
    );
}