'use client';

import { DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';

export function CurrencyWidget() {
  const handleOpenNBKR = () => {
    window.open('https://www.nbkr.kg/index.jsp?lang=RUS', '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleOpenNBKR}
      className="relative h-9 gap-2 hover:bg-gray-100"
      title="Курсы валют НБКР"
    >
      <DollarSign className="h-4 w-4" />
      <span className="text-sm">Курсы</span>
      <ExternalLink className="h-3 w-3 opacity-50" />
    </Button>
  );
}
