import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  Clock,
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

type CategoryType = 'dining' | 'experiences' | 'nightlife' | 'luxury' | 'practical'

interface PublishedArticle {
  id: string
  title: string
  summary: string
  category: CategoryType
  publishedAt: Date
  author: string
  readTime: number
  slug: string
  status: 'live' | 'archived' | 'featured'
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    engagementRate: number
  }
  tags: string[]
  coverImage?: string
}

interface PublishedContentProps {
  category: CategoryType
}

// Mock data
const MOCK_ARTICLES: PublishedArticle[] = [
  {
    id: '1',
    title: 'Best New Restaurants in Dubai Marina 2025',
    summary:
      'Discover the latest culinary gems that have opened in Dubai Marina, featuring everything from casual dining to fine cuisine...',
    category: 'dining',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    author: 'AI News Reporter',
    readTime: 6,
    slug: 'best-new-restaurants-dubai-marina-2025',
    status: 'featured',
    metrics: {
      views: 1245,
      likes: 89,
      comments: 23,
      shares: 45,
      engagementRate: 7.2,
    },
    tags: ['dubai-marina', 'restaurants', 'new-openings', 'dining-guide'],
    coverImage: '/api/placeholder/400/250',
  },
  {
    id: '2',
    title: 'Winter Dining Al Fresco: Top Outdoor Spots',
    summary:
      "Make the most of Dubai's perfect winter weather with these exceptional outdoor dining experiences across the city...",
    category: 'dining',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    author: 'AI Lifestyle Reporter',
    readTime: 4,
    slug: 'winter-dining-al-fresco-outdoor-spots',
    status: 'live',
    metrics: {
      views: 892,
      likes: 64,
      comments: 18,
      shares: 32,
      engagementRate: 6.4,
    },
    tags: ['outdoor-dining', 'winter', 'al-fresco', 'restaurants'],
    coverImage: '/api/placeholder/400/250',
  },
  {
    id: '3',
    title: 'Dubai Food Festival 2025: Complete Guide',
    summary:
      "Everything you need to know about this year's Dubai Food Festival, including participating restaurants, special offers...",
    category: 'dining',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    author: 'AI Tourism Reporter',
    readTime: 8,
    slug: 'dubai-food-festival-2025-complete-guide',
    status: 'live',
    metrics: {
      views: 2134,
      likes: 156,
      comments: 67,
      shares: 89,
      engagementRate: 8.9,
    },
    tags: ['food-festival', 'events', 'dubai', 'guide'],
    coverImage: '/api/placeholder/400/250',
  },
  {
    id: '4',
    title: 'Hidden Gems: Local Cafes You Must Try',
    summary:
      "Discover Dubai's best-kept secrets - charming local cafes that offer authentic experiences away from the tourist trail...",
    category: 'dining',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    author: 'AI Local Reporter',
    readTime: 5,
    slug: 'hidden-gems-local-cafes-dubai',
    status: 'archived',
    metrics: {
      views: 567,
      likes: 34,
      comments: 12,
      shares: 19,
      engagementRate: 4.2,
    },
    tags: ['cafes', 'hidden-gems', 'local', 'coffee'],
    coverImage: '/api/placeholder/400/250',
  },
]

function ArticleCard({
  article,
  onEdit,
  onArchive,
  onDelete,
  onViewAnalytics,
}: {
  article: PublishedArticle
  onEdit: (articleId: string) => void
  onArchive: (articleId: string) => void
  onDelete: (articleId: string) => void
  onViewAnalytics: (articleId: string) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-green-600 bg-green-50'
      case 'featured':
        return 'text-blue-600 bg-blue-50'
      case 'archived':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 8) return 'text-green-600'
    if (rate >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge className={getStatusColor(article.status)}>{article.status}</Badge>
              <span className="text-xs text-gray-500">
                {format(article.publishedAt, 'MMM dd, yyyy')}
              </span>
            </div>
            <CardTitle className="mb-2 text-lg font-medium leading-tight">
              {article.title}
            </CardTitle>
            <p className="line-clamp-2 text-sm text-gray-600">{article.summary}</p>
          </div>
          {article.coverImage && (
            <div className="ml-4 flex-shrink-0">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <Eye className="h-3 w-3" />
              <span className="font-medium">{article.metrics.views.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400">Views</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <ThumbsUp className="h-3 w-3" />
              <span className="font-medium">{article.metrics.likes}</span>
            </div>
            <p className="text-xs text-gray-400">Likes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <MessageCircle className="h-3 w-3" />
              <span className="font-medium">{article.metrics.comments}</span>
            </div>
            <p className="text-xs text-gray-400">Comments</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <Share2 className="h-3 w-3" />
              <span className="font-medium">{article.metrics.shares}</span>
            </div>
            <p className="text-xs text-gray-400">Shares</p>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp
              className={`h-4 w-4 ${getEngagementColor(article.metrics.engagementRate)}`}
            />
            <span className={getEngagementColor(article.metrics.engagementRate)}>
              {article.metrics.engagementRate}% engagement
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{article.readTime} min read</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {article.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{article.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Author and Time */}
        <div className="text-xs text-gray-500">
          By {article.author} • {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" />
                View
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onViewAnalytics(article.id)}>
              <BarChart3 className="mr-1 h-3 w-3" />
              Analytics
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(article.id)}>
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
            {article.status !== 'archived' && (
              <Button variant="outline" size="sm" onClick={() => onArchive(article.id)}>
                Archive
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(article.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PublishedContent({ category }: PublishedContentProps) {
  const [articles, setArticles] = useState(MOCK_ARTICLES.filter((a) => a.category === category))
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'featured' | 'archived'>('all')

  const handleEditArticle = (articleId: string) => {
    // TODO: Open article editor
      }

  const handleArchiveArticle = (articleId: string) => {
    setArticles(
      articles.map((a) => (a.id === articleId ? { ...a, status: 'archived' as const } : a))
    )
  }

  const handleDeleteArticle = (articleId: string) => {
    setArticles(articles.filter((a) => a.id !== articleId))
  }

  const handleViewAnalytics = (articleId: string) => {
    // TODO: Open analytics modal
      }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalViews = articles.reduce((sum, a) => sum + a.metrics.views, 0)
  const totalEngagement = articles.reduce(
    (sum, a) => sum + a.metrics.likes + a.metrics.comments + a.metrics.shares,
    0
  )
  const avgEngagementRate =
    articles.length > 0
      ? articles.reduce((sum, a) => sum + a.metrics.engagementRate, 0) / articles.length
      : 0

  const liveCount = articles.filter((a) => a.status === 'live').length
  const featuredCount = articles.filter((a) => a.status === 'featured').length
  const archivedCount = articles.filter((a) => a.status === 'archived').length

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-light text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Engagement</p>
              <p className="text-2xl font-light text-gray-900">
                {totalEngagement.toLocaleString()}
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
              <p className="text-2xl font-light text-gray-900">{avgEngagementRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All ({articles.length})
          </Button>
          <Button
            variant={statusFilter === 'live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('live')}
          >
            Live ({liveCount})
          </Button>
          <Button
            variant={statusFilter === 'featured' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('featured')}
          >
            Featured ({featuredCount})
          </Button>
          <Button
            variant={statusFilter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived ({archivedCount})
          </Button>
        </div>
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            <BarChart3 className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No articles found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Published articles will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={handleEditArticle}
              onArchive={handleArchiveArticle}
              onDelete={handleDeleteArticle}
              onViewAnalytics={handleViewAnalytics}
            />
          ))}
        </div>
      )}
    </div>
  )
}
