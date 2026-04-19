import {
  Bell,
  Package,
  Car,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  type LucideProps,
} from 'lucide-react';
import type { NotificationType } from '../enums/NotificationType.enum';

export const NotificationTypeIcons: Record<NotificationType, React.ComponentType<LucideProps>> = {
  OrderCreated: Package,
  OrderUpdated: Package,
  OrderCancelled: AlertTriangle,
  OrderCompleted: CheckCircle,

  RideRequest: Car,
  RideAccepted: CheckCircle,
  RideStarted: Car,
  RideCompleted: CheckCircle,
  RideCancelled: AlertTriangle,
  RideUpdate: Car,
  CancelRideRequest: AlertTriangle,

  PaymentReceived: CreditCard,

  DriverHeading: Car,
  DriverArrived: Bell,
  DriverAssigned: Car,
  DriverCancelled: AlertTriangle,
};

export const getNotificationTypeIcon = (type: NotificationType) => {
  return NotificationTypeIcons[type] ?? Bell;
};
