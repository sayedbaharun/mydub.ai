/**
 * Bookmark Service
 * Manages bookmarks for both authenticated and anonymous users
 */

import { supabase } from '@/shared/lib/supabase'

export interface Bookmark {
  id: string
  userId?: string
  contentId: string
  contentType: 'article' | 'event' | 'place' | 'dining' | 'service'
  title: string
  description?: string
  imageUrl?: string
  url?: string
  collectionId?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface BookmarkCollection {
  id: string
  userId?: string
  name: string
  description?: string
  isDefault: boolean
  createdAt: string
}

const BOOKMARKS_KEY = 'mydub_bookmarks'
const COLLECTIONS_KEY = 'mydub_bookmark_collections'
const DEVICE_ID_KEY = 'mydub_device_id'

class BookmarkService {
  /**
   * Get or create a unique device ID for anonymous users
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    return deviceId
  }

  /**
   * Get all bookmarks for the current user
   */
  async getBookmarks(userId?: string, collectionId?: string): Promise<Bookmark[]> {
    try {
      if (userId) {
        // Authenticated user - get from database
        let query = supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (collectionId) {
          query = query.eq('collection_id', collectionId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching bookmarks:', error)
          return this.getLocalBookmarks(collectionId)
        }

        return data.map(this.mapDatabaseBookmark)
      } else {
        // Anonymous user - get from local storage
        return this.getLocalBookmarks(collectionId)
      }
    } catch (error) {
      console.error('Error getting bookmarks:', error)
      return this.getLocalBookmarks(collectionId)
    }
  }

  /**
   * Get bookmarks from local storage
   */
  private getLocalBookmarks(collectionId?: string): Bookmark[] {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY)
      if (!stored) return []

      const bookmarks: Bookmark[] = JSON.parse(stored)
      
      if (collectionId) {
        return bookmarks.filter(b => b.collectionId === collectionId)
      }
      
      return bookmarks
    } catch {
      return []
    }
  }

  /**
   * Check if content is bookmarked
   */
  async isBookmarked(contentId: string, userId?: string): Promise<boolean> {
    const bookmarks = await this.getBookmarks(userId)
    return bookmarks.some(b => b.contentId === contentId)
  }

