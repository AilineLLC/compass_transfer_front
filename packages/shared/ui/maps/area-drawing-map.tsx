'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useState, useCallback, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Rectangle,
  CircleMarker,
  useMapEvents,
  useMap,
} from 'react-leaflet';

type DrawMode = 'none' | 'polygon' | 'rectangle';

interface AreaDrawingMapProps {
  poly: number[];
  onChange: (poly: number[]) => void;
  height?: string;
  className?: string;
}

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/** poly flat array -> [[lat, lng], ...] pairs */
function polyToPositions(poly: number[] | null | undefined): [number, number][] {
  if (!poly?.length) return [];
  const result: [number, number][] = [];
  for (let i = 0; i + 1 < poly.length; i += 2) {
    result.push([poly[i], poly[i + 1]]);
  }
  return result;
}

/** [[lat, lng], ...] -> flat poly array */
function positionsToPoly(positions: [number, number][]): number[] {
  return positions.flatMap(([lat, lng]) => [lat, lng]);
}

/** Calculate centroid of positions */
function calcCentroid(positions: [number, number][]): [number, number] {
  const lat = positions.reduce((s, p) => s + p[0], 0) / positions.length;
  const lng = positions.reduce((s, p) => s + p[1], 0) / positions.length;
  return [lat, lng];
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function CursorStyler({ mode }: { mode: DrawMode }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = mode !== 'none' ? 'crosshair' : '';
    return () => { container.style.cursor = ''; };
  }, [map, mode]);
  return null;
}

function PolygonDrawHandler({
  isActive,
  onPointAdd,
}: {
  isActive: boolean;
  onPointAdd: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (isActive) onPointAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function RectangleDrawHandler({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete: (bounds: [[number, number], [number, number]]) => void;
}) {
  const map = useMap();
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [currentPoint, setCurrentPoint] = useState<[number, number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useMapEvents({
    mousedown(e) {
      if (!isActive) return;
      setIsDrawing(true);
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      setCurrentPoint([e.latlng.lat, e.latlng.lng]);
      map.dragging.disable();
    },
    mousemove(e) {
      if (isDrawing && isActive) setCurrentPoint([e.latlng.lat, e.latlng.lng]);
    },
    mouseup(e) {
      if (!isDrawing || !isActive || !startPoint) return;
      setIsDrawing(false);
      map.dragging.enable();
      const end: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (Math.abs(end[0] - startPoint[0]) > 0.0001 || Math.abs(end[1] - startPoint[1]) > 0.0001) {
        onComplete([startPoint, end]);
      }
      setStartPoint(null);
      setCurrentPoint(null);
    },
  });

  useEffect(() => {
    if (!isActive) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      map.dragging.enable();
    }
  }, [isActive, map]);

  if (startPoint && currentPoint) {
    return (
      <Rectangle
        bounds={[startPoint, currentPoint]}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
      />
    );
  }
  return null;
}

export function AreaDrawingMap({
  poly,
  onChange,
  height = '450px',
  className = '',
}: AreaDrawingMapProps) {
  const [drawMode, setDrawMode] = useState<DrawMode>('none');

  const positions = polyToPositions(poly);
  const pointCount = positions.length;

  const defaultCenter: [number, number] = pointCount > 0 ? positions[0] : [42.856219, 74.603967];

  const handlePolygonPoint = useCallback(
    (p: [number, number]) => {
      onChange(positionsToPoly([...positions, p]));
    },
    [positions, onChange],
  );

  const handleRectangleComplete = useCallback(
    (bounds: [[number, number], [number, number]]) => {
      const [sw, ne] = bounds;
      const latMin = Math.min(sw[0], ne[0]);
      const latMax = Math.max(sw[0], ne[0]);
      const lngMin = Math.min(sw[1], ne[1]);
      const lngMax = Math.max(sw[1], ne[1]);
      const rectPositions: [number, number][] = [
        [latMax, lngMin],
        [latMax, lngMax],
        [latMin, lngMax],
        [latMin, lngMin],
      ];
      onChange(positionsToPoly(rectPositions));
      setDrawMode('none');
    },
    [onChange],
  );

  const handleUndo = () => {
    if (positions.length > 0) onChange(positionsToPoly(positions.slice(0, -1)));
  };

  const handleClear = () => onChange([]);

  const activateMode = (mode: DrawMode) => setDrawMode(prev => (prev === mode ? 'none' : mode));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-xs font-medium text-gray-600 mr-1">Режим рисования:</span>
        <button
          type="button"
          onClick={() => activateMode('polygon')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            drawMode === 'polygon'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          Расставить точки
        </button>
        <button
          type="button"
          onClick={() => activateMode('rectangle')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            drawMode === 'rectangle'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          Нарисовать прямоугольник
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleUndo}
          disabled={pointCount === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Отменить точку
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={pointCount === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Очистить
        </button>
      </div>

      {drawMode !== 'none' && (
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
          {drawMode === 'polygon'
            ? 'Кликайте на карте чтобы добавить точки границы. Минимум 3 точки.'
            : 'Зажмите и тяните мышью по карте чтобы нарисовать прямоугольник.'}
        </div>
      )}

      {pointCount > 0 && (
        <div className="text-xs text-gray-500">
          Точек: {pointCount}
          {pointCount < 3 && <span className="text-amber-600 ml-2">Нужно минимум 3</span>}
        </div>
      )}

      <div style={{ height, width: '100%' }} className="border rounded-lg overflow-hidden">
        <MapContainer
          center={defaultCenter}
          zoom={pointCount > 0 ? 12 : 10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapInvalidator />
          <CursorStyler mode={drawMode} />
          <PolygonDrawHandler isActive={drawMode === 'polygon'} onPointAdd={handlePolygonPoint} />
          <RectangleDrawHandler isActive={drawMode === 'rectangle'} onComplete={handleRectangleComplete} />

          {positions.length >= 3 && (
            <Polygon
              positions={positions}
              pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }}
            />
          )}
          {positions.length >= 2 && positions.length < 3 && (
            <Polyline
              positions={positions}
              pathOptions={{ color: '#2563eb', weight: 2, dashArray: '6 4' }}
            />
          )}
          {positions.map((pos, idx) => (
            <CircleMarker
              key={idx}
              center={pos}
              radius={6}
              pathOptions={{
                color: idx === 0 ? '#16a34a' : '#2563eb',
                fillColor: idx === 0 ? '#22c55e' : '#3b82f6',
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export { polyToPositions, positionsToPoly, calcCentroid };
