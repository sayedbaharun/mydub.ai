/**
 * Collections List Component
 * Display and manage bookmark collections
 */

import { BookmarkCollection } from '@/shared/services/bookmark.service'
import { Button } from '@/shared/components/ui/button'
import { Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface CollectionsListProps {
  collections: BookmarkCollection[]
  selectedCollection: string | null
  onSelectCollection: (collectionId: string | null) => void
  bookmarkCounts: Record<string, number>
}

export function CollectionsList({
  collections,
  selectedCollection,
  onSelectCollection,
  bookmarkCounts
}: CollectionsListProps) {
  const allBookmarksCount = Object.values(bookmarkCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-1">
      {/* All Bookmarks */}
      <Button
        variant={selectedCollection === null ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start gap-2',
          selectedCollection === null && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        )}
        onClick={() => onSelectCollection(null)}
      >
        <FolderOpen className="h-4 w-4" />
        <span className="flex-1 text-left">All Bookmarks</span>
        <span className="text-xs text-gray-500">{allBookmarksCount || 0}</span>
      </Button>

      {/* Collections */}
      {collections.map((collection) => {
        const isSelected = selectedCollection === collection.id
        const Icon = isSelected ? FolderOpen : Folder
        const count = bookmarkCounts[collection.id] || 0

        return (
          <Button
            key={collection.id}
            variant={isSelected ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2',
              isSelected && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            )}
            onClick={() => onSelectCollection(collection.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left truncate">{collection.name}</span>
            <span className="text-xs text-gray-500">{count}</span>
          </Button>
        )
      })}
    </div>
  )
}