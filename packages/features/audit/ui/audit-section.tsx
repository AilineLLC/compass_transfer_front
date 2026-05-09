'use client';

import { useState } from 'react';
import { History, ChevronLeft, ChevronRight, Eye, User, AlertCircle } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { useUserRole } from '@shared/contexts/user-role-context';
import { AuditEntityType, useAuditEvents } from '@entities/audit';
import type { AuditEventDTO } from '@entities/audit';
import { Role } from '@entities/users/enums';
import { JsonDiffViewer } from './json-diff-viewer';

const eventTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  Created: { label: 'Создано', variant: 'default' },
  Updated: { label: 'Изменено', variant: 'secondary' },
  Deleted: { label: 'Удалено', variant: 'destructive' },
  Archived: { label: 'Архивировано', variant: 'outline' },
  Unarchived: { label: 'Разархивировано', variant: 'outline' },
  StatusChanged: { label: 'Статус изменён', variant: 'secondary' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function EventRow({ event, onExpand }: { event: AuditEventDTO; onExpand: () => void }) {
  const meta = eventTypeLabels[event.eventType] ?? { label: event.eventType, variant: 'outline' as const };

  return (
    <div className='flex items-start gap-3 py-3 border-b last:border-0'>
      <div className='flex-1 min-w-0 space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={meta.variant} className='text-xs'>{meta.label}</Badge>
          <span className='text-xs text-muted-foreground'>{formatDate(event.date)}</span>
        </div>
        {event.user && (
          <div className='flex items-center gap-1.5 text-sm'>
            <User className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
            <span className='font-medium truncate'>{event.user.fullName}</span>
            <span className='text-muted-foreground text-xs'>({event.user.role})</span>
          </div>
        )}
      </div>
      {event.jsonDiff !== null && event.jsonDiff !== undefined && (
        <Button variant='ghost' size='sm' className='h-7 px-2 shrink-0' onClick={onExpand}>
          <Eye className='h-3.5 w-3.5' />
        </Button>
      )}
    </div>
  );
}

function DiffModal({ event, onClose }: { event: AuditEventDTO; onClose: () => void }) {
  const meta = eventTypeLabels[event.eventType] ?? { label: event.eventType, variant: 'outline' as const };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
      <div
        className='bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-5 py-4 border-b'>
          <div className='flex items-center gap-2'>
            <History className='h-4 w-4 text-muted-foreground' />
            <span className='font-semibold text-sm'>Детали изменения</span>
            <Badge variant={meta.variant} className='text-xs'>{meta.label}</Badge>
          </div>
          <button
            className='text-muted-foreground hover:text-gray-900 text-lg leading-none'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='px-5 py-4 space-y-3 overflow-y-auto flex-1'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <span className='text-muted-foreground text-xs'>Дата</span>
              <p className='font-medium'>{formatDate(event.date)}</p>
            </div>
            {event.user && (
              <div>
                <span className='text-muted-foreground text-xs'>Пользователь</span>
                <p className='font-medium'>{event.user.fullName}</p>
                <p className='text-xs text-muted-foreground'>{event.user.email} · {event.user.role}</p>
              </div>
            )}
          </div>
          {event.jsonDiff !== null && event.jsonDiff !== undefined && (
            <div>
              <p className='text-xs font-medium text-muted-foreground mb-2'>Изменения</p>
              <JsonDiffViewer jsonDiff={event.jsonDiff} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AuditSectionProps {
  entityType: AuditEntityType;
  entityId: string;
}

export function AuditSection({ entityType, entityId }: AuditSectionProps) {
  const { userRole } = useUserRole();
  const [expandedEvent, setExpandedEvent] = useState<AuditEventDTO | null>(null);

  const canView = userRole === Role.Admin || userRole === Role.Operator;

  const { events, isLoading, isError, hasNext, hasPrevious, currentPage, goToNextPage, goToPrevPage } =
    useAuditEvents({ entityType, entityId }, canView && !!entityId);

  if (!canView) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <History className='h-4 w-4' />
            Журнал изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='space-y-1.5'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3.5 w-48' />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className='flex items-center gap-2 text-sm text-red-600'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              Не удалось загрузить журнал изменений
            </div>
          )}

          {!isLoading && !isError && events.length === 0 && (
            <p className='text-sm text-muted-foreground'>Изменений не найдено</p>
          )}

          {!isLoading && events.length > 0 && (
            <>
              <div>
                {events.map(event => (
                  <EventRow key={event.id} event={event} onExpand={() => setExpandedEvent(event)} />
                ))}
              </div>
              <div className='flex items-center justify-between pt-3'>
                <span className='text-xs text-muted-foreground'>Страница {currentPage}</span>
                <div className='flex gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 w-7 p-0'
                    disabled={!hasPrevious}
                    onClick={goToPrevPage}
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 w-7 p-0'
                    disabled={!hasNext}
                    onClick={goToNextPage}
                  >
                    <ChevronRight className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {expandedEvent && (
        <DiffModal event={expandedEvent} onClose={() => setExpandedEvent(null)} />
      )}
    </>
  );
}
