/**
 * Text-to-Speech Player Component for MyDub.ai
 * Comprehensive TTS player with accessibility features and multi-language support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Slider } from '@/shared/components/ui/slider'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Separator } from '@/shared/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Languages,
  Clock,
  Headphones,
  Accessibility,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { ttsService, TTSProgress, TTSVoice, TTSOptions } from '@/shared/services/text-to-speech.service'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface TextToSpeechPlayerProps {
  text: string
  title?: string
  author?: string
  language?: string
  className?: string
  autoPlay?: boolean
  showFullControls?: boolean
  compact?: boolean
}

export function TextToSpeechPlayer({
  text,
  title = 'Article',
  author,
  language = 'en',
  className,
  autoPlay = false,
  showFullControls = true,
  compact = false
}: TextToSpeechPlayerProps) {
  const { announce } = useScreenReader()
  const { toast } = useToast()
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<TTSProgress>({
    currentWord: 0,
    totalWords: 0,
    currentSentence: 0,
    totalSentences: 0,
    currentCharacter: 0,
    totalCharacters: 0,
    progress: 0
  })

  // TTS settings
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [volume, setVolume] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState(false)

  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)

  // Refs
  const progressUnsubscribeRef = useRef<(() => void) | null>(null)

  // Load available voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const availableVoices = await ttsService.getAvailableVoices()
        setVoices(availableVoices)
        
        // Set default voice for language
        const languageVoices = availableVoices.filter(v => 
          v.lang.startsWith(language.split('-')[0])
        )
        if (languageVoices.length > 0) {
          setSelectedVoice(languageVoices[0].name)
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].name)
        }
      } catch (error) {
        console.error('Failed to load TTS voices:', error)
      }
    }

    if (ttsService.isSupported()) {
      loadVoices()
    }

    // Calculate estimated reading time
    setEstimatedTime(ttsService.estimateReadingTime(text))

    return () => {
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current()
      }
      ttsService.stop()
    }
  }, [text, language])

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && ttsService.isSupported() && text && !isPlaying) {
      handlePlay()
    }
  }, [autoPlay, text])

  // Progress tracking
  const setupProgressTracking = useCallback(() => {
    if (progressUnsubscribeRef.current) {
      progressUnsubscribeRef.current()
    }

    progressUnsubscribeRef.current = ttsService.onProgress((newProgress) => {
      setProgress(newProgress)
    })
  }, [])

  const handlePlay = async () => {
    if (!ttsService.isSupported()) {
      toast({
        title: 'Not Supported',
        description: 'Text-to-speech is not supported in your browser.',
        variant: 'destructive'
      })
      return
    }

    if (!text.trim()) {
      toast({
        title: 'No Content',
        description: 'No text content available to read.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      announce('Starting text-to-speech playback', 'polite')

      // Update TTS settings
      const ttsOptions: Partial<TTSOptions> = {
        language: language,
        voice: selectedVoice,
        rate: rate,
        pitch: pitch,
        volume: isMuted ? 0 : volume
      }

      ttsService.updateSettings(ttsOptions)
      setupProgressTracking()

      // Handle resume or new playback
      if (isPaused) {
        ttsService.resume()
        setIsPaused(false)
        announce('Resumed playback', 'polite')
      } else {
        await ttsService.speakLongText(text, ttsOptions)
        announce('Playback completed', 'polite')
        setIsPlaying(false)
      }

      setIsPlaying(true)
    } catch (error) {
      console.error('TTS playback error:', error)
      toast({
        title: 'Playback Error',
        description: 'Failed to start text-to-speech. Please try again.',
        variant: 'destructive'
      })
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = () => {
    ttsService.pause()
    setIsPaused(true)
    setIsPlaying(false)
    announce('Paused playback', 'polite')
  }

  const handleStop = () => {
    ttsService.stop()
    setIsPlaying(false)
    setIsPaused(false)
    setProgress({
      currentWord: 0,
      totalWords: 0,
      currentSentence: 0,
      totalSentences: 0,
      currentCharacter: 0,
      totalCharacters: 0,
      progress: 0
    })
    announce('Stopped playback', 'polite')
  }

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted)
    announce(isMuted ? 'Unmuted' : 'Muted', 'polite')
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min'
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  }

  const getLanguageFlag = (lang: string): string => {
    const langFlags: Record<string, string> = {
      'en': '🇺🇸',
      'ar': '🇦🇪',
      'hi': '🇮🇳',
      'ur': '🇵🇰'
    }
    return langFlags[lang.split('-')[0]] || '🌐'
  }

  if (!ttsService.isSupported()) {
    return (
      <Card className={cn('border-amber-200 bg-amber-50', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-800">
            <Accessibility className="h-5 w-5" />
            <div>
              <p className="font-medium">Text-to-Speech Not Available</p>
              <p className="text-sm text-amber-700">
                Your browser doesn't support text-to-speech functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-blue-200 bg-blue-50', className)} role="region" aria-label="Text-to-Speech Player">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Headphones className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Listen to Article</span>
                <Badge variant="secondary" className="text-xs">
                  <Accessibility className="h-3 w-3 mr-1" />
                  TTS
                </Badge>
              </CardTitle>
              {title && (
                <p className="text-sm text-blue-700 mt-1">
                  {title}
                  {author && <span className="text-blue-600"> • by {author}</span>}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getLanguageFlag(language)} {language.toUpperCase()}
            </Badge>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-4', !isExpanded && 'hidden')}>
        {/* Progress Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>
              {progress.totalWords > 0 ? (
                <>Word {progress.currentWord + 1} of {progress.totalWords}</>
              ) : (
                'Ready to play'
              )}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{formatTime(estimatedTime)}</span>
            </div>
          </div>
          <Progress value={progress.progress} className="h-2" />
          <div className="text-xs text-blue-600 text-center">
            {progress.totalSentences > 0 && (
              <>Sentence {progress.currentSentence + 1} of {progress.totalSentences}</>
            )}
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            aria-label="Stop playback"
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="lg"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isLoading}
            className="px-8"
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            <span className="ml-2">
              {isLoading ? 'Loading...' : isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVolumeToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Settings Panel */}
        {showFullControls && (
          <>
            <Separator />
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Voice Settings
                </span>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showSettings && (
                <div className="space-y-4 p-4 bg-white rounded-lg border">
                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice</label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices
                          .filter(voice => voice.lang.startsWith(language.split('-')[0]))
                          .map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              <div className="flex items-center gap-2">
                                <span>{getLanguageFlag(voice.lang)}</span>
                                <span>{voice.name}</span>
                                {voice.gender && (
                                  <Badge variant="outline" className="text-xs">
                                    {voice.gender}
                                  </Badge>
                                )}
                                {voice.localService && (
                                  <Badge variant="secondary" className="text-xs">Local</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speed Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Speed</label>
                      <span className="text-sm text-blue-600">{rate.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[rate]}
                      onValueChange={(value) => setRate(value[0])}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Pitch Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Pitch</label>
                      <span className="text-sm text-blue-600">{pitch.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[pitch]}
                      onValueChange={(value) => setPitch(value[0])}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Volume</label>
                      <span className="text-sm text-blue-600">{Math.round(volume * 100)}%</span>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                      disabled={isMuted}
                    />
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRate(1.0)
                      setPitch(1.0)
                      setVolume(1.0)
                      setIsMuted(false)
                      announce('Settings reset to default', 'polite')
                    }}
                    className="w-full"
                  >
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="text-xs text-blue-600 text-center py-2">
          <Accessibility className="h-3 w-3 inline mr-1" />
          This feature improves accessibility by reading content aloud
        </div>
      </CardContent>
    </Card>
  )
}

export default TextToSpeechPlayer