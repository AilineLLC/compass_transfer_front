'use client';

import type { GetDriverDTO } from '@entities/users/interface';

interface DriverPersonalInfoProps {
  driver: GetDriverDTO;
}

export function DriverPersonalInfo({ driver }: DriverPersonalInfoProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Личная информация</h3>
      <div className='p-4 rounded-lg border bg-purple-50 border-purple-200'>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Дата рождения:</span>
            <span className='font-medium'>{driver.profile.dateOfBirth ? new Date(driver.profile.dateOfBirth).toLocaleDateString('ru-RU') : 'Не указана'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Место рождения:</span>
            <span className='font-medium'>{driver.profile.birthPlace || 'Не указано'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Гражданство:</span>
            <span className='font-medium'>{driver.profile.citizenship}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Языки:</span>
            <span className='font-medium'>{(driver.profile.languages ?? []).length > 0 ? (driver.profile.languages ?? []).join(', ') : 'Не указаны'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Электронная почта:</span>
            <span className='font-medium'>{driver.email}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Налоговый номер:</span>
            <span className='font-medium'>{driver.profile.taxIdentifier || 'Не указан'}</span>
          </div>
          {driver.employment && (
            <>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Компания:</span>
                <span className='font-medium'>{driver.employment.companyName}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Тип занятости:</span>
                <span className='font-medium'>
                  {driver.employment.employmentType === 'Percentage' ? 'Процентная оплата' : 'Фиксированная оплата'}
                </span>
              </div>
              {driver.employment.percentage && (
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Процент:</span>
                  <span className='font-medium'>{driver.employment.percentage}%</span>
                </div>
              )}
              {driver.employment.fixedAmount && (
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Фиксированная сумма:</span>
                  <span className='font-medium'>{driver.employment.fixedAmount} сом</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {(driver.profile.workExperience?.length || driver.profile.education?.length || driver.profile.testScore?.length) && (
        <div className='p-4 rounded-lg border bg-gray-50 border-gray-200'>
          <h4 className='font-medium text-foreground mb-3'>Дополнительная информация</h4>

          {driver.profile.workExperience && driver.profile.workExperience.length > 0 && (
            <div className='mb-3'>
              <p className='text-sm font-medium text-muted-foreground mb-2'>Опыт работы:</p>
              {driver.profile.workExperience.map((work, index) => (
                <div key={index} className='text-sm mb-2'>
                  <p className='font-medium'>{work.position} в {work.employerName}</p>
                  <p className='text-muted-foreground'>
                    {new Date(work.startDate).toLocaleDateString('ru-RU')} - {
                      work.endDate ? new Date(work.endDate).toLocaleDateString('ru-RU') : 'настоящее время'
                    }
                  </p>
                  {work.responsibilities && (
                    <p className='text-muted-foreground text-xs'>{work.responsibilities}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {driver.profile.education && driver.profile.education.length > 0 && (
            <div className='mb-3'>
              <p className='text-sm font-medium text-muted-foreground mb-2'>Образование:</p>
              {driver.profile.education.map((edu, index) => (
                <div key={index} className='text-sm mb-2'>
                  <p className='font-medium'>{edu.institution}</p>
                  {edu.degree && <p className='text-muted-foreground'>{edu.degree}</p>}
                  {edu.fieldOfStudy && <p className='text-muted-foreground'>{edu.fieldOfStudy}</p>}
                  <p className='text-muted-foreground text-xs'>
                    {edu.isCompleted ? 'Завершено' : 'В процессе'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {driver.profile.testScore && driver.profile.testScore.length > 0 && (
            <div>
              <p className='text-sm font-medium text-muted-foreground mb-2'>Результаты тестов:</p>
              {driver.profile.testScore.map((test, index) => (
                <div key={index} className='text-sm mb-2'>
                  <p className='font-medium'>{test.testName}</p>
                  <p className='text-muted-foreground'>
                    Результат: {test.score}/{test.maxPossibleScore}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Дата: {new Date(test.passedDate).toLocaleDateString('ru-RU')}
                  </p>
                  {test.comments && (
                    <p className='text-muted-foreground text-xs'>{test.comments}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
