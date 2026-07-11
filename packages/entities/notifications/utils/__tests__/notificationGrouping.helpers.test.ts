import { describe, it, expect } from 'vitest';
import {
  deduplicateNotificationsByOrder,
  isSystemNotification,
  getNotificationStatePriority,
} from '../notificationGrouping.helpers';

type Notif = {
  id: string;
  orderId?: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  title?: string;
  body?: string;
};

const n = (overrides: Partial<Notif>): Notif => ({
  id: overrides.id ?? 'n1',
  orderId: overrides.orderId,
  type: overrides.type ?? 'OrderCreated',
  isRead: overrides.isRead ?? false,
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('getNotificationStatePriority', () => {
  it('returns priority for known types', () => {
    expect(getNotificationStatePriority('OrderCreated')).toBe(1);
    expect(getNotificationStatePriority('RideCompleted')).toBe(10);
    expect(getNotificationStatePriority('PaymentReceived')).toBe(100);
  });

  it('returns 0 for unknown type', () => {
    expect(getNotificationStatePriority('UnknownType')).toBe(0);
  });
});

describe('isSystemNotification', () => {
  it('returns true when orderId is missing', () => {
    expect(isSystemNotification(n({ orderId: undefined }))).toBe(true);
  });

  it('returns true for PaymentReceived (priority 100)', () => {
    expect(isSystemNotification(n({ orderId: 'order1', type: 'PaymentReceived' }))).toBe(true);
  });

  it('returns false for order notification with orderId', () => {
    expect(isSystemNotification(n({ orderId: 'order1', type: 'OrderCreated' }))).toBe(false);
  });
});

describe('deduplicateNotificationsByOrder', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateNotificationsByOrder([])).toEqual([]);
  });

  it('keeps one notification per order (highest priority)', () => {
    const notifications = [
      n({ id: 'n1', orderId: 'o1', type: 'OrderCreated', createdAt: '2024-01-01T01:00:00Z' }),
      n({ id: 'n2', orderId: 'o1', type: 'OrderCompleted', createdAt: '2024-01-01T02:00:00Z' }),
    ];
    const result = deduplicateNotificationsByOrder(notifications as any);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n2'); // OrderCompleted has priority 10 > OrderCreated 1
  });

  it('keeps all system notifications', () => {
    const notifications = [
      n({ id: 'n1', orderId: undefined, type: 'SomeSystem' }),
      n({ id: 'n2', orderId: undefined, type: 'AnotherSystem' }),
    ];
    const result = deduplicateNotificationsByOrder(notifications as any);
    expect(result).toHaveLength(2);
  });

  it('keeps notifications from different orders separate', () => {
    const notifications = [
      n({ id: 'n1', orderId: 'o1', type: 'OrderCreated' }),
      n({ id: 'n2', orderId: 'o2', type: 'OrderCreated' }),
    ];
    const result = deduplicateNotificationsByOrder(notifications as any);
    expect(result).toHaveLength(2);
  });

  it('sorts result by createdAt descending', () => {
    const notifications = [
      n({ id: 'n1', orderId: undefined, type: 'SysA', createdAt: '2024-01-01T00:00:00Z' }),
      n({ id: 'n2', orderId: undefined, type: 'SysB', createdAt: '2024-01-02T00:00:00Z' }),
    ];
    const result = deduplicateNotificationsByOrder(notifications as any);
    expect(result[0].id).toBe('n2');
    expect(result[1].id).toBe('n1');
  });
});
