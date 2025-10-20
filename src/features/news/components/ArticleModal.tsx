import { useEffect, useState } from 'react'
import { format, isValid } from 'date-fns'
import { 
  X, 
  Clock, 
  Eye, 
  Globe, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { NewsArticle } from '../types'
import { NewsArticleCard } from './NewsArticleCard'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import { getCategoryName } from '@/shared/utils/categoryFormatter'
import { toast } from 'sonner'

interface ArticleModalProps {
  article: NewsArticle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArticleModal({ article, open, onOpenChange }: ArticleModalProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // Safe date formatting helper
  const formatSafeDate = (dateInput: string | Date, formatStr: string = 'PPP') => {
    try {
      const date = new Date(dateInput)
      if (!isValid(date)) {
        return t('common.invalidDate', 'Invalid date')
      }
      return format(date, formatStr)
    } catch (error) {
      return t('common.invalidDate', 'Invalid date')
    }
  }

  useEffect(() => {
    if (article && open) {
      loadRelatedArticles()
    }
  }, [article, open])

  const loadRelatedArticles = async () => {
    if (!article) return
    
    setLoadingRelated(true)
    try {
      const related: NewsArticle[] = []
      setRelatedArticles(related)
    } catch (error) {
      console.error('Error loading related articles:', error)
    } finally {
      setLoadingRelated(false)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(
      isBookmarked 
        ? t('bookmarkRemoved') 
        : t('bookmarkAdded')
    )
  }

  const handleShare = async () => {
    if (!article) return
    
    try {
      await navigator.share({
        title: article.title,
        text: article.summary,
        url: `${window.location.origin}/news/${article.id}`
      })
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/news/${article.id}`)
      toast.success(t('common.linkCopied'))
    }
  }

  const openOriginal = () => {
    if (article?.source.website) {
      window.open(article.source.website, '_blank')
    }
  }

  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className={cn(
            "flex items-start justify-between gap-4",
            isRTL && "flex-row-reverse"
          )}>
            <DialogTitle className={cn(
              "text-2xl font-bold pr-8",
              isRTL && "text-right pl-8 pr-0"
            )}>
              {isRTL && article.titleAr ? article.titleAr : article.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className={cn(
            "flex items-center gap-4 mt-4 text-sm text-muted-foreground",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              {article.source?.logo ? (
                <img 
                  src={article.source.logo} 
                  alt={article.source?.name || 'News Source'}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <Globe className="h-5 w-5" />
              )}
              <span className="font-medium">
                {isRTL ? article.source?.nameAr : article.source?.name || 'Unknown Source'}
              </span>
            </div>
            <span>•</span>
            <span>{formatSafeDate(article.publishedAt)}</span>
            {article.author && (
              <>
                <span>•</span>
                <span>{t('by')} {article.author}</span>
              </>
            )}
          </div>

          <div className={cn(
            "flex items-center gap-2 mt-3",
            isRTL && "flex-row-reverse"
          )}>
            <Badge variant="secondary">
              {getCategoryName(article.category, t)}
            </Badge>
            {article.aiSummary && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {t('aiSummary')}
              </Badge>
            )}
            <div className={cn(
              "flex items-center gap-3 ml-auto text-sm text-muted-foreground",
              isRTL && "flex-row-reverse ml-0 mr-auto"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <Clock className="h-4 w-4" />
                <span>{article.readTime} {t('common.min')}</span>
              </div>
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <Eye className="h-4 w-4" />
                <span>{(article.viewCount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {article.imageUrl && (
            <div className="relative aspect-video mb-6 rounded-lg overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {article.aiSummary && (
            <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
              <div className={cn(
                "flex items-center gap-2 mb-2",
                isRTL && "flex-row-reverse"
              )}>
                <Sparkles className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">{t('aiSummaryTitle')}</h3>
              </div>
              <p className={cn(
                "text-sm",
                isRTL && "text-right"
              )}>
                {isRTL && article.aiSummaryAr ? article.aiSummaryAr : article.aiSummary}
              </p>
            </div>
          )}

          <div className={cn(
            "prose prose-sm max-w-none",
            isRTL && "prose-rtl"
          )}>
            <p className="lead">
              {isRTL && article.summaryAr ? article.summaryAr : article.summary}
            </p>
            <div dangerouslySetInnerHTML={{ 
              __html: isRTL && article.contentAr ? article.contentAr : article.content 
            }} />
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-6">
              <h3 className={cn(
                "font-semibold mb-2",
                isRTL && "text-right"
              )}>
                {t('tags')}
              </h3>
              <div className={cn(
                "flex flex-wrap gap-2",
                isRTL && "flex-row-reverse"
              )}>
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          <div className="mb-6">
            <h3 className={cn(
              "font-semibold mb-4",
              isRTL && "text-right"
            )}>
              {t('relatedArticles')}
            </h3>
            {loadingRelated ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : relatedArticles.length > 0 ? (
              <div className="space-y-3">
                {relatedArticles.map((related) => (
                  <NewsArticleCard
                    key={related.id}
                    article={related}
                    variant="compact"
                    onArticleClick={(_article) => {
                      // Update modal with new article
                      onOpenChange(false)
                      setTimeout(() => {
                        onOpenChange(true)
                      }, 100)
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className={cn(
                "text-sm text-muted-foreground",
                isRTL && "text-right"
              )}>
                {t('noRelatedArticles')}
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-0">
          <Separator className="mb-4" />
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Button
                variant="outline"
                onClick={handleBookmark}
                className={cn(
                  "gap-2",
                  isRTL && "flex-row-reverse"
                )}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isBookmarked ? t('bookmarked') : t('bookmark')}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className={cn(
                  "gap-2",
                  isRTL && "flex-row-reverse"
                )}
              >
                <Share2 className="h-4 w-4" />
                {t('common.share')}
              </Button>
            </div>
            <Button
              onClick={openOriginal}
              className={cn(
                "gap-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              {t('readOriginal')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}