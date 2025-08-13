import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Plus,
  Globe,
  Rss,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit,
  RefreshCw,
  ExternalLink,
  Loader2,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import { contentManagementService, type AgentSource } from '../services/content-management.service'
import { useToast } from '@/shared/hooks/use-toast'

type CategoryType = 'dining' | 'experiences' | 'nightlife' | 'luxury' | 'practical'

interface SourceManagerProps {
  category: CategoryType
}

// Category to agent type mapping
const CATEGORY_AGENT_MAP: Record<CategoryType, string> = {
  dining: 'lifestyle',
  experiences: 'tourism',
  nightlife: 'lifestyle',
  luxury: 'lifestyle',
  practical: 'news',
}

// Source Card Component
function SourceCard({
  source,
  onEdit,
  onToggle,
  onDelete,
  onScan,
  isScanning,
}: {
  source: AgentSource
  onEdit: (source: AgentSource) => void
  onToggle: (sourceId: string, isActive: boolean) => void
  onDelete: (sourceId: string) => void
  onScan: (sourceId: string) => void
  isScanning: boolean
}) {
  const getStatusColor = (isActive: boolean, lastFetched?: string) => {
    if (!isActive) return 'text-gray-600 bg-gray-50'

    if (!lastFetched) return 'text-yellow-600 bg-yellow-50'

    const timeSince = Date.now() - new Date(lastFetched).getTime()
    const hoursAgo = timeSince / (1000 * 60 * 60)

    if (hoursAgo < 2) return 'text-green-600 bg-green-50'
    if (hoursAgo < 24) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusText = (isActive: boolean, lastFetched?: string) => {
    if (!isActive) return 'Inactive'
    if (!lastFetched) return 'Never scanned'

    const timeSince = Date.now() - new Date(lastFetched).getTime()
    const hoursAgo = timeSince / (1000 * 60 * 60)

    if (hoursAgo < 2) return 'Healthy'
    if (hoursAgo < 24) return 'Stale'
    return 'Error'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="h-4 w-4 text-orange-500" />
      case 'api':
        return <Globe className="h-4 w-4 text-blue-500" />
      default:
        return <Globe className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${!source.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {getTypeIcon(source.type)}
              <CardTitle className="text-base font-medium">{source.name}</CardTitle>
            </div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="h-3 w-3" />
              <span className="max-w-xs truncate">{source.url}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(source.is_active, source.last_fetched)}>
              {getStatusText(source.is_active, source.last_fetched)}
            </Badge>
            <Switch
              checked={source.is_active}
              onCheckedChange={(checked) => onToggle(source.id, checked)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-lg font-light text-gray-900">{source.fetch_interval_minutes}min</p>
            <p className="text-xs text-gray-500">Scan Interval</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-light text-gray-900">{source.type.toUpperCase()}</p>
            <p className="text-xs text-gray-500">Source Type</p>
          </div>
        </div>

        {source.last_fetched && (
          <div className="mb-4 flex items-center justify-center text-sm text-gray-500">
            <Clock className="mr-1 h-3 w-3" />
            <span>
              Last scan: {formatDistanceToNow(new Date(source.last_fetched), { addSuffix: true })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScan(source.id)}
              disabled={isScanning || !source.is_active}
            >
              {isScanning ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(source)}>
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => onDelete(source.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Add Source Dialog Component
function AddSourceDialog({
  category,
  onAdd,
  open,
  onOpenChange,
}: {
  category: CategoryType
  onAdd: (sourceData: {
    name: string
    url: string
    type: 'rss' | 'api' | 'scraper' | 'manual'
    fetch_interval_minutes: number
  }) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'rss' as const,
    fetch_interval_minutes: 60,
  })

  const handleSubmit = () => {
    if (formData.name && formData.url) {
      onAdd(formData)
      setFormData({ name: '', url: '', type: 'rss', fetch_interval_minutes: 60 })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>
            Add a new content source for the {category} category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Source Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., TimeOut Dubai Dining"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/feed.rss"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Source Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss">RSS Feed</SelectItem>
                <SelectItem value="api">API Endpoint</SelectItem>
                <SelectItem value="scraper">Web Scraper</SelectItem>
                <SelectItem value="manual">Manual Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Scan Interval (minutes)</Label>
            <Select
              value={formData.fetch_interval_minutes.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, fetch_interval_minutes: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="360">6 hours</SelectItem>
                <SelectItem value="720">12 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Add Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Source Dialog Component
function EditSourceDialog({
  source,
  onSave,
  open,
  onOpenChange,
}: {
  source: AgentSource | null
  onSave: (sourceId: string, updates: Partial<AgentSource>) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [formData, setFormData] = useState({
    name: source?.name || '',
    url: source?.url || '',
    type: source?.type || ('rss' as const),
    fetch_interval_minutes: source?.fetch_interval_minutes || 60,
  })

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        url: source.url,
        type: source.type,
        fetch_interval_minutes: source.fetch_interval_minutes,
      })
    }
  }, [source])

  const handleSubmit = () => {
    if (source && formData.name && formData.url) {
      onSave(source.id, formData)
      onOpenChange(false)
    }
  }

  if (!source) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
          <DialogDescription>Update the settings for this content source.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Source Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type">Source Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss">RSS Feed</SelectItem>
                <SelectItem value="api">API Endpoint</SelectItem>
                <SelectItem value="scraper">Web Scraper</SelectItem>
                <SelectItem value="manual">Manual Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-interval">Scan Interval (minutes)</Label>
            <Select
              value={formData.fetch_interval_minutes.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, fetch_interval_minutes: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="360">6 hours</SelectItem>
                <SelectItem value="720">12 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main SourceManager Component
export function SourceManager({ category }: SourceManagerProps) {
  const [sources, setSources] = useState<AgentSource[]>([])
  const [loading, setLoading] = useState(true)
  const [scanningSourceId, setScanningSourceId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<AgentSource | null>(null)
  const { toast } = useToast()

  // Load sources on mount and category change
  useEffect(() => {
    loadSources()
  }, [category])

  const loadSources = async () => {
    setLoading(true)
    try {
      const agentType = CATEGORY_AGENT_MAP[category]
      const sourcesData = await contentManagementService.getSourcesByCategory(agentType)
      setSources(sourcesData)
    } catch (error) {
      console.error('Error loading sources:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sources. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSource = async (sourceData: {
    name: string
    url: string
    type: 'rss' | 'api' | 'scraper' | 'manual'
    fetch_interval_minutes: number
  }) => {
    try {
      // Get the first agent for this category
      const agentType = CATEGORY_AGENT_MAP[category]
      const agents = await contentManagementService.getAgentsByCategory(agentType)

      if (agents.length === 0) {
        toast({
          title: 'Error',
          description: `No AI agent found for ${category} category.`,
          variant: 'destructive',
        })
        return
      }

      const newSource = await contentManagementService.addSource(agents[0].id, sourceData)

      if (newSource) {
        setSources([...sources, newSource])
        toast({
          title: 'Success',
          description: 'Source added successfully!',
        })
      } else {
        throw new Error('Failed to add source')
      }
    } catch (error) {
      console.error('Error adding source:', error)
      toast({
        title: 'Error',
        description: 'Failed to add source. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleSource = async (sourceId: string, isActive: boolean) => {
    try {
      const success = await contentManagementService.updateSource(sourceId, { is_active: isActive })

      if (success) {
        setSources(sources.map((s) => (s.id === sourceId ? { ...s, is_active: isActive } : s)))
        toast({
          title: 'Success',
          description: `Source ${isActive ? 'activated' : 'deactivated'} successfully!`,
        })
      } else {
        throw new Error('Failed to update source')
      }
    } catch (error) {
      console.error('Error toggling source:', error)
      toast({
        title: 'Error',
        description: 'Failed to update source. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const success = await contentManagementService.deleteSource(sourceId)

      if (success) {
        setSources(sources.filter((s) => s.id !== sourceId))
        toast({
          title: 'Success',
          description: 'Source deleted successfully!',
        })
      } else {
        throw new Error('Failed to delete source')
      }
    } catch (error) {
      console.error('Error deleting source:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete source. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleScanSource = async (sourceId: string) => {
    setScanningSourceId(sourceId)
    try {
      const result = await contentManagementService.testSource(sourceId)

      if (result.success) {
        // Update the last_fetched timestamp in local state
        setSources(
          sources.map((s) =>
            s.id === sourceId ? { ...s, last_fetched: new Date().toISOString() } : s
          )
        )

        toast({
          title: 'Scan Complete',
          description: result.articlesFound
            ? `Found ${result.articlesFound} articles. ${result.message}`
            : result.message,
        })
      } else {
        toast({
          title: 'Scan Failed',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error scanning source:', error)
      toast({
        title: 'Error',
        description: 'Failed to scan source. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setScanningSourceId(null)
    }
  }

  const handleEditSource = (source: AgentSource) => {
    setEditingSource(source)
    setEditDialogOpen(true)
  }

  const handleSaveSource = async (sourceId: string, updates: Partial<AgentSource>) => {
    try {
      const success = await contentManagementService.updateSource(sourceId, updates)

      if (success) {
        setSources(sources.map((s) => (s.id === sourceId ? { ...s, ...updates } : s)))
        toast({
          title: 'Success',
          description: 'Source updated successfully!',
        })
      } else {
        throw new Error('Failed to update source')
      }
    } catch (error) {
      console.error('Error updating source:', error)
      toast({
        title: 'Error',
        description: 'Failed to update source. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading sources...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Content Sources</h3>
          <p className="text-sm text-gray-500">
            Manage RSS feeds and content sources for the {category} category
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {sources.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No sources configured</h3>
              <p className="text-gray-500">Add your first content source to get started</p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Source
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={handleEditSource}
              onToggle={handleToggleSource}
              onDelete={handleDeleteSource}
              onScan={handleScanSource}
              isScanning={scanningSourceId === source.id}
            />
          ))}
        </div>
      )}

      <AddSourceDialog
        category={category}
        onAdd={handleAddSource}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <EditSourceDialog
        source={editingSource}
        onSave={handleSaveSource}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingSource(null)
        }}
      />
    </div>
  )
}
