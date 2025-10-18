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
  console.log('🎬 PlaylistView rendering, tracks:', tracks.length, 'current audio file:', tracks[0]?.audio_file);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackIndex: 0,
    position: 0,
    isPlaying: false,
    startTime: Date.now(),
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const currentTrack = tracks[playbackState.currentTrackIndex];
  console.log('📀 Current track:', currentTrack?.name, 'Audio URL:', currentTrack?.audio_file);

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
    onError: (error) => {
      console.error('Audio playback error:', error);
    },
  });


  // Load saved state from localStorage and autoplay
  useEffect(() => {
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
      // No saved state, start playing first track
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
      }));
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playbackState));
  }, [playbackState]);

  // Sync position from audio player
  useEffect(() => {
    if (currentTime > 0 && Math.floor(currentTime / 2000) !== Math.floor((currentTime - 100) / 2000)) {
      console.log('PlaylistView: Syncing position:', currentTime.toFixed(0), 'ms');
    }
    setPlaybackState(prev => ({ ...prev, position: currentTime }));
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

  // Calculate previous and upcoming tracks with looping
  const currentIndex = playbackState.currentTrackIndex;
  const previousTracks = tracks.slice(0, currentIndex);
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
