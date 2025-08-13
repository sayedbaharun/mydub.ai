import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Card } from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { PersonaSelector } from './PersonaSelector'
import { QuickActions } from './QuickActions'
import { ChatMessage as ChatMessageType, AIPersona, QuickAction } from '../types'
import { chatService } from '../services/chat.service'
import { getDefaultPersona } from '../data/personas'
import { useToast } from '@/shared/hooks/use-toast'
import { useRTL } from '@/shared/hooks/useRTL'

interface ChatWindowProps {
  sessionId?: string
  onNewSession?: (sessionId: string) => void
}

export function ChatWindow({ sessionId, onNewSession }: ChatWindowProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const { isRTL } = useRTL()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)
  const [selectedPersona, setSelectedPersona] = useState<AIPersona>(getDefaultPersona())
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Load session messages
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages()
    }
  }, [currentSessionId])

  // Update quick actions when persona changes
  useEffect(() => {
    const actions = chatService.getQuickActions(selectedPersona.id, i18n.language)
    setQuickActions(actions)
  }, [selectedPersona, i18n.language])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const loadSessionMessages = async () => {
    if (!currentSessionId) return
    
    try {
      const sessionMessages = await chatService.getSessionMessages(currentSessionId)
      setMessages(sessionMessages)
    } catch (error) {
      toast({
        title: t('chatbot.loadError'),
        variant: 'destructive',
      })
    }
  }

  const createNewSession = async () => {
    if (!user) return
    
    try {
      const session = await chatService.createSession(user.id, selectedPersona.id)
      setCurrentSessionId(session.id)
      onNewSession?.(session.id)
      
      // Add welcome message
      const welcomeMessage: ChatMessageType = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: i18n.language === 'ar' ? selectedPersona.greetingAr : selectedPersona.greeting,
        timestamp: new Date().toISOString(),
        persona: selectedPersona,
      }
      setMessages([welcomeMessage])
    } catch (error) {
      toast({
        title: t('chatbot.sessionError'),
        variant: 'destructive',
      })
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!user) {
      toast({
        title: t('chatbot.loginRequired'),
        variant: 'destructive',
      })
      return
    }

    // Create session if needed
    if (!currentSessionId) {
      await createNewSession()
      if (!currentSessionId) return
    }

    setIsLoading(true)
    setIsTyping(true)

    try {
      // Add user message to UI immediately
      const tempUserMessage: ChatMessageType = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, tempUserMessage])

      // Send message and get response
      const { userMessage, aiMessage } = await chatService.sendMessage(
        currentSessionId!,
        content,
        selectedPersona.id,
        i18n.language
      )

      // Update messages with actual IDs
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempUserMessage.id)
        return [...filtered, userMessage, { ...aiMessage, persona: selectedPersona }]
      })
    } catch (error) {
      toast({
        title: t('chatbot.sendError'),
        variant: 'destructive',
      })
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.action)
  }

  const handlePersonaChange = async (persona: AIPersona) => {
    setSelectedPersona(persona)
    
    // Create new session with new persona
    if (user) {
      await createNewSession()
    }
  }

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      <div className="p-4 border-b">
        <PersonaSelector
          selectedPersona={selectedPersona}
          onPersonaChange={handlePersonaChange}
          isRTL={isRTL}
        />
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-2">
              {i18n.language === 'ar' ? selectedPersona.greetingAr : selectedPersona.greeting}
            </p>
            <p className="text-sm">
              {t('chatbot.startConversation')}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isRTL={isRTL}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span className="text-sm">{t('chatbot.typing')}</span>
          </div>
        )}
      </ScrollArea>

      {quickActions.length > 0 && messages.length === 0 && (
        <QuickActions
          actions={quickActions}
          onActionClick={handleQuickAction}
          isRTL={isRTL}
        />
      )}

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isRTL={isRTL}
        placeholder={i18n.language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
      />
    </Card>
  )
}