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

  // TIMING CONTROLS - Adjust these values to control when animations happen
  const VINYL_EXIT_DELAY = 0; // Delay before vinyl starts hiding (milliseconds)
  const VINYL_ENTER_DELAY = 1200; // Delay before vinyl starts appearing after album enters (milliseconds)
  const VINYL_ENTER_DELAY_FIRST_LOAD = 500; // Delay for first load only (milliseconds)
  const ALBUM_EXIT_DELAY = 200; // Delay before album starts exiting (milliseconds)
  const ALBUM_ENTER_DELAY = 0; // Delay before album starts entering (milliseconds)


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
    // Set exit reason FIRST, then hide vinyl
    setExitReason('track-change');

    const hideTimer = setTimeout(() => {
      setShowVinyl(false);
    }, VINYL_EXIT_DELAY);

    // Show vinyl after album enters and settles, but only if user has played at least once
    if (hasEverPlayed) {
      const showDelay = isFirstLoad ? VINYL_ENTER_DELAY_FIRST_LOAD : VINYL_ENTER_DELAY;
      const showTimer = setTimeout(() => {
        setShowVinyl(true);
        setIsFirstLoad(false);
      }, showDelay);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
      };
    }

    return () => {
      clearTimeout(hideTimer);
    };
  }, [currentTrack.id, VINYL_EXIT_DELAY, VINYL_ENTER_DELAY, VINYL_ENTER_DELAY_FIRST_LOAD, isFirstLoad, hasEverPlayed]);

  // Hide vinyl when paused, show when playing
  useEffect(() => {
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
  }, [isPlaying, isFirstLoad, hasEverPlayed]);

  return (
    <div className="h-full flex flex-col items-end justify-between pt-[11px] pr-[16px] pb-[11px] max-md:pr-[3%]">
      {/* Previous Tracks - Fixed height container */}
      <div className="flex flex-col gap-[8px] text-right min-h-[40px]">
        <div className="flex flex-col gap-[8px] justify-end">
          <AnimatePresence mode="popLayout">
            {previousTracks.slice(-2).reverse().map((track, index) => {
              const trackIndex = allTracks.findIndex(t => t.id === track.id);
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => onTrackSelect(trackIndex)}
                  className="text-[16px] font-normal leading-normal whitespace-nowrap max-md:text-[0.75em] cursor-pointer hover:!text-[var(--foreground)] transition-colors"
                  style={{
                    color: index === 0 ? '#d0d0d0' : '#a0a0a0',
                    fontWeight: 400
                  }}
                >
                  {track.name} – {track.artists[0]}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Album Cover + Vinyl - Centered in available space */}
      <div className="flex flex-col gap-[7px] items-end w-[434px] max-md:w-full flex-shrink-0">
        <div className="relative w-[434px] h-[348px] max-md:w-full max-md:h-auto max-md:aspect-[434/348]">
          {/* Vinyl clip container - Only clips the vinyl */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Vinyl Record - Behind - Slides in/out with album changes */}
            <AnimatePresence>
              {showVinyl && (
                <motion.div
                  initial={{ x: 134 }}
                  animate={{
                    x: 0,
                    // Built-in easing options:
                    // "linear", "easeIn", "easeOut", "easeInOut"
                    // "circIn", "circOut", "circInOut"
                    // "backIn", "backOut", "backInOut" (has overshoot/bounce)
                    // "anticipate" (pulls back before moving forward)
                    // Or spring: { type: "spring", stiffness: 100, damping: 10, bounce: 0.25 }
                    // Or custom: [0.17, 0.67, 0.83, 0.67] (cubic bezier array)
                    transition: { duration: 0.5, ease: "backInOut" }
                  }}
                  exit={{
                    x: 134,
                    // Different speeds based on why vinyl is hiding
                    transition: exitReason === 'pause'
                      ? { duration: 0.6, ease: "easeInOut" } // Slower, smoother when pausing
                      : { duration: 0.1, ease: "backOut" } // Fast when changing tracks
                  }}
                  className="absolute left-[24px] top-[24px] w-[300px] h-[300px]"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black dark:from-gray-100 dark:to-white relative">
                    {/* Vinyl grooves effect */}
                    <div className="absolute inset-0 opacity-30">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full border border-gray-700 dark:border-gray-300"
                          style={{
                            left: `${i * 2}%`,
                            top: `${i * 2}%`,
                            right: `${i * 2}%`,
                            bottom: `${i * 2}%`,
                          }}
                        />
                      ))}
                    </div>
                    {/* Center label */}
                    <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-amber-900 to-amber-700 dark:from-amber-600 dark:to-amber-800" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Album Cover - In front - Slides in from right - No clipping */}
          <AnimatePresence mode="wait">
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
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-[20px] justify-end"
        >
          <p className="text-[20px] font-medium leading-normal whitespace-nowrap" style={{ fontWeight: 500 }}>
            {currentTrack.name} – {currentTrack.artists[0]}
          </p>
          <div onClick={onTogglePlayback} className="cursor-pointer">
            <Equalizer isPlaying={isPlaying} />
          </div>
        </motion.div>
      </div>

      {/* Upcoming Tracks - Fixed height container */}
      <div className="flex flex-col gap-[8px] text-right min-h-[72px]">
        <AnimatePresence mode="popLayout">
          {upcomingTracks.slice(0, 2).map((track, index) => {
            const colors = ['#a0a0a0', '#d0d0d0'];
            const trackIndex = allTracks.findIndex(t => t.id === track.id);
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                onClick={() => onTrackSelect(trackIndex)}
                className="text-[16px] font-normal leading-normal whitespace-nowrap max-md:text-[0.75em] cursor-pointer hover:!text-[var(--foreground)] transition-colors"
                style={{
                  color: colors[index],
                  fontWeight: 400
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
