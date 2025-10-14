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

  // Reset vinyl animation when track changes
  useEffect(() => {
    setShowVinyl(false);
    const delay = isFirstLoad ? 500 : 500; // Wait for album to settle
    const timer = setTimeout(() => {
      setShowVinyl(true);
      setIsFirstLoad(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentTrack.id]);

  // Hide vinyl when paused, show when playing
  useEffect(() => {
    if (!isPlaying) {
      setShowVinyl(false);
    } else if (!isFirstLoad) {
      // Only show vinyl if not first load (first load is handled by track change effect)
      const timer = setTimeout(() => {
        setShowVinyl(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFirstLoad]);

  return (
    <div className="h-full flex flex-col items-end justify-between pt-[11px] pr-[20px] pb-[11px] max-md:pr-[3%]">
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
                  animate={{ x: 0 }}
                  exit={{ x: 134 }}
                  transition={{
                    x: {
                      duration: showVinyl ? 0.8 : 0.3,
                      ease: showVinyl ? "easeOut" : "easeIn"
                    }
                  }}
                  className="absolute left-[24px] top-[24px] w-[300px] h-[300px]"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black relative">
                    {/* Vinyl grooves effect */}
                    <div className="absolute inset-0 opacity-30">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full border border-gray-700"
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
                    <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-amber-900 to-amber-700" />
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
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute left-[118px] top-[16px] w-[316px] h-[316px] max-md:left-[27%] max-md:top-[4.5%] max-md:w-[73%] max-md:h-auto max-md:aspect-square shadow-2xl"
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
          {upcomingTracks.slice(0, 3).map((track, index) => {
            const colors = ['#a0a0a0', '#d0d0d0', '#e6e6e6'];
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
