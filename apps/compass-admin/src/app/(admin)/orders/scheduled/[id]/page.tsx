import { ScheduledOrderViewPage } from '@pages/(admin)/orders/view/scheduled';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Запланированный заказ #${id}`,
    description: 'Просмотр запланированного заказа',
  };
}

export default async function ScheduledOrderPage({ params }: PageProps) {
  const { id } = await params;
  return <ScheduledOrderViewPage orderId={id} />;
}