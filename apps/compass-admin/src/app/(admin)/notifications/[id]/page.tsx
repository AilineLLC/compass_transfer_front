import { NotificationView } from '@pages/(admin)/notifications/view';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Уведомление #${id}`,
    description: 'Просмотр уведомления',
  };
}

export default async function NotificationPage({ params }: PageProps) {
  const { id } = await params;
  return <NotificationView notificationId={id} />;
}
