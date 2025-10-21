"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface PlayProject {
  id: string;
  name: string;
  path: string;
}

export default function PlayPage() {
  const [projects, setProjects] = useState<PlayProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/play-projects');
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="w-full relative">
      {/* Logo */}
      <div className="h-[30px] mt-2.5">
        <Link href="/" className="focus:outline-none">
          <Image
            className="h-[100px] w-auto mt-5 ml-2.5 logo-switch"
            src="/images/logo-joelcolombo.gif"
            alt="Hey!"
            width={100}
            height={100}
            unoptimized
          />
          <Image
            className="h-[100px] w-auto mt-5 ml-2.5 logo-switch-dark"
            src="/images/logo-joelcolombo-dark.gif"
            alt="Hey!"
            width={100}
            height={100}
            unoptimized
          />
        </Link>
      </div>

      {/* Spacer */}
      <div className="mt-20" />

      {/* Play Section */}
      <div className="p-[1%] mx-auto">
        <div className="float-left mb-10">
          <h1 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.2em] max-md:text-[2.3em] max-md:leading-[1.15em] max-md:ml-2.5">
            Play
          </h1>

          <h2 className="text-left font-normal text-[2.5em] leading-[1.1em] mb-[1.5em] max-md:text-[1.5em] max-md:leading-[1.15em] max-md:ml-2.5">
            Interactive experiments, creative coding, and other cool things...
          </h2>

          {/* Projects List */}
          {loading ? (
            <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.3em] max-md:leading-[1.15em] max-md:ml-2.5">
              Loading experiments...
            </h2>
          ) : projects.length > 0 ? (
            <div className="text-left">
              {projects.map((project, index) => (
                <h2
                  key={project.id}
                  className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.3em] max-md:leading-[1.15em] max-md:ml-2.5"
                >
                  <Link
                    href={project.path}
                    className="hover:text-[var(--hover-color)] transition-colors inline-block"
                  >
                    {`${index + 1}. ${project.name}`}
                  </Link>
                </h2>
              ))}
            </div>
          ) : (
            <h2 className="text-left font-normal text-[5em] leading-[1.1em] mb-[0.5em] max-md:text-[2.3em] max-md:leading-[1.15em] max-md:ml-2.5">
              No experiments yet. Check back soon!
            </h2>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}