'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';

export function CreateAreaButton() {
  return (
    <Button asChild>
      <Link href="/areas/create">
        <Plus className="h-4 w-4 mr-2" />
        Создать область
      </Link>
    </Button>
  );
}
