// Plain data fetching, no AI involved: the model only decides WHEN to call this.
// Open-Meteo is free for non-commercial use and needs no API key.
import type { Weather } from '#shared/genui'

// WMO weather codes returned by Open-Meteo, in plain words for the model.
// https://open-meteo.com/en/docs ("WMO Weather interpretation codes")
const CONDITIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

interface GeocodingResponse {
  results?: {
    name: string
    admin1?: string
    country?: string
    latitude: number
    longitude: number
  }[]
}

interface ForecastResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

function describe(code: number) {
  return CONDITIONS[code] ?? 'Unknown'
}

// Exported from server/utils/, so Nuxt auto-imports it in every server file.
export async function getWeather(city: string): Promise<Weather> {
  // 1. City name -> coordinates.
  const geo = await $fetch<GeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', {
    query: {
      name: city,
      count: 1,
      language: 'en',
      format: 'json',
    },
  })
  const place = geo.results?.[0]
  if (!place)
    throw new Error(`No city found with the name "${city}".`)

  // 2. Coordinates -> current weather and a 5-day forecast (°C, km/h, local time zone).
  const { current, daily } = await $fetch<ForecastResponse>('https://api.open-meteo.com/v1/forecast', {
    query: {
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: 5,
    },
  })

  // 3. Reshape the API response into our contract (the Weather type).
  return {
    // Set removes repeats like "Guatemala City, Guatemala, Guatemala".
    location: [
      ...new Set([place.name, place.admin1, place.country].filter(Boolean)),
    ].join(', '),
    current: {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      code: current.weather_code,
      condition: describe(current.weather_code),
      isDay: current.is_day === 1,
    },
    daily: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i]!,
      condition: describe(daily.weather_code[i]!),
      min: Math.round(daily.temperature_2m_min[i]!),
      max: Math.round(daily.temperature_2m_max[i]!),
    })),
  }
}
