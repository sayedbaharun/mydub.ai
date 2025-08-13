import { useState, useEffect, useCallback, useRef } from 'react';
import { getVoiceInterface, VoiceCommand, VoiceSynthesisOptions, VoiceRecognitionOptions } from '@/shared/lib/voice/voiceInterface';
import { useToast } from '@/shared/hooks/use-toast';

interface UseVoiceInterfaceOptions {
  autoStart?: boolean;
  language?: 'en' | 'ar';
  continuous?: boolean;
  onCommand?: (command: VoiceCommand) => void;
}

/**
 * Main hook for voice interface
 */
export function useVoiceInterface(options: UseVoiceInterfaceOptions = {}) {
  const { autoStart = false, language = 'en', continuous = false, onCommand } = options;
  
  const voiceInterface = getVoiceInterface();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(language);
  const [recognizedText, setRecognizedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set up event listeners
  useEffect(() => {
    const handleListeningStarted = () => {
      setIsListening(true);
      setError(null);
    };

    const handleListeningStopped = () => {
      setIsListening(false);
    };

    const handleSpeechRecognized = (data: { transcript: string; confidence: number; isFinal: boolean }) => {
      setRecognizedText(data.transcript);
      setConfidence(data.confidence);
    };

    const handleCommandRecognized = (command: VoiceCommand) => {
      setLastCommand(command);
      onCommand?.(command);
    };

    const handleSpeechStarted = () => {
      setIsSpeaking(true);
    };

    const handleSpeechEnded = () => {
      setIsSpeaking(false);
    };

    const handleRecognitionError = (errorType: string) => {
      setError(`Speech recognition error: ${errorType}`);
      setIsListening(false);
      
      toast({
        title: 'Voice Recognition Error',
        description: getErrorMessage(errorType),
        variant: 'destructive'
      });
    };

    const handleSpeechError = (errorType: string) => {
      setError(`Speech synthesis error: ${errorType}`);
      setIsSpeaking(false);
    };

    voiceInterface.on('listening_started', handleListeningStarted);
    voiceInterface.on('listening_stopped', handleListeningStopped);
    voiceInterface.on('speech_recognized', handleSpeechRecognized);
    voiceInterface.on('command_recognized', handleCommandRecognized);
    voiceInterface.on('speech_started', handleSpeechStarted);
    voiceInterface.on('speech_ended', handleSpeechEnded);
    voiceInterface.on('recognition_error', handleRecognitionError);
    voiceInterface.on('speech_error', handleSpeechError);

    return () => {
      voiceInterface.off('listening_started', handleListeningStarted);
      voiceInterface.off('listening_stopped', handleListeningStopped);
      voiceInterface.off('speech_recognized', handleSpeechRecognized);
      voiceInterface.off('command_recognized', handleCommandRecognized);
      voiceInterface.off('speech_started', handleSpeechStarted);
      voiceInterface.off('speech_ended', handleSpeechEnded);
      voiceInterface.off('recognition_error', handleRecognitionError);
      voiceInterface.off('speech_error', handleSpeechError);
    };
  }, [voiceInterface, onCommand, toast]);

  // Check support and auto-start
  useEffect(() => {
    const supported = voiceInterface.isRecognitionSupported() && voiceInterface.isSynthesisSupported();
    setIsSupported(supported);

    if (supported) {
      voiceInterface.setLanguage(language);
      setCurrentLanguage(language);

      if (autoStart) {
        startListening();
      }
    }
  }, [autoStart, language]);

  const startListening = useCallback(async (options?: VoiceRecognitionOptions) => {
    try {
      await voiceInterface.startListening({
        language: currentLanguage,
        continuous,
        interim_results: true,
        ...options
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start listening');
      toast({
        title: 'Voice Recognition Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  }, [voiceInterface, currentLanguage, continuous, toast]);

  const stopListening = useCallback(() => {
    voiceInterface.stopListening();
  }, [voiceInterface]);

  const speak = useCallback(async (text: string, options?: VoiceSynthesisOptions) => {
    try {
      await voiceInterface.speak(text, {
        language: currentLanguage,
        ...options
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to speak');
      toast({
        title: 'Speech Synthesis Error',
        description: 'Could not speak the text.',
        variant: 'destructive'
      });
    }
  }, [voiceInterface, currentLanguage, toast]);

  const switchLanguage = useCallback((newLanguage: 'en' | 'ar') => {
    voiceInterface.setLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    
    const message = newLanguage === 'ar' 
      ? 'تم التبديل إلى العربية'
      : 'Switched to English';
    
    speak(message, { language: newLanguage });
  }, [voiceInterface, speak]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    isSupported,
    currentLanguage,
    recognizedText,
    confidence,
    lastCommand,
    error,
    startListening,
    stopListening,
    speak,
    switchLanguage,
    toggleListening
  };
}

/**
 * Hook for voice commands
 */
export function useVoiceCommands(
  commands: Array<{
    pattern: RegExp | string;
    action: (command: VoiceCommand) => void;
    languages?: ('en' | 'ar')[];
  }>
) {
  const { lastCommand } = useVoiceInterface();

  useEffect(() => {
    if (!lastCommand) return;

    for (const cmd of commands) {
      // Check language filter
      if (cmd.languages && !cmd.languages.includes(lastCommand.language)) {
        continue;
      }

      // Check pattern match
      let matches = false;
      if (cmd.pattern instanceof RegExp) {
        matches = cmd.pattern.test(lastCommand.command);
      } else {
        matches = lastCommand.command.toLowerCase().includes(cmd.pattern.toLowerCase());
      }

      if (matches) {
        cmd.action(lastCommand);
        break;
      }
    }
  }, [lastCommand, commands]);
}

/**
 * Hook for text-to-speech
 */
export function useTextToSpeech(language: 'en' | 'ar' = 'en') {
  const voiceInterface = getVoiceInterface();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    const handleSpeechStarted = () => setIsSpeaking(true);
    const handleSpeechEnded = () => {
      setIsSpeaking(false);
      // Process next item in queue
      setQueue(prev => {
        const newQueue = prev.slice(1);
        if (newQueue.length > 0) {
          speakText(newQueue[0]);
        }
        return newQueue;
      });
    };
    const handleSpeechError = (errorType: string) => {
      setError(`Speech error: ${errorType}`);
      setIsSpeaking(false);
    };

    voiceInterface.on('speech_started', handleSpeechStarted);
    voiceInterface.on('speech_ended', handleSpeechEnded);
    voiceInterface.on('speech_error', handleSpeechError);

    return () => {
      voiceInterface.off('speech_started', handleSpeechStarted);
      voiceInterface.off('speech_ended', handleSpeechEnded);
      voiceInterface.off('speech_error', handleSpeechError);
    };
  }, [voiceInterface]);

  const speakText = useCallback(async (text: string, options?: VoiceSynthesisOptions) => {
    try {
      await voiceInterface.speak(text, {
        language,
        ...options
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Speech failed');
    }
  }, [voiceInterface, language]);

  const speakQueue = useCallback((text: string, options?: VoiceSynthesisOptions) => {
    if (isSpeaking) {
      setQueue(prev => [...prev, text]);
    } else {
      speakText(text, options);
    }
  }, [isSpeaking, speakText]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setQueue([]);
    setIsSpeaking(false);
  }, []);

  return {
    speak: speakText,
    speakQueue,
    stop,
    isSpeaking,
    error,
    queueLength: queue.length
  };
}

/**
 * Hook for speech recognition
 */
export function useSpeechRecognition(options: {
  language?: 'en' | 'ar';
  continuous?: boolean;
  onResult?: (text: string, confidence: number) => void;
} = {}) {
  const { language = 'en', continuous = false, onResult } = options;
  const voiceInterface = getVoiceInterface();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const handleListeningStarted = () => setIsListening(true);
    const handleListeningStopped = () => setIsListening(false);
    const handleSpeechRecognized = (data: { transcript: string; confidence: number; isFinal: boolean }) => {
      if (data.isFinal) {
        setTranscript(data.transcript);
        setInterimTranscript('');
        setConfidence(data.confidence);
        onResult?.(data.transcript, data.confidence);
      } else {
        setInterimTranscript(data.transcript);
      }
    };

    voiceInterface.on('listening_started', handleListeningStarted);
    voiceInterface.on('listening_stopped', handleListeningStopped);
    voiceInterface.on('speech_recognized', handleSpeechRecognized);

    return () => {
      voiceInterface.off('listening_started', handleListeningStarted);
      voiceInterface.off('listening_stopped', handleListeningStopped);
      voiceInterface.off('speech_recognized', handleSpeechRecognized);
    };
  }, [voiceInterface, onResult]);

  const start = useCallback(() => {
    voiceInterface.startListening({
      language,
      continuous,
      interim_results: true
    });
  }, [voiceInterface, language, continuous]);

  const stop = useCallback(() => {
    voiceInterface.stopListening();
  }, [voiceInterface]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    start,
    stop,
    reset
  };
}

/**
 * Hook for voice-controlled navigation
 */
export function useVoiceNavigation() {
  useVoiceCommands([
    {
      pattern: /^(go to|navigate to|open) (.+)$/i,
      action: (command) => {
        const target = command.entities.find(e => e.type === 'target')?.value;
        if (target) {
          const route = resolveRoute(target);
          window.location.href = route;
        }
      },
      languages: ['en']
    },
    {
      pattern: /^(اذهب إلى|انتقل إلى|افتح) (.+)$/i,
      action: (command) => {
        const target = command.entities.find(e => e.type === 'target')?.value;
        if (target) {
          const route = resolveRoute(target);
          window.location.href = route;
        }
      },
      languages: ['ar']
    }
  ]);
}

/**
 * Hook for voice accessibility features
 */
export function useVoiceAccessibility() {
  const { speak } = useTextToSpeech();
  const [isEnabled, setIsEnabled] = useState(false);

  const announcePageChange = useCallback((pageName: string) => {
    if (isEnabled) {
      speak(`Navigated to ${pageName}`);
    }
  }, [speak, isEnabled]);

  const announceAction = useCallback((action: string) => {
    if (isEnabled) {
      speak(action);
    }
  }, [speak, isEnabled]);

  const readContent = useCallback((selector: string = 'main') => {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent || '';
      const summary = text.substring(0, 500) + (text.length > 500 ? '...' : '');
      speak(summary);
    }
  }, [speak]);

  return {
    isEnabled,
    setIsEnabled,
    announcePageChange,
    announceAction,
    readContent
  };
}

// Helper functions
function getErrorMessage(errorType: string): string {
  switch (errorType) {
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access in browser settings.';
    case 'no-speech':
      return 'No speech detected. Please try speaking again.';
    case 'audio-capture':
      return 'No microphone found. Please check your audio devices.';
    case 'network':
      return 'Network error. Please check your internet connection.';
    default:
      return 'An error occurred with voice recognition.';
  }
}

function resolveRoute(target: string): string {
  const routes: Record<string, string> = {
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

  return routes[target.toLowerCase()] || `/search?q=${encodeURIComponent(target)}`;
}