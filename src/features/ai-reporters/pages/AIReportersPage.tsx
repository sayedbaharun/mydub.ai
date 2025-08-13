import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAIReporterDashboard, useRealtimeContentUpdates } from '../hooks/useAgentStatus'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AgentStatusGrid } from '../components/AgentStatusGrid'
import { AgentPerformanceChart } from '../components/AgentPerformanceChart'
import { SourceManager } from '../components/SourceManager'
import { DashboardPageHeader } from '@/features/dashboard/components/DashboardPageHeader'
import {
  Bot,
  Activity,
  Newspaper,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  BarChart3,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function AIReportersPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const { data: dashboard, isLoading } = useAIReporterDashboard()

  // Enable real-time content updates
  useRealtimeContentUpdates()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'article_generated':
        return Newspaper
      case 'source_added':
        return Database
      case 'agent_error':
        return AlertCircle
      case 'configuration_change':
        return Activity
      default:
        return Activity
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPageHeader
        title="AI Reporters"
        description="Monitor and manage AI content generation agents"
        icon={Bot}
        showBackToDashboard={true}
        showBackToHome={true}
        actions={
          dashboard && (
            <div
              className={`rounded-lg px-4 py-2 ${getHealthColor(dashboard.overall_metrics.system_health)}`}
            >
              <p className="text-sm font-medium">
                System Health: {dashboard.overall_metrics.system_health.toUpperCase()}
              </p>
            </div>
          )
        }
      />

      {/* Overview Stats */}
      <div className="mx-auto max-w-7xl px-8 py-8">
        {isLoading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          dashboard && (
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Agents</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.total_agents}
                    </p>
                  </div>
                  <Bot className="h-6 w-6 text-purple-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.active_agents}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sources</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.total_sources}
                    </p>
                  </div>
                  <Database className="h-6 w-6 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sources</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.active_sources}
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Articles</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.articles_today}
                    </p>
                  </div>
                  <Newspaper className="h-6 w-6 text-orange-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="mt-1 text-2xl font-light text-gray-900">
                      {dashboard.overall_metrics.pending_review}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </Card>
            </div>
          )
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard?.recent_activity.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
                      >
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {activity.agent && <span>{activity.agent} • </span>}
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {dashboard?.recent_activity.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No recent activity</p>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                  <BarChart3 className="h-5 w-5" />
                  Top Performing Agents
                </h3>
                {dashboard?.agents
                  .sort((a, b) => b.performance.approval_rate - a.performance.approval_rate)
                  .slice(0, 5)
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between py-2">
                      <span className="text-sm">{agent.name}</span>
                      <Badge variant="outline">{agent.performance.approval_rate}% approval</Badge>
                    </div>
                  ))}
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                  <TrendingUp className="h-5 w-5" />
                  Most Active Sources
                </h3>
                {dashboard?.sources
                  .filter((s) => s.status === 'active')
                  .sort(
                    (a, b) =>
                      (b.last_fetched ? new Date(b.last_fetched).getTime() : 0) -
                      (a.last_fetched ? new Date(a.last_fetched).getTime() : 0)
                  )
                  .slice(0, 5)
                  .map((source) => (
                    <div key={source.id} className="flex items-center justify-between py-2">
                      <span className="text-sm">{source.name}</span>
                      <Badge variant="outline">{source.type}</Badge>
                    </div>
                  ))}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <AgentStatusGrid />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <AgentPerformanceChart />
          </TabsContent>

          <TabsContent value="sources" className="mt-6">
            <SourceManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AIReportersPage
