import { supabase } from '@/shared/lib/supabase'
import { getPreferredAIService, callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'
import { ChatMessage, ChatSession, AIPersona, QuickAction } from '../types'
import { getPersonaById } from '../data/personas'
import { AIMayorService } from '@/features/ai-agents/services/ai-mayor.service'

// AI provider using OpenRouter directly for faster responses
const aiProvider = async (
  messages: ChatMessage[],
  persona: AIPersona,
  language: string,
  userId?: string
): Promise<string> => {
  const aiService = getPreferredAIService()
  const lastMessage = messages[messages.length - 1]
  
  // Check if query should be handled by AI Mayor (complex or multi-domain queries)
  const shouldUseAIMayor = shouldQueryUseAIMayor(lastMessage.content)
  
  if (shouldUseAIMayor) {
    try {
      const aiMayor = AIMayorService.getInstance()
      const response = await aiMayor.processSimpleQuery(lastMessage.content, userId)
      return response
    } catch (error) {
      console.error('AI Mayor error, falling back to standard processing:', error)
      // Continue with standard processing if AI Mayor fails
    }
  }
  
  // Build enhanced system prompt with Dubai-specific context
  const systemPrompt = `You are ${persona.name}, ${persona.description}.
    Your specialties: ${persona.specialties.join(', ')}.
    You are an expert on Dubai, UAE, providing accurate, helpful, and culturally aware information.
    
    Respond in ${language} language.
    Keep responses helpful, concise, and relevant to Dubai/UAE.
    
    Key Guidelines:
    - Always provide current, factual information about Dubai
    - Include practical details like locations, timings, costs when relevant
    - Be culturally sensitive and respectful of local customs
    - Suggest alternatives when specific services might not be available
    - Use metric units (°C, km, etc.) as standard in UAE
    
    Current conversation context: ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}`

  // Determine if we need contextual data based on the message content
  const context = analyzeMessageForContext(lastMessage.content)

  try {
    // Use OpenRouter directly for faster responses
    if (aiService === 'openrouter') {
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ]
      
      // Choose model based on query type
      const taskType = determineTaskType(lastMessage.content)
      const model = getModelForTask(taskType)
      
      const response = await callOpenRouter(chatMessages, model)
      return response
    } else {
      // Fallback to Edge Function for legacy providers
      const response = await callAIEdgeFunction(lastMessage.content, systemPrompt, aiService || 'anthropic', context)
      return response
    }
  } catch (error) {
    console.error('AI service error:', error)
    // Fallback to mock response on error - never throw, always provide a response
    return mockResponse(lastMessage.content, persona, language)
  }
}

// Determine if a query should use AI Mayor multi-agent orchestration
const shouldQueryUseAIMayor = (message: string): boolean => {
  const messageLower = message.toLowerCase()
  
  // Multi-domain queries
  const domains = ['weather', 'transport', 'business', 'culture', 'lifestyle', 'government']
  const domainMatches = domains.filter(domain => messageLower.includes(domain))
  
  if (domainMatches.length > 1) {
    return true
  }
  
  // Complex queries that might benefit from multiple agents
  const complexTriggers = [
    'plan my day', 'best way to', 'how do i', 'what should i',
    'comprehensive', 'everything about', 'all options',
    'compare', 'recommend', 'suggest', 'help me choose'
  ]
  
  if (complexTriggers.some(trigger => messageLower.includes(trigger))) {
    return true
  }
  
  // Business-related queries that need government + business agents
  const businessGovernmentTriggers = [
    'start a business', 'company formation', 'business license',
    'trade license', 'business setup', 'incorporate'
  ]
  
  if (businessGovernmentTriggers.some(trigger => messageLower.includes(trigger))) {
    return true
  }
  
  return false
}

// Analyze message content to determine what contextual data to include
const analyzeMessageForContext = (message: string) => {
  const messageLower = message.toLowerCase()
  const context: any = {}

  // Check if weather information is needed
  if (messageLower.includes('weather') || messageLower.includes('temperature') || 
      messageLower.includes('hot') || messageLower.includes('rain') || 
      messageLower.includes('sunny') || messageLower.includes('climate')) {
    context.includeWeather = true
    context.location = 'Dubai, AE'
  }

  // Check if news information is needed
  if (messageLower.includes('news') || messageLower.includes('latest') || 
      messageLower.includes('recent') || messageLower.includes('happening') ||
      messageLower.includes('current') || messageLower.includes('today')) {
    context.includeNews = true
  }

  // Check if web search is needed for current events
  if (messageLower.includes('current') || messageLower.includes('now') || 
      messageLower.includes('today') || messageLower.includes('this week') ||
      messageLower.includes('schedule') || messageLower.includes('open') ||
      messageLower.includes('available')) {
    context.includeSearch = true
    context.searchQuery = `Dubai ${message}`
  }

  return Object.keys(context).length > 0 ? context : undefined
}

