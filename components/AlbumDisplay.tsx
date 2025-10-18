"use client";

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Equalizer from './Equalizer';
import type { Track } from '@/types/playlist';

interface AlbumDisplayProps {
  currentTrack: Track;
  previousTracks: Track[];
  upcomingTracks: Track[];
  isPlaying: boolean;
  onTrackSelect: (trackIndex: number) => void;
  onTogglePlayback: () => void;
  allTracks: Track[];
}

export default function AlbumDisplay({
  currentTrack,
  previousTracks,
  upcomingTracks,
  isPlaying,
  onTrackSelect,
  onTogglePlayback,
  allTracks,
}: AlbumDisplayProps) {
  const albumImage = currentTrack.album.images[0]?.url || '/images/placeholder-album.png';
  const [showVinyl, setShowVinyl] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [exitReason, setExitReason] = useState<'track-change' | 'pause'>('track-change');
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const [isHoveringAlbum, setIsHoveringAlbum] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTrackChanging, setIsTrackChanging] = useState(false);

  // TIMING CONTROLS - Adjust these values to control when animations happen
  const VINYL_EXIT_DELAY = 0; // Delay before vinyl starts hiding (milliseconds)
  const VINYL_ENTER_DELAY = 1200; // Delay before vinyl starts appearing after album enters (milliseconds)
  const VINYL_ENTER_DELAY_FIRST_LOAD = 500; // Delay for first load only (milliseconds)
  const ALBUM_EXIT_DELAY = 200; // Delay before album starts exiting (milliseconds)
  const ALBUM_ENTER_DELAY = 0; // Delay before album starts entering (milliseconds)

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

  // Preload next and previous track images for instant transitions
  useEffect(() => {
    // Get next and previous tracks
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextTrack = allTracks[currentIndex + 1] || allTracks[0]; // Loop to first
    const prevTrack = allTracks[currentIndex - 1] || allTracks[allTracks.length - 1]; // Loop to last

    // Preload images using browser's native Image constructor
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
      // Only use 'pause' exit if we're on the same track (not during track change)
      // Track change effect will handle its own exit reason
      const timer = setTimeout(() => {
        setExitReason('pause');
        setShowVinyl(false);
      }, 50); // Small delay to let track change effect take precedence
      return () => clearTimeout(timer);
    } else if (!isFirstLoad && hasEverPlayed) {
      // Only show vinyl if not first load (first load is handled by track change effect)
      const timer = setTimeout(() => {
        setShowVinyl(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFirstLoad, hasEverPlayed, isTrackChanging]);

  return (
    <div className="h-full flex flex-col items-end justify-between pt-[11px] pr-[16px] pb-[11px] max-md:pr-[3%]">
      {/* Previous Tracks - Fixed height container with absolute positioning */}
      <div
        className="relative text-right"
        style={{ height: '56px' }}
      >
        <AnimatePresence initial={false}>
          {previousTracks.slice(-2).map((track, index) => {
            const trackIndex = allTracks.findIndex(t => t.id === track.id);
            // index 0 = older/further track (lighter), index 1 = most recent (darker)
            // 28px = 16px font-size * 1.5 line-height (24px) + 4px gap
            const topPosition = index === 0 ? 0 : 28;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, top: topPosition }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, top: { duration: 0.3, ease: 'easeInOut' } }}
                onClick={() => onTrackSelect(trackIndex)}
                className="absolute right-0 text-[16px] font-normal leading-normal whitespace-nowrap max-md:text-[0.75em] cursor-pointer hover:!text-[var(--foreground)] transition-colors"
                style={{
                  color: index === 0 ? '#d0d0d0' : '#a0a0a0',
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}
              >
                {track.name} – {track.artists[0]}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Album Cover + Vinyl - Centered in available space */}
      <div className="flex flex-col gap-[7px] items-end w-[434px] max-md:w-full flex-shrink-0">
        <div className="relative w-[434px] h-[348px] max-md:w-full max-md:h-auto max-md:aspect-[434/348]">
          {/* Vinyl clip container - Clips at album cover edge */}
          <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: '118px' }}>
            {/* Vinyl Record - Behind - Slides in/out with album changes */}
            <AnimatePresence>
              {showVinyl && (
                <motion.div
                  initial={{ x: 134 }}
                  animate={{
                    x: 0,
                    transition: { duration: 0.5, ease: "backInOut" }
                  }}
                  exit={{
                    x: 134,
                    transition: exitReason === 'pause'
                      ? { duration: 0.6, ease: "easeInOut" }
                      : { duration: 0.1, ease: "backOut" }
                  }}
                  className="absolute left-[24px] top-[24px] w-[300px] h-[300px]"
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

                        // Create a simple hash from track name for additional variation
                        const nameHash = currentTrack.name.length + currentTrack.artists[0].length;

                        // Base pattern that gets modified
                        const basePositions = [3, 6, 9, 12, 16, 21, 27, 34, 42, 51, 61, 72];

                        // Modify positions based on track index and name
                        let groovePositions = basePositions.map((pos, i) => {
                          // Add variation based on track position in playlist
                          const indexVariation = (trackIndex % 3) * 2;
                          // Add variation based on name length
                          const nameVariation = (nameHash % 5) - 2;
                          // Add some pseudo-randomness based on position
                          const posVariation = Math.sin(trackIndex + i) * 3;

                          return Math.max(2, Math.min(75, pos + indexVariation + nameVariation + posVariation));
                        });

                        // Sort positions to ensure they're in order
                        groovePositions.sort((a, b) => a - b);

                        // Enforce minimum separation between grooves (at least 2.5% apart)
                        const MINIMUM_SEPARATION = 2.5;
                        const finalGrooves = [];
                        let lastPosition = -MINIMUM_SEPARATION;

                        for (const position of groovePositions) {
                          if (position - lastPosition >= MINIMUM_SEPARATION) {
                            finalGrooves.push(position);
                            lastPosition = position;
                          }
                        }

                        // Adjust number of grooves based on track duration
                        const durationFactor = currentTrack.duration_ms / 300000; // normalized around 5 min
                        const targetGrooves = Math.round(12 * durationFactor);
                        const limitedGrooves = finalGrooves.slice(0, Math.max(8, Math.min(16, targetGrooves)));

                        return limitedGrooves.map((position, i) => (
                          <div
                            key={`${currentTrack.id}-${i}`}
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
          <AnimatePresence initial={false}>
            <motion.div
              key={currentTrack.id}
              initial={{ x: 500, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                transition: { duration: 0.5, ease: "backIn", delay: ALBUM_ENTER_DELAY / 1000 }
              }}
              exit={{
                x: 500,
                opacity: 0,
                transition: { duration: 0.5, ease: "backOut", delay: ALBUM_EXIT_DELAY / 1000 }
              }}
              className="absolute left-[118px] top-[16px] w-[316px] h-[316px] max-md:left-[27%] max-md:top-[4.5%] max-md:w-[73%] max-md:h-auto max-md:aspect-square shadow-2xl cursor-pointer group"
              onMouseEnter={() => setIsHoveringAlbum(true)}
              onMouseLeave={() => setIsHoveringAlbum(false)}
              onClick={onTogglePlayback}
            >
              <Image
                src={albumImage}
                alt={`${currentTrack.album.name} by ${currentTrack.artists[0]}`}
                fill
                className="object-cover"
                priority
              />

              {/* Play button overlay - only show on first load before user has played */}
              {!hasEverPlayed && isHoveringAlbum && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center backdrop-blur-md"
                >
                  <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Current Track Info with Equalizer */}
        <div className="flex items-center gap-[20px] justify-end">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTrack.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[20px] font-medium leading-normal whitespace-nowrap"
              style={{ fontWeight: 500 }}
            >
              {currentTrack.name} – {currentTrack.artists[0]}
            </motion.p>
          </AnimatePresence>
          <div onClick={onTogglePlayback} className="cursor-pointer">
            <Equalizer isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      {/* Upcoming Tracks - Fixed height container with absolute positioning */}
      <div
        className="relative text-right"
        style={{ height: '56px' }}
      >
        <AnimatePresence initial={false}>
          {upcomingTracks.slice(0, 2).map((track, index) => {
            // index 0 = next track (darker), index 1 = further track (lighter)
            const colors = ['#a0a0a0', '#d0d0d0'];
            const trackIndex = allTracks.findIndex(t => t.id === track.id);
            // 28px = 16px font-size * 1.5 line-height (24px) + 4px gap
            const topPosition = index === 0 ? 0 : 28;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, top: topPosition }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, top: { duration: 0.3, ease: 'easeInOut' } }}
                onClick={() => onTrackSelect(trackIndex)}
                className="absolute right-0 text-[16px] font-normal leading-normal whitespace-nowrap max-md:text-[0.75em] cursor-pointer hover:!text-[var(--foreground)] transition-colors"
                style={{
                  color: colors[index],
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}
              >
                {track.name} – {track.artists[0]}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
