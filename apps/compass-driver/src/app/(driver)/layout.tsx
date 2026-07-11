import { SignalRProvider, NotificationProvider, QueryClientProvider } from '@app/providers';
import { getRawCookie } from '@shared/lib/parse-cookie';
import { SheetProvider } from '@shared/lib/sheet-context';
import { IncomingOrderModal } from '@features/incoming-order';
import { SidebarInset, SidebarProvider } from '@shared/ui/layout/sidebar';
import { SiteHeader } from '@widgets/header';
import { AppSidebar } from '@widgets/sidebar';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const accessToken = await getRawCookie('.AspNetCore.Identity.Application');

  return (
    <QueryClientProvider>
      <SignalRProvider accessToken={accessToken || undefined}>
        <NotificationProvider>
          <div className='mx-auto my-auto flex overflow-hidden w-full h-full'>
            <div className='mx-auto my-auto w-full h-full flex flex-row gap-4 overflow-hidden p-5'>
              <SheetProvider>
                <SidebarProvider defaultOpen>
                  <AppSidebar />
                  <SidebarInset>
                    <div className='rounded-2xl'>
                      <SiteHeader />
                    </div>
                    <div className='flex-1 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)] scrollbar-hide'>
                      {children}
                    </div>
                  </SidebarInset>
                </SidebarProvider>
              </SheetProvider>
            </div>
          </div>
          <IncomingOrderModal />
        </NotificationProvider>
      </SignalRProvider>
    </QueryClientProvider>
  );
}
