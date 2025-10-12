import { InstantOrderViewPage } from '@pages/(admin)/orders/view/instant';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Мгновенный заказ #${id}`,
    description: 'Просмотр мгновенного заказа',
  };
}

export default async function InstantOrderPage({ params }: PageProps) {
  const { id } = await params;
  return <InstantOrderViewPage orderId={id} />;
}