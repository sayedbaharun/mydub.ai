/**
 * Content Review Panel
 * Phase 2.1.4: Human review workflow for AI-generated content
 *
 * Features:
 * - Side-by-side content comparison
 * - Real-time editing with quality scoring
 * - Editor assignment and tracking
 * - Review comments and feedback
 * - Approval/rejection workflow
 * - Quality gate validation
 */

import { useState, useEffect } from 'react'
import {
  Check,
  X,
  Edit3,
  Eye,
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  BarChart3,
  Send,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Progress } from '@/shared/components/ui/progress'
import { Separator } from '@/shared/components/ui/separator'
import { toast } from 'sonner'
import { ContentQualityService, ContentQualityScore } from '@/features/content/services/content-quality.service'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/shared/lib/utils'

interface ContentReview {
  id: string
  generatedContentId: string
  title: string
  content: string
  originalContent: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  assignedTo?: string
  assignedToName?: string
  qualityScore?: number
  reviewNotes?: string
  created_at: string
}

interface ReviewComment {
  id: string
  userId: string
  userName: string
  comment: string
  timestamp: Date
}

export function ContentReviewPanel() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ContentReview[]>([])
  const [selectedReview, setSelectedReview] = useState<ContentReview | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [qualityScore, setQualityScore] = useState<ContentQualityScore | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')

  useEffect(() => {
    loadPendingReviews()
  }, [])

  useEffect(() => {
    if (selectedReview) {
      setEditedContent(selectedReview.content)
      setEditedTitle(selectedReview.title)
      setReviewNotes(selectedReview.reviewNotes || '')
      analyzeContentQuality()
    }
  }, [selectedReview])

  const loadPendingReviews = async () => {
    const { data } = await supabase
      .from('ai_generated_content')
      .select(`
        *,
        generation_request:ai_generation_requests(*)
      `)
      .eq('human_reviewed', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const mapped = data.map((item) => ({
        id: item.id,
        generatedContentId: item.id,
        title: item.title,
        content: item.content,
        originalContent: item.content,
        status: 'pending' as const,
        qualityScore: item.readability_score,
        reviewNotes: item.review_notes,
        created_at: item.created_at,
      }))
      setReviews(mapped)
    }
  }

  const analyzeContentQuality = async () => {
    if (!editedTitle || !editedContent) return

    setIsAnalyzing(true)
    try {
      const score = await ContentQualityService.analyzeContent(editedTitle, editedContent)
      setQualityScore(score)
    } catch (error) {
      console.error('Quality analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedReview) return

    try {
      // Save edited content
      await supabase
        .from('ai_generated_content')
        .update({
          title: editedTitle,
          content: editedContent,
          human_reviewed: true,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', selectedReview.generatedContentId)

      // Create actual article
      await supabase.from('news_articles').insert({
        title: editedTitle,
        content: editedContent,
        summary: editedContent.substring(0, 200),
        category: 'news',
        status: 'published',
        published_at: new Date().toISOString(),
        author_id: user?.id,
        ai_generated: true,
        ai_confidence_score: qualityScore?.overall || 0,
      })

      toast.success('Content approved and published!', {
        description: `${editedTitle} is now live`,
      })

      // Remove from review list
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id))
      setSelectedReview(null)
    } catch (error) {
      toast.error('Failed to approve content', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleReject = async () => {
    if (!selectedReview || !reviewNotes) {
      toast.error('Please provide rejection reason')
      return
    }

    try {
      await supabase
        .from('ai_generated_content')
        .update({
          human_reviewed: true,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: `REJECTED: ${reviewNotes}`,
        })
        .eq('id', selectedReview.generatedContentId)

      await supabase
        .from('ai_generation_requests')
        .update({ status: 'rejected' })
        .eq('generated_article_id', selectedReview.generatedContentId)

      toast.success('Content rejected', {
        description: 'Feedback has been logged',
      })

      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id))
      setSelectedReview(null)
    } catch (error) {
      toast.error('Failed to reject content')
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return

    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.fullName || 'Anonymous',
      comment: newComment,
      timestamp: new Date(),
    }

    setComments((prev) => [...prev, comment])
    setNewComment('')
  }

  const getStatusBadge = (status: ContentReview['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock, label: 'Pending Review' },
      in_review: { variant: 'default' as const, icon: Edit3, label: 'In Review' },
      approved: { variant: 'default' as const, icon: CheckCircle2, label: 'Approved' },
      rejected: { variant: 'destructive' as const, icon: X, label: 'Rejected' },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">Content Review Queue</h2>
          <p className="text-sm text-gray-600">{reviews.length} items pending review</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split">Split View</SelectItem>
              <SelectItem value="edit">Edit Only</SelectItem>
              <SelectItem value="preview">Preview Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Review Queue */}
        <div className="w-80 border-r overflow-y-auto">
          <div className="p-4 space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items in review queue</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card
                  key={review.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedReview?.id === review.id ? 'border-dubai-gold-600 bg-dubai-gold-50' : 'hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedReview(review)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{review.title}</h4>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    {review.qualityScore && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Quality Score</span>
                          <span className="font-medium">{review.qualityScore}%</span>
                        </div>
                        <Progress value={review.qualityScore} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right: Review Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedReview ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select an item to review</p>
              </div>
            </div>
          ) : (
            <>
              {/* Content Editor/Viewer */}
              <div className="flex-1 overflow-y-auto p-6">
                <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="split">Split View</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="split" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original Content */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Original (AI-Generated)</Label>
                        <div className="border rounded-lg p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
                          <h3 className="text-xl font-bold mb-4">{selectedReview.title}</h3>
                          <div className="prose prose-sm max-w-none">{selectedReview.originalContent}</div>
                        </div>
                      </div>

                      {/* Edited Content */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Your Edits</Label>
                        <div className="space-y-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="font-bold"
                            placeholder="Title"
                          />
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[450px] font-mono text-sm"
                            placeholder="Content"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="edit" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-xl font-bold"
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[600px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    <div className="border rounded-lg p-8 bg-white max-w-4xl mx-auto">
                      <h1 className="text-3xl font-bold mb-6">{editedTitle}</h1>
                      <div className="prose max-w-none">{editedContent}</div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Quality Metrics */}
                {qualityScore && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Quality Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Overall</div>
                          <div
                            className={cn(
                              'text-2xl font-bold',
                              qualityScore.overall >= 85
                                ? 'text-green-600'
                                : qualityScore.overall >= 75
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            )}
                          >
                            {qualityScore.overall}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Readability</div>
                          <div className="text-2xl font-bold">{qualityScore.categories.readability.score}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">SEO</div>
                          <div className="text-2xl font-bold">{qualityScore.categories.seo.score}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Engagement</div>
                          <div className="text-2xl font-bold">{qualityScore.categories.engagement.score}%</div>
                        </div>
                      </div>

                      {qualityScore.recommendations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-medium">Recommendations:</div>
                          {qualityScore.recommendations.slice(0, 3).map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{rec.issue}</div>
                                <div className="text-gray-600">{rec.suggestion}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Review Notes */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Review Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review, changes made, or rejection reason..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments ({comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-dubai-gold-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-dubai-gold-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.userName}</span>
                              <span className="text-xs text-gray-500">
                                {comment.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="min-h-[60px]"
                      />
                      <Button onClick={handleAddComment} size="sm" className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Bar */}
              <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {qualityScore?.passesThreshold ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Passes quality threshold ({qualityScore.overall}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      Below quality threshold (needs {75 - (qualityScore?.overall || 0)}% improvement)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => analyzeContentQuality()}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Re-analyze Quality'}
                  </Button>
                  <Button variant="outline" onClick={handleReject} className="gap-2">
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    disabled={!qualityScore?.passesThreshold}
                  >
                    <Check className="h-4 w-4" />
                    Approve & Publish
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
