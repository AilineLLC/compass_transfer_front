'use client';

import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  User,
  Car,
  Users,
  Clock,
  Banknote,
  Timer,
  Phone,
  ArrowRight,
  CalendarClock,
  Armchair,
  Mail,
  Hash,
  Palette,
  Star,
  Shield,
  ClipboardList,
  Check,
  X,
  Flame,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { transfersApi, type GetTransferDTO, type TransferPassenger } from '@shared/api/transfers';
import { transferReservationsApi, type TransferReservationDTO } from '@shared/api/transfer-reservations';
import { DeleteConfirmationModal } from '@shared/ui/modals';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm'>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent ?? 'bg-primary/10'}`}>
        <Icon className={`h-4 w-4 ${accent ? 'text-white' : 'text-primary'}`} />
      </div>
      <div className='min-w-0'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold truncate'>{value}</p>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className='rounded-2xl border bg-white shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between gap-3 px-5 py-3.5 border-b bg-gray-50/60'>
        <div className='flex items-center gap-2 py-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10'>
            <Icon className='h-3.5 w-3.5 text-primary' />
          </div>
          <p className='font-semibold text-sm'>{title}</p>
        </div>
        {action}
      </div>
      <div className='px-5 py-4'>{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='text-sm font-medium'>{value ?? '—'}</span>
    </div>
  );
}

interface TransferViewPageProps {
  transfer: GetTransferDTO;
}

