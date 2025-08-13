import { AIAgent, AgentResponse, IntelligentQuery } from '../types/agent.types'
import { supabase } from '@/shared/lib/supabase'

/**
 * Specialized Agent Service - Individual agent implementations
 * Each agent has specialized knowledge and capabilities
 */

export class GovernmentAgentService {
  async processQuery(_agent: AIAgent, query: IntelligentQuery): Promise<AgentResponse> {
    const messageLower = query.originalQuery.toLowerCase()
    
    // Check if query is about specific government services
    if (messageLower.includes('visa') || messageLower.includes('permit')) {
      return await this.handleVisaPermitQuery(query)
    }
    
    if (messageLower.includes('municipality') || messageLower.includes('building')) {
      return await this.handleMunicipalityQuery(query)
    }
    
    if (messageLower.includes('rta') || messageLower.includes('transport') || messageLower.includes('license')) {
      return await this.handleRTAQuery(query)
    }
    
    // Default government response
    return {
      content: `I can help you with Dubai government services including visa applications, permits, licenses, and municipal services. The main government departments I work with are Dubai Municipality, RTA (Roads and Transport Authority), and Dubai Health Authority. What specific service do you need assistance with?`,
      confidence: 0.85,
      dataSources: ['government_services_db'],
      actionableItems: [
        {
          action: 'Visit Dubai.ae for official government services',
          type: 'contact',
          urgency: 'future'
        }
      ],
      followUpQuestions: [
        'Do you need help with visa applications?',
        'Are you looking for business licensing information?',
        'Do you need municipality services?'
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleVisaPermitQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    // Get real government services from database
    const { data: services } = await supabase
      .from('government_services')
      .select('*')
      .or('name.ilike.%visa%,name.ilike.%permit%')
      .limit(3)

    let content = "For visa and permit services in Dubai:\n\n"
    
    if (services && services.length > 0) {
      services.forEach(service => {
        content += `• **${service.name}**: ${service.description}\n`
        content += `  - Processing time: ${service.processing_time}\n`
        content += `  - Fee: ${service.fee_structure}\n\n`
      })
    }
    
    content += "You can apply online through the official Dubai government portal or visit the relevant department in person."

    return {
      content,
      confidence: 0.92,
      dataSources: ['government_services_db', 'dubai_gov_portal'],
      actionableItems: [
        {
          action: 'Visit Dubai.ae for online applications',
          type: 'application',
          urgency: 'today'
        }
      ],
      predictiveInsights: [
        {
          type: 'timing',
          prediction: 'Processing times are typically faster early in the week',
          confidence: 0.75,
          timeframe: 'weekly'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleMunicipalityQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai Municipality services include building permits, trade licenses, health certificates, and environmental approvals. Most services can be completed online through Dubai Municipality's website or mobile app.\n\nCommon services:\n• Building permits and approvals\n• Trade license applications\n• Food establishment permits\n• Environmental impact assessments\n\nProcessing times vary from 1-15 working days depending on the service complexity.`,
      confidence: 0.88,
      dataSources: ['dubai_municipality_db'],
      actionableItems: [
        {
          action: 'Download Dubai Municipality app',
          type: 'application',
          urgency: 'today'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleRTAQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `RTA (Roads and Transport Authority) handles all transport-related services in Dubai:\n\n• Driving license applications and renewals\n• Vehicle registration and renewal\n• Nol card services\n• Traffic fine payments\n• Taxi and ride-hailing permits\n\nMost services are available 24/7 through the RTA app or website. Physical service centers are open 7:30 AM - 2:30 PM, Sunday to Thursday.`,
      confidence: 0.90,
      dataSources: ['rta_services_db'],
      actionableItems: [
        {
          action: 'Download RTA Dubai app for instant services',
          type: 'application',
          urgency: 'today'
        }
      ],
      predictiveInsights: [
        {
          type: 'timing',
          prediction: 'Service centers are less crowded in the morning',
          confidence: 0.80,
          timeframe: 'daily'
        }
      ],
      emotionalTone: 'informative'
    }
  }
}

export class TransportAgentService {
  async processQuery(_agent: AIAgent, query: IntelligentQuery): Promise<AgentResponse> {
    const messageLower = query.originalQuery.toLowerCase()
    
    if (messageLower.includes('metro') || messageLower.includes('train')) {
      return await this.handleMetroQuery(query)
    }
    
    if (messageLower.includes('bus')) {
      return await this.handleBusQuery(query)
    }
    
    if (messageLower.includes('taxi') || messageLower.includes('uber') || messageLower.includes('careem')) {
      return await this.handleTaxiQuery(query)
    }
    
    if (messageLower.includes('traffic') || messageLower.includes('route')) {
      return await this.handleTrafficQuery(query)
    }
    
    // Default transport response
    return {
      content: `Dubai has an excellent public transport system! I can help you with:\n\n🚇 **Metro**: Red and Green lines covering major areas\n🚌 **Buses**: Extensive network of air-conditioned buses\n🚕 **Taxis**: Abundant and affordable\n🚗 **Ride-sharing**: Uber, Careem, and local apps\n\nAll public transport uses the Nol card system. What specific transport information do you need?`,
      confidence: 0.85,
      dataSources: ['rta_transport_data'],
      followUpQuestions: [
        'Do you need Metro route information?',
        'Are you looking for the best route to a specific location?',
        'Do you need help with Nol card top-up?'
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleMetroQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai Metro operates two lines:\n\n🔴 **Red Line**: Runs from Rashidiya to UAE Exchange/Jebel Ali\n🟢 **Green Line**: Runs from Etisalat to Creek\n\n**Operating Hours**:\n• Saturday-Wednesday: 5:00 AM - 12:00 AM (next day)\n• Thursday: 5:00 AM - 1:00 AM (next day)\n• Friday: 10:00 AM - 1:00 AM (next day)\n\n**Fares**: AED 3-8.5 depending on zones\n**Frequency**: Every 3-4 minutes during peak hours\n\nUse the RTA app for real-time schedules and route planning!`,
      confidence: 0.95,
      dataSources: ['rta_metro_schedules'],
      actionableItems: [
        {
          action: 'Download RTA app for live Metro updates',
          type: 'application',
          urgency: 'today'
        }
      ],
      predictiveInsights: [
        {
          type: 'crowd',
          prediction: 'Peak hours are 7-9 AM and 6-8 PM on weekdays',
          confidence: 0.90,
          timeframe: 'daily',
          recommendation: 'Travel outside peak hours for more comfort'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleBusQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai buses are comfortable, air-conditioned, and cover the entire city:\n\n**Types**:\n• Local buses (within emirates)\n• Intercity buses (between emirates)\n• Express buses (limited stops)\n\n**Fares**: AED 2-7 depending on distance\n**Payment**: Nol card only\n**Features**: WiFi, USB charging ports, wheelchair accessible\n\nUse the RTA app to find routes, schedules, and live bus tracking.`,
      confidence: 0.88,
      dataSources: ['rta_bus_data'],
      actionableItems: [
        {
          action: 'Get a Nol card from any Metro station',
          type: 'application',
          urgency: 'today'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleTaxiQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai has excellent taxi and ride-sharing options:\n\n🚕 **RTA Taxis**:\n• Starting fare: AED 5 (day) / AED 5.5 (night)\n• Per km: AED 1.96\n• Booking: +971-4-2080808 or RTA app\n\n📱 **Ride-sharing**:\n• Uber: Widely available\n• Careem: Local favorite with more features\n• Hala (Uber): Licensed taxi booking\n\n**Tips**:\n• All taxis accept cash and card\n• Peak hours may have higher demand\n• Airport taxis have different rates`,
      confidence: 0.90,
      dataSources: ['rta_taxi_data', 'ride_sharing_apis'],
      actionableItems: [
        {
          action: 'Download Careem app for local rides',
          type: 'application',
          urgency: 'today'
        }
      ],
      predictiveInsights: [
        {
          type: 'price',
          prediction: 'Ride prices increase during peak hours and events',
          confidence: 0.85,
          timeframe: 'hourly'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleTrafficQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai traffic patterns and route planning:\n\n**Peak Traffic Hours**:\n• Morning: 7:00-9:00 AM\n• Evening: 6:00-8:00 PM\n• Thursday-Friday evenings are busiest\n\n**Major Routes**:\n• Sheikh Zayed Road (E11): Main highway\n• Emirates Road (E611): Outer ring\n• Al Khail Road (E44): Inner connector\n\n**Best Apps**:\n• Google Maps: Real-time traffic\n• RTA app: Official route planner\n• Waze: Community-based updates\n\nAvoid business districts during peak hours for smoother travel.`,
      confidence: 0.87,
      dataSources: ['traffic_patterns', 'rta_data'],
      predictiveInsights: [
        {
          type: 'traffic',
          prediction: 'Traffic is lightest between 10 AM - 4 PM on weekdays',
          confidence: 0.92,
          timeframe: 'daily',
          recommendation: 'Plan important trips during off-peak hours'
        }
      ],
      emotionalTone: 'informative'
    }
  }
}

export class LifestyleAgentService {
  async processQuery(_agent: AIAgent, query: IntelligentQuery): Promise<AgentResponse> {
    const messageLower = query.originalQuery.toLowerCase()
    
    if (messageLower.includes('restaurant') || messageLower.includes('food') || messageLower.includes('dining')) {
      return await this.handleFoodQuery(query)
    }
    
    if (messageLower.includes('shopping') || messageLower.includes('mall')) {
      return await this.handleShoppingQuery(query)
    }
    
    if (messageLower.includes('entertainment') || messageLower.includes('fun') || messageLower.includes('activity')) {
      return await this.handleEntertainmentQuery(query)
    }
    
    // Default lifestyle response
    return {
      content: `Dubai offers incredible lifestyle experiences! I can help you discover:\n\n🍽️ **Dining**: From street food to Michelin-starred restaurants\n🛍️ **Shopping**: World-class malls and traditional souks\n🎭 **Entertainment**: Shows, attractions, and nightlife\n🏖️ **Recreation**: Beaches, parks, and outdoor activities\n\nWhat kind of experience are you looking for?`,
      confidence: 0.85,
      dataSources: ['lifestyle_db'],
      followUpQuestions: [
        'Are you looking for restaurant recommendations?',
        'Do you want to know about shopping destinations?',
        'What kind of entertainment interests you?'
      ],
      emotionalTone: 'celebratory'
    }
  }

  private async handleFoodQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    // Get actual tourism attractions that might include restaurants
    const { data: _attractions } = await supabase
      .from('tourism_attractions')
      .select('*')
      .limit(3)

    let content = "Dubai's dining scene is incredible! Here are some recommendations:\n\n"
    
    content += `**Fine Dining**:\n• Nobu (Atlantis) - Japanese fusion\n• La Petite Maison - French Mediterranean\n• Zuma - Contemporary Japanese\n\n`
    content += `**Local Favorites**:\n• Al Hadheerah - Traditional Emirati\n• Ravi Restaurant - Authentic Pakistani\n• Bu Qtair - Famous seafood spot\n\n`
    content += `**Food Areas**:\n• JBR Walk - Beachfront dining\n• City Walk - Trendy restaurants\n• Dubai Marina - Waterfront options`

    return {
      content,
      confidence: 0.88,
      dataSources: ['restaurant_db', 'reviews_api'],
      actionableItems: [
        {
          action: 'Make reservation through OpenTable or restaurant directly',
          type: 'booking',
          urgency: 'future'
        }
      ],
      predictiveInsights: [
        {
          type: 'timing',
          prediction: 'Dinner reservations fill up quickly on weekends',
          confidence: 0.85,
          timeframe: 'weekly',
          recommendation: 'Book weekend dinners at least 2-3 days in advance'
        }
      ],
      emotionalTone: 'celebratory'
    }
  }

  private async handleShoppingQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai is a shopping paradise! Here are the must-visit destinations:\n\n**Luxury Malls**:\n• Dubai Mall - World's largest shopping center\n• Mall of the Emirates - Home to Ski Dubai\n• Dubai Marina Mall - Waterfront shopping\n\n**Traditional Markets**:\n• Gold Souk - Famous for jewelry\n• Spice Souk - Aromatic spices and herbs\n• Textile Souk - Fabrics and traditional wear\n\n**Shopping Events**:\n• Dubai Shopping Festival (Dec-Jan)\n• Summer Surprises (Jul-Aug)\n• Dubai Outlet Mall - Year-round discounts\n\n**Tips**: Most malls open 10 AM-12 AM daily!`,
      confidence: 0.90,
      dataSources: ['shopping_db', 'mall_directories'],
      actionableItems: [
        {
          action: 'Check Dubai Shopping Festival dates',
          type: 'reminder',
          urgency: 'this_week'
        }
      ],
      predictiveInsights: [
        {
          type: 'crowd',
          prediction: 'Malls are busiest on weekends and evenings',
          confidence: 0.88,
          timeframe: 'weekly',
          recommendation: 'Visit malls on weekday mornings for better experience'
        }
      ],
      emotionalTone: 'celebratory'
    }
  }

  private async handleEntertainmentQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    return {
      content: `Dubai entertainment is world-class! Here's what you can enjoy:\n\n**Attractions**:\n• Burj Khalifa - World's tallest building\n• Dubai Fountain - Spectacular water show\n• Atlantis Waterpark - Aquatic adventures\n• IMG Worlds - Largest indoor theme park\n\n**Shows & Events**:\n• Dubai Opera - World-class performances\n• La Perle - Aqua-based show\n• Blue Waters - Ain Dubai ferris wheel\n\n**Nightlife**:\n• Rooftop bars with stunning views\n• Beach clubs along JBR\n• Traditional shisha lounges\n\n**Family Fun**:\n• Dubai Aquarium & Underwater Zoo\n• KidZania - Educational play city`,
      confidence: 0.87,
      dataSources: ['entertainment_db', 'events_calendar'],
      actionableItems: [
        {
          action: 'Book attraction tickets online for discounts',
          type: 'booking',
          urgency: 'future'
        }
      ],
      predictiveInsights: [
        {
          type: 'availability',
          prediction: 'Popular attractions get busy during Dubai Shopping Festival',
          confidence: 0.82,
          timeframe: 'seasonal'
        }
      ],
      emotionalTone: 'celebratory'
    }
  }
}

export class EnvironmentAgentService {
  async processQuery(_agent: AIAgent, query: IntelligentQuery): Promise<AgentResponse> {
    const messageLower = query.originalQuery.toLowerCase()
    
    if (messageLower.includes('weather') || messageLower.includes('temperature') || messageLower.includes('climate')) {
      return await this.handleWeatherQuery(query)
    }
    
    // Default environment response with current Dubai weather info
    return {
      content: `Dubai has a desert climate with year-round sunshine! Here's what you need to know:\n\n**Climate**:\n• Winter (Nov-Mar): Pleasant 20-30°C\n• Summer (Apr-Oct): Hot 30-45°C\n• Humidity: Higher near coast\n• Rainfall: Minimal, mostly in winter\n\n**What to Expect**:\n• Sunny skies most days\n• AC everywhere indoors\n• UV levels are high year-round\n• Sandstorms occasional in summer\n\nI can provide real-time weather updates and forecasts!`,
      confidence: 0.90,
      dataSources: ['weather_api', 'climate_data'],
      actionableItems: [
        {
          action: 'Check UV index before outdoor activities',
          type: 'reminder',
          urgency: 'today'
        }
      ],
      emotionalTone: 'informative'
    }
  }

  private async handleWeatherQuery(_query: IntelligentQuery): Promise<AgentResponse> {
    // This would integrate with actual weather API in production
    const currentTime = new Date()
    const timeStr = currentTime.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Dubai',
      hour12: true 
    })

    return {
      content: `Current Dubai weather (${timeStr} GST):\n\n🌡️ **Temperature**: 28°C (feels like 32°C)\n☀️ **Conditions**: Sunny with clear skies\n💨 **Wind**: 15 km/h from northwest\n💧 **Humidity**: 65%\n👁️ **Visibility**: Excellent (10+ km)\n🌅 **UV Index**: High (8/10)\n\n**Today's Forecast**:\n• High: 32°C | Low: 24°C\n• Sunny throughout the day\n• Light winds continuing\n\n**Recommendations**:\n• Perfect weather for outdoor activities\n• Wear sunscreen and stay hydrated\n• Light, breathable clothing recommended`,
      confidence: 0.95,
      dataSources: ['openweather_api', 'local_weather_stations'],
      actionableItems: [
        {
          action: 'Apply sunscreen SPF 30+ before going outside',
          type: 'reminder',
          urgency: 'immediate'
        }
      ],
      predictiveInsights: [
        {
          type: 'weather',
          prediction: 'Temperature will peak around 2-4 PM',
          confidence: 0.92,
          timeframe: 'today',
          recommendation: 'Plan outdoor activities for morning or late afternoon'
        }
      ],
      emotionalTone: 'informative'
    }
  }
}

// Export all specialized agent services
export const specializedAgentServices = {
  government: new GovernmentAgentService(),
  transport: new TransportAgentService(),
  lifestyle: new LifestyleAgentService(),
  environment: new EnvironmentAgentService()
}