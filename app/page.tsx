import Script from 'next/script';
import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  // You can fetch data here if needed
  return {
    title: 'Dynamic Page Title',
    // ... other metadata
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
          <img className="logo" src='https://joelcolombo.co/images/logo-joelcolombo.gif' alt="Hey!"></img>
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
