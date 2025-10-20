import { formatDistanceToNow, isValid } from 'date-fns'
import { 
  Clock, 
  Eye, 
  Play, 
  Share2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { IntelligenceCard } from '@/shared/components/ui/intelligence-card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { CompactTTSButton } from '@/shared/components/accessibility/CompactTTSButton'
import { BookmarkButton } from '@/shared/components/BookmarkButton'
import { AIDisclosureBadge } from '@/shared/components/ai/AIDisclosureBadge'
import { WhyAmISeeingThis } from '@/features/transparency/components/WhyAmISeeingThis'
import { NewsArticle } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getCategoryName } from '@/shared/utils/categoryFormatter'

interface NewsArticleCardProps {
  article: NewsArticle
  variant?: 'default' | 'compact' | 'featured' | 'clean'
  onArticleClick?: (article: NewsArticle) => void
}

export function NewsArticleCard({ 
  article, 
  variant = 'default',
  onArticleClick 
}: NewsArticleCardProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // Safe date formatting helper
  const formatSafeDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput)
      if (!isValid(date)) {
        return t('common.invalidDate', 'Invalid date')
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return t('common.invalidDate', 'Invalid date')
    }
  }


  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }


  // For compact variant, render a simpler card
  if (variant === 'compact') {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onArticleClick?.(article)}
      >
        <div className={cn(
          "flex gap-4",
          isRTL && "flex-row-reverse"
        )}>
          {article.imageUrl && (
            <div className="relative w-20 h-20 shrink-0">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover rounded-lg"
              />
              {article.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <Play className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-sm line-clamp-2 mb-1",
              isRTL && "text-right"
            )}>
              {isRTL && article.titleAr ? article.titleAr : article.title}
            </h3>
            <div className={cn(
              "flex items-center gap-2 text-xs text-gray-500",
              isRTL && "flex-row-reverse"
            )}>
              <span>{isRTL ? article.source?.nameAr : article.source?.name || 'Unknown Source'}</span>
              <span>•</span>
              <span>{formatSafeDate(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Clean variant - Jony Ive inspired minimal design
  if (variant === 'clean') {
    return (
      <article
        className="group cursor-pointer transition-all duration-300 hover:opacity-95"
        onClick={() => onArticleClick?.(article)}
      >
        {article.imageUrl && (
          <div className="relative overflow-hidden rounded-lg mb-4 bg-gray-50">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {article.aiMetadata && (
              <div className="absolute top-3 right-3">
                <AIDisclosureBadge
                  variant="compact"
                  sourcesAnalyzed={article.aiMetadata.sourcesAnalyzed}
                  confidenceScore={article.aiMetadata.confidenceScore}
                  humanReviewed={article.aiMetadata.humanReviewed}
                  generatedAt={article.aiMetadata.generatedAt}
                />
              </div>
            )}
          </div>
        )}
        
        <div className={cn("space-y-3", isRTL && "text-right")}>
          <div className={cn(
            "flex items-center gap-2 text-xs text-gray-500",
            isRTL && "flex-row-reverse justify-end"
          )}>
            <span className="font-medium">
              {isRTL ? article.source?.nameAr : article.source?.name || 'Unknown Source'}
            </span>
            <span>•</span>
            <time>{formatSafeDate(article.publishedAt)}</time>
          </div>
          
          <h3 className={cn(
            "font-medium text-lg leading-tight text-midnight-black tracking-tight line-clamp-2 group-hover:text-gray-700 transition-colors",
            isRTL && "text-right"
          )}>
            {isRTL && article.titleAr ? article.titleAr : article.title}
          </h3>
          
          {article.summary && (
            <p className={cn(
              "text-gray-500 text-sm leading-relaxed line-clamp-2",
              isRTL && "text-right"
            )}>
              {isRTL && article.summaryAr ? article.summaryAr : article.summary}
            </p>
          )}
        </div>
      </article>
    )
  }

  // Enhanced modern card design with IntelligenceCard
  const enhancedCard = (
    <IntelligenceCard
      variant="default"
      title={isRTL && article.titleAr ? article.titleAr : article.title}
      description={isRTL && article.summaryAr ? article.summaryAr : article.summary}
      image={article.imageUrl}
      imageAlt={article.title}
      category={getCategoryName(article.category, t)}
      date={formatSafeDate(article.publishedAt)}
      author={article.author}
      href={`/news/${article.id}`}
      onClick={() => onArticleClick?.(article)}
      // Intelligence metadata
      aiGenerated={!!article.aiMetadata}
      confidenceScore={article.aiMetadata?.confidenceScore}
      sourcesAnalyzed={article.aiMetadata?.sourcesAnalyzed}
      viewCount={article.viewCount}
      readTime={article.readTime}
      sentiment={article.sentiment}
      trending={article.isBreaking}
    >
      {/* Action buttons as custom children */}
      <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
        <CompactTTSButton
          text={`${article.title}. ${article.summary || ''}`}
          title={article.title}
          language="en"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        />
        <BookmarkButton
          contentId={article.id}
          contentType="article"
          title={article.title}
          description={article.summary}
          imageUrl={article.imageUrl}
          url={article.url}
          variant="icon"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <WhyAmISeeingThis article={article} variant="icon" className="h-8 w-8 p-0" />
      </div>
    </IntelligenceCard>
  )

  // For featured variant, use IntelligenceCard's featured variant
  if (variant === 'featured') {
    return (
      <IntelligenceCard
        variant="featured"
        title={isRTL && article.titleAr ? article.titleAr : article.title}
        description={isRTL && article.summaryAr ? article.summaryAr : article.summary}
        image={article.imageUrl}
        imageAlt={article.title}
        category={getCategoryName(article.category, t)}
        date={formatSafeDate(article.publishedAt)}
        author={article.author}
        href={`/news/${article.id}`}
        onClick={() => onArticleClick?.(article)}
        aiGenerated={!!article.aiMetadata}
        confidenceScore={article.aiMetadata?.confidenceScore}
        sourcesAnalyzed={article.aiMetadata?.sourcesAnalyzed}
        viewCount={article.viewCount}
        readTime={article.readTime}
        sentiment={article.sentiment}
        trending={article.isBreaking}
      >
        <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
          <CompactTTSButton
            text={`${article.title}. ${article.summary || ''}`}
            title={article.title}
            language="en"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          />
          <BookmarkButton
            contentId={article.id}
            contentType="article"
            title={article.title}
            description={article.summary}
            imageUrl={article.imageUrl}
            url={article.url}
            variant="icon"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <WhyAmISeeingThis article={article} variant="icon" className="h-8 w-8 p-0" />
        </div>
      </IntelligenceCard>
    )
  }

  return enhancedCard
}