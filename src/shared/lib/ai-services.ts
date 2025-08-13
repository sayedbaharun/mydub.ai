// AI Service Configuration with OpenRouter
// OpenRouter provides access to multiple AI models through a single API
export const AI_CONFIG = {
  openrouter: {
    // API key no longer needed client-side - handled by Edge Function
    baseUrl: '/api/proxy/openrouter',
    models: {
      // GPT Models
      'gpt-4-turbo': 'openai/gpt-4-turbo',
      'gpt-4': 'openai/gpt-4',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      
      // Fine-tuned GPT Model for Ayyan X
      'mydub-ft-gpt': 'ft:gpt-4.1-2025-04-14:personal:basic-training:BlBWGGHF',
      
      // Claude Models  
      'claude-3-opus': 'anthropic/claude-3-opus',
      'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
      'claude-3-sonnet': 'anthropic/claude-3-sonnet',
      'claude-3-haiku': 'anthropic/claude-3-haiku',
      
      // Google Models
      'gemini-pro': 'google/gemini-pro',
      'gemini-pro-vision': 'google/gemini-pro-vision',
      
      // Open Source Models
      'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
      'mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
      
      // Specialized Models
      'gpt-4-vision': 'openai/gpt-4-vision-preview',
    },
    defaultModel: 'ft:gpt-4.1-2025-04-14:personal:basic-training:BlBWGGHF', // Fine-tuned Ayyan X
    temperature: 0.7,
  },
  
  // Fallback to legacy individual providers if needed
  legacy: {
    openai: {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
    },
    anthropic: {
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
    },
    google: {
      model: 'gemini-pro',
      temperature: 0.7,
    },
  }
}

// Model selection based on task type
export const getModelForTask = (taskType: 'chat' | 'analysis' | 'creative' | 'coding' | 'vision' = 'chat'): string => {
  const models = AI_CONFIG.openrouter.models
  
  switch (taskType) {
    case 'analysis':
      return models['claude-3-opus']       // Best for complex analysis
    case 'creative':
      return models['gpt-4-turbo']         // Best for creative tasks
    case 'coding':
      return models['claude-3.5-sonnet']   // Best for code generation
    case 'vision':
      return models['gpt-4-vision']        // Best for image analysis
    case 'chat':
    default:
      return models['mydub-ft-gpt']        // Fine-tuned Ayyan X
  }
}

// Helper function to check if OpenRouter is configured
export const isAIConfigured = (): boolean => {
  // Always return true since Edge Function handles API key
  return true
}

// Get the preferred AI service - now defaults to OpenRouter
export const getPreferredAIService = (): 'openrouter' | 'anthropic' | 'openai' | 'google' => {
  // Always use OpenRouter since Edge Function handles it
  return 'openrouter'
}

// OpenRouter API call helper
export const callOpenRouter = async (
  messages: any[],
  model?: string,
  temperature?: number
): Promise<string> => {
  const selectedModel = model || AI_CONFIG.openrouter.defaultModel
  
  try {
    // Use Vercel Function for secure API access
    const apiUrl = import.meta.env.PROD 
      ? '/api/openrouter' 
      : 'http://localhost:3000/api/openrouter'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if user is authenticated
        ...(localStorage.getItem('auth-token') && {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        })
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: temperature || AI_CONFIG.openrouter.temperature,
        max_tokens: 1000,
        stream: false
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      if (response.status === 429) {
        throw new Error('You have reached your usage limit. Please try again later.')
      }
      if (response.status === 402) {
        throw new Error('You have exceeded your daily spending limit. Please upgrade your plan.')
      }
      throw new Error(error.error || `API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content
    }
    
    throw new Error('Invalid response format from AI service')
    
  } catch (error) {
    console.error('AI service call failed:', error)
    throw error
  }
}