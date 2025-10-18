// Media URL configuration based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalHost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

// Base URLs for different environments
const PRODUCTION_BASE_URL = 'https://play.joelcolombo.co/404';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/joelcolombo/hey/main/public/data';

export const getMediaUrls = () => {
  // For local development, use local files
  if (isDevelopment || isLocalHost) {
    return {
      songs: '/api/media?type=song&id=',
      covers: '/api/media?type=cover&id=',
      lyrics: '/api/media?type=lyrics&id='
    };
  }

  // For production, use external URLs
  return {
    songs: `${PRODUCTION_BASE_URL}/songs/`,
    covers: `${GITHUB_RAW_BASE}/covers/`,
    lyrics: `${GITHUB_RAW_BASE}/lyrics/`
  };
};

// Get the correct URL for a media file
export const getMediaUrl = (type: 'song' | 'cover' | 'lyrics', id: string, filename?: string) => {
  const urls = getMediaUrls();

  if (isDevelopment || isLocalHost) {
    // Use API route for local development
    return `${urls[type + 's']}${id}`;
  }

  // For production, we need the actual filename
  if (!filename) {
    console.error(`Filename required for production URL: ${type} ${id}`);
    return '';
  }

  // Direct URL to the file
  return `${urls[type + 's']}${filename}`;
};