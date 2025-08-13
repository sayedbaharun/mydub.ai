import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Activity,
  User,
  FileText,
  Shield,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { dashboardService } from '../services/dashboard.service'
import { ActivityLog } from '../types'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

const ACTIVITY_ICONS: Record<string, any> = {
  user_login: LogIn,
  user_logout: LogOut,
  user_registered: User,
  user_role_updated: Shield,
  user_suspended: XCircle,
  user_active: CheckCircle,
  content_created: FileText,
  content_updated: Edit,
  content_deleted: Trash2,
  content_approved: CheckCircle,
  content_rejected: XCircle,
  content_published: FileText,
  export_data: Download
}

const ACTIVITY_COLORS: Record<string, string> = {
  user_login: 'text-blue-600',
  user_logout: 'text-gray-600',
  user_registered: 'text-green-600',
  user_role_updated: 'text-purple-600',
  user_suspended: 'text-red-600',
  user_active: 'text-green-600',
  content_created: 'text-blue-600',
  content_updated: 'text-yellow-600',
  content_deleted: 'text-red-600',
  content_approved: 'text-green-600',
  content_rejected: 'text-red-600',
  content_published: 'text-blue-600',
  export_data: 'text-gray-600'
}

export function ActivityLogs() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true)
    
    try {
      const offset = loadMore ? page * limit : 0
      const { data, count } = await dashboardService.getActivityLogs(limit, offset)
      
      if (loadMore) {
        setLogs(prev => [...prev, ...data])
      } else {
        setLogs(data)
      }
      
      setTotalCount(count)
      setHasMore(data.length === limit)
      setPage(loadMore ? page + 1 : 1)
    } catch (error) {
      toast({
        title: t('logsLoadError'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    const Icon = ACTIVITY_ICONS[action] || Activity
    return <Icon className={cn("h-4 w-4", ACTIVITY_COLORS[action] || 'text-gray-600')} />
  }

  const getActivityDescription = (log: ActivityLog) => {
    const userLink = (
      <span className="font-medium">{log.user.fullName}</span>
    )

    switch (log.action) {
      case 'user_login':
        return <>{userLink} {t('activity.userLogin')}</>
      case 'user_logout':
        return <>{userLink} {t('activity.userLogout')}</>
      case 'user_registered':
        return <>{userLink} {t('activity.userRegistered')}</>
      case 'user_role_updated':
        return (
          <>
            {userLink} {t('activity.userRoleUpdated')}
            {log.details?.newRole && (
              <Badge variant="outline" className="ml-2">
                {t(`dashboard.role.${log.details.newRole}`)}
              </Badge>
            )}
          </>
        )
      case 'user_suspended':
        return <>{userLink} {t('activity.userSuspended')}</>
      case 'user_active':
        return <>{userLink} {t('activity.userActivated')}</>
      case 'content_created':
        return <>{userLink} {t('activity.contentCreated')}</>
      case 'content_updated':
        return <>{userLink} {t('activity.contentUpdated')}</>
      case 'content_deleted':
        return <>{userLink} {t('activity.contentDeleted')}</>
      case 'content_approved':
        return <>{userLink} {t('activity.contentApproved')}</>
      case 'content_rejected':
        return <>{userLink} {t('activity.contentRejected')}</>
      case 'content_published':
        return <>{userLink} {t('activity.contentPublished')}</>
      case 'export_data':
        return (
          <>
            {userLink} {t('activity.exportedData')}
            {log.details?.type && (
              <Badge variant="outline" className="ml-2">
                {log.details.type}
              </Badge>
            )}
          </>
        )
      default:
        return <>{userLink} {log.action.replace(/_/g, ' ')}</>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('justNow')
    if (diffMins < 60) return t('minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('daysAgo', { count: diffDays })
    
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('activityLogs')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('filter')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noActivity')}
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={log.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {log.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            {getActivityDescription(log)}
                          </div>
                        </div>
                        {log.details?.reason && (
                          <p className="text-sm text-muted-foreground pl-9">
                            {t('reason')}: {log.details.reason}
                          </p>
                        )}
                        {log.details?.comments && (
                          <p className="text-sm text-muted-foreground pl-9">
                            {t('comments')}: {log.details.comments}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pl-9">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          {log.ipAddress && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
                          {log.resource && log.resourceId && (
                            <>
                              <span>•</span>
                              <span>
                                {log.resource}: {log.resourceId.slice(0, 8)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {hasMore && !isLoading && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => loadLogs(true)}
                    className="w-full"
                  >
                    {t('loadMore')}
                  </Button>
                </div>
              )}
            </ScrollArea>

            {/* Summary info */}
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              {t('showingLogs', { count: logs.length, total: totalCount })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}