import { NextResponse, type NextRequest } from 'next/server';

interface NominatimResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: Record<string, string>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Параметр q обязателен' },
        { status: 400 }
      );
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ru&countrycodes=kg&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'CompassTaxi/2.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();

    const results = data.map((item: NominatimResult) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      type: item.type,
      importance: item.importance,
    }));

    return NextResponse.json(results);

  } catch {
    return NextResponse.json([]);
  }
}
