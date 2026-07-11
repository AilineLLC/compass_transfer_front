'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { RouteEditView } from '@pages/(admin)/routes/edit/route-edit-view';
import { useRouteEditForm } from '@features/routes/forms/edit/route-edit-form';

export default function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const logic = useRouteEditForm({
    routeId: id,
    onBack: () => router.push('/routes'),
    onSuccess: () => router.push('/routes'),
  });

  return <RouteEditView {...logic} />;
}
