import type { Metadata } from 'next'
import localFont from "next/font/local";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import { ThemeProvider } from "@/components/ThemeProvider";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: 'Joel Colombo ✦ Creative Director',
  description: 'Joel Colombo ✦ Creative Director',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    title: 'Joel Colombo ✦ Creative Director',
    description: 'Joel Colombo ✦ Creative Director',
    images: [
      {
        url: '/images/og-joelcolombo-landing.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
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