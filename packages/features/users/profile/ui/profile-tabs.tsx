'use client';

import { User, Car, DollarSign } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';

export type ProfileTab = 'basic' | 'rides' | 'payments';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  hideMy?: boolean;
  showPayments?: boolean;
}

export function ProfileTabs({ activeTab, onTabChange, hideMy = false, showPayments = false }: ProfileTabsProps) {
  const tabs = [
    {
      id: 'basic' as ProfileTab,
      label: 'Основное',
      icon: User,
    },
    {
      id: 'rides' as ProfileTab,
      label: hideMy ? 'Поездки' : 'Мои поездки',
      icon: Car,
    },
    ...(showPayments ? [{
      id: 'payments' as ProfileTab,
      label: hideMy ? 'Платежи' : 'Мои платежи',
      icon: DollarSign,
    }] : []),
  ];

  return (
    <div className='flex gap-2 p-1 bg-gray-100 rounded-lg w-fit'>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isActive ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onTabChange(tab.id)}
            className={`gap-2 ${
              isActive
                ? 'bg-white shadow-sm text-gray-900 hover:bg-white hover:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <Icon className='h-4 w-4' />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
