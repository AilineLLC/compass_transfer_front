import type { LocationType } from '../enums/LocationType.enum';
import type { TagDTO } from '@shared/api/tags';

export interface LocationImageDTO {
  id: string;
  path: string;
}

export interface PoiImageFileDTO {
  id: string;
  name: string | null;
  extension: string;
  size: number;
  createdAt: string;
  path: string;
}

export interface PoiItemDTO {
  name: string;
  image: PoiImageFileDTO | null;
  type?: string;
}

export interface LocationAdviceDTO {
  fullName: string;
  specialization: string | null;
  image: PoiImageFileDTO | null;
  content: string;
}

export interface LocationProfileDTO {
  images: LocationImageDTO[];
  description: string | null;
  poi: PoiItemDTO[];
  tags: TagDTO[];
  advice: LocationAdviceDTO | null;
}

export type { TagDTO };

/**
 * GET /Location/{uuid}
 */
export interface LocationDTO {
  type: LocationType;
  name: string;
  address: string;
  district: string | null;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  popular1: boolean;
  popular2: boolean;
  isLandingOnly: boolean | null;
  isLandingPagePinned?: boolean;
  group?: string | null;
  id: string;
  transient?: boolean;
  poiCount?: number;
  tagCount?: number;
  profile?: LocationProfileDTO | null;
  priceCoefficient?: number | null;
}
