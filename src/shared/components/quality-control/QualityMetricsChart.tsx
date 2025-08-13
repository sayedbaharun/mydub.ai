import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Badge } from '@/shared/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'

interface QualityMetricsChartProps {
  timeframe: 'day' | 'week' | 'month'
  contentType: string
}

interface MetricDataPoint {
  date: string
  overall_score: number
  content_quality: number
  grammar_score: number
  readability_score: number
  seo_score: number
  cultural_sensitivity: number
  safety_score: number
  total_content: number
  auto_approved: number
  manual_reviews: number
  auto_rejected: number
}

interface QualityDistributionData {
  score_range: string
  count: number
  percentage: number
}

interface ContentTypeData {
  content_type: string
  avg_score: number
  count: number
  approval_rate: number
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e'
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export const QualityMetricsChart: React.FC<QualityMetricsChartProps> = ({
  timeframe,
  contentType
}) => {
  const [metricsData, setMetricsData] = useState<MetricDataPoint[]>([])
  const [qualityDistribution, setQualityDistribution] = useState<QualityDistributionData[]>([])
  const [contentTypeData, setContentTypeData] = useState<ContentTypeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string>('overall_score')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')

  useEffect(() => {
    loadMetricsData()
  }, [timeframe, contentType])

  const loadMetricsData = async () => {
    try {
      setLoading(true)
      
      // Generate sample data based on timeframe
      const data = generateSampleData()
      setMetricsData(data)
      
      // Generate quality distribution data
      const distribution = generateQualityDistribution()
      setQualityDistribution(distribution)
      
      // Generate content type comparison data
      const contentTypes = generateContentTypeData()
      setContentTypeData(contentTypes)
      
    } catch (error) {
      console.error('Error loading metrics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = (): MetricDataPoint[] => {
    const days = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30
    const data: MetricDataPoint[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      if (timeframe === 'day') {
        date.setHours(date.getHours() - i)
      } else {
        date.setDate(date.getDate() - i)
      }

      // Generate realistic quality scores with some variance
      const baseScore = 75 + Math.random() * 20
      const variance = (Math.random() - 0.5) * 10

      data.push({
        date: timeframe === 'day' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        overall_score: Math.max(0, Math.min(100, baseScore + variance)),
        content_quality: Math.max(0, Math.min(100, baseScore + variance - 2)),
        grammar_score: Math.max(0, Math.min(100, baseScore + variance + 5)),
        readability_score: Math.max(0, Math.min(100, baseScore + variance - 3)),
        seo_score: Math.max(0, Math.min(100, baseScore + variance + 2)),
        cultural_sensitivity: Math.max(0, Math.min(100, baseScore + variance + 8)),
        safety_score: Math.max(0, Math.min(100, baseScore + variance + 10)),
        total_content: Math.floor(Math.random() * 50) + 10,
        auto_approved: Math.floor(Math.random() * 30) + 5,
        manual_reviews: Math.floor(Math.random() * 15) + 2,
        auto_rejected: Math.floor(Math.random() * 8) + 1
      })
    }

    return data
  }

  const generateQualityDistribution = (): QualityDistributionData[] => {
    return [
      { score_range: '90-100', count: 45, percentage: 25 },
      { score_range: '80-89', count: 72, percentage: 40 },
      { score_range: '70-79', count: 36, percentage: 20 },
      { score_range: '60-69', count: 18, percentage: 10 },
      { score_range: '50-59', count: 7, percentage: 4 },
      { score_range: '0-49', count: 2, percentage: 1 }
    ]
  }

  const generateContentTypeData = (): ContentTypeData[] => {
    return [
      { content_type: 'News', avg_score: 82.5, count: 156, approval_rate: 78 },
      { content_type: 'Tourism', avg_score: 88.2, count: 134, approval_rate: 85 },
      { content_type: 'Government', avg_score: 91.8, count: 67, approval_rate: 92 },
      { content_type: 'Events', avg_score: 85.6, count: 89, approval_rate: 81 },
      { content_type: 'Practical', avg_score: 79.3, count: 145, approval_rate: 74 }
    ]
  }

  const getMetricColor = (metric: string): string => {
    const colorMap: Record<string, string> = {
      overall_score: COLORS.primary,
      content_quality: COLORS.secondary,
      grammar_score: COLORS.accent,
      readability_score: COLORS.info,
      seo_score: COLORS.warning,
      cultural_sensitivity: COLORS.success,
      safety_score: COLORS.danger
    }
    return colorMap[metric] || COLORS.primary
  }

  const getMetricLabel = (metric: string): string => {
    const labelMap: Record<string, string> = {
      overall_score: 'Overall Score',
      content_quality: 'Content Quality',
      grammar_score: 'Grammar Score',
      readability_score: 'Readability',
      seo_score: 'SEO Score',
      cultural_sensitivity: 'Cultural Sensitivity',
      safety_score: 'Safety Score'
    }
    return labelMap[metric] || metric
  }

  const renderChart = () => {
    const chartProps = {
      data: metricsData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={getMetricColor(selectedMetric)}
              fill={getMetricColor(selectedMetric)}
              fillOpacity={0.3}
              name={getMetricLabel(selectedMetric)}
            />
          </AreaChart>
        )
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={selectedMetric}
              fill={getMetricColor(selectedMetric)}
              name={getMetricLabel(selectedMetric)}
            />
          </BarChart>
        )
      default:
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={getMetricColor(selectedMetric)}
              strokeWidth={2}
              name={getMetricLabel(selectedMetric)}
            />
          </LineChart>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-pulse" />
        <span className="ml-2">Loading metrics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall_score">Overall Score</SelectItem>
              <SelectItem value="content_quality">Content Quality</SelectItem>
              <SelectItem value="grammar_score">Grammar Score</SelectItem>
              <SelectItem value="readability_score">Readability</SelectItem>
              <SelectItem value="seo_score">SEO Score</SelectItem>
              <SelectItem value="cultural_sensitivity">Cultural Sensitivity</SelectItem>
              <SelectItem value="safety_score">Safety Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Value */}
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: getMetricColor(selectedMetric) }}>
            {metricsData.length > 0 ? 
              metricsData[metricsData.length - 1][selectedMetric as keyof MetricDataPoint]?.toFixed?.(1) || 
              metricsData[metricsData.length - 1][selectedMetric as keyof MetricDataPoint] : 
              '0'
            }
          </div>
          <div className="text-sm text-muted-foreground">{getMetricLabel(selectedMetric)}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Additional Charts */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList>
          <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          <TabsTrigger value="content-types">Content Types</TabsTrigger>
          <TabsTrigger value="volume">Content Volume</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Quality Score Distribution</CardTitle>
              <CardDescription>Distribution of content across quality score ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ score_range, percentage }) => `${score_range} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {qualityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-types">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Content Type</CardTitle>
              <CardDescription>Average scores and approval rates by content type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="content_type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_score" fill={COLORS.primary} name="Avg Score" />
                    <Bar dataKey="approval_rate" fill={COLORS.secondary} name="Approval Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Content Volume Trends</CardTitle>
              <CardDescription>Content processing volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="auto_approved"
                      stackId="1"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      name="Auto Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="manual_reviews"
                      stackId="1"
                      stroke={COLORS.warning}
                      fill={COLORS.warning}
                      name="Manual Reviews"
                    />
                    <Area
                      type="monotone"
                      dataKey="auto_rejected"
                      stackId="1"
                      stroke={COLORS.danger}
                      fill={COLORS.danger}
                      name="Auto Rejected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {contentTypeData.map((type, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{type.content_type}</p>
                  <p className="text-2xl font-bold">{type.avg_score.toFixed(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{type.count} items</p>
                  <Badge variant={type.approval_rate >= 80 ? "default" : "secondary"}>
                    {type.approval_rate}% approved
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default QualityMetricsChart