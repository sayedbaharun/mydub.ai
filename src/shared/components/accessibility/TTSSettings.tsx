/**
 * Text-to-Speech Settings Component for MyDub.ai
 * Advanced TTS configuration for user preferences
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Slider } from '@/shared/components/ui/slider'
import { Switch } from '@/shared/components/ui/switch'
import { Badge } from '@/shared/components/ui/badge'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { 
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Settings,
  Headphones,
  Languages,
  Accessibility,
  Zap,
  Clock,
  Info,
  TestTube
} from 'lucide-react'
import { ttsService, TTSVoice, TTSOptions } from '@/shared/services/text-to-speech.service'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface TTSSettingsProps {
  className?: string
  onSettingsChange?: (settings: Required<TTSOptions>) => void
}

export function TTSSettings({ className, onSettingsChange }: TTSSettingsProps) {
  const { announce } = useScreenReader()
  const { toast } = useToast()
  
  // Settings state
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [language, setLanguage] = useState<string>('en-US')
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [volume, setVolume] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState(false)
  
  // Advanced settings
  const [autoPlay, setAutoPlay] = useState(false)
  const [highlightText, setHighlightText] = useState(true)
  const [pauseOnPunctuation, setPauseOnPunctuation] = useState(true)
  const [enableShortcuts, setEnableShortcuts] = useState(true)
  
  // Test playback state
  const [isTestPlaying, setIsTestPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sample text for testing
  const testText = "Welcome to MyDub.ai, Dubai's intelligent digital companion. Experience the future of accessible content with our advanced text-to-speech technology."

  // Load voices and initialize settings
  useEffect(() => {
    const initializeSettings = async () => {
      if (!ttsService.isSupported()) return

      try {
        // Load available voices
        const availableVoices = await ttsService.getAvailableVoices()
        setVoices(availableVoices)

        // Get current settings
        const currentSettings = ttsService.getSettings()
        setLanguage(currentSettings.language)
        setSelectedVoice(currentSettings.voice)
        setRate(currentSettings.rate)
        setPitch(currentSettings.pitch)
        setVolume(currentSettings.volume)

        // Set default voice for language
        if (!currentSettings.voice) {
          const languageVoices = availableVoices.filter(v => 
            v.lang.startsWith(currentSettings.language.split('-')[0])
          )
          if (languageVoices.length > 0) {
            setSelectedVoice(languageVoices[0].name)
          }
        }

        // Load user preferences from localStorage
        const savedPrefs = localStorage.getItem('tts-preferences')
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs)
          setAutoPlay(prefs.autoPlay || false)
          setHighlightText(prefs.highlightText !== false)
          setPauseOnPunctuation(prefs.pauseOnPunctuation !== false)
          setEnableShortcuts(prefs.enableShortcuts !== false)
        }
      } catch (error) {
        console.error('Failed to initialize TTS settings:', error)
      }
    }

    initializeSettings()
  }, [])

  // Update settings when values change
  useEffect(() => {
    const newSettings: Required<TTSOptions> = {
      language,
      voice: selectedVoice,
      rate,
      pitch,
      volume: isMuted ? 0 : volume
    }

    ttsService.updateSettings(newSettings)
    onSettingsChange?.(newSettings)

    // Save preferences to localStorage
    const preferences = {
      autoPlay,
      highlightText,
      pauseOnPunctuation,
      enableShortcuts,
      ...newSettings
    }
    localStorage.setItem('tts-preferences', JSON.stringify(preferences))
  }, [language, selectedVoice, rate, pitch, volume, isMuted, autoPlay, highlightText, pauseOnPunctuation, enableShortcuts, onSettingsChange])

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    
    // Find best voice for new language
    const languageVoices = voices.filter(v => 
      v.lang.startsWith(newLanguage.split('-')[0])
    )
    if (languageVoices.length > 0) {
      setSelectedVoice(languageVoices[0].name)
    }

    announce(`Language changed to ${newLanguage}`, 'polite')
  }

  const handleTestPlayback = async () => {
    if (!ttsService.isSupported()) {
      toast({
        title: 'Not Supported',
        description: 'Text-to-speech is not supported in your browser.',
        variant: 'destructive'
      })
      return
    }

    if (isTestPlaying) {
      ttsService.stop()
      setIsTestPlaying(false)
      announce('Test stopped', 'polite')
      return
    }

    try {
      setIsLoading(true)
      announce('Testing voice settings', 'polite')

      await ttsService.speak(testText, {
        language,
        voice: selectedVoice,
        rate,
        pitch,
        volume: isMuted ? 0 : volume
      })

      setIsTestPlaying(false)
      announce('Test completed', 'polite')
    } catch (error) {
      console.error('Test playback failed:', error)
      toast({
        title: 'Test Failed',
        description: 'Could not play test audio. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    setLanguage('en-US')
    setRate(1.0)
    setPitch(1.0)
    setVolume(1.0)
    setIsMuted(false)
    setAutoPlay(false)
    setHighlightText(true)
    setPauseOnPunctuation(true)
    setEnableShortcuts(true)

    // Reset voice to default for English
    const englishVoices = voices.filter(v => v.lang.startsWith('en'))
    if (englishVoices.length > 0) {
      setSelectedVoice(englishVoices[0].name)
    }

    announce('Settings reset to default', 'polite')
    toast({
      title: 'Settings Reset',
      description: 'All TTS settings have been reset to default values.'
    })
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

  const getLanguageVoices = () => {
    return voices.filter(voice => voice.lang.startsWith(language.split('-')[0]))
  }

  if (!ttsService.isSupported()) {
    return (
      <Card className={cn('border-amber-200 bg-amber-50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <VolumeX className="h-5 w-5" />
            Text-to-Speech Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-amber-700">
              Your browser doesn't support the Web Speech API. Text-to-speech features are not available.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Browser Compatibility</AlertTitle>
              <AlertDescription>
                TTS is supported in modern versions of Chrome, Edge, Safari, and Firefox. 
                Please update your browser or try a different one.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Headphones className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Text-to-Speech Settings
                  <Badge variant="secondary" className="text-xs">
                    <Accessibility className="h-3 w-3 mr-1" />
                    Accessibility
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Customize voice settings for better accessibility and user experience
                </CardDescription>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleTestPlayback}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : isTestPlaying ? (
                <Square className="h-4 w-4" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {isLoading ? 'Loading...' : isTestPlaying ? 'Stop Test' : 'Test Voice'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Voice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Voice Configuration
          </CardTitle>
          <CardDescription>
            Select language and voice for text-to-speech
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>English (US)</span>
                  </div>
                </SelectItem>
                <SelectItem value="en-GB">
                  <div className="flex items-center gap-2">
                    <span>🇬🇧</span>
                    <span>English (UK)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ar-AE">
                  <div className="flex items-center gap-2">
                    <span>🇦🇪</span>
                    <span>Arabic (UAE)</span>
                  </div>
                </SelectItem>
                <SelectItem value="hi-IN">
                  <div className="flex items-center gap-2">
                    <span>🇮🇳</span>
                    <span>Hindi (India)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ur-PK">
                  <div className="flex items-center gap-2">
                    <span>🇵🇰</span>
                    <span>Urdu (Pakistan)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {getLanguageVoices().map((voice) => (
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
                ))}
              </SelectContent>
            </Select>
            {getLanguageVoices().length === 0 && (
              <p className="text-sm text-amber-600">
                No voices available for selected language
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Controls
          </CardTitle>
          <CardDescription>
            Adjust playback settings for optimal listening experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Speed Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Speaking Speed</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{rate.toFixed(1)}x</span>
              </div>
            </div>
            <Slider
              value={[rate]}
              onValueChange={(value) => setRate(value[0])}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Pitch Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Voice Pitch</Label>
              <span className="text-sm font-medium">{pitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[pitch]}
              onValueChange={(value) => setPitch(value[0])}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (0.5)</span>
              <span>Normal (1.0)</span>
              <span>High (2.0)</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-6 w-6 p-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm font-medium">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
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
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Additional options for enhanced accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-play Articles</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start reading when opening articles
              </p>
            </div>
            <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Highlight Reading Text</Label>
              <p className="text-sm text-muted-foreground">
                Highlight words and sentences as they are being read
              </p>
            </div>
            <Switch checked={highlightText} onCheckedChange={setHighlightText} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Pause on Punctuation</Label>
              <p className="text-sm text-muted-foreground">
                Add natural pauses at commas, periods, and other punctuation
              </p>
            </div>
            <Switch checked={pauseOnPunctuation} onCheckedChange={setPauseOnPunctuation} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">
                Use Space to play/pause, Escape to stop
              </p>
            </div>
            <Switch checked={enableShortcuts} onCheckedChange={setEnableShortcuts} />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Reset Settings</h4>
              <p className="text-sm text-muted-foreground">
                Restore all TTS settings to their default values
              </p>
            </div>
            <Button variant="outline" onClick={resetToDefaults}>
              <Zap className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <Accessibility className="h-4 w-4" />
        <AlertTitle>Accessibility Features</AlertTitle>
        <AlertDescription>
          These text-to-speech settings improve accessibility for users with visual impairments, 
          reading difficulties, or those who prefer audio content. Settings are automatically 
          saved and applied across all articles and content.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default TTSSettings