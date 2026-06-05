'use client';

import {
  Car,
  CreditCard,
  Shield,
  Briefcase,
  BookOpen,
  Award,
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { CarColor, VehicleType, VehicleStatus, CarFeature } from '@entities/cars/enums';
import { formatDate } from '@entities/my-profile';
import type { GetDriverDTO } from '@entities/users/interface';
import type { GetCarDTO } from '@entities/cars/interface';
import type { SectionWithMapProps } from '@entities/users/ui/profile-sections/types';
import { getServiceClassLabel, getLicenseCategoryLabel, getCitizenshipLabel } from '@entities/users/utils';
import { getLanguageLabel } from '@entities/users/utils/language-utils';
import type { DriverAnalytics } from '@shared/api/analytics';

// Переводы для цветов автомобилей
const carColorLabels: Record<CarColor, string> = {
  [CarColor.White]: 'Белый',
  [CarColor.Black]: 'Черный',
  [CarColor.Silver]: 'Серебристый',
  [CarColor.Gray]: 'Серый',
  [CarColor.Red]: 'Красный',
  [CarColor.Blue]: 'Синий',
  [CarColor.Green]: 'Зеленый',
  [CarColor.Yellow]: 'Желтый',
  [CarColor.Orange]: 'Оранжевый',
  [CarColor.Brown]: 'Коричневый',
  [CarColor.Purple]: 'Фиолетовый',
  [CarColor.Gold]: 'Золотой',
  [CarColor.Other]: 'Другой',
};

// Переводы для типов автомобилей
const vehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.Sedan]: 'Седан',
  [VehicleType.Hatchback]: 'Хэтчбек',
  [VehicleType.SUV]: 'Внедорожник',
  [VehicleType.Minivan]: 'Минивэн',
  [VehicleType.Coupe]: 'Купе',
  [VehicleType.Cargo]: 'Грузовой',
  [VehicleType.Pickup]: 'Пикап',
};

// Переводы для статусов автомобилей
const vehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.Available]: 'Доступен',
  [VehicleStatus.Maintenance]: 'На обслуживании',
  [VehicleStatus.Repair]: 'На ремонте',
  [VehicleStatus.Other]: 'Другое',
};

// Переводы опций автомобиля
const carFeatureLabels: Record<CarFeature, string> = {
  [CarFeature.AirConditioning]: 'Кондиционер',
  [CarFeature.ClimateControl]: 'Климат-контроль',
  [CarFeature.LeatherSeats]: 'Кожаные сидения',
  [CarFeature.HeatedSeats]: 'Подогрев сидений',
  [CarFeature.Bluetooth]: 'Bluetooth',
  [CarFeature.USBPort]: 'USB-порт',
  [CarFeature.AuxInput]: 'AUX-вход',
  [CarFeature.Navigation]: 'Навигация',
  [CarFeature.BackupCamera]: 'Камера заднего вида',
  [CarFeature.ParkingSensors]: 'Парковочные датчики',
  [CarFeature.Sunroof]: 'Люк',
  [CarFeature.PanoramicRoof]: 'Панорамная крыша',
  [CarFeature.ThirdRowSeats]: 'Третий ряд сидений',
  [CarFeature.ChildSeat]: 'Детское кресло',
  [CarFeature.WheelchairAccess]: 'Доступ для инвалидных колясок',
  [CarFeature.Wifi]: 'Wi-Fi',
  [CarFeature.PremiumAudio]: 'Премиальная аудиосистема',
  [CarFeature.AppleCarplay]: 'Apple CarPlay',
  [CarFeature.AndroidAuto]: 'Android Auto',
  [CarFeature.SmokingAllowed]: 'Разрешено курение',
  [CarFeature.PetFriendly]: 'Дружелюбно к питомцам',
  [CarFeature.LuggageCarrier]: 'Багажник на крыше',
  [CarFeature.BikeRack]: 'Велосипедная стойка',
};

// Type guard для проверки водителя
function isDriverData(profile: SectionWithMapProps['profile']): profile is GetDriverDTO {
  return 'role' in profile && profile.role === 'Driver';
}

