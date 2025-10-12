'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserRole } from '@shared/contexts';
import { Button } from '@shared/ui/forms/button';
import { Role } from '@entities/users/enums';
import { OrderTypeSelectionModal } from '@features/orders';

export function CreateOrderButton() {
  const router = useRouter();
  const { userRole } = useUserRole();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateOrder = () => {
    if (userRole === Role.Partner) {
      // Для ВСЕХ партнеров сразу переходим на запланированные заказы
      router.push('/orders/create/scheduled');
    } else {
      // Для остальных ролей открываем модальное окно выбора типа заказа
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleCreateOrder}
        className='w-full md:w-auto focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
      >
        <Plus className='mr-2 h-4 w-4' />
        Создать заказ
      </Button>

      <OrderTypeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
