/**
 * useProfile Hook
 * React hook for managing user profile state
 */

import { useEffect, useState } from 'react'
import { ProfileService, UserProfile } from '../services/profile.service'
import { supabase } from '@/shared/lib/supabase'

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const profileData = userId
        ? await ProfileService.getProfile(userId)
        : await ProfileService.getCurrentUserProfile()

      setProfile(profileData)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return

    try {
      const updated = await ProfileService.updateProfile(profile.userId, updates)
      setProfile(updated)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!profile) return

    try {
      const avatarUrl = await ProfileService.uploadAvatar(profile.userId, file)
      setProfile({ ...profile, avatarUrl })
      return avatarUrl
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile: loadProfile,
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadBookmarks = async (collection?: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const data = await ProfileService.getBookmarks(user.id, collection)
      setBookmarks(data)
    } finally {
      setLoading(false)
    }
  }

  const addBookmark = async (articleId: string, collection?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await ProfileService.addBookmark(user.id, articleId, collection)
    await loadBookmarks(collection)
  }

  const removeBookmark = async (articleId: string, collection?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await ProfileService.removeBookmark(user.id, articleId)
    await loadBookmarks(collection)
  }

  return {
    bookmarks,
    loading,
    loadBookmarks,
    addBookmark,
    removeBookmark,
  }
}
