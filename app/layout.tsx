import type { Metadata } from 'next'
import localFont from "next/font/local";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";

export const metadata: Metadata = {
  title: 'Joel Colombo ✦ Creative Director & Entrepreneur',
  description: 'Joel Colombo ✦ Creative Director & Entrepreneur',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    title: 'Joel Colombo ✦ Creative Director & Entrepreneur',
    description: 'Joel Colombo ✦ Creative Director & Entrepreneur',
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
      <body>
        <SmoothScrolling>{children}</SmoothScrolling>
      </body>
    </html>
  )
}