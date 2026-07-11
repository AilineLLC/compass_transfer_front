'use client';

import { Check, CheckCheck, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@shared/ui/forms/button';
import { Textarea } from '@shared/ui/forms/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/modals/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import type { ChatMessageDTO } from '@entities/chat/interface';
import { formatChatDateTime, formatMessageMeta } from '../utils/format-chat-time';

interface MessageBubbleProps {
  message: ChatMessageDTO;
  isOwn: boolean;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MessageBubble({ message, isOwn, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className='max-w-[70%] rounded-2xl bg-muted px-4 py-2 text-sm italic text-muted-foreground'>
          Сообщение удалено
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!draft.trim() || draft === message.content) {
      setIsEditing(false);
      setDraft(message.content ?? '');
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message.id, draft.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(message.id);
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[70%] rounded-2xl px-4 py-2 pr-8 text-sm shadow-sm ${
          isOwn ? 'bg-[#0047FF] text-white' : 'bg-[#5B6273] text-white'
        }`}
      >
        {isOwn && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='absolute right-1 top-1 rounded-full bg-black/25 p-1 text-white shadow-sm transition-colors hover:bg-black/40'
                aria-label='Действия с сообщением'
              >
                <MoreHorizontal className='h-4 w-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className='mr-2 h-4 w-4' />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsConfirmingDelete(true)} className='text-red-600'>
                <Trash2 className='mr-2 h-4 w-4' />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isEditing ? (
          <div className='flex min-w-[220px] flex-col gap-2'>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className='min-h-[60px] bg-white text-foreground'
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setDraft(message.content ?? '');
                }
              }}
            />
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => {
                  setIsEditing(false);
                  setDraft(message.content ?? '');
                }}
              >
                Отмена
              </Button>
              <Button type='button' size='sm' disabled={isSaving} onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className='whitespace-pre-wrap break-words'>{message.content}</p>
            <div className='mt-1 flex items-center justify-end gap-1.5'>
              {message.updatedAt !== message.createdAt && (
                <span className='text-[11px] italic leading-none text-white/60'>изменено</span>
              )}
              <span
                className='text-[11px] leading-none text-white/70'
                title={formatChatDateTime(message.createdAt)}
              >
                {formatMessageMeta(message.createdAt)}
              </span>
              {isOwn && (
                message.isRead ? (
                  <CheckCheck className='h-3.5 w-3.5 shrink-0 text-sky-300' aria-label='Прочитано' />
                ) : (
                  <Check className='h-3.5 w-3.5 shrink-0 text-white/60' aria-label='Отправлено' />
                )
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={isConfirmingDelete} onOpenChange={open => !isDeleting && setIsConfirmingDelete(open)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Удалить сообщение?</DialogTitle>
            <DialogDescription>
              Сообщение будет помечено как удалённое для вас и собеседника. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={isDeleting}
              onClick={() => setIsConfirmingDelete(false)}
            >
              Отмена
            </Button>
            <Button type='button' variant='destructive' disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
