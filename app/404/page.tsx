import type { Metadata } from 'next'
import NotFoundClient from '../NotFoundClient'

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.co'),
  title: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape | Joel Colombo',
  description: 'A curated playlist featuring Look by Sébastien Tellier, Gold by Chet Faker, and more. Enjoy this mixtape while you\'re here.',
  openGraph: {
    title: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape',
    description: 'Joel Colombo ✦ Creative Director - A curated playlist for your listening pleasure.',
    url: 'https://joelcolombo.co/404',
    siteName: 'Joel Colombo',
    images: [
      {
        url: 'https://joelcolombo.co/images/og-joelcolombo-404.png',
        width: 1200,
        height: 630,
        alt: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape - Joel Colombo',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sorry you didn\'t find what you were looking for... here\'s a mixtape',
    description: 'Joel Colombo ✦ Creative Director - A curated playlist for your listening pleasure.',
    images: ['https://joelcolombo.co/images/og-joelcolombo-404.png'],
    creator: '@joelcolombo',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function FourOhFourPage() {
  return <NotFoundClient />
}