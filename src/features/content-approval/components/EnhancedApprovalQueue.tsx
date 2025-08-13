import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Progress } from '@/shared/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  Brain,
  Shield,
  Target,
  Zap,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enhancedContentApprovalService, EnhancedApprovalItem, QualityFilter } from '../services/enhancedContentApproval.service'

interface EnhancedApprovalQueueProps {
  className?: string
}

export const EnhancedApprovalQueue: React.FC<EnhancedApprovalQueueProps> = ({ className }) => {
  const [items, setItems] = useState<EnhancedApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState<QualityFilter>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewItem, setPreviewItem] = useState<EnhancedApprovalItem | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [autoProcessing, setAutoProcessing] = useState(false)

  useEffect(() => {
    loadApprovalQueue()
    loadStats()
  }, [page, filters])

  const loadApprovalQueue = async () => {
    try {
      setLoading(true)
      const result = await enhancedContentApprovalService.getEnhancedApprovalQueue(page, 20, filters)
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading approval queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await enhancedContentApprovalService.getEnhancedApprovalStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm })
    setPage(1)
  }

  const handleFilterChange = (key: keyof QualityFilter, value: any) => {
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  const handleAutoProcess = async () => {
    try {
      setAutoProcessing(true)
      const result = await enhancedContentApprovalService.autoProcessHighQualityItems()
      
      // Show results
      alert(`Auto-processed ${result.processed} items: ${result.approved} approved, ${result.rejected} rejected`)
      
      // Reload queue
      await loadApprovalQueue()
      await loadStats()
    } catch (error) {
      console.error('Error in auto-processing:', error)
      alert('Error during auto-processing')
    } finally {
      setAutoProcessing(false)
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    if (score >= 70) return 'outline'
    return 'destructive'
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'auto_approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'auto_reject':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'manual_review':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'conditional_approve':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default:
        return <Brain className="h-4 w-4 text-gray-500" />
    }
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'auto_approve':
        return <Badge variant="default" className="bg-green-100 text-green-800">Auto Approve</Badge>
      case 'auto_reject':
        return <Badge variant="destructive">Auto Reject</Badge>
      case 'manual_review':
        return <Badge variant="secondary">Manual Review</Badge>
      case 'conditional_approve':
        return <Badge variant="outline">Conditional</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading approval queue...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.quality_metrics?.average_quality_score || 0}</div>
              <Progress value={stats.quality_metrics?.average_quality_score || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.safety_metrics?.average_safety_score || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.safety_metrics?.safe_content || 0} safe, {stats.safety_metrics?.flagged_content || 0} flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Actions</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.quality_metrics?.auto_approved_by_quality || 0) + (stats.quality_metrics?.rejected_by_quality || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.quality_metrics?.auto_approved_by_quality || 0} approved, {stats.quality_metrics?.rejected_by_quality || 0} rejected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.quality_metrics?.flagged_for_review || 0}</div>
              <p className="text-xs text-muted-foreground">
                Quality review required
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enhanced Approval Queue</CardTitle>
              <CardDescription>Content approval with AI quality assessment</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleAutoProcess}
                disabled={autoProcessing}
                variant="outline"
                size="sm"
              >
                {autoProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Auto Process
              </Button>
              <Button onClick={loadApprovalQueue} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value || undefined)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.quality_decision || ''} onValueChange={(value) => handleFilterChange('quality_decision', value || undefined)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Quality Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Decisions</SelectItem>
                <SelectItem value="auto_approve">Auto Approve</SelectItem>
                <SelectItem value="auto_reject">Auto Reject</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
                <SelectItem value="conditional_approve">Conditional</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Min Quality:</label>
              <Input
                type="number"
                min="0"
                max="100"
                className="w-20"
                placeholder="0"
                value={filters.min_quality_score || ''}
                onChange={(e) => handleFilterChange('min_quality_score', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Content Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === items.length && items.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? items.map(item => item.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>AI Decision</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(prev => 
                            checked 
                              ? [...prev, item.id]
                              : prev.filter(id => id !== item.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium truncate max-w-48">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.content_type} • {formatDistanceToNow(new Date(item.created_at))} ago
                        </div>
                        {item.ai_agent && (
                          <div className="text-xs text-blue-600">by {item.ai_agent.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-2">
                              <div className={`text-lg font-bold ${getQualityScoreColor(item.quality_scores?.overall_score || 0)}`}>
                                {item.quality_scores?.overall_score || 0}
                              </div>
                              <Progress 
                                value={item.quality_scores?.overall_score || 0} 
                                className="w-16" 
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1 text-xs">
                              <div>Content: {item.quality_scores?.content_quality || 0}</div>
                              <div>Grammar: {item.quality_scores?.grammar_score || 0}</div>
                              <div>Cultural: {item.quality_scores?.cultural_sensitivity_score || 0}</div>
                              <div>Safety: {item.quality_scores?.safety_score || 0}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDecisionIcon(item.quality_decision?.decision || '')}
                        {getDecisionBadge(item.quality_decision?.decision || '')}
                      </div>
                      {item.quality_decision?.confidence && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.quality_decision.confidence.toFixed(0)}% confidence
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{item.moderation_status?.overall_safety_score || 0}</span>
                      </div>
                      {item.moderation_status?.detected_issues && item.moderation_status.detected_issues > 0 && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.moderation_status.detected_issues} issues
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {item.quality_decision?.warnings?.map((warning, index) => (
                          <Badge key={index} variant="outline" className="text-xs block">
                            {warning}
                          </Badge>
                        ))}
                        {item.duplicate_check?.is_duplicate && (
                          <Badge variant="destructive" className="text-xs">
                            Duplicate
                          </Badge>
                        )}
                        {item.fact_verification?.disputed_claims && item.fact_verification.disputed_claims > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {item.fact_verification.disputed_claims} disputed claims
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setPreviewItem(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Content Quality Analysis</DialogTitle>
                              <DialogDescription>
                                Detailed quality assessment for: {item.title}
                              </DialogDescription>
                            </DialogHeader>
                            {previewItem && (
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList>
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="scores">Quality Scores</TabsTrigger>
                                  <TabsTrigger value="content">Content</TabsTrigger>
                                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Overall Quality</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">
                                          {previewItem.quality_scores?.overall_score || 0}
                                        </div>
                                        <Progress value={previewItem.quality_scores?.overall_score || 0} className="mt-2" />
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">AI Decision</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center space-x-2">
                                          {getDecisionIcon(previewItem.quality_decision?.decision || '')}
                                          <span className="font-medium">
                                            {previewItem.quality_decision?.decision || 'Pending'}
                                          </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {previewItem.quality_decision?.confidence?.toFixed(0)}% confidence
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                  
                                  {previewItem.quality_decision?.warnings && previewItem.quality_decision.warnings.length > 0 && (
                                    <Alert>
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        <strong>Warnings:</strong> {previewItem.quality_decision.warnings.join(', ')}
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </TabsContent>

                                <TabsContent value="scores" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(previewItem.quality_scores || {}).map(([key, value]) => (
                                      <div key={key} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="capitalize">{key.replace('_', ' ')}</span>
                                          <span className="font-medium">{value}</span>
                                        </div>
                                        <Progress value={value} />
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>

                                <TabsContent value="content">
                                  <ScrollArea className="h-64">
                                    <div className="prose prose-sm max-w-none">
                                      <h3>{previewItem.title}</h3>
                                      <p className="text-muted-foreground">{previewItem.excerpt}</p>
                                      <div className="whitespace-pre-wrap">{previewItem.content}</div>
                                    </div>
                                  </ScrollArea>
                                </TabsContent>

                                <TabsContent value="recommendations">
                                  <div className="space-y-4">
                                    {previewItem.quality_decision?.recommendations && previewItem.quality_decision.recommendations.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Recommendations</h4>
                                        <ul className="space-y-1">
                                          {previewItem.quality_decision.recommendations.map((rec, index) => (
                                            <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {previewItem.quality_decision?.triggered_rules && previewItem.quality_decision.triggered_rules.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Triggered Rules</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {previewItem.quality_decision.triggered_rules.map((rule, index) => (
                                            <Badge key={index} variant="outline">{rule}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {/* Approval Actions */}
                        <Button variant="outline" size="sm" className="text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {items.length} of {total} items
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">Page {page}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(page + 1)}
                disabled={items.length < 20}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedApprovalQueue