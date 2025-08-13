import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowLeft, 
  Newspaper, 
  User, 
  Calendar,
  ExternalLink,
  Share2,
  Bookmark,
  Flag,
  Clock
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { TextToSpeechPlayer } from '@/shared/components/accessibility/TextToSpeechPlayer'
import { NewsArticle } from '@/features/news/types'
import { NewsService } from '@/features/news/services/news.service'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import { useArticleStructuredData } from '@/hooks/useStructuredData'

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const fetchedArticle = await NewsService.getArticleById(id)
        
        if (fetchedArticle) {
          setArticle(fetchedArticle)
          document.title = fetchedArticle.title
        } else {
          setError('Article not found')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load article')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  // Add structured data for SEO when article is loaded
  useArticleStructuredData(article ? {
    title: article.title,
    description: article.summary || article.content.substring(0, 160),
    imageUrl: article.imageUrl,
    publishedDate: article.createdAt || new Date().toISOString(),
    modifiedDate: article.updatedAt,
    author: article.author,
    section: article.category,
    keywords: article.tags
  } : {
    title: '',
    description: '',
    publishedDate: new Date().toISOString()
  })

  const handleShare = async () => {
    if (!article) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Save bookmark to user preferences
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" text="Loading article..." />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The news article you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate('/news')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/news')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to News
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="gap-2 bg-blue-100 text-blue-800">
                <Newspaper className="h-3 w-3" />
                News Article
              </Badge>
              <Badge variant="secondary">{article.category}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
            <p className="text-xl text-muted-foreground mt-2">{article.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Article Meta */}
      <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
        {article.author && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>By {article.author}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          <span>{article.source.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{article.readTime} min read</span>
        </div>
      </div>

      {/* Content Image */}
      {article.imageUrl && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Text-to-Speech Player */}
      <div className="mb-8">
        <TextToSpeechPlayer
          text={`${article.title}. ${article.summary}. ${article.content || ''}`}
          title={article.title}
          author={article.author}
          language="en"
          showFullControls={true}
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none mb-8">
        <div className="whitespace-pre-wrap leading-relaxed text-foreground">
          {article.content || article.summary}
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Article Stats */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{article.viewCount} views</span>
            {article.sentiment && (
              <span>Sentiment: {article.sentiment}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {article.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Original Source
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Source Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About the Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{article.source.name}</h4>
              {article.source.website && (
                <p className="text-sm text-muted-foreground">{article.source.website}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Credibility Score</div>
              <div className="text-lg font-semibold">
                {Math.round(article.source.credibility * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NewsDetailPage