export function TransferViewPage({ transfer: initialTransfer }: TransferViewPageProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState<GetTransferDTO>(initialTransfer);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [passengerToDelete, setPassengerToDelete] = useState<TransferPassenger | null>(null);
  const [reservations, setReservations] = useState<TransferReservationDTO[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await transferReservationsApi.getReservations({ Transfer: transfer.id, size: 100 });
        setReservations(res.data);
      } catch {
        // silent — reservations section will show empty state
      } finally {
        setReservationsLoading(false);
      }
    };
    load();
  }, [transfer.id]);

  const handleApprove = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await transferReservationsApi.approveReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      const updated = await transfersApi.getTransferById(transfer.id);
      setTransfer(updated);
      toast.success('Заявка одобрена');
    } catch {
      toast.error('Не удалось одобрить заявку');
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await transferReservationsApi.rejectReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
      toast.success('Заявка отклонена');
    } catch {
      toast.error('Не удалось отклонить заявку');
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDelete = async () => {
    await transfersApi.deleteTransfer(transfer.id);
    toast.success('Трансфер удалён');
    router.push('/transfers');
  };

  const handleDeletePassenger = async () => {
    if (!passengerToDelete) return;
    const updatedPassengers = transfer.passengers.filter(p => p !== passengerToDelete);
    await transfersApi.updateTransfer(transfer.id, {
      departureTime: transfer.departureTime,
      duration: transfer.duration,
      price: transfer.price,
      ...(transfer.driverPrice != null ? { driverPrice: transfer.driverPrice } : {}),
      allowPartialReservations: transfer.allowPartialReservations,
      isHot: transfer.isHot,
      passengers: updatedPassengers.map(p => ({
        customerId: p.customerId,
        reservedSeats: p.reservedSeats,
        name: p.name,
        phone: p.phone,
      })),
      startLocation: transfer.startLocation.id,
      endLocation: transfer.endLocation.id,
      car: transfer.car?.id ?? '',
      driver: transfer.driver?.id ?? '',
    });
    setTransfer(prev => ({ ...prev, passengers: updatedPassengers }));
    toast.success('Пассажир удалён');
    setPassengerToDelete(null);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden bg-gray-50'>
      {/* Шапка */}
      <div className='sticky top-0 z-10 p-3 bg-white border-b px-6 py-3.5 flex items-center justify-between shadow-sm'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/transfers')}
            className='gap-1.5 text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='h-4 w-4' />
            Назад
          </Button>
          <div className='h-5 w-px bg-border' />
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-base font-bold tracking-tight'>Трансфер</h1>
              {transfer.isHot && (
                <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200'>
                  <Flame className='h-3 w-3' />
                  Горячий
                </span>
              )}
            </div>
            <p className='text-xs text-muted-foreground font-mono'>{transfer.id}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push(`/transfers/${transfer.id}/edit`)}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Редактировать
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setIsDeleteOpen(true)}
            className='gap-2'
          >
            <Trash2 className='h-4 w-4' />
            Удалить
          </Button>
        </div>
      </div>

      {/* Контент */}
      <div className='flex-1 overflow-y-auto px-6 py-5 space-y-5'>

        {/* Ключевые показатели */}
        <div className='grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3'>
          <StatCard
            icon={CalendarClock}
            label='Отправление'
            value={formatDate(transfer.departureTime)}
          />
          <StatCard
            icon={Banknote}
            label='Цена'
            value={`${transfer.price.toLocaleString('ru-RU')} сом`}
            accent='bg-green-500'
          />
          {transfer.duration != null && (
            <StatCard
              icon={Timer}
              label='Продолжительность'
              value={`${transfer.duration} мин`}
            />
          )}
          <StatCard
            icon={Armchair}
            label='Свободных мест'
            value={transfer.freeSeats}
          />
          <StatCard
            icon={Users}
            label='Пассажиров'
            value={transfer.passengers.length}
          />
        </div>

        {/* Маршрут */}
        <SectionCard icon={MapPin} title='Маршрут'>
          <div className='flex flex-col md:flex-row items-stretch gap-3'>
            {/* Откуда */}
            <div className='flex-1 rounded-xl bg-green-50 border border-green-200 p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-green-500 shrink-0' />
                <span className='text-xs font-semibold text-green-700 uppercase tracking-wide'>Откуда</span>
              </div>
              <p className='font-semibold text-sm leading-snug'>{transfer.startLocation?.name ?? '—'}</p>
              {transfer.startLocation?.address && (
                <p className='text-xs text-muted-foreground mt-1'>{transfer.startLocation.address}</p>
              )}
              {transfer.startLocation?.city && (
                <p className='text-xs text-muted-foreground'>
                  {transfer.startLocation.city}, {transfer.startLocation.country}
                </p>
              )}
            </div>

            <div className='flex items-center justify-center shrink-0'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 border'>
                <ArrowRight className='h-4 w-4 text-gray-500' />
              </div>
            </div>

            {/* Куда */}
            <div className='flex-1 rounded-xl bg-red-50 border border-red-200 p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-red-500 shrink-0' />
                <span className='text-xs font-semibold text-red-700 uppercase tracking-wide'>Куда</span>
              </div>
              <p className='font-semibold text-sm leading-snug'>{transfer.endLocation?.name ?? '—'}</p>
              {transfer.endLocation?.address && (
                <p className='text-xs text-muted-foreground mt-1'>{transfer.endLocation.address}</p>
              )}
              {transfer.endLocation?.city && (
                <p className='text-xs text-muted-foreground'>
                  {transfer.endLocation.city}, {transfer.endLocation.country}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Водитель и Автомобиль */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

          {/* Водитель */}
          <SectionCard icon={User} title='Водитель'>
            {transfer.driver ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary'>
                    {transfer.driver.fullName?.charAt(0)?.toUpperCase() ?? 'D'}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-semibold text-sm truncate'>{transfer.driver.fullName}</p>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <Badge variant={transfer.driver.online ? 'default' : 'secondary'} className='text-xs'>
                        {transfer.driver.online ? 'Онлайн' : 'Офлайн'}
                      </Badge>
                      {transfer.driver.status && (
                        <span className='text-xs text-muted-foreground'>{transfer.driver.status}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 border-t pt-3'>
                  {transfer.driver.phoneNumber && (
                    <InfoItem
                      label='Телефон'
                      value={
                        <span className='flex items-center gap-1.5'>
                          <Phone className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                          {transfer.driver.phoneNumber}
                        </span>
                      }
                    />
                  )}
                  {transfer.driver.email && (
                    <InfoItem
                      label='Email'
                      value={
                        <span className='flex items-center gap-1.5 truncate'>
                          <Mail className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                          <span className='truncate'>{transfer.driver.email}</span>
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                  <User className='h-5 w-5 text-gray-400' />
                </div>
                <p className='text-sm text-muted-foreground'>Водитель не назначен</p>
              </div>
            )}
          </SectionCard>

          {/* Автомобиль */}
          <SectionCard icon={Car} title='Автомобиль'>
            {transfer.car ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100'>
                    <Car className='h-6 w-6 text-gray-500' />
                  </div>
                  <div className='min-w-0'>
                    <p className='font-semibold text-sm'>{transfer.car.make} {transfer.car.model}</p>
                    <div className='flex items-center gap-2 mt-1 flex-wrap'>
                      <code className='text-xs bg-gray-100 border px-1.5 py-0.5 rounded font-mono'>
                        {transfer.car.licensePlate}
                      </code>
                      <Badge variant={transfer.car.status === 'Available' ? 'default' : 'secondary'} className='text-xs'>
                        {transfer.car.status === 'Available' ? 'Доступен' : transfer.car.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-3 border-t pt-3'>
                  <InfoItem label='Год' value={
                    <span className='flex items-center gap-1'>
                      <Clock className='h-3 w-3 text-muted-foreground' />
                      {transfer.car.year}
                    </span>
                  } />
                  <InfoItem label='Цвет' value={
                    <span className='flex items-center gap-1'>
                      <Palette className='h-3 w-3 text-muted-foreground' />
                      {transfer.car.color}
                    </span>
                  } />
                  <InfoItem label='Вместимость' value={
                    <span className='flex items-center gap-1'>
                      <Users className='h-3 w-3 text-muted-foreground' />
                      {transfer.car.passengerCapacity} мест
                    </span>
                  } />
                  <InfoItem label='Тип' value={
                    <span className='flex items-center gap-1'>
                      <Hash className='h-3 w-3 text-muted-foreground' />
                      {transfer.car.type}
                    </span>
                  } />
                  <InfoItem label='Класс' value={
                    <span className='flex items-center gap-1'>
                      <Star className='h-3 w-3 text-muted-foreground' />
                      {transfer.car.serviceClass}
                    </span>
                  } />
                </div>

                {transfer.car.features?.length > 0 && (
                  <div className='border-t pt-3'>
                    <p className='text-xs text-muted-foreground mb-2'>Оснащение</p>
                    <div className='flex flex-wrap gap-1.5'>
                      {transfer.car.features.map(f => (
                        <Badge key={f} variant='outline' className='text-xs gap-1'>
                          <Shield className='h-2.5 w-2.5' />
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                  <Car className='h-5 w-5 text-gray-400' />
                </div>
                <p className='text-sm text-muted-foreground'>Автомобиль не назначен</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Пассажиры */}
        <SectionCard
          icon={Users}
          title='Пассажиры'
          action={
            transfer.passengers.length > 0 ? (
              <span className='text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full'>
                {transfer.passengers.length}
              </span>
            ) : undefined
          }
        >
          {transfer.passengers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                <Users className='h-5 w-5 text-gray-400' />
              </div>
              <p className='text-sm text-muted-foreground'>Пассажиры не указаны</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
              {transfer.passengers.map((p, i) => (
                <div
                  key={i}
                  className='flex items-center gap-3 rounded-xl bg-gray-50 border px-4 py-3 transition-colors group hover:bg-white hover:shadow-sm'
                >
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                    {i + 1}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-sm truncate'>{p.name || '—'}</p>
                      {p.customerId && (
                        <Badge variant='outline' className='text-xs shrink-0'>Клиент</Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-3 mt-0.5 flex-wrap'>
                      {p.phone && (
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Phone className='h-3 w-3' />
                          {p.phone}
                        </span>
                      )}
                      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Armchair className='h-3 w-3' />
                        {p.reservedSeats} {p.reservedSeats === 1 ? 'место' : 'мест'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 transition-opacity'
                    onClick={() => setPassengerToDelete(p)}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Заявки */}
        <SectionCard
          icon={ClipboardList}
          title='Заявки'
          action={
            reservations.length > 0 ? (
              <span className='text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full'>
                {reservations.length}
              </span>
            ) : undefined
          }
        >
          {reservationsLoading ? (
            <p className='text-sm text-muted-foreground py-4 text-center'>Загрузка заявок...</p>
          ) : reservations.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                <ClipboardList className='h-5 w-5 text-gray-400' />
              </div>
              <p className='text-sm text-muted-foreground'>Заявок нет</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
              {reservations.map(r => {
                const isPending = r.status === 'Pending';
                const isProcessing = processingIds.has(r.id);
                return (
                  <div
                    key={r.id}
                    className='flex flex-col gap-3 rounded-xl bg-gray-50 border px-4 py-3'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='font-medium text-sm truncate'>{r.name || '—'}</p>
                        {r.phone && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
                            <Phone className='h-3 w-3' />
                            {r.phone}
                          </span>
                        )}
                        <span className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
                          <Armchair className='h-3 w-3' />
                          {r.reservedSeats} {r.reservedSeats === 1 ? 'место' : 'мест'}
                        </span>
                      </div>
                      <Badge
                        variant='outline'
                        className={
                          r.status === 'Verified'
                            ? 'text-green-700 border-green-300 bg-green-50 shrink-0'
                            : r.status === 'Rejected'
                            ? 'text-red-700 border-red-300 bg-red-50 shrink-0'
                            : 'text-amber-700 border-amber-300 bg-amber-50 shrink-0'
                        }
                      >
                        {r.status === 'Verified' ? 'Одобрено' : r.status === 'Rejected' ? 'Отклонено' : 'Ожидает'}
                      </Badge>
                    </div>
                    {isPending && (
                      <div className='flex gap-2 border-t pt-2'>
                        <Button
                          size='sm'
                          className='flex-1 h-7 gap-1 bg-green-600 hover:bg-green-700 text-white'
                          disabled={isProcessing}
                          onClick={() => handleApprove(r.id)}
                        >
                          <Check className='h-3.5 w-3.5' />
                          Одобрить
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='flex-1 h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50'
                          disabled={isProcessing}
                          onClick={() => handleReject(r.id)}
                        >
                          <X className='h-3.5 w-3.5' />
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Метаданные */}
        <div className='flex items-center gap-6 text-xs text-muted-foreground px-1'>
          <span className='flex items-center gap-1.5'>
            <Clock className='h-3.5 w-3.5' />
            Создан: {formatDate(transfer.createdAt)}
          </span>
          <span className='flex items-center gap-1.5'>
            <Clock className='h-3.5 w-3.5' />
            Обновлён: {formatDate(transfer.updatedAt)}
          </span>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title='Удалить трансфер?'
        description='Трансфер и все связанные данные будут удалены безвозвратно.'
      />

      <DeleteConfirmationModal
        isOpen={passengerToDelete !== null}
        onClose={() => setPassengerToDelete(null)}
        onConfirm={handleDeletePassenger}
        title='Удалить пассажира?'
        description={
          passengerToDelete
            ? `Пассажир «${passengerToDelete.name}» будет удалён из трансфера.`
            : ''
        }
      />
    </div>
  );
}
