'use client';

import {
  ArrowLeft,
  MapPin,
  User,
  Car,
  Plus,
  Trash2,
  Check,
  Clock,
  Banknote,
  Timer,
  Users,
  ArrowRight,
  Phone,
  UserCheck,
  X,
  Ticket,
  Flame,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@shared/ui/forms/button';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import type { GetLocationDTO } from '@entities/locations/interface';
import type { GetDriverDTO, GetCustomerDTO } from '@entities/users/interface';
import type { GetCarDTO } from '@entities/cars/interface';
import { LocationSelectionModal } from '@features/orders/components/LocationSelectionModal';
import { transfersApi, type CreateTransferPassengerDTO, type GetTransferDTO } from '@shared/api/transfers';
import { Switch } from '@shared/ui/forms/switch';
import { DriverSelectModal } from './driver-select-modal';
import { CarSelectModal } from './car-select-modal';
import { CustomerSelectModal } from './customer-select-modal';

let passengerCounter = 0;

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digitCount: number | [number, number];
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'KG', name: 'Кыргызстан',    dialCode: '+996', flag: '🇰🇬', digitCount: 9 },
  { code: 'RU', name: 'Россия',         dialCode: '+7',   flag: '🇷🇺', digitCount: 10 },
  { code: 'KZ', name: 'Казахстан',      dialCode: '+7',   flag: '🇰🇿', digitCount: 10 },
  { code: 'UZ', name: 'Узбекистан',     dialCode: '+998', flag: '🇺🇿', digitCount: 9 },
  { code: 'TJ', name: 'Таджикистан',    dialCode: '+992', flag: '🇹🇯', digitCount: 9 },
  { code: 'TM', name: 'Туркменистан',   dialCode: '+993', flag: '🇹🇲', digitCount: 8 },
  { code: 'AZ', name: 'Азербайджан',    dialCode: '+994', flag: '🇦🇿', digitCount: 9 },
  { code: 'AM', name: 'Армения',        dialCode: '+374', flag: '🇦🇲', digitCount: 8 },
  { code: 'GE', name: 'Грузия',         dialCode: '+995', flag: '🇬🇪', digitCount: 9 },
  { code: 'UA', name: 'Украина',        dialCode: '+380', flag: '🇺🇦', digitCount: 9 },
  { code: 'BY', name: 'Беларусь',       dialCode: '+375', flag: '🇧🇾', digitCount: 9 },
  { code: 'CN', name: 'Китай',          dialCode: '+86',  flag: '🇨🇳', digitCount: 11 },
  { code: 'TR', name: 'Турция',         dialCode: '+90',  flag: '🇹🇷', digitCount: 10 },
  { code: 'US', name: 'США / Канада',   dialCode: '+1',   flag: '🇺🇸', digitCount: 10 },
  { code: 'DE', name: 'Германия',       dialCode: '+49',  flag: '🇩🇪', digitCount: [10, 11] },
  { code: 'GB', name: 'Великобритания', dialCode: '+44',  flag: '🇬🇧', digitCount: 10 },
  { code: 'AE', name: 'ОАЭ',            dialCode: '+971', flag: '🇦🇪', digitCount: 9 },
];

const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

function detectCountryFromPhone(phone: string): CountryOption | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (/^0\d{9}$/.test(cleaned)) return COUNTRY_OPTIONS.find(c => c.code === 'KG') ?? null;
  if (!cleaned.startsWith('+')) return null;
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

interface PassengerField {
  id: number;
  customerId: string | null;
  reservedSeats: number;
  name: string;
  phone: string;
  fromInitialData: boolean;
  isDeleted: boolean;
}

const emptyPassenger = (): PassengerField => ({
  id: ++passengerCounter,
  customerId: null,
  reservedSeats: 1,
  name: '',
  phone: '',
  fromInitialData: false,
  isDeleted: false,
});

// Конвертируем GetTransferDTO.startLocation/endLocation → GetLocationDTO-совместимый объект
function toLocationDTO(loc: GetTransferDTO['startLocation']): GetLocationDTO {
  return loc as unknown as GetLocationDTO;
}

