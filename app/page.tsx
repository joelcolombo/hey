import Image from 'next/image';
import Footer from '@/components/Footer';
import ProtectedEmailLink from '@/components/ProtectedEmailLink';

export default function Home() {
  return (
    <div className="w-full">
      {/* Logo */}
      <div className="h-[30px] mt-2.5">
        <Image
          className="h-[100px] w-auto mt-5 ml-2.5 [html[data-theme='dark']_&]:invert"
          src="/images/logo-joelcolombo.gif"
          alt="Hey!"
          width={100}
          height={100}
          unoptimized
        />
      </div>

      {/* Spacer */}
      <div className="mt-20" />

      {/* Hero Section */}
      <div className="p-[1%] mx-auto">
        <div className="float-left mb-10">
          <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.5em] max-md:ml-2.5">
            I'm Joel Colombo, a designer turned creative director turned <a href="https://wearemoka.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">agency founder</a> turned <a href="https://linkedin.com/in/joecolombo" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">designer</a> once again.
          </h2>
          <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.5em] max-md:ml-2.5">
          Built to build. Two decades of experience synthesized into business insight and creative execution. Pixels to P&L. Creative vision to team leadership.
          
          Been there, shipped that.
          </h2>
          <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.5em] max-md:ml-2.5">
            Currently pushing my new SaaS toward launch in Q4'25, and taking on select projects with founders and teams to help them bring their vision to life through design, technology & strategy.
          </h2>
          <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.5em] max-md:ml-2.5">
            <ProtectedEmailLink
              mode="mailto"
              text="Let's connect!"
              className="hover:text-[var(--hover-color)] transition-colors"
              subject="Hey there!"
            />
          </h2>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
