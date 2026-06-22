/**
 * Сервис для построения маршрутов с поддержкой разных типов
 */
import { type RoutePoint, RouteType, type RouteTypeInfo, type RouteResult } from '@shared/components/map/types'

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs?: { distance: number }[];
}

/**
 * Конфигурация типов маршрутов
 */
export const ROUTE_TYPE_CONFIG: Record<RouteType, RouteTypeInfo> = {
  [RouteType.FASTEST]: {
    type: RouteType.FASTEST,
    name: 'Быстрый',
    description: 'Минимальное время в пути, использует автомагистрали',
    icon: '⚡',
    color: '#3b82f6', // blue
  },
  [RouteType.SHORTEST]: {
    type: RouteType.SHORTEST,
    name: 'Короткий',
    description: 'Минимальное расстояние, может быть медленнее',
    icon: '📏',
    color: '#10b981', // green
  },
  [RouteType.BALANCED]: {
    type: RouteType.BALANCED,
    name: 'Оптимальный',
    description: 'Лучшее соотношение времени и расстояния',
    icon: '⚖️',
    color: '#f59e0b', // amber
  },
  [RouteType.ECO]: {
    type: RouteType.ECO,
    name: 'Экономичный',
    description: 'Экономия топлива, тихие дороги',
    icon: '🌱',
    color: '#059669', // emerald
  },
};

export interface RoutingProvider {
  name: string;
  buildRoute: (points: RoutePoint[], routeType?: RouteType) => Promise<RouteResult>;
}

/**
 * OSRM провайдер - бесплатный, эмулирует разные типы маршрутов
 */
class OSRMProvider implements RoutingProvider {
  name = 'OSRM';

  async buildRoute(
    points: RoutePoint[],
    routeType: RouteType = RouteType.FASTEST,
  ): Promise<RouteResult> {
    const waypoints = points.map(point => `${point.longitude},${point.latitude}`).join(';');

    const servers = [
      'https://router.project-osrm.org',
      'https://routing.openstreetmap.de/routed-car',
    ];

    for (const server of servers) {
      try {
        const url = server.includes('routed-car')
          ? `${server}/route/v1/driving/${waypoints}?overview=full&geometries=geojson&alternatives=false&steps=false`
          : `${server}/route/v1/driving/${waypoints}?overview=full&geometries=geojson&alternatives=false&steps=false&continue_straight=default`;

        // В браузере нельзя выставлять User-Agent (forbidden header) — Safari может падать с TypeError,
        // а кастомные заголовки вызывают CORS-preflight у публичных OSRM серверов.
        const response = await fetch(url);

        if (!response.ok) continue;

        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];

          return {
            type: routeType,
            coordinates: route.geometry.coordinates.map((coord: [number, number]) => [
              coord[1],
              coord[0],
            ]),
            distance: Math.round(route.distance || 0),
            duration: Math.round(route.duration || 0),
            info: ROUTE_TYPE_CONFIG[routeType],
            legs: route.legs?.map((leg: { distance: number }) => ({ distance: Math.round(leg.distance || 0) })),
          };
        }
      } catch {
        continue;
      }
    }

    throw new Error('Все OSRM сервера недоступны');
  }
}

/**
 * Главный сервис роутинга с поддержкой множественных маршрутов
 */
export class RoutingService {
  private providers: RoutingProvider[] = [
    new OSRMProvider(), // Основной провайдер - бесплатный и надежный
  ];

  /**
   * Строит один маршрут определенного типа
   */
  async buildRoute(
    points: RoutePoint[],
    routeType: RouteType = RouteType.FASTEST,
  ): Promise<RouteResult> {
    if (points.length < 2) {
      throw new Error('Нужно минимум 2 точки для построения маршрута');
    }

    // Пробуем провайдеры по порядку приоритета
    for (const provider of this.providers) {
      try {
        const route = await provider.buildRoute(points, routeType);

        return route;
      } catch {
        // Пропускаем ошибки и пробуем следующий провайдер
        continue;
      }
    }

    // Если все провайдеры не сработали - НЕ ИСПОЛЬЗУЕМ ПРЯМУЮ ЛИНИЮ!
    throw new Error('❌ Все провайдеры роутинга недоступны - невозможно построить маршрут по дорогам');
  }

