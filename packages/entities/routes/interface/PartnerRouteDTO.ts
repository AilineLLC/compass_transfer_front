export interface PartnerRouteDTO {
  startLocationId: string;
  endLocationId: string;
  name: string;
  isPopular: boolean;
  id: string;
  price: number;
  duration: number;
}

export interface UpdatePartnerRouteDTO {
  routeId: string;
  price: number;
}

export interface CreatePartnerRouteData {
  startLocationId: string;
  endLocationId: string;
  price: number;
}

export interface RouteLocationDTO {
  id: string;
  name: string;
}

export interface RouteDTO {
  id: string;
  startLocationId: string;
  endLocationId: string;
  name: string;
  isPopular: boolean;
  price: number;
  duration?: number;
  startLocation?: RouteLocationDTO;
  endLocation?: RouteLocationDTO;
}

export interface RouteListResponseDTO {
  data: RouteDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CreateRouteDTO {
  startLocationId: string;
  endLocationId: string;
  name: string;
  isPopular: boolean;
  price: number;
  duration: number;
}

export interface UpdateRouteDTO {
  startLocationId?: string;
  endLocationId?: string;
  name?: string;
  isPopular?: boolean;
  price?: number;
  duration?: number;
}
