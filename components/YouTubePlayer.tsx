"use client";

import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export default function YouTubePlayer({
  videoId,
  isPlaying,
  onReady,
  onTimeUpdate,
  onEnded,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [playerId] = useState(`youtube-player-${Math.random().toString(36).substr(2, 9)}`);

  // Initialize YouTube IFrame API
  useEffect(() => {

    // Load YouTube API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Wait for API to be ready
    const checkYT = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(checkYT);

        if (!containerRef.current) {
          return;
        }

        try {
          playerRef.current = new (window as any).YT.Player(playerId, {
            height: '225',
            width: '400',
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 1,
            },
            events: {
              onReady: (event: any) => {
                onReady?.();

                // Start polling for current time
                intervalRef.current = setInterval(() => {
                  if (playerRef.current && playerRef.current.getCurrentTime) {
                    const currentTime = playerRef.current.getCurrentTime();
                    onTimeUpdate?.(currentTime * 1000);
                  }
                }, 100);
              },
              onStateChange: (event: any) => {
                const state = event.data;
                // 0 = ended, 1 = playing, 2 = paused
                if (state === 0) {
                  onEnded?.();
                }
              },
              onError: (event: any) => {
                console.error('YouTube Player error:', event.data);
              },
            },
          });
        } catch (error) {
          console.error('Error creating YouTube player:', error);
        }
      }
    }, 100);

    return () => {
      clearInterval(checkYT);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [playerId]); // Only run once

  // Handle video changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying]);

  return (
    <div ref={containerRef}>
      <div id={playerId}></div>
    </div>
  );
}
