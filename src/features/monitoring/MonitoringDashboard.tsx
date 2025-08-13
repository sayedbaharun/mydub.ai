import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface WebVitalsData {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  threshold: { good: number; poor: number }
}

interface PerformanceSummary {
  hour: string
  lcp_p50: number
  lcp_p75: number
  lcp_p90: number
  cls_p50: number
  cls_p75: number
  cls_p90: number
  page_views: number
}

export function MonitoringDashboard() {
  const [timeRange, setTimeRange] = useState('24h')
  
  // Fetch performance summary
  const { data: performanceData, isLoading: perfLoading } = useQuery({
    queryKey: ['performance-summary', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_performance_summary')
        .select('*')
        .order('hour', { ascending: false })
        .limit(24)
      
      if (error) throw error
      return data as PerformanceSummary[]
    },
    refetchInterval: 60000, // Refresh every minute
  })

  // Fetch recent errors
  const { data: recentErrors, isLoading: errorsLoading } = useQuery({
    queryKey: ['recent-errors', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_errors')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch active alerts
  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_violations')
        .select('*')
        .eq('alerted', false)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      return data
    },
    refetchInterval: 30000,
  })

  // Calculate Web Vitals scores
  const webVitals: WebVitalsData[] = performanceData ? [
    {
      metric: 'LCP',
      value: performanceData[0]?.lcp_p75 || 0,
      rating: getWebVitalRating('lcp', performanceData[0]?.lcp_p75 || 0),
      threshold: { good: 2500, poor: 4000 }
    },
    {
      metric: 'CLS',
      value: performanceData[0]?.cls_p75 || 0,
      rating: getWebVitalRating('cls', performanceData[0]?.cls_p75 || 0),
      threshold: { good: 0.1, poor: 0.25 }
    },
  ] : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Active Performance Alerts</AlertTitle>
          <AlertDescription>
            {activeAlerts.length} performance violations detected
          </AlertDescription>
        </Alert>
      )}

      {/* Web Vitals Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {webVitals.map((vital) => (
          <Card key={vital.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {vital.metric}
              </CardTitle>
              <Badge 
                variant={
                  vital.rating === 'good' ? 'default' : 
                  vital.rating === 'needs-improvement' ? 'secondary' : 
                  'destructive'
                }
              >
                {vital.rating}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vital.metric === 'CLS' ? vital.value.toFixed(3) : `${vital.value.toFixed(0)}ms`}
              </div>
              <Progress 
                value={getProgressValue(vital)} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Good: {vital.metric === 'CLS' ? `<${vital.threshold.good}` : `<${vital.threshold.good}ms`}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {/* Page Views Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Page Views
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.reduce((sum, d) => sum + d.page_views, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In the last {timeRange}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* LCP Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Largest Contentful Paint (LCP) Trend</CardTitle>
              <CardDescription>
                P50, P75, and P90 values over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData?.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="lcp_p50" 
                    stroke="#10b981" 
                    name="P50"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lcp_p75" 
                    stroke="#f59e0b" 
                    name="P75"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lcp_p90" 
                    stroke="#ef4444" 
                    name="P90"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CLS Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Layout Shift (CLS) Distribution</CardTitle>
              <CardDescription>
                Distribution of CLS scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCLSDistribution(performanceData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Last 10 errors captured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentErrors?.map((error: any) => (
                  <div key={error.id} className="border-l-4 border-destructive pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{error.error_type}</p>
                        <p className="text-sm text-muted-foreground">{error.error_message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(error.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{error.url}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Metrics</CardTitle>
              <CardDescription>
                Live performance data streaming
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Real-time monitoring dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getWebVitalRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (metric === 'lcp') {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  } else if (metric === 'cls') {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }
  return 'good'
}

function getProgressValue(vital: WebVitalsData): number {
  const { value, threshold } = vital
  if (value <= threshold.good) return 100
  if (value >= threshold.poor) return 0
  
  const range = threshold.poor - threshold.good
  const position = value - threshold.good
  return 100 - (position / range) * 100
}

function getCLSDistribution(data?: PerformanceSummary[]) {
  if (!data) return []
  
  const ranges = [
    { range: '0-0.1 (Good)', min: 0, max: 0.1, count: 0 },
    { range: '0.1-0.25 (Needs Improvement)', min: 0.1, max: 0.25, count: 0 },
    { range: '>0.25 (Poor)', min: 0.25, max: Infinity, count: 0 },
  ]
  
  // This is simplified - in reality you'd calculate from raw data
  return ranges
}