// Конвертируем GetTransferDTO.driver → GetDriverDTO-совместимый объект
function toDriverDTO(d: NonNullable<GetTransferDTO['driver']>): GetDriverDTO {
  return d as unknown as GetDriverDTO;
}

// Конвертируем GetTransferDTO.car → GetCarDTO-совместимый объект
function toCarDTO(c: NonNullable<GetTransferDTO['car']>): GetCarDTO {
  return c as unknown as GetCarDTO;
}

// Форматируем ISO-строку в значение для datetime-local input
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Компонент-секция
function Section({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className='rounded-2xl border bg-white shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between px-5 py-4 border-b bg-gray-50/60'>
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
            <Icon className='h-4 w-4 text-primary' />
          </div>
          <div>
            <p className='font-semibold text-sm'>{title}</p>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className='px-5 py-4'>{children}</div>
    </div>
  );
}

function LocationButton({
  location,
  placeholder,
  onClick,
}: {
  location: GetLocationDTO | null;
  placeholder: string;
  onClick: () => void;
}) {
  if (location) {
    return (
      <button
        type='button'
        onClick={onClick}
        className='w-full flex items-center gap-3 p-2 rounded-xl border border-primary/40 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10 group'
      >
        <MapPin className='h-4 w-4 mt-0.5 text-primary shrink-0' />
        <div className='flex-1 min-w-0'>
          <p className='font-medium text-sm truncate'>{location.name}</p>
          <p className='text-xs text-muted-foreground truncate mt-0.5'>{location.address}</p>
        </div>
        <span className='text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5'>
          Изменить
        </span>
      </button>
    );
  }
  return (
    <button
      type='button'
      onClick={onClick}
      className='w-full flex items-center gap-3 p-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary group'
    >
      <MapPin className='h-4 w-4 text-gray-400 group-hover:text-primary transition-colors shrink-0' />
      <span className='text-sm text-muted-foreground group-hover:text-primary transition-colors'>
        {placeholder}
      </span>
    </button>
  );
}

