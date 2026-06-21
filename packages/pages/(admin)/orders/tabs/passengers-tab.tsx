'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, User, Phone, Mail, Search, UserCheck, MapPin, ExternalLink } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetCustomerDTO, GetPartnerDTO } from '@entities/users/interface';
import { usePassengersManagement, type EnhancedPassenger } from '@features/users/hooks/use-passengers-management';

// Union тип для пользователей в поиске (Customer или Partner)
type SearchableUser = GetCustomerDTO | GetPartnerDTO;

interface PassengersTabProps {
  users: SearchableUser[];
  passengers?: EnhancedPassenger[];
  handlePassengersChange?: (passengers: EnhancedPassenger[]) => void;
  selectedTariff?: GetTariffDTO; // Выбранный тариф для определения вместимости
  isInstantOrder?: boolean; // Флаг для моментальных заказов
  onValidationError?: () => void; // Колбэк для обработки ошибок валидации
  userRole?: 'admin' | 'operator' | 'partner' | 'driver'; // Роль пользователя
  [key: string]: unknown;
}

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digitCount: number | [number, number];
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'KG', name: 'Кыргызстан',   dialCode: '+996', flag: '🇰🇬', digitCount: 9 },
  { code: 'RU', name: 'Россия',        dialCode: '+7',   flag: '🇷🇺', digitCount: 10 },
  { code: 'KZ', name: 'Казахстан',     dialCode: '+7',   flag: '🇰🇿', digitCount: 10 },
  { code: 'UZ', name: 'Узбекистан',    dialCode: '+998', flag: '🇺🇿', digitCount: 9 },
  { code: 'TJ', name: 'Таджикистан',   dialCode: '+992', flag: '🇹🇯', digitCount: 9 },
  { code: 'TM', name: 'Туркменистан',  dialCode: '+993', flag: '🇹🇲', digitCount: 8 },
  { code: 'AZ', name: 'Азербайджан',   dialCode: '+994', flag: '🇦🇿', digitCount: 9 },
  { code: 'AM', name: 'Армения',       dialCode: '+374', flag: '🇦🇲', digitCount: 8 },
  { code: 'GE', name: 'Грузия',        dialCode: '+995', flag: '🇬🇪', digitCount: 9 },
  { code: 'UA', name: 'Украина',       dialCode: '+380', flag: '🇺🇦', digitCount: 9 },
  { code: 'BY', name: 'Беларусь',      dialCode: '+375', flag: '🇧🇾', digitCount: 9 },
  { code: 'CN', name: 'Китай',         dialCode: '+86',  flag: '🇨🇳', digitCount: 11 },
  { code: 'TR', name: 'Турция',        dialCode: '+90',  flag: '🇹🇷', digitCount: 10 },
  { code: 'US', name: 'США / Канада',  dialCode: '+1',   flag: '🇺🇸', digitCount: 10 },
  { code: 'DE', name: 'Германия',      dialCode: '+49',  flag: '🇩🇪', digitCount: [10, 11] },
  { code: 'GB', name: 'Великобритания',dialCode: '+44',  flag: '🇬🇧', digitCount: 10 },
  { code: 'AE', name: 'ОАЭ',           dialCode: '+971', flag: '🇦🇪', digitCount: 9 },
];

const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

function detectCountryFromPhone(phone: string): CountryOption | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (/^0\d{9}$/.test(cleaned)) return COUNTRY_OPTIONS.find(c => c.code === 'KG') ?? null;
  if (!cleaned.startsWith('+')) return null;
  // Match longest dial code first to avoid +7 shadowing +374, +375, etc.
  const sorted = [...COUNTRY_OPTIONS].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (cleaned.startsWith(country.dialCode)) return country;
  }
  return null;
}

function getNationalNumber(fullPhone: string, country: CountryOption): string {
  if (!fullPhone) return '';
  const cleaned = fullPhone.replace(/[\s\-\(\)\.]/g, '');
  if (country.code === 'KG' && /^0\d{9}$/.test(cleaned)) return cleaned.slice(1);
  if (cleaned.startsWith(country.dialCode)) return cleaned.slice(country.dialCode.length);
  return cleaned;
}

function validateNationalNumber(digits: string, country: CountryOption): string {
  if (!digits) return '';
  const count = digits.replace(/\D/g, '').length;
  const expected = country.digitCount;
  if (typeof expected === 'number') {
    if (count !== expected) return `Нужно ${expected} цифр (введено ${count})`;
  } else {
    if (count < expected[0] || count > expected[1]) {
      return `Нужно ${expected[0]}–${expected[1]} цифр (введено ${count})`;
    }
  }
  return '';
}

