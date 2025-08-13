import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Filter, RefreshCw, Search, TrendingUp, Video } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { SourceFilter, SourceBadges } from '../components/SourceFilter'
import { DateRangePicker } from '@/features/government/components/DateRangePicker'
import { NewsArticleCard } from '../components/NewsArticleCard'
import { NewsService } from '../services/news.service'
import { NewsArticle, NewsFilters } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'

const ITEMS_PER_PAGE = 12

function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // State
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [trendingArticles, setTrendingArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filters, setFilters] = useState<NewsFilters>({
    sources: searchParams.get('sources')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('category') ? [searchParams.get('category')!] : [],
    dateRange: {
      start: null,
      end: null,
    },
    sentiment: searchParams.get('sentiment') || undefined,
    hasVideo: searchParams.get('video') === 'true' ? true : undefined,
    search: searchParams.get('search') || '',
  })

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load articles
  const loadArticles = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
        setPage(1)
        setHasMore(true)
      } else {
        setLoading(true)
      }

      const data = await NewsService.getArticles(filters)
      
      if (isRefresh || page === 1) {
        setArticles(data)
      } else {
        setArticles(prev => [...prev, ...data])
      }

      setHasMore(data.length === ITEMS_PER_PAGE)
    } catch (error) {
      toast.error(t('loadError'))
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load trending articles
  const loadTrendingArticles = async () => {
    try {
      setLoadingTrending(true)
      const data = await NewsService.getTrendingArticles(5)
      setTrendingArticles(data)
    } catch (error) {
      console.error('Error loading trending articles:', error)
    } finally {
      setLoadingTrending(false)
    }
  }

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.sources.length > 0) {
      params.set('sources', filters.sources.join(','))
    }
    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0])
    }
    if (filters.sentiment) {
      params.set('sentiment', filters.sentiment)
    }
    if (filters.hasVideo !== undefined) {
      params.set('video', filters.hasVideo.toString())
    }
    if (filters.search) {
      params.set('search', filters.search)
    }

    setSearchParams(params)
  }, [filters, setSearchParams])

  // Load data on mount and filter change
  useEffect(() => {
    loadArticles()
    loadTrendingArticles()
  }, [filters])

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }, [inView, hasMore, loading])

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      unsubscribe = await NewsService.subscribeToArticles((article) => {
        setArticles(prev => [article, ...prev])
        toast.info(t('newArticle', { 
          source: isRTL ? (article.source?.nameAr || 'Unknown Source') : (article.source?.name || 'Unknown Source')
        }))
      })
    }

    setupSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [t, isRTL])

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: category === 'all' ? [] : [category],
    }))
  }

  const handleSentimentChange = (sentiment: string) => {
    setFilters(prev => ({
      ...prev,
      sentiment: sentiment === 'all' ? undefined : sentiment,
    }))
  }

  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }))
  }

  const removeSource = (sourceId: string) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.filter(id => id !== sourceId),
    }))
  }

  const handleArticleClick = (article: NewsArticle) => {
    navigate(`/news/${article.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Clean Header */}
        <div className="mb-12">
          <h1 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-light text-midnight-black tracking-tight mb-2",
            isRTL && "text-right"
          )}>
            Today in Dubai
          </h1>
          <p className={cn(
            "text-base text-gray-500",
            isRTL && "text-right"
          )}>
            Latest news and updates
          </p>
        </div>

        {/* Featured Articles */}
        {trendingArticles.length > 0 && (
          <div className="mb-20">
            <div className={cn(
              "mb-8",
              isRTL && "text-right"
            )}>
              <h2 className="text-xl font-light text-midnight-black tracking-tight mb-2">Featured stories</h2>
              <p className="text-sm text-gray-500">Most important news today</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {loadingTrending ? (
                <div className="col-span-full flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : (
                trendingArticles.slice(0, 6).map((article) => (
                  <NewsArticleCard
                    key={article.id}
                    article={article}
                    variant="clean"
                    onArticleClick={handleArticleClick}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Simple Search */}
        <div className={cn(
          "mb-8",
          isRTL && "text-right"
        )}>
          <div className="relative max-w-md">
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
              isRTL && "left-auto right-4"
            )} />
            <Input
              placeholder="Search articles..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                "pl-12 h-12 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:border-gray-300 shadow-sm",
                isRTL && "pl-4 pr-12"
              )}
            />
          </div>
        </div>


        {/* Simple Category Filters */}
        <div className={cn(
          "mb-12 flex flex-wrap gap-2",
          isRTL && "flex-row-reverse justify-end"
        )}>
          {[
            { value: 'all', label: 'All' },
            { value: 'local', label: 'Local' },
            { value: 'business', label: 'Business' },
            { value: 'technology', label: 'Technology' },
            { value: 'sports', label: 'Sports' },
            { value: 'lifestyle', label: 'Lifestyle' }
          ].map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                (filters.categories[0] || 'all') === category.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Clean Articles Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading && page === 1 ? (
            <div className="col-span-full flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : articles.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500">No articles found</p>
            </div>
          ) : (
            <>
              {articles.map((article) => (
                <NewsArticleCard
                  key={article.id}
                  article={article}
                  variant="clean"
                  onArticleClick={handleArticleClick}
                />
              ))}
              {hasMore && (
                <div ref={loadMoreRef} className="col-span-full flex justify-center py-8">
                  {loading && <LoadingSpinner />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export { NewsPage }
export default NewsPage