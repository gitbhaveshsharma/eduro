import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { CustomToaster } from '@/lib/toast'
import { OnboardingGuard } from '@/components/providers/onboarding-guard'
// NOTE: We intentionally avoid importing the global CSS file here to prevent
// Next.js from inlining a blocking <link rel="stylesheet"> for
// `static/css/app/layout.css`. Instead we add a non-blocking link tag in
// the Head below using the media="print" onload trick to reduce render
// blocking for LCP. If you prefer the default behavior, revert this change.
import Head from 'next/head'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Tutrsy - Learning Platform',
  description: 'Secure learning platform for students, teachers, and coaches',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        {/* Preconnect to important origins to speed up DNS/TCP/TLS and TLS resumption */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossOrigin="" />
        <link rel="preconnect" href="https://gravatar.com" crossOrigin="" />
        <link rel="preconnect" href="https://robohash.org" crossOrigin="" />
        <link rel="preconnect" href="https://ixhlpassuqmqpzpumkuw.supabase.co" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />

        {/* Preload the main font and a likely LCP hero image (replace paths) */}
        <link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/images/network-hero.avif" as="image" />

        {/* Non-blocking global stylesheet. This uses the media="print" onload
              trick to avoid blocking the initial render. Keep a noscript fallback
              so styles still apply when JS is disabled. */}
        <link
          rel="stylesheet"
          href="/static/css/app/layout.css"
          media="print"
          onLoad={(e) => { (e.currentTarget as HTMLLinkElement).media = 'all'; }}
        />
        <noscript>
          <link rel="stylesheet" href="/static/css/app/layout.css" />
        </noscript>
      </Head>

      <body suppressHydrationWarning className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <OnboardingGuard>
              {children}
            </OnboardingGuard>
            <CustomToaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
