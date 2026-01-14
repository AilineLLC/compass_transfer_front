'use client';

import { AlertTriangle, DollarSign } from 'lucide-react';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { useUsdRate } from '@shared/hooks';
import { formatPriceWithUsd } from '@shared/utils/format-price-with-usd';

interface PriceInfoCardProps {
  basePrice: string;
  distancePrice: string;
  totalPrice: string;
  formattedPrice: string;
  isCustomPrice: boolean;
  handleCustomPriceChange: (value: string) => void;
  toggleCustomPrice: () => void;
  showCustomPrice?: boolean;
  calculatedPrice?: number;
  customPriceValue?: number;
  selectedServices?: Array<{
    serviceId: string;
    quantity: number;
    name?: string;
    price?: number;
  }>;
  servicesPrice?: number;
  totalPriceValue?: number;
}

/**
 * Компонент для отображения информации о цене в сводке заказа
 */
export function PriceInfoCard({
  basePrice,
  distancePrice,
  totalPrice,
  formattedPrice,
  isCustomPrice,
  handleCustomPriceChange,
  toggleCustomPrice,
  showCustomPrice = true,
  calculatedPrice = 0,
  customPriceValue = 0,
  selectedServices = [],
  servicesPrice = 0,
  totalPriceValue = 0
}: PriceInfoCardProps) {
  const usdRate = useUsdRate();

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price).replace('KGS', '').trim();
  };
  
  // Парсинг введенной цены
  const parseInputPrice = (input: string): number => {
    // Удаляем все нецифры, кроме точки и запятой
    const digitsOnly = input.replace(/[^0-9.,]/g, '').replace(',', '.');
    
    return parseFloat(digitsOnly) || 0;
  };
  
  // Вычисление разницы в цене
  const priceDifference = customPriceValue - calculatedPrice;
  const formattedPriceDifference = formatPrice(Math.abs(priceDifference));
  const isPriceHigher = priceDifference > 0;
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Стоимость поездки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Базовая стоимость:</span>
            <span>{basePrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Стоимость за расстояние:</span>
            <span>{distancePrice}</span>
          </div>
          
          {/* Дополнительные услуги */}
          {selectedServices && selectedServices.length > 0 && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="text-sm font-medium text-gray-700 mb-1">Дополнительные услуги:</div>
              {selectedServices.map((service, index) => (
                <div key={`${service.serviceId}-${index}`} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {service.name || `Услуга ${service.serviceId}`}
                    {service.quantity > 1 && ` × ${service.quantity}`}
                  </span>
                  <span>{formatPrice((service.price || 0) * service.quantity)} ₽</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-100 pt-1 mt-1">
                <span>Итого за услуги:</span>
                <span>{formatPrice(servicesPrice)} ₽</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center font-medium border-t border-gray-100 pt-2 mt-2">
            <span>Итоговая стоимость:</span>
            <span className={`text-lg ${isCustomPrice ? 'line-through text-gray-500' : ''}`}>
              {isCustomPrice 
                ? formatPrice(calculatedPrice) 
                : totalPriceValue > 0 
                  ? formatPriceWithUsd(totalPriceValue, usdRate)
                  : totalPrice}
            </span>
          </div>
          {isCustomPrice && (
            <div className="flex justify-end items-center font-medium">
              <span className="text-lg">{formatPriceWithUsd(customPriceValue, usdRate)}</span>
            </div>
          )}
          
          {/* Кастомная цена (теперь для всех режимов) */}
          {showCustomPrice && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="custom-price" 
                  checked={isCustomPrice} 
                  onCheckedChange={toggleCustomPrice} 
                />
                <Label htmlFor="custom-price">Использовать кастомную итоговую цену</Label>
              </div>
              
              {isCustomPrice && (
                <div className="mt-2 space-y-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Введите цену"
                    value={formattedPrice}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Разрешаем только цифры, запятую, точку и пробел
                      if (value === '' || /^[0-9.,\s]+$/.test(value) || value.endsWith('₽')) {
                        // Парсим введенную строку в число и отправляем форматированное значение
                        const parsedValue = parseInputPrice(value);
                        
                        handleCustomPriceChange(parsedValue ? parsedValue.toString() : '0');
                      }
                    }}
                    className="w-full"
                  />
                  
                  {/* Информативный блок о разнице цен */}
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-700">Внимание: цена изменена вручную</p>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Автоматически рассчитанная цена:</span>
                        <span className="font-medium line-through">{formatPrice(calculatedPrice)} KGS</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Установленная цена:</span>
                        <span className="font-medium">{formatPrice(customPriceValue)} KGS</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Разница:</span>
                        <span className={`font-medium ${isPriceHigher ? 'text-green-600' : 'text-red-600'}`}>
                          {isPriceHigher ? '+' : '-'}{formattedPriceDifference}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
