// Core AI Agent System Types
export interface AIAgent {
  id: string
  name: string
  nameAr: string
  personality: AgentPersonality
  specialties: string[]
  capabilities: AgentCapability[]
  status: 'active' | 'learning' | 'offline'
  confidence: number // 0-1 confidence in responses
  lastUpdated: Date
  responsePatterns: ResponsePattern[]
  collaborationRules: CollaborationRule[]
}

export interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'authoritative' | 'helpful' | 'enthusiastic'
  culturalContext: 'local' | 'international' | 'business' | 'tourist'
  languages: string[]
  emoji: string
  greeting: string
  greetingAr: string
  signature: string
}

export interface AgentCapability {
  type: 'realtime_data' | 'predictive' | 'autonomous_action' | 'learning' | 'collaboration'
  description: string
  confidence: number
  dataSource?: string
  apiEndpoint?: string
  updateFrequency?: 'instant' | 'minute' | 'hourly' | 'daily'
}

export interface ResponsePattern {
  trigger: string[]
  action: 'direct_response' | 'collaborate' | 'escalate' | 'learn'
  collaborateWith?: string[]
  dataSources: string[]
  priority: 'urgent' | 'high' | 'normal' | 'low'
}

export interface CollaborationRule {
  scenario: string
  primaryAgent: string
  supportingAgents: string[]
  dataSharing: boolean
  responseFormat: 'unified' | 'multi_perspective' | 'escalated'
}

export interface AgentResponse {
  content: string
  contentAr?: string
  confidence: number
  dataSources: string[]
  collaboratingAgents?: string[]
  predictiveInsights?: PredictiveInsight[]
  actionableItems?: ActionableItem[]
  followUpQuestions?: string[]
  emotionalTone: 'informative' | 'reassuring' | 'urgent' | 'celebratory' | 'empathetic' | 'helpful' | 'enthusiastic'
}

export interface PredictiveInsight {
  type: 'timing' | 'crowd' | 'weather' | 'traffic' | 'availability' | 'price'
  prediction: string
  confidence: number
  timeframe: string
  recommendation?: string
}

export interface ActionableItem {
  action: string
  type: 'booking' | 'navigation' | 'application' | 'reminder' | 'contact'
  urgency: 'immediate' | 'today' | 'this_week' | 'future'
  autoExecute?: boolean
  userConfirmation?: boolean
}

export interface AgentMemory {
  userId: string
  interactions: AgentInteraction[]
  preferences: UserPreference[]
  patterns: UserPattern[]
  predictions: UserPrediction[]
}

export interface AgentInteraction {
  timestamp: Date
  query: string
  response: AgentResponse
  satisfaction?: number // 1-5 rating
  followUp?: boolean
}

export interface UserPreference {
  category: string
  value: string
  confidence: number
  source: 'explicit' | 'inferred' | 'behavioral'
  lastUpdated: Date
}

export interface UserPattern {
  type: 'temporal' | 'location' | 'activity' | 'social'
  pattern: string
  frequency: number
  confidence: number
}

export interface UserPrediction {
  type: 'need' | 'location' | 'timing' | 'preference'
  prediction: string
  confidence: number
  validUntil: Date
  triggers: string[]
}

// Specialized Agent Types
export interface GovernmentService {
  id: string
  name: string
  nameAr: string
  description: string
  processingTime: string
  fee: string
}

export interface GovernmentAgent extends AIAgent {
  departments: string[]
  services: GovernmentService[]
  processingCapabilities: string[]
  complianceLevel: 'basic' | 'advanced' | 'expert'
}

export interface TransportAgent extends AIAgent {
  transportModes: string[]
  rtaIntegration: boolean
  trafficPrediction: boolean
  routeOptimization: boolean
  realTimeUpdates: boolean
}

export interface BusinessAgent extends AIAgent {
  industries: string[]
  marketData: boolean
  regulatoryKnowledge: boolean
  networkingCapabilities: boolean
  opportunityDetection: boolean
}

export interface CultureAgent extends AIAgent {
  culturalKnowledge: string[]
  eventAwareness: boolean
  traditionExpertise: boolean
  languageSupport: string[]
  customsSensitivity: number
}

export interface LifestyleAgent extends AIAgent {
  categories: string[]
  personalPreferences: boolean
  socialIntegration: boolean
  recommendationEngine: boolean
  experienceOptimization: boolean
}

