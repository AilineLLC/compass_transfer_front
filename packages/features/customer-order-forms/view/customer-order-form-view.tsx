'use client';

import {
  ArrowLeft,
  MapPin,
  ArrowRight,
  Clock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Package,
  User,
  Car,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import {
  customerOrderFormsApi,
  type CustomerOrderFormDTO,
  type CustomerOrderFormStatus,
} from '@shared/api/customer-order-forms';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-2xl border bg-white shadow-sm overflow-hidden'>
      <div className='flex items-center gap-3 px-5 py-1.5 border-b bg-gray-50/60'>
        <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10'>
          <Icon className='h-3.5 w-3.5 text-primary' />
        </div>
        <p className='font-semibold text-sm'>{title}</p>
      </div>
      <div className='px-5 py-4'>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start gap-2'>
      <span className='text-xs text-muted-foreground w-28 shrink-0 pt-0.5'>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  );
}

const statusBadge = (status: CustomerOrderFormStatus) => {
  switch (status) {
    case 'Verified':
      return (
        <Badge variant='outline' className='text-green-700 border-green-300 bg-green-50 text-xs px-3 py-1'>
          Принято
        </Badge>
      );
    case 'Rejected':
      return (
        <Badge variant='outline' className='text-red-700 border-red-300 bg-red-50 text-xs px-3 py-1'>
          Отклонено
        </Badge>
      );
    default:
      return (
        <Badge variant='outline' className='text-amber-700 border-amber-300 bg-amber-50 text-xs px-3 py-1'>
          Ожидает рассмотрения
        </Badge>
      );
  }
};

interface CustomerOrderFormViewProps {
  form: CustomerOrderFormDTO;
}

