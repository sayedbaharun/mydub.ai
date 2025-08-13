import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { DashboardPageHeader } from '@/features/dashboard/components/DashboardPageHeader'
import {
  ArrowLeft,
  Plus,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Rss,
  PenTool,
} from 'lucide-react'
import { contentManagementService, type CategoryStats } from '../services/content-management.service'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    description: string
    color: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  }
  stats: CategoryStats | null
  onClick: () => void
}

function CategoryCard({ category, stats, onClick }: CategoryCardProps) {
  const Icon = category.icon

  return (
    <Card
      className="group cursor-pointer border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderLeftColor: category.color }}
      onClick={onClick}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={`rounded-full bg-gradient-to-r p-3 ${
              category.color === '#3B82F6'
                ? 'from-blue-50 to-blue-100'
                : category.color === '#10B981'
                  ? 'from-emerald-50 to-emerald-100'
                  : category.color === '#8B5CF6'
                    ? 'from-violet-50 to-violet-100'
                    : category.color === '#F59E0B'
                      ? 'from-amber-50 to-amber-100'
                      : 'from-rose-50 to-rose-100'
            }`}
          >
            <Icon className="h-6 w-6" style={{ color: category.color }} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{category.description}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Rss className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sources</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats?.active_sources || 0} / {stats?.total_sources || 0}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">{stats?.pending_drafts || 0}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">
              Published today: {stats?.published_today || 0}
            </span>
          </div>
          <Badge variant="secondary" className="bg-gray-50">
            {stats?.total_published || 0} total
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContentManagementPage() {
  const navigate = useNavigate()
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Category definitions
  const categories = [
    {
      id: 'dining',
      name: 'Dining',
      description: 'Restaurant reviews, food trends, and culinary experiences across Dubai',
      color: '#3B82F6',
      icon: FileText,
    },
    {
      id: 'experiences',
      name: 'Experiences',
      description: 'Tourist attractions, cultural events, and unique Dubai experiences',
      color: '#10B981',
      icon: Activity,
    },
    {
      id: 'nightlife',
      name: 'Nightlife',
      description: 'Bars, clubs, entertainment venues, and after-dark activities',
      color: '#8B5CF6',
      icon: Clock,
    },
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'High-end shopping, luxury experiences, and premium lifestyle content',
      color: '#F59E0B',
      icon: TrendingUp,
    },
    {
      id: 'practical',
      name: 'Practical',
      description: 'Government updates, practical information, and essential Dubai services',
      color: '#EF4444',
      icon: AlertCircle,
    },
  ]

  // Load real data on component mount
  useEffect(() => {
    loadCategoryStats()
  }, [])

  const loadCategoryStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const stats = await contentManagementService.getCategoryStats()
      setCategoryStats(stats)
    } catch (err) {
      console.error('Error loading category stats:', err)
      setError('Failed to load category statistics')
    } finally {
      setLoading(false)
    }
  }

  const getStatsForCategory = (categoryId: string): CategoryStats | null => {
    return categoryStats.find((stat) => stat.category === categoryId) || null
  }

  const totalStats = categoryStats.reduce(
    (acc, stat) => ({
      sources: acc.sources + stat.total_sources,
      pending: acc.pending + stat.pending_drafts,
      published: acc.published + stat.published_today,
      total: acc.total + stat.total_published,
    }),
    { sources: 0, pending: 0, published: 0, total: 0 }
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading content management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Error Loading Data</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadCategoryStats} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPageHeader
        title="AI Content Creator"
        description="Manage AI-powered content across all categories"
        icon={PenTool}
        showBackToDashboard={true}
        showBackToHome={true}
        actions={
          <Button variant="outline" onClick={loadCategoryStats}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Sources</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.sources}</p>
                </div>
                <Rss className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Published Today</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.published}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Published</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Content Categories</h2>
            <p className="text-gray-600">Select a category to manage its content and sources</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                stats={getStatsForCategory(category.id)}
                onClick={() => navigate(`/dashboard/content-management/${category.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
