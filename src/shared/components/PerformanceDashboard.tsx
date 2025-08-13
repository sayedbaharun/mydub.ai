import { useState, useEffect } from 'react'
import { monitoring, usePerformanceMonitoring, PerformanceMetrics, HealthCheck } from '@/shared/lib/monitoring'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { RefreshCw, Download, Activity, Zap, Database, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  unit: string
  description?: string
  icon?: React.ReactNode
  status?: 'good' | 'warning' | 'critical'
}

function MetricCard({ title, value, unit, description, icon, status = 'good' }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className={cn('p-2 rounded-lg', statusColors[status])}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(2)} {unit}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function HealthStatus({ healthStatus }: { healthStatus: HealthCheck | null }) {
  if (!healthStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading health status...</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50'
      case 'unhealthy':
        return 'text-red-600 bg-red-50'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(healthStatus.status)}
          System Health
        </CardTitle>
        <CardDescription>
          Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn('inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4', getStatusColor(healthStatus.status))}>
          {healthStatus.status.toUpperCase()}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(healthStatus.services).map(([service, isHealthy]) => (
            <div key={service} className="flex items-center justify-between">
              <span className="capitalize">{service}</span>
              {isHealthy ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceDashboard() {
  const { metrics, healthStatus } = usePerformanceMonitoring()
  const [refreshing, setRefreshing] = useState(false)

  const refreshMetrics = async () => {
    setRefreshing(true)
    // Trigger a manual health check
    await monitoring.getHealthStatus()
    setTimeout(() => setRefreshing(false), 500)
  }

  const exportMetrics = () => {
    const exportData = {
      metrics,
      healthStatus,
      timestamp: new Date().toISOString(),
    }
    const data = JSON.stringify(exportData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitoring-report-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate performance scores based on current metrics
  const getPerformanceScore = (loadTime: number, memoryUsage: number): 'good' | 'warning' | 'critical' => {
    if (loadTime > 4000 || memoryUsage > 100 * 1024 * 1024) return 'critical'
    if (loadTime > 2500 || memoryUsage > 50 * 1024 * 1024) return 'warning'
    return 'good'
  }

  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Real-time performance metrics and system health</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportMetrics}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <HealthStatus healthStatus={healthStatus} />

      {/* Current Performance Metrics */}
      {latestMetrics && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Performance Metrics
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Load Time"
              value={latestMetrics.loadTime}
              unit="ms"
              description="Page load performance"
              icon={<Clock className="h-4 w-4" />}
              status={latestMetrics.loadTime > 4000 ? 'critical' : latestMetrics.loadTime > 2500 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Render Time"
              value={latestMetrics.renderTime}
              unit="ms"
              description="Component render time"
              icon={<Zap className="h-4 w-4" />}
              status={latestMetrics.renderTime > 50 ? 'warning' : 'good'}
            />
            <MetricCard
              title="API Response"
              value={latestMetrics.apiResponseTime}
              unit="ms"
              description="Average API response time"
              icon={<Database className="h-4 w-4" />}
              status={latestMetrics.apiResponseTime > 2000 ? 'critical' : latestMetrics.apiResponseTime > 1000 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Memory Usage"
              value={Math.round(latestMetrics.memoryUsage / 1024 / 1024)}
              unit="MB"
              description="Current memory consumption"
              icon={<Database className="h-4 w-4" />}
              status={latestMetrics.memoryUsage > 100 * 1024 * 1024 ? 'critical' : latestMetrics.memoryUsage > 50 * 1024 * 1024 ? 'warning' : 'good'}
            />
          </div>
        </div>
      )}

      {/* Historical Metrics */}
      {metrics.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Historical Trends
            </CardTitle>
            <CardDescription>
              Performance trends over the last {metrics.length} measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Load Time Trend</h4>
                <div className="flex items-end gap-1 h-20">
                  {metrics.slice(-10).map((metric, index) => (
                    <div
                      key={index}
                      className="bg-blue-200 flex-1 min-w-0"
                      style={{ height: `${Math.min((metric.loadTime / 5000) * 100, 100)}%` }}
                      title={`${metric.loadTime}ms`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Memory Usage Trend</h4>
                <div className="flex items-end gap-1 h-20">
                  {metrics.slice(-10).map((metric, index) => (
                    <div
                      key={index}
                      className="bg-green-200 flex-1 min-w-0"
                      style={{ height: `${Math.min((metric.memoryUsage / (200 * 1024 * 1024)) * 100, 100)}%` }}
                      title={`${Math.round(metric.memoryUsage / 1024 / 1024)}MB`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>Suggestions based on current metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {latestMetrics && latestMetrics.loadTime > 3000 && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">Load Time</Badge>
                <span className="text-sm">
                  Page load time is above 3s. Consider optimizing images, reducing bundle size, and implementing code splitting.
                </span>
              </li>
            )}
            {latestMetrics && latestMetrics.apiResponseTime > 1000 && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">API</Badge>
                <span className="text-sm">
                  API response time is slow. Consider implementing caching, optimizing database queries, or using a CDN.
                </span>
              </li>
            )}
            {latestMetrics && latestMetrics.memoryUsage > 100 * 1024 * 1024 && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">Memory</Badge>
                <span className="text-sm">
                  Memory usage is high. Check for memory leaks, implement cleanup in useEffect hooks, and consider lazy loading.
                </span>
              </li>
            )}
            {latestMetrics && latestMetrics.errorCount > 0 && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">Errors</Badge>
                <span className="text-sm">
                  There are {latestMetrics.errorCount} errors detected. Check the error monitoring dashboard for details.
                </span>
              </li>
            )}
            {(!latestMetrics || (latestMetrics.loadTime <= 2500 && latestMetrics.memoryUsage <= 50 * 1024 * 1024 && latestMetrics.errorCount === 0)) && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 text-green-600">Great!</Badge>
                <span className="text-sm">
                  Your application is performing well. All metrics are within optimal ranges.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}