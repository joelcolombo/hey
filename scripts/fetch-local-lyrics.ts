import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Track } from '../types/playlist';
import { fetchAndCacheAllLyrics } from '../lib/lyrics';

async function main() {
  console.log('🎵 Fetching lyrics for local playlist...\n');

  // Load local playlist tracks
  const playlistPath = join(process.cwd(), 'public', 'data', 'playlist-tracks-local.json');

  if (!existsSync(playlistPath)) {
    console.error('❌ Playlist file not found:', playlistPath);
    process.exit(1);
  }

  const tracks: Track[] = JSON.parse(readFileSync(playlistPath, 'utf-8'));

  console.log(`📋 Found ${tracks.length} tracks in playlist\n`);

  // Ensure lyrics directory exists
  const lyricsDir = join(process.cwd(), 'public', 'data', 'lyrics');
  if (!existsSync(lyricsDir)) {
    mkdirSync(lyricsDir, { recursive: true });
  }

  // Fetch and cache all lyrics
  await fetchAndCacheAllLyrics(tracks);

  console.log('\n✅ Done! Lyrics have been cached to /public/data/lyrics/\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
