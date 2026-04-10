import { toast } from '@shared/lib/conditional-toast';
import type { NotificationHandler } from '@shared/hooks/signal/interface/NotificationHandler';
import { logger } from '@shared/lib/logger';

interface NotificationMessage {
  id?: string;
  type?: string;
  title?: string;
  content?: string | null;
  data?: unknown;
  [key: string]: unknown;
}

export class NotificationManager {
  private handlers = new Map<string, NotificationHandler<NotificationMessage>[]>();

  registerHandler(type: string, handler: NotificationHandler<NotificationMessage>) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Вызывается SignalRProvider при получении события `New`.
   * data — это полный DTO уведомления с полем type (NotificationType).
   */
  handleNotification(eventName: string, data: unknown) {
    logger.info('📢 SignalR уведомление:', { eventName, data });

    const msg = data as NotificationMessage;

    // Вызываем зарегистрированные обработчики для данного события
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.forEach(h => h(msg));
    }

    this.showToast(msg);
  }

  private showToast(data: NotificationMessage) {
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
