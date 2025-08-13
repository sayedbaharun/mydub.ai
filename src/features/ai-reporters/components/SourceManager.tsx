import { useState } from 'react'
import { useSources, useAddSource, useUpdateSource, useDeleteSource, useTestSource } from '../hooks/useAgentStatus'
import { ContentSource } from '../types'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Switch } from '@/shared/components/ui/switch'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { 
  Plus, 
  Link, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Globe,
  Rss,
  Database,
  Users,
  Building,
  Edit,
  Trash,
  Play,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SourceManager() {
  const { data: sources, isLoading } = useSources()
  const addSource = useAddSource()
  const updateSource = useUpdateSource()
  const deleteSource = useDeleteSource()
  const testSource = useTestSource()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSource, setEditingSource] = useState<ContentSource | null>(null)
  const [newSource, setNewSource] = useState<Partial<ContentSource>>({
    name: '',
    url: '',
    type: 'rss',
    category: '',
    language: 'en',
    fetch_frequency: 30,
    status: 'active'
  })

  const getSourceIcon = (type: ContentSource['type']) => {
    const icons = {
      rss: Rss,
      api: Database,
      scraper: Globe,
      social: Users,
      official: Building
    }
    return icons[type] || Link
  }

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url) return

    await addSource.mutateAsync({
      name: newSource.name,
      url: newSource.url,
      type: newSource.type as ContentSource['type'],
      category: newSource.category || '',
      language: newSource.language || 'en',
      fetch_frequency: newSource.fetch_frequency || 30,
      status: 'active',
      reliability_score: 100,
      error_count: 0
    })

    setShowAddDialog(false)
    setNewSource({
      name: '',
      url: '',
      type: 'rss',
      category: '',
      language: 'en',
      fetch_frequency: 30,
      status: 'active'
    })
  }

  const handleUpdateSource = async () => {
    if (!editingSource) return

    await updateSource.mutateAsync({
      sourceId: editingSource.id,
      updates: {
        name: editingSource.name,
        url: editingSource.url,
        category: editingSource.category,
        language: editingSource.language,
        fetch_frequency: editingSource.fetch_frequency,
        status: editingSource.status
      }
    })

    setEditingSource(null)
  }

  const handleDeleteSource = async (sourceId: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      await deleteSource.mutateAsync(sourceId)
    }
  }

  const handleTestSource = async (sourceId: string) => {
    await testSource.mutateAsync(sourceId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Source Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Sources List */}
      <div className="grid grid-cols-1 gap-4">
        {sources?.map((source) => {
          const Icon = getSourceIcon(source.type)
          
          return (
            <Card key={source.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{source.name}</h3>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {source.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">{source.type}</Badge>
                      <Badge variant="outline">{source.category}</Badge>
                      <Badge variant="outline">{source.language.toUpperCase()}</Badge>
                      <Badge variant={
                        source.status === 'active' ? 'default' :
                        source.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {source.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updates every {source.fetch_frequency} min
                      </span>
                      {source.last_fetched && (
                        <span>
                          Last fetched {formatDistanceToNow(new Date(source.last_fetched), { addSuffix: true })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        Reliability: {source.reliability_score}%
                      </span>
                      {source.error_count > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {source.error_count} errors
                        </span>
                      )}
                    </div>

                    {source.metadata && (
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {source.metadata.requires_auth && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Authenticated
                          </span>
                        )}
                        {source.metadata.rate_limit && (
                          <span>Rate limit: {source.metadata.rate_limit}/hour</span>
                        )}
                        {source.metadata.custom_parser && (
                          <span>Custom parser enabled</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestSource(source.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingSource(source)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSource(source.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}

        {sources?.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No content sources configured</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Source
            </Button>
          </Card>
        )}
      </div>

      {/* Add Source Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source Name *</Label>
              <Input
                placeholder="e.g., Dubai Tourism RSS Feed"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              />
            </div>

            <div>
              <Label>Source Type</Label>
              <Select 
                value={newSource.type} 
                onValueChange={(value) => setNewSource({ ...newSource, type: value as ContentSource['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                  <SelectItem value="scraper">Web Scraper</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="official">Official Source</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Input
                placeholder="e.g., tourism, news, government"
                value={newSource.category}
                onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
              />
            </div>

            <div>
              <Label>Language</Label>
              <Select 
                value={newSource.language} 
                onValueChange={(value) => setNewSource({ ...newSource, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Update Frequency (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={newSource.fetch_frequency}
                onChange={(e) => setNewSource({ ...newSource, fetch_frequency: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSource}
              disabled={!newSource.name || !newSource.url}
            >
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      {editingSource && (
        <Dialog open={!!editingSource} onOpenChange={() => setEditingSource(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Content Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source Name</Label>
                <Input
                  value={editingSource.name}
                  onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                />
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  value={editingSource.url}
                  onChange={(e) => setEditingSource({ ...editingSource, url: e.target.value })}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  value={editingSource.category}
                  onChange={(e) => setEditingSource({ ...editingSource, category: e.target.value })}
                />
              </div>

              <div>
                <Label>Language</Label>
                <Select 
                  value={editingSource.language} 
                  onValueChange={(value) => setEditingSource({ ...editingSource, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ur">Urdu</SelectItem>
                  </SelectContent>
              </Select>
              </div>

              <div>
                <Label>Update Frequency (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={editingSource.fetch_frequency}
                  onChange={(e) => setEditingSource({ ...editingSource, fetch_frequency: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <Switch
                  checked={editingSource.status === 'active'}
                  onCheckedChange={(checked) => 
                    setEditingSource({ ...editingSource, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSource(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSource}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}