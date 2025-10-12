'use client';

import { User, Mail, Phone, MessageCircle, Send } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { formatPhoneNumber } from '@entities/my-profile/lib/profile-helpers';
import type { AnyUserProfile } from '@entities/users/ui/profile-sections/types';

interface BasicInfoSectionProps {
  profile: AnyUserProfile;
}

// Функции для обработки кликов
const handleEmailClick = (email: string) => {
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
};

const handlePhoneCall = (phoneNumber: string) => {
  window.open(`tel:${phoneNumber}`, '_self');
};

const handleWhatsAppClick = (phoneNumber: string) => {
  // Убираем все символы кроме цифр и добавляем код страны если нужно
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappNumber = cleanNumber.startsWith('996') ? cleanNumber : `996${cleanNumber}`;

  window.open(`https://wa.me/${whatsappNumber}`, '_blank');
};

const handleTelegramClick = (phoneNumber: string) => {
  // Убираем все символы кроме цифр и добавляем код страны если нужно
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const telegramNumber = cleanNumber.startsWith('996') ? cleanNumber : `996${cleanNumber}`;

  window.open(`https://t.me/+${telegramNumber}`, '_blank');
};

export function BasicInfoSection({ profile }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          Контактная информация
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Полное имя</label>
            <p className='text-sm'>{profile.fullName}</p>
          </div>

          <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Email</label>
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <Button
                variant='link'
                className='p-0 h-auto text-sm font-mono text-left justify-start hover:text-blue-600'
                onClick={() => handleEmailClick(profile.email)}
              >
                {profile.email}
              </Button>
            </div>
          </div>

          {profile.phoneNumber && (
            <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Телефон</label>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <p className='text-sm'>{formatPhoneNumber(profile.phoneNumber)}</p>
                </div>
                <div className='flex flex-wrap gap-1 sm:gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 sm:h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none min-w-0'
                    onClick={() => handlePhoneCall(profile.phoneNumber!)}
                  >
                    <Phone className='h-3 w-3 sm:mr-1' />
                    <span className='hidden sm:inline ml-1'>Позвонить</span>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 sm:h-8 px-2 sm:px-3 text-xs text-green-600 border-green-200 hover:bg-green-50 flex-1 sm:flex-none min-w-0'
                    onClick={() => handleWhatsAppClick(profile.phoneNumber!)}
                  >
                    <MessageCircle className='h-3 w-3 sm:mr-1' />
                    <span className='hidden sm:inline ml-1'>WhatsApp</span>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 sm:h-8 px-2 sm:px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none min-w-0'
                    onClick={() => handleTelegramClick(profile.phoneNumber!)}
                  >
                    <Send className='h-3 w-3 sm:mr-1' />
                    <span className='hidden sm:inline ml-1'>Telegram</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
