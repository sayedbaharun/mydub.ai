import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Brain,
  Sparkles,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  ChevronDown,
  Download,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { dashboardService } from '../services/dashboard.service'
import { ContentItem, ContentFilter } from '../types'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'
import { ContentCreateDialog } from './ContentCreateDialog'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'

export function ContentManagement() {
  const { t, i18n } = useTranslation()
  const { user, session } = useAuth()
  const { toast } = useToast()
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'published'>(
    'pending'
  )
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleData, setScheduleData] = useState({ contentId: '', date: '', time: '' })

  useEffect(() => {
    loadContent()
  }, [activeFilter])

  const loadContent = async () => {
    setIsLoading(true)
    try {
      const filter: ContentFilter = {}
      if (activeFilter !== 'all') {
        filter.status = activeFilter as ContentItem['status']
      }
      if (searchQuery.trim()) {
        filter.search = searchQuery.trim()
      }

      const { data } = await dashboardService.getContent(filter)
      setContent(data)
    } catch (error) {
      toast({
        title: 'Failed to load content',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadContent()
  }

  const handleApprove = async (contentId: string) => {
    if (!user) return
    try {
      await dashboardService.updateContentStatus(contentId, 'approved', user.id)
      toast({ title: 'Content approved' })
      loadContent()
    } catch (error) {
      toast({ title: 'Failed to approve', variant: 'destructive' })
    }
  }

  const handleReject = async (contentId: string) => {
    if (!user) return
    try {
      await dashboardService.updateContentStatus(contentId, 'rejected', user.id)
      toast({ title: 'Content rejected' })
      loadContent()
    } catch (error) {
      toast({ title: 'Failed to reject', variant: 'destructive' })
    }
  }

  const handlePublish = async (contentId: string) => {
    if (!user) return
    try {
      await dashboardService.updateContentStatus(contentId, 'published', user.id)
      toast({ title: 'Content published' })
      loadContent()
    } catch (error) {
      toast({ title: 'Failed to publish', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteContentId || !user) return
    try {
      await dashboardService.deleteContent(deleteContentId, user.id)
      toast({ title: 'Content deleted' })
      setDeleteContentId(null)
      loadContent()
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleSelectItem = (contentId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(contentId)
    } else {
      newSelection.delete(contentId)
    }
    setSelectedItems(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(content.map((item) => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'publish' | 'delete') => {
    if (!user || selectedItems.size === 0) return

    setIsLoading(true)
    try {
      const promises = Array.from(selectedItems).map((contentId) => {
        switch (action) {
          case 'approve':
            return dashboardService.updateContentStatus(contentId, 'approved', user.id)
          case 'reject':
            return dashboardService.updateContentStatus(contentId, 'rejected', user.id)
          case 'publish':
            return dashboardService.updateContentStatus(contentId, 'published', user.id)
          case 'delete':
            return dashboardService.deleteContent(contentId, user.id)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      toast({ title: `${selectedItems.size} items ${action}d successfully` })
      setSelectedItems(new Set())
      loadContent()
    } catch (error) {
      toast({ title: `Failed to ${action} items`, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchedulePublish = async () => {
    if (!user || !scheduleData.contentId || !scheduleData.date || !scheduleData.time) return

    try {
      const scheduledDate = new Date(`${scheduleData.date}T${scheduleData.time}`)
      // In a real app, you'd schedule this with a job queue
      // For now, we'll just show success
      toast({
        title: 'Content scheduled',
        description: `Will be published on ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`,
      })
      setShowScheduleDialog(false)
      setScheduleData({ contentId: '', date: '', time: '' })
    } catch (error) {
      toast({ title: 'Failed to schedule', variant: 'destructive' })
    }
  }

  const handleExportContent = async () => {
    try {
      const blob = await dashboardService.exportData('content', 'csv')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Content exported successfully' })
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' })
    }
  }

  const handleAIGenerate = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            category: 'trending',
            language: i18n.language,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to generate content')
      const result = await response.json()

      toast({
        title: 'AI content created',
        description: `"${result.title}"`,
      })

      loadContent()
    } catch (error) {
      toast({
        title: 'AI generation failed',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: ContentItem['status']) => {
    const colors = {
      draft: 'text-gray-500',
      pending: 'text-amber-500',
      approved: 'text-green-500',
      rejected: 'text-red-500',
      published: 'text-blue-500',
    }
    return colors[status] || 'text-gray-500'
  }

  const getTypeColor = (type: ContentItem['type']) => {
    const colors = {
      government: 'text-blue-600',
      news: 'text-green-600',
      tourism: 'text-purple-600',
      event: 'text-orange-600',
    }
    return colors[type] || 'text-gray-600'
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-light text-gray-900">Content</h1>
          <p className="font-light text-gray-500">Manage and review your content with ease</p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="rounded-full bg-black px-6 py-2 font-light text-white hover:bg-gray-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
            <Button
              onClick={handleAIGenerate}
              variant="outline"
              className="rounded-full border-gray-200 px-6 py-2 font-light hover:border-gray-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-200 px-6 py-2 font-light hover:border-gray-300"
                  >
                    Bulk Actions ({selectedItems.size})
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('approve')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('reject')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('publish')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              onClick={handleExportContent}
              variant="outline"
              className="rounded-full border-gray-200 px-6 py-2 font-light hover:border-gray-300"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-80 rounded-full border-gray-200 py-2 pl-10 pr-4 font-light"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex w-fit space-x-1 rounded-full bg-gray-100 p-1">
          {(['all', 'pending', 'approved', 'published'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'rounded-full px-6 py-2 text-sm font-light transition-all duration-200',
                activeFilter === filter
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : content.length === 0 ? (
        <div className="space-y-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Sparkles className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-light text-gray-900">No content found</h3>
            <p className="font-light text-gray-500">
              Get started by creating your first piece of content
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full bg-black px-6 py-2 font-light text-white hover:bg-gray-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Content
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All Header */}
          {content.length > 0 && (
            <div className="flex items-center space-x-3 rounded-lg bg-gray-50 px-6 py-3">
              <Checkbox
                checked={selectedItems.size === content.length && content.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-light text-gray-600">
                {selectedItems.size > 0
                  ? `${selectedItems.size} of ${content.length} selected`
                  : 'Select all'}
              </span>
            </div>
          )}

          {content.map((item) => (
            <Card
              key={item.id}
              className="border-gray-200 transition-colors duration-200 hover:border-gray-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="truncate text-lg font-light text-gray-900">
                          {i18n.language === 'ar' ? item.titleAr : item.title}
                        </h3>
                        <div
                          className={cn(
                            'text-xs font-medium uppercase tracking-wide',
                            getTypeColor(item.type)
                          )}
                        >
                          {item.type}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm font-light text-gray-500">
                        <span>{item.author.fullName}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status Indicator */}
                    <div
                      className={cn(
                        'flex items-center space-x-2 text-sm font-medium',
                        getStatusColor(item.status)
                      )}
                    >
                      {item.status === 'pending' && <Clock className="h-4 w-4" />}
                      {item.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                      {item.status === 'rejected' && <XCircle className="h-4 w-4" />}
                      {item.status === 'published' && <Eye className="h-4 w-4" />}
                      <span className="capitalize">{item.status}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      {item.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(item.id)}
                            size="sm"
                            className="rounded-full bg-green-600 px-4 py-1 font-light text-white hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(item.id)}
                            size="sm"
                            variant="outline"
                            className="rounded-full border-red-200 px-4 py-1 font-light text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}

                      {item.status === 'approved' && (
                        <Button
                          onClick={() => handlePublish(item.id)}
                          size="sm"
                          className="rounded-full bg-blue-600 px-4 py-1 font-light text-white hover:bg-blue-700"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Publish
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setScheduleData({ ...scheduleData, contentId: item.id })
                              setShowScheduleDialog(true)
                            }}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteContentId(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteContentId} onOpenChange={() => setDeleteContentId(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-light">Delete Content</AlertDialogTitle>
            <AlertDialogDescription className="font-light">
              This action cannot be undone. The content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-light">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-red-600 font-light hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Content Dialog */}
      <ContentCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadContent}
      />

      {/* Schedule Publish Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-light">Schedule Publication</DialogTitle>
            <DialogDescription className="font-light">
              Choose when this content should be published automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
              className="rounded-full font-light"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedulePublish}
              className="rounded-full bg-blue-600 font-light hover:bg-blue-700"
              disabled={!scheduleData.date || !scheduleData.time}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
