'use client';

import type { NextPage } from 'next';
// import Image from 'next/image'; // Убрано, так как логотип не используется
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from '@shared/lib/conditional-toast';
// import { captureReceiptImage } from '@shared/utils/receiptCapture'; // Отключено для тестирования
import { useFiscalReceipt } from '@entities/fiscal';

// 🔄 ПЕРЕКЛЮЧАТЕЛЬ СПОСОБА ПЕЧАТИ
// true - растровая печать (html2canvas -> printRaster)
// false - построчная печать (printReceiptLines)
const USE_RASTER_PRINT = true;

// 🧪 МОКОВЫЕ ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ
const MOCK_RECEIPT_DATA = {
  id: 'test-receipt-123',
  orderId: 'order-456789',
  data: {
    orderNumber: '123456',
    driver: {
      fullName: 'Иванов Иван Иванович',
      phoneNumber: '+996 555 123 456'
    },
    car: {
      make: 'Toyota',
      model: 'Camry',
      licensePlate: '01 KG 777 AA',
      color: 'Белый'
    },
    queueNumber: 42
  }
};

const MOCK_ORDER_DATA = {
  finalPrice: 250,
  tariff: {
    basePrice: 250
  },
  locations: [
    { name: 'Аэропорт Манас' },
    { name: 'ТРЦ Дордой Плаза' }
  ]
};

