import { Role } from '@entities/users';
import { ScheduledOrderViewPage } from '@pages/(admin)/orders/view/scheduled';
import { getUserFromCookie } from '@shared/lib/parse-cookie';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Партнёрский заказ #${id}`,
    description: 'Просмотр партнёрского заказа',
  };
}

export default async function PartnerOrderPage({ params }: PageProps) {
  const { id } = await params;

  const userRole = (await getUserFromCookie('role')) as Role | null;

  const roleString = (() => {
    switch (userRole) {
      case Role.Admin:
        return 'admin';
      case Role.Operator:
        return 'operator';
      case Role.Partner:
        return 'partner';
      case Role.Driver:
        return 'driver';
      default:
        return 'operator';
    }
  })();

  return <ScheduledOrderViewPage orderId={id} userRole={roleString} />;
}
