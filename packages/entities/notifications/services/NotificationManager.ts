import { toast } from '@shared/lib/conditional-toast';
import type { NotificationHandler } from '@shared/hooks/signal/interface/NotificationHandler';
import { logger } from '@shared/lib/logger';

interface NotificationMessage {
  title?: string;
  content?: string;
  type?: string;
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

  handleNotification(type: string, data: unknown) {
    logger.info('📢 Обработка уведомления:', { type, data });
    const handlers = this.handlers.get(type);

    if (handlers) {
      handlers.forEach(handler => handler(data as NotificationMessage));
    }
    this.showToast(type, data as NotificationMessage);
  }

  private showToast(type: string, data: NotificationMessage) {
    const title = data.title || 'Уведомление';
    const content = data.content || '';
    const msg = content ? `${title}: ${content}` : title;

    switch (type) {
      case 'OrderCreated':
        toast.info(`📦 ${msg}`);
        break;
      case 'OrderUpdated':
        toast.info(`📦 ${msg}`);
        break;
      case 'OrderCancelled':
        toast.warning(`❌ ${msg}`, { type: 'order_cancelled' });
        break;
      case 'OrderCompleted':
        toast.success(`🎉 ${msg}`, { type: 'order_success' });
        break;
      case 'RideRequest':
        toast.info(`🚗 ${msg}`);
        break;
      case 'RideAccepted':
        toast.success(`✅ ${msg}`);
        break;
      case 'RideStarted':
        toast.success(`🚀 ${msg}`);
        break;
      case 'RideCompleted':
        toast.success(`✅ ${msg}`);
        break;
      case 'RideCancelled':
        toast.warning(`❌ ${msg}`);
        break;
      case 'RideUpdate':
        toast.info(`🔄 ${msg}`);
        break;
      case 'CancelRideRequest':
        toast.warning(`❌ ${msg}`);
        break;
      case 'PaymentReceived':
        toast.success(`💰 ${msg}`, { type: 'payment_success' });
        break;
      case 'DriverHeading':
        toast.info(`🚗 ${msg}`);
        break;
      case 'DriverArrived':
        toast.success(`🏁 ${msg}`);
        break;
      case 'DriverAssigned':
        toast.success(`✅ ${msg}`);
        break;
      case 'DriverCancelled':
        toast.error(`❌ ${msg}`);
        break;
      default:
        toast.info(`📢 ${msg}`);
    }
  }
}

export const notificationManager = new NotificationManager();