export const ReceiptTest: NextPage = () => {
  const _t = useTranslations('Receipt');
  const router = useRouter();
  const { printReceiptLines, printReceiptImage } = useFiscalReceipt();

  const hasAutoSavedRef = useRef(false);

  // InfoRow компонент (не используется в новом дизайне)
  const _InfoRow: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ 
    label, 
    value, 
    className = '' 
  }) => (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-[24px] text-[#A3A5AE] leading-[34px] font-medium">{label}</span>
      {typeof value === 'string' ? (
        <span className="text-[24px] text-[#0047FF] leading-[33px] font-medium">{value}</span>
      ) : (
        value
      )}
    </div>
  );

  // CountdownButton компонент (не используется)
  const _CountdownButton: React.FC<{
    initialSeconds: number;
    targetPath: string;
    buttonText: string;
    className?: string;
    handleClick?: () => void;
  }> = ({
    initialSeconds = 60,
    targetPath = '/',
    buttonText = 'На главную',
    className = '',
    handleClick,
  }) => {
    const [buttonSeconds, setButtonSeconds] = useState(initialSeconds);

    useEffect(() => {
      if (buttonSeconds <= 0) {
        handleClick?.();
        router.push(targetPath);

        return;
      }

      const timer = setInterval(() => {
        setButtonSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(timer);
    }, [buttonSeconds, targetPath, handleClick]);

    const returnToMainPage = () => {
      handleClick?.();
      router.push(targetPath);
    };

    return (
      <button
        className={`w-[610px] m-auto mb-[120px] h-[124px] flex items-center justify-center flex-1 rounded-[100px] bg-gradient-to-r from-[#0053BF] to-[#2F79D8] ${className}`}
        onClick={returnToMainPage}
      >
        <span className="text-[46px] text-[#F5F6F7] font-bold leading-[100%]">
          {buttonText} {buttonSeconds < 10 ? `0:0${buttonSeconds}` : `0:${buttonSeconds}`}
        </span>
      </button>
    );
  };
  
  const currentDate = new Date();
  const _formattedDate = currentDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  // Автоматическая печать изображения чека после его отображения (отключена для тестирования)
  useEffect(() => {
    if (MOCK_RECEIPT_DATA && MOCK_ORDER_DATA && !hasAutoSavedRef.current) {
      // Ждем немного, чтобы компонент полностью отрендерился
      const timeoutId = setTimeout(async () => {
        try {
          // 🧪 ТЕСТОВЫЙ РЕЖИМ: Печать отключена
          
          // Проверяем что элемент существует и отрендерился
          const receiptElement = document.getElementById('receipt-container');

          if (!receiptElement) {
            toast.error('Элемент чека не найден');

            return;
          }

          
          let success = false;
          
          if (USE_RASTER_PRINT) {
            // 🖼️ РАСТРОВАЯ ПЕЧАТЬ - через html2canvas
            // 🧪 ТЕСТОВЫЙ РЕЖИМ: Растровая печать (отключена)
            
            // В тестовом режиме не печатаем
            // const receiptBase64 = await captureReceiptImage('receipt-container', 384);
            // success = await printReceiptImage(receiptBase64);
            success = true; // Имитируем успех
          } else {
            // 📄 ПОСТРОЧНАЯ ПЕЧАТЬ - через API строки
            // 🧪 ТЕСТОВЫЙ РЕЖИМ: Построчная печать (отключена)
            
            // В тестовом режиме не печатаем
            success = true; // Имитируем успех
          }
          
          if (success) {
            toast.success('🧪 ТЕСТОВЫЙ РЕЖИМ: Печать имитирована');
          } else {
            toast.warning('⚠️ Проблема с печатью чека');
          }
        } catch {
          toast.error('❌ Ошибка печати чека');
        } finally {
          hasAutoSavedRef.current = true;
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [printReceiptLines, printReceiptImage]);

  return (
    <div className="flex flex-col gap-[50px]">

      {/* Заголовок */}
      <h3 className="max-w-[800px] mx-auto text-[50px] text-[#0866FF] text-center leading-[120%] font-bold" style={{ fontFamily: 'Gilroy, system-ui, -apple-system, sans-serif', fontWeight: 700 }}>
        Получите чек
      </h3>
      
      {/* Чек в новом дизайне */}
      <div className="flex justify-center">
        <div 
          id="receipt-container" 
          className="mx-auto relative"
          style={{
            width: '638px',
            height: '1000px',
            backgroundImage: 'url(/background/Subtract.png)',
            backgroundSize: '638px 1000px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center top -20px',
          }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[708px] h-[54px] bg-[#0A205747] rounded-[37px] shadow-[0px_9px_6.5px_7px_#0A205747_inset]" />
          <div className="w-[638px] h-[48px] absolute top-[20px] left-[50%] transform -translate-x-1/2 bg-[linear-gradient(0.47deg,#FFFFFF_9.8%,#E1E6F7_91.63%)] rounded-tr-[12px] rounded-tl-[12px]" />
          
          {/* Иконка поверх фонового изображения */}
          <div className="absolute z-20" style={{ top: '60%', left: '114px', transform: 'translateY(-50%)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo/checklogo.png`} alt="Check logo" style={{ width: '410px', height: '520px', objectFit: 'fill' }} />
          </div>

          <div className="w-[90%] mx-auto py-[56px] px-[44px] flex flex-col gap-10 relative z-10"
                    style={{
                        fontFamily: 'Gilroy, system-ui, -apple-system, sans-serif',
                        fontWeight: 500,
                        fontSize: '24.04px',
                        lineHeight: '33.29px',
                        letterSpacing: '0%',
                      }}>
          {/* Заголовочная секция */}
          <div className="relative p-8">
            
            {/* Зеленая галочка */}
            <div className="flex justify-center mb-[20px]">
              <div className="w-[103px] h-[103px] bg-[#41D1951F] rounded-full flex items-center justify-center">
                <div className="w-[49px] h-[49px] bg-[#41D195] rounded-full flex items-center justify-center">
                  <svg width="49" height="49" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M9 12l2 2 4-4" 
                      stroke="white" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Заголовок */}
            <h3 className="text-[37px] text-[#4CAF50] text-center font-medium">
              Транзакция успешна
            </h3>

          </div>

          {/* Пунктирная линия */}
          <div className="border-t-2 border-dashed border-[#0047FF]" />

          {/* Информация о заказе */}
          <div className="space-y-[15px]">
            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Статус</span>
              <div className="bg-[#E8F5E8] px-[15px] py-[8px] rounded-[25px]">
                <span className="text-[18px] text-[#4CAF50] font-medium">Активен</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Дата</span>
              <span className="text-[24px] text-[#0047FF] font-medium">Mar 22, 2023</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Водитель</span>
              <span className="text-[24px] text-[#0047FF] font-medium">Адиль Ниязов</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Телефон службы</span>
              <span className="text-[24px] text-[#0047FF] font-medium">+996 (700) 700 700</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Тариф</span>
              <span className="text-[24px] text-[#0047FF] font-medium">Базовый / Седан</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Марка</span>
              <span className="text-[24px] text-[#0047FF] font-medium">Hyundai Sonata</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Цвет авто</span>
              <span className="text-[24px] text-[#0047FF] font-medium">Серый</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Номер авто</span>
              <span className="text-[24px] text-[#0047FF] font-medium">01 P 4885 IKL</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[24px] text-[#A3A5AE] font-medium">Код</span>
              <span className="text-[24px] text-[#0047FF] font-medium">QR1265</span>
            </div>
          </div>

          {/* Пунктирная линия */}
          <div className="border-t-2 border-dashed border-[#0047FF]" />

          {/* Итоговая сумма */}
          <div className="flex justify-between items-center">
            <span className="text-[28px] text-[#0047FF] font-semibold">Покупка</span>
            <span className="text-[28px] text-[#0047FF] font-bold">1 240KGS</span>
          </div>

          </div>
        </div>
      </div>

      {/* Кнопка возврата - пока что закоментируем чтобы не мешал */}
      {/* <div className="flex justify-center">
        <CountdownButton
          initialSeconds={60}
          targetPath="/"
          buttonText={t('toMain')}
        />
      </div> */}

    </div>
  );
};

export default ReceiptTest;
