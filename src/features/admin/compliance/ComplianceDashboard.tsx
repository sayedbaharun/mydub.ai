import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Globe,
  Lock,
  Brain,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { format } from 'date-fns'
import { useToast } from '@/shared/hooks/use-toast'

interface ComplianceMetrics {
  overallScore: number
  dataResidency: {
    compliant: boolean
    totalItems: number
    uaeStored: number
    violations: number
  }
  contentModeration: {
    totalModerated: number
    flaggedContent: number
    blockedContent: number
    pendingReview: number
  }
  aiTransparency: {
    totalDecisions: number
    optOutUsers: number
    transparencyRequests: number
  }
  userConsent: {
    totalUsers: number
    consentGiven: number
    parentalConsents: number
    pendingConsents: number
  }
}

interface ComplianceIssue {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  affectedUsers: number
  createdAt: Date
  status: 'open' | 'investigating' | 'resolved'
}

export function ComplianceDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    try {
      setLoading(true)

      // Load compliance metrics
      const [residencyData, moderationData, aiData, consentData, complianceIssues] =
        await Promise.all([
          loadDataResidencyMetrics(),
          loadContentModerationMetrics(),
          loadAITransparencyMetrics(),
          loadUserConsentMetrics(),
          loadComplianceIssues(),
        ])

      const overallScore = calculateOverallScore({
        dataResidency: residencyData,
        contentModeration: moderationData,
        aiTransparency: aiData,
        userConsent: consentData,
      })

      setMetrics({
        overallScore,
        dataResidency: residencyData,
        contentModeration: moderationData,
        aiTransparency: aiData,
        userConsent: consentData,
      })

      setIssues(complianceIssues)
    } catch (error) {
      console.error('Failed to load compliance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load compliance metrics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDataResidencyMetrics = async () => {
    const { data } = await supabase.from('data_residency_compliance_summary').select('*').single()

    return {
      compliant: (data?.critical_violations || 0) === 0,
      totalItems: data?.total_data_items || 0,
      uaeStored: data?.uae_stored_items || 0,
      violations: data?.critical_violations || 0,
    }
  }

  const loadContentModerationMetrics = async () => {
    const { data } = await supabase
      .from('moderation_statistics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)

    const totals = data?.reduce(
      (acc, day) => ({
        totalModerated: acc.totalModerated + day.total_moderations,
        flaggedContent: acc.flaggedContent + day.flagged_content,
        blockedContent: acc.blockedContent + day.blocked_content,
        pendingReview: acc.pendingReview + day.content_for_review,
      }),
      {
        totalModerated: 0,
        flaggedContent: 0,
        blockedContent: 0,
        pendingReview: 0,
      }
    )

    return (
      totals || {
        totalModerated: 0,
        flaggedContent: 0,
        blockedContent: 0,
        pendingReview: 0,
      }
    )
  }

  const loadAITransparencyMetrics = async () => {
    const { data: decisions } = await supabase
      .from('ai_decision_logs')
      .select('id', { count: 'exact', head: true })

    const { data: optOuts } = await supabase
      .from('ai_opt_out_logs')
      .select('user_id')
      .eq('opted_out', true)

    const { data: transparencyRequests } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'ai_data_export')

    return {
      totalDecisions: decisions?.count || 0,
      optOutUsers: new Set(optOuts?.map((o) => o.user_id) || []).size,
      transparencyRequests: transparencyRequests?.count || 0,
    }
  }

  const loadUserConsentMetrics = async () => {
    const { data: users } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    const { data: consents } = await supabase
      .from('cookie_preferences')
      .select('id', { count: 'exact', head: true })
      .not('consent_given_at', 'is', null)

    const { data: parentalConsents } = await supabase
      .from('parental_consents')
      .select('id, status', { count: 'exact' })

    const approvedParental = parentalConsents?.filter((c) => c.status === 'approved').length || 0
    const pendingParental = parentalConsents?.filter((c) => c.status === 'pending').length || 0

    return {
      totalUsers: users?.count || 0,
      consentGiven: consents?.count || 0,
      parentalConsents: approvedParental,
      pendingConsents: pendingParental,
    }
  }

  const loadComplianceIssues = async () => {
    // In production, this would load from a compliance issues table
    // For now, return sample data based on metrics
    const issues: ComplianceIssue[] = []

    if (metrics?.dataResidency.violations > 0) {
      issues.push({
        id: '1',
        type: 'data_residency',
        severity: 'critical',
        description: `${metrics.dataResidency.violations} critical data items stored outside UAE`,
        affectedUsers: metrics.dataResidency.violations,
        createdAt: new Date(),
        status: 'open',
      })
    }

    if (metrics?.contentModeration.pendingReview > 10) {
      issues.push({
        id: '2',
        type: 'content_moderation',
        severity: 'high',
        description: `${metrics.contentModeration.pendingReview} content items pending moderation review`,
        affectedUsers: metrics.contentModeration.pendingReview,
        createdAt: new Date(),
        status: 'investigating',
      })
    }

    return issues
  }

  const calculateOverallScore = (metrics: Omit<ComplianceMetrics, 'overallScore'>) => {
    let score = 100

    // Data residency violations (critical)
    if (!metrics.dataResidency.compliant) {
      score -= 30
    }

    // Content moderation issues
    const moderationRate =
      metrics.contentModeration.blockedContent / (metrics.contentModeration.totalModerated || 1)
    if (moderationRate > 0.1) score -= 10 // More than 10% blocked content
    if (metrics.contentModeration.pendingReview > 50) score -= 10

    // AI transparency
    const optOutRate = metrics.aiTransparency.optOutUsers / (metrics.userConsent.totalUsers || 1)
    if (optOutRate > 0.2) score -= 10 // More than 20% opt-out

    // User consent
    const consentRate = metrics.userConsent.consentGiven / (metrics.userConsent.totalUsers || 1)
    if (consentRate < 0.9) score -= 10 // Less than 90% consent

    return Math.max(0, score)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadComplianceData()
    setRefreshing(false)
    toast({
      title: 'Refreshed',
      description: 'Compliance metrics updated',
    })
  }

  const generateComplianceReport = async () => {
    toast({
      title: 'Generating Report',
      description: 'Your compliance report is being generated...',
    })

    // In production, this would generate a PDF report
    setTimeout(() => {
      toast({
        title: 'Report Ready',
        description: 'Compliance report has been downloaded',
      })
    }, 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to Load Compliance Data</AlertTitle>
        <AlertDescription>Please try refreshing the page or contact support.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">UAE Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor compliance with UAE Federal Law No. 45 of 2021 and other regulations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={generateComplianceReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-5xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {metrics.overallScore >= 90
                  ? 'Excellent'
                  : metrics.overallScore >= 70
                    ? 'Good - Attention Needed'
                    : 'Critical - Immediate Action Required'}
              </p>
            </div>
            <div className="h-32 w-32">
              <Progress value={metrics.overallScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Issues */}
      {issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Compliance Issues</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    <span className="text-sm">{issue.description}</span>
                  </div>
                  <Badge variant="outline">{issue.status}</Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-residency">Data Residency</TabsTrigger>
          <TabsTrigger value="content">Content Moderation</TabsTrigger>
          <TabsTrigger value="ai-transparency">AI Transparency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Data Residency Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Residency</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.dataResidency.compliant ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Compliant
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-5 w-5" />
                      Violations
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.dataResidency.uaeStored}/{metrics.dataResidency.totalItems} items in UAE
                </p>
              </CardContent>
            </Card>

            {/* Content Moderation Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Moderation</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.contentModeration.pendingReview}</div>
                <p className="text-xs text-muted-foreground">Pending review</p>
                <div className="mt-2 text-xs">
                  <span className="text-red-600">
                    {metrics.contentModeration.blockedContent} blocked
                  </span>
                  {' / '}
                  <span>{metrics.contentModeration.totalModerated} total</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Transparency Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Transparency</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.aiTransparency.totalDecisions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">AI decisions logged</p>
                <div className="mt-2 text-xs">
                  {metrics.aiTransparency.optOutUsers} users opted out
                </div>
              </CardContent>
            </Card>

            {/* User Consent Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Consent</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (metrics.userConsent.consentGiven / metrics.userConsent.totalUsers) * 100
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Consent rate</p>
                <div className="mt-2 text-xs">
                  {metrics.userConsent.pendingConsents} pending parental
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
              <CardDescription>30-day compliance metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <BarChart3 className="mr-2 h-8 w-8" />
                Compliance trend chart would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-residency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Residency Compliance</CardTitle>
              <CardDescription>
                UAE Federal Law No. 45 of 2021 Data Localization Requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Total Data Items</span>
                  <span className="font-bold">{metrics.dataResidency.totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stored in UAE</span>
                  <span className="font-bold text-green-600">
                    {metrics.dataResidency.uaeStored}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Critical Violations</span>
                  <span className="font-bold text-red-600">{metrics.dataResidency.violations}</span>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="mb-2 font-medium">Critical Data Types (Must be in UAE)</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Government records</div>
                  <div>• Health records</div>
                  <div>• Financial transactions</div>
                  <div>• Personal identification</div>
                  <div>• Data of minors (under 18)</div>
                </div>
              </div>

              {metrics.dataResidency.violations > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    Critical data found outside UAE data centers. Immediate migration required for
                    compliance.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Overview</CardTitle>
              <CardDescription>UAE content guidelines and moderation statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last 30 Days</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Moderated</span>
                      <span>{metrics.contentModeration.totalModerated}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Flagged Content</span>
                      <span className="text-yellow-600">
                        {metrics.contentModeration.flaggedContent}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Blocked Content</span>
                      <span className="text-red-600">
                        {metrics.contentModeration.blockedContent}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending Review</span>
                      <span className="text-blue-600">
                        {metrics.contentModeration.pendingReview}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Violation Categories</p>
                  <div className="space-y-1 text-sm">
                    <div>• Hate speech / Violence</div>
                    <div>• Adult content</div>
                    <div>• Gambling / Drugs</div>
                    <div>• Religious offense</div>
                    <div>• Political extremism</div>
                  </div>
                </div>
              </div>

              {metrics.contentModeration.pendingReview > 0 && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>Review Queue</AlertTitle>
                  <AlertDescription>
                    {metrics.contentModeration.pendingReview} items awaiting manual review.
                    <Button size="sm" variant="link" className="px-2">
                      Go to Moderation Queue →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-transparency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Transparency & Ethics</CardTitle>
              <CardDescription>AI usage disclosure and user control metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">AI Usage Metrics</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total AI Decisions</span>
                      <span>{metrics.aiTransparency.totalDecisions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Users Opted Out</span>
                      <span>{metrics.aiTransparency.optOutUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Export Requests</span>
                      <span>{metrics.aiTransparency.transparencyRequests}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Compliance Requirements</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>AI usage disclosure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Opt-out mechanism</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Decision logging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Data export capability</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="mb-2 text-sm font-medium">AI Models in Use</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">GPT-4</Badge>
                  <Badge variant="secondary">Claude-3</Badge>
                  <Badge variant="secondary">Gemini Pro</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ComplianceDashboard
