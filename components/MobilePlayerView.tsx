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
  const [scrollDistance, setScrollDistance] = useState(0);
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
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for changes to data-theme attribute
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
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

  // Check if text overflows and calculate scroll distance
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflow);
        if (isOverflow) {
          // Calculate how much to scroll (difference between scroll width and client width)
          setScrollDistance(textRef.current.scrollWidth - textRef.current.clientWidth);
        }
      }
    };

    // Use setTimeout to ensure the text has been rendered with the new content
    const timer = setTimeout(checkOverflow, 100);

    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
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

      <div className="fixed bottom-[100px] left-0 right-0 z-20 px-[16px]">
        {/* Album Cover + Vinyl Container - Aligned to right margin */}
        <motion.div
          className="relative w-[145px] h-[116px] mb-[20px] ml-auto cursor-pointer"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onClick={onTogglePlayback}
          onDragEnd={(_event, info) => {
            const swipeThreshold = 50; // Minimum distance in pixels to trigger track change
            const velocity = info.velocity.x;
            const offset = info.offset.x;

            // Swipe left (next track) - need significant distance or velocity
            if (offset < -swipeThreshold || velocity < -500) {
              const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
              const nextIndex = (currentIndex + 1) % allTracks.length;
              onTrackSelect(nextIndex);
            }
            // Swipe right (previous track) - need significant distance or velocity
            else if (offset > swipeThreshold || velocity > 500) {
              const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
              const prevIndex = currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
              onTrackSelect(prevIndex);
            }
          }}
        >
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
                    {/* Vinyl grooves effect - unique pattern for each track */}
                    <div className="absolute inset-0">
                      {(() => {
                        // Generate unique grooves based on track characteristics
                        const trackIndex = allTracks.findIndex(t => t.id === currentTrack.id);
                        const nameHash = currentTrack.name.length + currentTrack.artists[0].length;

                        // Base pattern scaled for mobile (smaller vinyl)
                        const basePositions = [4, 8, 12, 17, 23, 30, 38, 47, 57, 68];

                        // Modify positions based on track
                        let groovePositions = basePositions.map((pos, i) => {
                          const indexVariation = (trackIndex % 3) * 1.5;
                          const nameVariation = (nameHash % 5) - 2;
                          const posVariation = Math.sin(trackIndex + i) * 2;
                          return Math.max(3, Math.min(72, pos + indexVariation + nameVariation + posVariation));
                        });

                        // Sort and enforce minimum separation
                        groovePositions.sort((a, b) => a - b);
                        const MINIMUM_SEPARATION = 3.5;
                        const finalGrooves = [];
                        let lastPosition = -MINIMUM_SEPARATION;

                        for (const position of groovePositions) {
                          if (position - lastPosition >= MINIMUM_SEPARATION) {
                            finalGrooves.push(position);
                            lastPosition = position;
                          }
                        }

                        return finalGrooves.map((position, i) => (
                          <div
                            key={`${currentTrack.id}-groove-${i}`}
                            className="absolute rounded-full border"
                            style={{
                              left: `${position}%`,
                              top: `${position}%`,
                              right: `${position}%`,
                              bottom: `${position}%`,
                              borderColor: isDarkMode ? '#d1d5db' : '#4b5563',
                              opacity: 0.25 + (Math.sin(i * 0.5 + trackIndex) * 0.1)
                            }}
                          />
                        ));
                      })()}
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
              className="absolute left-[39.5px] top-[5.3px] w-[105.5px] h-[105.5px] z-10 shadow-2xl pointer-events-none"
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
        </motion.div>

        {/* Track Info + Controls - Track name | EQ (aligned with album left edge) | Controllers */}
        <div className="flex items-center gap-[10px]">
          <div className="overflow-hidden flex-1 min-w-0">
            <motion.p
              key={`${currentTrack.id}-info`}
              initial={{ opacity: 0, x: 0 }}
              animate={
                isOverflowing && scrollDistance > 0
                  ? {
                      opacity: 1,
                      x: [0, 0, -scrollDistance, -scrollDistance, 0],
                    }
                  : { opacity: 1, x: 0 }
              }
              transition={
                isOverflowing
                  ? {
                      opacity: { duration: 0.3, delay: 0.1 },
                      x: {
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.15, 0.5, 0.65, 1]
                      }
                    }
                  : { duration: 0.3, delay: 0.1 }
              }
              ref={textRef}
              className="text-[16px] font-medium leading-[1.5] whitespace-nowrap"
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
