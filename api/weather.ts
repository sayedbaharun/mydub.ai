import type { VercelRequest, VercelResponse } from '@vercel/node'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Enable CORS (align with production origin)
  const origin = 'https://www.mydub.ai'
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get API key from environment - try weatherapi.com first, then OpenWeather
    const weatherApiKey = process.env.VITE_WEATHERAPI_KEY || process.env.WEATHERAPI_KEY
    const openWeatherKey = process.env.VITE_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY
    const apiKey = weatherApiKey || openWeatherKey
    
    if (!apiKey) {
      console.error('Weather API key not configured')
      // Return realistic fallback data for Dubai
      return res.status(200).json({
        coord: { lon: 55.2708, lat: 25.2048 },
        weather: [{ 
          id: 800, 
          main: 'Clear', 
          description: 'clear sky', 
          icon: '01d' 
        }],
        base: 'stations',
        main: {
          temp: 28,
          feels_like: 29,
          temp_min: 26,
          temp_max: 30,
          pressure: 1013,
          humidity: 45
        },
        visibility: 10000,
        wind: {
          speed: 3.5,
          deg: 270
        },
        clouds: { all: 0 },
        dt: Math.floor(Date.now() / 1000),
        sys: {
          type: 1,
          id: 7537,
          country: 'AE',
          sunrise: 1699327200,
          sunset: 1699368000
        },
        timezone: 14400,
        id: 292223,
        name: 'Dubai',
        cod: 200,
        fallback: true
      })
    }
    
    // Default to Dubai weather
    const city = req.query.city || 'Dubai'
    const units = req.query.units || 'metric'
    
    let response;
    let data;
    
    // Use weatherapi.com if available, otherwise fall back to OpenWeather
    if (weatherApiKey) {
      response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${city}&aqi=yes`
      )
      
      if (response.ok) {
        const weatherApiData = await response.json()
        
        // Transform weatherapi.com response to match OpenWeather format
        data = {
          coord: { 
            lon: weatherApiData.location.lon, 
            lat: weatherApiData.location.lat 
          },
          weather: [{ 
            id: getWeatherCode(weatherApiData.current.condition.code),
            main: getWeatherMain(weatherApiData.current.condition.code),
            description: weatherApiData.current.condition.text.toLowerCase(),
            icon: getWeatherIcon(weatherApiData.current.condition.code, weatherApiData.current.is_day)
          }],
          base: 'stations',
          main: {
            temp: weatherApiData.current.temp_c,
            feels_like: weatherApiData.current.feelslike_c,
            temp_min: weatherApiData.current.temp_c - 2,
            temp_max: weatherApiData.current.temp_c + 2,
            pressure: weatherApiData.current.pressure_mb,
            humidity: weatherApiData.current.humidity
          },
          visibility: weatherApiData.current.vis_km * 1000,
          wind: {
            speed: weatherApiData.current.wind_kph / 3.6,
            deg: weatherApiData.current.wind_degree,
            gust: weatherApiData.current.gust_kph / 3.6
          },
          clouds: { 
            all: weatherApiData.current.cloud 
          },
          dt: weatherApiData.current.last_updated_epoch,
          sys: {
            type: 1,
            id: 7537,
            country: weatherApiData.location.country === 'United Arab Emirates' ? 'AE' : weatherApiData.location.country,
            sunrise: 1699327200,
            sunset: 1699368000
          },
          timezone: 14400,
          id: 292223,
          name: weatherApiData.location.name,
          cod: 200,
          air_quality: weatherApiData.current.air_quality,
          uv: weatherApiData.current.uv
        }
      }
    } else if (openWeatherKey) {
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},AE&appid=${openWeatherKey}&units=${units}`
      )
      
      if (response.ok) {
        data = await response.json()
      }
    }

    if (!response || !response.ok || !data) {
      throw new Error(`Weather API error: ${response?.status || 'No response'}`)
    }
    
    // Add cache headers for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate')
    
    return res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    
    // Return realistic fallback weather for Dubai
    return res.status(200).json({
      coord: { lon: 55.2708, lat: 25.2048 },
      weather: [{ 
        id: 800, 
        main: 'Clear', 
        description: 'clear sky', 
        icon: '01d' 
      }],
      base: 'stations',
      main: {
        temp: 28,
        feels_like: 29,
        temp_min: 26,
        temp_max: 30,
        pressure: 1013,
        humidity: 45
      },
      visibility: 10000,
      wind: {
        speed: 3.5,
        deg: 270
      },
      clouds: { all: 0 },
      dt: Math.floor(Date.now() / 1000),
      sys: {
        type: 1,
        id: 7537,
        country: 'AE',
        sunrise: 1699327200,
        sunset: 1699368000
      },
      timezone: 14400,
      id: 292223,
      name: 'Dubai',
      cod: 200,
      error: true,
      fallback: true
    })
  }
}

// Helper functions to map weatherapi.com codes to OpenWeather format
function getWeatherCode(code: number): number {
  const codeMap: Record<number, number> = {
    1000: 800, // Clear/Sunny
    1003: 801, // Partly cloudy
    1006: 802, // Cloudy
    1009: 803, // Overcast
    1030: 701, // Mist
    1063: 500, // Patchy rain possible
    1066: 600, // Patchy snow possible
    1087: 200, // Thundery outbreaks possible
    1135: 741, // Fog
    1180: 500, // Patchy light rain
    1183: 500, // Light rain
    1189: 501, // Moderate rain
    1195: 503, // Heavy rain
    1240: 520, // Light rain shower
    1243: 521, // Moderate or heavy rain shower
    1273: 200, // Patchy light rain with thunder
    1276: 201, // Moderate or heavy rain with thunder
  }
  return codeMap[code] || 800
}

function getWeatherMain(code: number): string {
  if (code === 1000) return 'Clear'
  if (code >= 1003 && code <= 1009) return 'Clouds'
  if (code === 1030 || code === 1135) return 'Mist'
  if (code >= 1063 && code <= 1072) return 'Drizzle'
  if (code >= 1180 && code <= 1201) return 'Rain'
  if (code >= 1240 && code <= 1246) return 'Rain'
  if (code >= 1273 && code <= 1282) return 'Thunderstorm'
  return 'Clear'
}

function getWeatherIcon(code: number, isDay: number): string {
  const main = getWeatherMain(code)
  const dayNight = isDay ? 'd' : 'n'
  
  const iconMap: Record<string, string> = {
    'Clear': '01',
    'Clouds': code === 1003 ? '02' : code === 1006 ? '03' : '04',
    'Mist': '50',
    'Drizzle': '09',
    'Rain': '10',
    'Thunderstorm': '11'
  }
  
  return `${iconMap[main] || '01'}${dayNight}`
}

export default handler;