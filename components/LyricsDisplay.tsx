"use client";

import { useEffect, useRef, useState } from 'react';
import type { SyncedLyrics } from '@/types/playlist';

interface LyricsDisplayProps {
  lyrics: SyncedLyrics | null;
  currentPosition: number; // milliseconds
  offsetMs?: number; // Optional offset to adjust lyrics timing
}

export default function LyricsDisplay({ lyrics, currentPosition, offsetMs = 0 }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);

  useEffect(() => {
    if (!lyrics || lyrics.lines.length === 0) {
      setActiveLineIndex(-1);
      return;
    }

    // Apply offset to current position for comparison
    const adjustedPosition = currentPosition + offsetMs;

    // Find the current active line based on adjusted position
    let currentIndex = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (adjustedPosition >= lyrics.lines[i].timestamp) {
        currentIndex = i;
      } else {
        break;
      }
    }

    setActiveLineIndex(currentIndex);
  }, [lyrics, currentPosition, offsetMs]);

  useEffect(() => {
    // Auto-scroll to keep active line centered (or higher for first line)
    if (activeLineIndex >= 0 && containerRef.current) {
      const activeLine = containerRef.current.querySelector(`[data-line-index="${activeLineIndex}"]`) as HTMLElement;
      if (activeLine) {
        const container = containerRef.current;
        const containerHeight = container.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.offsetHeight;

        // Center the active line vertically
        const scrollTo = lineTop - (containerHeight / 2) + (lineHeight / 2);

        container.scrollTo({
          top: scrollTo,
          behavior: 'smooth',
        });
      }
    }
  }, [activeLineIndex]);

  if (!lyrics || lyrics.lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[2em] text-[var(--hover-color)] max-md:text-[1.5em]">
          No lyrics available for this track
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto pl-[16px] pr-[20px] max-md:pl-[16px] max-md:pr-[16px] flex flex-col"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Top spacer - places first line at vertical center */}
        <div className="min-h-[calc(50vh-60px)] max-md:min-h-[120px]" />

        {lyrics.lines.map((line, index) => (
          <p
            key={index}
            data-line-index={index}
            className={`
              text-left font-normal text-[80px] leading-[1.2em] mb-[40px] transition-colors duration-300
              max-md:text-[32px] max-md:leading-[1.3em] max-md:mb-[16px]
              ${
                index === activeLineIndex
                  ? 'text-[var(--foreground)]'
                  : 'text-[#a0a0a0]'
              }
            `}
            style={{ fontWeight: 400 }}
          >
            {line.text}
          </p>
        ))}

        {/* Bottom spacer to allow last line to center */}
        <div className="min-h-[50vh] max-md:min-h-[200px]" />
      </div>

      {/* Gradient fade at bottom - mobile only */}
      <div
        className="hidden max-md:block pointer-events-none absolute left-0 right-0 h-[120px]"
        style={{
          bottom: '-1px',
          background: 'linear-gradient(to bottom, transparent 0%, var(--background) 85%, var(--background) 100%)'
        }}
      />
    </div>
  );
}
