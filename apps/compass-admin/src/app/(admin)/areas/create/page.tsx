'use client';

import { useRouter } from 'next/navigation';
import { AreaFormView } from '@pages/(admin)/areas/create/area-form-view';
import { useAreaCreateForm } from '@features/areas/forms/create/area-create-form';

export default function CreateAreaPage() {
  const router = useRouter();

  const logic = useAreaCreateForm({
    onBack: () => router.push('/areas'),
    onSuccess: () => router.push('/areas'),
  });

  return <AreaFormView {...logic} />;
}
