export interface Track {
  id: string;
  name: string;
  artists: string[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  youtube_id?: string;
  lyrics_offset_ms?: number; // Offset to adjust lyrics timing (in milliseconds)
  uri?: string;
  preview_url?: string | null;
}

export interface LyricLine {
  timestamp: number; // milliseconds
  text: string;
}

export interface SyncedLyrics {
  trackId: string;
  trackName: string;
  artistName: string;
  lines: LyricLine[];
}

export interface PlaybackState {
  currentTrackIndex: number;
  position: number; // milliseconds
  isPlaying: boolean;
  startTime?: number; // timestamp when track started
}

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyPlaylistResponse {
  items: {
    track: {
      id: string;
      name: string;
      artists: { name: string }[];
      album: {
        name: string;
        images: { url: string; height: number; width: number }[];
      };
      duration_ms: number;
      uri: string;
      preview_url: string | null;
    };
  }[];
}

export interface LRCLIBResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string;
  syncedLyrics: string | null;
}
