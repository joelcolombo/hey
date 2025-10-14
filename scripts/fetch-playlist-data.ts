/**
 * Script to fetch Spotify playlist tracks and their synced lyrics
 * Run with: npx tsx scripts/fetch-playlist-data.ts
 */

import { config } from 'dotenv';
import { fetchAndCachePlaylist } from '../lib/spotify';
import { fetchAndCacheAllLyrics } from '../lib/lyrics';

// Load environment variables
config({ path: '.env.local' });

async function main() {
  try {
    console.log('\n🎵 Fetching Spotify Playlist Data\n');
    console.log('='.repeat(50) + '\n');

    // Step 1: Fetch playlist tracks
    console.log('📀 Step 1: Fetching playlist tracks from Spotify...\n');
    const tracks = await fetchAndCachePlaylist();

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Fetch lyrics for all tracks
    console.log('📝 Step 2: Fetching synced lyrics from LRCLIB...\n');
    await fetchAndCacheAllLyrics(tracks);

    console.log('='.repeat(50));
    console.log('\n✨ Done! All data has been fetched and cached.\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
