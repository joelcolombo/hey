"use client";

import { useEffect, useRef, useState } from 'react';
import type { SyncedLyrics } from '@/types/playlist';

interface LyricsDisplayProps {
  lyrics: SyncedLyrics | null;
  currentPosition: number; // milliseconds
}

export default function LyricsDisplay({ lyrics, currentPosition }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);

  useEffect(() => {
    if (!lyrics || lyrics.lines.length === 0) {
      setActiveLineIndex(-1);
      return;
    }

    // Find the current active line based on position
    let currentIndex = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (currentPosition >= lyrics.lines[i].timestamp) {
        currentIndex = i;
      } else {
        break;
      }
    }

    setActiveLineIndex(currentIndex);
  }, [lyrics, currentPosition]);

  useEffect(() => {
    // Auto-scroll to active line
    if (activeLineIndex >= 0 && containerRef.current) {
      const activeLine = containerRef.current.querySelector(`[data-line-index="${activeLineIndex}"]`);
      if (activeLine) {
        activeLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
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
    <div
      ref={containerRef}
      className="h-full overflow-y-auto pl-[20px] pr-[20px] max-md:px-[3%]"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {lyrics.lines.map((line, index) => (
        <p
          key={index}
          data-line-index={index}
          className={`
            text-left font-normal text-[80px] leading-[1.2em] mb-[40px] transition-colors duration-300
            max-md:text-[2em] max-md:leading-[1.3em] max-md:mb-[20px]
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
    </div>
  );
}
