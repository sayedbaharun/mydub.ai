import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { AlertTriangle, Shield, Eye, Ban, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { contentModerationService, ContentModerationResult, ModerationIssue } from '@/shared/services/quality-control/contentModeration.service'

interface ContentModerationPanelProps {
  className?: string
}

interface ModerationStats {
  total_moderated: number
  safe_content: number
  flagged_content: number
  blocked_content: number
  pending_review: number
  average_safety_score: number
  common_issues: Array<{ issue_type: string; count: number; severity: string }>
  bias_detections: number
  cultural_issues: number
  legal_concerns: number
}

interface ModerationHistoryItem {
  id: string
  content_id: string
  title: string
  moderation_status: string
  safety_score: number
  detected_issues: ModerationIssue[]
  moderated_at: string
  requires_review: boolean
}

export const ContentModerationPanel: React.FC<ContentModerationPanelProps> = ({ className }) => {
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null)
  const [moderationHistory, setModerationHistory] = useState<ModerationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [selectedIssue, setSelectedIssue] = useState<ModerationHistoryItem | null>(null)

  useEffect(() => {
    loadModerationData()
  }, [selectedTimeframe])

  const loadModerationData = async () => {
    try {
      setLoading(true)
      
      // Generate sample moderation statistics
      const stats: ModerationStats = {
        total_moderated: 1250,
        safe_content: 1050,
        flagged_content: 150,
        blocked_content: 35,
        pending_review: 15,
        average_safety_score: 87.5,
        common_issues: [
          { issue_type: 'inappropriate_content', count: 45, severity: 'medium' },
          { issue_type: 'cultural_insensitivity', count: 32, severity: 'high' },
          { issue_type: 'bias', count: 28, severity: 'medium' },
          { issue_type: 'legal_concern', count: 18, severity: 'high' },
          { issue_type: 'spam', count: 15, severity: 'low' }
        ],
        bias_detections: 28,
        cultural_issues: 32,
        legal_concerns: 18
      }
      
      setModerationStats(stats)
      
      // Generate sample moderation history
      const history: ModerationHistoryItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `mod_${i + 1}`,
        content_id: `content_${i + 1}`,
        title: `Content Item ${i + 1}: ${getRandomTitle()}`,
        moderation_status: getRandomStatus(),
        safety_score: Math.floor(Math.random() * 100),
        detected_issues: generateRandomIssues(),
        moderated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        requires_review: Math.random() > 0.7
      }))
      
      setModerationHistory(history)
      
    } catch (error) {
      console.error('Error loading moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRandomTitle = () => {
    const titles = [
      'Dubai Tourism Guide 2024',
      'UAE Government Updates',
      'Local Business News',
      'Cultural Festival Coverage',
      'Shopping Mall Opening',
      'Restaurant Review',
      'Weather Update',
      'Traffic Report'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  const getRandomStatus = () => {
    const statuses = ['safe', 'needs_review', 'unsafe', 'blocked']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const generateRandomIssues = (): ModerationIssue[] => {
    const issueTypes = ['inappropriate_content', 'cultural_insensitivity', 'bias', 'legal_concern', 'spam']
    const severities = ['low', 'medium', 'high', 'critical']
    const count = Math.floor(Math.random() * 3)
    
    return Array.from({ length: count }, (_, i) => ({
      id: `issue_${i}`,
      issue_type: issueTypes[Math.floor(Math.random() * issueTypes.length)] as any,
      severity: severities[Math.floor(Math.random() * severities.length)] as any,
      confidence: Math.random(),
      description: 'Sample moderation issue detected',
      location: 'content_text',
      flagged_text: 'sample text',
      context: 'sample context',
      suggested_action: 'Review and consider alternatives'
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'default'
      case 'needs_review':
        return 'secondary'
      case 'unsafe':
        return 'destructive'
      case 'blocked':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'needs_review':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'unsafe':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="h-8 w-8 animate-pulse" />
        <span className="ml-2">Loading moderation data...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-muted-foreground">
            Monitor safety, bias detection, and cultural sensitivity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {moderationStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Moderated</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.total_moderated}</div>
              <p className="text-xs text-muted-foreground">
                Content pieces reviewed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.average_safety_score.toFixed(1)}</div>
              <Progress value={moderationStats.average_safety_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{moderationStats.flagged_content}</div>
              <p className="text-xs text-muted-foreground">
                {((moderationStats.flagged_content / moderationStats.total_moderated) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Content</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{moderationStats.blocked_content}</div>
              <p className="text-xs text-muted-foreground">
                {((moderationStats.blocked_content / moderationStats.total_moderated) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
          <TabsTrigger value="history">Moderation History</TabsTrigger>
          <TabsTrigger value="bias">Bias Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Common Issues */}
            {moderationStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Common Issues</CardTitle>
                  <CardDescription>Most frequently detected moderation issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {moderationStats.common_issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm capitalize">{issue.issue_type.replace('_', ' ')}</span>
                          <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs">
                            {issue.severity}
                          </Badge>
                        </div>
                        <Badge variant="outline">{issue.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Moderation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Moderation Trends</CardTitle>
                <CardDescription>Key metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bias Detections</span>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">-12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cultural Issues</span>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">-8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safety Score</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">+5%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">False Positives</span>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">-15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Content Status Distribution</CardTitle>
              <CardDescription>Breakdown of content by moderation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{moderationStats?.safe_content}</div>
                  <div className="text-sm text-muted-foreground">Safe</div>
                  <Progress value={moderationStats ? (moderationStats.safe_content / moderationStats.total_moderated) * 100 : 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{moderationStats?.flagged_content}</div>
                  <div className="text-sm text-muted-foreground">Flagged</div>
                  <Progress value={moderationStats ? (moderationStats.flagged_content / moderationStats.total_moderated) * 100 : 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{moderationStats?.blocked_content}</div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                  <Progress value={moderationStats ? (moderationStats.blocked_content / moderationStats.total_moderated) * 100 : 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{moderationStats?.pending_review}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <Progress value={moderationStats ? (moderationStats.pending_review / moderationStats.total_moderated) * 100 : 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Issue analysis helps identify patterns in moderation problems and improve detection accuracy.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {moderationStats?.common_issues.map((issue, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{issue.issue_type.replace('_', ' ')}</span>
                    <Badge variant={getSeverityColor(issue.severity) as any}>
                      {issue.severity} severity
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Detected {issue.count} times in the selected timeframe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Detection Rate</span>
                      <span>{((issue.count / (moderationStats?.total_moderated || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(issue.count / (moderationStats?.total_moderated || 1)) * 100} />
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Common Patterns</h4>
                      <div className="text-sm text-muted-foreground">
                        {getIssuePatterns(issue.issue_type)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderation Activity</CardTitle>
              <CardDescription>Latest content moderation results</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Safety Score</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderationHistory.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.content_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.moderation_status)}
                          <Badge variant={getStatusColor(item.moderation_status) as any}>
                            {item.moderation_status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.safety_score}</span>
                          <Progress value={item.safety_score} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.detected_issues.slice(0, 2).map((issue, issueIndex) => (
                            <Badge key={issueIndex} variant="outline" className="text-xs">
                              {issue.issue_type}
                            </Badge>
                          ))}
                          {item.detected_issues.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.detected_issues.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.moderated_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedIssue(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Moderation Details</DialogTitle>
                              <DialogDescription>
                                Detailed moderation analysis for {item.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Safety Score</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Progress value={item.safety_score} className="flex-1" />
                                  <span className="font-medium">{item.safety_score}/100</span>
                                </div>
                              </div>
                              
                              {item.detected_issues.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Detected Issues</h4>
                                  <ScrollArea className="h-40">
                                    <div className="space-y-2">
                                      {item.detected_issues.map((issue, issueIndex) => (
                                        <div key={issueIndex} className="border rounded p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium capitalize">
                                              {issue.issue_type.replace('_', ' ')}
                                            </span>
                                            <Badge variant={getSeverityColor(issue.severity) as any}>
                                              {issue.severity}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {issue.description}
                                          </p>
                                          <p className="text-sm mt-1">
                                            <strong>Suggested Action:</strong> {issue.suggested_action}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Gender Bias</CardTitle>
                <CardDescription>Gender representation analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-sm text-muted-foreground">Gender balance score</p>
                <Progress value={92} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Bias</CardTitle>
                <CardDescription>Cultural sensitivity analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">88%</div>
                <p className="text-sm text-muted-foreground">Cultural sensitivity score</p>
                <Progress value={88} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language Bias</CardTitle>
                <CardDescription>Objective language analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-sm text-muted-foreground">Objectivity score</p>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bias Detection Trends</CardTitle>
              <CardDescription>Bias detection patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Gender Stereotyping', 'Cultural Generalizations', 'Age Discrimination', 'Nationality Bias'].map((biasType, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{biasType}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={Math.random() * 100} className="w-24" />
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 20)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const getIssuePatterns = (issueType: string): string => {
  const patterns: Record<string, string> = {
    inappropriate_content: 'Often occurs in user-generated content, informal language usage, and casual commentary.',
    cultural_insensitivity: 'Frequently found in content lacking local context awareness or using inappropriate cultural references.',
    bias: 'Common in content with generalized statements, stereotypical language, or unbalanced representation.',
    legal_concern: 'Typically appears in content discussing regulated activities or making unverified claims.',
    spam: 'Usually detected in content with excessive repetition, multiple links, or promotional language.'
  }
  return patterns[issueType] || 'Pattern analysis not available for this issue type.'
}

export default ContentModerationPanel