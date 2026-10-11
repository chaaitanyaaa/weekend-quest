export interface WeatherForecast {
  city: string;
  temp: number; // in Celsius
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
  rainChance: number;
}

const WEATHER_CODE_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear & Sunny', icon: '☀️' },
  1: { condition: 'Mainly Sunny', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Moderate Drizzle', icon: '🌦️' },
  55: { condition: 'Dense Drizzle', icon: '🌧️' },
  61: { condition: 'Slight Rain', icon: '🌧️' },
  63: { condition: 'Moderate Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  71: { condition: 'Slight Snow', icon: '🌨️' },
  73: { condition: 'Moderate Snow', icon: '🌨️' },
  75: { condition: 'Heavy Snow', icon: '❄️' },
  80: { condition: 'Rain Showers', icon: '🌦️' },
  81: { condition: 'Heavy Showers', icon: '🌧️' },
  82: { condition: 'Violent Showers', icon: '⛈️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { condition: 'Heavy Hail Thunderstorm', icon: '⛈️' },
};

const weatherCache = new Map<string, { data: WeatherForecast; timestamp: number }>();

export async function fetchLocationWeather(locationName: string): Promise<WeatherForecast | null> {
  const cleanName = locationName.split(',')[0].replace(/Park|Trail|Beach|Downtown|Bay|Canyon|Lake/gi, '').trim() || locationName.split(',')[0].trim();
  const cacheKey = cleanName.toLowerCase();

  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached.data;
  }

  try {
    // 1. Geocode location name
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;

    const { latitude, longitude, name: cityName } = geoData.results[0];

    // 2. Fetch forecast
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    if (!forecastRes.ok) return null;
    const forecastData = await forecastRes.json();

    const currentTemp = Math.round(forecastData.current?.temperature_2m ?? 22);
    const weatherCode = forecastData.current?.weather_code ?? 0;
    const info = WEATHER_CODE_MAP[weatherCode] || { condition: 'Clear', icon: '☀️' };

    const tempMax = Math.round(forecastData.daily?.temperature_2m_max?.[0] ?? currentTemp + 2);
    const tempMin = Math.round(forecastData.daily?.temperature_2m_min?.[0] ?? currentTemp - 4);
    const rainChance = Math.round(forecastData.daily?.precipitation_probability_max?.[0] ?? 10);

    const result: WeatherForecast = {
      city: cityName || cleanName,
      temp: currentTemp,
      tempMax,
      tempMin,
      condition: info.condition,
      icon: info.icon,
      rainChance,
    };

    weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('[Weather] Could not fetch forecast for', locationName, err);
    return null;
  }
}
