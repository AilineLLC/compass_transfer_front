'use client';

import { useRouter } from 'next/navigation';
import { RouteFormView } from '@pages/(admin)/routes/create/route-form-view';
import { useRouteCreateForm } from '@features/routes/forms/create/route-create-form';

export default function CreateRoutePage() {
  const router = useRouter();

  const logic = useRouteCreateForm({
    onBack: () => router.push('/routes'),
    onSuccess: () => router.push('/routes'),
  });

  return <RouteFormView {...logic} />;
}
