import { getUserFromCookie } from '@shared/lib/parse-cookie';
import { Role } from '@entities/users/enums';
import { InstantOrderPage } from '@pages/(admin)/orders/create/instant';

export default async function CreateInstantOrderPage({
  searchParams,
}: {
  searchParams: Promise<{
    tariffId?: string;
    formId?: string;
    startLocationId?: string;
    endLocationId?: string;
    services?: string;
  }>;
}) {
  const params = await searchParams;

  // Получаем роль пользователя
  const userRole = (await getUserFromCookie('role')) as Role | null;

  // Преобразуем роль в строку для компонента
  const roleString = (() => {
    switch (userRole) {
      case Role.Admin:
        return 'admin';
      case Role.Operator:
        return 'operator';
      case Role.Partner:
        return 'partner';
      case Role.Driver:
        return 'driver';
      default:
        return 'operator';
    }
  })();

  return (
    <InstantOrderPage
      mode="create"
      userRole={roleString}
      initialTariffId={params.tariffId}
      fromFormId={params.formId}
      initialStartLocationId={params.startLocationId}
      initialEndLocationId={params.endLocationId}
      initialServicesJson={params.services}
    />
  );
}

export const metadata = {
  title: 'Создать мгновенный заказ | Compass Admin',
  description: 'Создание нового мгновенного заказа',
};
