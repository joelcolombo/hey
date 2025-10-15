import { useEffect, useRef, useState, useCallback } from 'react';

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onError?: (error: any) => void;
}

export function useYouTubePlayer({
  videoId,
  onReady,
  onStateChange,
  onError,
}: UseYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const initialVideoIdRef = useRef(videoId);

  // Store callbacks in refs so they don't cause re-initialization
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  });

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Initialize player ONCE
  useEffect(() => {
    if (!playerContainerRef.current) {
      console.log('Player init skipped: no container');
      return;
    }

    // Only create player once
    if (playerRef.current) {
      return;
    }

    const initializePlayer = () => {
      if (!window.YT || !window.YT.Player) {
        console.log('Waiting for YouTube API...');
        setTimeout(initializePlayer, 100);
        return;
      }

      console.log('Creating YouTube player (one time only)');

      // Create a unique ID for the player container
      const containerId = `yt-player-${Date.now()}`;
      if (playerContainerRef.current) {
        playerContainerRef.current.id = containerId;
      }

      playerRef.current = new window.YT.Player(containerId, {
        height: '1',
        width: '1',
        videoId: initialVideoIdRef.current,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube Player Ready');
            setIsReady(true);
            // Try to play immediately
            event.target.playVideo();
            onReadyRef.current?.();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            console.log('YouTube Player State:', state);
            setIsPlaying(state === window.YT.PlayerState.PLAYING);
            onStateChangeRef.current?.(state);
          },
          onError: (event: any) => {
            console.error('YouTube Player Error:', event.data);
            onErrorRef.current?.(event.data);
          },
        },
      });
    };

    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []); // Empty deps - only run once!

  // Update current time
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time * 1000); // Convert to milliseconds
      }
    }, 100); // Update every 100ms for smooth lyrics sync

    return () => clearInterval(interval);
  }, [isReady, isPlaying]);

  const play = useCallback(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
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
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(timeInSeconds, true);
    }
  }, []);

  const loadVideoById = useCallback((newVideoId: string) => {
    console.log('loadVideoById called with:', newVideoId);
    if (playerRef.current && playerRef.current.loadVideoById) {
      console.log('Loading new video...');
      playerRef.current.loadVideoById({
        videoId: newVideoId,
        startSeconds: 0
      });
      // Also play the video
      setTimeout(() => {
        if (playerRef.current && playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
      }, 500);
    } else {
      console.log('Player not ready or loadVideoById not available');
    }
  }, []);

  return {
    playerContainerRef,
    isReady,
    isPlaying,
    currentTime,
    play,
    pause,
    togglePlay,
    seekTo,
    loadVideoById,
    playerRef,
  };
}
