import { useState, useRef, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Paperclip, Mic, MicOff, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void
  isLoading: boolean
  isRTL: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  isRTL,
  placeholder 
}: ChatInputProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)
      
      if (!isValidSize) {
        toast({
          title: t('chatbot.fileTooLarge'),
          description: t('chatbot.maxFileSize'),
          variant: 'destructive',
        })
      }
      
      if (!isValidType) {
        toast({
          title: t('chatbot.invalidFileType'),
          description: t('chatbot.allowedFileTypes'),
          variant: 'destructive',
        })
      }
      
      return isValidSize && isValidType
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const chunks: Blob[] = []

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data)
        }

        mediaRecorder.onstop = () => {
          // Here you would typically send the audio to a speech-to-text service
          // For now, we'll just show a message
          toast({
            title: t('chatbot.voiceRecorded'),
            description: t('chatbot.voiceProcessing'),
          })
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
      } catch (error) {
        toast({
          title: t('chatbot.microphoneError'),
          description: t('chatbot.microphonePermission'),
          variant: 'destructive',
        })
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
    }
  }

  return (
    <div className="border-t p-4">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('chatbot.typeMessage')}
            className={cn(
              "min-h-[60px] max-h-[200px] resize-none pr-10",
              isRTL && "text-right"
            )}
            disabled={isLoading}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <Button
          size="icon"
          variant={isRecording ? "destructive" : "outline"}
          onClick={toggleRecording}
          disabled={isLoading}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="icon"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
        >
          <Send className={cn("h-4 w-4", isRTL && "rotate-180")} />
        </Button>
      </div>
    </div>
  )
}