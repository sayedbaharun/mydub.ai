import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Bot, Menu } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet'
import { ChatWindow } from '../components/ChatWindow'
import { ChatSidebar } from '../components/ChatSidebar'
import { useRTL } from '@/shared/hooks/useRTL'
import { useIsMobile } from '@/shared/hooks/use-mobile'

export function ChatbotPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isRTL } = useRTL()
  const isMobile = useIsMobile()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNewSession = () => {
    setCurrentSessionId(null)
    setSidebarOpen(false)
  }

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setSidebarOpen(false)
  }

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('chatbot.loginRequired')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('chatbot.loginDescription')}
        </p>
        <Button onClick={() => window.location.href = '/auth/signin'}>
          {t('auth.signIn')}
        </Button>
      </div>
    )
  }

  const sidebar = (
    <ChatSidebar
      currentSessionId={currentSessionId}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      isRTL={isRTL}
    />
  )

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-10 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex-1 p-4">
            <ChatWindow
              sessionId={currentSessionId || undefined}
              onNewSession={handleSessionCreated}
            />
          </div>
        </>
      ) : (
        <>
          {sidebar}
          <div className="flex-1 p-4">
            <ChatWindow
              sessionId={currentSessionId || undefined}
              onNewSession={handleSessionCreated}
            />
          </div>
        </>
      )}
    </div>
  )
}