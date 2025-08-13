import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Volume2, VolumeX } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { useToast } from '@/shared/hooks/use-toast'
import { ChatMessage as ChatMessageType } from '../types'
import { cn } from '@/shared/lib/utils'

interface ChatMessageProps {
  message: ChatMessageType
  isRTL: boolean
}

export function ChatMessage({ message, isRTL }: ChatMessageProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setIsCopied(true)
      toast({
        title: t('chatbot.copied'),
        duration: 2000,
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: t('chatbot.copyError'),
        variant: 'destructive',
      })
    }
  }

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content)
        utterance.lang = message.metadata?.language || 'en-US'
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser && 'flex-row-reverse',
        isRTL && 'flex-row-reverse'
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>
          {isUser ? '👤' : message.persona?.avatar || '🤖'}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex-1 max-w-[80%]', isUser && 'flex justify-end')}>
        <Card
          className={cn(
            'p-3 relative group',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {attachment.type === 'image' && (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-xs rounded"
                    />
                  )}
                  {attachment.type === 'document' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      📄 {attachment.name}
                    </a>
                  )}
                  {attachment.type === 'location' && (
                    <span>📍 {attachment.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {!isUser && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleSpeak}
              >
                {isSpeaking ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </Card>
      </div>
    </div>
  )
}