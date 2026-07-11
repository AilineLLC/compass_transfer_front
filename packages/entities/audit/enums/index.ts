export enum AuditEventType {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  Archived = 'Archived',
  Unarchived = 'Unarchived',
  StatusChanged = 'StatusChanged',
}

export enum AuditEntityType {
  Order = 'Order',
  Ride = 'Ride',
  User = 'User',
  Car = 'Car',
  Location = 'Location',
  Tariff = 'Tariff',
  Transfer = 'Transfer',
}
