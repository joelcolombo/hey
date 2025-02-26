import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  // You can fetch data here if needed
  return {
    title: 'Joel Colombo ✦ Selected Works 2025',
    description: 'Joel Colombo ✦ Selected Works 2025',
    icons: {
      icon: '/images/logo.png',
    },
    openGraph: {
      title: 'Joel Colombo ✦ Creative Director & Entrepreneur',
      description: 'Presentation with projects that I worked on during the last couple of years',
      images: [
        {
          url: '/images/og-joelcolombo-sw2025.png',
          width: 1200,
          height: 630,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
  }
}


export default function SelectedWorksPage() {
  redirect('https://www.figma.com/proto/0OOliERdgcD2N6gW8bBzrY/Joel-Colombo-Selected-Works-2025?page-id=0%3A1&node-id=4-193&viewport=3457%2C1296%2C0.5&t=fMzwfl9zwUDwN0AJ-8&scaling=contain&content-scaling=fixed&starting-point-node-id=4%3A193&hotspot-hints=0&hide-ui=1');
}