import type { Track, SpotifyAuthResponse, SpotifyPlaylistResponse } from '@/types/playlist';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Get Spotify API access token using Client Credentials Flow
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: SpotifyAuthResponse = await response.json();
  return data.access_token;
}

/**
 * Fetch all tracks from a Spotify playlist
 */
export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const accessToken = await getAccessToken();
  const tracks: Track[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist tracks: ${response.statusText}`);
    }

    const data: SpotifyPlaylistResponse = await response.json();

    // Transform and add tracks
    for (const item of data.items) {
      if (item.track) {
        tracks.push({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map(artist => artist.name),
          album: {
            name: item.track.album.name,
            images: item.track.album.images,
          },
          duration_ms: item.track.duration_ms,
          uri: item.track.uri,
          preview_url: item.track.preview_url,
        });
      }
    }

    // Check if there are more tracks
    if (data.items.length < limit) {
      break;
    }

    offset += limit;
  }

  return tracks;
}

/**
 * Cache playlist tracks to JSON file
 */
export function cachePlaylistData(tracks: Track[]): void {
  const dataPath = join(process.cwd(), 'public', 'data', 'playlist-tracks.json');
  writeFileSync(dataPath, JSON.stringify(tracks, null, 2), 'utf-8');
  console.log(`✅ Cached ${tracks.length} tracks to ${dataPath}`);
}

/**
 * Main function to fetch and cache playlist
 */
export async function fetchAndCachePlaylist(): Promise<Track[]> {
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;

  if (!playlistId) {
    throw new Error('SPOTIFY_PLAYLIST_ID not found in environment variables');
  }

  console.log(`Fetching playlist: ${playlistId}...`);
  const tracks = await getPlaylistTracks(playlistId);

  console.log(`Found ${tracks.length} tracks`);
  cachePlaylistData(tracks);

  return tracks;
}
