import { useState } from 'react'
import { format, isValid } from 'date-fns'
import { 
  AlertCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Eye, 
  FileText,
  Image as ImageIcon,
  Video,
  File
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { GovernmentUpdate } from '../types'
import { GovernmentService } from '../services/government.service'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface GovernmentUpdateCardProps {
  update: GovernmentUpdate
  variant?: 'default' | 'clean'
  onRefresh?: () => void
}

export function GovernmentUpdateCard({ update, variant = 'default' }: GovernmentUpdateCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const { t, i18n } = useTranslation('government')
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // Safe date formatting helper
  const formatSafeDate = (dateString: string, formatStr: string = 'PP') => {
    try {
      const date = new Date(dateString)
      if (!isValid(date)) {
        return t('common.invalidDate', 'Invalid date')
      }
      return format(date, formatStr)
    } catch (error) {
      return t('common.invalidDate', 'Invalid date')
    }
  }

  const renderIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any
    return Icon ? <Icon className="h-4 w-4" /> : null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <AlertCircle className="h-4 w-4" />
      case 'policy':
        return <FileText className="h-4 w-4" />
      case 'service':
        return <Icons.Settings className="h-4 w-4" />
      case 'alert':
        return <Icons.AlertTriangle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const handleDownload = async (attachmentId: string, attachmentName: string) => {
    try {
      setDownloading(attachmentId)
      const { blob, filename } = await GovernmentService.downloadAttachment(attachmentId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('attachmentDownloaded', { name: attachmentName }))
    } catch (error) {
      toast.error(t('downloadError'))
      console.error('Download error:', error)
    } finally {
      setDownloading(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className={cn(
          "flex items-start justify-between gap-4",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-start gap-3 flex-1",
            isRTL && "flex-row-reverse"
          )}>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: `${update.department.color}20` }}
            >
              <div style={{ color: update.department.color }}>
                {renderIcon(update.department.icon)}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className={cn(
                "font-semibold text-lg leading-tight",
                isRTL && "text-right"
              )}>
                {isRTL && update.titleAr ? update.titleAr : update.title}
              </h3>
              <div className={cn(
                "flex items-center gap-2 text-sm text-muted-foreground",
                isRTL && "flex-row-reverse"
              )}>
                <span>{isRTL ? update.department.nameAr : update.department.name}</span>
                <span>•</span>
                <div className={cn(
                  "flex items-center gap-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{formatSafeDate(update.publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            {update.priority && (
              <Badge className={getPriorityColor(update.priority)}>
                {t(`government.priority.${update.priority}`)}
              </Badge>
            )}
            {update.isOfficial && (
              <Badge variant="secondary">
                {t('official')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className={cn(
          "flex items-center gap-2 mb-3",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isRTL && "flex-row-reverse"
          )}>
            {getCategoryIcon(update.category)}
            <span>{t(`government.category.${update.category}`)}</span>
          </div>
          {(update.viewCount || 0) > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className={cn(
                "flex items-center gap-1 text-sm text-muted-foreground",
                isRTL && "flex-row-reverse"
              )}>
                <Eye className="h-3 w-3" />
                <span>{(update.viewCount || 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        <p className={cn(
          "text-sm text-muted-foreground line-clamp-3",
          expanded && "line-clamp-none",
          isRTL && "text-right"
        )}>
          {isRTL && update.contentAr ? update.contentAr : update.content}
        </p>

        {(update.content?.length || 0) > 200 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "mt-2 h-8 text-xs",
              isRTL && "flex-row-reverse"
            )}
          >
            {expanded ? (
              <>
                {t('common.showLess')}
                <ChevronUp className={cn(
                  "ml-1 h-3 w-3",
                  isRTL && "ml-0 mr-1"
                )} />
              </>
            ) : (
              <>
                {t('common.showMore')}
                <ChevronDown className={cn(
                  "ml-1 h-3 w-3",
                  isRTL && "ml-0 mr-1"
                )} />
              </>
            )}
          </Button>
        )}

        {update.tags && update.tags.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-3",
            isRTL && "flex-row-reverse"
          )}>
            {update.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {update.attachments && update.attachments.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              <h4 className={cn(
                "text-sm font-medium",
                isRTL && "text-right"
              )}>
                {t('attachments')}
              </h4>
              <div className="space-y-1">
                {update.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md bg-muted/50",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      {getAttachmentIcon(attachment.type)}
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          isRTL && "text-right"
                        )}>
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.id, attachment.name)}
                      disabled={downloading === attachment.id}
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {update.expiresAt && (
          <div className={cn(
            "mt-3 flex items-center gap-1 text-xs text-muted-foreground",
            isRTL && "flex-row-reverse"
          )}>
            <Icons.Clock className="h-3 w-3" />
            <span>
              {t('expiresOn', { 
                date: format(new Date(update.expiresAt), 'PP') 
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}