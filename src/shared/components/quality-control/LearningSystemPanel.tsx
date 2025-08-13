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
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Brain, TrendingUp, TrendingDown, Lightbulb, Target, CheckCircle, XCircle, AlertTriangle, Zap, BarChart3, Settings } from 'lucide-react'
import { learningSystemService, FeedbackRecord, LearningPattern, ImprovementSuggestion, PerformanceMetrics } from '@/shared/services/quality-control/learningSystem.service'

interface LearningSystemPanelProps {
  className?: string
}

interface LearningStats {
  total_feedback: number
  processed_feedback: number
  learning_patterns: number
  improvement_suggestions: number
  accuracy_improvement: number
  rule_adjustments: number
  false_positive_reduction: number
  false_negative_reduction: number
}

interface FeedbackFormData {
  content_id: string
  feedback_type: FeedbackRecord['feedback_type']
  rating: number
  feedback_text: string
  specific_issues: string[]
  suggested_improvements: string[]
  feedback_category: FeedbackRecord['feedback_category']
  ai_decision_correct: boolean
  human_override_reason?: string
}

export const LearningSystemPanel: React.FC<LearningSystemPanelProps> = ({ className }) => {
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRecord[]>([])
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([])
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>({
    content_id: '',
    feedback_type: 'quality_rating',
    rating: 3,
    feedback_text: '',
    specific_issues: [],
    suggested_improvements: [],
    feedback_category: 'content_quality',
    ai_decision_correct: true
  })

  useEffect(() => {
    loadLearningData()
  }, [])

  const loadLearningData = async () => {
    try {
      setLoading(true)
      
      // Generate sample learning statistics
      const stats: LearningStats = {
        total_feedback: 485,
        processed_feedback: 421,
        learning_patterns: 23,
        improvement_suggestions: 12,
        accuracy_improvement: 15.2,
        rule_adjustments: 8,
        false_positive_reduction: 22.5,
        false_negative_reduction: 18.3
      }
      setLearningStats(stats)
      
      // Generate sample feedback records
      const feedback = generateSampleFeedback()
      setRecentFeedback(feedback)
      
      // Generate sample learning patterns
      const patterns = generateSamplePatterns()
      setLearningPatterns(patterns)
      
      // Get improvement suggestions
      const suggestions = await learningSystemService.getImprovementSuggestions(10)
      if (suggestions.length === 0) {
        // Generate sample suggestions if none exist
        setImprovementSuggestions(generateSampleSuggestions())
      } else {
        setImprovementSuggestions(suggestions)
      }
      
      // Get performance metrics
      const metrics = await learningSystemService.generatePerformanceMetrics()
      setPerformanceMetrics(metrics)
      
    } catch (error) {
      console.error('Error loading learning data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSampleFeedback = (): FeedbackRecord[] => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `feedback_${i + 1}`,
      content_id: `content_${i + 1}`,
      user_id: `user_${Math.floor(Math.random() * 10) + 1}`,
      feedback_type: ['quality_rating', 'content_correction', 'rule_feedback', 'general_feedback'][Math.floor(Math.random() * 4)] as any,
      rating: Math.floor(Math.random() * 5) + 1,
      feedback_text: getRandomFeedbackText(),
      specific_issues: getRandomIssues(),
      suggested_improvements: getRandomImprovements(),
      ai_decision_correct: Math.random() > 0.3,
      feedback_category: ['grammar', 'content_quality', 'cultural_sensitivity', 'fact_accuracy', 'bias', 'readability'][Math.floor(Math.random() * 6)] as any,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      processed: Math.random() > 0.2,
      impact_score: Math.floor(Math.random() * 100)
    }))
  }

  const generateSamplePatterns = (): LearningPattern[] => {
    return [
      {
        id: 'pattern_1',
        pattern_type: 'approval_pattern',
        pattern_data: { threshold: 85, confidence: 0.89 },
        confidence: 0.89,
        frequency: 45,
        last_observed: new Date().toISOString(),
        suggested_rules: [],
        pattern_description: 'Content with high cultural sensitivity scores (>85) consistently gets approved',
        impact_assessment: 'High confidence pattern that could optimize auto-approval rules'
      },
      {
        id: 'pattern_2',
        pattern_type: 'rejection_pattern',
        pattern_data: { common_issues: ['bias', 'cultural_insensitivity'] },
        confidence: 0.82,
        frequency: 28,
        last_observed: new Date().toISOString(),
        suggested_rules: [],
        pattern_description: 'Content flagged for bias often also has cultural sensitivity issues',
        impact_assessment: 'Could improve detection by combining bias and cultural checks'
      },
      {
        id: 'pattern_3',
        pattern_type: 'quality_correlation',
        pattern_data: { correlation: 0.76 },
        confidence: 0.91,
        frequency: 67,
        last_observed: new Date().toISOString(),
        suggested_rules: [],
        pattern_description: 'Strong correlation between grammar scores and overall content quality',
        impact_assessment: 'Grammar scores could be weighted higher in quality assessment'
      }
    ]
  }

  const generateSampleSuggestions = (): ImprovementSuggestion[] => {
    return [
      {
        id: 'suggestion_1',
        suggestion_type: 'rule_adjustment',
        priority: 'high',
        description: 'Increase cultural sensitivity threshold for tourism content',
        expected_benefit: 'Reduce false positives in tourism content by 15%',
        implementation_effort: 'low',
        confidence: 0.85,
        supporting_data: { false_positive_rate: 12, content_type: 'tourism' },
        estimated_impact: 15,
        created_at: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: 'suggestion_2',
        suggestion_type: 'threshold_change',
        priority: 'medium',
        description: 'Adjust grammar score weight in overall quality calculation',
        expected_benefit: 'Improve overall accuracy by 8%',
        implementation_effort: 'low',
        confidence: 0.78,
        supporting_data: { correlation: 0.76 },
        estimated_impact: 8,
        created_at: new Date().toISOString(),
        status: 'under_review'
      }
    ]
  }

  const getRandomFeedbackText = () => {
    const texts = [
      'The AI assessment was too strict on cultural sensitivity',
      'Grammar evaluation seems accurate',
      'Content quality score was underestimated',
      'Bias detection was false positive',
      'Good overall assessment',
      'Cultural context was misunderstood',
      'SEO recommendations were helpful'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }

  const getRandomIssues = () => {
    const issues = ['grammar', 'cultural_sensitivity', 'bias', 'readability', 'seo', 'fact_accuracy']
    const count = Math.floor(Math.random() * 3)
    return Array.from({ length: count }, () => issues[Math.floor(Math.random() * issues.length)])
  }

  const getRandomImprovements = () => {
    const improvements = [
      'Review cultural context guidelines',
      'Improve grammar detection accuracy',
      'Update bias detection patterns',
      'Enhance readability analysis',
      'Refine SEO scoring algorithm'
    ]
    const count = Math.floor(Math.random() * 2) + 1
    return Array.from({ length: count }, () => improvements[Math.floor(Math.random() * improvements.length)])
  }

  const handleSubmitFeedback = async () => {
    try {
      await learningSystemService.recordFeedback(feedbackForm)
      setShowFeedbackDialog(false)
      setFeedbackForm({
        content_id: '',
        feedback_type: 'quality_rating',
        rating: 3,
        feedback_text: '',
        specific_issues: [],
        suggested_improvements: [],
        feedback_category: 'content_quality',
        ai_decision_correct: true
      })
      await loadLearningData() // Refresh data
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleImplementSuggestion = async (suggestionId: string) => {
    try {
      await learningSystemService.implementSuggestion(suggestionId, 'admin')
      await loadLearningData() // Refresh data
    } catch (error) {
      console.error('Error implementing suggestion:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'default'
      case 'approved':
        return 'secondary'
      case 'under_review':
        return 'outline'
      case 'pending':
        return 'outline'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <BarChart3 className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Brain className="h-8 w-8 animate-pulse" />
        <span className="ml-2">Loading learning system data...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Learning System</h2>
          <p className="text-muted-foreground">
            AI system improvement through continuous learning and feedback
          </p>
        </div>
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogTrigger asChild>
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Provide Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quality Feedback</DialogTitle>
              <DialogDescription>
                Help improve the AI system by providing feedback on content evaluation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="content_id">Content ID</Label>
                <input
                  id="content_id"
                  className="w-full px-3 py-2 border rounded-md"
                  value={feedbackForm.content_id}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content_id: e.target.value })}
                  placeholder="Enter content ID"
                />
              </div>

              <div>
                <Label htmlFor="feedback_type">Feedback Type</Label>
                <Select value={feedbackForm.feedback_type} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, feedback_type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality_rating">Quality Rating</SelectItem>
                    <SelectItem value="content_correction">Content Correction</SelectItem>
                    <SelectItem value="rule_feedback">Rule Feedback</SelectItem>
                    <SelectItem value="general_feedback">General Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Select value={feedbackForm.rating.toString()} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, rating: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feedback_text">Feedback</Label>
                <Textarea
                  id="feedback_text"
                  value={feedbackForm.feedback_text}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })}
                  placeholder="Describe your feedback..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={feedbackForm.feedback_category} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, feedback_category: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="content_quality">Content Quality</SelectItem>
                    <SelectItem value="cultural_sensitivity">Cultural Sensitivity</SelectItem>
                    <SelectItem value="fact_accuracy">Fact Accuracy</SelectItem>
                    <SelectItem value="bias">Bias</SelectItem>
                    <SelectItem value="readability">Readability</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ai_decision_correct"
                  checked={feedbackForm.ai_decision_correct}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, ai_decision_correct: e.target.checked })}
                />
                <Label htmlFor="ai_decision_correct">AI decision was correct</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback}>
                Submit Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      {learningStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.total_feedback}</div>
              <p className="text-xs text-muted-foreground">
                {learningStats.processed_feedback} processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Improvement</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{learningStats.accuracy_improvement}%</div>
              <p className="text-xs text-muted-foreground">
                Since last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Patterns</CardTitle>
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.learning_patterns}</div>
              <p className="text-xs text-muted-foreground">
                Patterns identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.improvement_suggestions}</div>
              <p className="text-xs text-muted-foreground">
                Pending improvements
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList>
          <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="suggestions">Improvements</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest user feedback on AI content evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>AI Correct</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFeedback.slice(0, 10).map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="font-medium">{feedback.content_id}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-40">
                          {feedback.feedback_text}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{feedback.feedback_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{feedback.feedback_category}</Badge>
                      </TableCell>
                      <TableCell>
                        {feedback.ai_decision_correct ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={feedback.impact_score} className="w-16" />
                          <span className="text-sm">{feedback.impact_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={feedback.processed ? "default" : "outline"}>
                          {feedback.processed ? 'Processed' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Learning patterns help identify trends in content evaluation and suggest system improvements.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {learningPatterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{pattern.pattern_type.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {(pattern.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <Badge variant="secondary">
                        {pattern.frequency} occurrences
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{pattern.pattern_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium">Impact Assessment</h4>
                      <p className="text-sm text-muted-foreground">{pattern.impact_assessment}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span>{(pattern.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={pattern.confidence * 100} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            {improvementSuggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{suggestion.description}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(suggestion.priority) as any}>
                        {suggestion.priority}
                      </Badge>
                      <Badge variant={getStatusColor(suggestion.status) as any}>
                        {suggestion.status}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {suggestion.expected_benefit} • {suggestion.implementation_effort} effort
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Confidence</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={suggestion.confidence * 100} className="flex-1" />
                          <span>{(suggestion.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Estimated Impact</span>
                        <div className="text-lg font-bold text-green-600">
                          +{suggestion.estimated_impact}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Type</span>
                        <div className="capitalize">{suggestion.suggestion_type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleImplementSuggestion(suggestion.id)}
                        >
                          Implement
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Improvements</CardTitle>
                <CardDescription>Performance gains from learning system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy Improvement</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(learningStats?.accuracy_improvement || 0)}
                      <span className="font-medium text-green-600">
                        +{learningStats?.accuracy_improvement}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">False Positive Reduction</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(-(learningStats?.false_positive_reduction || 0))}
                      <span className="font-medium text-green-600">
                        -{learningStats?.false_positive_reduction}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">False Negative Reduction</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(-(learningStats?.false_negative_reduction || 0))}
                      <span className="font-medium text-green-600">
                        -{learningStats?.false_negative_reduction}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rule Adjustments Made</span>
                    <span className="font-medium">{learningStats?.rule_adjustments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Velocity</CardTitle>
                <CardDescription>Rate of system improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">92%</div>
                    <div className="text-sm text-muted-foreground">Learning efficiency</div>
                  </div>
                  <Progress value={92} />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Feedback Processing</div>
                      <div className="text-muted-foreground">
                        {learningStats ? 
                          ((learningStats.processed_feedback / learningStats.total_feedback) * 100).toFixed(0) : 0
                        }% completion rate
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Pattern Recognition</div>
                      <div className="text-muted-foreground">
                        {learningStats?.learning_patterns} patterns found
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Content Type */}
          {performanceMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Content Type</CardTitle>
                <CardDescription>Learning system effectiveness across different content types</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>False Positives</TableHead>
                      <TableHead>False Negatives</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{metric.content_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={metric.accuracy_score} className="w-16" />
                            <span className="text-sm">{metric.accuracy_score.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{metric.false_positive_rate.toFixed(1)}%</TableCell>
                        <TableCell>{metric.false_negative_rate.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {metric.improvement_trends.map((trend, trendIndex) => (
                              <div key={trendIndex} className="flex items-center">
                                {getTrendIcon(trend.change_rate)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LearningSystemPanel