interface DriverSectionProps extends SectionWithMapProps {
  onAssignCar?: () => void;
  analytics: DriverAnalytics | null;
  loading: boolean;
  cars?: GetCarDTO[];
}

export function DriverSection({
  profile,
  analytics,
  loading,
  openMapSheet: _openMapSheet,
  onAssignCar,
  cars,
}: DriverSectionProps) {
  if (!isDriverData(profile)) return null;

  const driverProfile = profile.profile;

  return (
    <div className='flex flex-col gap-6'>
      {/* Статистика доходов */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Статистика доходов
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Общий доход</label>
              <p className='text-lg font-bold text-green-600'>
                {analytics?.totalRevenue.toLocaleString()} сом
              </p>
            </div>

            <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Доход за месяц</label>
              <p className='text-lg font-bold text-blue-600'>
                {analytics?.monthlyRevenue.toLocaleString()} сом
              </p>
            </div>

            <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Средний доход</label>
              <p className='text-lg font-bold text-purple-600'>
                {analytics?.averageRevenue.toLocaleString()} сом
              </p>
            </div>

            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Ожидает выплат</label>
              <p className='text-lg font-bold text-orange-600'>
                {analytics?.pendingPayout.toLocaleString()} сом
              </p>
            </div>
          </div>

          {/* <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <TrendingUp className='h-4 w-4' />
            <span>Данные за последние 30 дней</span>
          </div> */}
        </CardContent>
      </Card>

      {/* Основная информация водителя */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Car className='h-5 w-5' />
            Информация водителя
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Опыт вождения</label>
              <p className='text-sm font-medium'>{driverProfile.drivingExperience} лет</p>
            </div>

            <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Всего поездок</label>
              <p className='text-sm font-medium'>{analytics?.totalRides}</p>
            </div>

            {/* <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Общий пробег</label>
              <p className='text-sm font-medium'>
                {driverProfile.totalDistance.toLocaleString()} км
              </p>
            </div> */}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Дата рождения</label>
              <p className='text-sm'>{formatDate(driverProfile.dateOfBirth)}</p>
            </div>

            <div className='border-l-4 border-teal-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Место рождения</label>
              <p className='text-sm'>{driverProfile.birthPlace}</p>
            </div>
          </div>

          <div className='border-l-4 border-indigo-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Гражданство</label>
            <p className='text-sm'>{getCitizenshipLabel(driverProfile.citizenship)}</p>
          </div>

          <div className='border-l-4 border-pink-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Языки</label>
            <div className='flex flex-wrap gap-1'>
              {driverProfile.languages.map(language => (
                <Badge key={language} variant='secondary' className='text-xs w-fit'>
                  {getLanguageLabel(language)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Активные автомобили */}
      {(() => {
        const assignedCars = (cars && cars.length > 0)
          ? cars
          : (profile.activeCar ? [profile.activeCar] : []);

        return (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Car className='h-5 w-5' />
                  Активные автомобили
                </CardTitle>
                {onAssignCar && assignedCars.length < 2 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onAssignCar}
                    className='flex items-center gap-2'
                  >
                    <Car className='h-4 w-4' />
                    Назначить автомобиль
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedCars.length > 0 ? (
                <div className='space-y-6'>
                  {assignedCars.map((car, index) => (
                    <div key={car.id} className={index > 0 ? 'pt-6 border-t' : ''}>
                      {profile.activeCarId && car.id === profile.activeCarId && (
                        <Badge variant='default' className='mb-3'>Активный</Badge>
                      )}
                      <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Марка и модель</label>
                            <p className='text-sm font-medium'>
                              {car.make} {car.model} ({car.year})
                            </p>
                          </div>
                          <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Номерной знак</label>
                            <p className='text-sm font-mono font-medium'>{car.licensePlate}</p>
                          </div>
                          <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Цвет</label>
                            <p className='text-sm'>{carColorLabels[car.color] ?? car.color}</p>
                          </div>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Тип автомобиля</label>
                            <p className='text-sm'>{vehicleTypeLabels[car.type]}</p>
                          </div>
                          <div className='border-l-4 border-teal-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Класс обслуживания</label>
                            <p className='text-sm'>{getServiceClassLabel(car.serviceClass)}</p>
                          </div>
                          <div className='border-l-4 border-indigo-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Пассажировместимость</label>
                            <p className='text-sm'>{car.passengerCapacity} мест</p>
                          </div>
                        </div>
                        <div className='border-l-4 border-pink-200 pl-4 flex flex-col gap-2'>
                          <label className='text-sm font-medium text-muted-foreground'>Статус</label>
                          <Badge
                            variant={
                              car.status === VehicleStatus.Available ? 'default' :
                              car.status === VehicleStatus.Maintenance ? 'secondary' :
                              car.status === VehicleStatus.Repair ? 'destructive' : 'outline'
                            }
                            className='w-fit'
                          >
                            {vehicleStatusLabels[car.status]}
                          </Badge>
                        </div>
                        {car.features && car.features.length > 0 && (
                          <div className='border-l-4 border-yellow-200 pl-4 flex flex-col gap-2'>
                            <label className='text-sm font-medium text-muted-foreground'>Дополнительные опции</label>
                            <div className='flex flex-wrap gap-1'>
                              {car.features.map((feature) => (
                                <Badge key={feature} variant='outline' className='text-xs'>
                                  {carFeatureLabels[feature as CarFeature] || feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <AlertCircle className='h-8 w-8 text-gray-400' />
                  </div>
                  <p className='text-gray-500 text-sm'>
                    У водителя нет назначенных автомобилей
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Водительские права */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Водительские права
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Номер прав</label>
              <p className='text-sm font-mono'>{driverProfile.licenseNumber}</p>
            </div>

            <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Категории водительского удостоверения</label>
              <div className='flex flex-wrap gap-1'>
                {driverProfile.licenseCategories.map(category => (
                  <Badge key={category} variant='outline' className='text-xs w-fit'>
                    {getLicenseCategoryLabel(category)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Дата выдачи</label>
              <p className='text-sm'>{formatDate(driverProfile.licenseIssueDate)}</p>
            </div>

            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Действительны до</label>
              <p className='text-sm'>{formatDate(driverProfile.licenseExpiryDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Паспортные данные */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Паспортные данные
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Показываем номер паспорта только если он заполнен */}
            {driverProfile.passport.number && (
              <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
                <label className='text-sm font-medium text-muted-foreground'>Серия и номер</label>
                <p className='text-sm font-mono'>
                  {driverProfile.passport.series && `${driverProfile.passport.series} `}{driverProfile.passport.number}
                </p>
              </div>
            )}

            {/* Показываем дату выдачи только если она заполнена */}
            {driverProfile.passport.issueDate && (
              <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
                <label className='text-sm font-medium text-muted-foreground'>Дата выдачи</label>
                <p className='text-sm'>{formatDate(driverProfile.passport.issueDate)}</p>
              </div>
            )}

            {/* Показываем срок действия только если он заполнен */}
            {driverProfile.passport.expiryDate && (
              <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
                <label className='text-sm font-medium text-muted-foreground'>Действителен до</label>
                <p className='text-sm'>{formatDate(driverProfile.passport.expiryDate)}</p>
              </div>
            )}
          </div>

          {/* Показываем кем выдан только если заполнено */}
          {driverProfile.passport.issuedBy && (
            <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
              <label className='text-sm font-medium text-muted-foreground'>Кем выдан</label>
              <p className='text-sm'>{driverProfile.passport.issuedBy}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Опыт работы */}
      {driverProfile.workExperience && driverProfile.workExperience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              Опыт работы
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {driverProfile.workExperience.map((work, index) => (
              <div key={index} className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1'>
                    <h4 className='font-medium'>{work.position}</h4>
                    <Badge variant='outline' className='text-xs w-fit'>
                      {work.isCurrent ? 'Текущее место' : 'Завершено'}
                    </Badge>
                  </div>
                </div>
                <p className='text-sm text-muted-foreground'>{work.employerName}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatDate(work.startDate)} -{' '}
                  {work.endDate ? formatDate(work.endDate) : 'настоящее время'}
                </p>
                {work.responsibilities && <p className='text-sm'>{work.responsibilities}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Образование */}
      {driverProfile.education && driverProfile.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Образование
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {driverProfile.education.map((edu, index) => (
              <div key={index} className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1'>
                    <h4 className='font-medium'>{edu.degree}</h4>
                    <Badge variant='outline' className='text-xs w-fit'>
                      {edu.isCompleted ? 'Завершено' : 'В процессе'}
                    </Badge>
                  </div>
                </div>
                <p className='text-sm text-muted-foreground'>{edu.institution}</p>
                <p className='text-sm'>{edu.fieldOfStudy}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatDate(edu.startDate)} -{' '}
                  {edu.endDate ? formatDate(edu.endDate) : 'настоящее время'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Результаты тестов */}
      {driverProfile.testScore && driverProfile.testScore.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Award className='h-5 w-5' />
              Результаты тестов
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {driverProfile.testScore.map((test, index) => (
              <div
                key={index}
                className='border-l-4 border-yellow-200 rounded-lg p-4 flex flex-col gap-2'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1'>
                    <h4 className='font-medium'>{test.testName}</h4>
                    <Badge variant='outline' className='text-xs w-fit'>
                      {test.score}/{test.maxPossibleScore}
                    </Badge>
                  </div>
                </div>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <span>Дата: {formatDate(test.passedDate)}</span>
                  {test.expiryDate && <span>Действителен до: {formatDate(test.expiryDate)}</span>}
                </div>
                {test.comments && <p className='text-sm'>{test.comments}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Дополнительная информация
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Показываем налоговый номер только если он заполнен */}
            {driverProfile.taxIdentifier && (
              <div className='border-l-4 border-blue-200 pl-4 flex flex-col gap-2'>
                <label className='text-sm font-medium text-muted-foreground'>Налоговый номер</label>
                <p className='text-sm font-mono'>{driverProfile.taxIdentifier}</p>
              </div>
            )}

            {/* Показываем последнюю поездку только если она есть */}
            {driverProfile.lastRideDate && (
              <div className='border-l-4 border-green-200 pl-4 flex flex-col gap-2'>
                <label className='text-sm font-medium text-muted-foreground'>Последняя поездка</label>
                <p className='text-sm'>{formatDate(driverProfile.lastRideDate)}</p>
              </div>
            )}
          </div>

          {/* Показываем медосмотр и проверку данных только если они заполнены */}
          {(driverProfile.medicalExamDate || driverProfile.backgroundCheckDate) && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {driverProfile.medicalExamDate && (
                <div className='border-l-4 border-purple-200 pl-4 flex flex-col gap-2'>
                  <label className='text-sm font-medium text-muted-foreground'>Медосмотр</label>
                  <p className='text-sm'>{formatDate(driverProfile.medicalExamDate)}</p>
                </div>
              )}

              {driverProfile.backgroundCheckDate && (
                <div className='border-l-4 border-orange-200 pl-4 flex flex-col gap-2'>
                  <label className='text-sm font-medium text-muted-foreground'>Проверка данных</label>
                  <p className='text-sm'>{formatDate(driverProfile.backgroundCheckDate)}</p>
                </div>
              )}
            </div>
          )}

          <div className='border-l-4 border-pink-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>
              Предпочитаемые классы обслуживания
            </label>
            <div className='flex flex-wrap gap-1'>
              {driverProfile.preferredRideTypes?.map(type => (
                <Badge key={type} variant='secondary' className='text-xs w-fit'>
                  {getServiceClassLabel(type)}
                </Badge>
              ))}
            </div>
          </div>

          <div className='border-l-4 border-indigo-200 pl-4 flex flex-col gap-2'>
            <label className='text-sm font-medium text-muted-foreground'>Обучение пройдено</label>
            <Badge
              variant={driverProfile.trainingCompleted ? 'default' : 'destructive'}
              className='w-fit'
            >
              {driverProfile.trainingCompleted ? 'Да' : 'Нет'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
