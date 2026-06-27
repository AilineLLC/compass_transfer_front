'use client';

import {
  ArrowLeft, Save, User, Phone, Trash2, Plus, Search,
  Calendar as CalendarIcon, Plane, PlaneTakeoff, PlaneLanding,
  Banknote, CreditCard, Star,
  AlertCircle, CheckCircle2, Info, RefreshCw, Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ApiRequestError } from '@shared/api/client';
import { useOrderData } from '@shared/hooks/useOrderData';
import { logger } from '@shared/lib/logger';
import { customerOrderFormsApi } from '@shared/api/customer-order-forms';
import type { RoutePoint } from '@shared/components/map/types';
import { Button } from '@shared/ui/forms/button';
import { Textarea } from '@shared/ui/forms/textarea';
import { Calendar } from '@shared/ui/data-display/calendar';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { GetLocationDTO } from '@entities/locations/interface';
import {
  orderStatusLabels,
  orderSubStatusLabels,
} from '@entities/orders/constants/order-status-labels';
import { OrderStatus, OrderSubStatus, OrderSubStatusValues, PaymentMethodType } from '@entities/orders/enums';
import {
  useScheduledOrderSubmit,
  useScheduledOrderById,
  useScheduledRideSubmit,
} from '@entities/orders/hooks';
import type { PassengerDTO, GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetDriverDTO } from '@entities/users/interface';
import { MapTab } from '../../tabs';
import { useSelfProfile } from '@entities/users/hooks/useSelfProfile';
import { usersApi } from '@shared/api/users';
import { locationsApi } from '@shared/api/locations';
import { useScheduleManagement } from '@features/orders/schedule';
import { usePassengersManagement, type EnhancedPassenger } from '@features/users/hooks/use-passengers-management';

// ─── Phone helpers ─────────────────────────────────────────────────────────────
interface CountryOption { code: string; name: string; dialCode: string; flag: string; digitCount: number | [number, number]; }
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
  for (const c of sorted) { if (cleaned.startsWith(c.dialCode)) return c; }
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
    if (count < expected[0] || count > expected[1]) return `Нужно ${expected[0]}–${expected[1]} цифр (введено ${count})`;
  }
  return '';
}

interface OrderPageProps {
  mode: 'create' | 'edit';
  id?: string;
  initialTariffId?: string;
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
  fromFormId?: string;
  initialStartLocationId?: string;
  initialEndLocationId?: string;
  initialServicesJson?: string;
  initialPassengerName?: string;
  initialPassengerPhone?: string;
  initialScheduledTime?: string;
}