function EntityButton({
  icon: Icon,
  label,
  sublabel,
  placeholder,
  onClick,
  selected,
  disabled,
}: {
  icon: React.ElementType;
  label?: string;
  sublabel?: string;
  placeholder: string;
  onClick: () => void;
  selected: boolean;
  disabled?: boolean;
}) {
  if (selected && label) {
    return (
      <button
        type='button'
        onClick={onClick}
        className='w-full flex items-center gap-3 p-2 rounded-xl border border-primary/40 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10 group'
      >
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15'>
          <Icon className='h-4 w-4 text-primary' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='font-medium text-sm truncate'>{label}</p>
          {sublabel && <p className='text-xs text-muted-foreground truncate mt-0.5'>{sublabel}</p>}
        </div>
        <span className='text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
          Изменить
        </span>
      </button>
    );
  }
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-2 rounded-xl border border-dashed p-3.5 text-left transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50/30 cursor-not-allowed opacity-50'
          : 'border-gray-300 bg-gray-50/50 hover:border-primary/50 hover:bg-primary/5 group'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
        disabled ? 'bg-gray-100' : 'bg-gray-100 group-hover:bg-primary/10'
      }`}>
        <Icon className={`h-4 w-4 transition-colors ${
          disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-primary'
        }`} />
      </div>
      <span className={`text-sm transition-colors ${
        disabled ? 'text-gray-400' : 'text-muted-foreground group-hover:text-primary'
      }`}>
        {placeholder}
      </span>
    </button>
  );
}

interface TransferCreateFormProps {
  mode?: 'create' | 'edit';
  initialData?: GetTransferDTO;
}

export function TransferCreateForm({ mode = 'create', initialData }: TransferCreateFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [departureTime, setDepartureTime] = useState(
    initialData ? toDatetimeLocal(initialData.departureTime) : '',
  );
  const [duration, setDuration] = useState(
    initialData?.duration != null ? String(initialData.duration) : '',
  );
  const [distance, setDistance] = useState(
    initialData?.distance != null ? String(initialData.distance) : '',
  );
  const [price, setPrice] = useState(initialData ? String(initialData.price) : '');
const [allowPartialReservations, setAllowPartialReservations] = useState(
    initialData ? initialData.allowPartialReservations : true,
  );
  const [isHot, setIsHot] = useState(initialData?.isHot ?? false);

  const [startLocation, setStartLocation] = useState<GetLocationDTO | null>(
    initialData ? toLocationDTO(initialData.startLocation) : null,
  );
  const [endLocation, setEndLocation] = useState<GetLocationDTO | null>(
    initialData ? toLocationDTO(initialData.endLocation) : null,
  );
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState<GetDriverDTO | null>(
    initialData?.driver ? toDriverDTO(initialData.driver) : null,
  );
  const [selectedCar, setSelectedCar] = useState<GetCarDTO | null>(
    initialData?.car ? toCarDTO(initialData.car) : null,
  );
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [customerModalForId, setCustomerModalForId] = useState<number | null>(null);

  const [passengers, setPassengers] = useState<PassengerField[]>(() =>
    initialData?.passengers?.map(p => ({
      id: ++passengerCounter,
      customerId: p.customerId,
      reservedSeats: p.reservedSeats,
      name: p.name,
      phone: p.phone,
      fromInitialData: true,
      isDeleted: p.isDeleted ?? false,
    })) ?? [],
  );

  const [phoneErrors, setPhoneErrors] = useState<Record<number, string>>({});
  const [phoneCountries, setPhoneCountries] = useState<Record<number, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // В режиме редактирования нельзя менять режим бронирования если есть пассажиры
  const bookingModeDisabled = isEdit && (initialData?.passengers?.length ?? 0) > 0;

  const handleAllowPartialChange = (val: boolean) => {
    setAllowPartialReservations(val);
    if (!val) setPassengers([]);
  };

  const addPassenger = () => setPassengers(prev => [...prev, emptyPassenger()]);
  const removePassenger = (id: number) =>
    setPassengers(prev => prev.flatMap(p => {
      if (p.id !== id) return [p];
      if (p.fromInitialData) return [{ ...p, isDeleted: true }];
      return [];
    }));
  const updatePassenger = (
    id: number,
    field: keyof Omit<PassengerField, 'id'>,
    value: string | number | null,
  ) => setPassengers(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  const handleCustomerSelect = (customer: GetCustomerDTO) => {
    if (customerModalForId === null) return;
    setPassengers(prev =>
      prev.map(p =>
        p.id === customerModalForId
          ? {
              ...p,
              customerId: customer.id,
              name: customer.fullName,
              phone: customer.phoneNumber ?? p.phone,
            }
          : p,
      ),
    );
    setCustomerModalForId(null);
  };

  const clearCustomer = (passengerId: number) => {
    setPassengers(prev =>
      prev.map(p => (p.id === passengerId ? { ...p, customerId: null } : p)),
    );
  };

  const getCountryForPassenger = (passenger: PassengerField): CountryOption => {
    const code = phoneCountries[passenger.id];
    if (code) return COUNTRY_OPTIONS.find(c => c.code === code) ?? DEFAULT_COUNTRY;
    if (passenger.phone) {
      const detected = detectCountryFromPhone(passenger.phone);
      if (detected) return detected;
    }
    return DEFAULT_COUNTRY;
  };

  const handlePassengerCountryChange = (passengerId: number, newCode: string) => {
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

  const handlePassengerNationalNumberChange = (passengerId: number, raw: string, country: CountryOption) => {
    let digits = raw.replace(/\D/g, '');
    const dialDigits = country.dialCode.slice(1);
    const maxDigits = typeof country.digitCount === 'number' ? country.digitCount : country.digitCount[1];
    if (digits.startsWith(dialDigits) && digits.length > maxDigits && (digits.length - dialDigits.length) <= maxDigits) {
      digits = digits.slice(dialDigits.length);
    }
    const fullPhone = digits ? `${country.dialCode}${digits}` : '';
    updatePassenger(passengerId, 'phone', fullPhone);
    setPhoneErrors(prev => ({ ...prev, [passengerId]: validateNationalNumber(digits, country) }));
  };

  const handleSubmit = async () => {
    if (!departureTime) { toast.error('Укажите время отправления'); return; }
    if (new Date(departureTime) <= new Date()) { toast.error('Время отправления не может быть в прошлом'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { toast.error('Укажите корректную цену'); return; }
if (!startLocation) { toast.error('Выберите точку отправления'); return; }
    if (!endLocation) { toast.error('Выберите точку назначения'); return; }
    if (!selectedDriver) { toast.error('Выберите водителя'); return; }
    if (!selectedCar) { toast.error('Выберите автомобиль'); return; }
    const activePassengers = passengers.filter(p => !p.isDeleted);
    if (activePassengers.length > 0) {
      const invalid = activePassengers.find(p => !p.name.trim() || !p.phone.trim());
      if (invalid) { toast.error('Заполните имя и телефон для всех пассажиров'); return; }
      const hasPhoneError = activePassengers.some(p => phoneErrors[p.id]);
      if (hasPhoneError) { toast.error('Исправьте ошибки в номерах телефонов'); return; }
    }

    setIsSubmitting(true);
    try {
      const passengersPayload: CreateTransferPassengerDTO[] = passengers.map(p => ({
        customerId: p.customerId,
        reservedSeats: p.reservedSeats,
        name: p.name.trim(),
        phone: p.phone.trim(),
        isDeleted: p.isDeleted || undefined,
      }));

      const payload = {
        departureTime: new Date(departureTime).toISOString(),
        duration: duration ? Number(duration) : null,
        distance: distance ? Number(distance) : null,
        price: Number(price),
    allowPartialReservations,
        isHot,
        passengers: passengersPayload,
        startLocation: startLocation.id,
        endLocation: endLocation.id,
        car: selectedCar.id,
        driver: selectedDriver.id,
      };

      if (isEdit && initialData) {
        await transfersApi.updateTransfer(initialData.id, payload);
        toast.success('Трансфер успешно обновлён');
        router.push(`/transfers/${initialData.id}`);
      } else {
        await transfersApi.createTransfer(payload);
        toast.success('Трансфер успешно создан');
        router.push('/transfers');
      }
    } catch (err) {
      toast.error(
        `Ошибка ${isEdit ? 'обновления' : 'создания'} трансфера: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const backHref = isEdit && initialData ? `/transfers/${initialData.id}` : '/transfers';

  return (
    <div className='flex flex-col border rounded-2xl h-full overflow-hidden bg-gray-50'>
      {/* Шапка */}
      <div className='sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push(backHref)}
          className='gap-2 text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
          Назад
        </Button>
        <div className='h-5 w-px bg-border' />
        <div>
          <h1 className='text-xl font-bold tracking-tight'>
            {isEdit ? 'Редактировать трансфер' : 'Новый трансфер'}
          </h1>
          <p className='text-xs text-muted-foreground'>Заполните все обязательные поля</p>
        </div>
      </div>

      {/* Контент */}
      <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>
        {/* Основная информация */}
        <Section icon={Clock} title='Основная информация' description='Дата, цена и продолжительность'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='departureTime' className='flex items-center gap-1.5 text-xs font-medium'>
                <Clock className='h-3.5 w-3.5' />
                Время отправления <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='departureTime'
                type='datetime-local'
                value={departureTime}
                min={toDatetimeLocal(new Date().toISOString())}
                onChange={e => setDepartureTime(e.target.value)}
                className='h-10'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='price' className='flex items-center gap-1.5 text-xs font-medium'>
                <Banknote className='h-3.5 w-3.5' />
                Цена за салон (сом) <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='price'
                type='number'
                min='0'
                step='1'
                placeholder='0'
                value={price}
                onChange={e => {
                  setPrice(e.target.value);
                }}
                className='h-10'
              />
            </div>


            <div className='space-y-1.5'>
              <Label htmlFor='duration' className='flex items-center gap-1.5 text-xs font-medium'>
                <Timer className='h-3.5 w-3.5' />
                Продолжительность (мин)
              </Label>
              <Input
                id='duration'
                type='number'
                min='1'
                step='1'
                placeholder='Например: 90'
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className='h-10'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='distance' className='flex items-center gap-1.5 text-xs font-medium'>
                <ArrowRight className='h-3.5 w-3.5' />
                Расстояние (км)
              </Label>
              <Input
                id='distance'
                type='number'
                min='0'
                step='0.1'
                placeholder='Например: 120'
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className='h-10'
              />
            </div>
          </div>
        </Section>

        {/* Бронирование */}
        <Section icon={Ticket} title='Режим бронирования' description='Как пассажиры могут занимать места'>
          <div
            className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
              bookingModeDisabled
                ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50/60'
                : `cursor-pointer ${allowPartialReservations ? 'border-primary/30 bg-primary/5' : 'border-gray-200 bg-gray-50/60'}`
            }`}
            onClick={() => !bookingModeDisabled && handleAllowPartialChange(!allowPartialReservations)}
          >
            <Checkbox
              id='allowPartialReservations'
              checked={allowPartialReservations}
              onCheckedChange={val => !bookingModeDisabled && handleAllowPartialChange(!!val)}
              onClick={(e) => e.stopPropagation()}
              disabled={bookingModeDisabled}
              className='mt-0.5 shrink-0'
            />
            <div className='space-y-1'>
              <Label
                htmlFor='allowPartialReservations'
                className={`text-sm font-semibold ${bookingModeDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Частичное бронирование мест <span className='text-red-500'>*</span>
              </Label>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                {allowPartialReservations ? (
                  <>
                    <span className='font-medium text-primary'>Включено</span> — пассажиры могут
                    бронировать отдельные места в трансфере через заявки. Каждый пассажир платит
                    только за своё место. Подходит для маршрутных трансферов, где места продаются
                    по отдельности.
                  </>
                ) : (
                  <>
                    <span className='font-medium text-orange-600'>Отключено</span> — трансфер
                    бронируется целиком: клиент выкупает все места в автомобиле. Частичное
                    занятие мест недоступно. Подходит для индивидуальных трансферов и групповых
                    заказов на весь салон.
                  </>
                )}
              </p>
              {bookingModeDisabled && (
                <p className='text-xs text-amber-600 font-medium mt-1'>
                  Нельзя изменить режим бронирования — у трансфера уже есть пассажиры.
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Горячий трансфер */}
        <Section icon={Flame} title='Горячий трансфер' description='Приоритетное отображение'>
          <div
            className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
              isHot ? 'border-orange-300 bg-orange-50/60' : 'border-gray-200 bg-gray-50/60'
            }`}
            onClick={() => setIsHot(prev => !prev)}
          >
            <Switch checked={isHot} onCheckedChange={setIsHot} onClick={(e) => e.stopPropagation()} className='mt-0.5 shrink-0' />
            <div className='space-y-1'>
              <Label className='text-sm font-semibold cursor-pointer flex items-center gap-1.5'>
                <Flame className='h-4 w-4 text-orange-500' />
                Горячий трансфер
              </Label>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                {isHot ? (
                  <>
                    <span className='font-medium text-orange-600'>Включено</span> — трансфер будет
                    отображаться как <span className='font-medium'>Горячий трансфер</span> и
                    выделяться в списке для привлечения пассажиров. Используйте для срочных или
                    выгодных рейсов с ограниченным временем.
                  </>
                ) : (
                  <>
                    <span className='font-medium text-gray-500'>Отключено</span> — трансфер
                    отображается в стандартном режиме без дополнительного выделения.
                  </>
                )}
              </p>
            </div>
          </div>
        </Section>

        {/* Маршрут */}
        <Section icon={MapPin} title='Маршрут' description='Точки отправления и назначения'>
          <div className='flex flex-col md:flex-row gap-3 items-stretch'>
            <div className='flex-1 space-y-1.5'>
              <Label className='text-xs font-medium text-muted-foreground'>
                Откуда <span className='text-red-500'>*</span>
              </Label>
              <LocationButton
                location={startLocation}
                placeholder='Выбрать точку отправления'
                onClick={() => setIsStartModalOpen(true)}
              />
            </div>

            <div className='flex items-end pb-0.5 md:pt-6'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0'>
                <ArrowRight className='h-4 w-4 text-gray-400' />
              </div>
            </div>

            <div className='flex-1 space-y-1.5'>
              <Label className='text-xs font-medium text-muted-foreground'>
                Куда <span className='text-red-500'>*</span>
              </Label>
              <LocationButton
                location={endLocation}
                placeholder='Выбрать точку назначения'
                onClick={() => setIsEndModalOpen(true)}
              />
            </div>
          </div>
        </Section>

        {/* Назначение */}
        <Section icon={User} title='Назначение' description='Водитель и автомобиль'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-muted-foreground'>
                Водитель <span className='text-red-500'>*</span>
              </Label>
              <EntityButton
                icon={User}
                label={selectedDriver?.fullName}
                sublabel={selectedDriver?.phoneNumber ?? undefined}
                placeholder='Выбрать водителя'
                onClick={() => setIsDriverModalOpen(true)}
                selected={!!selectedDriver}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-muted-foreground'>
                Автомобиль <span className='text-red-500'>*</span>
              </Label>
              <EntityButton
                icon={Car}
                label={
                  selectedCar
                    ? `${selectedCar.make} ${selectedCar.model} (${selectedCar.year})`
                    : undefined
                }
                sublabel={
                  selectedCar
                    ? `${selectedCar.licensePlate} · ${selectedCar.passengerCapacity} мест`
                    : undefined
                }
                placeholder={selectedDriver ? 'Выбрать автомобиль' : 'Сначала выберите водителя'}
                onClick={() => setIsCarModalOpen(true)}
                selected={!!selectedCar}
                disabled={!selectedDriver}
              />
            </div>
          </div>
        </Section>

        {/* Пассажиры */}
        <Section
          icon={Users}
          title='Пассажиры'
          description={
            !allowPartialReservations
              ? 'Только через заявки с лендинга'
              : passengers.filter(p => !p.isDeleted).length === 0
                ? 'Нет добавленных пассажиров'
                : `${passengers.filter(p => !p.isDeleted).length} пассажир(а)`
          }
          action={
            allowPartialReservations ? (
              <Button variant='outline' size='sm' onClick={addPassenger} className='gap-1.5 h-8 text-xs'>
                <Plus className='h-3.5 w-3.5' />
                Добавить
              </Button>
            ) : undefined
          }
        >
          {!allowPartialReservations ? (
            <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-8 text-center'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
                <Ticket className='h-5 w-5 text-amber-500' />
              </div>
              <p className='text-sm font-medium text-amber-700'>Только полное бронирование</p>
              <p className='text-xs text-muted-foreground max-w-xs leading-relaxed'>
                Пассажиры принимаются только через заявки с лендинга. Ручное добавление недоступно.
              </p>
            </div>
          ) : passengers.filter(p => !p.isDeleted).length === 0 ? (
            <button
              type='button'
              onClick={addPassenger}
              className='w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary group'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors'>
                <Plus className='h-5 w-5 text-gray-400 group-hover:text-primary transition-colors' />
              </div>
              <p className='text-sm'>Нажмите чтобы добавить пассажира</p>
            </button>
          ) : (
            <div className='space-y-3'>
              {passengers.filter(p => !p.isDeleted).map((passenger, index) => (
                <div key={passenger.id} className='rounded-xl border bg-gray-50/60 p-4 space-y-3'>
                  {/* Заголовок карточки */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary'>
                        {index + 1}
                      </div>
                      <span className='text-sm font-medium'>Пассажир {index + 1}</span>
                      {passenger.customerId && (
                        <span className='flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium'>
                          <UserCheck className='h-3 w-3' />
                          Клиент
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7 text-xs gap-1 px-2'
                        onClick={() => setCustomerModalForId(passenger.id)}
                        type='button'
                      >
                        <UserCheck className='h-3 w-3' />
                        {passenger.customerId ? 'Сменить клиента' : 'Из базы'}
                      </Button>
                      {passenger.customerId && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
                          onClick={() => clearCustomer(passenger.id)}
                          type='button'
                          title='Отвязать клиента'
                        >
                          <X className='h-3.5 w-3.5' />
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50'
                        onClick={() => removePassenger(passenger.id)}
                        type='button'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </div>

                  {/* Поля */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                        <User className='h-3 w-3' />
                        Имя <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        placeholder='Имя пассажира'
                        value={passenger.name}
                        onChange={e => updatePassenger(passenger.id, 'name', e.target.value)}
                        className='h-9 bg-white'
                      />
                    </div>

                    <div className='space-y-1.5'>
                      <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                        <Phone className='h-3 w-3' />
                        Телефон <span className='text-red-500'>*</span>
                      </Label>
                      {(() => {
                        const country = getCountryForPassenger(passenger);
                        const nationalNumber = getNationalNumber(passenger.phone ?? '', country);
                        const digitHint = typeof country.digitCount === 'number'
                          ? `${country.digitCount} цифр`
                          : `${country.digitCount[0]}–${country.digitCount[1]} цифр`;
                        return (
                          <div className='space-y-1'>
                            <div className={`flex h-9 rounded-md border bg-white overflow-hidden transition-colors focus-within:ring-1 focus-within:ring-ring ${phoneErrors[passenger.id] ? 'border-red-500 focus-within:ring-red-500' : 'border-input'}`}>
                              <select
                                value={country.code}
                                onChange={(e) => handlePassengerCountryChange(passenger.id, e.target.value)}
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
                                onChange={(e) => handlePassengerNationalNumberChange(passenger.id, e.target.value, country)}
                                className='flex-1 min-w-0 px-3 text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none'
                              />
                            </div>
                            {phoneErrors[passenger.id] ? (
                              <p className='text-xs text-red-500'>{phoneErrors[passenger.id]}</p>
                            ) : nationalNumber && (
                              <p className='text-xs text-muted-foreground'>{country.dialCode}{nationalNumber}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className='space-y-1.5'>
                      <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        Мест
                      </Label>
                      <Input
                        type='number'
                        min='1'
                        value={passenger.reservedSeats}
                        onChange={e =>
                          updatePassenger(passenger.id, 'reservedSeats', Number(e.target.value))
                        }
                        className='h-9 bg-white'
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Футер */}
      <div className='sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]'>
        <p className='text-xs text-muted-foreground'>
          <span className='text-red-500'>*</span> — обязательные поля
        </p>
        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={() => router.push(backHref)}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700 gap-2 min-w-[180px]'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                {isEdit ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              <>
                <Check className='h-4 w-4' />
                {isEdit ? 'Сохранить изменения' : 'Создать трансфер'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Модальные окна */}
      <LocationSelectionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onLocationSelect={loc => setStartLocation(loc)}
        title='Выберите точку отправления'
        selectedLocationIds={endLocation ? [endLocation.id] : []}
        isLandingOnly
      />
      <LocationSelectionModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onLocationSelect={loc => setEndLocation(loc)}
        title='Выберите точку назначения'
        selectedLocationIds={startLocation ? [startLocation.id] : []}
        isLandingOnly
      />
      <DriverSelectModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSelect={driver => {
          if (driver.id !== selectedDriver?.id) setSelectedCar(null);
          setSelectedDriver(driver);
        }}
        selectedDriverId={selectedDriver?.id}
        scheduledTime={departureTime ? new Date(departureTime).toISOString() : null}
        completionTimeEstimate={
          departureTime && duration
            ? new Date(new Date(departureTime).getTime() + Number(duration) * 60_000).toISOString()
            : null
        }
      />
      <CarSelectModal
        isOpen={isCarModalOpen}
        onClose={() => setIsCarModalOpen(false)}
        onSelect={car => setSelectedCar(car)}
        selectedCarId={selectedCar?.id}
        driverId={selectedDriver?.id}
      />
      <CustomerSelectModal
        isOpen={customerModalForId !== null}
        onClose={() => setCustomerModalForId(null)}
        onSelect={handleCustomerSelect}
        selectedCustomerId={
          customerModalForId !== null
            ? passengers.find(p => p.id === customerModalForId)?.customerId ?? null
            : null
        }
      />
    </div>
  );
}