export function CustomerOrderFormView({ form: initialForm }: CustomerOrderFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerOrderFormDTO>(initialForm);
  const [processing, setProcessing] = useState(false);

  const handleReject = async () => {
    setProcessing(true);
    try {
      await customerOrderFormsApi.updateStatus(form.id, 'Rejected');
      setForm(prev => ({ ...prev, status: 'Rejected' }));
      toast.success('Заявка отклонена');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось отклонить заявку');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = () => {
    const params = new URLSearchParams();
    params.set('formId', form.id);
    if (form.startLocation?.id) params.set('startLocationId', form.startLocation.id);
    if (form.endLocation?.id) params.set('endLocationId', form.endLocation.id);
    if (form.services.length > 0) {
      params.set('services', JSON.stringify(form.services.map(s => ({
        serviceId: s.service.id,
        quantity: s.quantity,
        notes: s.notes,
      }))));
    }
    if (form.name) params.set('passengerName', form.name);
    if (form.phone) params.set('passengerPhone', form.phone);
    if (form.scheduledTime) params.set('scheduledTime', form.scheduledTime);
    router.push(`/orders/create/scheduled?${params.toString()}`);
  };

  const isPending = form.status === 'Pending';

  const totalServicesPrice = form.services.reduce(
    (sum, s) => sum + s.service.price * s.quantity,
    0,
  );

  return (
    <div className='flex flex-col h-full overflow-hidden bg-gray-50'>
      {/* Шапка */}
      <div className='sticky top-0 z-10 bg-white border-b px-6 py-3.5 flex items-center justify-between shadow-sm'>
        <div className='flex items-center gap-3 py-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/order-forms')}
            className='gap-1.5 text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='h-4 w-4' />
            Назад
          </Button>
          <div className='h-5 w-px bg-border' />
          <div className='flex flex-col gap-y-1'>
            <div className='flex items-center gap-2'>
              <h1 className='text-base font-bold tracking-tight'>Заявка на заказ</h1>
              {statusBadge(form.status)}
            </div>
            <p className='text-xs text-muted-foreground font-mono'>{form.id}</p>
          </div>
        </div>

        {isPending && (
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleReject}
              disabled={processing}
              className='gap-2 text-red-600 border-red-200 hover:bg-red-50'
            >
              <XCircle className='h-4 w-4' />
              Отклонить
            </Button>
            <Button
              size='sm'
              onClick={handleAccept}
              disabled={processing}
              className='gap-2 bg-green-600 hover:bg-green-700 text-white'
            >
              <CheckCircle2 className='h-4 w-4' />
              Принять и создать заказ
            </Button>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>

        {/* Маршрут */}
        <SectionCard icon={MapPin} title='Маршрут'>
          <div className='flex flex-col md:flex-row items-stretch gap-3'>
            <div className='flex-1 rounded-xl bg-green-50 border border-green-200 p-4 space-y-1'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-green-500 shrink-0' />
                <span className='text-xs font-semibold text-green-700 uppercase tracking-wide'>Откуда</span>
              </div>
              {form.startLocation ? (
                <>
                  <p className='font-semibold text-sm leading-snug'>{form.startLocation.name}</p>
                  <p className='text-xs text-muted-foreground'>{form.startLocation.address}</p>
                  <p className='text-xs text-muted-foreground'>
                    {form.startLocation.city}, {form.startLocation.country}
                  </p>
                  {form.startLocation.region && form.startLocation.region !== 'Не известно' && (
                    <p className='text-xs text-muted-foreground'>{form.startLocation.region}</p>
                  )}
                  <p className='text-xs text-muted-foreground font-mono'>
                    {form.startLocation.latitude.toFixed(5)}, {form.startLocation.longitude.toFixed(5)}
                  </p>
                </>
              ) : (
                <p className='text-sm text-muted-foreground'>—</p>
              )}
            </div>

            <div className='flex items-center justify-center shrink-0'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 border'>
                <ArrowRight className='h-4 w-4 text-gray-500' />
              </div>
            </div>

            <div className='flex-1 rounded-xl bg-red-50 border border-red-200 p-4 space-y-1'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-red-500 shrink-0' />
                <span className='text-xs font-semibold text-red-700 uppercase tracking-wide'>Куда</span>
              </div>
              {form.endLocation ? (
                <>
                  <p className='font-semibold text-sm leading-snug'>{form.endLocation.name}</p>
                  <p className='text-xs text-muted-foreground'>{form.endLocation.address}</p>
                  <p className='text-xs text-muted-foreground'>
                    {form.endLocation.city}, {form.endLocation.country}
                  </p>
                  {form.endLocation.region && form.endLocation.region !== 'Не известно' && (
                    <p className='text-xs text-muted-foreground'>{form.endLocation.region}</p>
                  )}
                  <p className='text-xs text-muted-foreground font-mono'>
                    {form.endLocation.latitude.toFixed(5)}, {form.endLocation.longitude.toFixed(5)}
                  </p>
                </>
              ) : (
                <p className='text-sm text-muted-foreground'>—</p>
              )}
            </div>
          </div>
        </SectionCard>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Пассажир */}
          <SectionCard icon={User} title='Пассажир'>
            <div className='space-y-2'>
              <InfoRow label='Имя' value={form.name ?? '—'} />
              <InfoRow label='Телефон' value={form.phone ?? '—'} />
            </div>
          </SectionCard>

          {/* Дата поездки */}
          <SectionCard icon={Calendar} title='Дата поездки'>
            <div className='space-y-2'>
              <InfoRow
                label='Дата и время'
                value={form.scheduledTime ? formatDate(form.scheduledTime) : '—'}
              />
            </div>
          </SectionCard>
        </div>

        {/* Автомобиль */}
        {form.car && (
          <SectionCard icon={Car} title='Автомобиль'>
            <div className='grid grid-cols-2 gap-x-8 gap-y-2'>
              <InfoRow label='Марка / модель' value={`${form.car.make} ${form.car.model}`} />
              <InfoRow label='Год' value={String(form.car.year)} />
              <InfoRow label='Гос. номер' value={<span className='font-mono'>{form.car.licensePlate}</span>} />
              <InfoRow label='Цвет' value={form.car.color} />
              <InfoRow label='Тип' value={form.car.type} />
              <InfoRow label='Класс' value={form.car.serviceClass} />
              <InfoRow label='Мест' value={String(form.car.passengerCapacity)} />
              {form.car.features.length > 0 && (
                <div className='col-span-2'>
                  <InfoRow
                    label='Опции'
                    value={
                      <div className='flex flex-wrap gap-1'>
                        {form.car.features.map(f => (
                          <Badge key={f} variant='outline' className='text-xs px-2 py-0.5'>
                            {f}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Комментарий */}
        {form.comment && (
          <SectionCard icon={MessageSquare} title='Комментарий клиента'>
            <p className='text-sm text-muted-foreground leading-relaxed'>{form.comment}</p>
          </SectionCard>
        )}

        {/* Услуги */}
        <SectionCard icon={Package} title='Услуги'>
          {form.services.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                <Package className='h-5 w-5 text-gray-400' />
              </div>
              <p className='text-sm text-muted-foreground'>Услуги не указаны</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {form.services.map((item, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between rounded-xl bg-gray-50 border px-4 py-3'
                >
                  <div className='min-w-0'>
                    <p className='font-medium text-sm'>{item.service.name}</p>
                    {item.service.description && (
                      <p className='text-xs text-muted-foreground mt-0.5'>{item.service.description}</p>
                    )}
                    {item.notes && (
                      <p className='text-xs text-muted-foreground italic mt-0.5'>Заметка: {item.notes}</p>
                    )}
                  </div>
                  <div className='flex items-center gap-4 shrink-0 ml-4'>
                    {item.service.isQuantifiable && (
                      <span className='text-xs text-muted-foreground'>× {item.quantity}</span>
                    )}
                    <span className='text-sm font-semibold'>
                      {(item.service.price * item.quantity).toLocaleString('ru-RU')} сом
                    </span>
                  </div>
                </div>
              ))}
              {form.services.length > 1 && (
                <div className='flex justify-end pt-1'>
                  <span className='text-sm font-semibold text-primary'>
                    Итого: {totalServicesPrice.toLocaleString('ru-RU')} сом
                  </span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Информация о заявке */}
        <SectionCard icon={ClipboardList} title='Информация о заявке'>
          <div className='grid grid-cols-2 gap-x-8 gap-y-3'>
            <InfoRow label='Статус' value={statusBadge(form.status)} />
            <InfoRow label='ID заявки' value={<span className='font-mono text-xs'>{form.id}</span>} />
            <InfoRow label='Создана' value={formatDate(form.createdAt)} />
            <InfoRow label='Обновлена' value={formatDate(form.updatedAt)} />
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
