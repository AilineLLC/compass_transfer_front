'use client';

import { Users } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { formatDate } from '@entities/my-profile';
import type { GetOperatorDTO } from '@entities/users/interface';
import type { RoleSpecificSectionProps } from './types';

// Type guard для проверки оператора
function isOperatorData(profile: RoleSpecificSectionProps['profile']): profile is GetOperatorDTO {
  return 'role' in profile && profile.role === 'Operator';
}

export function OperatorSection({ profile }: RoleSpecificSectionProps) {
  if (!isOperatorData(profile)) return null;

  const operatorProfile = profile.profile;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 justify-between'>
          <span className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Информация оператора
          </span>
          {profile.isMainSupportOperator && (
            <Badge>Главный оператор поддержки</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>ID сотрудника</label>
            <p className='text-sm font-mono'>{operatorProfile.employeeId}</p>
          </div>

          <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Отдел</label>
            <p className='text-sm'>{operatorProfile.department}</p>
          </div>

          <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Должность</label>
            <p className='text-sm'>{operatorProfile.position}</p>
          </div>

          <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Дата найма</label>
            <p className='text-sm'>{formatDate(operatorProfile.hireDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
