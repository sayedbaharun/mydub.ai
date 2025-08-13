/**
 * AI Usage Monitoring Dashboard for MyDub.ai
 * Displays AI usage statistics, costs, and budget controls
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Activity,
  Settings,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import AIUsageTrackingService from '@/shared/services/ai-usage-tracking.service'
import AIBudgetControlService, { CostOptimizationSuggestion } from '@/shared/services/ai-budget-control.service'
import { cn } from '@/shared/lib/utils'

interface UsageStats {
  totalCost: number
  totalTokens: number
  totalRequests: number
  byService: Record<string, { cost: number; tokens: number; requests: number }>
  byDay: Array<{ date: string; cost: number; tokens: number; requests: number }>
}

interface BudgetStatus {
  budgetLimit: number
  currentUsage: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
  timeRemaining: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AIUsageMonitoringDashboard() {
  const { user } = useAuth()
  const { announce } = useScreenReader()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null)
  const [optimizations, setOptimizations] = useState<CostOptimizationSuggestion[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  const usageTracker = AIUsageTrackingService.getInstance()
  const budgetControl = AIBudgetControlService.getInstance()

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id, period])

  const loadDashboardData = async () => {
    if (!user?.id) return

    setLoading(true)
    announce('Loading AI usage dashboard data', 'polite')

    try {
      // Load usage statistics
      const stats = await usageTracker.getUserUsage(user.id, period)
      setUsageStats(stats)

      // Load budget status (mock implementation)
      const mockBudgetStatus: BudgetStatus = {
        budgetLimit: 100,
        currentUsage: stats.totalCost,
        percentage: (stats.totalCost / 100) * 100,
        status: stats.totalCost > 90 ? 'danger' : stats.totalCost > 70 ? 'warning' : 'safe',
        timeRemaining: '15 days'
      }
      setBudgetStatus(mockBudgetStatus)

      // Load optimization suggestions
      const suggestions = await budgetControl.getCostOptimizationSuggestions(user.id)
      setOptimizations(suggestions)

      // Load alerts
      const userAlerts = await budgetControl.getBudgetAlerts(user.id)
      setAlerts(userAlerts)

      announce(`Dashboard loaded. Current usage: $${stats.totalCost.toFixed(2)}`, 'polite')
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      announce('Error loading dashboard data', 'assertive')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'year') => {
    setPeriod(newPeriod)
    announce(`Switched to ${newPeriod} view`, 'polite')
  }

  const handleAlertDismiss = async (alertId: string) => {
    try {
      await budgetControl.markAlertAsRead(alertId)
      setAlerts(alerts.filter(alert => alert.id !== alertId))
      announce('Alert dismissed', 'polite')
    } catch (error) {
      announce('Error dismissing alert', 'assertive')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading AI usage dashboard...</span>
      </div>
    )
  }

  if (!usageStats || !budgetStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to load dashboard</AlertTitle>
        <AlertDescription>
          Please try refreshing the page or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  // Prepare chart data
  const serviceChartData = Object.entries(usageStats.byService).map(([service, data]) => ({
    name: service.replace('-', ' ').toUpperCase(),
    cost: data.cost,
    requests: data.requests,
    tokens: data.tokens
  }))

  const dailyChartData = usageStats.byDay.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="space-y-6" role="main" aria-label="AI Usage Monitoring Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Usage Dashboard</h1>
          <p className="text-gray-600">Monitor your AI service usage and costs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={handlePeriodChange} className="w-auto">
            <TabsList>
              <TabsTrigger value="day" aria-label="Daily view">Day</TabsTrigger>
              <TabsTrigger value="week" aria-label="Weekly view">Week</TabsTrigger>
              <TabsTrigger value="month" aria-label="Monthly view">Month</TabsTrigger>
              <TabsTrigger value="year" aria-label="Yearly view">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadDashboardData}
            aria-label="Refresh dashboard data"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert 
              key={alert.id}
              variant={alert.alert_type === 'limit_exceeded' ? 'destructive' : 'default'}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4" />
                <div className="ml-2">
                  <AlertTitle>Budget Alert</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlertDismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {period === 'day' ? 'Today' : `This ${period}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">API calls made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(usageStats.totalTokens / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Input + Output tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Progress 
                value={budgetStatus.percentage} 
                className="flex-1"
                aria-label={`Budget usage: ${budgetStatus.percentage}%`}
              />
              <Badge 
                variant={budgetStatus.status === 'danger' ? 'destructive' : 
                        budgetStatus.status === 'warning' ? 'secondary' : 'default'}
              >
                {budgetStatus.percentage.toFixed(0)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${budgetStatus.currentUsage.toFixed(2)} of ${budgetStatus.budgetLimit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>Daily cost and request volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="cost" orientation="left" />
                  <YAxis yAxisId="requests" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cost' ? `$${value}` : value,
                      name === 'cost' ? 'Cost' : 'Requests'
                    ]}
                  />
                  <Line 
                    yAxisId="cost"
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="requests"
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Service</CardTitle>
            <CardDescription>Cost breakdown by AI service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {serviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Optimization Suggestions */}
      {optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Optimization Suggestions</CardTitle>
            <CardDescription>Ways to reduce your AI usage costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizations.slice(0, 3).map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      Potential savings: ${suggestion.savings.toFixed(2)} 
                      ({((suggestion.savings / suggestion.current_cost) * 100).toFixed(1)}%)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {suggestion.implementation_difficulty} implementation
                      </Badge>
                      <Badge variant={suggestion.impact === 'high' ? 'default' : 'secondary'}>
                        {suggestion.impact} impact
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Detailed breakdown of AI service usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Service</th>
                  <th className="text-right p-2">Requests</th>
                  <th className="text-right p-2">Tokens</th>
                  <th className="text-right p-2">Cost</th>
                  <th className="text-right p-2">Avg Cost/Request</th>
                </tr>
              </thead>
              <tbody>
                {serviceChartData.map((service) => (
                  <tr key={service.name} className="border-b">
                    <td className="p-2 font-medium">{service.name}</td>
                    <td className="p-2 text-right">{service.requests.toLocaleString()}</td>
                    <td className="p-2 text-right">{(service.tokens / 1000).toFixed(1)}K</td>
                    <td className="p-2 text-right">${service.cost.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      ${service.requests > 0 ? (service.cost / service.requests).toFixed(3) : '0.000'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIUsageMonitoringDashboard