import { toast } from '@shared/lib/conditional-toast';
import type { WSNotificationDTO } from '@shared/hooks/signal/interface';
import { logger } from '@shared/lib/logger';

export class NotificationManager {
  /**
   * Вызывается SignalRProvider при получении события `New`.
   * data — полный WSNotificationDTO с полем type и data: any.
   */
  handleNotification(_eventName: string, data: unknown) {
    logger.info('📢 SignalR New:', data);
    this.showToast(data as WSNotificationDTO);
  }

  private showToast(data: WSNotificationDTO) {
    const title = data.title ?? 'Уведомление';
    const content = data.content ? `: ${data.content}` : '';
    const notificationType = data.type ?? '';

    switch (notificationType) {
      case 'RideRequest':
        toast.info(`🚗 ${title}${content}`);
        break;
      case 'RideAccepted':
      case 'RideStarted':
        toast.success(`✅ ${title}${content}`);
        break;
      case 'RideRejected':
      case 'RideCancelled':
        toast.error(`❌ ${title}${content}`);
        break;
      case 'RideCompleted':
        toast.success(`🏁 ${title}${content}`);
        break;
      case 'DriverHeading':
        toast.info(`🚗 ${title}${content}`);
        break;
      case 'DriverArrived':
        toast.success(`📍 ${title}${content}`);
        break;
      case 'DriverCancelled':
        toast.error(`❌ ${title}${content}`);
        break;
      case 'OrderCreated':
        toast.info(`📦 ${title}${content}`);
        break;
      case 'OrderConfirmed':
        toast.success(`✅ ${title}${content}`);
        break;
      case 'OrderCancelled':
        toast.warning(`❌ ${title}${content}`, { type: 'order_cancelled' });
        break;
      case 'OrderCompleted':
        toast.success(`🎉 ${title}${content}`, { type: 'order_success' });
        break;
      case 'Payment':
        toast.info(`💳 ${title}${content}`);
        break;
      case 'PaymentReceived':
        toast.success(`💰 ${title}${content}`, { type: 'payment_success' });
        break;
      case 'PaymentFailed':
        toast.error(`💸 ${title}${content}`);
        break;
      default:
        toast.info(`📢 ${title}${content}`);
    }
  }
}

export const notificationManager = new NotificationManager();
