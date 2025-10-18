"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioPlayerProps {
  audioUrl: string;
  onReady?: () => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'loading') => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (timeMs: number) => void;
}

export function useAudioPlayer({
  audioUrl,
  onReady,
  onStateChange,
  onError,
  onTimeUpdate,
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
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
    onTimeUpdateRef.current = onTimeUpdate;
  });

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Configure for optimal streaming
      audioRef.current.preload = 'auto';

      // Mobile-specific attributes for iOS compatibility
      audioRef.current.setAttribute('playsinline', 'true'); // Prevent fullscreen on iOS
      audioRef.current.setAttribute('webkit-playsinline', 'true'); // Older iOS versions
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Set up event listeners - recreate when audio element changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;


    const handleCanPlay = () => {
      setIsReady(true);
      setIsLoading(false);
      onReadyRef.current?.();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      onStateChangeRef.current?.('loading');
    };

    const handlePlay = () => {
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
      // Only log every second to reduce noise
      if (Math.floor(timeMs / 1000) !== Math.floor((timeMs - 100) / 1000)) {
      }
      setCurrentTime(timeMs); // Convert to milliseconds
      onTimeUpdateRef.current?.(timeMs); // Call the callback directly
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
    };
  }, [audioUrl]); // Re-attach listeners when URL changes

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current;
      const wasPlaying = !audio.paused;

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
