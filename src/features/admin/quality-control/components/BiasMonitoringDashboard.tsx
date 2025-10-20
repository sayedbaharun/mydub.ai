import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, TrendingUp, Users, Globe, BarChart3, RefreshCw } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { BiasAnalysisService, type BiasMetrics, type BiasAlert } from '../services/bias-analysis.service'
import { cn } from '@/shared/lib/utils'

export function BiasMonitoringDashboard() {
  const [metrics, setMetrics] = useState<BiasMetrics | null>(null)
  const [alerts, setAlerts] = useState<BiasAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadMetrics = async () => {
    try {
      setRefreshing(true)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7) // Last 7 days

      const [metricsData, alertsData] = await Promise.all([
        BiasAnalysisService.analyzeBiasMetrics(startDate, endDate),
        BiasAnalysisService.getBiasAlerts(),
      ])

      setMetrics(metricsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading bias metrics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-dubai-gold-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading bias analytics...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-gray-500">
        No bias metrics available. Please try again later.
      </div>
    )
  }

  const getSeverityColor = (severity: BiasAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getScoreColor = (score: number, threshold: number, inverted = false) => {
    const condition = inverted ? score > threshold : score < threshold
    if (condition) {
      if (inverted ? score > threshold + 20 : score < threshold - 20) return 'text-red-600'
      return 'text-orange-600'
    }
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-midnight-black mb-2">
            Bias Monitoring Dashboard
          </h2>
          <p className="text-gray-600">
            Last 7 days • {metrics.totalArticles} articles analyzed
          </p>
        </div>
        <Button
          onClick={loadMetrics}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className="p-6 bg-gradient-to-r from-dubai-gold-50 to-white border-dubai-gold-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Overall Bias Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-midnight-black">
                {metrics.overallBiasScore}
              </span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.overallBiasScore >= 80 ? 'Excellent' : metrics.overallBiasScore >= 60 ? 'Good' : metrics.overallBiasScore >= 40 ? 'Fair' : 'Needs Improvement'}
            </p>
          </div>
          <div className={cn(
            'h-24 w-24 rounded-full flex items-center justify-center',
            metrics.overallBiasScore >= 80 ? 'bg-green-100' : metrics.overallBiasScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          )}>
            {metrics.overallBiasScore >= 60 ? (
              <CheckCircle2 className={cn(
                'h-12 w-12',
                metrics.overallBiasScore >= 80 ? 'text-green-600' : 'text-yellow-600'
              )} />
            ) : (
              <AlertTriangle className="h-12 w-12 text-red-600" />
            )}
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gender Balance */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gender Balance</p>
              <p className={cn(
                'text-2xl font-light',
                getScoreColor(metrics.genderBalance, 60)
              )}>
                {metrics.genderBalance}%
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Male</span>
              <span className="font-medium">{metrics.genderDistribution.male}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Female</span>
              <span className="font-medium">{metrics.genderDistribution.female}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Neutral</span>
              <span className="font-medium">{metrics.genderDistribution.neutral}</span>
            </div>
          </div>
        </Card>

        {/* Nationality Diversity */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nationality Diversity</p>
              <p className={cn(
                'text-2xl font-light',
                getScoreColor(metrics.nationalityDiversity, 50)
              )}>
                {metrics.nationalityDiversity}%
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <p>{Object.keys(metrics.nationalityDistribution).length} nationalities represented</p>
            <div className="mt-2 space-y-1">
              {Object.entries(metrics.nationalityDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([nationality, count]) => (
                  <div key={nationality} className="flex justify-between">
                    <span className="capitalize">{nationality}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        {/* Topic Concentration */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Topic Concentration</p>
              <p className={cn(
                'text-2xl font-light',
                getScoreColor(metrics.topicConcentration, 40, true)
              )}>
                {metrics.topicConcentration}%
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <p className="mb-2">Lower is better (&lt;40%)</p>
            <div className="space-y-1">
              {Object.entries(metrics.topicDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([topic, count]) => (
                  <div key={topic} className="flex justify-between">
                    <span className="capitalize">{topic.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        {/* Sentiment Balance */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sentiment Balance</p>
              <p className={cn(
                'text-2xl font-light',
                getScoreColor(metrics.sentimentBalance, 65)
              )}>
                {metrics.sentimentBalance}%
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Positive</span>
              <span className="font-medium">{metrics.sentimentDistribution.positive}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Neutral</span>
              <span className="font-medium">{metrics.sentimentDistribution.neutral}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Negative</span>
              <span className="font-medium">{metrics.sentimentDistribution.negative}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-midnight-black mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Active Bias Alerts ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className={cn('p-5 border-l-4', getSeverityColor(alert.severity))}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <Badge variant="outline" className={cn('text-xs', getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Target: {alert.threshold}%</p>
                    <p className={cn(
                      'text-lg font-semibold',
                      alert.actualValue < alert.threshold ? 'text-red-600' : 'text-green-600'
                    )}>
                      {alert.actualValue.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {alert.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-dubai-gold-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts */}
      {alerts.length === 0 && (
        <Card className="p-8 bg-green-50 border-green-200">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-green-900 mb-1">
              No Bias Alerts
            </h3>
            <p className="text-sm text-green-700">
              Content is well-balanced across all metrics. Keep up the great work!
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
