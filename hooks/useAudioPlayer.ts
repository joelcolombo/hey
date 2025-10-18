"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioPlayerProps {
  audioUrl: string;
  onReady?: () => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'loading') => void;
  onError?: (error: any) => void;
}

export function useAudioPlayer({
  audioUrl,
  onReady,
  onStateChange,
  onError,
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Store callbacks in refs so they don't cause re-initialization
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  });

  // Initialize audio element
  useEffect(() => {
    console.log('🔊 useAudioPlayer hook initializing...');
    if (!audioRef.current) {
      console.log('🎵 Creating new Audio element');
      audioRef.current = new Audio();

      // Configure for optimal streaming
      audioRef.current.preload = 'auto';

      // Mobile-specific attributes for iOS compatibility
      audioRef.current.setAttribute('playsinline', 'true'); // Prevent fullscreen on iOS
      audioRef.current.setAttribute('webkit-playsinline', 'true'); // Older iOS versions

      // Set up event listeners
      const audio = audioRef.current;

      const handleCanPlay = () => {
        console.log('✅ Audio CAN PLAY - Ready to play');
        setIsReady(true);
        setIsLoading(false);
        onReadyRef.current?.();
      };

      const handleLoadStart = () => {
        setIsLoading(true);
        onStateChangeRef.current?.('loading');
      };

      const handlePlay = () => {
        console.log('🎵 Audio PLAY event fired');
        setIsPlaying(true);
        onStateChangeRef.current?.('playing');
      };

      const handlePause = () => {
        setIsPlaying(false);
        onStateChangeRef.current?.('paused');
      };

      const handleEnded = () => {
        setIsPlaying(false);
        onStateChangeRef.current?.('ended');
      };

      const handleTimeUpdate = () => {
        const timeMs = audio.currentTime * 1000;
        setCurrentTime(timeMs); // Convert to milliseconds

        // Debug log every 2 seconds
        if (Math.floor(timeMs / 2000) !== Math.floor((timeMs - 100) / 2000)) {
          console.log('Audio time update:', timeMs.toFixed(0), 'ms');
        }
      };

      const handleDurationChange = () => {
        setDuration(audio.duration * 1000); // Convert to milliseconds
      };

      const handleError = (e: ErrorEvent) => {
        console.error('Audio playback error:', e);
        setIsLoading(false);
        onErrorRef.current?.(e);
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('error', handleError as any);

      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('error', handleError as any);
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  // Update audio source when URL changes
  useEffect(() => {
    console.log('📂 Audio URL changed to:', audioUrl);
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current;
      const wasPlaying = !audio.paused;

      console.log('⏳ Loading audio from:', audioUrl);
      setIsReady(false);
      setIsLoading(true);

      audio.src = audioUrl;
      audio.load();

      // Auto-play if previous track was playing
      if (wasPlaying) {
        audio.play().catch(error => {
          console.error('Auto-play failed:', error);
          onErrorRef.current?.(error);
        });
      }
    }
  }, [audioUrl]);

  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was prevented (common on mobile)
          if (error.name === 'NotAllowedError') {
            console.log('Autoplay prevented - user interaction required');
            // Don't call onError for autoplay prevention, it's expected behavior
          } else {
            console.error('Play failed:', error);
            onErrorRef.current?.(error);
          }
        });
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((timeInSeconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeInSeconds;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    audioRef,
    isReady,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume,
  };
}
