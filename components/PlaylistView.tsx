"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Footer from './Footer';
import LyricsDisplay from './LyricsDisplay';
import AlbumDisplay from './AlbumDisplay';
import type { Track, SyncedLyrics, PlaybackState } from '@/types/playlist';
import { motion } from 'framer-motion';

interface PlaylistViewProps {
  tracks: Track[];
  allLyrics: Map<string, SyncedLyrics>;
  showLogoAndFooter?: boolean;
}

const STORAGE_KEY = 'playlist_playback_state';

export default function PlaylistView({ tracks, allLyrics, showLogoAndFooter = true }: PlaylistViewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackIndex: 0,
    position: 0,
    isPlaying: true,
    startTime: Date.now(),
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPlaybackState({
          ...parsed,
          startTime: Date.now(), // Reset start time
          isPlaying: true,
        });
      } catch (error) {
        console.error('Failed to load playback state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playbackState));
  }, [playbackState]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = 1;

      // Handle track end
      audioRef.current.addEventListener('ended', () => {
        const nextIndex = (playbackState.currentTrackIndex + 1) % tracks.length;
        setPlaybackState({
          currentTrackIndex: nextIndex,
          position: 0,
          isPlaying: true,
          startTime: Date.now(),
        });
      });

      // Update position based on audio time
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setPlaybackState(prev => ({
            ...prev,
            position: audioRef.current!.currentTime * 1000,
          }));
        }
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    const currentTrack = tracks[playbackState.currentTrackIndex];
    if (!currentTrack || !audioRef.current) return;

    if (currentTrack.preview_url) {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.currentTime = 0;

      if (playbackState.isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn('Audio playback failed:', err);
        });
      }
    }
  }, [playbackState.currentTrackIndex, tracks]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (playbackState.isPlaying) {
      audioRef.current.play().catch(err => {
        console.warn('Audio playback failed:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [playbackState.isPlaying]);

  const currentTrack = tracks[playbackState.currentTrackIndex];
  const currentLyrics = allLyrics.get(currentTrack.id) || null;

  const previousTracks = tracks.slice(0, playbackState.currentTrackIndex);
  const upcomingTracks = tracks.slice(playbackState.currentTrackIndex + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0"
    >
      {/* Logo - Conditional */}
      {showLogoAndFooter && (
        <div className="fixed top-[20px] left-[20px] z-10 w-[100px] h-[100px]">
          <Image
            className="w-[100px] h-[100px] logo-switch"
            src="/images/logo-joelcolombo.gif"
            alt="Hey!"
            width={100}
            height={100}
            unoptimized
          />
          <Image
            className="w-[100px] h-[100px] logo-switch-dark"
            src="/images/logo-joelcolombo-dark.gif"
            alt="Hey!"
            width={100}
            height={100}
            unoptimized
          />
        </div>
      )}

      {/* Main Content - Absolute Positioning to match Figma */}
      <div className="absolute top-[200px] left-0 right-0 bottom-[60px] max-md:top-[140px]">
        <div className="relative h-full">
          {/* Left Column - Lyrics */}
          <div className="absolute left-0 top-0 bottom-0 right-[454px] overflow-hidden max-md:right-0">
            <LyricsDisplay
              lyrics={currentLyrics}
              currentPosition={playbackState.position}
            />
          </div>

          {/* Right Column - Album Display */}
          <div className="absolute right-0 top-0 bottom-0 w-[454px] overflow-visible max-md:hidden">
            <AlbumDisplay
              currentTrack={currentTrack}
              previousTracks={previousTracks}
              upcomingTracks={upcomingTracks}
              isPlaying={playbackState.isPlaying}
              allTracks={tracks}
              onTrackSelect={(trackIndex) => {
                setPlaybackState({
                  currentTrackIndex: trackIndex,
                  position: 0,
                  isPlaying: true,
                  startTime: Date.now(),
                });
              }}
              onTogglePlayback={() => {
                setPlaybackState(prev => ({
                  ...prev,
                  isPlaying: !prev.isPlaying,
                  startTime: Date.now(),
                }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer - Conditional */}
      {showLogoAndFooter && <Footer />}

      {/* Hidden Spotify Embed for future enhancement */}
      {/* This can be used if we want actual Spotify playback instead of simulated */}
      {/* <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
        width="0"
        height="0"
        frameBorder="0"
        allow="encrypted-media"
        className="hidden"
      /> */}
    </motion.div>
  );
}
