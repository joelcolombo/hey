"use client";

import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function TestAudioPage() {
  const [timeUpdates, setTimeUpdates] = useState<number[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const {
    isReady,
    isPlaying,
    currentTime,
    play,
    pause,
    audioRef
  } = useAudioPlayer({
    audioUrl: '/api/media?id=st-look&type=song',
    onTimeUpdate: (timeMs) => {
      const now = Date.now();
      console.log('🎵 onTimeUpdate callback fired:', timeMs.toFixed(0), 'ms');
      setTimeUpdates(prev => [...prev.slice(-9), timeMs]);
      setLastUpdateTime(now);
    },
    onReady: () => {
      console.log('✅ Audio ready!');
    },
    onError: (error) => {
      console.error('❌ Audio error:', error);
    }
  });

  useEffect(() => {
    if (audioRef.current) {
      console.log('📊 Audio element info:', {
        readyState: audioRef.current.readyState,
        duration: audioRef.current.duration,
        currentTime: audioRef.current.currentTime,
        paused: audioRef.current.paused,
        src: audioRef.current.src
      });
    }
  }, [currentTime, audioRef]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Audio Player Debug Test</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Audio Status</h2>
          <p>Ready: {isReady ? '✅' : '❌'}</p>
          <p>Playing: {isPlaying ? '▶️' : '⏸️'}</p>
          <p>Current Time: {(currentTime / 1000).toFixed(2)}s</p>
          {audioRef.current && (
            <>
              <p>Audio Element Time: {audioRef.current.currentTime.toFixed(2)}s</p>
              <p>Ready State: {audioRef.current.readyState}</p>
              <p>Duration: {audioRef.current.duration.toFixed(2)}s</p>
            </>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Controls</h2>
          <button
            onClick={play}
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            disabled={!isReady}
          >
            Play
          </button>
          <button
            onClick={pause}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Pause
          </button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Time Update Events (Last 10)</h2>
          <p className="text-sm text-gray-600 mb-2">
            Last update: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : 'Never'}
          </p>
          <div className="space-y-1">
            {timeUpdates.map((time, index) => (
              <div key={index} className="text-sm">
                {(time / 1000).toFixed(2)}s
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded bg-yellow-50">
          <h2 className="font-bold mb-2">⚠️ Debug Instructions</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open browser DevTools Console</li>
            <li>Click Play button</li>
            <li>Watch for timeupdate events in console</li>
            <li>Check if times are updating on screen</li>
            <li>If not updating, check console for errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}