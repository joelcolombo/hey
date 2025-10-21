import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.co'),
  title: 'Joel Colombo ✦ Play',
  description: 'Interactive experiments, creative coding, and other cool things by Joel Colombo',
  keywords: ['Joel Colombo', 'Creative Director', 'Interactive Design', 'Creative Coding', 'Web Experiments', 'Play', 'Games', 'Three.js', 'WebGL'],
  authors: [{ name: 'Joel Colombo' }],
  creator: 'Joel Colombo',
  openGraph: {
    title: 'Joel Colombo ✦ Play',
    description: 'Interactive experiments, creative coding, and other cool things',
    url: 'https://joelcolombo.co/play',
    siteName: 'Joel Colombo',
    images: [
      {
        url: 'https://joelcolombo.co/images/og-joelcolombo-play.png',
        width: 1200,
        height: 630,
        alt: 'Joel Colombo ✦ Play - Interactive Experiments',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joel Colombo ✦ Play',
    description: 'Interactive experiments, creative coding, and other cool things',
    images: ['https://joelcolombo.co/images/og-joelcolombo-play.png'],
    creator: '@joelcolombo',
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
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}