import { NextRequest, NextResponse } from 'next/server';

interface AddressData {
  fullAddress: string;
  country: string;
  region: string;
  city: string;
  street: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Параметры lat и lon обязательны' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Неверные координаты' },
        { status: 400 }
      );
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'CompassTaxi/2.0',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return NextResponse.json({
        fullAddress: `Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        country: '',
        region: '',
        city: '',
        street: ''
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error('Nominatim error:', data.error);
      return NextResponse.json({
        fullAddress: `Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        country: '',
        region: '',
        city: '',
        street: ''
      });
    }

    const address = data.address || {};
    const fullAddress = data.display_name || `Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    const country = address.country || '';
    const region = address.state ||
                   address.region ||
                   address.province ||
                   address.county ||
                   address.state_district ||
                   address.administrative || '';
    const city = address.city ||
                 address.town ||
                 address.village ||
                 address.municipality ||
                 address.hamlet || '';
    const street = address.road ||
                   address.street ||
                   address.pedestrian ||
                   address.path || '';

    let finalRegion = region;
    if (!finalRegion && fullAddress) {
      const regionPatterns = [
        /(\w+\s*область)/i,
        /(\w+\s*обл\.?)/i,
        /(\w+\s*region)/i,
        /(Чуйская|Иссык-Кульская|Нарынская|Таласская|Ошская|Жалал-Абадская|Баткенская)\s*(область|обл\.?|region)?/i
      ];

      for (const pattern of regionPatterns) {
        const match = fullAddress.match(pattern);
        if (match) {
          finalRegion = match[1];
          break;
        }
      }
    }

    const result: AddressData = {
      fullAddress,
      country,
      region: finalRegion,
      city,
      street
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Ошибка геокодирования:', error);

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') || '0';
    const lon = searchParams.get('lon') || '0';

    return NextResponse.json({
      fullAddress: `Координаты: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
      country: '',
      region: '',
      city: '',
      street: ''
    });
  }
}
