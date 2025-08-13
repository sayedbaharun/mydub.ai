// Weather & Traffic Reporter Agent - Specializes in real-time conditions and updates

import { BaseReporterAgent } from './BaseReporterAgent'
import { ContentAnalyzer } from '@/shared/services/reporter-agents/utils/contentAnalyzer'
import { callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'
import { supabase } from '@/shared/lib/supabase'
import {
  ReporterAgentConfig,
  ContentItem,
  ReporterSpecialty,
  DataSource,
  ContentStatus,
  DEFAULT_SCHEDULE
} from '@/shared/services/reporter-agents/types/reporter.types'

export class WeatherTrafficReporterAgent extends BaseReporterAgent {
  private static instance: WeatherTrafficReporterAgent

  constructor() {
    const config: ReporterAgentConfig = {
      id: 'weather-traffic-reporter-001',
      name: 'Dubai Weather & Traffic Reporter',
      description: 'Provides real-time weather updates, traffic conditions, and travel advisories',
      specialty: ReporterSpecialty.WEATHER_TRAFFIC,
      writingStyle: {
        tone: ['clear', 'concise', 'urgent', 'helpful', 'practical'],
        voice: 'neutral',
        complexity: 'simple',
        targetAudience: ['commuters', 'residents', 'drivers', 'general public'],
        customPrompts: [
          'Write in a clear, broadcast-style format',
          'Lead with the most important information',
          'Use precise timing and location details',
          'Provide actionable advice',
          'Keep it brief and scannable'
        ]
      },
      priorities: [
        'Severe weather warnings',
        'Major traffic incidents',
        'Road closures and diversions',
        'Public transport disruptions',
        'Air quality alerts',
        'Daily weather forecasts',
        'Rush hour traffic updates'
      ],
      sources: [
        {
          type: 'api',
          name: 'Weather API',
          apiKey: process.env.WEATHERAPI_KEY || process.env.OPENWEATHER_API_KEY,
          priority: 'high',
          refreshInterval: 10 // Every 10 minutes
        },
        {
          type: 'api',
          name: 'Dubai RTA Traffic API',
          apiKey: process.env.RTA_API_KEY,
          priority: 'high',
          refreshInterval: 5 // Every 5 minutes
        },
        {
          type: 'government',
          name: 'NCM UAE Weather',
          url: 'https://www.ncm.ae/en/rss',
          priority: 'high',
          refreshInterval: 15
        },
        {
          type: 'api',
          name: 'Google Traffic API',
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
          priority: 'medium',
          refreshInterval: 5
        },
        {
          type: 'social',
          name: 'Dubai Police Twitter',
          priority: 'high',
          refreshInterval: 5,
          filters: [
            {
              field: 'account',
              operator: 'equals',
              value: '@DubaiPoliceHQ'
            }
          ]
        },
        {
          type: 'api',
          name: 'Air Quality API',
          apiKey: process.env.AIR_QUALITY_API_KEY,
          priority: 'medium',
          refreshInterval: 30
        }
      ],
      scheduleConfig: {
        ...DEFAULT_SCHEDULE,
        frequency: 'continuous',
        priority: 'real-time',
        times: ['06:00', '07:00', '08:00', '12:00', '17:00', '18:00', '19:00'], // Rush hours
        timezone: 'Asia/Dubai'
      },
      learningEnabled: true,
      maxContentPerRun: 10
    }

    super(config)
  }

  static getInstance(): WeatherTrafficReporterAgent {
    if (!WeatherTrafficReporterAgent.instance) {
      WeatherTrafficReporterAgent.instance = new WeatherTrafficReporterAgent()
    }
    return WeatherTrafficReporterAgent.instance
  }

  async fetchContent(): Promise<ContentItem[]> {
    const allContent: ContentItem[] = []

    // Fetch from each source
    for (const source of this.config.sources) {
      try {
        const content = await this.fetchFromSource(source)
        allContent.push(...content)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }

    // Generate combined updates during rush hours
    const currentHour = new Date().getHours()
    const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)
    
    if (isRushHour) {
      const rushHourUpdate = await this.generateRushHourUpdate()
      allContent.push(...rushHourUpdate)
    }

    // Filter and validate
    const validContent = await this.filterAndValidateContent(allContent)

    // Enrich with real-time specific metadata
    const enrichedContent = await Promise.all(
      validContent.map(item => this.enrichRealtimeContent(item))
    )

    return enrichedContent
  }

  private async fetchFromSource(source: DataSource): Promise<ContentItem[]> {
    switch (source.name) {
      case 'OpenWeather API':
        return this.fetchWeatherData(source)
      case 'Dubai RTA Traffic API':
        return this.fetchRTATrafficData(source)
      case 'NCM UAE Weather':
        return this.fetchNCMWeatherData(source)
      case 'Google Traffic API':
        return this.fetchGoogleTrafficData(source)
      case 'Dubai Police Twitter':
        return this.fetchPoliceUpdates(source)
      case 'Air Quality API':
        return this.fetchAirQualityData(source)
      default:
        return []
    }
  }

  private async fetchWeatherData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-weather-data', {
        body: {
          apiKey: source.apiKey,
          locations: ['Dubai', 'Sharjah', 'Ajman'],
          includeAlerts: true,
          includeForecast: true
        }
      })

      if (!data) return []

      const contents: ContentItem[] = []

      // Current weather
      if (data.current) {
        contents.push({
          id: `weather-current-${Date.now()}`,
          agentId: this.config.id,
          title: `Dubai Weather Now: ${data.current.temp}°C, ${data.current.condition}`,
          content: this.createWeatherContent(data.current),
          summary: `${data.current.temp}°C, ${data.current.condition}. Feels like ${data.current.feels_like}°C.`,
          category: 'weather',
          tags: ['weather', 'current', 'temperature'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.7,
          publishedAt: new Date(),
          fetchedAt: new Date(),
          metadata: {
            customData: {
              temperature: data.current.temp,
              feelsLike: data.current.feels_like,
              humidity: data.current.humidity,
              windSpeed: data.current.wind_speed,
              visibility: data.current.visibility,
              uvIndex: data.current.uv_index
            }
          },
          status: ContentStatus.FETCHED
        })
      }

      // Weather alerts
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach((alert: any) => {
          contents.push({
            id: `weather-alert-${alert.id}`,
            agentId: this.config.id,
            title: `⚠️ Weather Alert: ${alert.event}`,
            content: alert.description,
            summary: alert.headline,
            category: 'alert',
            tags: ['weather', 'alert', 'warning', alert.severity.toLowerCase()],
            source: source,
            relevanceScore: 0,
            priorityScore: alert.severity === 'Extreme' ? 1.0 : 0.9,
            publishedAt: new Date(alert.start),
            fetchedAt: new Date(),
            metadata: {
              customData: {
                severity: alert.severity,
                urgency: alert.urgency,
                certainty: alert.certainty,
                areas: alert.areas,
                expires: alert.end
              }
            },
            status: ContentStatus.FETCHED
          })
        })
      }

      // Daily forecast
      if (data.forecast) {
        contents.push({
          id: `weather-forecast-${Date.now()}`,
          agentId: this.config.id,
          title: 'Dubai Weather Forecast: Next 24 Hours',
          content: this.createForecastContent(data.forecast),
          summary: `High: ${data.forecast.max_temp}°C, Low: ${data.forecast.min_temp}°C. ${data.forecast.summary}`,
          category: 'forecast',
          tags: ['weather', 'forecast', 'daily'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.6,
          publishedAt: new Date(),
          fetchedAt: new Date(),
          metadata: {
            customData: {
              maxTemp: data.forecast.max_temp,
              minTemp: data.forecast.min_temp,
              chanceOfRain: data.forecast.rain_probability,
              sunrise: data.forecast.sunrise,
              sunset: data.forecast.sunset
            }
          },
          status: ContentStatus.FETCHED
        })
      }

      return contents
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
      return []
    }
  }

  private async fetchRTATrafficData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rta-traffic', {
        body: {
          apiKey: source.apiKey,
          includeIncidents: true,
          includeRoadworks: true,
          includeCongestion: true
        }
      })

      if (!data) return []

      const contents: ContentItem[] = []

      // Traffic incidents
      if (data.incidents) {
        data.incidents.forEach((incident: any) => {
          contents.push({
            id: `traffic-incident-${incident.id}`,
            agentId: this.config.id,
            title: `🚨 ${incident.type} on ${incident.road}`,
            content: this.createIncidentContent(incident),
            summary: `${incident.type} causing ${incident.delay} delay on ${incident.road}`,
            category: 'traffic-incident',
            tags: ['traffic', 'incident', incident.type.toLowerCase()],
            source: source,
            relevanceScore: 0,
            priorityScore: incident.severity === 'major' ? 0.9 : 0.7,
            publishedAt: new Date(incident.reported_time),
            fetchedAt: new Date(),
            metadata: {
              location: {
                name: incident.location,
                area: incident.area,
                coordinates: incident.coordinates
              },
              customData: {
                severity: incident.severity,
                delay: incident.delay,
                affectedLanes: incident.affected_lanes,
                expectedClearTime: incident.expected_clear_time,
                alternativeRoutes: incident.alternative_routes
              }
            },
            status: ContentStatus.FETCHED
          })
        })
      }

      // Congestion updates
      if (data.congestion) {
        contents.push({
          id: `traffic-congestion-${Date.now()}`,
          agentId: this.config.id,
          title: 'Dubai Traffic Update: Current Congestion Levels',
          content: this.createCongestionContent(data.congestion),
          summary: `Major routes: ${data.congestion.summary}`,
          category: 'traffic-update',
          tags: ['traffic', 'congestion', 'live'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.8,
          publishedAt: new Date(),
          fetchedAt: new Date(),
          metadata: {
            customData: {
              congestionLevel: data.congestion.overall_level,
              hotspots: data.congestion.hotspots,
              clearest_routes: data.congestion.clearest_routes
            }
          },
          status: ContentStatus.FETCHED
        })
      }

      return contents
    } catch (error) {
      console.error('Failed to fetch RTA traffic data:', error)
      return []
    }
  }

  private async fetchNCMWeatherData(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items
        .filter((item: any) => this.isWeatherContent(item))
        .map((item: any) => ({
          id: `ncm-${Date.now()}-${Math.random()}`,
          agentId: this.config.id,
          title: item.title,
          content: item.content || item.description,
          summary: item.description?.substring(0, 200),
          category: 'weather-official',
          tags: ['weather', 'official', 'ncm'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.8, // Official sources get high priority
          publishedAt: new Date(item.pubDate || Date.now()),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: item.link,
            author: 'National Center of Meteorology'
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error('Failed to fetch NCM weather data:', error)
      return []
    }
  }

  private async fetchGoogleTrafficData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const majorRoutes = [
        { name: 'Sheikh Zayed Road', coords: '25.0987,55.1654' },
        { name: 'Al Khail Road', coords: '25.0657,55.2206' },
        { name: 'Emirates Road', coords: '25.2566,55.3947' },
        { name: 'Al Maktoum Bridge', coords: '25.2654,55.3156' }
      ]

      const { data } = await supabase.functions.invoke('fetch-google-traffic', {
        body: {
          apiKey: source.apiKey,
          routes: majorRoutes
        }
      })

      if (!data || !data.routes) return []

      return data.routes.map((route: any) => ({
        id: `google-traffic-${route.name.replace(/\s+/g, '-')}-${Date.now()}`,
        agentId: this.config.id,
        title: `${route.name}: ${route.traffic_condition}`,
        content: `Current travel time on ${route.name}: ${route.duration} (typical: ${route.duration_in_traffic}). Traffic is ${route.traffic_condition}.`,
        summary: `${route.name} - ${route.traffic_condition}`,
        category: 'traffic-route',
        tags: ['traffic', 'route', route.traffic_condition.toLowerCase()],
        source: source,
        relevanceScore: 0,
        priorityScore: route.traffic_condition === 'heavy' ? 0.8 : 0.5,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          location: {
            name: route.name,
            coordinates: route.coordinates
          },
          customData: {
            currentDuration: route.duration,
            typicalDuration: route.duration_in_traffic,
            trafficLevel: route.traffic_level,
            delayMinutes: route.delay_minutes
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch Google traffic data:', error)
      return []
    }
  }

  private async fetchPoliceUpdates(source: DataSource): Promise<ContentItem[]> {
    try {
      const { data } = await supabase.functions.invoke('fetch-social-updates', {
        body: {
          accounts: ['@DubaiPoliceHQ', '@rta_dubai'],
          keywords: ['traffic', 'accident', 'road', 'closure', 'alert'],
          languages: ['en', 'ar'],
          limit: 10
        }
      })

      if (!data || !data.posts) return []

      return data.posts
        .filter((post: any) => this.isTrafficRelated(post))
        .map((post: any) => ({
          id: `police-update-${post.id}`,
          agentId: this.config.id,
          title: this.extractTrafficTitle(post),
          content: post.text,
          summary: post.text.substring(0, 150),
          category: 'traffic-alert',
          tags: ['traffic', 'police', 'alert'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.9, // Police updates are high priority
          publishedAt: new Date(post.created_at),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: post.url,
            author: post.author.name,
            customData: {
              isOfficial: true,
              engagement: post.retweet_count + post.like_count
            }
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error('Failed to fetch police updates:', error)
      return []
    }
  }

  private async fetchAirQualityData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-air-quality', {
        body: {
          apiKey: source.apiKey,
          locations: ['Dubai', 'Sharjah', 'Abu Dhabi'],
          includeHealth: true
        }
      })

      if (!data || !data.readings) return []

      return data.readings.map((reading: any) => ({
        id: `air-quality-${reading.location}-${Date.now()}`,
        agentId: this.config.id,
        title: `Air Quality in ${reading.location}: ${reading.category} (AQI: ${reading.aqi})`,
        content: this.createAirQualityContent(reading),
        summary: `AQI ${reading.aqi} - ${reading.category}. ${reading.health_advisory}`,
        category: 'air-quality',
        tags: ['air-quality', 'health', reading.category.toLowerCase()],
        source: source,
        relevanceScore: 0,
        priorityScore: reading.aqi > 150 ? 0.8 : 0.5,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          location: {
            name: reading.location,
            area: reading.area
          },
          customData: {
            aqi: reading.aqi,
            pm25: reading.pm25,
            pm10: reading.pm10,
            category: reading.category,
            healthAdvisory: reading.health_advisory,
            sensitiveCaution: reading.sensitive_groups_advisory
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch air quality data:', error)
      return []
    }
  }

  private async generateRushHourUpdate(): Promise<ContentItem[]> {
    try {
      // Aggregate current conditions
      const { data: conditions } = await supabase
        .from('current_conditions')
        .select('*')
        .single()

      if (!conditions) return []

      const prompt = `
        Generate a concise rush hour update for Dubai commuters:
        
        Traffic: ${conditions.traffic_summary}
        Weather: ${conditions.weather_summary}
        Key incidents: ${conditions.incidents}
        
        Create a 100-word broadcast-style update that:
        - Highlights major delays
        - Suggests alternative routes
        - Mentions weather impact on driving
        - Ends with estimated clear times
      `

      const update = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      return [{
        id: `rush-hour-${Date.now()}`,
        agentId: this.config.id,
        title: `Rush Hour Update: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
        content: update,
        summary: 'Combined traffic and weather update for commuters',
        category: 'rush-hour',
        tags: ['traffic', 'weather', 'commute', 'rush-hour'],
        source: {
          type: 'api',
          name: 'AI Rush Hour Compiler',
          priority: 'high',
          refreshInterval: 60
        },
        relevanceScore: 0.9,
        priorityScore: 0.9,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          customData: {
            isComposite: true,
            conditions
          }
        },
        status: ContentStatus.FETCHED
      }]
    } catch (error) {
      console.error('Failed to generate rush hour update:', error)
      return []
    }
  }

  private async enrichRealtimeContent(content: ContentItem): Promise<ContentItem> {
    // Base enrichment
    let enriched = await ContentAnalyzer.enrichContent(content)

    // Add real-time specific analysis
    if (content.category.includes('traffic')) {
      enriched = await this.enrichTrafficContent(enriched)
    } else if (content.category.includes('weather')) {
      enriched = await this.enrichWeatherContent(enriched)
    }

    // Add urgency score
    const urgencyScore = this.calculateUrgencyScore(enriched)
    enriched.metadata.customData = {
      ...enriched.metadata.customData,
      urgencyScore,
      expiresAt: this.calculateExpiry(enriched)
    }

    return enriched
  }

  private async enrichTrafficContent(content: ContentItem): Promise<ContentItem> {
    // Add impact analysis
    const impact = await this.analyzeTrafficImpact(content)
    content.metadata.customData = {
      ...content.metadata.customData,
      impact
    }

    return content
  }

  private async enrichWeatherContent(content: ContentItem): Promise<ContentItem> {
    // Add activity recommendations
    const recommendations = await this.generateWeatherRecommendations(content)
    content.metadata.customData = {
      ...content.metadata.customData,
      recommendations
    }

    return content
  }

  async generateArticle(content: ContentItem): Promise<string> {
    const prompt = `
      You are a professional traffic and weather reporter for Dubai's real-time information service.
      
      Create a clear, actionable update from this content:
      
      Title: ${content.title}
      Category: ${content.category}
      Content: ${content.content}
      ${content.metadata.customData ? `Data: ${JSON.stringify(content.metadata.customData)}` : ''}
      
      Guidelines:
      ${this.config.writingStyle.customPrompts?.join('\n')}
      
      Requirements:
      - Write in ${this.config.writingStyle.voice} voice
      - Lead with the most critical information
      - Use specific locations and times
      - Provide clear action items
      - Keep paragraphs short (2-3 sentences max)
      - Length: 150-250 words for standard updates, 50-100 for alerts
      
      Format:
      - Headline statement
      - Current conditions
      - Impact/implications
      - Recommended actions
      - Expected duration/resolution
      
      Be precise and helpful. No markdown.
    `

    try {
      const article = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return this.formatForPublication(article)
    } catch (error) {
      console.error('Failed to generate weather/traffic article:', error)
      throw error
    }
  }

  protected async calculateSpecialtyRelevance(content: ContentItem): Promise<number> {
    let score = 0

    // Category relevance
    if (['weather', 'traffic', 'air-quality', 'alert'].some(cat => content.category.includes(cat))) {
      score += 0.4
    }

    // Urgency factor
    const urgencyScore = content.metadata.customData?.urgencyScore || 0
    score += urgencyScore * 0.3

    // Source authority
    if (content.source.type === 'government' || content.source.type === 'api') {
      score += 0.2
    }

    // Recency (real-time content loses relevance quickly)
    const ageInMinutes = (Date.now() - content.publishedAt.getTime()) / (1000 * 60)
    if (ageInMinutes < 30) score += 0.1
    else if (ageInMinutes > 120) score -= 0.2

    return Math.max(0, Math.min(score, 1))
  }

  private createWeatherContent(current: any): string {
    return `
      Current conditions in Dubai:
      Temperature: ${current.temp}°C (Feels like ${current.feels_like}°C)
      Conditions: ${current.condition}
      
      Wind: ${current.wind_speed} km/h from ${current.wind_direction}
      Humidity: ${current.humidity}%
      Visibility: ${current.visibility} km
      UV Index: ${current.uv_index} ${this.getUVAdvisory(current.uv_index)}
      
      ${current.precipitation ? `Precipitation: ${current.precipitation}mm` : ''}
    `.trim()
  }

  private createForecastContent(forecast: any): string {
    return `
      24-Hour Forecast for Dubai:
      
      Morning (6 AM - 12 PM): ${forecast.morning.temp}°C, ${forecast.morning.condition}
      Afternoon (12 PM - 6 PM): ${forecast.afternoon.temp}°C, ${forecast.afternoon.condition}
      Evening (6 PM - 12 AM): ${forecast.evening.temp}°C, ${forecast.evening.condition}
      
      High: ${forecast.max_temp}°C at ${forecast.max_temp_time}
      Low: ${forecast.min_temp}°C at ${forecast.min_temp_time}
      
      ${forecast.rain_probability > 30 ? `Chance of rain: ${forecast.rain_probability}%` : ''}
      
      Sunrise: ${forecast.sunrise}
      Sunset: ${forecast.sunset}
    `.trim()
  }

  private createIncidentContent(incident: any): string {
    return `
      ${incident.type} reported on ${incident.road} near ${incident.location}.
      
      Details: ${incident.description}
      Affected lanes: ${incident.affected_lanes}
      Current delay: ${incident.delay}
      
      ${incident.alternative_routes ? `Alternative routes: ${incident.alternative_routes.join(', ')}` : ''}
      
      Expected to clear by ${incident.expected_clear_time}
      
      Motorists advised to ${incident.advice || 'use alternative routes and drive carefully'}.
    `.trim()
  }

  private createCongestionContent(congestion: any): string {
    let content = `Traffic Congestion Update - ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\n\n`
    
    content += `Overall congestion level: ${congestion.overall_level}\n\n`
    
    content += 'Heavy Traffic Areas:\n'
    congestion.hotspots.forEach((hotspot: any) => {
      content += `- ${hotspot.location}: ${hotspot.delay} delay\n`
    })
    
    content += '\nClear Routes:\n'
    congestion.clearest_routes.forEach((route: any) => {
      content += `- ${route.name}: Normal flow\n`
    })
    
    return content
  }

  private createAirQualityContent(reading: any): string {
    return `
      Air Quality Index (AQI) for ${reading.location}: ${reading.aqi}
      Category: ${reading.category}
      
      Pollutant Levels:
      PM2.5: ${reading.pm25} µg/m³
      PM10: ${reading.pm10} µg/m³
      ${reading.o3 ? `Ozone: ${reading.o3} ppb` : ''}
      ${reading.no2 ? `NO2: ${reading.no2} ppb` : ''}
      
      Health Advisory: ${reading.health_advisory}
      
      ${reading.sensitive_groups_advisory ? `Sensitive groups: ${reading.sensitive_groups_advisory}` : ''}
      
      ${this.getAirQualityRecommendations(reading.aqi)}
    `.trim()
  }

  private getUVAdvisory(uvIndex: number): string {
    if (uvIndex <= 2) return '(Low)'
    if (uvIndex <= 5) return '(Moderate - Wear sunscreen)'
    if (uvIndex <= 7) return '(High - Seek shade during midday)'
    if (uvIndex <= 10) return '(Very High - Take all precautions)'
    return '(Extreme - Avoid outdoor exposure)'
  }

  private getAirQualityRecommendations(aqi: number): string {
    if (aqi <= 50) return 'Air quality is good. Enjoy outdoor activities!'
    if (aqi <= 100) return 'Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.'
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects. Limit prolonged outdoor exertion.'
    if (aqi <= 200) return 'Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.'
    if (aqi <= 300) return 'Health warnings of emergency conditions. Everyone should avoid outdoor exertion.'
    return 'Hazardous conditions. Everyone should avoid all outdoor activity.'
  }

  private isWeatherContent(item: any): boolean {
    const content = `${item.title} ${item.description}`.toLowerCase()
    const weatherTerms = ['weather', 'temperature', 'forecast', 'rain', 'storm', 'wind', 'humidity']
    return weatherTerms.some(term => content.includes(term))
  }

  private isTrafficRelated(post: any): boolean {
    const text = post.text.toLowerCase()
    const trafficTerms = ['traffic', 'accident', 'road', 'closure', 'congestion', 'delay', 'incident']
    return trafficTerms.some(term => text.includes(term))
  }

  private extractTrafficTitle(post: any): string {
    const text = post.text
    
    // Look for key patterns
    if (text.includes('ACCIDENT')) {
      const match = text.match(/ACCIDENT.*?on\s+([^,.\n]+)/i)
      if (match) return `Accident on ${match[1]}`
    }
    
    if (text.includes('CLOSURE')) {
      const match = text.match(/CLOSURE.*?(?:of|on)\s+([^,.\n]+)/i)
      if (match) return `Road Closure: ${match[1]}`
    }
    
    // Default to first 80 characters
    return text.length > 80 ? text.substring(0, 77) + '...' : text
  }

  private calculateUrgencyScore(content: ContentItem): number {
    let score = 0

    // Alert categories are most urgent
    if (content.category === 'alert' || content.category === 'traffic-incident') {
      score += 0.5
    }

    // Severity indicators
    const severityKeywords = ['severe', 'major', 'emergency', 'critical', 'extreme']
    const contentLower = content.content.toLowerCase()
    if (severityKeywords.some(keyword => contentLower.includes(keyword))) {
      score += 0.3
    }

    // Time sensitivity
    const ageInMinutes = (Date.now() - content.publishedAt.getTime()) / (1000 * 60)
    if (ageInMinutes < 15) score += 0.2
    else if (ageInMinutes > 60) score -= 0.2

    return Math.max(0, Math.min(score, 1))
  }

  private calculateExpiry(content: ContentItem): Date {
    const now = new Date()
    
    // Different expiry times based on content type
    switch (content.category) {
      case 'traffic-incident':
      case 'alert':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
      case 'weather':
      case 'forecast':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000) // 6 hours
      case 'air-quality':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
      default:
        return new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours
    }
  }

  private async analyzeTrafficImpact(content: ContentItem): Promise<any> {
    const impact = {
      affectedRoutes: [],
      estimatedDelays: {},
      alternativeRoutes: [],
      publicTransportImpact: 'none'
    }

    // Extract route information
    const routeRegex = /(?:on|at|near)\s+([A-Z][a-zA-Z\s]+(?:Road|Street|Bridge|Highway))/g
    let match
    while ((match = routeRegex.exec(content.content)) !== null) {
      impact.affectedRoutes.push(match[1])
    }

    // Extract delay information
    const delayRegex = /(\d+)\s*(?:minute|min|hour|hr)s?\s*delay/gi
    while ((match = delayRegex.exec(content.content)) !== null) {
      impact.estimatedDelays.general = match[0]
    }

    return impact
  }

  private async generateWeatherRecommendations(content: ContentItem): Promise<string[]> {
    const temp = content.metadata.customData?.temperature
    const condition = content.metadata.customData?.condition?.toLowerCase() || ''
    
    const recommendations = []

    if (temp > 40) {
      recommendations.push('Avoid outdoor activities between 11 AM and 4 PM')
      recommendations.push('Stay hydrated and seek air-conditioned spaces')
    } else if (temp > 35) {
      recommendations.push('Limit outdoor exposure during peak hours')
      recommendations.push('Wear light, breathable clothing')
    } else if (temp < 25) {
      recommendations.push('Perfect weather for outdoor activities')
      recommendations.push('Great time for beach visits and desert tours')
    }

    if (condition.includes('rain') || condition.includes('storm')) {
      recommendations.push('Drive with caution - roads may be slippery')
      recommendations.push('Allow extra time for commute')
    }

    if (condition.includes('dust') || condition.includes('sand')) {
      recommendations.push('Limit outdoor exposure if you have respiratory conditions')
      recommendations.push('Keep windows closed and use air purifiers')
    }

    return recommendations
  }

  private async filterAndValidateContent(content: ContentItem[]): Promise<ContentItem[]> {
    // Remove duplicates
    const seen = new Set<string>()
    const unique = content.filter(item => {
      // For real-time content, use a more specific key
      const key = `${item.category}-${item.title}-${Math.floor(item.publishedAt.getTime() / (5 * 60 * 1000))}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Validate
    const valid: ContentItem[] = []
    for (const item of unique) {
      if (await this.validateContent(item)) {
        // Check if content is not expired
        const expiry = this.calculateExpiry(item)
        if (expiry > new Date()) {
          valid.push(item)
        }
      }
    }

    // Sort by urgency and recency
    return valid.sort((a, b) => {
      // Alerts and incidents first
      if (a.category === 'alert' && b.category !== 'alert') return -1
      if (b.category === 'alert' && a.category !== 'alert') return 1

      // Then by urgency score
      const urgencyA = a.metadata.customData?.urgencyScore || 0
      const urgencyB = b.metadata.customData?.urgencyScore || 0
      
      if (Math.abs(urgencyA - urgencyB) > 0.2) {
        return urgencyB - urgencyA
      }

      // Finally by recency
      return b.publishedAt.getTime() - a.publishedAt.getTime()
    })
  }
}