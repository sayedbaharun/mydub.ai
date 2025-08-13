import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { QualityMetricsChart } from './QualityMetricsChart'
import { QualityRulesManager } from './QualityRulesManager'
import { ContentModerationPanel } from './ContentModerationPanel'
import { LearningSystemPanel } from './LearningSystemPanel'
import { qualityRulesEngine } from '@/shared/services/quality-control/qualityRules'
import { learningSystemService } from '@/shared/services/quality-control/learningSystem.service'

interface QualityDashboardProps {
  className?: string
}

interface QualityStats {
  total_evaluated: number
  auto_approved: number
  manual_reviews: number
  auto_rejected: number
  average_score: number
  common_issues: Array<{ issue: string; count: number }>
  rule_triggers: Array<{ rule_name: string; count: number }>
}

interface PerformanceMetrics {
  agent_id?: string
  content_type: string
  time_period: string
  total_content: number
  auto_approved: number
  manual_reviews: number
  auto_rejected: number
  human_overrides: number
  accuracy_score: number
  false_positive_rate: number
  false_negative_rate: number
  average_quality_score: number
  common_issues: Array<{ issue: string; frequency: number }>
  improvement_trends: Array<{ metric: string; trend: 'improving' | 'declining' | 'stable'; change_rate: number }>
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({ className }) => {
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [selectedContentType, setSelectedContentType] = useState<string>('all')

  useEffect(() => {
    loadDashboardData()
  }, [timeframe, selectedContentType])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Initialize quality rules engine
      await qualityRulesEngine.initialize()
      
      // Load quality statistics
      const stats = await qualityRulesEngine.getQualityStats(timeframe)
      setQualityStats(stats)

      // Load performance metrics
      const metrics = await learningSystemService.generatePerformanceMetrics(
        undefined, // agentId
        selectedContentType === 'all' ? undefined : selectedContentType,
        timeframe
      )
      setPerformanceMetrics(metrics)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'auto_reject':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'manual_review':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string, changeRate: number) => {
    if (trend === 'improving' || (trend === 'declining' && changeRate < 0)) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (trend === 'declining' || (trend === 'improving' && changeRate < 0)) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <div className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quality dashboard...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Control Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage content quality across all AI agents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
          </select>
          <select
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Content Types</option>
            <option value="news">News</option>
            <option value="tourism">Tourism</option>
            <option value="government">Government</option>
            <option value="events">Events</option>
            <option value="practical">Practical</option>
          </select>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {qualityStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluated</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityStats.total_evaluated}</div>
              <p className="text-xs text-muted-foreground">
                Content pieces processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{qualityStats.auto_approved}</div>
              <p className="text-xs text-muted-foreground">
                {qualityStats.total_evaluated > 0 
                  ? `${((qualityStats.auto_approved / qualityStats.total_evaluated) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual Reviews</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{qualityStats.manual_reviews}</div>
              <p className="text-xs text-muted-foreground">
                {qualityStats.total_evaluated > 0 
                  ? `${((qualityStats.manual_reviews / qualityStats.total_evaluated) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityStats.average_score.toFixed(1)}</div>
              <Progress value={qualityStats.average_score} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rules">Quality Rules</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="learning">Learning System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Common Issues */}
            {qualityStats && qualityStats.common_issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Common Issues</CardTitle>
                  <CardDescription>Most frequently occurring quality issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qualityStats.common_issues.slice(0, 5).map((issue, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{issue.issue}</span>
                        <Badge variant="secondary">{issue.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rule Triggers */}
            {qualityStats && qualityStats.rule_triggers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Triggered Rules</CardTitle>
                  <CardDescription>Rules that trigger most often</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qualityStats.rule_triggers.slice(0, 5).map((rule, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{rule.rule_name}</span>
                        <Badge variant="outline">{rule.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quality Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>Quality scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <QualityMetricsChart 
                timeframe={timeframe}
                contentType={selectedContentType}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performanceMetrics.length > 0 ? (
            <div className="grid gap-4">
              {performanceMetrics.map((metrics, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {metrics.content_type.charAt(0).toUpperCase() + metrics.content_type.slice(1)} Content
                        {metrics.agent_id && ` (Agent: ${metrics.agent_id})`}
                      </span>
                      <Badge variant="outline">{metrics.time_period}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                      <div>
                        <div className="text-2xl font-bold">{metrics.accuracy_score.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.false_positive_rate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">False Positive Rate</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.false_negative_rate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">False Negative Rate</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.human_overrides}</div>
                        <p className="text-xs text-muted-foreground">Human Overrides</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.average_quality_score.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Avg Quality Score</p>
                      </div>
                    </div>

                    {metrics.improvement_trends.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Improvement Trends</h4>
                        <div className="space-y-2">
                          {metrics.improvement_trends.map((trend, trendIndex) => (
                            <div key={trendIndex} className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                {getTrendIcon(trend.trend, trend.change_rate)}
                                <span className="ml-2">{trend.metric.replace(/_/g, ' ')}</span>
                              </span>
                              <span className={`font-medium ${
                                trend.trend === 'improving' ? 'text-green-600' : 
                                trend.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {trend.change_rate > 0 ? '+' : ''}{trend.change_rate.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No performance data available for the selected timeframe</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <QualityRulesManager />
        </TabsContent>

        <TabsContent value="moderation">
          <ContentModerationPanel />
        </TabsContent>

        <TabsContent value="learning">
          <LearningSystemPanel />
        </TabsContent>
      </Tabs>

      {/* Alerts for Critical Issues */}
      {qualityStats && qualityStats.auto_rejected > qualityStats.auto_approved * 0.5 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High rejection rate detected. Consider reviewing quality thresholds and rules.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default QualityDashboard