export interface EnvironmentAgent extends AIAgent {
  weatherPrediction: boolean
  airQualityMonitoring: boolean
  environmentalAlerts: boolean
  sustainabilityAdvice: boolean
  cityConditions: boolean
}

export interface SafetyAgent extends AIAgent {
  emergencyResponse: boolean
  securityAwareness: boolean
  healthAlerts: boolean
  evacuationProcedures: boolean
  crisisManagement: boolean
}

export interface DevelopmentAgent extends AIAgent {
  constructionProjects: boolean
  cityPlanning: boolean
  investmentOpportunities: boolean
  developmentTimelines: boolean
  impactAssessment: boolean
}

export interface GlobalAgent extends AIAgent {
  internationalServices: boolean
  expatSupport: boolean
  tourismExpertise: boolean
  visaServices: boolean
  culturalBridging: boolean
}

// AI Mayor Orchestrator Types
export interface AIMayor {
  id: 'ai_mayor'
  name: 'Dubai AI Mayor'
  nameAr: 'عمدة دبي الذكي'
  agents: AIAgent[]
  orchestrationRules: OrchestrationRule[]
  cityKnowledge: CityKnowledge
  decisionMaking: DecisionMakingCapability
  publicServices: PublicService[]
}

export interface OrchestrationRule {
  scenario: string
  priority: number
  agentAllocation: AgentAllocation[]
  responseStrategy: 'unanimous' | 'majority' | 'expert' | 'hierarchical'
  timeoutMs: number
}

export interface AgentAllocation {
  agentId: string
  role: 'primary' | 'supporting' | 'validator' | 'specialist'
  weight: number
}

export interface CityKnowledge {
  realTimeData: CityDataStream[]
  historicalPatterns: HistoricalPattern[]
  predictiveModels: PredictiveModel[]
  optimizationTargets: OptimizationTarget[]
}

export interface CityDataStream {
  source: string
  type: 'traffic' | 'weather' | 'events' | 'services' | 'safety' | 'business'
  frequency: string
  reliability: number
  lastUpdate: Date
}

export interface HistoricalPattern {
  category: string
  pattern: string
  seasonality: boolean
  accuracy: number
  predictivePower: number
}

export interface PredictiveModel {
  name: string
  category: string
  accuracy: number
  timeHorizon: string
  inputs: string[]
  outputs: string[]
}

export interface OptimizationTarget {
  metric: string
  currentValue: number
  targetValue: number
  strategies: string[]
  timeframe: string
}

export interface DecisionMakingCapability {
  consensusThreshold: number
  escalationRules: EscalationRule[]
  confidenceRequirement: number
  learningRate: number
}

export interface EscalationRule {
  condition: string
  action: 'human_oversight' | 'expert_agent' | 'collaborative_resolution'
  threshold: number
}

export interface PublicService {
  id: string
  name: string
  category: string
  automationLevel: 'manual' | 'assisted' | 'automated' | 'autonomous'
  responsibleAgent: string
  userSatisfaction: number
  processTime: number
  successRate: number
}

// Query Processing Types
export interface IntelligentQuery {
  originalQuery: string
  processedQuery: ProcessedQuery
  intentAnalysis: IntentAnalysis
  contextualFactors: ContextualFactor[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  complexity: 'simple' | 'moderate' | 'complex' | 'multi_domain'
}

export interface ProcessedQuery {
  cleanedQuery: string
  entities: Entity[]
  intents: Intent[]
  sentiment: Sentiment
  language: string
  translatedQuery?: string
}

export interface Entity {
  type: 'location' | 'time' | 'service' | 'person' | 'organization' | 'event'
  value: string
  confidence: number
  aliases: string[]
}

export interface Intent {
  type: string
  confidence: number
  parameters: Record<string, any>
  requiredAgents: string[]
}

export interface Sentiment {
  polarity: 'positive' | 'neutral' | 'negative'
  confidence: number
  urgency: number
  emotion?: 'happy' | 'frustrated' | 'curious' | 'worried' | 'excited'
}

export interface ContextualFactor {
  type: 'temporal' | 'spatial' | 'personal' | 'cultural' | 'situational'
  value: string
  impact: number
  source: string
}

export interface IntentAnalysis {
  primaryIntent: string
  secondaryIntents: string[]
  domainMapping: DomainMapping[]
  collaborationNeeded: boolean
  estimatedComplexity: number
}

export interface DomainMapping {
  domain: string
  relevance: number
  primaryAgent: string
  supportingAgents: string[]
}