'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { usersApi } from '@shared/api/users';
import { logger } from '@shared/lib'
import { useSheet } from '@shared/lib/sheet-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/ui/layout/sidebar';
import { NavMain, NavDocuments } from '@entities/navigation';
import { NavUser } from '@entities/users';
import { Role, ActivityStatus } from '@entities/users/enums';
import { useSelfUser } from '@entities/users/hooks/useSelfUser';
import type { GetUserSelfProfileDTO, GetDriverDTO } from '@entities/users/interface';
import { getRoleDisplayName } from '@entities/users/utils';
import { useDrivers, type SidebarDriver } from '@widgets/sidebar/hooks';
import { sidebarData } from '@widgets/sidebar/mock-data';
import { DriverSheet } from './driver-sheet';
import { DriversList } from './drivers-list';
import { RefreshCw } from 'lucide-react';

// Функция для фильтрации пунктов меню в зависимости от роли
const filterMenuItemsByRole = (
  items: typeof sidebarData.navMain,
  userRole: Role,
  isMainSupportOperator: boolean,
) => {
  return items.filter(item => {
    // "Чат с водителями" — только у оператора с флагом isMainSupportOperator
    if (item.title === 'Чат с водителями') {
      return isMainSupportOperator;
    }

    // Для роли Operator убираем "Уведомления"
    if (userRole === Role.Operator && item.title === 'Уведомления') {
      return false;
    }

    // "Финансы" — только Admin и Operator
    if (item.title === 'Финансы' && userRole !== Role.Admin && userRole !== Role.Operator) {
      return false;
    }

    // Для роли Partner оставляем только "Заказы"
    if (userRole === Role.Partner) {
      return item.title === 'Заказы';
    }

    return true;
  });
};

// Функция для фильтрации документов в зависимости от роли
const filterDocumentsByRole = (items: typeof sidebarData.documents, userRole: Role) => {
  return items.filter(item => {
    // Для роли Partner скрываем все документы
    if (userRole === Role.Partner) {
      return false;
    }

    return true;
  });
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentUser?: {
    id: string;
    role: Role;
    email: string;
  } | null;
}

// Функция для создания объекта пользователя для NavUser
const createNavUserData = (currentUser: { id: string; role: Role; email: string }): GetUserSelfProfileDTO => {
  const baseUser = {
    id: currentUser.id,
    email: getRoleDisplayName(currentUser.role),
    fullName: currentUser.email.split('@')[0],
    phoneNumber: null,
    avatarUrl: null,
    online: true,
    lastActive: new Date().toISOString(),
    status: ActivityStatus.Active,
    locationId: null,
  };

  // Создаем объект с правильным профилем в зависимости от роли
  switch (currentUser.role) {
    case Role.Admin:
      return {
        ...baseUser,
        role: Role.Admin,
        profile: {
          accessLevel: 'USER',
          department: null,
          position: null
        }
      };
    case Role.Driver:
      return {
        ...baseUser,
        role: Role.Driver,
        profile: {
          licenseNumber: '',
          licenseCategories: [],
          licenseIssueDate: '',
          licenseExpiryDate: '',
          dateOfBirth: '',
          birthPlace: null,
          citizenship: '',
          citizenshipCountry: undefined,
          drivingExperience: null,
          languages: [],
          taxIdentifier: null,
          totalRides: 0,
          totalDistance: 0,
          lastRideDate: null,
          medicalExamDate: null,
          backgroundCheckDate: null,
          profilePhoto: null,
          preferredRideTypes: [],
          preferredWorkZones: undefined,
          trainingCompleted: false,
          passport: {
            number: '',
            series: '',
            issueDate: '',
            issuedBy: '',
            page: null,
            expiryDate: '',
            identityType: undefined
          },
          workExperience: undefined,
          education: undefined,
          testScore: undefined
        }
      };
    case Role.Operator:
      return {
        ...baseUser,
        role: Role.Operator,
        profile: {
          employeeId: '',
          department: '',
          position: '',
          hireDate: ''
        }
      };
    case Role.Partner:
      return {
        ...baseUser,
        role: Role.Partner,
        profile: {
          companyName: '',
          companyType: undefined,
          registrationNumber: null,
          taxIdentifier: null,
          legalAddress: '',
          contactEmail: null,
          contactPhone: null,
          website: null,
          partnerRoutes: undefined
        }
      };
    case Role.Terminal:
      return {
        ...baseUser,
        role: Role.Terminal,
        profile: {
          terminalId: '',
          ipAddress: null,
          deviceModel: null,
          osVersion: null,
          appVersion: null,
          browserInfo: null,
          screenResolution: null,
          deviceIdentifier: null
        }
      };
    case Role.Customer:
      return {
        ...baseUser,
        role: Role.Customer,
        profile: {
          registrationDate: '',
          totalOrders: 0,
          favoriteAddresses: [],
          paymentMethods: [],
          rating: 0
        }
      };
    default:
      // Fallback для неизвестных ролей - используем Customer как базовый тип
      return {
        ...baseUser,
        role: Role.Customer,
        profile: {
          registrationDate: new Date().toISOString(),
          totalOrders: 0,
          favoriteAddresses: [],
          paymentMethods: [],
          rating: 0
        }
      };
  }
};

// Гостевой пользователь (используем Customer как базовый тип)
const guestUser: GetUserSelfProfileDTO = {
  id: 'guest',
  email: 'Гость',
  fullName: 'Гость',
  role: Role.Customer,
  phoneNumber: null,
  avatarUrl: null,
  online: false,
  lastActive: new Date().toISOString(),
  status: ActivityStatus.Inactive,
  locationId: null,
  profile: {
    registrationDate: new Date().toISOString(),
    totalOrders: 0,
    favoriteAddresses: [],
    paymentMethods: [],
    rating: 0
  }
};

