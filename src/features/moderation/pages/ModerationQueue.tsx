/**
 * Moderation Queue Page
 * Phase 3.6.1: Review flagged content (admin/moderator only)
 */

import { useEffect, useState } from 'react'
import { FlaggingService, PendingFlag } from '../services/flagging.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flag,
  TrendingUp,
  MessageSquare,
  FileText,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

export function ModerationQueue() {
  const [flags, setFlags] = useState<PendingFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    loadFlags()
  }, [])

  const loadFlags = async () => {
    try {
      setLoading(true)
      const data = await FlaggingService.getPendingFlags(100)
      setFlags(data)
    } catch (error) {
      console.error('Error loading flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (flagId: string) => {
    try {
      setProcessingId(flagId)
      await FlaggingService.approveFlag(flagId, resolutionNotes[flagId] || undefined)

      // Remove from list
      setFlags(prev => prev.filter(f => f.flagId !== flagId))
      setResolutionNotes(prev => {
        const updated = { ...prev }
        delete updated[flagId]
        return updated
      })
    } catch (error) {
      console.error('Error approving flag:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (flagId: string) => {
    try {
      setProcessingId(flagId)
      await FlaggingService.rejectFlag(flagId, resolutionNotes[flagId] || undefined)

      // Remove from list
      setFlags(prev => prev.filter(f => f.flagId !== flagId))
      setResolutionNotes(prev => {
        const updated = { ...prev }
        delete updated[flagId]
        return updated
      })
    } catch (error) {
      console.error('Error rejecting flag:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getFlagTypeLabel = (flagType: string) => {
    return flagType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold flex items-center gap-2">
          <Flag className="h-8 w-8 text-ai-blue" />
          Moderation Queue
        </h1>
        <p className="text-gray-600">
          Review and moderate flagged content from the community
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Flags</p>
                <p className="text-3xl font-bold text-ai-blue">{flags.length}</p>
              </div>
              <Flag className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-red-600">
                  {flags.filter(f => f.severity === 'critical' || f.severity === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Articles</p>
                <p className="text-3xl font-bold">
                  {flags.filter(f => f.contentType === 'article').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="text-3xl font-bold">
                  {flags.filter(f => f.contentType === 'comment').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          Loading moderation queue...
        </div>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold">All Clear!</h3>
              <p className="text-gray-600">
                No pending flags. Great job keeping the community safe.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flags.map(flag => (
            <Card key={flag.flagId} className="border-l-4" style={{ borderLeftColor: getSeverityColor(flag.severity) }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`${getSeverityColor(flag.severity)} text-white`}>
                        {flag.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {getFlagTypeLabel(flag.flagType)}
                      </Badge>
                      {flag.contentType === 'article' ? (
                        <FileText className="h-4 w-4 text-gray-400" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500 capitalize">
                        {flag.contentType}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      <Link
                        to={flag.contentType === 'article'
                          ? `/news/${flag.contentId}`
                          : `/news?comment=${flag.contentId}`}
                        className="hover:text-ai-blue"
                      >
                        View {flag.contentType} →
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {flag.reporterCount > 1 && (
                        <span className="text-red-600 font-medium">
                          {flag.reporterCount} unique reporters •{' '}
                        </span>
                      )}
                      {flag.aiConfidence !== null && (
                        <span>
                          AI Confidence: {Math.round(flag.aiConfidence * 100)}% •{' '}
                        </span>
                      )}
                      {formatDistanceToNow(flag.createdAt, { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Resolution Notes */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Resolution Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add notes about your decision..."
                      value={resolutionNotes[flag.flagId] || ''}
                      onChange={e =>
                        setResolutionNotes(prev => ({
                          ...prev,
                          [flag.flagId]: e.target.value,
                        }))
                      }
                      rows={2}
                      disabled={processingId === flag.flagId}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(flag.flagId)}
                      disabled={processingId !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingId === flag.flagId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve Flag (Take Action)
                    </Button>
                    <Button
                      onClick={() => handleReject(flag.flagId)}
                      disabled={processingId !== null}
                      variant="outline"
                      className="flex-1"
                    >
                      {processingId === flag.flagId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject Flag (No Action)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
