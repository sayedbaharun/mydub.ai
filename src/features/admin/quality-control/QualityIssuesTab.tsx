import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { 
  AlertTriangle, 
  Flag, 
  XCircle, 
  Undo2, 
  ExternalLink, 
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { 
  QualityAlertsService, 
  type QualityIssueItem, 
  type QualityMetrics,
  type QualityIssuesFilter 
} from '@/shared/services/quality-control/qualityAlerts.service'

export function QualityIssuesTab() {
  const [issues, setIssues] = useState<QualityIssueItem[]>([])
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<QualityIssuesFilter>({
    action: 'all',
    scoreThreshold: 80,
    limit: 20,
    offset: 0
  })
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [issuesResult, metricsResult] = await Promise.all([
        QualityAlertsService.getQualityIssues(filters),
        QualityAlertsService.getQualityMetrics()
      ])
      
      setIssues(issuesResult.items)
      setTotal(issuesResult.total)
      setMetrics(metricsResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quality data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof QualityIssuesFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filtering
    }))
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'flag': return <Flag className="h-4 w-4 text-yellow-600" />
      case 'reject': return <XCircle className="h-4 w-4 text-red-600" />
      case 'revision': return <Undo2 className="h-4 w-4 text-blue-600" />
      default: return null
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      flag: 'secondary',
      reject: 'destructive', 
      revision: 'default'
    } as const
    
    return (
      <Badge variant={variants[action as keyof typeof variants] || 'outline'}>
        {action}
      </Badge>
    )
  }

  const getScoreBadge = (score: number) => {
    if (score < 70) {
      return <Badge variant="destructive">Critical ({score}%)</Badge>
    }
    if (score < 80) {
      return <Badge variant="secondary">Low ({score}%)</Badge>
    }
    return <Badge variant="outline">{score}%</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />
      default: return null
    }
  }

  if (loading && !issues.length) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quality Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalIssues}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgQualityScore}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(metrics.recentTrend)}
                <span className="ml-1 capitalize">{metrics.recentTrend}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
              <p className="text-xs text-muted-foreground">Score &lt; 70%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Flagged Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.flaggedArticles}</div>
              <p className="text-xs text-muted-foreground">Needs review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quality Issues</CardTitle>
              <CardDescription>
                Articles with quality scores below 80% or flagged for review
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="flag">Flagged</SelectItem>
                  <SelectItem value="reject">Rejected</SelectItem>
                  <SelectItem value="revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={filters.scoreThreshold?.toString() || '80'}
                onValueChange={(value) => handleFilterChange('scoreThreshold', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Score threshold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">Score &lt; 90%</SelectItem>
                  <SelectItem value="80">Score &lt; 80%</SelectItem>
                  <SelectItem value="70">Score &lt; 70%</SelectItem>
                  <SelectItem value="60">Score &lt; 60%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {issue.article_title || 'Untitled'}
                        </div>
                        {issue.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {issue.notes.substring(0, 100)}
                            {issue.notes.length > 100 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(issue.action)}
                        {getActionBadge(issue.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getScoreBadge(issue.overall_score)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {issue.article_category || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(issue.reviewed_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Navigate to article review
                            console.log('Review article:', issue.article_id)
                          }}
                        >
                          Review
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Open article in new tab
                            window.open(`/articles/${issue.article_id}`, '_blank')
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {issues.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  No quality issues found with current filters
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > (filters.limit || 20) && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(filters.offset || 0) + 1} to {Math.min((filters.offset || 0) + (filters.limit || 20), total)} of {total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.offset || 0) === 0}
                  onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 20)))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.offset || 0) + (filters.limit || 20) >= total}
                  onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 20))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}