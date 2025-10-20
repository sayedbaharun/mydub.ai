/**
 * Flag Button Component
 * Phase 3.6.1: Report content for moderation
 */

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Flag, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { FlaggingService, FlagType } from '../services/flagging.service'

interface FlagButtonProps {
  contentType: 'article' | 'comment'
  contentId: string
  variant?: 'ghost' | 'outline'
  size?: 'sm' | 'default'
}

const FLAG_TYPES: { value: FlagType; label: string; description: string }[] = [
  {
    value: 'misinformation',
    label: 'Misinformation',
    description: 'False or misleading information',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unwanted commercial content or repetitive posts',
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Content promoting hatred or discrimination',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or personal attacks',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate',
    description: 'Explicit, graphic, or NSFW content',
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
    description: 'Already posted content',
  },
  {
    value: 'off_topic',
    label: 'Off Topic',
    description: 'Unrelated to Dubai or the discussion',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other policy violations',
  },
]

export function FlagButton({ contentType, contentId, variant = 'ghost', size = 'sm' }: FlagButtonProps) {
  const [open, setOpen] = useState(false)
  const [flagType, setFlagType] = useState<FlagType | ''>('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flagType || !reason.trim()) {
      setError('Please select a flag type and provide a reason')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (contentType === 'article') {
        await FlaggingService.flagArticle(contentId, flagType, reason)
      } else {
        await FlaggingService.flagComment(contentId, flagType, reason)
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setFlagType('')
        setReason('')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit flag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community by reporting content that violates our
            guidelines.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for your report. Our moderation team will review it shortly.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="flagType">What's the issue?</Label>
              <Select value={flagType} onValueChange={(value) => setFlagType(value as FlagType)}>
                <SelectTrigger id="flagType">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {FLAG_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Additional details</Label>
              <Textarea
                id="reason"
                placeholder="Please provide specific details about why you're reporting this content..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                {reason.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !flagType || !reason.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              False reports may affect your account standing. Please only report genuine policy
              violations.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
