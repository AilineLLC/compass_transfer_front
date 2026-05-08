export interface AuditAvatarDTO {
  id: string;
  name: string | null;
  extension: string;
  size: number;
  createdAt: string;
  path: string;
}

export interface AuditUserDTO {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role: string;
  phoneNumber: string | null;
  fullName: string;
  avatar: AuditAvatarDTO | null;
  online: boolean | null;
  rating: number | null;
}

export interface AuditEventDTO {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  entity: unknown | null;
  user: AuditUserDTO | null;
  jsonDiff: unknown | null;
  date: string;
}

export interface AuditListResponseDTO {
  data: AuditEventDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AuditFilters {
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;
  eventType?: string[];
  entityType?: string;
  entityId?: string;
  userId?: string;
  date?: string;
  dateOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}