export function AppSidebar({ currentUser, ...props }: AppSidebarProps) {
  const userRole = currentUser ? currentUser.role : Role.Unknown;

  // Флаг главного оператора поддержки — определяет доступ к разделу "Чат с водителями"
  const { data: selfUser } = useSelfUser({ enabled: userRole === Role.Operator });
  const isMainSupportOperator = userRole === Role.Operator && selfUser?.isMainSupportOperator === true;

  // Фильтруем пункты меню в зависимости от роли пользователя
  const filteredNavMain = filterMenuItemsByRole(sidebarData.navMain, userRole, isMainSupportOperator);
  const filteredDocuments = filterDocumentsByRole(sidebarData.documents, userRole);

  // Определяем, нужно ли показывать список водителей для данной роли
  const shouldShowDrivers = ![Role.Partner, Role.Driver, Role.Customer].includes(userRole);

  // Получаем данные водителей только если нужно их показывать
  const { drivers, loading, refetch, error } = useDrivers(shouldShowDrivers);
  const [selectedDriver, setSelectedDriver] = React.useState<SidebarDriver | null>(null);
  const [fullDriverData, setFullDriverData] = React.useState<GetDriverDTO | null>(null);
  const [activeDriverCategory, setActiveDriverCategory] = React.useState('main');
  const [activeOrderType, setActiveOrderType] = React.useState('scheduled');
  const [_loadingDriverData, setLoadingDriverData] = React.useState(false);

  const { openSheet, closeSheet, isSheetOpen } = useSheet();

  // Функция для загрузки полных данных драйвера
  const loadFullDriverData = React.useCallback(async (driverId: string) => {
    try {
      setLoadingDriverData(true);
      const driverData = await usersApi.getDriver(driverId);

      setFullDriverData(driverData);
    } catch (error) {
      logger.error('Ошибка при загрузке данных драйвера:', error);
      setFullDriverData(null);
    } finally {
      setLoadingDriverData(false);
    }
  }, []);

  const openDriverSheet = (driver: SidebarDriver) => {
    // Если открываем того же водителя, просто переключаем состояние
    if (selectedDriver?.id === driver.id) {
      if (isSheetOpen('driver')) {
        closeSheet();
      } else {
        openSheet('driver');
      }
    } else {
      // Если открываем другого водителя, закрываем предыдущий и открываем новый
      setSelectedDriver(driver);
      setFullDriverData(null); // Сбрасываем предыдущие данные
      loadFullDriverData(driver.id); // Загружаем полные данные
      openSheet('driver');
      setActiveDriverCategory('main'); // Сбрасываем на основную категорию
    }
  };

  const closeDriverSheet = () => {
    closeSheet();
    setSelectedDriver(null);
    setFullDriverData(null);
    setActiveDriverCategory('main');
  };

  return (
    <Sidebar collapsible='icon' variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size='lg'
              className='data-[slot=sidebar-menu-button]:!p-2 justify-center'
            >
              <Link href='/' prefetch className='flex items-center justify-center'>
                {/* Большие логотипы для развернутого sidebar */}
                <Image
                  src='/logo/LogoBigBlack.png'
                  alt='Compass Transfer'
                  width={238}
                  height={32}
                  className='dark:hidden group-data-[collapsible=icon]:hidden'
                  style={{ width: 'auto', height: '32px', objectFit: 'contain' }}
                />
                <Image
                  src='/logo/LogoBigWhite.png'
                  alt='Compass Transfer'
                  width={238}
                  height={32}
                  className='hidden dark:block group-data-[collapsible=icon]:hidden'
                  style={{ width: 'auto', height: '32px', objectFit: 'contain' }}
                />

                {/* Маленькие логотипы для свернутого sidebar */}
                <Image
                  src='/logo/LogoSmallBig.png'
                  alt='Compass Transfer'
                  width={32}
                  height={32}
                  className='h-8 w-8 object-contain dark:hidden hidden group-data-[collapsible=icon]:block'
                />
                <Image
                  src='/logo/LogoSmallWhite.png'
                  alt='Compass Transfer'
                  width={32}
                  height={32}
                  className='h-8 w-8 object-contain hidden group-data-[collapsible=icon]:dark:block'
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent group-data-[collapsible=icon]:scrollbar-hide group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden h-full'>
        <NavMain items={filteredNavMain} />
        <NavDocuments items={filteredDocuments} userRole={userRole} />

        {/* Группа водителей - показываем только для Admin, Operator, Terminal */}
        {shouldShowDrivers && (
          <div className='relative flex w-full min-w-0 flex-col p-2'>
            <div className='text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0'>
              <span className='flex-1'>Водители</span>
              <button
                onClick={refetch}
                disabled={loading}
                className='ml-1 rounded p-0.5 hover:bg-sidebar-accent transition-colors disabled:opacity-50'
                aria-label='Обновить список водителей'
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''} hover:text-blue-400`} />
              </button>
            </div>
            <div className='flex w-full min-w-0 flex-col gap-1'>
              <DriversList
                drivers={drivers}
                loading={loading}
                error={error}
                onDriverClick={openDriverSheet}
              />
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser ? createNavUserData(currentUser) : guestUser} />
      </SidebarFooter>

      {/* Driver Sheet Component */}
      <DriverSheet
        isOpen={isSheetOpen('driver')}
        onClose={closeDriverSheet}
        driver={fullDriverData}
        activeCategory={activeDriverCategory}
        setActiveCategory={setActiveDriverCategory}
        activeOrderType={activeOrderType}
        setActiveOrderType={setActiveOrderType}
      />
    </Sidebar>
  );
}
