# Spotify Playback SDK Setup & Troubleshooting

This document explains how to set up and troubleshoot the Spotify Playback SDK integration.

## Prerequisites

1. **Spotify Premium Account** - Required for playback functionality
2. **Spotify Developer App** - Create at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Setup Instructions

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the details:
   - **App Name**: Your app name (e.g., "Joel Colombo Portfolio")
   - **App Description**: Brief description
   - **Redirect URIs**: Add your callback URLs:
     - Local: `http://localhost:3000/api/auth/spotify/callback`
     - Production: `https://yourdomain.com/api/auth/spotify/callback`
4. Save and note your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_PLAYLIST_ID=your_playlist_id_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

### 3. Important Spotify App Settings

In your Spotify Developer Dashboard, under app settings:

1. **Redirect URIs** must EXACTLY match your `SPOTIFY_REDIRECT_URI` environment variable
2. **APIs used**: Ensure "Web Playback SDK" is enabled
3. **Users**: For development mode, you may need to add users to the allowlist

## Common Issues & Solutions

### Issue: "Authentication Error" or 401 Status

**Causes:**
- Token has expired
- Client credentials are incorrect
- Redirect URI mismatch

**Solutions:**
1. Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` match your Spotify app
2. Verify redirect URI in Spotify Dashboard exactly matches your env variable
3. Try logging out and logging in again
4. Check browser console for specific error messages

### Issue: "Premium Account Required" or 403 Status

**Cause:** Playback SDK requires Spotify Premium

**Solutions:**
1. Ensure you're logged in with a Spotify Premium account
2. The free tier only allows 30-second previews

### Issue: "Device Not Found" or 404 Status

**Causes:**
- Player hasn't initialized yet
- Browser doesn't support Web Playback SDK
- Network connectivity issues

**Solutions:**
1. Wait a few seconds for the player to initialize
2. Check browser console for "Player ready with device ID" message
3. Refresh the page
4. Try a different browser (Chrome, Firefox, Edge recommended)
5. Ensure browser is not blocking scripts

### Issue: Spotify SDK Not Loading

**Causes:**
- Script blocked by ad blocker
- Content Security Policy issues
- Network issues

**Solutions:**
1. Disable ad blockers for your site
2. Check browser console for script loading errors
3. Verify `https://sdk.scdn.co/spotify-player.js` is loaded in Network tab
4. Check for CSP errors in console

### Issue: Playback Starts But Then Stops

**Causes:**
- Token expired during playback
- Network interruption
- Spotify account being used on another device

**Solutions:**
1. Token refresh should happen automatically - check console logs
2. Ensure stable internet connection
3. Make sure you're not playing music on another Spotify device

## Debugging Steps

### 1. Check Browser Console

Open DevTools (F12) and look for:
- ✅ "Spotify SDK ready"
- ✅ "Player ready with device ID: xxx"
- ❌ Any error messages in red

### 2. Verify Environment Variables

In your terminal:
```bash
# Check if variables are set
echo $SPOTIFY_CLIENT_ID
echo $SPOTIFY_REDIRECT_URI
```

Or add temporary logging in your code to verify values are loaded.

### 3. Test API Endpoints

1. **Login Flow**: Visit `/api/auth/spotify/login`
   - Should redirect to Spotify authorization
   - After approval, should redirect back with tokens

2. **Token Refresh**: Check Network tab for POST to `/api/auth/spotify/token`
   - Should return new access_token
   - Status should be 200

### 4. Check Spotify Developer Dashboard

1. Go to your app in the dashboard
2. Check "Users and Access" to see recent activity
3. Look for any API errors or rate limiting

## API Endpoints

- **Login**: `GET /api/auth/spotify/login`
  - Redirects to Spotify authorization

- **Callback**: `GET /api/auth/spotify/callback`
  - Exchanges code for access/refresh tokens
  - Redirects to `/404` with tokens

- **Token Refresh**: `POST /api/auth/spotify/token`
  - Body: `{ refresh_token: string }`
  - Returns new access token

## Useful Console Commands

```javascript
// Check if SDK is loaded
window.Spotify

// Check stored tokens
localStorage.getItem('spotify_access_token')
localStorage.getItem('spotify_refresh_token')

// Clear stored tokens (force re-login)
localStorage.removeItem('spotify_access_token')
localStorage.removeItem('spotify_refresh_token')
```

## Implementation Details

### Token Flow

1. User clicks "Login with Spotify"
2. Redirected to Spotify authorization
3. User approves permissions
4. Spotify redirects back to callback endpoint
5. Callback exchanges code for access + refresh tokens
6. Tokens stored in localStorage and state
7. Spotify Web Playback SDK initialized with access token
8. Player connects and registers device
9. Playback commands sent to Spotify API with device_id

### Token Refresh

- Access tokens expire after 1 hour
- When authentication error occurs, hook automatically calls refresh endpoint
- New access token stored and used for subsequent requests
- If refresh fails, user is logged out and must re-authenticate

## Testing Checklist

- [ ] Can click "Login with Spotify" and authorize
- [ ] Redirected back to /404 after authorization
- [ ] See "Initializing Spotify Player..." message
- [ ] Player loads and shows playlist
- [ ] Can play/pause tracks
- [ ] Can select different tracks
- [ ] Lyrics sync with playback
- [ ] Token refresh works after 1 hour (check console logs)
- [ ] Error messages display appropriately

## Resources

- [Spotify Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Spotify API Reference](https://developer.spotify.com/documentation/web-api/reference)
