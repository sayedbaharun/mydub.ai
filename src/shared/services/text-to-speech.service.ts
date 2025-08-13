/**
 * Text-to-Speech Service for MyDub.ai
 * Provides comprehensive TTS functionality for content accessibility
 */

export interface TTSOptions {
  language?: string
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface TTSVoice {
  name: string
  lang: string
  gender?: 'male' | 'female'
  localService: boolean
  voiceURI: string
}

export interface TTSProgress {
  currentWord: number
  totalWords: number
  currentSentence: number
  totalSentences: number
  currentCharacter: number
  totalCharacters: number
  progress: number // 0-100
}

export class TextToSpeechService {
  private static instance: TextToSpeechService
  private synthesis: SpeechSynthesis
  private utterance: SpeechSynthesisUtterance | null = null
  private isSupported: boolean
  private voices: SpeechSynthesisVoice[] = []
  private currentText: string = ''
  private currentProgress: TTSProgress = {
    currentWord: 0,
    totalWords: 0,
    currentSentence: 0,
    totalSentences: 0,
    currentCharacter: 0,
    totalCharacters: 0,
    progress: 0
  }
  private progressCallbacks: ((progress: TTSProgress) => void)[] = []
  private isInitialized: boolean = false

  // Default TTS settings
  private settings: Required<TTSOptions> = {
    language: 'en-US',
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  }

  // Language-specific voice preferences for UAE languages
  private languageVoicePreferences: Record<string, string[]> = {
    'en': ['en-US', 'en-GB', 'en-AU'],
    'ar': ['ar-SA', 'ar-AE', 'ar-EG'],
    'hi': ['hi-IN'],
    'ur': ['ur-PK', 'ur-IN']
  }

