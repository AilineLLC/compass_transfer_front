import { NotificationProvider, SignalRProvider } from '@app/providers';
import { getRawCookie } from '@shared/lib/parse-cookie';
import { IncomingOrderModal } from '@features/incoming-order';
import { LocationProvider } from '@features/location-tracking';
import { NotificationsProvider } from '@features/notifications';
import { DriverMobileFooter } from '@widgets/footer';
import { DriverMobileHeader } from '@widgets/header';
import { redirect } from 'next/navigation';

interface DriverLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout для мобильного приложения водителей
 * Включает хедер и футер на всех страницах
 */
export default async function DriverLayout({ children }: DriverLayoutProps) {
  const accessToken = await getRawCookie('.AspNetCore.Identity.Application');
  
  if (!accessToken) {
    redirect('/login');
  }

  return (
    <SignalRProvider accessToken={accessToken || undefined}>
      <NotificationProvider>
        <NotificationsProvider>
          <LocationProvider intervalMs={30000}>
            <div className='flex flex-col h-screen'>
              <DriverMobileHeader />
              <main className='flex-1 overflow-y-auto pb-20'>{children}</main>
              <DriverMobileFooter />

              {/* Модальное окно для входящих заказов - теперь самодостаточное */}
              <IncomingOrderModal />
            </div>
          </LocationProvider>
        </NotificationsProvider>
      </NotificationProvider>
    </SignalRProvider>
  );
}