  /**
   * Строит все доступные типы маршрутов используя реальные альтернативы от OSRM
   */
  async buildAllRoutes(points: RoutePoint[]): Promise<RouteResult[]> {
    if (points.length < 2) {
      throw new Error('Нужно минимум 2 точки для построения маршрута');
    }

    // Получаем реальные альтернативные маршруты от OSRM
    const realRoutes = await this.getRealAlternativeRoutes(points);

    if (realRoutes.length === 0) {
      // НЕ ИСПОЛЬЗУЕМ ПРЯМУЮ ЛИНИЮ! Возвращаем пустой массив если API недоступен
      throw new Error('❌ API роутинга недоступен - невозможно построить альтернативные маршруты');
    }

    // Назначаем типы реальным маршрутам
    return this.assignRouteTypes(realRoutes);
  }

  /**
   * Получает реальные альтернативные маршруты от OSRM API
   */
  private async getRealAlternativeRoutes(points: RoutePoint[]): Promise<OSRMRoute[]> {
    const waypoints = points.map(point => `${point.longitude},${point.latitude}`).join(';');

    const servers = [
      'https://router.project-osrm.org',
      'https://routing.openstreetmap.de/routed-car',
    ];

    for (const server of servers) {
      try {
        // Запрашиваем максимум альтернатив
        const url = server.includes('routed-car')
          ? `${server}/route/v1/driving/${waypoints}?overview=full&geometries=geojson&alternatives=true&steps=false&number_of_alternatives=3`
          : `${server}/route/v1/driving/${waypoints}?overview=full&geometries=geojson&alternatives=true&steps=false&continue_straight=default`;

        // См. комментарий выше про forbidden headers и CORS-preflight.
        const response = await fetch(url);

        if (!response.ok) continue;

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          return data.routes;
        }
      } catch {
        continue;
      }
    }

    return [];
  }

  /**
   * Назначает типы маршрутов реальным альтернативам
   */
  private assignRouteTypes(routes: OSRMRoute[]): RouteResult[] {
    const results: RouteResult[] = [];

    // Сортируем маршруты по разным критериям
    const sortedByTime = [...routes].sort((a, b) => a.duration - b.duration);
    const sortedByDistance = [...routes].sort((a, b) => a.distance - b.distance);

    // Назначаем типы
    if (sortedByTime[0]) {
      results.push(this.createRouteResult(sortedByTime[0], RouteType.FASTEST));
    }

    if (sortedByDistance[0] && sortedByDistance[0] !== sortedByTime[0]) {
      results.push(this.createRouteResult(sortedByDistance[0], RouteType.SHORTEST));
    }

    // Добавляем другие уникальные маршруты
    routes.forEach((route, index) => {
      if (index < 2) return; // Пропускаем уже добавленные

      const routeType = index === 2 ? RouteType.BALANCED : RouteType.ECO;

      if (results.length < 4) {
        results.push(this.createRouteResult(route, routeType));
      }
    });

    // Если маршрутов мало, дублируем с разными типами
    if (results.length === 1 && routes[0]) {
      const baseRoute = routes[0];

      results.push(this.createRouteResult(baseRoute, RouteType.SHORTEST));
      results.push(this.createRouteResult(baseRoute, RouteType.BALANCED));
      results.push(this.createRouteResult(baseRoute, RouteType.ECO));
    }

    return results;
  }

  /**
   * Создает RouteResult из OSRM маршрута
   */
  private createRouteResult(route: OSRMRoute, routeType: RouteType): RouteResult {
    return {
      type: routeType,
      coordinates: route.geometry.coordinates.map((coord: [number, number]) => [
        coord[1],
        coord[0],
      ]),
      distance: Math.round(route.distance || 0),
      duration: Math.round(route.duration || 0),
      info: ROUTE_TYPE_CONFIG[routeType],
    };
  }

  // Удалили createFallbackRoutes - не используем прямые линии

  /**
   * Вычисляет расстояние по прямой линии между точками
   */
  private calculateStraightLineDistance(points: RoutePoint[]): number {
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const point1 = points[i];
      const point2 = points[i + 1];

      // Формула гаверсинуса
      const R = 6371000; // Радиус Земли в метрах
      const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
      const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.latitude * Math.PI) / 180) *
          Math.cos((point2.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      totalDistance += R * c;
    }

    return totalDistance;
  }

  /**
   * Быстрая проверка доступности роутинга
   */
  async isRoutingAvailable(): Promise<boolean> {
    try {
      // Тестовый маршрут Бишкек
      const testPoints: RoutePoint[] = [
        { latitude: 42.8746, longitude: 74.5698 },
        { latitude: 42.8656, longitude: 74.5806 },
      ];

      await this.buildRoute(testPoints);

      return true;
    } catch {
      return false;
    }
  }
}

// Синглтон для использования в приложении
export const routingService = new RoutingService();
