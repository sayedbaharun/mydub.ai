/**
 * Bookmarks Page
 * Display and manage user bookmarks
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { bookmarkService, Bookmark, BookmarkCollection } from '@/shared/services/bookmark.service'
import { BookmarkCard } from '../components/BookmarkCard'
import { CollectionsList } from '../components/CollectionsList'
import { CreateCollectionDialog } from '../components/CreateCollectionDialog'
import { NoDataEmptyState } from '@/shared/components/empty-states'
import { ContentCardSkeleton } from '@/shared/components/skeletons'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search, Plus, BookmarkX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export function BookmarksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateCollection, setShowCreateCollection] = useState(false)

  useEffect(() => {
    loadData()
  }, [user?.id, selectedCollection])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [bookmarksData, collectionsData] = await Promise.all([
        bookmarkService.getBookmarks(user?.id, selectedCollection || undefined),
        bookmarkService.getCollections(user?.id)
      ])
      setBookmarks(bookmarksData)
      setCollections(collectionsData)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBookmark = async (contentId: string) => {
    await bookmarkService.removeBookmark(contentId, user?.id)
    setBookmarks(prev => prev.filter(b => b.contentId !== contentId))
  }

  const handleCreateCollection = async (name: string, description?: string) => {
    await bookmarkService.createCollection(name, description, user?.id)
    await loadData()
    setShowCreateCollection(false)
  }

  // Filter bookmarks based on search
  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCollectionName = () => {
    if (!selectedCollection) return t('bookmarks.allBookmarks')
    const collection = collections.find(c => c.id === selectedCollection)
    return collection?.name || t('bookmarks.collection')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('bookmarks.title', 'My Bookmarks')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('bookmarks.subtitle', 'Save and organize your favorite content')}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Collections */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {t('bookmarks.collections', 'Collections')}
                  </h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateCollection(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <CollectionsList
                  collections={collections}
                  selectedCollection={selectedCollection}
                  onSelectCollection={setSelectedCollection}
                  bookmarkCounts={{}}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('bookmarks.searchPlaceholder', 'Search bookmarks...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Collection Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getCollectionName()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredBookmarks.length} {t('bookmarks.items', 'items')}
                </p>
              </div>

              {/* Bookmarks Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <ContentCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredBookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onRemove={handleRemoveBookmark}
                    />
                  ))}
                </div>
              ) : (
                <NoDataEmptyState
                  icon={BookmarkX}
                  title={searchQuery ? t('bookmarks.noSearchResults', 'No bookmarks found') : t('bookmarks.noBookmarks', 'No bookmarks yet')}
                  description={
                    searchQuery
                      ? t('bookmarks.tryDifferentSearch', 'Try a different search term')
                      : t('bookmarks.startBookmarking', 'Start bookmarking articles, places, and events to see them here')
                  }
                  action={
                    !searchQuery && {
                      label: t('bookmarks.browseContent', 'Browse Content'),
                      onClick: () => window.location.href = '/news'
                    }
                  }
                />
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Create Collection Dialog */}
      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
        onCreate={handleCreateCollection}
      />
    </div>
  )
}