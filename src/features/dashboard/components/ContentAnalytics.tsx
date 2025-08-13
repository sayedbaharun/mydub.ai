import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  TrendingUp,
  Eye,
  Share2,
  Heart,
  MessageCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { dashboardService } from '../services/dashboard.service'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface ContentAnalyticsData {
  topContent: Array<{
    id: string
    title: string
    type: string
    views: number
    engagement: number
    publishedAt: string
  }>
  engagementTrends: Array<{
    date: string
    views: number
    shares: number
    comments: number
  }>
  categoryPerformance: Array<{
    category: string
    views: number
    engagement: number
    color: string
  }>
  timeBasedAnalytics: Array<{
    hour: number
    views: number
    engagement: number
  }>
}

export function ContentAnalytics() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [data, setData] = useState<ContentAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [contentType, setContentType] = useState<'all' | 'news' | 'tourism' | 'government'>('all')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, contentType])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch actual analytics data
      // For now, we'll use mock data
      const mockData: ContentAnalyticsData = {
        topContent: [
          {
            id: '1',
            title: 'Dubai Tourism Update 2024',
            type: 'tourism',
            views: 15420,
            engagement: 8.5,
            publishedAt: '2024-01-15'
          },
          {
            id: '2',
            title: 'New Government Policy Announcement',
            type: 'government',
            views: 12350,
            engagement: 6.2,
            publishedAt: '2024-01-14'
          },
          {
            id: '3',
            title: 'Breaking: Economic Growth Report',
            type: 'news',
            views: 11800,
            engagement: 9.1,
            publishedAt: '2024-01-13'
          },
          {
            id: '4',
            title: 'Cultural Festival Schedule',
            type: 'tourism',
            views: 9650,
            engagement: 7.3,
            publishedAt: '2024-01-12'
          },
          {
            id: '5',
            title: 'Infrastructure Development News',
            type: 'government',
            views: 8920,
            engagement: 5.8,
            publishedAt: '2024-01-11'
          }
        ],
        engagementTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 5000) + 1000,
          shares: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 200) + 20
        })),
        categoryPerformance: [
          { category: 'Tourism', views: 45230, engagement: 7.8, color: '#3B82F6' },
          { category: 'News', views: 38970, engagement: 8.2, color: '#10B981' },
          { category: 'Government', views: 28450, engagement: 6.1, color: '#F59E0B' },
          { category: 'Events', views: 15680, engagement: 9.3, color: '#EF4444' }
        ],
        timeBasedAnalytics: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          views: Math.floor(Math.random() * 1000) + 100,
          engagement: Math.floor(Math.random() * 100) + 20
        }))
      }

      setData(mockData)
    } catch (error) {
      toast({
        title: 'Failed to load analytics',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // Mock export functionality
      toast({ title: 'Analytics exported successfully' })
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-900">Content Analytics</h2>
          <p className="text-gray-500 font-light">Performance insights and engagement metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="tourism">Tourism</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topContent.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <Badge variant="outline">{item.type}</Badge>
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{item.views.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-500">views</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{item.engagement}%</span>
                    </div>
                    <span className="text-xs text-gray-500">engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagementTrends}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Views" />
                  <Line dataKey="shares" stroke="#10B981" strokeWidth={2} name="Shares" />
                  <Line dataKey="comments" stroke="#F59E0B" strokeWidth={2} name="Comments" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light">Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryPerformance}>
                  <XAxis 
                    dataKey="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="views" fill="#3B82F6" name="Views" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Activity by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeBasedAnalytics}>
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  labelFormatter={(value) => `${value}:00`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="views" fill="#3B82F6" name="Views" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}