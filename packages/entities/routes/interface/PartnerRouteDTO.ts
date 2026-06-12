export interface RoutePriceDTO {
  tariffId: string;
  price: number;
}

export interface PartnerRouteDTO {
  startLocationId: string;
  endLocationId: string;
  name: string;
  isPopular: boolean;
  id: string;
  prices: RoutePriceDTO[];
  duration: number;
}

export interface UpdatePartnerRouteDTO {
  routeId: string;
  prices: RoutePriceDTO[];
}

export interface CreatePartnerRouteData {
  startLocationId: string;
  endLocationId: string;
  prices: RoutePriceDTO[];
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
  prices: RoutePriceDTO[];
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
  prices: RoutePriceDTO[];
  duration: number;
}

export interface UpdateRouteDTO {
  startLocationId?: string;
  endLocationId?: string;
  name?: string;
  isPopular?: boolean;
  prices?: RoutePriceDTO[];
  duration?: number;
}
