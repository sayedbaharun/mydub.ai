import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { RefreshCw, Shuffle, ExternalLink, ArrowRightLeft, Check, Flag, XCircle, Undo2 } from 'lucide-react'
import editorialService from '@/features/editorial/services/editorial.service'
import { ARTICLE_STATUSES } from '@/shared/types/article-status'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { qualityReviewService, type QCAction } from '@/shared/services/quality-control/qualityReview.service'
import { trackEvent } from '../../../../monitoring/sentry.config'
import { QUALITY_THRESHOLDS } from '@/shared/config/quality'
import { QualityAlert, useQualityAlert } from '@/shared/components/quality-control/QualityAlert'

interface EditorialArticleMinimal {
  id: string
  title: string
  summary?: string | null
  content?: string | null
  status: string
  category?: string | null
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

const pickRandom = <T,>(arr: T[]): T | undefined => {
  if (!arr.length) return undefined
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}

export const RandomReviewPanel: React.FC = () => {
  const [articles, setArticles] = useState<EditorialArticleMinimal[]>([])
  const [current, setCurrent] = useState<EditorialArticleMinimal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'content' | 'reader' | 'mobile'>('content')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<QCAction | null>(null)
  
  // Quality alert state
  const { shouldShowAlert, dismissAlert, resetAlert } = useQualityAlert()
  // Detailed scores
  const [contentQuality, setContentQuality] = useState<number>(80)
  const [grammarScore, setGrammarScore] = useState<number>(80)
  const [readabilityScore, setReadabilityScore] = useState<number>(80)
  const [seoScore, setSeoScore] = useState<number>(80)
  const [brandVoiceScore, setBrandVoiceScore] = useState<number>(80)
  const [culturalSensitivityScore, setCulturalSensitivityScore] = useState<number>(85)
  const [factualAccuracyScore, setFactualAccuracyScore] = useState<number>(80)
  const [imageQualityScore, setImageQualityScore] = useState<number>(75)
  const derivedOverall = useMemo(() => {
    // Mirror weights from qualityAssessment.service.ts
    const weights = {
      contentQuality: 0.25,
      grammarScore: 0.15,
      readabilityScore: 0.15,
      seoScore: 0.15,
      brandVoiceScore: 0.10,
      culturalSensitivityScore: 0.10,
      factualAccuracyScore: 0.05,
      imageQualityScore: 0.05,
    }
    const sum =
      contentQuality * weights.contentQuality +
      grammarScore * weights.grammarScore +
      readabilityScore * weights.readabilityScore +
      seoScore * weights.seoScore +
      brandVoiceScore * weights.brandVoiceScore +
      culturalSensitivityScore * weights.culturalSensitivityScore +
      factualAccuracyScore * weights.factualAccuracyScore +
      imageQualityScore * weights.imageQualityScore
    return Math.round(sum)
  }, [contentQuality, grammarScore, readabilityScore, seoScore, brandVoiceScore, culturalSensitivityScore, factualAccuracyScore, imageQualityScore])
  const [notes, setNotes] = useState<string>('')
  const [applyStatusChange, setApplyStatusChange] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Phase 1: fetch recent published articles and randomize client-side
      const { articles: data } = await editorialService.getArticles(
        { status: [ARTICLE_STATUSES.PUBLISHED] },
        { field: 'published_at' as any, direction: 'desc' },
        1,
        200
      )
      setArticles(data as EditorialArticleMinimal[])
      const picked = pickRandom(data as EditorialArticleMinimal[])
      setCurrent(picked ?? null)
      resetAlert() // Reset quality alert for initial article
    } catch (e: any) {
      setError(e?.message || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const nextRandom = () => {
    if (!articles.length) return
    let candidate = pickRandom(articles)
    // avoid same selection when possible
    if (candidate && current && candidate.id === current.id && articles.length > 1) {
      candidate = pickRandom(articles.filter(a => a.id !== current.id))
    }
    setCurrent(candidate ?? null)
    resetAlert() // Reset quality alert for new article
  }

  const openReview = (action: QCAction) => {
    setPendingAction(action)
    setContentQuality(80)
    setGrammarScore(80)
    setReadabilityScore(80)
    setSeoScore(80)
    setBrandVoiceScore(80)
    setCulturalSensitivityScore(85)
    setFactualAccuracyScore(80)
    setImageQualityScore(75)
    setNotes('')
    setApplyStatusChange(false)
    setReviewOpen(true)
  }

  const submitReview = async () => {
    if (!current || !pendingAction) return
    try {
      setSubmitting(true)
      setError(null)
      await qualityReviewService.createReview({
        article_id: current.id,
        action: pendingAction,
        overall_score: derivedOverall,
        content_quality: contentQuality,
        grammar_score: grammarScore,
        readability_score: readabilityScore,
        seo_score: seoScore,
        brand_voice_score: brandVoiceScore,
        cultural_sensitivity_score: culturalSensitivityScore,
        factual_accuracy_score: factualAccuracyScore,
        image_quality_score: imageQualityScore,
        notes: notes?.trim() || undefined,
      })

      // Basic alerts & breadcrumbs
      if (derivedOverall < QUALITY_THRESHOLDS.bannerThreshold) {
        trackEvent('qc.low_score', {
          article_id: current.id,
          score: derivedOverall,
          action: pendingAction,
        })
        // also surface in console for local visibility
        console.warn('[QC] Low overall score < 80', { id: current.id, derivedOverall, pendingAction })
      }

      if (pendingAction === 'flag' || pendingAction === 'reject') {
        trackEvent('qc.flag_or_reject', {
          article_id: current.id,
          action: pendingAction,
          score: derivedOverall,
        })
      }

      // Optional status transition
      if (applyStatusChange) {
        if (pendingAction === 'approve') {
          await editorialService.updateArticle(current.id, { status: ARTICLE_STATUSES.APPROVED } as any)
        } else if (pendingAction === 'reject') {
          await editorialService.updateArticle(current.id, { status: ARTICLE_STATUSES.REJECTED } as any)
        } else if (pendingAction === 'revision') {
          await editorialService.updateArticle(current.id, { status: ARTICLE_STATUSES.NEEDS_REVISION } as any)
        }
      }
      setReviewOpen(false)
      // Optionally move to another article after a submission
      nextRandom()
    } catch (e: any) {
      setError(e?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const readerUrl = useMemo(() => {
    return current ? `${window.location.origin}/news/${current.id}` : ''
  }, [current])

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <CardTitle>Random Quality Review</CardTitle>
          <CardDescription>
            Randomly sample published articles for manual quality checks
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadArticles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={nextRandom} disabled={loading || !articles.length}>
            <Shuffle className="h-4 w-4 mr-1" /> New Random
          </Button>
          {current && (
            <a href={readerUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" /> Open Reader
              </Button>
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quality Alert Banner */}
        {current && shouldShowAlert(derivedOverall) && (
          <QualityAlert
            score={derivedOverall}
            articleTitle={current.title}
            onDismiss={dismissAlert}
            className="mb-4"
          />
        )}

        {!current ? (
          <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : 'No published articles found.'}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{current.title}</div>
                <div className="text-xs text-muted-foreground">{current.category || 'uncategorized'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{current.status}</Badge>
                {current.published_at && (
                  <Badge variant="secondary">{new Date(current.published_at).toLocaleString()}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setView(v => (v === 'mobile' ? 'reader' : 'mobile'))}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> Toggle Mobile/Reader
                </Button>
              </div>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="reader">Reader</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Fields</CardTitle>
                      <CardDescription>Raw article data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="mb-2"><span className="font-medium">Title:</span> {current.title}</div>
                        {current.summary && (
                          <div className="mb-2"><span className="font-medium">Summary:</span> {current.summary}</div>
                        )}
                        <div className="mb-2"><span className="font-medium">Category:</span> {current.category || '—'}</div>
                        <div className="mb-2"><span className="font-medium">Published:</span> {current.published_at ? new Date(current.published_at).toLocaleString() : '—'}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Body</CardTitle>
                      <CardDescription>Full text</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 border rounded p-3 text-sm leading-relaxed">
                        {current.content || 'No content available'}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reader">
                <div className="border rounded overflow-hidden">
                  {current && (
                    <iframe title="Reader View" src={readerUrl} className="w-full h-[700px] bg-white" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mobile">
                <div className="flex justify-center py-2">
                  <div className="border rounded-xl overflow-hidden shadow-xl" style={{ width: 390 }}>
                    {current && (
                      <iframe title="Mobile View" src={readerUrl} className="w-[390px] h-[700px] bg-white" />
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Phase 1: Action buttons (wiring to backend in later task) */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="default" size="sm" onClick={() => openReview('approve')}>
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openReview('flag')}>
                <Flag className="h-4 w-4 mr-1" /> Flag
              </Button>
              <Button variant="destructive" size="sm" onClick={() => openReview('reject')}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button variant="outline" size="sm" onClick={() => openReview('revision')}>
                <Undo2 className="h-4 w-4 mr-1" /> Request Revision
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {/* Review Dialog */}
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        action={pendingAction}
        articleTitle={current?.title ?? ''}
        contentQuality={contentQuality}
        setContentQuality={setContentQuality}
        grammarScore={grammarScore}
        setGrammarScore={setGrammarScore}
        readabilityScore={readabilityScore}
        setReadabilityScore={setReadabilityScore}
        seoScore={seoScore}
        setSeoScore={setSeoScore}
        brandVoiceScore={brandVoiceScore}
        setBrandVoiceScore={setBrandVoiceScore}
        culturalSensitivityScore={culturalSensitivityScore}
        setCulturalSensitivityScore={setCulturalSensitivityScore}
        factualAccuracyScore={factualAccuracyScore}
        setFactualAccuracyScore={setFactualAccuracyScore}
        imageQualityScore={imageQualityScore}
        setImageQualityScore={setImageQualityScore}
        derivedOverall={derivedOverall}
        notes={notes}
        setNotes={(v) => setNotes(v)}
        applyStatusChange={applyStatusChange}
        setApplyStatusChange={setApplyStatusChange}
        submitting={submitting}
        onSubmit={submitReview}
      />
    </Card>
  )
}

export default RandomReviewPanel

// Review Dialog
// Placed after default export intentionally; component is local to this file scope
function ReviewDialog({
  open,
  onOpenChange,
  action,
  articleTitle,
  contentQuality,
  setContentQuality,
  grammarScore,
  setGrammarScore,
  readabilityScore,
  setReadabilityScore,
  seoScore,
  setSeoScore,
  brandVoiceScore,
  setBrandVoiceScore,
  culturalSensitivityScore,
  setCulturalSensitivityScore,
  factualAccuracyScore,
  setFactualAccuracyScore,
  imageQualityScore,
  setImageQualityScore,
  derivedOverall,
  notes,
  setNotes,
  applyStatusChange,
  setApplyStatusChange,
  submitting,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  action: QCAction | null
  articleTitle: string
  contentQuality: number
  setContentQuality: (v: number) => void
  grammarScore: number
  setGrammarScore: (v: number) => void
  readabilityScore: number
  setReadabilityScore: (v: number) => void
  seoScore: number
  setSeoScore: (v: number) => void
  brandVoiceScore: number
  setBrandVoiceScore: (v: number) => void
  culturalSensitivityScore: number
  setCulturalSensitivityScore: (v: number) => void
  factualAccuracyScore: number
  setFactualAccuracyScore: (v: number) => void
  imageQualityScore: number
  setImageQualityScore: (v: number) => void
  derivedOverall: number
  notes: string
  setNotes: (v: string) => void
  applyStatusChange: boolean
  setApplyStatusChange: (v: boolean) => void
  submitting: boolean
  onSubmit: () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Article</DialogTitle>
          <DialogDescription>
            Action: <strong>{action ?? '—'}</strong> · {articleTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="contentQuality">Content</Label>
              <Input id="contentQuality" type="number" min={0} max={100} value={contentQuality} onChange={(e) => setContentQuality(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="grammarScore">Grammar</Label>
              <Input id="grammarScore" type="number" min={0} max={100} value={grammarScore} onChange={(e) => setGrammarScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="readabilityScore">Readability</Label>
              <Input id="readabilityScore" type="number" min={0} max={100} value={readabilityScore} onChange={(e) => setReadabilityScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="seoScore">SEO</Label>
              <Input id="seoScore" type="number" min={0} max={100} value={seoScore} onChange={(e) => setSeoScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="brandVoiceScore">Brand Voice</Label>
              <Input id="brandVoiceScore" type="number" min={0} max={100} value={brandVoiceScore} onChange={(e) => setBrandVoiceScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="culturalSensitivityScore">Cultural Sensitivity</Label>
              <Input id="culturalSensitivityScore" type="number" min={0} max={100} value={culturalSensitivityScore} onChange={(e) => setCulturalSensitivityScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="factualAccuracyScore">Factual Accuracy</Label>
              <Input id="factualAccuracyScore" type="number" min={0} max={100} value={factualAccuracyScore} onChange={(e) => setFactualAccuracyScore(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="imageQualityScore">Image Quality</Label>
              <Input id="imageQualityScore" type="number" min={0} max={100} value={imageQualityScore} onChange={(e) => setImageQualityScore(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Overall (weighted)</Label>
              <div className="text-2xl font-semibold">{derivedOverall}</div>
            </div>
            <div className="flex items-end gap-2">
              <input id="applyStatusChange" type="checkbox" className="h-4 w-4" checked={applyStatusChange} onChange={(e) => setApplyStatusChange(e.target.checked)} />
              <Label htmlFor="applyStatusChange">Apply status change based on action</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Key observations, issues, and guidance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
