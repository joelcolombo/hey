import type { SyncedLyrics, LyricLine, LRCLIBResponse, Track } from '@/types/playlist';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LRCLIB_API_BASE = 'https://lrclib.net/api';

/**
 * Search for lyrics on LRCLIB
 */
export async function searchLyrics(
  trackName: string,
  artistName: string,
  duration?: number
): Promise<LRCLIBResponse | null> {
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });

  if (duration) {
    // Convert milliseconds to seconds
    params.append('duration', Math.round(duration / 1000).toString());
  }

  const url = `${LRCLIB_API_BASE}/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Joel Colombo Portfolio (https://joelcolombo.com)',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch lyrics for ${trackName} by ${artistName}: ${response.statusText}`);
      return null;
    }

    const results: LRCLIBResponse[] = await response.json();

    // Return the first result if available
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error fetching lyrics for ${trackName}:`, error);
    return null;
  }
}

/**
 * Parse LRC format string into LyricLine array
 * LRC format: [mm:ss.xx]Lyric text
 */
export function parseLRC(lrcString: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const lrcLines = lrcString.split('\n');

  for (const line of lrcLines) {
    // Match timestamp [mm:ss.xx] or [mm:ss]
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = parseInt(match[3].padEnd(3, '0'), 10); // Handle both .xx and .xxx
      const text = match[4].trim();

      // Convert to milliseconds
      const timestamp = (minutes * 60 + seconds) * 1000 + centiseconds * 10;

      if (text) {
        lines.push({ timestamp, text });
      }
    }
  }

  // Sort by timestamp (just in case)
  return lines.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Cache synced lyrics to JSON file
 */
export function cacheLyrics(trackId: string, lyrics: SyncedLyrics): void {
  const lyricsDir = join(process.cwd(), 'public', 'data', 'lyrics');
  const filePath = join(lyricsDir, `${trackId}.json`);

  writeFileSync(filePath, JSON.stringify(lyrics, null, 2), 'utf-8');
}

/**
 * Check if lyrics are already cached
 */
export function areLyricsCached(trackId: string): boolean {
  const filePath = join(process.cwd(), 'public', 'data', 'lyrics', `${trackId}.json`);
  return existsSync(filePath);
}

/**
 * Fetch and cache lyrics for a single track
 */
export async function fetchAndCacheLyrics(track: Track): Promise<SyncedLyrics | null> {
  // Check if already cached
  if (areLyricsCached(track.id)) {
    console.log(`⏭️  Lyrics already cached for: ${track.name}`);
    return null;
  }

  const artistName = track.artists[0]; // Use primary artist
  console.log(`🔍 Searching lyrics for: ${track.name} by ${artistName}...`);

  const lrcData = await searchLyrics(track.name, artistName, track.duration_ms);

  if (!lrcData || !lrcData.syncedLyrics) {
    console.warn(`⚠️  No synced lyrics found for: ${track.name}`);
    return null;
  }

  const lines = parseLRC(lrcData.syncedLyrics);

  if (lines.length === 0) {
    console.warn(`⚠️  No valid lyric lines found for: ${track.name}`);
    return null;
  }

  const syncedLyrics: SyncedLyrics = {
    trackId: track.id,
    trackName: track.name,
    artistName,
    lines,
  };

  cacheLyrics(track.id, syncedLyrics);
  console.log(`✅ Cached ${lines.length} lyric lines for: ${track.name}`);

  return syncedLyrics;
}

/**
 * Fetch and cache lyrics for all tracks in a playlist
 */
export async function fetchAndCacheAllLyrics(tracks: Track[]): Promise<void> {
  console.log(`\n📝 Fetching lyrics for ${tracks.length} tracks...\n`);

  let successCount = 0;
  let failedCount = 0;
  let cachedCount = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    console.log(`[${i + 1}/${tracks.length}] ${track.name} by ${track.artists[0]}`);

    if (areLyricsCached(track.id)) {
      cachedCount++;
      console.log(`⏭️  Already cached\n`);
      continue;
    }

    const result = await fetchAndCacheLyrics(track);

    if (result) {
      successCount++;
    } else {
      failedCount++;
    }

    // Small delay to be respectful to the API
    if (i < tracks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
  }

  console.log(`\n✅ Summary:`);
  console.log(`   - Successfully fetched: ${successCount}`);
  console.log(`   - Already cached: ${cachedCount}`);
  console.log(`   - Failed/Not found: ${failedCount}`);
  console.log(`   - Total: ${tracks.length}\n`);
}
