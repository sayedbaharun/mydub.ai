import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Users,
  Eye,
  ThumbsUp,
  Share2,
  Clock,
  Target,
  Zap,
  Award,
} from 'lucide-react'

type CategoryType = 'dining' | 'experiences' | 'nightlife' | 'luxury' | 'practical'

interface AnalyticsData {
  period: '7d' | '30d' | '90d'
  totalViews: number
  totalEngagement: number
  articlesPublished: number
  avgEngagementRate: number
  topPerformingTags: string[]
  readerDemographics: {
    age: { range: string; percentage: number }[]
    gender: { type: string; percentage: number }[]
    location: { city: string; percentage: number }[]
  }
  performance: {
    date: string
    views: number
    engagement: number
    articles: number
  }[]
  insights: {
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    metric?: string
  }[]
}

interface CategoryAnalyticsProps {
  category: CategoryType
}

// Mock analytics data
const MOCK_ANALYTICS: Record<CategoryType, AnalyticsData> = {
  dining: {
    period: '30d',
    totalViews: 45620,
    totalEngagement: 3240,
    articlesPublished: 18,
    avgEngagementRate: 7.1,
    topPerformingTags: ['restaurants', 'new-openings', 'fine-dining', 'food-festival', 'brunch'],
    readerDemographics: {
      age: [
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 28 },
        { range: '18-24', percentage: 22 },
        { range: '45-54', percentage: 15 },
      ],
      gender: [
        { type: 'Female', percentage: 58 },
        { type: 'Male', percentage: 42 },
      ],
      location: [
        { city: 'Dubai', percentage: 65 },
        { city: 'Abu Dhabi', percentage: 20 },
        { city: 'Sharjah', percentage: 10 },
        { city: 'Other UAE', percentage: 5 },
      ],
    },
    performance: [
      { date: '2025-01-01', views: 1850, engagement: 132, articles: 1 },
      { date: '2025-01-02', views: 2100, engagement: 158, articles: 2 },
      { date: '2025-01-03', views: 1920, engagement: 145, articles: 1 },
      { date: '2025-01-04', views: 2350, engagement: 178, articles: 2 },
      { date: '2025-01-05', views: 2650, engagement: 201, articles: 3 },
      { date: '2025-01-06', views: 2280, engagement: 165, articles: 1 },
      { date: '2025-01-07', views: 1980, engagement: 142, articles: 1 },
    ],
    insights: [
      {
        type: 'positive',
        title: 'Strong Weekend Performance',
        description: 'Dining content shows 35% higher engagement on weekends',
        metric: '+35%',
      },
      {
        type: 'positive',
        title: 'Restaurant Opening Articles Trending',
        description: 'New restaurant opening articles have 2x higher engagement rates',
        metric: '2x',
      },
      {
        type: 'neutral',
        title: 'Seasonal Pattern Detected',
        description: 'Winter dining content consistently outperforms summer content',
      },
      {
        type: 'negative',
        title: 'Mobile Optimization Needed',
        description: 'Mobile users have 18% lower engagement rates',
        metric: '-18%',
      },
    ],
  },
  experiences: {
    period: '30d',
    totalViews: 38450,
    totalEngagement: 2890,
    articlesPublished: 15,
    avgEngagementRate: 7.5,
    topPerformingTags: ['attractions', 'family-friendly', 'adventure', 'culture', 'exhibitions'],
    readerDemographics: {
      age: [
        { range: '25-34', percentage: 32 },
        { range: '35-44', percentage: 31 },
        { range: '18-24', percentage: 25 },
        { range: '45-54', percentage: 12 },
      ],
      gender: [
        { type: 'Female', percentage: 54 },
        { type: 'Male', percentage: 46 },
      ],
      location: [
        { city: 'Dubai', percentage: 70 },
        { city: 'Abu Dhabi', percentage: 18 },
        { city: 'Sharjah', percentage: 8 },
        { city: 'Other UAE', percentage: 4 },
      ],
    },
    performance: [],
    insights: [],
  },
  nightlife: {
    period: '30d',
    totalViews: 28150,
    totalEngagement: 2240,
    articlesPublished: 12,
    avgEngagementRate: 8.0,
    topPerformingTags: ['bars', 'clubs', 'rooftop', 'live-music', 'happy-hour'],
    readerDemographics: {
      age: [
        { range: '25-34', percentage: 45 },
        { range: '18-24', percentage: 30 },
        { range: '35-44', percentage: 20 },
        { range: '45-54', percentage: 5 },
      ],
      gender: [
        { type: 'Male', percentage: 52 },
        { type: 'Female', percentage: 48 },
      ],
      location: [
        { city: 'Dubai', percentage: 75 },
        { city: 'Abu Dhabi', percentage: 15 },
        { city: 'Sharjah', percentage: 7 },
        { city: 'Other UAE', percentage: 3 },
      ],
    },
    performance: [],
    insights: [],
  },
  luxury: {
    period: '30d',
    totalViews: 52340,
    totalEngagement: 4180,
    articlesPublished: 14,
    avgEngagementRate: 8.8,
    topPerformingTags: ['shopping', 'hotels', 'spas', 'jewelry', 'high-end'],
    readerDemographics: {
      age: [
        { range: '35-44', percentage: 40 },
        { range: '25-34', percentage: 35 },
        { range: '45-54', percentage: 20 },
        { range: '18-24', percentage: 5 },
      ],
      gender: [
        { type: 'Female', percentage: 62 },
        { type: 'Male', percentage: 38 },
      ],
      location: [
        { city: 'Dubai', percentage: 80 },
        { city: 'Abu Dhabi', percentage: 15 },
        { city: 'Other UAE', percentage: 5 },
      ],
    },
    performance: [],
    insights: [],
  },
  practical: {
    period: '30d',
    totalViews: 41890,
    totalEngagement: 2950,
    articlesPublished: 22,
    avgEngagementRate: 7.0,
    topPerformingTags: ['visa', 'transportation', 'government', 'utilities', 'healthcare'],
    readerDemographics: {
      age: [
        { range: '25-34', percentage: 30 },
        { range: '35-44', percentage: 30 },
        { range: '18-24', percentage: 25 },
        { range: '45-54', percentage: 15 },
      ],
      gender: [
        { type: 'Male', percentage: 55 },
        { type: 'Female', percentage: 45 },
      ],
      location: [
        { city: 'Dubai', percentage: 60 },
        { city: 'Abu Dhabi', percentage: 25 },
        { city: 'Sharjah', percentage: 10 },
        { city: 'Other UAE', percentage: 5 },
      ],
    },
    performance: [],
    insights: [],
  },
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-3xl font-light text-gray-900">{value}</p>
          {change && (
            <div className={`mt-1 flex items-center gap-1 text-sm ${getTrendColor()}`}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
    </Card>
  )
}

