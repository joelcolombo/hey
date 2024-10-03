import Script from 'next/script';
import Image from 'next/image';
import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  // You can fetch data here if needed
  return {
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
}

export default function Home() {
  return (
    <>
    {/* Google Analytics Script */}
    <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-SCG98HD2W5"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
           window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SCG98HD2W5');
        `}
      </Script>

      {/* Microsoft Clarity Script */}
      <Script id="clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "mm8ouutn81");
        `}
      </Script>

  {/* Page content */}
    <div className="container">
        <div className="top">
          <Image 
            className="logo" 
            src="/images/logo-joelcolombo.gif" 
            alt="Hey!" 
            width={100}
            height={100}
          />
        </div>

        <div className="hr"></div>

        <div className="hero">
          <div className="title"><h1>Joel Colombo<br></br>Creative Director & Entrepreneur</h1></div>
        </div>

        <div className="footer">
          <div className="social"><h6><a href="https://linkedin.com/in/joecolombo">LinkedIn</a></h6></div>
          <div className="social"><h6><a href="mailto:hey@joelcolombo.co?Subject=Hey%20there!">Email</a></h6></div>
          <div className="social"><h6><a href="https://cal.com/joelcolombo">Calendar</a></h6></div>
          <div className="year"><h6>© 2024</h6></div>
        </div>
      </div>
    </>
  );
}