export function PassengersTab({ users, passengers: initialPassengers, handlePassengersChange, selectedTariff, isInstantOrder = false, onValidationError: _onValidationError, userRole = 'operator' }: PassengersTabProps) {
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  // Explicit country selection per passenger (overrides auto-detection)
  const [phoneCountries, setPhoneCountries] = useState<Record<string, string>>({});

  const {
    passengers,
    selectedCustomer,
    isLoadingPassengerData,
    passengersDataLoaded,
    searchQuery,
    isSearching,
    filteredUsers,
    maxPassengers,
    canAddMorePassengers,
    addPassenger,
    removePassenger,
    updatePassenger,
    setMainPassenger,
    fillFromCustomer,
    setSearchQuery,
    setSelectedCustomer,
    getCarTypeLabel,
    handleViewUserProfile,
  } = usePassengersManagement({
    users,
    initialPassengers,
    selectedTariff,
    isInstantOrder,
    userRole,
    onPassengersChange: handlePassengersChange,
    onValidationError: _onValidationError,
  });

  // Determine country for a passenger (explicit selection → auto-detect → default KG)
  const getCountryForPassenger = (passenger: EnhancedPassenger): CountryOption => {
    const code = phoneCountries[passenger.id];
    if (code) return COUNTRY_OPTIONS.find(c => c.code === code) ?? DEFAULT_COUNTRY;
    if (passenger.phone) {
      const detected = detectCountryFromPhone(passenger.phone);
      if (detected) return detected;
    }
    return DEFAULT_COUNTRY;
  };

  const handleCountryChange = (passengerId: string, newCode: string) => {
    const newCountry = COUNTRY_OPTIONS.find(c => c.code === newCode) ?? DEFAULT_COUNTRY;
    const passenger = passengers.find(p => p.id === passengerId);
    const oldCountry = passenger ? getCountryForPassenger(passenger) : DEFAULT_COUNTRY;
    const oldNationalDigits = passenger?.phone
      ? getNationalNumber(passenger.phone, oldCountry).replace(/\D/g, '')
      : '';
    setPhoneCountries(prev => ({ ...prev, [passengerId]: newCode }));
    const newPhone = oldNationalDigits ? `${newCountry.dialCode}${oldNationalDigits}` : '';
    updatePassenger(passengerId, 'phone', newPhone);
    setPhoneErrors(prev => ({ ...prev, [passengerId]: validateNationalNumber(oldNationalDigits, newCountry) }));
  };

  const handleNationalNumberChange = (passengerId: string, raw: string, country: CountryOption) => {
    let digits = raw.replace(/\D/g, '');
    // Auto-strip pasted country code prefix when digit count matches
    const dialDigits = country.dialCode.slice(1);
    const maxDigits = typeof country.digitCount === 'number' ? country.digitCount : country.digitCount[1];
    if (digits.startsWith(dialDigits) && digits.length > maxDigits && (digits.length - dialDigits.length) <= maxDigits) {
      digits = digits.slice(dialDigits.length);
    }
    const fullPhone = digits ? `${country.dialCode}${digits}` : '';
    updatePassenger(passengerId, 'phone', fullPhone);
    setPhoneErrors(prev => ({ ...prev, [passengerId]: validateNationalNumber(digits, country) }));
  };

  // Показываем индикатор загрузки, пока данные пассажиров не загружены
  if (isLoadingPassengerData || !passengersDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка данных пассажиров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-row gap-6 max-h-screen ${userRole !== 'partner' ? 'lg:flex-row' : ''}`}>
      {/* Левая колонка - Профиль выбранного клиента */}
      <div className={`w-full flex-shrink-0 ${userRole !== 'partner' ? 'lg:flex-1 lg:sticky lg:top-0 lg:self-start' : 'flex-1'}`}>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserCheck className='h-5 w-5' />
              {selectedCustomer?.role === 'Partner' ? 'Профиль партнера' : 'Профиль клиента'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className='space-y-6'>
                {/* Информация о пользователе */}
                <div className='text-center'>
                  <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <User className='h-10 w-10 text-blue-600' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {selectedCustomer.fullName}
                  </h3>
                  <div className='flex items-center justify-center gap-2 mt-2'>
                    <Badge variant={selectedCustomer.role === 'Partner' ? 'default' : 'secondary'}>
                      {selectedCustomer.role === 'Partner' ? 'Контр-агент' : 'Клиент'}
                    </Badge>
                    <Badge variant='outline'>Основной пассажир</Badge>
                  </div>
                </div>

                {/* Информация о компании для партнеров */}
                {selectedCustomer.role === 'Partner' && 'profile' in selectedCustomer && selectedCustomer.profile && (
                  <div className='space-y-4'>
                    <h4 className='font-medium text-gray-900'>Информация о компании</h4>
                    <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                      <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center'>
                        <span className='text-blue-600 font-medium text-sm'>🏢</span>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Компания</p>
                        <p className='font-medium'>{(selectedCustomer as GetPartnerDTO).profile.companyName}</p>
                        <p className='text-xs text-gray-400'>
                          {(selectedCustomer as GetPartnerDTO).profile.companyType}
                        </p>
                      </div>
                    </div>
                    {(selectedCustomer as GetPartnerDTO).profile.legalAddress && (
                      <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                        <MapPin className='h-4 w-4 text-gray-500' />
                        <div>
                          <p className='text-sm text-gray-500'>Юридический адрес</p>
                          <p className='font-medium'>{(selectedCustomer as GetPartnerDTO).profile.legalAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Баллы лояльности для клиентов */}
                {selectedCustomer.role === 'Customer' &&
                  'loyaltyPoints' in selectedCustomer && selectedCustomer.loyaltyPoints !== undefined && (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-3 p-3 bg-yellow-50 rounded-lg'>
                        <div className='w-8 h-8 bg-yellow-100 rounded flex items-center justify-center'>
                          <span className='text-yellow-600'>⭐</span>
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Баллы лояльности</p>
                          <p className='font-medium'>{(selectedCustomer as GetCustomerDTO).loyaltyPoints} баллов</p>
                          {'phantom' in selectedCustomer && selectedCustomer.phantom && (
                            <p className='text-xs text-orange-500'>Временный аккаунт</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Контактная информация */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-gray-900'>Контактная информация</h4>
                    <button
                      onClick={(e) => handleViewUserProfile(selectedCustomer, e)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      title="Открыть профиль в новой вкладке"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                    </button>
                  </div>
                  <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                    <Phone className='h-4 w-4 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-500'>Телефон</p>
                      <p className='font-medium'>
                        {selectedCustomer.phoneNumber || 'Не указан'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                    <Mail className='h-4 w-4 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-500'>Email</p>
                      <p className='font-medium'>{selectedCustomer.email || 'Не указан'}</p>
                    </div>
                  </div>

                  {/* Дополнительные контактные данные для партнеров */}
                  {selectedCustomer.role === 'Partner' && 'profile' in selectedCustomer && selectedCustomer.profile && (
                    <>
                      {(selectedCustomer as GetPartnerDTO).profile.contactPhone && (
                        <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                          <Phone className='h-4 w-4 text-blue-500' />
                          <div>
                            <p className='text-sm text-blue-600'>Контактный телефон</p>
                            <p className='font-medium'>{(selectedCustomer as GetPartnerDTO).profile.contactPhone}</p>
                          </div>
                        </div>
                      )}
                      {(selectedCustomer as GetPartnerDTO).profile.contactEmail && (
                        <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                          <Mail className='h-4 w-4 text-blue-500' />
                          <div>
                            <p className='text-sm text-blue-600'>Контактный email</p>
                            <p className='font-medium'>{(selectedCustomer as GetPartnerDTO).profile.contactEmail}</p>
                          </div>
                        </div>
                      )}
                      {(selectedCustomer as GetPartnerDTO).profile.website && (
                        <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                          <div className='w-4 h-4 text-blue-500'>🌐</div>
                          <div>
                            <p className='text-sm text-blue-600'>Веб-сайт</p>
                            <p className='font-medium'>{(selectedCustomer as GetPartnerDTO).profile.website}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Кнопка добавить как пассажира */}
                <Button
                  onClick={() => fillFromCustomer(selectedCustomer.id)}
                  className='w-full'
                  disabled={
                    passengers.some(p => p.email === selectedCustomer.email) ||
                    !canAddMorePassengers
                  }
                >
                  <Plus className='h-4 w-4 mr-2' />
                  {passengers.some(p => p.email === selectedCustomer.email)
                    ? 'Уже добавлен как пассажир'
                    : !canAddMorePassengers
                      ? `Достигнут лимит (${maxPassengers} мест)`
                      : 'Добавить как пассажира'}
                </Button>
              </div>
            ) : (
              <div className='text-center py-12'>
                <User className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {userRole === 'partner' ? 'Добавьте пассажиров' : 'Клиент не выбран'}
                </h3>
                <p className='text-gray-500'>
                  {userRole === 'partner'
                    ? 'Нажмите "Добавить пассажира" чтобы создать нового пассажира'
                    : 'Выберите клиента из списка справа'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Правая колонка - Список пользователей и поиск (скрыта для партнеров) */}
      {userRole !== 'partner' && (
        <div className='w-full lg:flex-1 flex-shrink-0 flex flex-col'>
          <Card className='flex-1 flex flex-col'>
            <CardHeader className='gap-2'>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Выбор пассажиров
              </CardTitle>
              <p className='text-sm text-muted-foreground'>Показаны только клиенты и контр-агенты</p>
              {/* Поиск */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Поиск по имени, email или телефону...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10 pr-10'
                />
                {isSearching && (
                  <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                    <div className='animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full' />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='flex-1 overflow-hidden p-0'>
              <div className='space-y-3 h-full overflow-y-auto p-4'>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedCustomer(user)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedCustomer?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                          <User className='h-5 w-5 text-gray-600' />
                        </div>
                        <div className='flex-1'>
                          <div className='flex justify-between items-center gap-2 mb-1'>
                            <h4 className='font-medium text-gray-900'>
                              {user.fullName}
                            </h4>
                            <Badge
                              variant={user.role === 'Partner' ? 'default' : 'secondary'}
                              className='text-xs'
                            >
                              {user.role === 'Partner' ? 'Контр-агент' : 'Клиент'}
                            </Badge>
                          </div>

                          {/* Для партнеров показываем информацию о компании */}
                          {user.role === 'Partner' && 'profile' in user && user.profile && (
                            <div className='text-sm text-gray-600 mb-2'>
                              <div className='font-medium'>{(user as GetPartnerDTO).profile.companyName}</div>
                              <div className='text-xs text-gray-500'>
                                {(user as GetPartnerDTO).profile.companyType} • {(user as GetPartnerDTO).profile.legalAddress}
                              </div>
                            </div>
                          )}

                          {/* Для клиентов показываем баллы лояльности */}
                          {user.role === 'Customer' && 'loyaltyPoints' in user && user.loyaltyPoints !== undefined && (
                            <div className='text-sm text-gray-600 mb-2'>
                              <span className='inline-flex items-center gap-1'>
                                ⭐ {(user as GetCustomerDTO).loyaltyPoints} баллов лояльности
                                {'phantom' in user && user.phantom && (
                                  <span className='text-xs text-orange-500'>(Временный)</span>
                                )}
                              </span>
                            </div>
                          )}

                          <div className='flex justify-between items-center gap-4 text-sm text-gray-500'>
                            {user.email && (
                              <span className='flex items-center gap-1'>
                                <Mail className='h-3 w-3' />
                                {user.email}
                              </span>
                            )}
                            {user.phoneNumber && (
                              <span className='flex items-center gap-1'>
                                <Phone className='h-3 w-3' />
                                {user.phoneNumber}
                              </span>
                            )}
                            {/* Для партнеров показываем контактный телефон из профиля */}
                            {user.role === 'Partner' && 'profile' in user && user.profile?.contactPhone && (
                              <span className='flex items-center gap-1'>
                                <Phone className='h-3 w-3' />
                                {(user as GetPartnerDTO).profile.contactPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <Search className='h-12 w-12 mx-auto mb-3 opacity-50' />
                    <p>Пользователи не найдены</p>
                    <p className='text-sm'>
                      {searchQuery
                        ? 'Попробуйте изменить поисковый запрос'
                        : 'Нет доступных пользователей'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Третья колонка - Список добавленных пассажиров */}
      <div className={`${userRole !== 'partner' ? 'w-full lg:flex-1 flex-shrink-0' : 'w-1/3'}`}>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Пассажиры ({passengers.length}/{maxPassengers})
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={addPassenger}
                disabled={!canAddMorePassengers}
                className='flex items-center gap-1'
                title={!canAddMorePassengers ? `Достигнут лимит пассажиров для ${selectedTariff?.carType ? getCarTypeLabel(selectedTariff.carType) : 'данного типа автомобиля'}` : 'Создать нового пассажира'}
              >
                <Plus className='h-4 w-4' />
                Создать
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {passengers.length > 0 ? (
              <div className='space-y-3'>
                {passengers.map(passenger => (
                  <div
                    key={passenger.id}
                    className={`p-4 border rounded-lg ${passenger.isMainPassenger ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                        <User className='h-5 w-5 text-gray-600' />
                      </div>
                      <div className='flex-1'>
                        {passenger.isFromSystem || passenger.userData ? (
                          // Пассажир из системы - только просмотр (НЕ редактируемый)
                          <div className='space-y-2'>
                            <h4 className='font-medium text-gray-900'>
                              {passenger.userData?.fullName || `${passenger.firstName} ${passenger.lastName || ''}`.trim()}
                            </h4>
                            <div className='flex flex-col gap-1 text-sm text-gray-500'>
                              <div className='flex items-center gap-1'>
                                <Phone className='h-3 w-3' />
                                <span>{passenger.userData?.phoneNumber || passenger.phone || 'Телефон не указан'}</span>
                              </div>
                              {(passenger.userData?.email || passenger.email) && (
                                <div className='flex items-center gap-1'>
                                  <Mail className='h-3 w-3' />
                                  <span>{passenger.userData?.email || passenger.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Пассажир создан вручную - редактируемый
                          <div className='space-y-2'>
                            <Input
                              placeholder="Введите имя"
                              value={passenger.firstName}
                              onChange={(e) => updatePassenger(passenger.id, 'firstName', e.target.value)}
                              className='font-medium'
                            />
                            {(() => {
                              const country = getCountryForPassenger(passenger);
                              const nationalNumber = getNationalNumber(passenger.phone ?? '', country);
                              const digitHint = typeof country.digitCount === 'number'
                                ? `${country.digitCount} цифр`
                                : `${country.digitCount[0]}–${country.digitCount[1]} цифр`;
                              const isEmpty = !nationalNumber;
                              return (
                                <div className='space-y-1'>
                                  <div className='flex items-center gap-1'>
                                    <span className='text-sm font-medium'>Телефон</span>
                                    <span className='text-red-500 text-sm'>*</span>
                                  </div>
                                  {/* Единый контейнер — один бордер, одна высота */}
                                  <div className={`flex h-10 rounded-md border bg-background overflow-hidden transition-colors focus-within:ring-1 focus-within:ring-ring ${phoneErrors[passenger.id] || isEmpty ? 'border-red-500 focus-within:ring-red-500' : 'border-input'}`}>
                                    <select
                                      value={country.code}
                                      onChange={(e) => handleCountryChange(passenger.id, e.target.value)}
                                      className='h-full bg-muted border-r border-input text-sm pl-2 pr-1 focus:outline-none cursor-pointer shrink-0'
                                    >
                                      {COUNTRY_OPTIONS.map(c => (
                                        <option key={c.code} value={c.code}>
                                          {c.flag} {c.dialCode}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      placeholder={digitHint}
                                      value={nationalNumber}
                                      maxLength={typeof country.digitCount === 'number' ? country.digitCount : country.digitCount[1]}
                                      onChange={(e) => handleNationalNumberChange(passenger.id, e.target.value, country)}
                                      className='flex-1 min-w-0 px-3 text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none'
                                    />
                                  </div>
                                  {phoneErrors[passenger.id] ? (
                                    <p className='text-xs text-red-500'>{phoneErrors[passenger.id]}</p>
                                  ) : isEmpty ? (
                                    <p className='text-xs text-red-500'>Номер телефона обязателен</p>
                                  ) : (
                                    <p className='text-xs text-muted-foreground'>{country.dialCode}{nationalNumber}</p>
                                  )}
                                </div>
                              );
                            })()}
                            {passenger.email && (
                              <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <Mail className='h-3 w-3' />
                                <span>{passenger.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      {passenger.isMainPassenger && (
                        <Badge variant='default'>Основной пассажир</Badge>
                      )}
                      {!passenger.isMainPassenger && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setMainPassenger(passenger.id)}
                        >
                          Сделать основным
                        </Button>
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => removePassenger(passenger.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <Users className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Нет пассажиров</h3>
                <p className='text-gray-500 mb-4'>
                  Добавьте пассажиров для поездки
                </p>
                {selectedTariff && (
                  <div className='mb-4 p-3 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-blue-700 font-medium'>
                      Максимум пассажиров: {maxPassengers} ({getCarTypeLabel(selectedTariff.carType)})
                    </p>
                  </div>
                )}
                <div className='space-y-2 text-sm text-gray-400'>
                  <p>• Выберите клиента из списка и нажмите &quot;Добавить как пассажира&quot;</p>
                  <p>• Или создайте нового пассажира кнопкой &quot;Создать&quot;</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
