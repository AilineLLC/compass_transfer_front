import { FinancesPage } from '@pages/(admin)/finances';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Финансы — выплаты водителям',
  description: 'Управление выплатами водителям',
};

export default function Page() {
  return <FinancesPage />;
}
