'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Компонент видеоплеера с автозапуском при неактивности
 * - Автозапуск видео через 20 секунд неактивности
 * - Видео зацикливается пока пользователь не активен
 * - Клик по видео или Escape останавливает
 */
export const IdleVideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isVideoPlayingRef = useRef(false); // актуальное состояние воспроизведения
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const startVideoRef = useRef<(() => Promise<void>) | null>(null);

  // Время неактивности в миллисекундах (10 секунд)
  const IDLE_TIME = 20 * 1000;

  // Сброс таймера неактивности
  const resetIdleTimer = useCallback(() => {
    
    // Обновляем время последней активности
    lastActivityRef.current = Date.now();
    
    // КРИТИЧНО: НЕ останавливаем видео автоматически!
    // Видео останавливается только по явным действиям пользователя
    
    // Очищаем предыдущий таймер
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // Устанавливаем новый таймер только если видео НЕ играет
    if (!isVideoPlaying) {
      idleTimerRef.current = setTimeout(() => {
        startVideoRef.current?.(); // Используем ref вместо прямого вызова
      }, IDLE_TIME);
    }
  }, [IDLE_TIME]);

  // Запуск видео
  const startVideo = useCallback(async () => {
    
    if (!videoRef.current) {
      return;
    }

    try {
      setIsVideoPlaying(true);
      isVideoPlayingRef.current = true;
      
      // Сбрасываем на начало
      videoRef.current.currentTime = 0;
      
      // Запускаем видео
      await videoRef.current.play();
      
      // Полноэкранный режим отключён – браузер требует жест пользователя
      // if (videoRef.current.requestFullscreen) {
      //   await videoRef.current.requestFullscreen();
      //   console.log('✅ Полноэкранный режим');
      // }
    } catch (error) {
      console.error('❌ Ошибка запуска:', error);
      setIsVideoPlaying(false);
    }
  }, []);

  // Сохраняем ссылку на startVideo
  startVideoRef.current = startVideo;

  // Остановка видео по клику
  const stopVideo = useCallback(async (event?: React.MouseEvent) => {
    
    if (!videoRef.current) {
      return;
    }

    try {
      // Выход из полноэкранного режима
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // Останавливаем видео
      videoRef.current.pause();
      setIsVideoPlaying(false);
      isVideoPlayingRef.current = false;
      
      // ВАЖНО: Перезапускаем таймер неактивности после остановки
      // Используем setTimeout чтобы дать время React обновить состояние
      setTimeout(() => {
        resetIdleTimer();
      }, 100);
      
    } catch (error) {
      console.error('❌ Ошибка остановки:', error);
      setIsVideoPlaying(false);
    }
  }, [resetIdleTimer]);

  // Отслеживание активности пользователя
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleUserActivity = (event: Event) => {
      if (isVideoPlayingRef.current) {

        return;
      }
      
      // Игнорируем события от самого видео (дополнительная защита)
      const target = event.target as Element;

      if (target && videoRef.current && 
          (target === videoRef.current || videoRef.current.contains(target))) {

        return;
      }
      
      resetIdleTimer();
    };

    // Добавляем слушатели событий
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Запускаем начальный таймер только если видео НЕ играет
    if (!isVideoPlaying) {
      resetIdleTimer();
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Обработчик клавиши Escape для остановки видео
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVideoPlaying) {
        stopVideo();
      }
    };

    // Обработчик выхода из полноэкранного режима
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isVideoPlaying) {
        stopVideo();
      }
    };

    if (isVideoPlaying) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isVideoPlaying, stopVideo]);

  return (
    <>
      {/* Blur фон с обработчиком клика */}
      {isVideoPlaying && (
        <div 
          className="fixed inset-0 w-full h-full cursor-pointer"
          style={{
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 45, // Выше кнопок языков (z-40), но ниже видео (z-index: 50)
          }}
          onClick={stopVideo} // Клик по оверлею = остановка видео
          title="Кликните для остановки видео"
        />
      )}
      
      {/* Видео элемент */}
      <video
        ref={videoRef}
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          w-[80vw] h-[60vh] object-cover bg-black cursor-pointer rounded-lg shadow-2xl
          ${isVideoPlaying ? 'block' : 'hidden'}
        `}
        style={{ zIndex: 50 }}
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/video/video.mp4`}
        loop
        playsInline
        controls={false} // Убираем встроенные контролы
        onClick={(e) => {
          e.stopPropagation(); // Предотвращаем всплытие события
          stopVideo();
        }}
        title="Кликните для остановки видео (или нажмите Escape)"
      /> 
    </>
  );
}; 