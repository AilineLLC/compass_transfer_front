'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@shared/ui/forms/button';
import { Textarea } from '@shared/ui/forms/textarea';

interface MessageInputProps {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
}

export function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasDisabledRef = useRef(false);

  // Пока идёт отправка, родитель прокидывает disabled=true — textarea реально
  // становится disabled и браузер снимает с неё фокус. Как только disabled
  // снова станет false (запрос завершился), возвращаем фокус обратно.
  useEffect(() => {
    if (wasDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    wasDisabledRef.current = !!disabled;
  }, [disabled]);

  const handleSend = async () => {
    const content = value.trim();

    if (!content || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(content);
      setValue('');
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className='flex items-end gap-2 border-t bg-white p-4'>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder='Введите сообщение...'
        disabled={disabled}
        className='min-h-[44px] max-h-40 flex-1 resize-none'
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button
        type='button'
        size='icon'
        className='bg-[#0047FF] hover:bg-[#0047FF]/90'
        disabled={disabled || isSending || !value.trim()}
        onClick={handleSend}
        aria-label='Отправить'
      >
        <Send className='h-4 w-4' />
      </Button>
    </div>
  );
}
