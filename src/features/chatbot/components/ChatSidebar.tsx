import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/context/AuthContext'
import { MessageSquare, Plus, Trash2, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { ChatSession } from '../types'
import { chatService } from '../services/chat.service'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface ChatSidebarProps {
  currentSessionId?: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  isRTL: boolean
}

export function ChatSidebar({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  
}: ChatSidebarProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userSessions = await chatService.getUserSessions(user.id)
      setSessions(userSessions)
    } catch (error) {
      toast({
        title: t('chatbot.loadSessionsError'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return
    
    try {
      await chatService.deleteSession(deleteSessionId)
      setSessions(prev => prev.filter(s => s.id !== deleteSessionId))
      
      if (currentSessionId === deleteSessionId) {
        onNewSession()
      }
      
      toast({
        title: t('chatbot.sessionDeleted'),
      })
    } catch (error) {
      toast({
        title: t('chatbot.deleteError'),
        variant: 'destructive',
      })
    } finally {
      setDeleteSessionId(null)
    }
  }

  const handleExportSession = async (sessionId: string) => {
    try {
      const exportText = await chatService.exportChatHistory(sessionId)
      const blob = new Blob([exportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-export-${sessionId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: t('chatbot.exportSuccess'),
      })
    } catch (error) {
      toast({
        title: t('chatbot.exportError'),
        variant: 'destructive',
      })
    }
  }

  const formatSessionDate = (date: string) => {
    const sessionDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (sessionDate.toDateString() === today.toDateString()) {
      return t('chatbot.today')
    } else if (sessionDate.toDateString() === yesterday.toDateString()) {
      return t('chatbot.yesterday')
    } else {
      return sessionDate.toLocaleDateString(i18n.language)
    }
  }

  return (
    <>
      <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
        <div className="p-4 border-b">
          <Button
            onClick={onNewSession}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('chatbot.newChat')}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                {t('common.loading')}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {t('chatbot.noSessions')}
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative rounded-md hover:bg-accent transition-colors",
                      currentSessionId === session.id && "bg-accent"
                    )}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-1.5 h-auto"
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium line-clamp-1">
                          {i18n.language === 'ar' ? session.title : session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSessionDate(session.updatedAt)}
                        </p>
                      </div>
                    </Button>
                    
                    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportSession(session.id)
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteSessionId(session.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chatbot.deleteSessionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chatbot.deleteSessionDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}