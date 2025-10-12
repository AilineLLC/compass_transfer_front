'use client';

import {
  ArrowLeft,
  Check,
  AlertTriangle,
  X,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardTitle } from '@shared/ui/layout/card';
import { SidebarFooter } from '@shared/ui/layout/sidebar';

export interface FormChapter {
  id: string;
  title: string;
  description?: string;
}

/**
 * Компонент сайдбара для форм
 * @example
 * // С дополнительными пропсами
 * <FormSidebar
 *   onCreate={handleCreate}
 *   isSubmitting={isLoading}
 * />
 */
export function FormSidebar({
  title = 'Прогресс заполнения',
  chapters,
  getChapterStatus,
  getChapterErrors,
  activeChapter,
  onChapterClick,
  additionalInfo,
  onCreate,
  onUpdate,
  isSubmitting = false,
  onBack,
  createButtonText = 'Создать',
  updateButtonText = 'Обновить',
}: {
  title?: string;
  chapters?: readonly FormChapter[] | FormChapter[];
  getChapterStatus?: (chapterId: string) => 'error' | 'warning' | 'complete' | 'pending';
  getChapterErrors?: (chapterId: string) => string[];
  activeChapter?: string;
  onChapterClick?: (chapterId: string) => void;
  additionalInfo?: React.ReactNode;
  onCreate?: () => void;
  onUpdate?: () => void;
  isSubmitting?: boolean;
  onBack?: () => void;
  createButtonText?: string;
  updateButtonText?: string;
}) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // Если не в режиме формы или нет необходимых данных
  if (!chapters || !getChapterStatus) {
    return null;
  }

  // Функция для получения иконки статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className='h-3 w-3' />;
      case 'warning':
        return <AlertTriangle className='h-3 w-3' />;
      case 'error':
        return <X className='h-3 w-3' />;
      case 'pending':
      default:
        return <Circle className='h-3 w-3' />;
    }
  };

  // Функция для получения цветов статуса
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: 'text-emerald-600 dark:text-emerald-400',
          badge: 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600',
        };
      case 'warning':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-500 border-amber-500 hover:bg-amber-600',
        };
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-500 border-red-500 hover:bg-red-600',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-500 dark:text-gray-400',
          badge: 'bg-gray-400 border-gray-400 hover:bg-gray-500',
        };
    }
  };

  return (
    <Card className='h-full flex flex-col border-0'>
      <CardContent className='flex-1 flex flex-col gap-4 px-0 pl-4 py-0 overflow-hidden'>
        {/* Заголовок */}
        <div className='flex items-center justify-between flex-shrink-0'>
          <CardTitle className='text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'>
            {title}
          </CardTitle>
          {onBack && (
            <Button
              variant='outline'
              size='sm'
              onClick={onBack}
              className='h-9 px-3 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-visible:ring-0 focus:ring-0 focus:shadow-md transition-all duration-200'
            >
              <ArrowLeft className='h-4 w-4 mr-2' /> Назад
            </Button>
          )}
        </div>

        {/* Список глав */}
        <div className='flex-1 overflow-y-auto space-y-2 pr-2'>
          {chapters.map((chapter, index) => {
            const status = getChapterStatus(chapter.id);
            const colors = getStatusColors(status);
            const isActive = activeChapter === chapter.id;

            const isLastChapter = index === chapters.length - 1;
            const isExpanded = expandedChapter === chapter.id;
            const hasErrorsOrWarnings = status === 'error' || status === 'warning';
            const chapterErrors = getChapterErrors ? getChapterErrors(chapter.id) : [];

            const handleChapterClick = () => {
              // Упрощаем логику: раскрываем если есть ошибки/предупреждения
              if (hasErrorsOrWarnings) {
                setExpandedChapter(isExpanded ? null : chapter.id);
              } else {
                onChapterClick?.(chapter.id);
              }
            };

            return (
              <div
                key={chapter.id}
                className={`group relative rounded-lg border transition-all duration-200 ${
                  isActive
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                } ${isExpanded ? '' : ''}`}
                style={isLastChapter ? { marginBottom: '1rem' } : {}}
              >
                <div
                  className='flex items-center gap-2 p-2 cursor-pointer'
                  onClick={handleChapterClick}
                >
                  {/* Номер главы */}
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
                      isActive
                        ? colors.badge + ' text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Содержимое */}
                  <div className='flex-1 min-w-0'>
                    <h3
                      className={`font-medium text-xs truncate ${
                        isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {chapter.title}
                    </h3>
                    {chapter.description && (
                      <p
                        className={`text-xs mt-0.5 truncate opacity-70 ${
                          isActive
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {chapter.description}
                      </p>
                    )}
                  </div>

                  {/* Статус иконка */}
                  <div
                    className={`flex items-center justify-center w-4 h-4 transition-colors ${
                      colors.icon
                    }`}
                  >
                    {getStatusIcon(status)}
                  </div>

                  {/* Иконка раскрытия */}
                  {hasErrorsOrWarnings && (
                    <div className='flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors'>
                      {isExpanded ? (
                        <ChevronUp className='h-3 w-3' />
                      ) : (
                        <ChevronDown className='h-3 w-3' />
                      )}
                    </div>
                  )}
                </div>

                {/* Прогресс бар */}
                <div className='h-1 bg-gray-100 dark:bg-gray-700 rounded-b-lg overflow-hidden'>
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === 'complete'
                        ? 'w-full bg-emerald-500'
                        : status === 'warning'
                          ? 'w-3/4 bg-amber-500'
                          : status === 'error'
                            ? 'w-1/2 bg-red-500'
                            : 'w-1/4 bg-gray-400'
                    }`}
                  />
                </div>

                {/* Детали ошибок */}
                {isExpanded && chapterErrors.length > 0 && (
                  <div className='px-2 pb-2 pt-1 border-t border-gray-200 dark:border-gray-700'>
                    <div className='space-y-1'>
                      {chapterErrors.map((error, errorIndex) => (
                        <div
                          key={errorIndex}
                          className='flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400'
                        >
                          <X className='h-3 w-3 mt-0.5 flex-shrink-0' />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Дополнительная информация */}
        {additionalInfo && (
          <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>{additionalInfo}</div>
        )}
      </CardContent>
      {/* Кнопка создания */}
      {onCreate && (
        <SidebarFooter className='py-0 pt-4 px-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r'>
          <Button
            onClick={onCreate}
            disabled={isSubmitting}
            size='lg'
            className='w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-300 text-white font-semibold'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                Создание...
              </>
            ) : (
              <>
                <Check className='h-5 w-5 mr-2' />
                {createButtonText}
              </>
            )}
          </Button>
        </SidebarFooter>
      )}
      {/* Кнопка обновления */}
      {onUpdate && (
        <SidebarFooter className='py-0 pt-4 px-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r'>
          <Button
            onClick={onUpdate}
            disabled={isSubmitting}
            size='lg'
            className='w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition-all duration-300 text-white font-semibold'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                Обновление...
              </>
            ) : (
              <>
                <Check className='h-5 w-5 mr-2' />
                {updateButtonText}
              </>
            )}
          </Button>
        </SidebarFooter>
      )}
    </Card>
  );
}
