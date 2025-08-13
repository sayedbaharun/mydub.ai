import { useState } from 'react'
import { useAgents, useAgentMetrics } from '../hooks/useAgentStatus'
import { AgentMetrics } from '../types'
import { Card } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { TrendingUp, BarChart3, PieChartIcon, Clock } from 'lucide-react'

export function AgentPerformanceChart() {
  const { data: agents } = useAgents()
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [period, setPeriod] = useState<AgentMetrics['period']>('day')
  
  const { data: metrics, isLoading } = useAgentMetrics(selectedAgentId, period)

  // Select first agent by default
  if (!selectedAgentId && agents?.length) {
    setSelectedAgentId(agents[0].id)
  }

  const selectedAgent = agents?.find(a => a.id === selectedAgentId)

  // Calculate summary stats
  const summaryStats = metrics ? {
    totalArticles: metrics.metrics.articles_generated,
    approvalRate: metrics.metrics.articles_approved / metrics.metrics.articles_generated * 100,
    avgQuality: metrics.metrics.quality_scores.reduce((a, b) => a + b, 0) / metrics.metrics.quality_scores.length
  } : null

  // Prepare source utilization data for pie chart
  const sourceData = metrics ? Object.entries(metrics.metrics.source_utilization).map(([source, count]) => ({
    name: source,
    value: count
  })) : []

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Agent
            </label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents?.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Time Period
            </label>
            <Select value={period} onValueChange={(value) => setPeriod(value as AgentMetrics['period'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Last Hour</SelectItem>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      {selectedAgent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-3xl font-light text-gray-900 mt-1">
                  {summaryStats?.totalArticles || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-3xl font-light text-gray-900 mt-1">
                  {summaryStats?.approvalRate.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className="text-3xl font-light text-gray-900 mt-1">
                  {summaryStats?.avgQuality.toFixed(1) || 0}/100
                </p>
              </div>
              <PieChartIcon className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="quality">Quality Trends</TabsTrigger>
          <TabsTrigger value="sources">Source Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Article Generation Timeline
            </h3>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return period === 'hour' ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                             period === 'day' ? date.toLocaleTimeString('en-US', { hour: '2-digit' }) :
                             date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis style={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="articles" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    name="Articles Generated"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', r: 4 }}
                    name="Errors"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quality Score Trends
            </h3>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return period === 'hour' ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                             period === 'day' ? date.toLocaleTimeString('en-US', { hour: '2-digit' }) :
                             date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} style={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    name="Average Quality Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Content Source Distribution
            </h3>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No source data available for this period
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}