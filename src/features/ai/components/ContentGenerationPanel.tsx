/**
 * Content Generation Panel
 * Phase 2.1.1: Admin UI for AI content generation
 *
 * Features:
 * - Request new content generation
 * - Monitor generation status
 * - View quality gate results
 * - Track model performance
 */

import { useState, useEffect } from 'react'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Zap,
  FileText,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Progress } from '@/shared/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { toast } from 'sonner'
import { AIContentGenerationService, GenerationRequest, GenerationResult } from '../services/content-generation.service'
import { supabase } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'

interface GenerationRequestRecord {
  id: string
  topic: string
  category: string
  status: string
  quality_score?: number
  passed_quality_gates?: boolean
  created_at: string
  generation_time_ms?: number
  model_provider: string
}

export function ContentGenerationPanel() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentRequests, setRecentRequests] = useState<GenerationRequestRecord[]>([])
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  // Form state
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('news')
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'friendly' | 'authoritative'>('professional')
  const [modelProvider, setModelProvider] = useState<'openai' | 'anthropic' | 'google' | 'ensemble'>('ensemble')
  const [wordCount, setWordCount] = useState(800)

  useEffect(() => {
    loadRecentRequests()

    // Refresh every 10 seconds
    const interval = setInterval(loadRecentRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadRecentRequests = async () => {
    const { data } = await supabase
      .from('ai_generation_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setRecentRequests(data)
    }
  }

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)

    try {
      const request: GenerationRequest = {
        topic: topic.trim(),
        category,
        tone,
        modelProvider,
        wordCountTarget: wordCount,
        priority: 5,
      }

      toast.info('Starting content generation...', {
        description: `Using ${modelProvider} to generate ${wordCount}-word article`,
      })

      const result: GenerationResult = await AIContentGenerationService.generateContent(request)

      if (result.success) {
        toast.success('Content generated successfully!', {
          description: `Quality score: ${result.content?.qualityMetrics.overallScore}%. Ready for human review.`,
          duration: 5000,
        })

        // Reset form
        setTopic('')

        // Reload requests
        await loadRecentRequests()
      } else {
        toast.error('Content generation failed', {
          description: result.errors?.join(', '),
        })
      }
    } catch (error) {
      toast.error('Generation error', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      pending: { variant: 'outline', icon: Clock },
      processing: { variant: 'default', icon: Zap },
      quality_check: { variant: 'default', icon: BarChart3 },
      human_review: { variant: 'secondary', icon: FileText },
      approved: { variant: 'default', icon: CheckCircle2 },
      rejected: { variant: 'destructive', icon: XCircle },
      failed: { variant: 'destructive', icon: AlertTriangle },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getQualityScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 85) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Content Generation</h2>
          <p className="text-sm text-gray-600">
            Generate high-quality content with multi-model AI and automated quality gates
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4 text-dubai-gold-600" />
          Multi-Model Pipeline
        </Badge>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
        </TabsList>

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Content Request</CardTitle>
              <CardDescription>
                Enter topic details to generate AI-powered content with quality validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., New Dubai Metro Expansion Plan 2026"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">Today (News)</SelectItem>
                      <SelectItem value="eatanddrink">Dining</SelectItem>
                      <SelectItem value="tourism">Experiences</SelectItem>
                      <SelectItem value="nightlife">Nightlife</SelectItem>
                      <SelectItem value="luxurylife">Luxury</SelectItem>
                      <SelectItem value="government">Practical (Gov)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={(v: any) => setTone(v)} disabled={isGenerating}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={modelProvider} onValueChange={(v: any) => setModelProvider(v)} disabled={isGenerating}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ensemble">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Ensemble (Best Quality)
                        </span>
                      </SelectItem>
                      <SelectItem value="openai">GPT-4 Turbo</SelectItem>
                      <SelectItem value="anthropic">Claude 3 Opus</SelectItem>
                      <SelectItem value="google">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCount">Target Word Count</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min={300}
                    max={2000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value))}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Quality gates: Readability • Bias • Fact-check • Originality • Overall score
                </div>
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !topic.trim()}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="h-4 w-4 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quality Gates Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Gate Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Readability</div>
                  <div className="text-2xl font-bold text-dubai-gold-600">≥60%</div>
                  <div className="text-xs text-gray-600">Flesch score</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Bias Check</div>
                  <div className="text-2xl font-bold text-dubai-gold-600">≥70%</div>
                  <div className="text-xs text-gray-600">Unbiased</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Accuracy</div>
                  <div className="text-2xl font-bold text-dubai-gold-600">≥85%</div>
                  <div className="text-xs text-gray-600">Fact-checked</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Originality</div>
                  <div className="text-2xl font-bold text-dubai-gold-600">≥80%</div>
                  <div className="text-xs text-gray-600">Unique</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Overall</div>
                  <div className="text-2xl font-bold text-dubai-gold-600">≥75%</div>
                  <div className="text-xs text-gray-600">Total score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Generation Requests</CardTitle>
              <CardDescription>
                Monitor status and quality scores for all content generation requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No generation requests yet</p>
                  </div>
                ) : (
                  recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        selectedRequest === request.id
                          ? 'border-dubai-gold-600 bg-dubai-gold-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setSelectedRequest(request.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{request.topic}</h4>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="capitalize">{request.category}</span>
                            <span>•</span>
                            <span>{request.model_provider}</span>
                            {request.generation_time_ms && (
                              <>
                                <span>•</span>
                                <span>{(request.generation_time_ms / 1000).toFixed(1)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                        {request.quality_score !== null && request.quality_score !== undefined && (
                          <div className="text-right">
                            <div className={cn('text-2xl font-bold', getQualityScoreColor(request.quality_score))}>
                              {request.quality_score}%
                            </div>
                            <div className="text-xs text-gray-600">Quality Score</div>
                          </div>
                        )}
                      </div>

                      {request.quality_score !== null && request.quality_score !== undefined && (
                        <div className="mt-3">
                          <Progress value={request.quality_score} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>Compare AI model performance and quality scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelPerformanceMetrics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ModelPerformanceMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    const { data } = await supabase
      .from('ai_model_performance')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(10)

    if (data) {
      setMetrics(data)
    }
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No performance data available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium capitalize">{metric.model_provider}</h4>
              <p className="text-sm text-gray-600">{metric.model_name}</p>
            </div>
            <Badge variant="outline">
              {metric.success_rate?.toFixed(1)}% Success Rate
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Avg Quality</div>
              <div className="text-xl font-bold text-dubai-gold-600">
                {metric.avg_quality_score?.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Time</div>
              <div className="text-xl font-bold">
                {(metric.avg_generation_time_ms / 1000).toFixed(1)}s
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Requests</div>
              <div className="text-xl font-bold">{metric.total_requests}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Pass Rate</div>
              <div className="text-xl font-bold">
                {metric.quality_gate_pass_rate?.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
