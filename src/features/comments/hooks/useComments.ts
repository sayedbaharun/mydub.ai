/**
 * useComments Hook
 * React hook for managing comments state
 */

import { useState, useEffect } from 'react'
import { CommentsService, Comment, SortOption } from '../services/comments.service'

export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('best')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadComments()
  }, [articleId, sortBy])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await CommentsService.getComments(articleId, sortBy)
      setComments(data)
    } catch (err) {
      setError(err as Error)
      console.error('Error loading comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const createComment = async (content: string, parentId?: string) => {
    try {
      await CommentsService.createComment(articleId, content, parentId)
      await loadComments() // Reload to show new comment
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const updateComment = async (commentId: string, newContent: string) => {
    try {
      await CommentsService.updateComment(commentId, newContent)
      await loadComments()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await CommentsService.deleteComment(commentId)
      await loadComments()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const voteComment = async (commentId: string, vote: -1 | 1) => {
    try {
      await CommentsService.voteComment(commentId, vote)
      await loadComments()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const flagComment = async (commentId: string) => {
    try {
      await CommentsService.flagComment(commentId)
      await loadComments()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    comments,
    loading,
    error,
    sortBy,
    setSortBy,
    createComment,
    updateComment,
    deleteComment,
    voteComment,
    flagComment,
    refresh: loadComments,
  }
}
