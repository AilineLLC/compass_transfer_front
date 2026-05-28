'use client';

import { useCallback, useRef } from 'react';

/**
 * Хук для воспроизведения звуковых уведомлений
 */
export function useNotificationSound({ loop = true }: { loop?: boolean } = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.wav');

      audio.volume = 0.8;
      audio.loop = loop;
      audioRef.current = audio;
      // Browser autoplay policy may block this — ignore silently
      audio.play().catch(() => {});
    } catch {
      // Audio API unavailable — ignore
    }
  }, [loop]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  return {
    playSound,
    stopSound,
  };
}