// Call AI service via Supabase Edge Function
async function callAIEdgeFunction(
  message: string, 
  systemPrompt: string, 
  provider: 'anthropic' | 'openai' | 'google',
  context?: any
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return mockResponse(message, { name: 'AI Assistant', greeting: 'Hello!' } as any, 'en')
  }

  const response = await supabase.functions.invoke('ai-chat', {
    body: {
      message,
      systemPrompt,
      provider,
      context
    }
  })

  // Enhanced error logging for debugging
  if (response.error) {
    console.error('Edge Function Error Details:', {
      error: response.error,
      context: response.error.context,
      message: response.error.message,
      details: response.error.details
    })
    
    // If the error response includes a fallback, use it
    if (response.error.fallback) {
      return response.error.fallback
    }
    
    // Return a helpful mock response instead of throwing
    return mockResponse(message, { name: 'AI Assistant', greeting: 'Hello!' } as any, 'en')
  }

  if (response.data?.response) {
    return response.data.response
  }

  return 'I apologize, but I encountered an issue processing your request. Please try again.'
}

// Mock response fallback
function mockResponse(query: string, persona: AIPersona, language: string): string {
  const q = query.toLowerCase()
  
  if (q.includes('hello') || q.includes('hi')) {
    return language === 'ar' ? persona.greetingAr : persona.greeting
  }
  
  if (q.includes('weather')) {
    return language === 'ar'
      ? 'الطقس في دبي اليوم مشمس مع درجة حرارة 28°م. مثالي للأنشطة الخارجية!'
      : "Today's weather in Dubai is sunny with a temperature of 28°C. Perfect for outdoor activities!"
  }
  
  if (q.includes('restaurant') || q.includes('food')) {
    return language === 'ar'
      ? 'أنصحك بزيارة مطعم الصفدي للمأكولات اللبنانية الأصيلة في جميرا.'
      : 'I recommend Al Safadi Restaurant in Jumeirah for authentic Lebanese cuisine.'
  }
  
  return language === 'ar'
    ? 'شكراً لسؤالك. كيف يمكنني مساعدتك أكثر في استكشاف دبي؟'
    : 'Thank you for your question. How else can I help you explore Dubai?'
}

// Determine task type for optimal model selection
const determineTaskType = (message: string): 'chat' | 'analysis' | 'creative' | 'coding' | 'vision' => {
  const messageLower = message.toLowerCase()
  
  if (messageLower.includes('analyze') || messageLower.includes('compare') || messageLower.includes('research')) {
    return 'analysis'
  }
  
  if (messageLower.includes('write') || messageLower.includes('create') || messageLower.includes('design')) {
    return 'creative'
  }
  
  if (messageLower.includes('code') || messageLower.includes('script') || messageLower.includes('api')) {
    return 'coding'
  }
  
  if (messageLower.includes('image') || messageLower.includes('photo') || messageLower.includes('picture')) {
    return 'vision'
  }
  
  return 'chat' // Default for general conversation
}

