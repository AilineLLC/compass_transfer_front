'use client';

import { useCallback, useRef } from 'react';
import { toast } from '@shared/lib/conditional-toast';

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
      
      // Воспроизводим звук
      audio.play().catch((error) => {
        toast.error('Не удалось воспроизвести звук уведомления:', error);
      });
    } catch {
      toast.error('Ошибка при создании аудио:');
    }
  }, []);

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
