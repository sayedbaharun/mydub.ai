/**
 * Comment Editor Component
 * Phase 3.2.1: Create/edit comments with markdown support
 */

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Send, X } from 'lucide-react'
import { toast } from '@/shared/services/toast.service'

interface CommentEditorProps {
  onSubmit: (content: string) => Promise<void>
  onCancel: () => void
  placeholder?: string
  initialContent?: string
  compact?: boolean
}

export function CommentEditor({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  initialContent = '',
  compact = false,
}: CommentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    if (content.length > 10000) {
      toast.error('Comment is too long (max 10,000 characters)')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(content)
      setContent('')
      toast.success('Comment posted successfully')
    } catch (error) {
      toast.error('Failed to post comment')
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 3 : 4}
        className="resize-none"
        disabled={submitting}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {content.length} / 10,000 characters
          <span className="ml-3 text-gray-400">Tip: Ctrl+Enter to submit</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="bg-ai-blue hover:bg-ai-blue/90"
          >
            <Send className="mr-1 h-4 w-4" />
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      {/* Markdown hints */}
      {!compact && (
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <p className="mb-1 font-medium">Formatting tips:</p>
          <ul className="space-y-0.5 ml-4">
            <li>**bold** for <strong>bold text</strong></li>
            <li>*italic* for <em>italic text</em></li>
            <li>@username to mention someone</li>
          </ul>
        </div>
      )}
    </div>
  )
}
