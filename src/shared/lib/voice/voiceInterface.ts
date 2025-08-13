/**
 * Voice Interface for MyDub.AI
 * Supports Arabic and English voice commands, speech recognition, and text-to-speech
 */

import { getMultiModalAIClient } from '@/shared/lib/ai/multimodalClient';

export interface VoiceCommand {
  id: string;
  command: string;
  language: 'en' | 'ar';
  intent: string;
  entities: Array<{ type: string; value: string }>;
  confidence: number;
  timestamp: Date;
}

export interface VoiceSynthesisOptions {
  language: 'en' | 'ar';
  voice?: string;
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
}

export interface VoiceRecognitionOptions {
  language: 'en' | 'ar';
  continuous?: boolean;
  interim_results?: boolean;
  max_alternatives?: number;
  grammar?: string[];
}

class VoiceInterface {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private supportedVoices: SpeechSynthesisVoice[] = [];
  private currentLanguage: 'en' | 'ar' = 'en';
  private aiClient = getMultiModalAIClient();

  // Voice command patterns
  private commandPatterns = {
    en: {
      navigation: [
        { pattern: /^(go to|navigate to|open) (.+)$/i, action: 'navigate' },
        { pattern: /^(search for|find) (.+)$/i, action: 'search' },
        { pattern: /^(show me|display) (.+)$/i, action: 'show' }
      ],
      actions: [
        { pattern: /^(call|dial) (.+)$/i, action: 'call' },
        { pattern: /^(save|bookmark) (this|current)$/i, action: 'save' },
        { pattern: /^(share) (.+)$/i, action: 'share' },
        { pattern: /^(read|read out) (.+)$/i, action: 'read' }
      ],
      queries: [
        { pattern: /^(what is|tell me about) (.+)$/i, action: 'query' },
        { pattern: /^(how to|how do I) (.+)$/i, action: 'howto' },
        { pattern: /^(when is|what time) (.+)$/i, action: 'time_query' },
        { pattern: /^(where is|where can I find) (.+)$/i, action: 'location_query' }
      ],
      system: [
        { pattern: /^(stop listening|stop voice)$/i, action: 'stop_listening' },
        { pattern: /^(switch to arabic|change to arabic)$/i, action: 'switch_arabic' },
        { pattern: /^(help|what can you do)$/i, action: 'help' }
      ]
    },
    ar: {
      navigation: [
        { pattern: /^(اذهب إلى|انتقل إلى|افتح) (.+)$/i, action: 'navigate' },
        { pattern: /^(ابحث عن|اعثر على) (.+)$/i, action: 'search' },
        { pattern: /^(أظهر لي|اعرض) (.+)$/i, action: 'show' }
      ],
      actions: [
        { pattern: /^(اتصل|اتصل بـ) (.+)$/i, action: 'call' },
        { pattern: /^(احفظ|احفظ هذا) (.*)$/i, action: 'save' },
        { pattern: /^(شارك) (.+)$/i, action: 'share' },
        { pattern: /^(اقرأ|اقرأ لي) (.+)$/i, action: 'read' }
      ],
      queries: [
        { pattern: /^(ما هو|أخبرني عن) (.+)$/i, action: 'query' },
        { pattern: /^(كيف|كيف يمكنني) (.+)$/i, action: 'howto' },
        { pattern: /^(متى|ما وقت) (.+)$/i, action: 'time_query' },
        { pattern: /^(أين|أين يمكنني أن أجد) (.+)$/i, action: 'location_query' }
      ],
      system: [
        { pattern: /^(توقف عن الاستماع|أوقف الصوت)$/i, action: 'stop_listening' },
        { pattern: /^(انتقل إلى الإنجليزية|غير إلى الإنجليزية)$/i, action: 'switch_english' },
        { pattern: /^(مساعدة|ماذا يمكنك أن تفعل)$/i, action: 'help' }
      ]
    }
  };

  constructor() {
    this.initializeVoiceAPI();
    this.loadVoices();
  }

  private initializeVoiceAPI() {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.setupRecognitionHandlers();
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('listening_started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('listening_stopped');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      this.emit('speech_recognized', {
        transcript,
        confidence,
        isFinal: result.isFinal
      });

