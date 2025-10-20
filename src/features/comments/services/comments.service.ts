/**
 * Comments Service
 * Phase 3.2.1: Threaded comments with voting and reactions
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface Comment {
  id: string
  articleId: string
  userId: string
  parentId: string | null
  content: string
  upvotes: number
  downvotes: number
  isDeleted: boolean
  isFlagged: boolean
  isApproved: boolean
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Extended data
  author?: {
    displayName: string
    avatarUrl: string | null
  }
  userVote?: number // -1, 0, or 1
  reactions?: CommentReaction[]
  replies?: Comment[]
}

export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
  createdAt: Date
}

export type SortOption = 'best' | 'newest' | 'oldest' | 'controversial'

// =============================================================================
// Comments Service
// =============================================================================

export class CommentsService {
  /**
   * Get comments for an article (with threading)
   */
  static async getComments(
    articleId: string,
    sortBy: SortOption = 'best'
  ): Promise<Comment[]> {
    try {
      // Get all comments for the article
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles!inner(display_name, avatar_url)
        `)
        .eq('article_id', articleId)
        .eq('is_approved', true)
        .eq('is_deleted', false)

      if (error) throw error
      if (!data) return []

      // Get current user's votes
      const { data: { user } } = await supabase.auth.getUser()
      let userVotes: Record<string, number> = {}

      if (user) {
        const { data: votes } = await supabase
          .from('comment_votes')
          .select('comment_id, vote')
          .eq('user_id', user.id)
          .in('comment_id', data.map(c => c.id))

        if (votes) {
          userVotes = votes.reduce((acc, v) => {
            acc[v.comment_id] = v.vote
            return acc
          }, {} as Record<string, number>)
        }
      }

      // Convert to Comment objects
      const comments: Comment[] = data.map(c => ({
        id: c.id,
        articleId: c.article_id,
        userId: c.user_id,
        parentId: c.parent_id,
        content: c.content,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        isDeleted: c.is_deleted,
        isFlagged: c.is_flagged,
        isApproved: c.is_approved,
        editedAt: c.edited_at ? new Date(c.edited_at) : null,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        author: {
          displayName: c.user_profiles?.display_name || 'Anonymous',
          avatarUrl: c.user_profiles?.avatar_url || null,
        },
        userVote: userVotes[c.id] || 0,
      }))

      // Sort comments
      const sortedComments = this.sortComments(comments, sortBy)

      // Build threaded structure
      return this.buildCommentTree(sortedComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }

  /**
   * Sort comments by specified criteria
   */
  private static sortComments(comments: Comment[], sortBy: SortOption): Comment[] {
    switch (sortBy) {
      case 'best':
        // Best = highest score (upvotes - downvotes)
        return comments.sort((a, b) => {
          const scoreA = a.upvotes - a.downvotes
          const scoreB = b.upvotes - b.downvotes
          return scoreB - scoreA
        })

      case 'newest':
        return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      case 'oldest':
        return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      case 'controversial':
        // Controversial = high engagement but close to 50/50 votes
        return comments.sort((a, b) => {
          const totalA = a.upvotes + a.downvotes
          const totalB = b.upvotes + b.downvotes
          const ratioA = totalA > 0 ? Math.abs(0.5 - a.upvotes / totalA) : 1
          const ratioB = totalB > 0 ? Math.abs(0.5 - b.upvotes / totalB) : 1
          return ratioA - ratioB // Lower ratio = more controversial
        })

      default:
        return comments
    }
  }

  /**
   * Build threaded comment tree
   */
  private static buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: build tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  /**
   * Create a new comment
   */
  static async createComment(
    articleId: string,
    content: string,
    parentId?: string
  ): Promise<Comment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          parent_id: parentId || null,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        articleId: data.article_id,
        userId: data.user_id,
        parentId: data.parent_id,
        content: data.content,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        isDeleted: data.is_deleted,
        isFlagged: data.is_flagged,
        isApproved: data.is_approved,
        editedAt: null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  }

  /**
   * Update comment (within 15 minutes)
   */
  static async updateComment(
    commentId: string,
    newContent: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if comment exists and is editable
      const { data: comment } = await supabase
        .from('comments')
        .select('created_at, user_id')
        .eq('id', commentId)
        .single()

      if (!comment) throw new Error('Comment not found')
      if (comment.user_id !== user.id) throw new Error('Not authorized')

      // Check 15-minute edit window
      const createdAt = new Date(comment.created_at)
      const now = new Date()
      const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      if (minutesSinceCreated > 15) {
        throw new Error('Edit window expired (15 minutes)')
      }

      // Update comment
      const { error } = await supabase
        .from('comments')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  }

  /**
   * Delete comment (soft delete)
   */
  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          content: '[deleted]',
        })
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }

  /**
   * Vote on a comment
   */
  static async voteComment(
    commentId: string,
    vote: -1 | 1
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('id, vote')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        if (existingVote.vote === vote) {
          // Remove vote if clicking same vote again
          await supabase
            .from('comment_votes')
            .delete()
            .eq('id', existingVote.id)
        } else {
          // Update vote if different
          await supabase
            .from('comment_votes')
            .update({ vote })
            .eq('id', existingVote.id)
        }
      } else {
        // Create new vote
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            vote,
          })
      }
    } catch (error) {
      console.error('Error voting comment:', error)
      throw error
    }
  }

  /**
   * Add reaction to comment
   */
  static async addReaction(
    commentId: string,
    reactionType: CommentReaction['reactionType']
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        })
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }

  /**
   * Remove reaction from comment
   */
  static async removeReaction(
    commentId: string,
    reactionType: CommentReaction['reactionType']
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
    } catch (error) {
      console.error('Error removing reaction:', error)
      throw error
    }
  }

  /**
   * Get comment reactions
   */
  static async getReactions(commentId: string): Promise<CommentReaction[]> {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)

      if (error) throw error
      if (!data) return []

      return data.map(r => ({
        id: r.id,
        commentId: r.comment_id,
        userId: r.user_id,
        reactionType: r.reaction_type as CommentReaction['reactionType'],
        createdAt: new Date(r.created_at),
      }))
    } catch (error) {
      console.error('Error fetching reactions:', error)
      return []
    }
  }

  /**
   * Flag comment for moderation
   */
  static async flagComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('comments')
        .update({ is_flagged: true })
        .eq('id', commentId)
    } catch (error) {
      console.error('Error flagging comment:', error)
      throw error
    }
  }
}
