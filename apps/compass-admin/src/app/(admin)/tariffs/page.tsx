import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@shared/lib/parse-cookie';
import { Role } from '@entities/users/enums';
import { TariffPageContent } from './tariff-page-content';

export default async function TariffsPage() {
  const userRole = (await getUserFromCookie('role')) as Role | null;

  if (userRole === Role.Partner) {
    redirect('/orders');
  }

  return <TariffPageContent />;
}
