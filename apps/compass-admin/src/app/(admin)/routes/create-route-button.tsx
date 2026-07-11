'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@shared/ui/forms/button';

export function CreateRouteButton() {
  return (
    <Button
      asChild
      className='w-full md:w-auto focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
    >
      <Link href='/routes/create'>
        <Plus className='mr-2 h-4 w-4' />
        Добавить направление
      </Link>
    </Button>
  );
}