      if (result.isFinal) {
        this.processCommand(transcript, confidence);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.emit('recognition_error', event.error);
    };
  }

  private loadVoices() {
    if (!this.synthesis) return;

    const updateVoices = () => {
      this.supportedVoices = this.synthesis!.getVoices();
      this.emit('voices_loaded', this.supportedVoices);
    };

    updateVoices();
    this.synthesis.onvoiceschanged = updateVoices;
  }

  /**
   * Start voice recognition
   */
  async startListening(options: VoiceRecognitionOptions = { language: 'en' }): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      this.stopListening();
    }

    // Configure recognition
    this.recognition.lang = options.language === 'ar' ? 'ar-AE' : 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interim_results ?? true;
    this.recognition.maxAlternatives = options.max_alternatives ?? 1;

    this.currentLanguage = options.language;

    // Request microphone permission and start
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recognition.start();
    } catch (error) {
      throw new Error('Microphone access denied');
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(
    text: string, 
    options: VoiceSynthesisOptions = { language: 'en' }
  ): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice
      const voice = this.getVoiceForLanguage(options.language, options.voice);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = options.language === 'ar' ? 'ar-AE' : 'en-US';
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      utterance.onend = () => {
        this.emit('speech_ended');
        resolve();
      };

      utterance.onerror = (event) => {
        this.emit('speech_error', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      utterance.onstart = () => {
        this.emit('speech_started');
      };

      this.synthesis!.speak(utterance);
    });
  }

  /**
   * Process voice command
   */
  private async processCommand(transcript: string, confidence: number): Promise<void> {
    const command = await this.parseCommand(transcript);
    
    if (command) {
      this.emit('command_recognized', command);
      await this.executeCommand(command);
    } else {
      // If no command pattern matches, treat as general query
      const generalCommand: VoiceCommand = {
        id: crypto.randomUUID(),
        command: transcript,
        language: this.currentLanguage,
        intent: 'general_query',
        entities: [],
        confidence,
        timestamp: new Date()
      };
      
      this.emit('command_recognized', generalCommand);
      await this.executeCommand(generalCommand);
    }
  }

  /**
   * Parse voice command using patterns and NLP
   */
  private async parseCommand(transcript: string): Promise<VoiceCommand | null> {
    const cleanTranscript = transcript.trim().toLowerCase();
    const patterns = this.commandPatterns[this.currentLanguage];

    // Check against predefined patterns
    for (const [category, categoryPatterns] of Object.entries(patterns)) {
      for (const pattern of categoryPatterns) {
        const match = cleanTranscript.match(pattern.pattern);
        if (match) {
          return {
            id: crypto.randomUUID(),
            command: transcript,
            language: this.currentLanguage,
            intent: pattern.action,
            entities: this.extractEntities(match),
            confidence: 0.9,
            timestamp: new Date()
          };
        }
      }
    }

    // Use AI for complex command understanding
    try {
      const aiAnalysis = await this.aiClient.generateContextualResponse(
        `Analyze this voice command in ${this.currentLanguage}: "${transcript}". 
         Extract intent and entities. Return JSON with intent, entities, and confidence.`,
        { language: this.currentLanguage }
      );

      const parsed = JSON.parse(aiAnalysis);
      
      return {
        id: crypto.randomUUID(),
        command: transcript,
        language: this.currentLanguage,
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || [],
        confidence: parsed.confidence || 0.5,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('AI command parsing failed:', error);
      return null;
    }
  }

  /**
   * Execute voice command
   */
  private async executeCommand(command: VoiceCommand): Promise<void> {
    try {
      switch (command.intent) {
        case 'navigate':
          await this.handleNavigationCommand(command);
          break;
        
        case 'search':
          await this.handleSearchCommand(command);
          break;
        
        case 'query':
          await this.handleQueryCommand(command);
          break;
        
        case 'call':
          await this.handleCallCommand(command);
          break;
        
        case 'save':
          await this.handleSaveCommand(command);
          break;
        
        case 'read':
          await this.handleReadCommand(command);
          break;
        
        case 'stop_listening':
          this.stopListening();
          break;
        
        case 'switch_arabic':
          this.currentLanguage = 'ar';
          await this.speak('تم التبديل إلى العربية', { language: 'ar' });
          break;
        
        case 'switch_english':
          this.currentLanguage = 'en';
          await this.speak('Switched to English', { language: 'en' });
          break;
        
        case 'help':
          await this.handleHelpCommand(command);
          break;
        
        case 'general_query':
          await this.handleGeneralQuery(command);
          break;
        
        default:
          await this.handleUnknownCommand(command);
      }
    } catch (error) {
      console.error('Command execution failed:', error);
      await this.speak(
        this.currentLanguage === 'ar' 
          ? 'عذراً، حدث خطأ في تنفيذ الأمر'
          : 'Sorry, there was an error executing the command',
        { language: this.currentLanguage }
      );
    }
  }

  // Command handlers
  private async handleNavigationCommand(command: VoiceCommand): Promise<void> {
    const target = command.entities.find(e => e.type === 'target')?.value;
    if (target) {
      // Navigate to the target
      window.location.href = this.resolveNavigationTarget(target);
      
      await this.speak(
        this.currentLanguage === 'ar' 
          ? `جاري الانتقال إلى ${target}`
          : `Navigating to ${target}`,
        { language: this.currentLanguage }
      );
    }
  }

  private async handleSearchCommand(command: VoiceCommand): Promise<void> {
    const query = command.entities.find(e => e.type === 'query')?.value || 
                  command.command.replace(/^(search for|find|ابحث عن|اعثر على)/i, '').trim();
    
    if (query) {
      // Perform search
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
      
      await this.speak(
        this.currentLanguage === 'ar' 
          ? `جاري البحث عن ${query}`
          : `Searching for ${query}`,
        { language: this.currentLanguage }
      );
    }
  }

  private async handleQueryCommand(command: VoiceCommand): Promise<void> {
    // Use AI to answer the query
    const response = await this.aiClient.generateContextualResponse(
      command.command,
      { language: this.currentLanguage }
    );
    
    await this.speak(response, { language: this.currentLanguage });
  }

  private async handleCallCommand(command: VoiceCommand): Promise<void> {
    const number = command.entities.find(e => e.type === 'phone_number')?.value;
    if (number) {
      window.location.href = `tel:${number}`;
    } else {
      await this.speak(
        this.currentLanguage === 'ar'
          ? 'لم أتمكن من فهم رقم الهاتف'
          : 'I couldn\'t understand the phone number',
        { language: this.currentLanguage }
      );
    }
  }

  private async handleSaveCommand(command: VoiceCommand): Promise<void> {
    // Save current page/content
    const event = new CustomEvent('voice_save_request');
    window.dispatchEvent(event);
    
    await this.speak(
      this.currentLanguage === 'ar'
        ? 'تم حفظ المحتوى'
        : 'Content saved',
      { language: this.currentLanguage }
    );
  }

  private async handleReadCommand(command: VoiceCommand): Promise<void> {
    // Read current page content
    const content = document.querySelector('main')?.textContent || 
                   document.body.textContent || '';
    
    const summary = content.substring(0, 500) + '...';
    await this.speak(summary, { language: this.currentLanguage });
  }

  private async handleHelpCommand(command: VoiceCommand): Promise<void> {
    const helpText = this.currentLanguage === 'ar' 
      ? 'يمكنني مساعدتك في التنقل والبحث والإجابة على الأسئلة. قل "ابحث عن" أو "اذهب إلى" أو "ما هو" لتبدأ.'
      : 'I can help you navigate, search, and answer questions. Say "search for", "go to", or "what is" to get started.';
    
    await this.speak(helpText, { language: this.currentLanguage });
  }

  private async handleGeneralQuery(command: VoiceCommand): Promise<void> {
    // Use AI for general queries
    const response = await this.aiClient.generateContextualResponse(
      command.command,
      { 
        language: this.currentLanguage,
        context: 'dubai_voice_assistant'
      }
    );
    
    await this.speak(response, { language: this.currentLanguage });
  }

  private async handleUnknownCommand(command: VoiceCommand): Promise<void> {
    await this.speak(
      this.currentLanguage === 'ar'
        ? 'عذراً، لم أفهم هذا الأمر. حاول مرة أخرى.'
        : 'Sorry, I didn\'t understand that command. Please try again.',
      { language: this.currentLanguage }
    );
  }

  // Helper methods
  private extractEntities(match: RegExpMatchArray): Array<{ type: string; value: string }> {
    const entities = [];
    
    if (match[2]) {
      entities.push({ type: 'target', value: match[2] });
    }
    
    return entities;
  }

  private getVoiceForLanguage(language: 'en' | 'ar', preferredVoice?: string): SpeechSynthesisVoice | null {
    const voices = this.supportedVoices.filter(voice => {
      if (language === 'ar') {
        return voice.lang.startsWith('ar');
      } else {
        return voice.lang.startsWith('en');
      }
    });

    if (preferredVoice) {
      const preferred = voices.find(voice => voice.name.includes(preferredVoice));
      if (preferred) return preferred;
    }

    return voices[0] || null;
  }

  private resolveNavigationTarget(target: string): string {
    const navigationMap: Record<string, string> = {
      'home': '/',
      'search': '/search',
      'news': '/news',
      'tourism': '/tourism',
      'government': '/government',
      'chat': '/chat',
      'profile': '/profile',
      'settings': '/settings',
      // Arabic mappings
      'الرئيسية': '/',
      'بحث': '/search',
      'أخبار': '/news',
      'سياحة': '/tourism',
      'حكومة': '/government',
      'محادثة': '/chat',
      'الملف الشخصي': '/profile',
      'الإعدادات': '/settings'
    };

    return navigationMap[target.toLowerCase()] || `/search?q=${encodeURIComponent(target)}`;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.supportedVoices;
  }

  /**
   * Check if voice recognition is supported
   */
  isRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Check if speech synthesis is supported
   */
  isSynthesisSupported(): boolean {
    return !!this.synthesis;
  }

  /**
   * Get current listening status
   */
  getListeningStatus(): boolean {
    return this.isListening;
  }

  /**
   * Set current language
   */
  setLanguage(language: 'en' | 'ar'): void {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): 'en' | 'ar' {
    return this.currentLanguage;
  }

  // Event system
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }
}

// Export singleton instance
let voiceInterface: VoiceInterface | null = null;

export function getVoiceInterface(): VoiceInterface {
  if (!voiceInterface) {
    voiceInterface = new VoiceInterface();
  }
  return voiceInterface;
}