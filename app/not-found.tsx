"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SplashScreen from '@/components/SplashScreen';
import PlaylistView from '@/components/PlaylistView';
import Footer from '@/components/Footer';
import type { Track, SyncedLyrics } from '@/types/playlist';

export default function NotFound() {
  const [showSplash, setShowSplash] = useState(true);
  const [allLyrics, setAllLyrics] = useState<Map<string, SyncedLyrics>>(new Map());
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load playlist tracks and lyrics
    async function loadData() {
      try {
        // Load playlist tracks (local version)
        const tracksResponse = await fetch('/data/playlist-tracks-local.json');
        if (!tracksResponse.ok) {
          throw new Error('Failed to load playlist tracks');
        }
        const tracksData: Track[] = await tracksResponse.json();
        setTracks(tracksData);

        // Load all lyrics files
        const lyricsMap = new Map<string, SyncedLyrics>();

        for (const track of tracksData) {
          try {
            const response = await fetch(`/data/lyrics/${track.id}.json`);
            if (response.ok) {
              const lyrics: SyncedLyrics = await response.json();
              lyricsMap.set(track.id, lyrics);
            }
          } catch (error) {
            console.warn(`Failed to load lyrics for ${track.name}:`, error);
          }
        }

        setAllLyrics(lyricsMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load playlist data:', error);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--background)] text-[var(--foreground)]">
      {/* Splash Screen Message - Fades out after delay */}
      {(isLoading || showSplash) && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Playlist View - Fades in after splash */}
      {!isLoading && !showSplash && <PlaylistView tracks={tracks} allLyrics={allLyrics} showLogoAndFooter={false} />}

      {/* Logo - Always visible on top (matches page.tsx positioning) */}
      <div className="h-[30px] fixed top-0 left-0 z-[60]">
        <Image
          className="h-[100px] w-auto mt-5 ml-2.5 logo-switch"
          src="/images/logo-joelcolombo.gif"
          alt="Hey!"
          width={100}
          height={100}
          unoptimized
        />
        <Image
          className="h-[100px] w-auto mt-5 ml-2.5 logo-switch-dark"
          src="/images/logo-joelcolombo-dark.gif"
          alt="Hey!"
          width={100}
          height={100}
          unoptimized
        />
      </div>

      {/* Footer - Always visible on top (matches page.tsx) */}
      <div className="z-[60] relative">
        <Footer />
      </div>
    </div>
  );
}
