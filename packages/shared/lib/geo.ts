import type { LocationGroupDTO } from '@shared/api/location-groups';

/**
 * Ray-casting point-in-polygon test.
 * poly is a flat array: [lat1, lng1, lat2, lng2, ...]
 */
export function pointInPolygon(lat: number, lng: number, poly: number[]): boolean {
  if (!poly || poly.length < 6) return false;
  const n = Math.floor(poly.length / 2);
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const latI = poly[i * 2];
    const lngI = poly[i * 2 + 1];
    const latJ = poly[j * 2];
    const lngJ = poly[j * 2 + 1];
    if ((lngI > lng) !== (lngJ > lng)) {
      const intersectLat = latI + ((lng - lngI) / (lngJ - lngI)) * (latJ - latI);
      if (lat < intersectLat) inside = !inside;
    }
  }
  return inside;
}

/**
 * Shoelace formula — returns area in coordinate units² (used only for comparison).
 */
function polygonArea(poly: number[]): number {
  if (!poly || poly.length < 6) return 0;
  const n = Math.floor(poly.length / 2);
  let area = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const lngI = poly[i * 2 + 1];
    const lngJ = poly[j * 2 + 1];
    const latI = poly[i * 2];
    const latJ = poly[j * 2];
    area += (lngJ + lngI) * (latJ - latI);
  }
  return Math.abs(area / 2);
}

/**
 * Find the best-matching area for a point.
 * If the point falls in multiple areas, picks the one with the smallest polygon
 * area (most specific / tightest boundary).
 * Returns null if no area contains the point.
 */
export function findBestAreaForPoint(
  lat: number,
  lng: number,
  areas: LocationGroupDTO[],
): LocationGroupDTO | null {
  const candidates = areas.filter(a => pointInPolygon(lat, lng, a.poly));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  return candidates.reduce((best, cur) =>
    polygonArea(cur.poly) < polygonArea(best.poly) ? cur : best,
  );
}
