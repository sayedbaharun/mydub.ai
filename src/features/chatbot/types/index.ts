export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  persona?: AIPersona
  attachments?: MessageAttachment[]
  metadata?: {
    tokens?: number
    model?: string
    language?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
  }
}

export interface MessageAttachment {
  id: string
  type: 'image' | 'document' | 'location'
  url?: string
  name?: string
  data?: any
}

export interface AIPersona {
  id: string
  name: string
  nameAr: string
  avatar: string
  description: string
  descriptionAr: string
  specialties: string[]
  greeting: string
  greetingAr: string
  systemPrompt: string
  temperature: number
  maxTokens: number
}

export interface ChatSession {
  id: string
  userId: string
  personaId: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  metadata?: {
    totalTokens?: number
    language?: string
    topic?: string
  }
}

export interface QuickAction {
  id: string
  label: string
  labelAr: string
  icon: string
  action: string
  category: 'general' | 'government' | 'tourism' | 'emergency' | 'business'
}

export interface ChatContext {
  location?: {
    lat: number
    lng: number
    address?: string
  }
  userPreferences?: {
    language: string
    interests: string[]
    nationality?: string
  }
  currentPage?: string
  previousQueries?: string[]
}

export interface AIResponse {
  content: string
  suggestions?: string[]
  relatedLinks?: {
    title: string
    url: string
    type: 'internal' | 'external'
  }[]
  quickActions?: QuickAction[]
  requiresAuth?: boolean
  error?: string
}

export interface ChatSettings {
  autoSave: boolean
  soundEnabled: boolean
  showTypingIndicator: boolean
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  sendOnEnter: boolean
}