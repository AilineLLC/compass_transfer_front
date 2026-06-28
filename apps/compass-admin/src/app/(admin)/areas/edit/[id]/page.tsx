'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AreaEditView } from '@pages/(admin)/areas/edit/area-edit-view';
import { useAreaEditForm } from '@features/areas/forms/edit/area-edit-form';
import { useArea } from '@features/areas/hooks/useArea';
import type { LocationGroupDTO } from '@shared/api/location-groups';

export default function EditAreaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { area, loading, error, fetchArea } = useArea();

  useEffect(() => {
    fetchArea(id);
  }, [id, fetchArea]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error ?? 'Область не найдена'}
      </div>
    );
  }

  return <EditAreaContent area={area} />;
}

function EditAreaContent({ area }: { area: LocationGroupDTO }) {
  const router = useRouter();

  const logic = useAreaEditForm({
    area,
    onBack: () => router.push('/areas'),
    onSuccess: () => router.push('/areas'),
  });

  return <AreaEditView {...logic} />;
}