  constructor() {
    this.synthesis = window.speechSynthesis
    this.isSupported = 'speechSynthesis' in window
    
    if (this.isSupported) {
      this.initializeVoices()
    }
  }

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService()
    }
    return TextToSpeechService.instance
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices()
        if (this.voices.length > 0) {
          this.isInitialized = true
          this.selectBestVoice()
          resolve()
        }
      }

      if (this.synthesis.getVoices().length > 0) {
        loadVoices()
      } else {
        this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true })
        // Fallback timeout
        setTimeout(() => {
          loadVoices()
        }, 1000)
      }
    })
  }

  private selectBestVoice(): void {
    const currentLanguage = this.settings.language.split('-')[0]
    const preferredLanguages = this.languageVoicePreferences[currentLanguage] || [this.settings.language]
    
    // Find the best voice for current language
    for (const lang of preferredLanguages) {
      const voice = this.voices.find(v => v.lang.startsWith(lang))
      if (voice) {
        this.settings.voice = voice.name
        return
      }
    }

    // Fallback to first available voice for language
    const fallbackVoice = this.voices.find(v => v.lang.startsWith(currentLanguage))
    if (fallbackVoice) {
      this.settings.voice = fallbackVoice.name
    }
  }

  public isSpeechSupported(): boolean {
    return this.isSupported
  }

  public async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.isInitialized) {
      await this.initializeVoices()
    }

    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: this.inferGender(voice.name),
      localService: voice.localService,
      voiceURI: voice.voiceURI
    }))
  }

  private inferGender(voiceName: string): 'male' | 'female' | undefined {
    const name = voiceName.toLowerCase()
    if (name.includes('male') || name.includes('man') || name.includes('mr')) return 'male'
    if (name.includes('female') || name.includes('woman') || name.includes('ms')) return 'female'
    
    // Common Arabic names
    if (name.includes('ahmed') || name.includes('hassan') || name.includes('omar')) return 'male'
    if (name.includes('fatima') || name.includes('aisha') || name.includes('maryam')) return 'female'
    
    return undefined
  }

  public updateSettings(options: Partial<TTSOptions>): void {
    this.settings = { ...this.settings, ...options }
    
    if (options.language) {
      this.selectBestVoice()
    }
  }

  public getSettings(): Required<TTSOptions> {
    return { ...this.settings }
  }

  private preprocessText(text: string): string {
    // Clean up text for better TTS pronunciation
    return text
      // Expand common abbreviations
      .replace(/\bUAE\b/g, 'United Arab Emirates')
      .replace(/\bDHH\b/g, 'Dubai Health Authority')
      .replace(/\bRTA\b/g, 'Roads and Transport Authority')
      .replace(/\bDEWA\b/g, 'Dubai Electricity and Water Authority')
      .replace(/\bDM\b/g, 'Dubai Municipality')
      .replace(/\bGDRFA\b/g, 'General Directorate of Residency and Foreigners Affairs')
      // Fix common mispronunciations
      .replace(/\bDubai\b/g, 'Doo-bye')
      .replace(/\bSheikh\b/g, 'Shake')
      .replace(/\bAED\b/g, 'Dirhams')
      // Remove excessive whitespace and newlines
      .replace(/\s+/g, ' ')
      .trim()
  }

  private calculateProgress(text: string, currentChar: number): TTSProgress {
    const words = text.split(/\s+/)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Find current word and sentence
    const textUpToCurrent = text.substring(0, currentChar)
    const currentWordIndex = textUpToCurrent.split(/\s+/).length - 1
    const currentSentenceIndex = textUpToCurrent.split(/[.!?]+/).length - 1

    return {
      currentWord: Math.max(0, currentWordIndex),
      totalWords: words.length,
      currentSentence: Math.max(0, currentSentenceIndex),
      totalSentences: sentences.length,
      currentCharacter: currentChar,
      totalCharacters: text.length,
      progress: Math.round((currentChar / text.length) * 100)
    }
  }

  public async speak(text: string, options?: Partial<TTSOptions>): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Text-to-speech is not supported in this browser')
    }

    if (!this.isInitialized) {
      await this.initializeVoices()
    }

    // Stop any current speech
    this.stop()

    const finalOptions = { ...this.settings, ...options }
    const processedText = this.preprocessText(text)
    this.currentText = processedText

    return new Promise((resolve, reject) => {
      this.utterance = new SpeechSynthesisUtterance(processedText)
      
      // Set voice
      if (finalOptions.voice) {
        const voice = this.voices.find(v => v.name === finalOptions.voice)
        if (voice) {
          this.utterance.voice = voice
        }
      }

      // Set utterance properties
      this.utterance.lang = finalOptions.language
      this.utterance.rate = Math.max(0.1, Math.min(2.0, finalOptions.rate))
      this.utterance.pitch = Math.max(0, Math.min(2, finalOptions.pitch))
      this.utterance.volume = Math.max(0, Math.min(1, finalOptions.volume))

      // Progress tracking
      let charIndex = 0
      this.utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          charIndex = event.charIndex || 0
          this.currentProgress = this.calculateProgress(processedText, charIndex)
          this.notifyProgressCallbacks()
        }
      }

      // Event handlers
      this.utterance.onstart = () => {
        this.currentProgress = this.calculateProgress(processedText, 0)
        this.notifyProgressCallbacks()
      }

      this.utterance.onend = () => {
        this.currentProgress = this.calculateProgress(processedText, processedText.length)
        this.notifyProgressCallbacks()
        resolve()
      }

      this.utterance.onerror = (event) => {
        reject(new Error(`TTS Error: ${event.error}`))
      }

      this.utterance.onpause = () => {
        this.notifyProgressCallbacks()
      }

      this.utterance.onresume = () => {
        this.notifyProgressCallbacks()
      }

      // Start speaking
      this.synthesis.speak(this.utterance)
    })
  }

  public pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
    }
  }

  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  public stop(): void {
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel()
    }
    this.currentProgress = {
      currentWord: 0,
      totalWords: 0,
      currentSentence: 0,
      totalSentences: 0,
      currentCharacter: 0,
      totalCharacters: 0,
      progress: 0
    }
  }

  public isPlaying(): boolean {
    return this.synthesis.speaking && !this.synthesis.paused
  }

  public isPaused(): boolean {
    return this.synthesis.paused
  }

  public getCurrentProgress(): TTSProgress {
    return { ...this.currentProgress }
  }

  public onProgress(callback: (progress: TTSProgress) => void): () => void {
    this.progressCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.progressCallbacks.indexOf(callback)
      if (index > -1) {
        this.progressCallbacks.splice(index, 1)
      }
    }
  }

  private notifyProgressCallbacks(): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(this.currentProgress)
      } catch (error) {
        console.error('Error in TTS progress callback:', error)
      }
    })
  }

  // Utility method to get reading time estimate
  public estimateReadingTime(text: string, wordsPerMinute: number = 150): number {
    const words = text.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  // Method to split long text into chunks for better TTS performance
  public splitTextIntoChunks(text: string, maxChunkSize: number = 200): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentChunk.length + trimmedSentence.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
          currentChunk = ''
        }
      }
      
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  // Method to speak long text in chunks
  public async speakLongText(text: string, options?: Partial<TTSOptions>): Promise<void> {
    const chunks = this.splitTextIntoChunks(text)
    
    for (let i = 0; i < chunks.length; i++) {
      await this.speak(chunks[i], options)
      
      // Small pause between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
}

// Export singleton instance
export const ttsService = TextToSpeechService.getInstance()