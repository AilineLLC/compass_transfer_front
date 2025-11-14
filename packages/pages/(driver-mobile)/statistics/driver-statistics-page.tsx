'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, DollarSign, Clock, Car, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/ui/forms/button';
import { Card } from '@shared/ui/layout/card';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';

interface EarningsStats {
  totalEarnings: number;
  completedRides: number;
  averageEarning: number;
  pendingPayouts: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

export function DriverStatisticsPage() {
  const [orders, setOrders] = useState<GetOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Последние 30 дней
    to: new Date()
  });

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Интегрировать с правильным API для получения заказов водителя
      // Пока используем моковые данные для демонстрации
      const mockOrders: GetOrderDTO[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          type: 'Instant' as any,
          status: 'Completed' as any,
          creatorId: 'user1',
          initialPrice: 150,
          finalPrice: 150,
          driverProfit: 120,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          startLocationId: 'loc1',
          endLocationId: 'loc2',
          additionalStops: [],
          services: [],
          passengers: []
        }
      ];

      const ordersWithProfit = mockOrders.filter((order: GetOrderDTO) => order.driverProfit && order.driverProfit > 0);
      setOrders(ordersWithProfit);
    } catch (error) {
      toast.error('Ошибка при загрузке статистики');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, dateRange]);

  const calculateStats = (): EarningsStats => {
    const completedOrders = orders.filter(order => order.status === 'Completed');
    const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.driverProfit || 0), 0);
    const pendingOrders = orders.filter(order => order.status !== 'Completed');
    const pendingPayouts = pendingOrders.reduce((sum, order) => sum + (order.driverProfit || 0), 0);
    
    return {
      totalEarnings,
      completedRides: completedOrders.length,
      averageEarning: completedOrders.length > 0 ? totalEarnings / completedOrders.length : 0,
      pendingPayouts
    };
  };

  const stats = calculateStats();

  const setQuickDateRange = (days: number) => {
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - days)),
      to: new Date()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Загрузка статистики...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Статистика доходов</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {dateRange.from.toLocaleDateString('ru-RU')} - {dateRange.to.toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>

        {/* Быстрые фильтры */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(7)}
            className="text-xs"
          >
            7 дней
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(30)}
            className="text-xs"
          >
            30 дней
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(90)}
            className="text-xs"
          >
            3 месяца
          </Button>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Общий доход */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Общий доход</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalEarnings} сом</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Завершенные поездки */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Завершено поездок</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completedRides}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Средний доход */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Средний доход</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageEarning)} сом</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Ожидающие выплаты */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ожидает выплат</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingPayouts} сом</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Детальная таблица заказов */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">История доходов</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Заказ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Дата</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Стоимость</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ваш доход</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Статус выплаты</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium">#{order.orderNumber ? orderNumberToString(order.orderNumber) : order.id.slice(-8)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.completedAt 
                          ? new Date(order.completedAt).toLocaleDateString('ru-RU')
                          : new Date(order.createdAt).toLocaleDateString('ru-RU')
                        }
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{order.finalPrice || order.initialPrice} сом</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-green-600">{order.driverProfit} сом</span>
                      </td>
                      <td className="py-3 px-4">
                        {order.status === 'Completed' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            ✓ Выплачено
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            ⏳ Ожидает
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
