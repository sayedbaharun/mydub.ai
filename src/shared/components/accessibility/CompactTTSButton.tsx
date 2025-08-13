/**
 * Compact Text-to-Speech Button for MyDub.ai
 * Lightweight TTS control for use in cards, lists, and compact layouts
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { 
  Play, 
  Pause, 
  Square,
  Volume2,
  VolumeX,
  Headphones,
  Loader2
} from 'lucide-react'
import { ttsService, TTSProgress } from '@/shared/services/text-to-speech.service'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface CompactTTSButtonProps {
  text: string
  title?: string
  language?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showProgress?: boolean
  autoStop?: boolean // Stop when component unmounts
}

export function CompactTTSButton({
  text,
  title,
  language = 'en',
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
  showProgress = false,
  autoStop = true
}: CompactTTSButtonProps) {
  const { announce } = useScreenReader()
  const { toast } = useToast()
  
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoStop && (isPlaying || isPaused)) {
        ttsService.stop()
      }
    }
  }, [autoStop, isPlaying, isPaused])

  // Progress tracking
  const setupProgressTracking = useCallback(() => {
    return ttsService.onProgress((newProgress) => {
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
      
      // Stop any other playing content
      ttsService.stop()
      
      const fullText = title ? `${title}. ${text}` : text
      announce(`Reading ${title || 'content'}`, 'polite')

      const ttsOptions = {
        language: language,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      }

      ttsService.updateSettings(ttsOptions)
      
      if (showProgress) {
        setupProgressTracking()
      }

      // Handle resume or new playback
      if (isPaused) {
        ttsService.resume()
        setIsPaused(false)
        announce('Resumed', 'polite')
      } else {
        await ttsService.speak(fullText, ttsOptions)
        announce('Playback completed', 'polite')
        setIsPlaying(false)
        setIsPaused(false)
      }

      setIsPlaying(true)
    } catch (error) {
      console.error('TTS playback error:', error)
      toast({
        title: 'Playback Error',
        description: 'Failed to start text-to-speech.',
        variant: 'destructive'
      })
      setIsPlaying(false)
      setIsPaused(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = () => {
    ttsService.pause()
    setIsPaused(true)
    setIsPlaying(false)
    announce('Paused', 'polite')
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
    announce('Stopped', 'polite')
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8'
      case 'lg': return 'h-12 w-12'
      default: return 'h-10 w-10'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3'
      case 'lg': return 'h-5 w-5'
      default: return 'h-4 w-4'
    }
  }

  if (!ttsService.isSupported()) {
    return (
      <Badge variant="outline" className={cn('text-xs text-gray-400', className)}>
        <VolumeX className="h-3 w-3 mr-1" />
        TTS N/A
      </Badge>
    )
  }

  const renderButton = () => (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        !showLabel && getButtonSize(),
        'relative overflow-hidden',
        className
      )}
      onClick={isPlaying ? handlePause : handlePlay}
      disabled={isLoading}
      aria-label={
        isLoading ? 'Loading...' :
        isPlaying ? 'Pause reading' :
        isPaused ? 'Resume reading' :
        `Read ${title || 'content'} aloud`
      }
      title={
        isLoading ? 'Loading...' :
        isPlaying ? 'Pause reading' :
        isPaused ? 'Resume reading' :
        `Read ${title || 'content'} aloud`
      }
    >
      {/* Progress background for visual feedback */}
      {showProgress && progress.progress > 0 && (
        <div 
          className="absolute inset-0 bg-blue-100 transition-all duration-300 ease-out"
          style={{ width: `${progress.progress}%` }}
        />
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <Loader2 className={cn(getIconSize(), 'animate-spin')} />
        ) : isPlaying ? (
          <Pause className={getIconSize()} />
        ) : (
          <Play className={getIconSize()} />
        )}
        
        {showLabel && (
          <span className="text-sm font-medium">
            {isLoading ? 'Loading...' :
             isPlaying ? 'Pause' :
             isPaused ? 'Resume' :
             'Listen'}
          </span>
        )}
      </div>
    </Button>
  )

  const renderControls = () => (
    <div className="flex items-center gap-1">
      {renderButton()}
      
      {(isPlaying || isPaused) && (
        <Button
          variant="ghost"
          size="sm"
          className={getButtonSize()}
          onClick={handleStop}
          aria-label="Stop reading"
          title="Stop reading"
        >
          <Square className={getIconSize()} />
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {(isPlaying || isPaused) && !showLabel ? renderControls() : renderButton()}
      
      {showProgress && progress.totalWords > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Headphones className="h-3 w-3" />
          <span>{progress.currentWord + 1}/{progress.totalWords}</span>
        </div>
      )}
    </div>
  )
}

export default CompactTTSButton