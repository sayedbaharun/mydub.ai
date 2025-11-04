/**
 * OpenRouter AI Service
 * Unified API for multiple AI models: GPT-4, Claude 3, Gemini Pro
 * Provides cost-effective AI content generation with fallback routing
 */

export interface GeneratedArticle {
  title: string
  summary: string
  content: string
  tags: string[]
  readability_score?: number
  originality_score?: number
  factual_accuracy_score?: number
}

export interface GenerationOptions {
  topic: string
  category: string
  wordCount?: number
  tone?: 'professional' | 'casual' | 'formal' | 'friendly'
  model?: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro'
}

const MODEL_CONFIG = {
  'gpt-4-turbo': {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    costPer1kTokens: 0.01, // ~$0.001/word
    speed: 'medium',
    quality: 'highest'
  },
  'claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    costPer1kTokens: 0.015, // ~$0.0015/word
    speed: 'medium',
    quality: 'high'
  },
  'gemini-pro': {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    costPer1kTokens: 0.0005, // ~$0.0005/word
    speed: 'fast',
    quality: 'good'
  }
}

export class OpenRouterService {
  private supabaseUrl: string
  private supabaseAnonKey: string
  private defaultModel: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro' = 'gpt-4-turbo'

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabaseUrl = supabaseUrl
    this.supabaseAnonKey = supabaseAnonKey

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️  Supabase configuration incomplete')
    }
  }

  /**
   * Generate an article using the specified or default model
   * Calls Supabase Edge Function which safely calls OpenRouter
   */
  async generateArticle(options: GenerationOptions): Promise<GeneratedArticle> {
    const model = options.model || this.defaultModel
    const wordCount = options.wordCount || 800

    const modelConfig = MODEL_CONFIG[model]
    console.log(`🤖 Generating article with ${modelConfig.name}...`)

    try {
      // Call Supabase Edge Function instead of calling OpenRouter directly
      // This avoids CORS/CSP issues and keeps API key secure
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/generate-article`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseAnonKey}`
          },
          body: JSON.stringify({
            topic: options.topic,
            category: options.category,
            wordCount,
            tone: options.tone || 'professional',
            model
          })
        }
      )

      if (!response.ok) {
        let errorMessage = response.statusText

        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          // Could not parse error response
        }

        if (response.status === 401) {
          throw new Error('Invalid or missing API key')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Try again in a moment.')
        } else {
          throw new Error(`API error: ${errorMessage}`)
        }
      }

      const data = await response.json()

      if (!data.article) {
        throw new Error('Invalid response from generation service')
      }

      const articleData = data.article

      // Validate response
      if (!articleData.title || !articleData.summary || !articleData.content) {
        throw new Error('Generated article missing required fields')
      }

      console.log(`✅ Article generated successfully with ${modelConfig.name}`)

      return {
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        tags: articleData.tags || [],
        readability_score: articleData.readability_score || 75,
        originality_score: articleData.originality_score || 85,
        factual_accuracy_score: articleData.factual_accuracy_score || 80
      }
    } catch (error) {
      console.error(`❌ Generation failed with ${modelConfig.name}:`, error)
      throw error
    }
  }

  /**
   * Generate multiple articles
   */
  async generateArticles(
    count: number,
    options: Omit<GenerationOptions, 'model'>,
    modelSequence?: Array<'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro'>
  ): Promise<GeneratedArticle[]> {
    const articles: GeneratedArticle[] = []
    const models = modelSequence || ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro']

    for (let i = 0; i < count; i++) {
      // Rotate through models
      const model = models[i % models.length]

      try {
        const article = await this.generateArticle({
          ...options,
          model
        })
        articles.push(article)

        // Add small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Failed to generate article ${i + 1}/${count}:`, error)
        // Continue with next article
      }
    }

    return articles
  }

  /**
   * Get available models and their pricing
   */
  async getModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get models:', error)
      return null
    }
  }

  /**
   * Get API usage and balance information
   */
  async getUsage() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch usage')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get usage:', error)
      return null
    }
  }

  /**
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const usage = await this.getUsage()
      return !!usage?.data
    } catch {
      return false
    }
  }

  /**
   * Get model configuration
   */
  getModelConfig(model: string) {
    return MODEL_CONFIG[model as keyof typeof MODEL_CONFIG]
  }

  /**
   * Set default model for generation
   */
  setDefaultModel(model: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro') {
    if (MODEL_CONFIG[model]) {
      this.defaultModel = model
      console.log(`📝 Default AI model set to: ${MODEL_CONFIG[model].name}`)
    }
  }

  /**
   * Estimate cost for generating articles
   */
  estimateCost(articleCount: number, avgWordCount: number = 800): {
    perArticle: number
    total: number
    model: string
  } {
    const tokensPerWord = 1.3
    const totalTokens = articleCount * avgWordCount * tokensPerWord
    const config = MODEL_CONFIG[this.defaultModel]

    const costPerArticle = (avgWordCount * tokensPerWord * config.costPer1kTokens) / 1000
    const totalCost = costPerArticle * articleCount

    return {
      model: config.name,
      perArticle: parseFloat(costPerArticle.toFixed(4)),
      total: parseFloat(totalCost.toFixed(2))
    }
  }
}

// Initialize service with Supabase configuration
// Note: OpenRouter API key is kept secure on the backend (Edge Function)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const openRouterService = new OpenRouterService(supabaseUrl, supabaseAnonKey)
