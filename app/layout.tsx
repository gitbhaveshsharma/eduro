import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '@/styles/globals.css'
import ClientRoot from './client-root'

export const metadata: Metadata = {
  title: 'Tutrsy - Learning Platform',
  description: 'Secure learning platform for students, teachers, and coaches',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnects */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://gravatar.com" crossOrigin="" />
        <link rel="preconnect" href="https://robohash.org" crossOrigin="" />
        <link rel="preconnect" href="https://ixhlpassuqmqpzpumkuw.supabase.co" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />

        {/* Font preload */}
        {/* <link
          rel="preload"
          href="/fonts/Inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        /> */}

        {/* Likely LCP image */}
        {/* <link rel="preload" href="/images/network-hero.avif" as="image" /> */}
      </head>

      <body
        suppressHydrationWarning
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
      >
        {/* CLIENT SIDE STARTS HERE */}
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
