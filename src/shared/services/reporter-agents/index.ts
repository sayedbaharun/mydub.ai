// Export all reporter agents and related utilities

export { BaseReporterAgent } from './BaseReporterAgent'
export { NewsReporterAgent } from './NewsReporterAgent'
export { LifestyleReporterAgent } from './LifestyleReporterAgent'
export { BusinessReporterAgent } from './BusinessReporterAgent'
export { TourismReporterAgent } from './TourismReporterAgent'
export { WeatherTrafficReporterAgent } from './WeatherTrafficReporterAgent'

export { ContentAnalyzer } from '@/shared/services/reporter-agents/utils/contentAnalyzer'

export * from '@/shared/services/reporter-agents/types/reporter.types'

// Factory function to get reporter agent by specialty
import { ReporterSpecialty } from '@/shared/services/reporter-agents/types/reporter.types'
import { NewsReporterAgent } from './NewsReporterAgent'
import { LifestyleReporterAgent } from './LifestyleReporterAgent'
import { BusinessReporterAgent } from './BusinessReporterAgent'
import { TourismReporterAgent } from './TourismReporterAgent'
import { WeatherTrafficReporterAgent } from './WeatherTrafficReporterAgent'

export function getReporterAgent(specialty: ReporterSpecialty) {
  switch (specialty) {
    case ReporterSpecialty.NEWS:
      return NewsReporterAgent.getInstance()
    case ReporterSpecialty.LIFESTYLE:
      return LifestyleReporterAgent.getInstance()
    case ReporterSpecialty.BUSINESS:
      return BusinessReporterAgent.getInstance()
    case ReporterSpecialty.TOURISM:
      return TourismReporterAgent.getInstance()
    case ReporterSpecialty.WEATHER_TRAFFIC:
      return WeatherTrafficReporterAgent.getInstance()
    default:
      throw new Error(`Unknown reporter specialty: ${specialty}`)
  }
}

// Get all reporter agents
export function getAllReporterAgents() {
  return [
    NewsReporterAgent.getInstance(),
    LifestyleReporterAgent.getInstance(),
    BusinessReporterAgent.getInstance(),
    TourismReporterAgent.getInstance(),
    WeatherTrafficReporterAgent.getInstance()
  ]
}