"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Footer from './Footer';
import LyricsDisplay from './LyricsDisplay';
import AlbumDisplay from './AlbumDisplay';
import MobilePlayerView from './MobilePlayerView';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { Track, SyncedLyrics, PlaybackState } from '@/types/playlist';
import { motion } from 'framer-motion';

interface PlaylistViewProps {
  tracks: Track[];
  allLyrics: Map<string, SyncedLyrics>;
  showLogoAndFooter?: boolean;
}

const STORAGE_KEY = 'playlist_playback_state';

export default function PlaylistView({ tracks, allLyrics, showLogoAndFooter = true }: PlaylistViewProps) {
  // Start with a random track for each new session
  const getRandomTrackIndex = () => Math.floor(Math.random() * tracks.length);
  const [initialTrackIndex] = useState(() => getRandomTrackIndex());

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackIndex: initialTrackIndex,
    position: 0,
    isPlaying: false,
    startTime: Date.now(),
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const currentTrack = tracks[playbackState.currentTrackIndex];

  // Use local audio player
  const { isReady, currentTime, play, pause, audioRef } = useAudioPlayer({
    audioUrl: currentTrack?.audio_file || '',
    onReady: () => {
      // Auto-play if state says we should be playing
      if (playbackState.isPlaying) {
        play();
      }
    },
    onStateChange: (state) => {
      if (state === 'ended') {
        // Auto-play next track
        const nextIndex = (playbackState.currentTrackIndex + 1) % tracks.length;
        setPlaybackState({
          currentTrackIndex: nextIndex,
          position: 0,
          isPlaying: true,
          startTime: Date.now(),
        });
      }
    },
    onTimeUpdate: () => {
      // Position update handled below in the currentTime effect
    },
    onError: (error) => {
      console.error('Audio playback error:', error);
    },
  });


  // Load saved state from localStorage and autoplay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we should reset (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      localStorage.removeItem(STORAGE_KEY);
      // Remove the reset parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPlaybackState({
          ...parsed,
          startTime: Date.now(),
          isPlaying: true, // Autoplay on load
        });
      } catch (error) {
        console.error('Failed to load playback state:', error);
      }
    } else {
      // No saved state, start with random track and autoplay
      setPlaybackState({
        currentTrackIndex: initialTrackIndex,
        position: 0,
        isPlaying: true,
        startTime: Date.now(),
      });
    }
  }, [initialTrackIndex]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(playbackState));
  }, [playbackState]);

  // Sync position from audio player
  useEffect(() => {
    setPlaybackState(prev => {
      return { ...prev, position: currentTime };
    });
  }, [currentTime]);

  // Control audio playback based on state
  useEffect(() => {
    if (!audioRef.current) return;

    if (playbackState.isPlaying) {
      play();
    } else {
      pause();
    }
  }, [playbackState.isPlaying, play, pause, audioRef]);

  // Preload all album images for instant display
  useEffect(() => {
    tracks.forEach((track) => {
      // Preload the highest quality image using browser's native image element
      const imageUrl = track.album.images[0]?.url;
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
      }
    });
  }, [tracks]);

  const currentLyrics = allLyrics.get(currentTrack?.id) || null;

  // Calculate previous and upcoming tracks with infinite looping
  const currentIndex = playbackState.currentTrackIndex;

  // Previous tracks with circular logic
  const previousTracksBeforeCurrent = tracks.slice(0, currentIndex);
  // If we're at the beginning, show tracks from the end to create infinite loop effect
  const previousTracks = previousTracksBeforeCurrent.length < 2
    ? [...tracks.slice(-(2 - previousTracksBeforeCurrent.length)), ...previousTracksBeforeCurrent]
    : previousTracksBeforeCurrent;

  // Upcoming tracks with circular logic
  const upcomingTracksAfterCurrent = tracks.slice(currentIndex + 1);
  // If we're near the end, add tracks from the beginning to show upcoming tracks
  const upcomingTracks = upcomingTracksAfterCurrent.length < 2
    ? [...upcomingTracksAfterCurrent, ...tracks.slice(0, 2 - upcomingTracksAfterCurrent.length)]
    : upcomingTracksAfterCurrent;

  const handleTrackSelect = (trackIndex: number) => {
    setPlaybackState({
      currentTrackIndex: trackIndex,
      position: 0,
      isPlaying: true,
      startTime: Date.now(),
    });
  };

  const handleTogglePlayback = () => {
    // Mark user interaction on first play
    if (!hasUserInteracted && !playbackState.isPlaying) {
      setHasUserInteracted(true);
    }
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  // Debug logging

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0"
    >

      {/* Logo */}
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

      {/* Lyrics Area - Full height, behind everything */}
      <div className="absolute top-0 left-0 right-[454px] bottom-0 max-md:right-0 max-md:bottom-[160px]">
        <LyricsDisplay
          lyrics={currentLyrics}
          currentPosition={playbackState.position}
          offsetMs={currentTrack?.lyrics_offset_ms || 0}
        />
      </div>

      {/* Desktop Album/Playlist Area */}
      <div className="absolute top-[200px] right-0 bottom-[60px] w-[454px] max-md:hidden">
        <div className="relative h-full">
          <AlbumDisplay
            currentTrack={currentTrack}
            previousTracks={previousTracks}
            upcomingTracks={upcomingTracks}
            isPlaying={playbackState.isPlaying}
            allTracks={tracks}
            onTrackSelect={handleTrackSelect}
            onTogglePlayback={handleTogglePlayback}
          />
        </div>
      </div>

      {/* Mobile Player View - Bottom right corner */}
      <div className="hidden max-md:block">
        <MobilePlayerView
          currentTrack={currentTrack}
          isPlaying={playbackState.isPlaying}
          onTogglePlayback={handleTogglePlayback}
          allTracks={tracks}
          onTrackSelect={handleTrackSelect}
        />
      </div>

      {/* Footer */}
      {showLogoAndFooter && <Footer />}
    </motion.div>
  );
}
