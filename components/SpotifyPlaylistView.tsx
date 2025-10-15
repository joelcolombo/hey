"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import PlaylistView from './PlaylistView';
import type { Track, SyncedLyrics } from '@/types/playlist';

interface SpotifyPlaylistViewProps {
  tracks: Track[];
  allLyrics: Map<string, SyncedLyrics>;
  showLogoAndFooter?: boolean;
}

export default function SpotifyPlaylistView({ tracks, allLyrics, showLogoAndFooter = true }: SpotifyPlaylistViewProps) {
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract tokens from URL
  useEffect(() => {
    const token = searchParams.get('access_token');
    const refresh = searchParams.get('refresh_token');

    if (token && refresh) {
      setAccessToken(token);
      setRefreshToken(refresh);
      setIsAuthenticated(true);

      // Store in localStorage
      localStorage.setItem('spotify_access_token', token);
      localStorage.setItem('spotify_refresh_token', refresh);

      // Clean URL
      window.history.replaceState({}, '', '/404');
    } else {
      // Try to load from localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');

      if (storedToken && storedRefresh) {
        setAccessToken(storedToken);
        setRefreshToken(storedRefresh);
        setIsAuthenticated(true);
      }
    }
  }, [searchParams]);

  const handlePlayerReady = useCallback((id: string) => {
    console.log('Player ready with device ID:', id);
    setDeviceId(id);
    setError(null);
  }, []);

  const handlePlayerStateChange = useCallback((state: any) => {
    if (!state) return;

    setIsPlaying(!state.paused);
    setPosition(state.position);

    // Update current track based on Spotify state
    const currentUri = state.track_window.current_track.uri;
    const trackIndex = tracks.findIndex(t => `spotify:track:${t.id}` === currentUri);
    if (trackIndex !== -1) {
      setCurrentTrackIndex(trackIndex);
    }
  }, [tracks]);

  const handleTokenExpired = useCallback(() => {
    console.log('Token expired, clearing authentication');
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    setError('Session expired. Please login again.');
  }, []);

  const {
    isReady,
    play,
    togglePlay,
    currentState
  } = useSpotifyPlayer({
    accessToken,
    refreshToken,
    onPlayerReady: handlePlayerReady,
    onPlayerStateChange: handlePlayerStateChange,
    onTokenExpired: handleTokenExpired,
  });

  // Start playback when player is ready
  useEffect(() => {
    if (isReady && deviceId && tracks.length > 0) {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`);
      console.log('Starting playback with', tracks.length, 'tracks');
      play(trackUris).catch(err => {
        console.error('Failed to start playback:', err);
        setError('Failed to start playback. Please check your Premium account status.');
      });
    }
  }, [isReady, deviceId, tracks, play]);

  // Handle track selection
  const handleTrackSelect = useCallback(async (trackIndex: number) => {
    if (!deviceId || !accessToken) {
      console.warn('Cannot select track: missing deviceId or accessToken');
      return;
    }

    setCurrentTrackIndex(trackIndex);
    const trackUris = tracks.map(t => `spotify:track:${t.id}`);

    try {
      // Play from selected track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: trackUris,
          offset: { position: trackIndex }
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to play track:', response.status, errorData);

        if (response.status === 401) {
          setError('Authentication expired. Please login again.');
          handleTokenExpired();
        } else if (response.status === 403) {
          setError('Spotify Premium is required for playback.');
        } else if (response.status === 404) {
          setError('Playback device not found. Please try refreshing.');
        }
      }
    } catch (error) {
      console.error('Error selecting track:', error);
      setError('Failed to play track. Please try again.');
    }
  }, [deviceId, accessToken, tracks, handleTokenExpired]);

  const handleTogglePlayback = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="text-center max-w-2xl px-8">
          <h1 className="text-[3em] font-normal mb-8">Listen to the Playlist</h1>
          <p className="text-[1.5em] mb-12 text-[#a0a0a0]">
            Connect your Spotify Premium account to play full songs
          </p>
          {error && (
            <p className="text-[1.2em] mb-8 text-red-500">
              {error}
            </p>
          )}
          <a
            href="/api/auth/spotify/login"
            className="inline-block px-12 py-4 bg-[#1DB954] text-white text-[1.2em] font-medium rounded-full hover:bg-[#1ed760] transition-colors"
          >
            Login with Spotify
          </a>
          <p className="text-sm mt-6 text-[#808080]">
            Note: Spotify Premium is required for playback
          </p>
        </div>
      </div>
    );
  }

  // Pass playback state to PlaylistView (show UI immediately, player initializes in background)
  return (
    <PlaylistView
      tracks={tracks}
      allLyrics={allLyrics}
      showLogoAndFooter={showLogoAndFooter}
      spotifyMode={{
        currentTrackIndex,
        position,
        isPlaying,
        onTrackSelect: handleTrackSelect,
        onTogglePlayback: handleTogglePlayback,
      }}
    />
  );
}
