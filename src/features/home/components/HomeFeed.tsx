import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { ContentCard } from '@/shared/components/ContentCard'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { RefreshCw, Filter } from 'lucide-react'
import { BaseContent } from '@/shared/types'
import { cn } from '@/shared/lib/utils'

interface HomeFeedProps {
  className?: string
}

// Mock data for now - will be replaced with API calls
const generateMockContent = (count: number, offset: number): BaseContent[] => {
  const types: BaseContent['type'][] = [
    'government',
    'news',
    'event',
    'tourism',
    'traffic',
    'weather',
  ]
  const titles = [
    'New Metro Line Opening Next Month',
    'Dubai Shopping Festival 2024 Announced',
    'Traffic Update: Sheikh Zayed Road',
    'Weather Alert: Sandstorm Expected',
    'New Visa Rules for Tourists',
    'Dubai Parks Special Offers',
    'Government Services Update',
    'Breaking: New Business Regulations',
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `content-${offset + i}`,
    type: types[Math.floor(Math.random() * types.length)],
    title: titles[Math.floor(Math.random() * titles.length)],
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    imageUrl: `https://picsum.photos/400/300?random=${offset + i}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

export function HomeFeed({ className }: HomeFeedProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('all')
  const [content, setContent] = useState<BaseContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load initial content
  useEffect(() => {
    loadContent()
  }, [activeTab])

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      loadMoreContent()
    }
  }, [inView, hasMore, isLoadingMore])

  const loadContent = async () => {
    setIsLoading(true)
    setContent([])
    setPage(1)

    // Load content immediately without delay
    const newContent = generateMockContent(10, 0)
    setContent(newContent)
    setHasMore(true)
    setIsLoading(false)
  }

  const loadMoreContent = async () => {
    if (isLoadingMore) return

    setIsLoadingMore(true)

    // Load more content immediately without delay
    const newContent = generateMockContent(10, page * 10)
    setContent((prev) => [...prev, ...newContent])
    setPage((prev) => prev + 1)

    // Simulate end of content
    if (page >= 5) {
      setHasMore(false)
    }

    setIsLoadingMore(false)
  }

  const handleRefresh = () => {
    loadContent()
  }

  const filterContent = (content: BaseContent[]) => {
    if (activeTab === 'all') return content
    return content.filter((item) => item.type === activeTab)
  }

  const filteredContent = filterContent(content)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Feed</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="government">Government</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="event">Events</TabsTrigger>
          <TabsTrigger value="tourism">Tourism</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading your personalized feed..." />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No content available in this category.</p>
            </div>
          ) : (
            <>
              {/* Masonry Grid Layout */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredContent.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>

              {/* Load More Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isLoadingMore && <LoadingSpinner size="md" text="Loading more..." />}
                </div>
              )}

              {!hasMore && filteredContent.length > 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">You've reached the end of your feed</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
