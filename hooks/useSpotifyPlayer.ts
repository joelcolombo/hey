import { useEffect, useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

namespace Spotify {
  export class Player {
    constructor(options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    });
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (data: any) => void): void;
    removeListener(event: string, callback?: (data: any) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    _options: { id: string };
  }

  export interface PlaybackState {
    context: {
      uri: string | null;
      metadata: any;
    };
    disallows: {
      pausing: boolean;
      resuming: boolean;
    };
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  export interface Track {
    uri: string;
    id: string;
    type: string;
    media_type: string;
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: { url: string }[];
    };
    artists: { uri: string; name: string }[];
  }

  export interface Error {
    message: string;
  }
}

interface UseSpotifyPlayerOptions {
  accessToken: string | null;
  refreshToken: string | null;
  onPlayerReady?: (deviceId: string) => void;
  onPlayerStateChange?: (state: Spotify.PlaybackState | null) => void;
  onTokenExpired?: () => void;
}

export function useSpotifyPlayer({
  accessToken,
  refreshToken,
  onPlayerReady,
  onPlayerStateChange,
  onTokenExpired,
}: UseSpotifyPlayerOptions) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentState, setCurrentState] = useState<Spotify.PlaybackState | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const tokenRef = useRef(accessToken);
  const refreshTokenRef = useRef(refreshToken);

  // Update token refs when they change
  useEffect(() => {
    tokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;
  }, [accessToken, refreshToken]);

  // Refresh token when expired
  const refreshAccessToken = useCallback(async () => {
    if (!refreshTokenRef.current) {
      console.error('No refresh token available');
      onTokenExpired?.();
      return null;
    }

    try {
      const response = await fetch('/api/auth/spotify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTokenRef.current }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      onTokenExpired?.();
      return null;
    }
  }, [onTokenExpired]);

  // Wait for Spotify SDK to load
  useEffect(() => {
    if (window.Spotify) {
      setSdkReady(true);
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify SDK ready');
      setSdkReady(true);
    };

    return () => {
      window.onSpotifyWebPlaybackSDKReady = () => {};
    };
  }, []);

  // Initialize player
  useEffect(() => {
    if (!accessToken || !sdkReady || !window.Spotify) return;

    const spotifyPlayer = new window.Spotify.Player({
      name: 'Joel Colombo 404 Player',
      getOAuthToken: (cb) => {
        cb(tokenRef.current || '');
      },
      volume: 1.0,
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setIsReady(true);
      onPlayerReady?.(device_id);
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
      setIsReady(false);
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state) => {
      console.log('Player state changed', state);
      setCurrentState(state);
      onPlayerStateChange?.(state);
    });

    // Errors
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Initialization Error:', message);
    });

    spotifyPlayer.addListener('authentication_error', async ({ message }) => {
      console.error('Authentication Error:', message);
      // Try to refresh token
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log('Token refreshed, reconnecting...');
        // The token will be used on next getOAuthToken call
      }
    });

    spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('Account Error:', message);
      if (message.includes('premium')) {
        console.error('Spotify Premium account is required for playback');
      }
    });

    spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('Playback Error:', message);
    });

    // Connect
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);

    return () => {
      spotifyPlayer.disconnect();
    };
  }, [accessToken, sdkReady, onPlayerReady, onPlayerStateChange, refreshAccessToken]);

  const play = useCallback(
    async (uris?: string[]) => {
      if (!deviceId || !accessToken) {
        console.warn('Cannot play: missing deviceId or accessToken');
        return;
      }

      const body = uris ? { uris } : undefined;

      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Spotify play failed:', response.status, errorData);

          // Handle specific error cases
          if (response.status === 401) {
            console.error('Authentication error - token may be expired');
          } else if (response.status === 403) {
            console.error('Premium account required for playback');
          } else if (response.status === 404) {
            console.error('Device not found - ensure player is connected');
          }
        }
      } catch (error) {
        console.error('Failed to start playback:', error);
      }
    },
    [deviceId, accessToken]
  );

  const pause = useCallback(async () => {
    if (!player) return;
    await player.pause();
  }, [player]);

  const resume = useCallback(async () => {
    if (!player) return;
    await player.resume();
  }, [player]);

  const togglePlay = useCallback(async () => {
    if (!player) return;
    await player.togglePlay();
  }, [player]);

  const seek = useCallback(
    async (position_ms: number) => {
      if (!player) return;
      await player.seek(position_ms);
    },
    [player]
  );

  const nextTrack = useCallback(async () => {
    if (!player) return;
    await player.nextTrack();
  }, [player]);

  const previousTrack = useCallback(async () => {
    if (!player) return;
    await player.previousTrack();
  }, [player]);

  return {
    player,
    deviceId,
    isReady,
    currentState,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    nextTrack,
    previousTrack,
  };
}
