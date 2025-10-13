import type { Metadata } from 'next'
import localFont from "next/font/local";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import { ThemeProvider } from "@/components/ThemeProvider";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.com'),
  title: 'Joel Colombo ✦ Creative Director & Designer',
  description: 'Designer turned creative director turned agency founder turned designer. Two decades of experience in design, technology & strategy. Available for select projects with founders and teams.',
  keywords: ['Creative Director', 'Designer', 'UX Design', 'Product Design', 'Agency Founder', 'Design Strategy', 'Joel Colombo'],
  authors: [{ name: 'Joel Colombo' }],
  creator: 'Joel Colombo',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    title: 'Joel Colombo ✦ Creative Director & Designer',
    description: 'Designer turned creative director turned agency founder turned designer. Two decades of experience in design, technology & strategy.',
    url: 'https://joelcolombo.com',
    siteName: 'Joel Colombo',
    images: [
      {
        url: '/images/og-joelcolombo-landing.png',
        width: 1200,
        height: 630,
        alt: 'Joel Colombo - Creative Director & Designer',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joel Colombo ✦ Creative Director & Designer',
    description: 'Designer turned creative director turned agency founder turned designer. Two decades of experience in design, technology & strategy.',
    images: ['/images/og-joelcolombo-landing.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '373338395385e3b7',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <link rel="canonical" href="https://joelcolombo.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getCookie(name) {
                  const value = \`; \${document.cookie}\`;
                  const parts = value.split(\`; \${name}=\`);
                  if (parts.length === 2) return parts.pop().split(';').shift();
                }

                const savedTheme = getCookie('theme-preference');

                if (savedTheme) {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } else {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Joel Colombo',
              jobTitle: 'Creative Director & Designer',
              description: 'Designer turned creative director turned agency founder turned designer with two decades of experience.',
              url: 'https://joelcolombo.com',
              sameAs: [
                'https://linkedin.com/in/joecolombo',
                'https://wearemoka.com',
              ],
              knowsAbout: ['Design', 'Creative Direction', 'Product Design', 'UX Design', 'Design Strategy', 'Technology'],
              alumniOf: {
                '@type': 'Organization',
                name: 'Moka',
                url: 'https://wearemoka.com'
              }
            })
          }}
        />
      </head>
      <ThemeProvider>
        <body>
          <Analytics />
          <SmoothScrolling>{children}</SmoothScrolling>
        </body>
      </ThemeProvider>
    </html>
  )
}