// ─── Section header helper ──────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, extra }: { icon: React.ElementType; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      {extra}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export function ScheduledOrderPage({
  mode,
  id,
  initialTariffId,
  userRole = 'operator',
  fromFormId,
  initialStartLocationId,
  initialEndLocationId,
  initialServicesJson,
  initialPassengerName,
  initialPassengerPhone,
  initialScheduledTime,
}: OrderPageProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && !!id;

  // ── Load existing order ──────────────────────────────────────────────────────
  const { order: existingOrder, isLoading: isLoadingOrder, refetch: _refetchOrder } =
    useScheduledOrderById(isEditMode ? id : null, { enabled: isEditMode });

  const { data: selfProfile } = useSelfProfile({
    enabled: userRole === 'partner' && mode === 'create',
  });

  const activeSale = isEditMode
    ? existingOrder?.sale
    : userRole === 'partner' && selfProfile?.role === 'Partner'
      ? (selfProfile as any).sale
      : 0;

  // ── Core data ────────────────────────────────────────────────────────────────
  const {
    tariffs, services, users,
    isLoading: dataLoading,
    isRefreshingTariffs, error: dataError,
    refetch, refetchTariffs,
  } = useOrderData();

  // ── Form state ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    scheduledTime: '',
    description: '',
    airFlight: '',
    flyReis: '',
    notes: '',
    passengers: [] as PassengerDTO[],
    startLocationId: '',
    endLocationId: '',
    additionalStops: [] as string[],
  });

  const methods = useMemo(() => ({
    getValues: (key?: string): unknown => key ? formData[key as keyof typeof formData] : formData,
    setValue: (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value })),
  }), [formData]);

  // ── Tariff & pricing ─────────────────────────────────────────────────────────
  const [selectedTariff, setSelectedTariff] = useState<GetTariffDTO | null>(null);
  const [selectedServices, setSelectedServices] = useState<GetOrderServiceDTO[]>(() => {
    if (initialServicesJson) { try { return JSON.parse(initialServicesJson); } catch { return []; } }
    return [];
  });
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('');

  // ── Driver / payment ─────────────────────────────────────────────────────────
  const [selectedDriver, setSelectedDriver] = useState<GetDriverDTO | null>(null);
  const [originalDriver, setOriginalDriver] = useState<GetDriverDTO | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>(
    userRole === 'partner' ? PaymentMethodType.Card : PaymentMethodType.Cash,
  );
  const [driverPrice, setDriverPrice] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');

  // ── Map / route ──────────────────────────────────────────────────────────────
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [dynamicMapCenter, setDynamicMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [openDriverPopupId, setOpenDriverPopupId] = useState<string | null>(null);
  const [driversDataCache, setDriversDataCache] = useState<Record<string, GetDriverDTO>>({});

  const getDriverById = useCallback((dId: string) => driversDataCache[dId] || null, [driversDataCache]);
  const updateDriverCache = useCallback((dId: string, data: GetDriverDTO) => {
    setDriversDataCache(prev => ({ ...prev, [dId]: data }));
  }, []);

  // ── Order status (edit) ──────────────────────────────────────────────────────
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Pending);
  const [orderSubStatus, setOrderSubStatus] = useState<OrderSubStatus>(OrderSubStatus.SearchingDriver);

  // ── Schedule ─────────────────────────────────────────────────────────────────
  const [scheduleValid, setScheduleValid] = useState(true);
  // Stable seed for the calendar hook — only set from external data (prop or edit order load),
  // never from the onScheduleChange output. Prevents the circular:
  // onScheduleChange → formData.scheduledTime → initialScheduledTime → hook effect → Select → loop
  const [hookInitScheduledTime, setHookInitScheduledTime] = useState<string | undefined>(
    initialScheduledTime || undefined,
  );
  const hookInitSetRef = useRef(false);

  const handleScheduleChange = useCallback((t: string) => {
    methods.setValue('scheduledTime', t);
    if (isEditMode && orderStatus === OrderStatus.Expired) setOrderStatus(OrderStatus.Pending);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, orderStatus]);

  const {
    selectedDate, selectedTime, selectedHour, selectedMinute,
    handleDateSelect, handleTimeChange, isTimeDisabled,
  } = useScheduleManagement({
    initialScheduledTime: hookInitScheduledTime,
    onScheduleChange: handleScheduleChange,
    onValidityChange: setScheduleValid,
  });

  // ── Flight type ──────────────────────────────────────────────────────────────
  const [flightType, setFlightType] = useState<'departure' | 'arrival' | null>(null);
  useEffect(() => {
    if (flightType === null) {
      if (formData.airFlight) setFlightType('departure');
      else if (formData.flyReis) setFlightType('arrival');
    }
  }, [formData.airFlight, formData.flyReis, flightType]);
  const handleFlightTypeChange = (type: 'departure' | 'arrival' | null) => {
    setFlightType(type);
    if (type === 'departure') methods.setValue('flyReis', '');
    else if (type === 'arrival') methods.setValue('airFlight', '');
    else { methods.setValue('airFlight', ''); methods.setValue('flyReis', ''); }
  };

  // ── Passengers ───────────────────────────────────────────────────────────────
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [phoneCountries, setPhoneCountries] = useState<Record<string, string>>({});

  const handlePassengersChange = useCallback((newPassengers: PassengerDTO[]) => {
    methods.setValue('passengers', newPassengers);
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
  }, [methods]);

  const {
    passengers: managedPassengers,
    searchQuery, isSearching, filteredUsers,
    canAddMorePassengers, maxPassengers,
    addPassenger, removePassenger, updatePassenger,
    setMainPassenger, fillFromCustomer,
    setSearchQuery, setSelectedCustomer,
  } = usePassengersManagement({
    users,
    initialPassengers: formData.passengers as EnhancedPassenger[],
    selectedTariff: selectedTariff || undefined,
    isInstantOrder: false,
    userRole,
    onPassengersChange: handlePassengersChange as any,
  });

  const getCountryForPassenger = (p: EnhancedPassenger): CountryOption => {
    const code = phoneCountries[p.id];
    if (code) return COUNTRY_OPTIONS.find(c => c.code === code) ?? DEFAULT_COUNTRY;
    if (p.phone) { const d = detectCountryFromPhone(p.phone); if (d) return d; }
    return DEFAULT_COUNTRY;
  };

  const handlePassengerCountryChange = (passengerId: string, newCode: string) => {
    const newCountry = COUNTRY_OPTIONS.find(c => c.code === newCode) ?? DEFAULT_COUNTRY;
    const passenger = managedPassengers.find(p => p.id === passengerId);
    const oldCountry = passenger ? getCountryForPassenger(passenger) : DEFAULT_COUNTRY;
    const oldDigits = passenger?.phone ? getNationalNumber(passenger.phone, oldCountry).replace(/\D/g, '') : '';
    setPhoneCountries(prev => ({ ...prev, [passengerId]: newCode }));
    const newPhone = oldDigits ? `${newCountry.dialCode}${oldDigits}` : '';
    updatePassenger(passengerId, 'phone', newPhone);
    setPhoneErrors(prev => ({ ...prev, [passengerId]: validateNationalNumber(oldDigits, newCountry) }));
  };

  const handlePassengerNationalNumberChange = (passengerId: string, raw: string, country: CountryOption) => {
    let digits = raw.replace(/\D/g, '');
    const dialDigits = country.dialCode.slice(1);
    const maxDigits = typeof country.digitCount === 'number' ? country.digitCount : country.digitCount[1];
    if (digits.startsWith(dialDigits) && digits.length > maxDigits && (digits.length - dialDigits.length) <= maxDigits)
      digits = digits.slice(dialDigits.length);
    const fullPhone = digits ? `${country.dialCode}${digits}` : '';
    updatePassenger(passengerId, 'phone', fullPhone);
    setPhoneErrors(prev => ({ ...prev, [passengerId]: validateNationalNumber(digits, country) }));
  };

  // ── Services helpers ─────────────────────────────────────────────────────────
  const handleServiceToggle = useCallback((serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const existing = selectedServices.find(s => s.serviceId === serviceId);
    if (existing) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
    } else {
      setSelectedServices([...selectedServices, { serviceId: svc.id, quantity: 1, name: svc.name }]);
    }
  }, [services, selectedServices]);

  const handleServiceQuantityChange = useCallback((serviceId: string, delta: number) => {
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId !== serviceId) return s;
      const newQty = Math.max(1, s.quantity + delta);
      return { ...s, quantity: newQty };
    }));
  }, []);

  // ── Route callbacks ──────────────────────────────────────────────────────────
  const handleRoutePointsChange = useCallback((
    newStartId: string, newEndId: string, pts: RoutePoint[],
  ) => {
    const stops = pts.filter(p => p.type === 'intermediate' && p.id).map(p => p.id!);
    setFormData(prev => ({ ...prev, startLocationId: newStartId, endLocationId: newEndId, additionalStops: stops }));
    methods.setValue('startLocationId', newStartId);
    methods.setValue('endLocationId', newEndId);
    methods.setValue('additionalStops', stops);
  }, [methods]);

  // ── Price calculation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTariff) { setCurrentPrice(0); return; }
    const distKm = routeDistance > 0 ? Math.round((routeDistance / 1000) * 10) / 10 : 0;
    const fullTotal = selectedTariff.basePrice +
      distKm * selectedTariff.perKmPrice +
      selectedServices.reduce((sum, sel) => {
        const info = services.find(s => s.id === sel.serviceId);
        return sum + (info?.price || 0) * (sel.quantity || 1);
      }, 0);
    setCurrentPrice(activeSale ? Math.round(fullTotal * (1 - activeSale)) : Math.round(fullTotal));
  }, [selectedTariff, routeDistance, selectedServices, services, activeSale]);

  // ── Auto-select tariff ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'create' && initialTariffId && tariffs.length > 0 && !selectedTariff) {
      const t = tariffs.find(t => t.id === initialTariffId && !t.archived);
      if (t) setSelectedTariff(t);
    }
  }, [mode, initialTariffId, tariffs, selectedTariff]);

  // ── Pre-fill locations ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'create' || (!initialStartLocationId && !initialEndLocationId)) return;
    if (initialStartLocationId) methods.setValue('startLocationId', initialStartLocationId);
    if (initialEndLocationId) methods.setValue('endLocationId', initialEndLocationId);
    let cancelled = false;
    (async () => {
      const [startLoc, endLoc] = await Promise.all([
        initialStartLocationId ? locationsApi.getLocationById(initialStartLocationId).catch(() => null) : null,
        initialEndLocationId ? locationsApi.getLocationById(initialEndLocationId).catch(() => null) : null,
      ]);
      if (cancelled) return;
      const pts: RoutePoint[] = [];
      if (startLoc) pts.push({ latitude: (startLoc as any).latitude ?? 0, longitude: (startLoc as any).longitude ?? 0, type: 'start', id: startLoc.id, label: startLoc.name, location: startLoc as unknown as GetLocationDTO });
      if (endLoc) pts.push({ latitude: (endLoc as any).latitude ?? 0, longitude: (endLoc as any).longitude ?? 0, type: 'end', id: endLoc.id, label: endLoc.name, location: endLoc as unknown as GetLocationDTO });
      if (pts.length) setRoutePoints(pts);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialStartLocationId, initialEndLocationId]);

  useEffect(() => {
    if (mode === 'create' && initialScheduledTime) methods.setValue('scheduledTime', initialScheduledTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialScheduledTime]);

  useEffect(() => {
    if (mode === 'create' && (initialPassengerName || initialPassengerPhone)) {
      methods.setValue('passengers', [{
        id: `passenger-${Date.now()}`, customerId: null,
        firstName: initialPassengerName ?? '', lastName: null,
        phone: initialPassengerPhone ?? null, isMainPassenger: true,
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialPassengerName, initialPassengerPhone]);

  // ── Load existing order data ─────────────────────────────────────────────────
  const [isOrderDataLoaded, setIsOrderDataLoaded] = useState(false);
  const isDriverLoadedRef = useRef(false);

  const orderNumber = existingOrder?.orderNumber ? orderNumberToString(existingOrder.orderNumber) : '';

  useEffect(() => {
    if (existingOrder && !isOrderDataLoaded && tariffs.length > 0 && services.length > 0) {
      setOrderStatus(existingOrder.status as OrderStatus);
      setCustomPrice(existingOrder.initialPrice?.toString() || '');
      if (existingOrder.tariffId) {
        const t = tariffs.find(t => t.id === existingOrder.tariffId);
        if (t) setSelectedTariff(t);
      }
      if (existingOrder.scheduledTime) {
        methods.setValue('scheduledTime', existingOrder.scheduledTime);
        if (!hookInitSetRef.current) {
          hookInitSetRef.current = true;
          setHookInitScheduledTime(existingOrder.scheduledTime);
        }
      }
      methods.setValue('description', existingOrder.description || '');
      methods.setValue('airFlight', existingOrder.airFlight || '');
      methods.setValue('flyReis', existingOrder.flyReis || '');
      methods.setValue('notes', existingOrder.notes || '');
      if (existingOrder.operatorNotes) setOperatorNotes(existingOrder.operatorNotes);
      const startLocId = existingOrder.startLocation?.id || existingOrder.startLocationId;
      const endLocId = existingOrder.endLocation?.id || existingOrder.endLocationId;
      if (startLocId) methods.setValue('startLocationId', startLocId);
      if (endLocId) methods.setValue('endLocationId', endLocId);
      if (existingOrder.additionalStops?.length) methods.setValue('additionalStops', existingOrder.additionalStops);
      if (existingOrder.passengers?.length) {
        methods.setValue('passengers', existingOrder.passengers.map(p => ({
          ...p, lastName: p.lastName || '', phone: p.phone || '',
        })));
      }
      if (existingOrder.services?.length) {
        const svcs: GetOrderServiceDTO[] = [];
        existingOrder.services.forEach(os => {
          const found = services.find(s => s.id === os.serviceId);
          if (found) svcs.push({ serviceId: found.id, quantity: os.quantity, name: found.name, ...(os.notes !== undefined ? { notes: os.notes } : {}) });
        });
        setSelectedServices(svcs);
      }
      if (existingOrder.paymentMethodType) setPaymentMethodType(existingOrder.paymentMethodType);
      if (existingOrder.driverPrice != null) setDriverPrice(existingOrder.driverPrice.toString());
      setIsOrderDataLoaded(true);
    }
  }, [existingOrder, isOrderDataLoaded, tariffs, services, methods, getDriverById]);

  useEffect(() => {
    if (!isEditMode || !existingOrder || isDriverLoadedRef.current) return;
    const rides = existingOrder.rides;
    if (!rides?.length) return;
    const driverId = rides[0].driverId;
    if (!driverId) return;
    isDriverLoadedRef.current = true;
    const cached = getDriverById(driverId);
    if (cached) { setSelectedDriver(cached); setOriginalDriver(cached); return; }
    usersApi.getDriver(driverId).then(d => {
      updateDriverCache(driverId, d); setSelectedDriver(d); setOriginalDriver(d);
    }).catch(err => { logger.error('Ошибка загрузки водителя:', err); isDriverLoadedRef.current = false; });
  }, [isEditMode, existingOrder, getDriverById, updateDriverCache]);

  useEffect(() => {
    if (isEditMode && existingOrder && currentPrice > 0 && customPrice) {
      const diff = Math.abs(parseFloat(customPrice) - currentPrice);
      setUseCustomPrice(diff > 1);
    }
  }, [isEditMode, existingOrder, currentPrice, customPrice]);

  // ── Hooks for submitting ─────────────────────────────────────────────────────
  const { submitOrder, isLoading: isSubmittingOrder } = useScheduledOrderSubmit({
    orderId: isEditMode ? id : undefined,
    shouldUpdatePassengers: isEditMode,
    passengers: isEditMode
      ? (methods.getValues('passengers') as PassengerDTO[])
          ?.map(p => ({ customerId: p.customerId ?? null, firstName: p.firstName, lastName: p.lastName ?? null, phone: p.phone ?? null, isMainPassenger: p.isMainPassenger }))
      : undefined,
    onSuccess: _order => {
      if (mode === 'create' && fromFormId) {
        customerOrderFormsApi.updateStatus(fromFormId, 'Verified').catch(() => {});
      }
      if (!selectedDriver) router.push('/orders');
    },
  });

  const { assignDriver, isLoading: isAssigningDriver } = useScheduledRideSubmit({
    onSuccess: () => router.push('/orders'),
  });

  const shouldAssignDriverInEditMode = useCallback(() => {
    if (!isEditMode) return false;
    if (!originalDriver && selectedDriver) return true;
    if (originalDriver && selectedDriver && originalDriver.id !== selectedDriver.id) return true;
    return false;
  }, [isEditMode, originalDriver, selectedDriver]);

  // ── Route summary for display ────────────────────────────────────────────────
  const routeStartLocation = useMemo(() => routePoints.find(p => p.type === 'start')?.location ?? null, [routePoints]);
  const routeEndLocation = useMemo(() => routePoints.find(p => p.type === 'end')?.location ?? null, [routePoints]);
  const routeIntermediate = useMemo(
    () => routePoints.filter(p => p.type === 'intermediate' && p.location).map(p => p.location as GetLocationDTO),
    [routePoints],
  );

  // ── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if ((userRole === 'admin' || userRole === 'operator') && !driverPrice) {
      toast.error('Укажите сумму водителя');
      return;
    }
    try {
      const routePointsWithLocations = routePoints.filter(p => p.location);
      const startLoc = routePointsWithLocations[0]?.location ?? (isEditMode ? existingOrder?.startLocation : null);
      const endLoc = routePointsWithLocations[routePointsWithLocations.length - 1]?.location ?? (isEditMode ? existingOrder?.endLocation : null);
      const startLocationId = startLoc?.id || (isEditMode ? existingOrder?.startLocationId : null) || null;
      const endLocationId = endLoc?.id || (isEditMode ? existingOrder?.endLocationId : null) || null;

      const orderData = {
        tariffId: selectedTariff?.id || '',
        routeId: null,
        startLocationId,
        endLocationId,
        startAddress: startLoc?.address || startLoc?.name || '',
        endAddress: endLoc?.address || endLoc?.name || '',
        additionalStops: routePointsWithLocations.slice(1, -1).map(p => p.location!.id),
        services: selectedServices.filter(s => !!s.serviceId).map(s => ({ serviceId: s.serviceId, quantity: s.quantity || 1, notes: s.notes || null })),
        initialPrice: (() => {
          if (useCustomPrice && customPrice) { const n = parseFloat(customPrice); return isNaN(n) ? 0 : n; }
          if (!selectedTariff) return 0;
          const dist = routeDistance ? Math.round((routeDistance / 1000) * 10) / 10 : 0;
          const dm = activeSale ? 1 - activeSale : 1;
          return Math.round(
            (selectedTariff.basePrice || 0) * dm +
            dist * (selectedTariff.perKmPrice || 0) * dm +
            selectedServices.reduce((s, sel) => { const svc = services.find(x => x.id === sel.serviceId); return s + ((svc?.price || 0) * dm) * (sel.quantity || 1); }, 0)
          );
        })(),
        scheduledTime: (() => {
          const v = methods.getValues('scheduledTime');
          return v && typeof v === 'string' ? new Date(v).toISOString() : new Date().toISOString();
        })(),
        passengers: (() => {
          const pData = methods.getValues('passengers');
          const pArr = Array.isArray(pData) ? (pData as PassengerDTO[]) : [];
          return pArr.map(p => ({ customerId: p.customerId || null, phone: p.phone || null, firstName: p.firstName, lastName: p.lastName || null, isMainPassenger: p.isMainPassenger }));
        })(),
        description: (() => { const v = methods.getValues('description'); return v && typeof v === 'string' ? v : null; })(),
        airFlight: (() => { const v = methods.getValues('airFlight'); return v && typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9\s-]/g, '') : null; })(),
        flyReis: (() => { const v = methods.getValues('flyReis'); return v && typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9\s-]/g, '') : null; })(),
        notes: (() => { const v = methods.getValues('notes'); return v && typeof v === 'string' ? v : null; })(),
        operatorNotes: (userRole === 'admin' || userRole === 'operator') ? operatorNotes.trim() || null : null,
        paymentMethodType: userRole === 'partner' ? PaymentMethodType.Card : paymentMethodType,
        driverPrice: (userRole === 'admin' || userRole === 'operator') && driverPrice ? parseFloat(driverPrice) || null : null,
      };

      const resultOrder = await submitOrder({ ...orderData, status: orderStatus, subStatus: orderSubStatus });

      const shouldAssignDriver = selectedDriver && (!isEditMode || shouldAssignDriverInEditMode());
      if (shouldAssignDriver) {
        const carId = selectedDriver!.activeCar?.id || selectedDriver!.activeCarId;
        if (!carId) { toast.error('У выбранного водителя нет активного автомобиля.'); return; }
        const orderIdForDriver = isEditMode ? id : resultOrder?.id;
        if (!orderIdForDriver) { toast.error('Не удалось получить ID заказа.'); return; }
        await assignDriver(orderIdForDriver, { driverId: selectedDriver!.id, carId, waypoints: [] });
      } else {
        router.push('/orders');
      }
    } catch (error) {
      logger.error('Ошибка сохранения заказа:', error);
      if (!(error instanceof ApiRequestError)) {
        toast.error(error instanceof Error ? error.message : 'Произошла непредвиденная ошибка');
      }
    }
  };

  // ── Validation summary ───────────────────────────────────────────────────────
  const currentPassengers = methods.getValues('passengers') as PassengerDTO[];
  const validationItems = [
    { label: 'Тариф', ok: !!selectedTariff },
    { label: 'Дата и время', ok: !!formData.scheduledTime && scheduleValid },
    { label: 'Пассажиры', ok: Array.isArray(currentPassengers) && currentPassengers.length > 0 && currentPassengers.every(p => !!(p.phone?.trim())) },
    { label: 'Маршрут', ok: !!formData.startLocationId && !!formData.endLocationId },
  ];
  const allValid = validationItems.every(v => v.ok);

  // ── Loading guard ─────────────────────────────────────────────────────────────
  if (dataLoading || (isEditMode && isLoadingOrder)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{isEditMode ? 'Загрузка заказа...' : 'Загрузка данных...'}</p>
        </div>
      </div>
    );
  }
  if (dataError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-3 text-sm">Ошибка загрузки данных</p>
          <Button onClick={refetch} variant="outline" size="sm">Повторить</Button>
        </div>
      </div>
    );
  }

  // ─── Formatted price ─────────────────────────────────────────────────────────
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KGS', minimumFractionDigits: 0 }).format(n);
  const effectivePrice = useCustomPrice && customPrice ? (parseFloat(customPrice) || currentPrice) : currentPrice;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 bg-white border-b shadow-sm">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} className="gap-1.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {mode === 'create' ? 'Новый плановый заказ' : 'Редактирование заказа'}
              {mode === 'edit' && orderNumber && <span className="text-blue-600 ml-1.5">#{orderNumber}</span>}
            </h1>
          </div>
        </div>

        {/* Center: status selects (edit only) */}
        {mode === 'edit' && (
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={orderStatus}
              onChange={e => setOrderStatus(e.target.value as OrderStatus)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(orderStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={orderSubStatus}
              onChange={e => setOrderSubStatus(e.target.value as OrderSubStatus)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {OrderSubStatusValues.map(s => <option key={s} value={s}>{orderSubStatusLabels[s]}</option>)}
            </select>
          </div>
        )}

        {/* Right: validation + save */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Validation mini-chips */}
          <div className="hidden lg:flex items-center gap-1">
            {validationItems.map(item => (
              <span key={item.label} className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {item.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {item.label}
              </span>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSubmittingOrder || isAssigningDriver}
            className={`gap-1.5 text-sm ${!allValid ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            <Save className="h-4 w-4" />
            {isAssigningDriver ? 'Назначение...' : isSubmittingOrder ? 'Сохранение...' : mode === 'create' ? 'Создать заказ' : 'Сохранить'}
          </Button>
        </div>
      </header>

      {/* ─── BODY: 3 columns ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ═══ LEFT PANEL: Passengers + Schedule ══════════════════════════════ */}
        <div className="w-72 flex-shrink-0 bg-white border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {/* ── Passengers ─────────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader
                icon={User}
                title="Пассажиры"
                extra={
                  <span className="text-xs text-gray-400">{managedPassengers.length}/{maxPassengers}</span>
                }
              />

              {/* Search (admin/operator only) */}
              {userRole !== 'partner' && (
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    placeholder="Поиск клиента..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  {isSearching && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                </div>
              )}

              {/* Search results dropdown */}
              {searchQuery.trim() && filteredUsers.length > 0 && (
                <div className="mb-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto bg-white shadow-sm">
                  {filteredUsers.slice(0, 6).map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(user);
                        fillFromCustomer(user.id);
                        setSearchQuery('');
                      }}
                      disabled={!canAddMorePassengers || managedPassengers.some(p => (p as any).customerId === user.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-900 truncate">{user.fullName}</div>
                        <div className="text-xs text-gray-500 truncate">{user.phoneNumber || user.email}</div>
                      </div>
                      <Plus className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Passenger cards */}
              <div className="space-y-2">
                {managedPassengers.map((passenger, idx) => {
                  const country = getCountryForPassenger(passenger);
                  const nationalNumber = getNationalNumber(passenger.phone ?? '', country);
                  const isEmpty = !nationalNumber;
                  const phoneErr = phoneErrors[passenger.id];
                  const digitHint = typeof country.digitCount === 'number' ? `${country.digitCount} цифр` : `${country.digitCount[0]}–${country.digitCount[1]} цифр`;

                  return (
                    <div
                      key={passenger.id}
                      className={`rounded-xl border p-2.5 space-y-2 transition-colors ${passenger.isMainPassenger ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${passenger.isMainPassenger ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          {passenger.isFromSystem || passenger.userData ? (
                            <span className="text-xs font-medium text-gray-900 truncate block">
                              {passenger.userData?.fullName || passenger.firstName}
                            </span>
                          ) : (
                            <input
                              value={passenger.firstName === 'Имя не указано' ? '' : passenger.firstName}
                              placeholder="Имя пассажира"
                              onChange={e => updatePassenger(passenger.id, 'firstName', e.target.value || 'Имя не указано')}
                              className="w-full text-xs font-medium bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 pb-0.5 truncate"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {!passenger.isMainPassenger && (
                            <button
                              type="button"
                              title="Сделать основным"
                              onClick={() => setMainPassenger(passenger.id)}
                              className="p-0.5 rounded hover:bg-yellow-100 text-gray-400 hover:text-yellow-600 transition-colors"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          {managedPassengers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePassenger(passenger.id)}
                              className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      {passenger.isFromSystem || passenger.userData ? (
                        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${(passenger.userData?.phoneNumber || passenger.phone) ? 'bg-white border border-gray-200 text-gray-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{passenger.userData?.phoneNumber || passenger.phone || 'Телефон не указан — обязателен!'}</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className={`flex h-8 rounded-lg border overflow-hidden text-xs ${phoneErr || isEmpty ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                            <select
                              value={country.code}
                              onChange={e => handlePassengerCountryChange(passenger.id, e.target.value)}
                              className="h-full bg-gray-50 border-r border-gray-200 text-xs pl-1.5 pr-0.5 focus:outline-none cursor-pointer shrink-0"
                            >
                              {COUNTRY_OPTIONS.map(c => (
                                <option key={c.code} value={c.code}>{c.flag} {c.dialCode}</option>
                              ))}
                            </select>
                            <input
                              placeholder={digitHint}
                              value={nationalNumber}
                              maxLength={typeof country.digitCount === 'number' ? country.digitCount : country.digitCount[1]}
                              onChange={e => handlePassengerNationalNumberChange(passenger.id, e.target.value, country)}
                              className="flex-1 min-w-0 px-2 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none"
                            />
                          </div>
                          {(phoneErr || isEmpty) && (
                            <p className="text-xs text-red-500 leading-tight">
                              {phoneErr || 'Телефон обязателен *'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Main badge */}
                      {passenger.isMainPassenger && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Основной пассажир
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add passenger button */}
              {canAddMorePassengers && (
                <button
                  type="button"
                  onClick={addPassenger}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-400 rounded-xl hover:bg-blue-50 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить пассажира
                </button>
              )}
            </div>

            {/* ── Date & Time ─────────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader icon={CalendarIcon} title="Дата и время" />
              <div className="space-y-2">
                <Calendar
                  key={selectedDate?.toISOString() || 'no-date'}
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  defaultMonth={selectedDate}
                  disabled={date => {
                    const now = new Date();
                    const today = new Date(new Date(now.getTime() + 60000));
                    today.setHours(0, 0, 0, 0);
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                  showOutsideDays={false}
                  fixedWeeks
                  className="p-0 origin-top-left"
                  formatters={{ formatWeekdayName: d => d.toLocaleString('ru-RU', { weekday: 'short' }) }}
                  showTimePicker={!!selectedDate}
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  isTimeDisabled={isTimeDisabled}
                  onTimeChange={handleTimeChange}
                />
                {selectedDate && selectedTime && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в {selectedTime}
                    </span>
                  </div>
                )}
                {!selectedDate && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Выберите дату поездки
                  </div>
                )}
              </div>
            </div>

            {/* ── Flight ──────────────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader icon={Plane} title="Рейс" />
              <div className="space-y-2">
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs gap-0.5">
                  {([null, 'departure', 'arrival'] as const).map(t => (
                    <button
                      key={String(t)}
                      type="button"
                      onClick={() => handleFlightTypeChange(t)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-all ${flightType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t === null && 'Нет'}
                      {t === 'departure' && <><PlaneTakeoff className="h-3 w-3" /> Вылет</>}
                      {t === 'arrival' && <><PlaneLanding className="h-3 w-3" /> Прилет</>}
                    </button>
                  ))}
                </div>
                {flightType === 'departure' && (
                  <input
                    placeholder="SU 1234"
                    value={formData.airFlight}
                    onChange={e => methods.setValue('airFlight', e.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, ''))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                )}
                {flightType === 'arrival' && (
                  <input
                    placeholder="SU 5678"
                    value={formData.flyReis}
                    onChange={e => methods.setValue('flyReis', e.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, ''))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                )}
              </div>
            </div>

            {/* ── Notes ───────────────────────────────────────────────────── */}
            <div className="p-3">
              <SectionHeader icon={Info} title="Комментарии" />
              <Textarea
                placeholder="Особые требования, встреча с табличкой..."
                value={formData.description}
                onChange={e => methods.setValue('description', e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Map ════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <MapTab
            startLocationId={(isEditMode ? existingOrder?.startLocation?.id || existingOrder?.startLocationId : undefined) || (methods.getValues('startLocationId') as string) || ''}
            endLocationId={(isEditMode ? existingOrder?.endLocation?.id || existingOrder?.endLocationId : undefined) || (methods.getValues('endLocationId') as string) || ''}
            additionalStops={isEditMode && existingOrder?.additionalStops ? existingOrder.additionalStops : (methods.getValues('additionalStops') as string[]) || []}
            mode={mode}
            rides={existingOrder?.rides}
            routePoints={routePoints}
            setRoutePoints={setRoutePoints}
            selectedDriver={selectedDriver}
            setSelectedDriver={setSelectedDriver}
            dynamicMapCenter={dynamicMapCenter}
            setDynamicMapCenter={setDynamicMapCenter}
            openDriverPopupId={openDriverPopupId}
            setOpenDriverPopupId={setOpenDriverPopupId}
            selectedTariff={selectedTariff}
            scheduledTime={(methods.getValues('scheduledTime') as string) || existingOrder?.scheduledTime}
            requestedCarId={existingOrder?.requestedCar}
            onRoutePointsChange={handleRoutePointsChange}
            onRouteDistanceChange={setRouteDistance}
            onRouteLoadingChange={setRouteLoading}
            userRole={userRole}
          />
        </div>

        {/* ═══ RIGHT PANEL: Tariff + Services + Price + Payment + Submit ══════ */}
        <div className="w-80 flex-shrink-0 bg-white border-l flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {/* ── Tariffs ──────────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader
                icon={Star}
                title="Тариф"
                extra={
                  <button onClick={refetchTariffs} disabled={isRefreshingTariffs} className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingTariffs ? 'animate-spin' : ''}`} />
                  </button>
                }
              />
              <div className="space-y-1.5">
                {tariffs.filter(t => !t.archived).map(tariff => {
                  const isSelected = selectedTariff?.id === tariff.id;
                  const price = activeSale ? Math.round(tariff.basePrice * (1 - activeSale)) : tariff.basePrice;
                  return (
                    <button
                      key={tariff.id}
                      type="button"
                      onClick={() => setSelectedTariff(tariff)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{tariff.name}</div>
                        <div className="text-xs text-gray-500 truncate">{tariff.carType}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{fmt(price)}</div>
                        <div className="text-xs text-gray-400">{tariff.perKmPrice} с/км</div>
                      </div>
                    </button>
                  );
                })}
                {tariffs.filter(t => !t.archived).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Нет доступных тарифов</p>
                )}
              </div>
            </div>

            {/* ── Route summary ─────────────────────────────────────────── */}
            {(routeStartLocation || routeEndLocation) && (
              <div className="p-3 border-b">
                <SectionHeader icon={Info} title="Маршрут" />
                <div className="space-y-1">
                  {routeStartLocation && (
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 leading-tight">{routeStartLocation.name}</span>
                    </div>
                  )}
                  {routeIntermediate.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 leading-tight">{p.name}</span>
                    </div>
                  ))}
                  {routeEndLocation && (
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 leading-tight">{routeEndLocation.name}</span>
                    </div>
                  )}
                  {routeDistance > 0 && (
                    <div className="mt-1.5 text-xs font-medium text-gray-600">
                      {Math.round(routeDistance / 1000)} км
                      {routeLoading && <span className="ml-1 text-blue-500 animate-pulse">считается...</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Services ─────────────────────────────────────────────── */}
            {services.length > 0 && (
              <div className="p-3 border-b">
                <SectionHeader icon={Check} title="Доп. услуги" />
                <div className="space-y-1.5">
                  {services.map(svc => {
                    const sel = selectedServices.find(s => s.serviceId === svc.id);
                    const isSelected = !!sel;
                    return (
                      <div key={svc.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs transition-all ${isSelected ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <button
                          type="button"
                          onClick={() => handleServiceToggle(svc.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'}`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={`flex-1 font-medium ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>{svc.name}</span>
                        <span className="text-gray-500 flex-shrink-0">{fmt(activeSale ? Math.round(svc.price * (1 - activeSale)) : svc.price)}</span>
                        {isSelected && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={() => handleServiceQuantityChange(svc.id, -1)} className="w-5 h-5 rounded bg-green-200 hover:bg-green-300 flex items-center justify-center text-green-800 font-bold leading-none transition-colors">−</button>
                            <span className="w-4 text-center font-semibold text-green-800">{sel!.quantity}</span>
                            <button type="button" onClick={() => handleServiceQuantityChange(svc.id, 1)} className="w-5 h-5 rounded bg-green-200 hover:bg-green-300 flex items-center justify-center text-green-800 font-bold leading-none transition-colors">+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Price breakdown ───────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader icon={Banknote} title="Стоимость" />
              {selectedTariff ? (
                <div className="space-y-1.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Базовая цена</span>
                      <span>{fmt(activeSale ? Math.round(selectedTariff.basePrice * (1 - activeSale)) : selectedTariff.basePrice)}</span>
                    </div>
                    {routeDistance > 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{Math.round(routeDistance / 1000)} км × {fmt(activeSale ? Math.round(selectedTariff.perKmPrice * (1 - activeSale)) : selectedTariff.perKmPrice)}</span>
                        <span>{fmt(activeSale
                          ? Math.round((routeDistance / 1000) * selectedTariff.perKmPrice * (1 - activeSale))
                          : Math.round((routeDistance / 1000) * selectedTariff.perKmPrice))}</span>
                      </div>
                    )}
                    {selectedServices.map(sel => {
                      const svc = services.find(s => s.id === sel.serviceId);
                      if (!svc) return null;
                      const price = activeSale ? Math.round(svc.price * (1 - activeSale)) : svc.price;
                      return (
                        <div key={sel.serviceId} className="flex justify-between text-xs text-gray-600">
                          <span>{svc.name} ×{sel.quantity}</span>
                          <span>{fmt(price * sel.quantity)}</span>
                        </div>
                      );
                    })}
                    {activeSale && activeSale > 0 && (
                      <div className="flex justify-between text-xs text-green-600 font-medium">
                        <span>Скидка {Math.round(activeSale * 100)}%</span>
                        <span>−{fmt(Math.round(currentPrice / (1 - activeSale) - currentPrice))}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-gray-900">Итого</span>
                    <span className="text-base font-bold text-gray-900">{fmt(effectivePrice)}</span>
                  </div>

                  {/* Custom price */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomPrice}
                        onChange={() => {
                          setUseCustomPrice(!useCustomPrice);
                          if (!useCustomPrice) setCustomPrice(currentPrice.toString());
                        }}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-gray-600">Указать цену вручную</span>
                    </label>
                    {useCustomPrice && (
                      <input
                        type="number"
                        min="0"
                        placeholder="Введите цену"
                        value={customPrice}
                        onChange={e => setCustomPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-semibold border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Выберите тариф для расчёта стоимости</p>
              )}
            </div>

            {/* ── Payment method ────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader icon={CreditCard} title="Оплата" />
              {userRole === 'partner' ? (
                <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg px-2.5 py-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  Безналичный расчёт
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType(PaymentMethodType.Cash)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${paymentMethodType === PaymentMethodType.Cash ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Наличные
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType(PaymentMethodType.Card)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${paymentMethodType === PaymentMethodType.Card ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Безнал
                  </button>
                </div>
              )}
            </div>

            {/* ── Driver price (admin/operator) ─────────────────────────── */}
            {(userRole === 'admin' || userRole === 'operator') && (
              <div className="p-3 border-b">
                <SectionHeader icon={User} title="Сумма водителя" />
                <div className="space-y-1">
                  <input
                    type="number"
                    min="0"
                    max={effectivePrice}
                    placeholder="Сумма для водителя (сом)"
                    value={driverPrice}
                    onChange={e => setDriverPrice(e.target.value)}
                    className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                      !driverPrice ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : parseFloat(driverPrice) > effectivePrice ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {!driverPrice && (
                    <p className="text-xs text-red-500">⚠ Обязательное поле</p>
                  )}
                  {driverPrice && parseFloat(driverPrice) > effectivePrice && (
                    <p className="text-xs text-red-500">Превышает стоимость поездки ({fmt(effectivePrice)})</p>
                  )}
                  {effectivePrice > 0 && driverPrice && (
                    <p className="text-xs text-gray-400">Макс: {fmt(effectivePrice)}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Selected driver summary ───────────────────────────────── */}
            {selectedDriver && (
              <div className="p-3 border-b">
                <SectionHeader icon={User} title="Водитель" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {selectedDriver.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'В'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 truncate">{selectedDriver.fullName}</div>
                    <div className="text-xs text-gray-500">{selectedDriver.phoneNumber}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notes ────────────────────────────────────────────────── */}
            <div className="p-3 border-b">
              <SectionHeader icon={Info} title="Заметки" />
              <Textarea
                placeholder="Заметки к заказу..."
                value={formData.notes}
                onChange={e => methods.setValue('notes', e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* ── Operator notes (admin/operator) ───────────────────────── */}
            {(userRole === 'admin' || userRole === 'operator') && (
              <div className="p-3">
                <SectionHeader icon={Info} title="Заметки оператора" />
                <Textarea
                  placeholder="Только для операторов..."
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  rows={2}
                  className="text-xs resize-none bg-amber-50 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                />
              </div>
            )}
          </div>

          {/* ── Fixed save button ─────────────────────────────────────── */}
          <div className="flex-shrink-0 p-3 border-t bg-gray-50">
            {/* Validation summary */}
            {!allValid && (
              <div className="mb-2 space-y-0.5">
                {validationItems.filter(v => !v.ok).map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-orange-700">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>Не заполнено: {item.label}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isSubmittingOrder || isAssigningDriver}
              className={`w-full gap-2 ${!allValid ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <Save className="h-4 w-4" />
              {isAssigningDriver ? 'Назначение водителя...' : isSubmittingOrder ? 'Сохранение...' : mode === 'create' ? 'Создать заказ' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
