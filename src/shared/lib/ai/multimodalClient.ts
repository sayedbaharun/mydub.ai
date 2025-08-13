/**
 * Multi-Modal AI Client for MyDub.AI
 * Supports text, image, voice, and document analysis
 */

import OpenAI from 'openai';

export interface MultiModalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image' | 'audio' | 'document';
    text?: string;
    image?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
    audio?: {
      url: string;
      transcript?: string;
    };
    document?: {
      url: string;
      type: string;
      content?: string;
    };
  }>;
  timestamp: Date;
  metadata?: {
    location?: { lat: number; lng: number };
    language?: string;
    context?: string;
  };
}

export interface VisionAnalysisResult {
  description: string;
  objects: Array<{
    name: string;
    confidence: number;
    bbox?: { x: number; y: number; width: number; height: number };
  }>;
  text?: string; // OCR results
  landmarks?: Array<{
    name: string;
    confidence: number;
    location?: string;
  }>;
  context: {
    isDubai: boolean;
    category: string;
    relevantServices?: string[];
  };
}

export interface AudioAnalysisResult {
  transcript: string;
  language: string;
  confidence: number;
  intent?: {
    category: string;
    action: string;
    entities: Array<{ type: string; value: string }>;
  };
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
}

class MultiModalAIClient {
  private openai: OpenAI;
  private anthropic: any; // Anthropic client
  private gemini: any; // Google Gemini client

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    // Initialize other AI clients
    this.initializeClients();
  }

  private async initializeClients() {
    // Anthropic Claude for advanced reasoning
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
      });
    }

    // Google Gemini for multimodal capabilities
    if (import.meta.env.VITE_GOOGLE_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      this.gemini = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
    }
  }

  /**
   * Analyze image with vision AI
   */
  async analyzeImage(
    imageUrl: string,
    prompt?: string,
    options?: {
      detectLandmarks?: boolean;
      extractText?: boolean;
      identifyObjects?: boolean;
      dubaiContext?: boolean;
    }
  ): Promise<VisionAnalysisResult> {
    try {
      const defaultPrompt = this.buildVisionPrompt(options);
      const finalPrompt = prompt || defaultPrompt;

      // Use GPT-4 Vision for primary analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: finalPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      // Parse the structured response
      return this.parseVisionResponse(analysis, options);

    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Analyze audio/voice input
   */
  async analyzeAudio(
    audioBlob: Blob,
    options?: {
      language?: 'en' | 'ar';
      detectIntent?: boolean;
      sentiment?: boolean;
    }
  ): Promise<AudioAnalysisResult> {
    try {
      // Convert to file for OpenAI Whisper
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: options?.language === 'ar' ? 'ar' : 'en',
        response_format: 'verbose_json'
      });

      const result: AudioAnalysisResult = {
        transcript: transcription.text,
        language: transcription.language || options?.language || 'en',
        confidence: 0.9 // Whisper doesn't provide confidence scores
      };

      // Analyze intent if requested
      if (options?.detectIntent) {
        result.intent = await this.analyzeIntent(transcription.text);
      }

      // Analyze sentiment if requested
      if (options?.sentiment) {
        result.sentiment = await this.analyzeSentiment(transcription.text);
      }

      return result;

    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw new Error('Failed to analyze audio');
    }
  }

  /**
   * Process multi-modal conversation
   */
  async processMultiModalMessage(
    messages: MultiModalMessage[],
    options?: {
      model?: 'gpt-4' | 'claude' | 'gemini';
      language?: string;
      context?: string;
    }
  ): Promise<MultiModalMessage> {
    try {
      const model = options?.model || 'gpt-4';
      
      // Convert messages to appropriate format
      const formattedMessages = await this.formatMessagesForModel(messages, model);

      let response: string;

      switch (model) {
        case 'claude':
          response = await this.processWithClaude(formattedMessages, options);
          break;
        case 'gemini':
          response = await this.processWithGemini(formattedMessages, options);
          break;
        default:
          response = await this.processWithGPT4(formattedMessages, options);
      }

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: [{ type: 'text', text: response }],
        timestamp: new Date(),
        metadata: {
          language: options?.language,
          context: options?.context
        }
      };

    } catch (error) {
      console.error('Multi-modal processing failed:', error);
      throw new Error('Failed to process multi-modal message');
    }
  }

  /**
   * Analyze document (PDF, text, etc.)
   */
  async analyzeDocument(
    file: File,
    prompt?: string
  ): Promise<{
    content: string;
    summary: string;
    keyPoints: string[];
    actionItems?: string[];
    dubaiRelevance?: {
      score: number;
      relevantServices: string[];
    };
  }> {
    try {
      // Extract text content based on file type
      let content: string;

      if (file.type === 'application/pdf') {
        content = await this.extractPDFText(file);
      } else if (file.type.startsWith('text/')) {
        content = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      // Analyze with AI
      const analysisPrompt = prompt || `
        Analyze this document and provide:
        1. A concise summary
        2. Key points (bullet format)
        3. Any action items mentioned
        4. Relevance to Dubai residents/tourists (score 0-10 and relevant services)
        
        Document content:
        ${content}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in analyzing documents for Dubai residents and tourists. Provide structured, actionable insights.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      // Parse structured response (this would be more sophisticated in production)
      return this.parseDocumentAnalysis(content, analysis);

    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze document');
    }
  }

  /**
   * Generate contextual responses based on location and user preferences
   */
  async generateContextualResponse(
    query: string,
    context: {
      location?: { lat: number; lng: number };
      userPreferences?: any;
      conversationHistory?: MultiModalMessage[];
      currentTime?: Date;
    }
  ): Promise<string> {
    try {
      const contextPrompt = this.buildContextualPrompt(query, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are MyDub.AI, an AI assistant specialized in Dubai. Provide helpful, accurate, and contextually relevant information about Dubai's services, attractions, government procedures, and daily life. Always consider the user's location, preferences, and current context.`
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    } catch (error) {
      console.error('Contextual response generation failed:', error);
      throw new Error('Failed to generate contextual response');
    }
  }

  // Private helper methods

  private buildVisionPrompt(options?: any): string {
    let prompt = 'Analyze this image and provide a detailed description. ';
    
    if (options?.detectLandmarks) {
      prompt += 'Identify any Dubai landmarks or notable locations. ';
    }
    
    if (options?.extractText) {
      prompt += 'Extract any visible text. ';
    }
    
    if (options?.identifyObjects) {
      prompt += 'Identify key objects and their locations. ';
    }
    
    if (options?.dubaiContext) {
      prompt += 'Provide context relevant to Dubai residents or tourists. ';
    }

    prompt += 'Format your response as JSON with description, objects, text, landmarks, and context fields.';
    
    return prompt;
  }

  private parseVisionResponse(response: string, options?: any): VisionAnalysisResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // Fallback to text parsing
      return {
        description: response,
        objects: [],
        context: {
          isDubai: response.toLowerCase().includes('dubai'),
          category: 'general'
        }
      };
    }
  }

  private async analyzeIntent(text: string) {
    // Simple intent analysis - would use specialized models in production
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the intent of this text. Return JSON with category, action, and entities.'
        },
        { role: 'user', content: text }
      ],
      max_tokens: 200
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      return { category: 'general', action: 'query', entities: [] };
    }
  }

  private async analyzeSentiment(text: string) {
    // Simple sentiment analysis
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze sentiment. Return JSON with score (-1 to 1) and label (positive/negative/neutral).'
        },
        { role: 'user', content: text }
      ],
      max_tokens: 100
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{"score": 0, "label": "neutral"}');
    } catch {
      return { score: 0, label: 'neutral' as const };
    }
  }

  private async formatMessagesForModel(messages: MultiModalMessage[], model: string) {
    // Convert MultiModalMessage format to model-specific format
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content.map(content => {
        if (content.type === 'text') {
          return { type: 'text', text: content.text };
        } else if (content.type === 'image') {
          return { 
            type: 'image_url', 
            image_url: { url: content.image!.url, detail: content.image!.detail }
          };
        }
        return content;
      })
    }));
  }

  private async processWithGPT4(messages: any[], options?: any): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || '';
  }

  private async processWithClaude(messages: any[], options?: any): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');
    
    // Convert messages for Claude format
    const response = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages
    });

    return response.content[0]?.text || '';
  }

  private async processWithGemini(messages: any[], options?: any): Promise<string> {
    if (!this.gemini) throw new Error('Gemini client not initialized');
    
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // Convert messages for Gemini format
    const result = await model.generateContent(messages);
    const response = await result.response;
    
    return response.text();
  }

  private async extractPDFText(file: File): Promise<string> {
    // PDF text extraction - would use pdf.js or similar
    return 'PDF content extraction not implemented yet';
  }

  private parseDocumentAnalysis(content: string, analysis: string) {
    // Parse AI analysis into structured format
    return {
      content,
      summary: analysis,
      keyPoints: [],
      actionItems: [],
      dubaiRelevance: { score: 5, relevantServices: [] }
    };
  }

  private buildContextualPrompt(query: string, context: any): string {
    let prompt = `User query: ${query}\n\n`;
    
    if (context.location) {
      prompt += `User location: ${context.location.lat}, ${context.location.lng}\n`;
    }
    
    if (context.currentTime) {
      prompt += `Current time: ${context.currentTime.toISOString()}\n`;
    }
    
    if (context.userPreferences) {
      prompt += `User preferences: ${JSON.stringify(context.userPreferences)}\n`;
    }
    
    prompt += '\nPlease provide a helpful, contextual response.';
    
    return prompt;
  }
}

// Export singleton instance
let multiModalClient: MultiModalAIClient | null = null;

export function getMultiModalAIClient(): MultiModalAIClient {
  if (!multiModalClient) {
    multiModalClient = new MultiModalAIClient();
  }
  return multiModalClient;
}

// React hook for multi-modal AI
export function useMultiModalAI() {
  const client = getMultiModalAIClient();

  return {
    analyzeImage: client.analyzeImage.bind(client),
    analyzeAudio: client.analyzeAudio.bind(client),
    processMessage: client.processMultiModalMessage.bind(client),
    analyzeDocument: client.analyzeDocument.bind(client),
    generateContextualResponse: client.generateContextualResponse.bind(client)
  };
}