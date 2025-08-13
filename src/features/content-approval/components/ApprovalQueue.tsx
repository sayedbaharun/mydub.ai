import { useState } from 'react'
import { useApprovalQueue, useApprovalStats, useBulkApproval } from '../hooks/useApprovalQueue'
import { ApprovalFilter, ApprovalItem } from '../types'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ArticlePreview } from './ArticlePreview'
import { ApprovalActions } from './ApprovalActions'
import { useAuth } from '@/features/auth/context/AuthContext'

export function ApprovalQueue() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [previewItem, setPreviewItem] = useState<ApprovalItem | null>(null)
  const [filters, setFilters] = useState<ApprovalFilter>({})
  const [searchTerm, setSearchTerm] = useState('')

  const { data: queue, isLoading, refetch } = useApprovalQueue(page, 20, filters)
  const { data: stats } = useApprovalStats()
  const bulkApproval = useBulkApproval()

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm })
    setPage(1)
  }

  const handleFilterChange = (key: keyof ApprovalFilter, value: any) => {
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  const handleSelectAll = () => {
    if (selectedItems.length === queue?.items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(queue?.items.map(item => item.id) || [])
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedItems.length === 0 || !user) return

    await bulkApproval.mutateAsync({
      itemIds: selectedItems,
      action,
      userId: user.id,
      comments: `Bulk ${action} by ${user.email}`
    })

    setSelectedItems([])
  }

  const totalPages = Math.ceil((queue?.total || 0) / 20)

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-light text-gray-900 mt-1">{stats?.pending || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-3xl font-light text-gray-900 mt-1">{stats?.approved_today || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected Today</p>
              <p className="text-3xl font-light text-gray-900 mt-1">{stats?.rejected_today || 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-3xl font-light text-gray-900 mt-1">{stats?.scheduled || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
              <p className="text-3xl font-light text-gray-900 mt-1">
                {stats?.average_processing_time || 0}m
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.content_type}
              onValueChange={(value) => handleFilterChange('content_type', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="tourism">Tourism</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({})
                setSearchTerm('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedItems.length} items selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve')}
                className="bg-white"
              >
                Bulk Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('reject')}
                className="bg-white"
              >
                Bulk Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Queue */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))
        ) : queue?.items.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No content pending approval</p>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={selectedItems.length === queue?.items.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>

            {queue?.items.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleSelectItem(item.id)}
                  />
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.title}
                        </h3>
                        {item.title_ar && (
                          <p className="text-sm text-gray-600 mt-1" dir="rtl">
                            {item.title_ar}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          item.priority === 'high' ? 'destructive' :
                          item.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline">
                          {item.content_type}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 line-clamp-2">{item.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          By {item.ai_agent?.name || item.author.name}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        {item.source && (
                          <>
                            <span>•</span>
                            <span>Source: {item.source.name}</span>
                          </>
                        )}
                        {item.metadata?.quality_score && (
                          <>
                            <span>•</span>
                            <span>Quality: {item.metadata.quality_score}%</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewItem(item)}
                        >
                          Preview
                        </Button>
                        <ApprovalActions
                          item={item}
                          onAction={() => {
                            setSelectedItems(prev => prev.filter(id => id !== item.id))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Article Preview Modal */}
      {previewItem && (
        <ArticlePreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onAction={() => {
            setPreviewItem(null)
            setSelectedItems(prev => prev.filter(id => id !== previewItem.id))
          }}
        />
      )}
    </div>
  )
}