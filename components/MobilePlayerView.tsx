"use client";

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Equalizer from './Equalizer';
import type { Track } from '@/types/playlist';

interface MobilePlayerViewProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  allTracks: Track[];
  onTrackSelect: (trackIndex: number) => void;
}

export default function MobilePlayerView({
  currentTrack,
  isPlaying,
  onTogglePlayback,
  allTracks,
  onTrackSelect,
}: MobilePlayerViewProps) {
  const albumImage = currentTrack.album.images[0]?.url || '/images/placeholder-album.png';
  const [showVinyl, setShowVinyl] = useState(false);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [canRewind, setCanRewind] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [exitReason, setExitReason] = useState<'track-change' | 'pause'>('track-change');
  const [isTrackChanging, setIsTrackChanging] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const previousTrackIdRef = useRef<string>(currentTrack.id);

  // TIMING CONTROLS - Same as desktop
  const VINYL_EXIT_DELAY = 0;
  const VINYL_ENTER_DELAY = 1200;
  const VINYL_ENTER_DELAY_FIRST_LOAD = 500;
  const ALBUM_EXIT_DELAY = 200;
  const ALBUM_ENTER_DELAY = 0;

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Preload next and previous track images
  useEffect(() => {
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextTrack = allTracks[currentIndex + 1] || allTracks[0];
    const prevTrack = allTracks[currentIndex - 1] || allTracks[allTracks.length - 1];

    [nextTrack, prevTrack].forEach(track => {
      if (track?.album.images[0]?.url) {
        const img = document.createElement('img');
        img.src = track.album.images[0].url;
      }
    });
  }, [currentTrack, allTracks]);

  // Track when user first plays
  useEffect(() => {
    if (isPlaying && !hasEverPlayed) {
      setHasEverPlayed(true);
    }
  }, [isPlaying, hasEverPlayed]);

  // Reset vinyl animation when track changes
  useEffect(() => {
    // Mark that we're in a track change
    setIsTrackChanging(true);
    setExitReason('track-change');

    let hideTimer: NodeJS.Timeout | undefined;
    let showTimer: NodeJS.Timeout | undefined;
    let resetTimer: NodeJS.Timeout | undefined;

    // Hide vinyl immediately on track change
    hideTimer = setTimeout(() => {
      setShowVinyl(false);
    }, VINYL_EXIT_DELAY);

    // Show vinyl after album enters and settles, but only if user has played at least once
    if (hasEverPlayed) {
      const baseDelay = isFirstLoad ? VINYL_ENTER_DELAY_FIRST_LOAD : VINYL_ENTER_DELAY;
      // If paused, add extra delay so disc appears AFTER album cover
      const showDelay = isPlaying ? baseDelay : baseDelay + 800;

      showTimer = setTimeout(() => {
        setShowVinyl(true);
        setIsFirstLoad(false);
        // Mark track change as complete after vinyl shows
        setIsTrackChanging(false);
      }, showDelay);
    } else {
      // If never played, mark track change as complete immediately
      resetTimer = setTimeout(() => {
        setIsTrackChanging(false);
      }, 100);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (showTimer) clearTimeout(showTimer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [currentTrack.id, VINYL_EXIT_DELAY, VINYL_ENTER_DELAY, VINYL_ENTER_DELAY_FIRST_LOAD, isFirstLoad, hasEverPlayed, isPlaying]);

  // Hide vinyl when paused, show when playing
  useEffect(() => {
    // Don't interfere during track changes
    if (isTrackChanging) return;

    if (!isPlaying) {
      const timer = setTimeout(() => {
        setExitReason('pause');
        setShowVinyl(false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isFirstLoad && hasEverPlayed) {
      const timer = setTimeout(() => {
        setShowVinyl(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFirstLoad, hasEverPlayed, isTrackChanging]);

  // Enable rewind when user changes track
  useEffect(() => {
    if (previousTrackIdRef.current !== currentTrack.id) {
      setCanRewind(true);
      previousTrackIdRef.current = currentTrack.id;
    }
  }, [currentTrack.id]);

  // Check if text overflows
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [currentTrack.name, currentTrack.artists]);

  const songText = `${currentTrack.name} – ${currentTrack.artists[0]}`;

  const handleNextTrack = () => {
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    onTrackSelect(nextIndex);
  };

  const handlePreviousTrack = () => {
    if (!canRewind) return;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
    onTrackSelect(prevIndex);
  };

  return (
    <>
      {/* Horizontal divider line above footer */}
      <div className="fixed bottom-[80px] left-0 right-0 z-20">
        <div className="w-full h-[1px] bg-[var(--foreground)] opacity-5" />
      </div>

      <div className="fixed bottom-[100px] left-0 right-0 z-20 px-[20px]">
        {/* Album Cover + Vinyl Container - Aligned to right margin */}
        <div className="relative w-[145px] h-[116px] mb-[20px] ml-auto">
          {/* Vinyl clip container - Clips at album cover edge */}
          <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: '39.5px' }}>
            {/* Vinyl Record - Behind - Slides in/out with album changes */}
            <AnimatePresence>
              {showVinyl && (
                  <motion.div
                    initial={{ x: 31.5 }}
                    animate={{
                      x: 0,
                      transition: { duration: 0.5, ease: "backInOut" }
                    }}
                    exit={{
                      x: 31.5,
                      transition: exitReason === 'pause'
                        ? { duration: 0.6, ease: "easeInOut" }
                        : { duration: 0.1, ease: "backOut" }
                    }}
                    className="absolute left-[8px] top-[8px] w-[100px] h-[100px] z-0"
                  >
                  <div
                    className="w-full h-full rounded-full relative"
                    style={{
                      background: isDarkMode
                        ? 'linear-gradient(to bottom right, #f3f4f6, #ffffff)'
                        : 'linear-gradient(to bottom right, #111827, #000000)'
                    }}
                  >
                    {/* Vinyl grooves effect */}
                    <div className="absolute inset-0 opacity-30">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full border"
                          style={{
                            left: `${i * 2}%`,
                            top: `${i * 2}%`,
                            right: `${i * 2}%`,
                            bottom: `${i * 2}%`,
                            borderColor: isDarkMode ? '#d1d5db' : '#374151'
                          }}
                        />
                      ))}
                    </div>
                    {/* Center label */}
                    <div
                      className="absolute inset-[40%] rounded-full"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(to bottom right, #d97706, #92400e)'
                          : 'linear-gradient(to bottom right, #78350f, #451a03)'
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Album Cover - In front - No clipping */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrack.id}
              initial={{ x: 150, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                transition: { duration: 0.5, ease: "backIn", delay: ALBUM_ENTER_DELAY / 1000 }
              }}
              exit={{
                x: 150,
                opacity: 0,
                transition: { duration: 0.5, ease: "backOut", delay: ALBUM_EXIT_DELAY / 1000 }
              }}
              className="absolute left-[39.5px] top-[5.3px] w-[105.5px] h-[105.5px] z-10 cursor-pointer shadow-2xl"
              onClick={onTogglePlayback}
            >
              <Image
                src={albumImage}
                alt={`${currentTrack.album.name} by ${currentTrack.artists[0]}`}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Track Info + Controls - Track name | EQ (aligned with album left edge) | Controllers */}
        <div className="flex items-center gap-[10px]">
          <div className="overflow-hidden flex-1 min-w-0">
            <motion.p
              key={`${currentTrack.id}-info`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              ref={textRef}
              className={`text-[16px] font-medium leading-[1.5] whitespace-nowrap ${
                isOverflowing ? 'animate-scroll-text' : ''
              }`}
              style={{ fontWeight: 500 }}
            >
              {songText}
            </motion.p>
          </div>
          {/* Right side container: 145px width to match album container */}
          <div className="w-[145px] flex items-center justify-between">
            {/* EQ aligned at 39.5px from left (matching album left edge) */}
            <div style={{ marginLeft: '39.5px' }} onClick={onTogglePlayback} className="cursor-pointer flex-shrink-0">
              <Equalizer isPlaying={isPlaying} />
            </div>
            <div className="flex items-center gap-[10px]">
              {/* RW Icon - disabled until user changes track */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                onClick={handlePreviousTrack}
                className={canRewind ? "cursor-pointer" : "opacity-30 cursor-not-allowed"}
              >
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <polygon points="9 20 -1 12 9 4 9 20"></polygon>
              </svg>
              {/* FF Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                onClick={handleNextTrack}
                className="cursor-pointer"
              >
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <polygon points="15 4 25 12 15 20 15 4"></polygon>
              </svg>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll-text {
            0%, 20% {
              transform: translateX(0);
            }
            45%, 75% {
              transform: translateX(calc(-100% + 100vw - 40px - 145px - 20px));
            }
            100% {
              transform: translateX(0);
            }
          }

          .animate-scroll-text {
            animation: scroll-text 8s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
}