function InsightCard({ insight }: { insight: AnalyticsData['insights'][0] }) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />
    }
  }

  const getInsightColor = () => {
    switch (insight.type) {
      case 'positive':
        return 'border-green-200 bg-green-50'
      case 'negative':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className={`border ${getInsightColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getInsightIcon()}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              {insight.metric && (
                <Badge variant="outline" className="text-xs">
                  {insight.metric}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryAnalytics({ category }: CategoryAnalyticsProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const analytics = MOCK_ANALYTICS[category]

  // Simple performance chart data (using text representation for now)
  const chartData = analytics.performance.slice(-7)
  const maxViews = Math.max(...chartData.map((d) => d.views))

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Analytics & Insights</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          change="+12.5%"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Total Engagement"
          value={analytics.totalEngagement.toLocaleString()}
          change="+8.3%"
          icon={ThumbsUp}
          trend="up"
        />
        <MetricCard
          title="Articles Published"
          value={analytics.articlesPublished}
          change="+2"
          icon={BarChart3}
          trend="up"
        />
        <MetricCard
          title="Avg. Engagement Rate"
          value={`${analytics.avgEngagementRate}%`}
          change="+0.5%"
          icon={Target}
          trend="up"
        />
      </div>

      {/* Performance Chart (Simple representation) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((data, index) => (
              <div key={data.date} className="flex items-center gap-4">
                <div className="w-16 text-xs text-gray-500">
                  {new Date(data.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{ width: `${(data.views / maxViews) * 100}%` }}
                    />
                    <span className="text-xs text-gray-600">{data.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1 rounded bg-green-500"
                      style={{ width: `${(data.engagement / (maxViews * 0.1)) * 100}%` }}
                    />
                    <span className="text-xs text-gray-600">{data.engagement} engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Performing Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformingTags.map((tag, index) => (
                <div key={tag} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                    <Badge variant="outline">{tag}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.floor(Math.random() * 500) + 100} views
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reader Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reader Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Age Groups</h4>
                <div className="space-y-2">
                  {analytics.readerDemographics.age.map((age) => (
                    <div key={age.range} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{age.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded bg-gray-200">
                          <div
                            className="h-2 rounded bg-blue-500"
                            style={{ width: `${age.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{age.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Top Locations</h4>
                <div className="space-y-2">
                  {analytics.readerDemographics.location.slice(0, 3).map((location) => (
                    <div key={location.city} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{location.city}</span>
                      <span className="text-sm font-medium">{location.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">AI-Generated Insights</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {analytics.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  )
}
