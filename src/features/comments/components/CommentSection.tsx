/**
 * Comment Section Component
 * Phase 3.2.1: Main container for article comments
 */

import { useState } from 'react'
import { useComments } from '../hooks/useComments'
import { CommentThread } from './CommentThread'
import { CommentEditor } from './CommentEditor'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { MessageSquare, Loader2 } from 'lucide-react'
import { SortOption } from '../services/comments.service'
import { supabase } from '@/shared/lib/supabase'
import { useEffect } from 'react'

interface CommentSectionProps {
  articleId: string
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const {
    comments,
    loading,
    sortBy,
    setSortBy,
    createComment,
    voteComment,
    deleteComment,
    flagComment,
  } = useComments(articleId)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  const handleSubmit = async (content: string) => {
    try {
      await createComment(content)
      setShowEditor(false)
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>
              Comments ({comments.length})
            </CardTitle>
          </div>

          {/* Sort dropdown */}
          {comments.length > 0 && (
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="controversial">Controversial</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comment editor */}
        {isAuthenticated ? (
          showEditor ? (
            <CommentEditor
              onSubmit={handleSubmit}
              onCancel={() => setShowEditor(false)}
              placeholder="Share your thoughts..."
            />
          ) : (
            <Button
              onClick={() => setShowEditor(true)}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Add a comment
            </Button>
          )
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="mb-3 text-sm text-gray-600">
              Sign in to join the conversation
            </p>
            <Button
              onClick={() => window.location.href = '/login'}
              size="sm"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          /* Comment threads */
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onVote={voteComment}
                onDelete={deleteComment}
                onFlag={flagComment}
                onReply={createComment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
