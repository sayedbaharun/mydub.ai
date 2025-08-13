import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  FileText,
  Globe,
  BarChart3,
  Settings,
  Calendar,
  Zap
} from 'lucide-react'
import { ContentAutomationService } from '@/shared/services/content-automation.service'
import type { 
  ContentSchedule, 
  ContentTemplate, 
  ContentRule, 
  ApprovalWorkflow 
} from '@/shared/services/content-automation.service'

interface AutomationStats {
  scheduledContent: number
  pendingApprovals: number
  publishedToday: number
  activeRules: number
  templateCount: number
}

interface ProcessingResult {
  processed: number
  published: number
  failed: number
  errors: string[]
}

export function ContentAutomationDashboard() {
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scheduledContent, setScheduledContent] = useState<ContentSchedule[]>([])
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [rules, setRules] = useState<ContentRule[]>([])
  const [lastProcessingResult, setLastProcessingResult] = useState<ProcessingResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const [
        statsData,
        scheduledData,
        templatesData,
        rulesData
      ] = await Promise.all([
        ContentAutomationService.getAutomationStats(),
        ContentAutomationService.getScheduledContent({ status: 'scheduled' }),
        ContentAutomationService.getTemplates(),
        // We'll need to add a method to get rules
        Promise.resolve([])
      ])

      setStats(statsData)
      setScheduledContent(scheduledData)
      setTemplates(templatesData)
      setRules(rulesData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessContent = async () => {
    try {
      setIsProcessing(true)
      const result = await ContentAutomationService.processScheduledContent()
      setLastProcessingResult(result)
      await loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Failed to process content:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateContent = async () => {
    try {
      setIsProcessing(true)
      const result = await ContentAutomationService.generateContentFromExternalSources()
      
      setLastProcessingResult({
        processed: result.generated,
        published: 0,
        failed: result.generated - result.scheduled,
        errors: result.errors
      })
      
      await loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500'
      case 'published': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Automation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage automated content creation and publishing
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateContent} 
            disabled={isProcessing}
            variant="outline"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
          <Button 
            onClick={handleProcessContent} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Process Queue
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduledContent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Content awaiting publication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Needs human review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Today</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Articles went live today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
            <p className="text-xs text-muted-foreground">
              Automation rules running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.templateCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Content templates available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Processing Result */}
      {lastProcessingResult && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Last processing: {lastProcessingResult.processed} processed, {lastProcessingResult.published} published, {lastProcessingResult.failed} failed
            {lastProcessingResult.errors.length > 0 && (
              <div className="mt-2">
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    View errors ({lastProcessingResult.errors.length})
                  </summary>
                  <ul className="mt-1 text-xs space-y-1">
                    {lastProcessingResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Scheduled Content</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Content Queue</CardTitle>
              <CardDescription>
                Content scheduled for automatic publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledContent.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No scheduled content. Click "Generate Content" to create some.
                </p>
              ) : (
                <div className="space-y-4">
                  {scheduledContent.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{content.title}</h3>
                        <p className="text-sm text-muted-foreground">{content.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{content.content_type}</Badge>
                          <Badge variant="outline">{content.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Scheduled: {formatDate(content.scheduled_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(content.status)}`} />
                        <span className="text-sm capitalize">{content.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>
                Templates used for automated content generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No templates configured.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{template.content_type}</Badge>
                        <Badge 
                          variant={template.is_active ? "default" : "outline"}
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Default category: {template.template_data.default_category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Rules that govern content processing and publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No automation rules configured.
                </p>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{rule.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Priority: {rule.priority}</Badge>
                          <Badge 
                            variant={rule.is_active ? "default" : "outline"}
                          >
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="mt-2">
                        <Badge variant="secondary">{rule.rule_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}