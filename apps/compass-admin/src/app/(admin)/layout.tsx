import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignalRProvider, NotificationProvider, QueryClientProvider } from '@app/providers';
import { UserRoleProvider } from '@shared/contexts';
import { SheetProvider } from '@shared/lib';
import { getUserFromCookie, getRawCookie } from '@shared/lib/parse-cookie';
import { SidebarInset, SidebarProvider } from '@shared/ui/layout';
import type { Role } from '@entities/users/enums';
import { AppFooter } from '@widgets/footer';
import { SiteHeader } from '@widgets/header';
import { AppSidebar } from '@widgets/sidebar';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Compass Transfer Admin',
  description: 'Административная панель Compass Transfer',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = await getRawCookie('.AspNetCore.Identity.Application');
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  // Получаем данные пользователя из куки
  const userRole = (await getUserFromCookie('role')) as Role | null;
  const userFullName = (await getUserFromCookie('fullName')) as string | null;
  const userId = (await getUserFromCookie('id')) as string | null;

  // Проверяем авторизацию - если пользователь не авторизован, перенаправляем на логин
  if (!userRole || !userId || !userFullName) {
    redirect('/login');
  }

  // Формируем объект пользователя для передачи в AppSidebar
  // Создаем email из fullName, так как бэк не передает email
  const displayEmail = userFullName || 'Пользователь';

  const currentUser =
    userId && userRole && userFullName
      ? {
          id: userId,
          role: userRole as Role,
          email: displayEmail,
        }
      : null;

  return (
    <QueryClientProvider>
      <SignalRProvider accessToken={accessToken || undefined}>
        <NotificationProvider>
          <UserRoleProvider
            userRole={userRole}
            userId={userId}
            userFullName={userFullName}
          >
          <div
            className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-100`}
          >
            <SheetProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar currentUser={currentUser} />
                <SidebarInset>
                  <SiteHeader />
                  <div className='flex flex-1 overflow-hidden'>
                    <div className='flex-1 overflow-hidden h-full'>{children}</div>
                  </div>
                {/* <AppFooter
                  footerLinks={[
                    { name: 'Техническая поддержка', href: '/support' },
                    { name: 'Документация', href: '/documentation' },
                    { name: 'Оферта', href: '/offer' },
                    { name: 'Конфиденциальность', href: '/privacy' },
                    { name: 'О нас', href: '/about' },
                  ]}
                  className='pt-2'
                /> */}
              </SidebarInset>
            </SidebarProvider>
          </SheetProvider>
        </div>
        </UserRoleProvider>
      </NotificationProvider>
    </SignalRProvider>
    </QueryClientProvider>
  );
}
