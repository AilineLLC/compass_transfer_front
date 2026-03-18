import { ScheduledOrderPage } from '@pages/(admin)/orders/create/scheduled/scheduled-order-page';

interface EditPartnerOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPartnerOrderPage({ params }: EditPartnerOrderPageProps) {
  const { id } = await params;

  return <ScheduledOrderPage mode="edit" id={id} />;
}

export async function generateMetadata({ params }: EditPartnerOrderPageProps) {
  const { id } = await params;

  return {
    title: `Редактировать партнёрский заказ ${id} | Compass Admin`,
    description: 'Редактирование партнёрского заказа',
  };
}
