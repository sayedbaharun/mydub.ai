// Reporter Agent Types for AI Reporter System

export interface ReporterAgentConfig {
  id: string
  name: string
  description: string
  specialty: ReporterSpecialty
  writingStyle: WritingStyle
  priorities: string[]
  sources: DataSource[]
  scheduleConfig: ScheduleConfig
  learningEnabled: boolean
  maxContentPerRun: number
}

export enum ReporterSpecialty {
  NEWS = 'news',
  LIFESTYLE = 'lifestyle',
  BUSINESS = 'business',
  TOURISM = 'tourism',
  WEATHER_TRAFFIC = 'weather_traffic'
}

export interface WritingStyle {
  tone: string[]
  voice: 'first-person' | 'third-person' | 'neutral'
  complexity: 'simple' | 'moderate' | 'complex'
  targetAudience: string[]
  customPrompts?: string[]
}

export interface DataSource {
  type: 'rss' | 'api' | 'scraper' | 'social' | 'government'
  name: string
  url?: string
  apiKey?: string
  refreshInterval: number // in minutes
  priority: 'high' | 'medium' | 'low'
  filters?: SourceFilter[]
}

export interface SourceFilter {
  field: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex'
  value: string | RegExp
}

export interface ScheduleConfig {
  frequency: 'continuous' | 'hourly' | 'daily' | 'weekly'
  times?: string[] // For specific times, e.g., ['09:00', '17:00']
  daysOfWeek?: number[] // 0-6, Sunday to Saturday
  timezone: string
  priority: 'real-time' | 'high' | 'normal' | 'low'
}

export interface ContentItem {
  id: string
  agentId: string
  title: string
  content: string
  summary: string
  category: string
  tags: string[]
  source: DataSource
  relevanceScore: number
  priorityScore: number
  publishedAt: Date
  fetchedAt: Date
  metadata: ContentMetadata
  status: ContentStatus
}

export interface ContentMetadata {
  originalUrl?: string
  author?: string
  imageUrls?: string[]
  location?: LocationData
  sentiment?: SentimentAnalysis
  entities?: ExtractedEntity[]
  customData?: Record<string, any>
}

export interface LocationData {
  name: string
  coordinates?: {
    lat: number
    lng: number
  }
  area?: string
  emirate?: string
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  magnitude: number // 0 to 1
  label: 'positive' | 'negative' | 'neutral' | 'mixed'
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'event' | 'product' | 'other'
  name: string
  relevance: number
  metadata?: Record<string, any>
}

export enum ContentStatus {
  FETCHED = 'fetched',
  ANALYZING = 'analyzing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface ReporterPerformance {
  agentId: string
  totalContentFetched: number
  totalContentPublished: number
  averageRelevanceScore: number
  averagePriorityScore: number
  topPerformingCategories: string[]
  feedbackScore: number
  lastRunTime: Date
  nextScheduledRun: Date
  errors: ReporterError[]
}

export interface ReporterError {
  timestamp: Date
  source: string
  message: string
  stack?: string
  resolved: boolean
}

export interface ContentAnalysis {
  relevanceScore: number
  priorityScore: number
  qualityScore: number
  reasons: string[]
  suggestions: string[]
  requiredEdits?: ContentEdit[]
}

export interface ContentEdit {
  type: 'grammar' | 'style' | 'fact-check' | 'localization' | 'compliance'
  description: string
  originalText?: string
  suggestedText?: string
  confidence: number
}

export interface ReporterFeedback {
  contentId: string
  agentId: string
  feedbackType: 'user' | 'editor' | 'automated'
  rating: number // 1-5
  comments?: string
  improvements?: string[]
  timestamp: Date
}

export interface AgentLearningData {
  agentId: string
  successfulPatterns: Pattern[]
  failedPatterns: Pattern[]
  preferredSources: string[]
  optimalSchedule: ScheduleConfig
  contentPreferences: ContentPreferences
}

export interface Pattern {
  type: string
  frequency: number
  successRate: number
  examples: string[]
}

export interface ContentPreferences {
  preferredLength: {
    min: number
    max: number
    optimal: number
  }
  topKeywords: string[]
  avoidKeywords: string[]
  bestPerformingTopics: string[]
  audienceEngagementFactors: string[]
}

export interface ReporterAgentInterface {
  config: ReporterAgentConfig
  
  // Core methods
  initialize(): Promise<void>
  fetchContent(): Promise<ContentItem[]>
  analyzeContent(content: ContentItem): Promise<ContentAnalysis>
  generateArticle(content: ContentItem): Promise<string>
  calculateRelevance(content: ContentItem): Promise<number>
  calculatePriority(content: ContentItem): Promise<number>
  
  // Learning methods
  learnFromFeedback(feedback: ReporterFeedback): Promise<void>
  updatePreferences(data: AgentLearningData): Promise<void>
  
  // Performance methods
  getPerformanceMetrics(): Promise<ReporterPerformance>
  optimizeSchedule(): Promise<ScheduleConfig>
  
  // Utility methods
  validateContent(content: ContentItem): Promise<boolean>
  shouldPublish(analysis: ContentAnalysis): boolean
  formatForPublication(content: string): string
}

// Shared constants
export const RELEVANCE_THRESHOLD = 0.7
export const PRIORITY_THRESHOLD = 0.6
export const QUALITY_THRESHOLD = 0.8

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  frequency: 'hourly',
  timezone: 'Asia/Dubai',
  priority: 'normal'
}

export const DUBAI_KEYWORDS = [
  'dubai', 'uae', 'emirates', 'dxb', 'burj', 'khalifa', 'mall', 
  'expo', 'dhcc', 'difc', 'jbr', 'marina', 'jumeirah', 'deira',
  'bur dubai', 'downtown', 'business bay', 'dubai creek', 'palm',
  'rashid', 'maktoum', 'mohammed', 'hamdan', 'sheikh'
]