import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.co'),
  title: 'Joel Colombo ✦ Selected Works 2025',
  description: 'Joel Colombo ✦ Selected Works 2025',
  keywords: ['Joel Colombo', 'Selected Works', 'Portfolio', '2025', 'Creative Director', 'Design', 'UX Design', 'Product Design', 'Case Studies', 'Agency Founder'],
  authors: [{ name: 'Joel Colombo' }],
  creator: 'Joel Colombo',
  openGraph: {
    title: 'Joel Colombo ✦ Creative Director',
    description: 'Presentation with projects that I worked on during the last couple of years',
    url: 'https://joelcolombo.co/sw2025',
    siteName: 'Joel Colombo',
    images: [
      {
        url: '/images/og-joelcolombo-sw2025.png',
        width: 1200,
        height: 630,
        alt: 'Joel Colombo ✦ Creative Director',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joel Colombo ✦ Creative Director',
    description: 'Presentation with projects that I worked on during the last couple of years',
    images: ['/images/og-joelcolombo-sw2025.png'],
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


export default function SelectedWorksPage() {
  redirect('https://www.figma.com/proto/0OOliERdgcD2N6gW8bBzrY/Joel-Colombo-Selected-Works-2025?page-id=0%3A1&node-id=4-193&viewport=3457%2C1296%2C0.5&t=fMzwfl9zwUDwN0AJ-8&scaling=contain&content-scaling=fixed&starting-point-node-id=4%3A193&hotspot-hints=0&hide-ui=1');
}