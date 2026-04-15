import {
  Package,
  Car,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Bell,
  type LucideProps,
} from 'lucide-react';
import type { NotificationType } from '../enums/NotificationType.enum';

export const NotificationTypeIcons: Record<NotificationType, React.ComponentType<LucideProps>> = {
  OrderCreated: Package,
  OrderConfirmed: CheckCircle,
  OrderCancelled: AlertTriangle,
  OrderCompleted: CheckCircle,

  RideRequest: Car,
  RideAccepted: CheckCircle,
  RideRejected: AlertTriangle,
  RideStarted: Car,
  RideCompleted: CheckCircle,
  RideCancelled: AlertTriangle,

  DriverHeading: Car,
  DriverArrived: Bell,
  DriverCancelled: AlertTriangle,

  Payment: CreditCard,
  PaymentReceived: CreditCard,
  PaymentFailed: AlertTriangle,
};

export const getNotificationTypeIcon = (type: NotificationType) => {
  return NotificationTypeIcons[type] ?? Bell;
};
