/**
 * Comment Thread Component
 * Phase 3.2.1: Display nested comment with replies
 */

import { useState } from 'react'
import { Comment } from '../services/comments.service'
import { CommentEditor } from './CommentEditor'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreVertical,
  Flag,
  Trash2,
  Edit,
  User,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/shared/lib/supabase'
import { useEffect } from 'react'

interface CommentThreadProps {
  comment: Comment
  onVote: (commentId: string, vote: -1 | 1) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onFlag: (commentId: string) => Promise<void>
  onReply: (content: string, parentId?: string) => Promise<void>
  depth?: number
}

export function CommentThread({
  comment,
  onVote,
  onDelete,
  onFlag,
  onReply,
  depth = 0,
}: CommentThreadProps) {
  const [showReplyEditor, setShowReplyEditor] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    checkUser()
  }, [])

  const handleVote = async (vote: -1 | 1) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await onVote(comment.id, vote)
    } finally {
      setIsVoting(false)
    }
  }

  const handleReply = async (content: string) => {
    try {
      await onReply(content, comment.id)
      setShowReplyEditor(false)
    } catch (error) {
      console.error('Error replying:', error)
    }
  }

  const isOwnComment = currentUserId === comment.userId
  const canEdit = isOwnComment && !comment.editedAt
  const canReply = depth < 2 // Max 3 levels (0, 1, 2)

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author?.avatarUrl || ''} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-midnight-black">
                {comment.author?.displayName || 'Anonymous'}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
              {comment.editedAt && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500 text-xs italic">edited</span>
                </>
              )}
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnComment && canEdit && (
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwnComment && (
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
                {!isOwnComment && (
                  <DropdownMenuItem onClick={() => onFlag(comment.id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {/* Voting */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className={`h-8 px-2 ${
                  comment.userVote === 1
                    ? 'text-ai-blue hover:text-ai-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {comment.upvotes > 0 && comment.upvotes}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className={`h-8 px-2 ${
                  comment.userVote === -1
                    ? 'text-red-500 hover:text-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {comment.downvotes > 0 && comment.downvotes}
              </Button>
            </div>

            {/* Reply button */}
            {canReply && currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyEditor(!showReplyEditor)}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply editor */}
          {showReplyEditor && (
            <div className="mt-3">
              <CommentEditor
                onSubmit={handleReply}
                onCancel={() => setShowReplyEditor(false)}
                placeholder="Write a reply..."
                compact
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  onVote={onVote}
                  onDelete={onDelete}
                  onFlag={onFlag}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
