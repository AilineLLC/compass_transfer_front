import {
  Bell,
  Inbox,
  FileText,
  Car,
  Users,
  MapPin,
  Home,
  CreditCard,
  Settings,
  DollarSign,
} from 'lucide-react';
import { sidebarMockData } from '@entities/users/mock-data';

// Mock data from entities
export const sidebarData = {
  ...sidebarMockData,
  teams: [
    {
      name: 'Acme Inc',
      logo: Inbox,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: Car,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Users,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Дашборд',
      url: '/',
      icon: Home,
      items: [
        {
          title: 'Обзор',
          url: '/',
        },
        {
          title: 'Статистика',
          url: '/statistics',
        },
        {
          title: 'Аналитика',
          url: '/analytics',
        },
      ],
    },
    {
      title: 'Заказы',
      url: '/orders',
      icon: FileText,
      items: [
        {
          title: 'Все заказы',
          url: '/orders',
        },
        {
          title: 'Мгновенные',
          url: '/orders?type=Instant',
        },
        {
          title: 'Запланированные',
          url: '/orders?type=Scheduled',
        },
        {
          title: 'Создать заказ',
          url: '/orders/create',
        },
      ],
    },
    {
      title: 'Пользователи',
      url: '/users',
      icon: Users,
      items: [
        {
          title: 'Все пользователи',
          url: '/users',
        },
        {
          title: 'Администраторы',
          url: '/users?role=Admin',
        },
        {
          title: 'Водители',
          url: '/users?role=Driver',
        },
        {
          title: 'Пассажиры',
          url: '/users?role=Customer',
        },
        {
          title: 'Операторы',
          url: '/users?role=Operator',
        },
        {
          title: 'Контр-агенты',
          url: '/users?role=Partner',
        },
        {
          title: 'Терминалы',
          url: '/users?role=Terminal',
        },
        {
          title: 'Создать пользователя',
          url: '/users/create',
        },
      ],
    },
    {
      title: 'Автомобили',
      url: '/cars',
      icon: Car,
      items: [
        {
          title: 'Все автомобили',
          url: '/cars',
        },
        {
          title: 'Доступные',
          url: '/cars?status=Available',
        },
        {
          title: 'На обслуживании',
          url: '/cars?status=Maintenance',
        },
        {
          title: 'В ремонте',
          url: '/cars?status=Repair',
        },
        {
          title: 'Создать автомобиль',
          url: '/cars/create',
        },
      ],
    },
    {
      title: 'Уведомления',
      url: '/notifications',
      icon: Bell,
      items: [
        {
          title: 'Все уведомления',
          url: '/notifications',
        },
        {
          title: 'Непрочитанные',
          url: '/notifications?isRead=false',
        },
        {
          title: 'Прочитанные',
          url: '/notifications?isRead=true',
        },
        {
          title: 'Создать уведомление',
          url: '/notifications/create',
        },
      ],
    },
  ],
  documents: [
    {
      name: 'Тарифы',
      url: '/tariffs',
      icon: CreditCard,
      items: [
        {
          title: 'Все тарифы',
          url: '/tariffs',
        },
        {
          title: 'Активные',
          url: '/tariffs?archived=false',
        },
        {
          title: 'Архивные',
          url: '/tariffs?archived=true',
        },
        {
          title: 'Создать тариф',
          url: '/tariffs/create',
        },
      ],
    },
    {
      name: 'Локации',
      url: '/locations',
      icon: MapPin,
      items: [
        {
          title: 'Все локации',
          url: '/locations',
        },
        {
          title: 'Активные',
          url: '/locations?isActive=true',
        },
        {
          title: 'Неактивные',
          url: '/locations?isActive=false',
        },
        {
          title: 'Создать локацию',
          url: '/locations/create',
        },
      ],
    },
    {
      name: 'Услуги',
      url: '/services',
      icon: Settings,
      items: [
        {
          title: 'Все услуги',
          url: '/services',
        },
        {
          title: 'Количественные',
          url: '/services?isQuantifiable=true',
        },
        {
          title: 'Фиксированные',
          url: '/services?isQuantifiable=false',
        },
        {
          title: 'Создать услугу',
          url: '/services/create',
        },
      ],
    },
    {
      name: 'Платежи',
      url: '/payments',
      icon: DollarSign,
      items: [
        {
          title: 'Все платежи',
          url: '/payments',
        },
        {
          title: 'Завершенные',
          url: '/payments?status=Completed',
        },
        {
          title: 'В обработке',
          url: '/payments?status=Processing',
        },
        {
          title: 'Ожидание',
          url: '/payments?status=Pending',
        },
        {
          title: 'Ошибки',
          url: '/payments?status=Failed',
        },
      ],
    },
  ],
  drivers: [
    {
      id: 1,
      name: 'Алексей Петров',
      phone: '+996 555 123 456',
      carNumber: '01KG123A',
    },
    {
      id: 2,
      name: 'Михаил Иванов',
      phone: '+996 555 234 567',
      carNumber: '01KG456B',
    },
    {
      id: 3,
      name: 'Дмитрий Сидоров',
      phone: '+996 555 345 678',
      carNumber: '01KG789C',
    },
    {
      id: 4,
      name: 'Сергей Козлов',
      phone: '+996 555 456 789',
      carNumber: '01KG012D',
    },
  ],
};
