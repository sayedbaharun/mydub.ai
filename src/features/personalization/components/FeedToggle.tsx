/**
 * Feed Toggle Component
 * Phase 3.1.2: Toggle between personalized and latest feeds
 */

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { IntelligenceCard } from '@/shared/components/ui/intelligence-card'
import { Sparkles, Clock, Loader2 } from 'lucide-react'
import { usePersonalizedFeed, FeedMode } from '../hooks/usePersonalizedFeed'
import { useTranslation } from 'react-i18next'
import { getCategoryName } from '@/shared/utils/categoryFormatter'
import { supabase } from '@/shared/lib/supabase'
import { useEffect } from 'react'

export function FeedToggle() {
  const { t } = useTranslation('common')
  const [feedMode, setFeedMode] = useState<FeedMode>('latest')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { articles, loading, trackClick } = usePersonalizedFeed({
    mode: feedMode,
    limit: 6,
    excludeRead: false,
  })

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  const handleArticleClick = async (articleId: string) => {
    await trackClick(articleId)
  }

  return (
    <section>
      {/* Header with Feed Toggle */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
          <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black sm:text-3xl lg:text-4xl">
            {feedMode === 'personalized'
              ? 'For You'
              : t('home.sections.todayInDubai')
            }
          </h2>
          <p className="text-base text-gray-500">
            {feedMode === 'personalized'
              ? 'Personalized based on your reading preferences'
              : t('home.sections.latestArticles')
            }
          </p>
        </div>

        {/* Feed Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={feedMode === 'latest' ? 'default' : 'outline'}
            onClick={() => setFeedMode('latest')}
            className={`${
              feedMode === 'latest'
                ? 'bg-midnight-black text-white hover:bg-midnight-black/90'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="mr-2 h-4 w-4" />
            Latest
          </Button>

          {isAuthenticated && (
            <Button
              variant={feedMode === 'personalized' ? 'default' : 'outline'}
              onClick={() => setFeedMode('personalized')}
              className={`${
                feedMode === 'personalized'
                  ? 'bg-ai-blue text-white hover:bg-ai-blue/90'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              For You
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-ai-blue" />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No articles available</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Article - Hero */}
          {articles[0] && (
            <div className="mb-16">
              <div onClick={() => handleArticleClick(articles[0].id)}>
                <IntelligenceCard
                  variant="featured"
                  title={articles[0].title}
                  description={articles[0].summary}
                  image={articles[0].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                  imageAlt={articles[0].title}
                  category={getCategoryName(articles[0].category, t)}
                  date={new Date(articles[0].publishedAt).toLocaleDateString()}
                  author={articles[0].author}
                  href={`/news/${articles[0].id}`}
                  readTime={articles[0].readTime}
                  viewCount={articles[0].viewCount}
                  aiGenerated={!!articles[0].aiMetadata}
                  confidenceScore={articles[0].aiMetadata?.confidenceScore}
                  sourcesAnalyzed={articles[0].aiMetadata?.sourcesAnalyzed}
                  sentiment={articles[0].sentiment}
                  trending={articles[0].isBreaking}
                />
              </div>
            </div>
          )}

          {/* Asymmetric Grid - Articles 2-4 */}
          {articles.length > 1 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
              {/* Second article - spans 2 columns on desktop */}
              {articles[1] && (
                <div className="lg:col-span-2" onClick={() => handleArticleClick(articles[1].id)}>
                  <IntelligenceCard
                    variant="default"
                    title={articles[1].title}
                    description={articles[1].summary}
                    image={articles[1].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                    imageAlt={articles[1].title}
                    category={getCategoryName(articles[1].category, t)}
                    date={new Date(articles[1].publishedAt).toLocaleDateString()}
                    author={articles[1].author}
                    href={`/news/${articles[1].id}`}
                    readTime={articles[1].readTime}
                    viewCount={articles[1].viewCount}
                    aiGenerated={!!articles[1].aiMetadata}
                    confidenceScore={articles[1].aiMetadata?.confidenceScore}
                    sourcesAnalyzed={articles[1].aiMetadata?.sourcesAnalyzed}
                    sentiment={articles[1].sentiment}
                  />
                </div>
              )}

              {/* Third article - compact sidebar */}
              {articles[2] && (
                <div className="lg:col-span-1" onClick={() => handleArticleClick(articles[2].id)}>
                  <IntelligenceCard
                    variant="minimal"
                    title={articles[2].title}
                    description={articles[2].summary}
                    image={articles[2].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                    imageAlt={articles[2].title}
                    category={getCategoryName(articles[2].category, t)}
                    date={new Date(articles[2].publishedAt).toLocaleDateString()}
                    href={`/news/${articles[2].id}`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Lower Grid - Articles 4-6 */}
          {articles.length > 3 && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {articles.slice(3, 6).map((article, index) => (
                <div key={article.id} onClick={() => handleArticleClick(article.id)}>
                  <IntelligenceCard
                    variant={index === 0 ? 'luxury' : 'default'}
                    title={article.title}
                    description={article.summary}
                    image={article.imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                    imageAlt={article.title}
                    category={getCategoryName(article.category, t)}
                    date={new Date(article.publishedAt).toLocaleDateString()}
                    author={article.author}
                    href={`/news/${article.id}`}
                    readTime={article.readTime}
                    viewCount={article.viewCount}
                    aiGenerated={!!article.aiMetadata}
                    confidenceScore={article.aiMetadata?.confidenceScore}
                    sourcesAnalyzed={article.aiMetadata?.sourcesAnalyzed}
                    sentiment={article.sentiment}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sign-in prompt for non-authenticated users */}
      {!isAuthenticated && feedMode === 'latest' && (
        <div className="mt-8 rounded-lg border border-ai-blue/20 bg-ai-blue/5 p-6 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-ai-blue" />
          <h3 className="mb-2 text-lg font-medium text-midnight-black">
            Get Personalized Recommendations
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Sign in to see articles tailored to your interests and reading history
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-ai-blue hover:bg-ai-blue/90"
          >
            Sign In for Personalized Feed
          </Button>
        </div>
      )}
    </section>
  )
}
