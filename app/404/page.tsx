import type { Metadata } from 'next'
import NotFoundClient from '../NotFoundClient'

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.co'),
  title: 'Joel Colombo ✦ Sorry you didn\'t find what you were looking for... here\'s a mixtape',
  description: 'Congratulations! You\'ve found a curated selection of songs',
  keywords: ['404', 'Page Not Found', 'Joel Colombo', 'Mixtape', 'Music', 'Playlist', 'Creative Director'],
  authors: [{ name: 'Joel Colombo' }],
  creator: 'Joel Colombo',
  openGraph: {
    title: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape',
    description: 'Congratulations! You\'ve found a curated selection of songs',
    url: 'https://joelcolombo.co/404',
    siteName: 'Joel Colombo',
    images: [
      {
        url: 'https://joelcolombo.co/images/og-joelcolombo-404.png',
        width: 1200,
        height: 630,
        alt: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape',
    description: 'Congratulations! You\'ve found a curated selection of songs',
    images: ['https://joelcolombo.co/images/og-joelcolombo-404.png'],
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

export default function FourOhFourPage() {
  return <NotFoundClient />
}