  /**
   * Add a bookmark
   */
  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>, userId?: string): Promise<Bookmark> {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: new Date().toISOString()
    }

    try {
      if (userId) {
        // Save to database for authenticated users
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            content_id: bookmark.contentId,
            content_type: bookmark.contentType,
            title: bookmark.title,
            description: bookmark.description,
            image_url: bookmark.imageUrl,
            url: bookmark.url,
            collection_id: bookmark.collectionId,
            metadata: bookmark.metadata
          })
          .select()
          .single()

        if (error) {
          console.error('Error saving bookmark to database:', error)
          // Fallback to local storage
          this.saveLocalBookmark(newBookmark)
        } else {
          return this.mapDatabaseBookmark(data)
        }
      } else {
        // Save to local storage for anonymous users
        this.saveLocalBookmark(newBookmark)
      }

      return newBookmark
    } catch (error) {
      console.error('Error adding bookmark:', error)
      this.saveLocalBookmark(newBookmark)
      return newBookmark
    }
  }

  /**
   * Remove a bookmark
   */
  async removeBookmark(contentId: string, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Remove from database
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId)

        if (error) {
          console.error('Error removing bookmark from database:', error)
          // Fallback to local storage
          this.removeLocalBookmark(contentId)
        }
      } else {
        // Remove from local storage
        this.removeLocalBookmark(contentId)
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
      this.removeLocalBookmark(contentId)
    }
  }

  /**
   * Toggle bookmark status
   */
  async toggleBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>, userId?: string): Promise<boolean> {
    const isCurrentlyBookmarked = await this.isBookmarked(bookmark.contentId, userId)
    
    if (isCurrentlyBookmarked) {
      await this.removeBookmark(bookmark.contentId, userId)
      return false
    } else {
      await this.addBookmark(bookmark, userId)
      return true
    }
  }

  /**
   * Save bookmark to local storage
   */
  private saveLocalBookmark(bookmark: Bookmark): void {
    const bookmarks = this.getLocalBookmarks()
    bookmarks.unshift(bookmark)
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
  }

  /**
   * Remove bookmark from local storage
   */
  private removeLocalBookmark(contentId: string): void {
    const bookmarks = this.getLocalBookmarks()
    const filtered = bookmarks.filter(b => b.contentId !== contentId)
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered))
  }

  /**
   * Get bookmark collections
   */
  async getCollections(userId?: string): Promise<BookmarkCollection[]> {
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('bookmark_collections')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching collections:', error)
          return this.getLocalCollections()
        }

        return data.map(this.mapDatabaseCollection)
      } else {
        return this.getLocalCollections()
      }
    } catch (error) {
      console.error('Error getting collections:', error)
      return this.getLocalCollections()
    }
  }

  /**
   * Get collections from local storage
   */
  private getLocalCollections(): BookmarkCollection[] {
    try {
      const stored = localStorage.getItem(COLLECTIONS_KEY)
      if (!stored) {
        // Create default collection if none exists
        const defaultCollection: BookmarkCollection = {
          id: 'default',
          name: 'My Bookmarks',
          isDefault: true,
          createdAt: new Date().toISOString()
        }
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify([defaultCollection]))
        return [defaultCollection]
      }
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string, description?: string, userId?: string): Promise<BookmarkCollection> {
    const newCollection: BookmarkCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description,
      isDefault: false,
      createdAt: new Date().toISOString()
    }

    try {
      if (userId) {
        const { data, error } = await supabase
          .from('bookmark_collections')
          .insert({
            user_id: userId,
            name,
            description,
            is_default: false
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating collection:', error)
          this.saveLocalCollection(newCollection)
        } else {
          return this.mapDatabaseCollection(data)
        }
      } else {
        this.saveLocalCollection(newCollection)
      }

      return newCollection
    } catch (error) {
      console.error('Error creating collection:', error)
      this.saveLocalCollection(newCollection)
      return newCollection
    }
  }

  /**
   * Save collection to local storage
   */
  private saveLocalCollection(collection: BookmarkCollection): void {
    const collections = this.getLocalCollections()
    collections.push(collection)
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
  }

  /**
   * Merge local bookmarks with cloud bookmarks on login
   */
  async mergeBookmarks(userId: string): Promise<void> {
    try {
      const localBookmarks = this.getLocalBookmarks()
      const localCollections = this.getLocalCollections()

      if (localBookmarks.length === 0 && localCollections.length <= 1) return

      // Create collections first
      for (const collection of localCollections) {
        if (!collection.isDefault) {
          await this.createCollection(collection.name, collection.description, userId)
        }
      }

      // Then create bookmarks
      for (const bookmark of localBookmarks) {
        // Check if bookmark already exists
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('content_id', bookmark.contentId)
          .single()

        if (!existing) {
          await this.addBookmark({
            contentId: bookmark.contentId,
            contentType: bookmark.contentType,
            title: bookmark.title,
            description: bookmark.description,
            imageUrl: bookmark.imageUrl,
            url: bookmark.url,
            collectionId: bookmark.collectionId,
            metadata: bookmark.metadata
          }, userId)
        }
      }

      // Clear local storage after successful merge
      localStorage.removeItem(BOOKMARKS_KEY)
      localStorage.removeItem(COLLECTIONS_KEY)
    } catch (error) {
      console.error('Error merging bookmarks:', error)
    }
  }

  /**
   * Map database bookmark to local format
   */
  private mapDatabaseBookmark(data: any): Bookmark {
    return {
      id: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      contentType: data.content_type,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      url: data.url,
      collectionId: data.collection_id,
      metadata: data.metadata,
      createdAt: data.created_at
    }
  }

  /**
   * Map database collection to local format
   */
  private mapDatabaseCollection(data: any): BookmarkCollection {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      isDefault: data.is_default,
      createdAt: data.created_at
    }
  }
}

export const bookmarkService = new BookmarkService()