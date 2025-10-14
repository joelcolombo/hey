# Implementation Plan: 404 Playlist Page

## Overview
Create a custom 404 page that shows a splash screen (2-3 seconds), then transitions to a music player with synced lyrics from your Spotify playlist.

## Design Specifications

### Splash Screen
- **Background**: White (`#ffffff`)
- **Logo**: Top-left corner (existing logo component)
- **Main Text**:
  - Content: "The thing you were searching for got lost... but the music found you."
  - Font: PP Neue Montreal TT
  - Size: Large (5em, responsive)
  - Color: Black (`#000000`)
  - Position: Left-aligned, vertically centered
- **Footer**: Standard footer with Email, X, LinkedIn, Calendar, theme toggle, © year
- **Animation**: Fade out after 2-3 seconds

### Playlist View
- **Layout**: Two-column grid (60% left / 40% right)

#### Left Column - Lyrics Display
- **Inactive lyrics**: Light gray (`#a0a0a0`)
- **Active lyric line**: Black (`#000000`)
- **Font**: PP Neue Montreal TT
- **Size**: Large (3-4em)
- **Alignment**: Left
- **Behavior**: Auto-scroll to keep active line in view
- **Line spacing**: Generous

#### Right Column - Album & Track List
- **Top Section**: Previously played tracks
  - Display: Track name – Artist name
  - Color: Light gray (faded)
  - Show up to 3 tracks with fade effect at top

- **Middle Section**: Current track
  - Album cover display (square)
  - Vinyl record + album art visual
  - Audio waveform indicator
  - Track title – Artist name below

- **Bottom Section**: Upcoming tracks
  - Display: Track name – Artist name
  - Color: Light gray (faded)
  - Show up to 3 tracks with fade effect at bottom

## Technical Architecture

### Branch Setup
- Branch name: `404-playlist`

### Files Structure

```
/app
  /not-found.tsx                    # Main 404 page component
/components
  /SplashScreen.tsx                 # Welcome message + fade animation
  /PlaylistView.tsx                 # Main playlist container
  /LyricsDisplay.tsx                # Synced lyrics with highlighting
  /AlbumDisplay.tsx                 # Album art + track lists
/lib
  /spotify.ts                       # Spotify API client
  /lyrics.ts                        # LRCLIB API integration
/types
  /playlist.ts                      # TypeScript interfaces
/data
  /playlist-tracks.json             # Cached playlist metadata
  /lyrics
    /[track-id].json                # Individual synced lyrics
/.env.local                         # Spotify credentials (gitignored)
```

## API Integrations

### 1. Spotify Web API

**Authentication**: Client Credentials Flow
- Endpoint: `https://accounts.spotify.com/api/token`
- Method: POST
- Headers:
  - `Authorization`: Basic {base64(client_id:client_secret)}
  - `Content-Type`: application/x-www-form-urlencoded
- Body: `grant_type=client_credentials`
- Response: `{ access_token, token_type, expires_in }`

**Get Playlist Tracks**
- Endpoint: `https://api.spotify.com/v1/playlists/{playlist_id}/tracks`
- Playlist ID: `727lkTOl9bpX5AXamFhOj9`
- Headers:
  - `Authorization`: Bearer {access_token}
- Returns: Array of tracks with metadata (name, artists, album, duration, id)

**Credentials**:
- Client ID: `1bf522cc0cca42418bb5569786432988`
- Client Secret: `0a9dd299aad14e10949e1ca4a93a6354`

### 2. LRCLIB API (Free Synced Lyrics)

**Search Lyrics**
- Endpoint: `https://lrclib.net/api/search`
- Method: GET
- Query Parameters:
  - `track_name`: Song title
  - `artist_name`: Artist name
  - Optional: `album_name`, `duration`
- No authentication required
- No rate limits
- Returns: Synced lyrics in LRC format with timestamps

**LRC Format**:
```
[00:12.00]Line of lyrics
[00:15.50]Next line of lyrics
```

## Component Implementation

### 1. TypeScript Types (`types/playlist.ts`)

```typescript
interface Track {
  id: string;
  name: string;
  artists: string[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  uri: string;
}

interface LyricLine {
  timestamp: number; // milliseconds
  text: string;
}

interface SyncedLyrics {
  trackId: string;
  trackName: string;
  artistName: string;
  lines: LyricLine[];
}

interface PlaybackState {
  currentTrackIndex: number;
  position: number; // milliseconds
  isPlaying: boolean;
}
```

### 2. Spotify Client (`lib/spotify.ts`)

Functions:
- `getAccessToken()`: Authenticate and get token
- `getPlaylistTracks(playlistId)`: Fetch all tracks from playlist
- `cachePlaylistData(tracks)`: Save to `data/playlist-tracks.json`

### 3. Lyrics Client (`lib/lyrics.ts`)

Functions:
- `searchLyrics(trackName, artistName)`: Fetch from LRCLIB
- `parseLRC(lrcString)`: Convert LRC format to LyricLine[]
- `cacheLyrics(trackId, lyrics)`: Save to `data/lyrics/[trackId].json`

