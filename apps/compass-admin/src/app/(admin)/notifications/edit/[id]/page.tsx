'use client';

import { use } from 'react';
import { NotificationEditView } from '@pages/(admin)/notifications/edit/notification-edit-view';

interface EditNotificationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditNotificationPage({ params }: EditNotificationPageProps) {
  const { id } = use(params);
  return <NotificationEditView notificationId={id} />;
}