export const chatService = {
  // Create a new chat session
  async createSession(userId: string, personaId: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        persona_id: personaId,
        title: 'New Chat',
        title_ar: 'محادثة جديدة',
        metadata: {}
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user's chat sessions
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error) throw error
    return data
  },

  // Update session title
  async updateSessionTitle(sessionId: string, title: string, titleAr: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, title_ar: titleAr })
      .eq('id', sessionId)
    
    if (error) throw error
  },

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
    
    if (error) throw error
  },

  // Get messages for a session
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Send a message and get AI response
  async sendMessage(
    sessionId: string,
    content: string,
    personaId: string,
    language: string = 'en'
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    // Save user message
    const { data: userMessage, error: userError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content,
        metadata: {}
      })
      .select()
      .single()
    
    if (userError) throw userError

    // Get session messages for context
    const messages = await this.getSessionMessages(sessionId)
    
    // Get persona
    const persona = getPersonaById(personaId)
    if (!persona) throw new Error('Persona not found')

    // Get current user ID for AI Mayor interaction tracking
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    
    // Get AI response
    const aiResponse = await aiProvider(messages, persona, language, userId)

    // Save AI message
    const { data: aiMessage, error: aiError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        metadata: { persona_id: personaId }
      })
      .select()
      .single()
    
    if (aiError) throw aiError

    // Update session updated_at
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { userMessage, aiMessage }
  },

  // Get quick actions based on context
  getQuickActions(personaId: string, language: string = 'en'): QuickAction[] {
    const commonActions: QuickAction[] = [
      {
        id: 'weather',
        label: language === 'ar' ? 'الطقس اليوم' : "Today's Weather",
        icon: '☀️',
        action: language === 'ar' ? 'ما هو الطقس اليوم في دبي؟' : "What's the weather like in Dubai today?",
        labelAr: 'الطقس اليوم',
        category: 'general' as const
      },
      {
        id: 'attractions',
        label: language === 'ar' ? 'أماكن سياحية' : 'Tourist Attractions',
        icon: '🏛️',
        action: language === 'ar' ? 'ما هي أفضل الأماكن السياحية في دبي؟' : 'What are the best tourist attractions in Dubai?',
        labelAr: 'أماكن سياحية',
        category: 'tourism' as const
      },
      {
        id: 'transport',
        label: language === 'ar' ? 'المواصلات' : 'Transportation',
        icon: '🚇',
        action: language === 'ar' ? 'كيف يمكنني التنقل في دبي؟' : 'How can I get around Dubai?',
        labelAr: 'المواصلات',
        category: 'general' as const
      }
    ]

    // Add persona-specific actions
    switch (personaId) {
      case 'culture-expert':
        return [
          {
            id: 'etiquette',
            label: language === 'ar' ? 'الآداب المحلية' : 'Local Etiquette',
            icon: '🤝',
            action: language === 'ar' ? 'ما هي الآداب المحلية التي يجب معرفتها؟' : 'What local etiquette should I know?',
            labelAr: 'الآداب المحلية',
            category: 'general' as const
          },
          {
            id: 'traditions',
            label: language === 'ar' ? 'التقاليد' : 'Traditions',
            icon: '🕌',
            action: language === 'ar' ? 'أخبرني عن التقاليد الإماراتية' : 'Tell me about Emirati traditions',
            labelAr: 'التقاليد',
            category: 'general' as const
          },
          ...commonActions
        ]
      
      case 'business-advisor':
        return [
          {
            id: 'business-setup',
            label: language === 'ar' ? 'تأسيس الأعمال' : 'Business Setup',
            icon: '🏢',
            action: language === 'ar' ? 'كيف أؤسس شركة في دبي؟' : 'How do I set up a business in Dubai?',
            labelAr: 'تأسيس الأعمال',
            category: 'business' as const
          },
          {
            id: 'free-zones',
            label: language === 'ar' ? 'المناطق الحرة' : 'Free Zones',
            icon: '🏭',
            action: language === 'ar' ? 'ما هي المناطق الحرة في دبي؟' : 'What are the free zones in Dubai?',
            labelAr: 'المناطق الحرة',
            category: 'business' as const
          },
          {
            id: 'visa',
            label: language === 'ar' ? 'التأشيرات' : 'Visas',
            icon: '📄',
            action: language === 'ar' ? 'ما هي متطلبات التأشيرة للأعمال؟' : 'What are the business visa requirements?',
            labelAr: 'التأشيرات',
            category: 'business' as const
          }
        ]
      
      case 'tourist-buddy':
        return [
          {
            id: 'restaurants',
            label: language === 'ar' ? 'المطاعم' : 'Restaurants',
            icon: '🍽️',
            action: language === 'ar' ? 'أين أجد أفضل المطاعم؟' : 'Where can I find the best restaurants?',
            labelAr: 'المطاعم',
            category: 'tourism' as const
          },
          {
            id: 'shopping',
            label: language === 'ar' ? 'التسوق' : 'Shopping',
            icon: '🛍️',
            action: language === 'ar' ? 'أين أفضل أماكن التسوق؟' : 'Where are the best shopping places?',
            labelAr: 'التسوق',
            category: 'tourism' as const
          },
          {
            id: 'entertainment',
            label: language === 'ar' ? 'الترفيه' : 'Entertainment',
            icon: '🎭',
            action: language === 'ar' ? 'ما هي أفضل الأنشطة الترفيهية؟' : 'What are the best entertainment activities?',
            labelAr: 'الترفيه',
            category: 'tourism' as const
          }
        ]
      
      default:
        return commonActions
    }
  },

  // Clear session messages
  async clearSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
    
    if (error) throw error
  },

  // Export chat history
  async exportChatHistory(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId)
    const messages = await this.getSessionMessages(sessionId)
    
    if (!session) throw new Error('Session not found')
    
    const persona = getPersonaById(session.personaId)
    const personaName = persona?.name || 'AI Assistant'
    
    let export_text = `Chat with ${personaName}\n`
    export_text += `Date: ${new Date(session.createdAt).toLocaleString()}\n`
    export_text += `${'-'.repeat(50)}\n\n`
    
    messages.forEach(msg => {
      const role = msg.role === 'user' ? 'You' : personaName
      const time = new Date(msg.timestamp).toLocaleTimeString()
      export_text += `[${time}] ${role}: ${msg.content}\n\n`
    })
    
    return export_text
  }
}