### 4. SplashScreen Component (`components/SplashScreen.tsx`)

- Display welcome message
- Use Framer Motion for fade-out animation
- Props: `onComplete` callback
- Timer: 2-3 seconds before triggering fade

### 5. LyricsDisplay Component (`components/LyricsDisplay.tsx`)

- Props: `lyrics: SyncedLyrics`, `currentPosition: number`
- Calculate active line based on position
- Highlight current line in black
- Keep inactive lines in gray
- Auto-scroll to active line
- Smooth transitions between lines

### 6. AlbumDisplay Component (`components/AlbumDisplay.tsx`)

- Props: `currentTrack`, `previousTracks`, `upcomingTracks`, `allTracks`
- Display album artwork
- Show 3 previous tracks (faded, scrollable)
- Show 3 upcoming tracks (faded, scrollable)
- Fade effect using CSS gradients

### 7. PlaylistView Component (`components/PlaylistView.tsx`)

- Manage playback state (localStorage persistence)
- Spotify embed player (iframe)
- Sync playback position with lyrics
- Two-column grid layout
- Pass data to LyricsDisplay and AlbumDisplay

### 8. Main 404 Page (`app/not-found.tsx`)

- State: `showSplash` (boolean)
- Conditionally render SplashScreen or PlaylistView
- Transition logic with Framer Motion
- Auto-play on mount
- Same logo and footer as main page

## Spotify Embed Integration

Use Spotify iframe embed:
```html
<iframe
  src="https://open.spotify.com/embed/playlist/727lkTOl9bpX5AXamFhOj9"
  width="100%"
  height="380"
  frameBorder="0"
  allowtransparency="true"
  allow="encrypted-media"
></iframe>
```

**Limitations**:
- Spotify iframe doesn't provide real-time playback position via API
- **Solution**: Use Spotify Web Playback SDK for more control OR estimate position based on track start time + elapsed time

## State Management

### LocalStorage Keys:
- `playlist_current_track`: Current track index
- `playlist_position`: Last known position (ms)
- `playlist_is_playing`: Boolean
- `playlist_start_time`: Timestamp when track started

### Playback Position Tracking:
Since Spotify embed has limited API access:
1. Track when each song starts playing
2. Calculate elapsed time using `Date.now() - startTime`
3. Sync with lyrics based on calculated position
4. Reset on track change

## Animation Details

### Splash Screen Fade Out
```typescript
<motion.div
  initial={{ opacity: 1 }}
  animate={{ opacity: 0 }}
  transition={{ duration: 0.5 }}
  onAnimationComplete={onComplete}
>
```

### Playlist View Fade In
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

### Lyric Line Transitions
- Smooth color transition using CSS
- `transition: color 0.3s ease`

### Track List Fade Effects
- CSS gradient masks on top and bottom
- `mask-image: linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent)`

## Implementation Steps

1. ✅ Create branch `404-playlist`
2. ✅ Set up folder structure
3. ✅ Save this plan as markdown
4. Create `.env.local` with Spotify credentials
5. Create TypeScript types
6. Build Spotify API client
7. Fetch and cache playlist tracks
8. Build LRCLIB API client
9. Fetch and cache synced lyrics for all tracks
10. Build SplashScreen component
11. Build LyricsDisplay component
12. Build AlbumDisplay component
13. Build PlaylistView component
14. Build not-found.tsx page
15. Test 404 routing
16. Test auto-play functionality
17. Test playback state persistence
18. Test dark mode support
19. Test responsive design

## Dark Mode Support

The page will automatically support dark mode using existing theme system:
- Background: `var(--background)`
- Text: `var(--foreground)`
- Inactive lyrics: Custom gray that works in both modes
- Logo: Switches automatically via existing logo-switch classes

## Responsive Design

Follow existing patterns from `app/page.tsx`:
- Mobile breakpoint: `max-md:` Tailwind classes
- Adjust font sizes for mobile
- Stack columns vertically on small screens
- Maintain footer positioning

## Known Limitations & Solutions

### Limitation: Spotify Embed API Access
**Problem**: Limited real-time playback position data
**Solution**: Use client-side timestamp tracking + manual sync

### Limitation: LRCLIB Coverage
**Problem**: Not all songs may have synced lyrics
**Solution**: Fallback to plain text lyrics or show album info only

### Limitation: Auto-play on iOS
**Problem**: Browsers may block auto-play
**Solution**: Show play button prompt if auto-play fails

## Success Criteria

- ✅ All 404 pages display custom playlist page
- ✅ Splash screen shows for 2-3 seconds
- ✅ Smooth transition to playlist view
- ✅ Lyrics sync with music playback
- ✅ Active lyric line highlighted correctly
- ✅ Track list updates as songs change
- ✅ Playback state persists across page loads
- ✅ Works in both light and dark mode
- ✅ Responsive on mobile devices
- ✅ Auto-play works (or shows fallback)

## Future Enhancements (Out of Scope)

- Skip to next/previous track controls
- Volume control
- Shuffle/repeat options
- Share current track
- Add to user's Spotify library
- Social sharing features
