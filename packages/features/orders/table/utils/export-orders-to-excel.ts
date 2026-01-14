import ExcelJS from 'exceljs';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import { orderTypeLabels, orderStatusLabels, orderSubStatusLabels } from '@entities/orders';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCurrencyRates } from '@shared/api/currency';

/**
 * Экспортирует список заказов в Excel файл
 * @param orders - Массив заказов для экспорта
 * @param dateFrom - Дата начала периода (опционально)
 * @param dateTo - Дата окончания периода (опционально)
 */
export async function exportOrdersToExcel(
  orders: GetOrderDTO[],
  dateFrom?: Date,
  dateTo?: Date,
): Promise<void> {
  // Получаем курс доллара
  let usdRate: number | null = null;
  try {
    const currencyData = await getCurrencyRates();
    const usdCurrency = currencyData.rates.find(rate => rate.code === 'USD');
    if (usdCurrency && usdCurrency.rate > 0) {
      usdRate = usdCurrency.rate;
    }
  } catch (error) {
    console.warn('Не удалось получить курс USD для экспорта:', error);
  }
  // Создаем новую книгу Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');

  // Определяем заголовки колонок
  const headers = [
    'Номер заказа',
    'Тип заказа',
    'Статус',
    'Подстатус',
    'Начальная цена (сом)',
    'Итоговая цена (сом)',
    'Дата создания',
    'Дата завершения',
    'Запланированное время',
    'Рейс (прилет)',
    'Рейс (вылет)',
    'Описание',
    'Комментарии',
  ];

  // Устанавливаем заголовки
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Устанавливаем ширину колонок
  worksheet.columns = [
    { width: 15 }, // Номер заказа
    { width: 18 }, // Тип заказа
    { width: 15 }, // Статус
    { width: 18 }, // Подстатус
    { width: 25 }, // Начальная цена (сом + доллары)
    { width: 25 }, // Итоговая цена (сом + доллары)
    { width: 20 }, // Дата создания
    { width: 20 }, // Дата завершения
    { width: 22 }, // Запланированное время
    { width: 15 }, // Рейс (прилет)
    { width: 15 }, // Рейс (вылет)
    { width: 30 }, // Описание
    { width: 30 }, // Комментарии
  ];

  // Функция для форматирования цены с долларами
  const formatPriceWithUsd = (priceInSoms: number): string => {
    const formattedSoms = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(priceInSoms);

    if (!usdRate || usdRate <= 0) {
      return formattedSoms;
    }

    const priceInUsd = priceInSoms / usdRate;
    const formattedUsd = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(priceInUsd);

    return `${formattedSoms} ($${formattedUsd})`;
  };

  // Добавляем данные
  orders.forEach((order) => {
    const initialPriceText = formatPriceWithUsd(order.initialPrice);
    const finalPriceText = order.finalPrice ? formatPriceWithUsd(order.finalPrice) : '—';

    const row = worksheet.addRow([
      orderNumberToString(order.orderNumber),
      orderTypeLabels[order.type as keyof typeof orderTypeLabels] || order.type,
      orderStatusLabels[order.status as keyof typeof orderStatusLabels] || order.status,
      order.subStatus
        ? orderSubStatusLabels[order.subStatus as keyof typeof orderSubStatusLabels] || order.subStatus
        : '—',
      initialPriceText,
      finalPriceText,
      format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru }),
      order.completedAt
        ? format(new Date(order.completedAt), 'dd.MM.yyyy HH:mm', { locale: ru })
        : '—',
      order.scheduledTime
        ? format(new Date(order.scheduledTime), 'dd.MM.yyyy HH:mm', { locale: ru })
        : '—',
      order.airFlight || '—',
      order.flyReis || '—',
      order.description || '—',
      order.notes || '—',
    ]);
  });

  // Замораживаем первую строку (заголовки)
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Генерируем имя файла
  let fileName = 'Заказы';
  if (dateFrom && dateTo) {
    fileName = `Заказы_${format(dateFrom, 'dd.MM.yyyy', { locale: ru })}_${format(dateTo, 'dd.MM.yyyy', { locale: ru })}.xlsx`;
  } else if (dateFrom) {
    fileName = `Заказы_с_${format(dateFrom, 'dd.MM.yyyy', { locale: ru })}.xlsx`;
  } else if (dateTo) {
    fileName = `Заказы_до_${format(dateTo, 'dd.MM.yyyy', { locale: ru })}.xlsx`;
  } else {
    fileName = `Заказы_${format(new Date(), 'dd.MM.yyyy', { locale: ru })}.xlsx`;
  }

  // Сохраняем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Создаем ссылку для скачивания
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
