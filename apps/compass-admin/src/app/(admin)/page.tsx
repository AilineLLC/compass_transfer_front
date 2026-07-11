import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@shared/lib/parse-cookie';
import { Role } from '@entities/users/enums';
import { AdminDashboard } from '@pages/(admin)/dashboard/admin';
import { OperatorDashboard } from '@pages/(admin)/dashboard/operator';

export default async function Page({ params }: { params: { status?: string } }) {
  // Получаем роль пользователя на сервере
  const userRole = (await getUserFromCookie('role')) as Role | null;

  // Если роль не определена, перенаправляем на логин
  if (!userRole) {
    redirect('/login');
  }

  // Рендерим соответствующий дашборд в зависимости от роли
  switch (userRole) {
    case Role.Admin:
      return <AdminDashboard />;

    case Role.Operator:
      return <OperatorDashboard status={params.status} />;

    case Role.Partner:
      redirect('/orders');

    case Role.Driver:
    case Role.Customer:
    case Role.Terminal:
      // Эти роли не должны иметь доступ к админ панели
      redirect('/login');

    default:
      // Неизвестная роль - перенаправляем на логин
      redirect('/login');
  }
}
