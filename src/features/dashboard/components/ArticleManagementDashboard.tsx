import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, canTransitionTo, type ArticleStatus } from '@/shared/types/article-status'
import { useToast } from '@/shared/hooks/use-toast'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Bot,
  Rss,
  TrendingUp,
  Globe2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { ArticleCreateForm } from './ArticleCreateForm'
import { dashboardService } from '../services/dashboard.service'
import { supabase } from '@/shared/lib/supabase'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { ArticleImportService } from '../services/article-import.service'

interface ArticleStats {
  total: number
  draft: number
  assigned: number
  in_progress: number
  submitted: number
  in_review: number
  approved: number
  published: number
  archived: number
}

interface Article {
  id: string
  title: string
  title_ar?: string
  title_hi?: string
  title_ur?: string
  summary: string
  content: string
  status: 'draft' | 'assigned' | 'in_progress' | 'submitted' | 'in_review' | 'approved' | 'published' | 'archived'
  category: string
  source_type: 'manual' | 'rss' | 'api' | 'ai'
  source_name?: string
  author_id: string
  author: {
    id: string
    full_name: string
    email: string
  }
  editor_id?: string
  editor?: {
    id: string
    full_name: string
  }
  published_at?: string
  created_at: string
  updated_at: string
  view_count: number
  featured_image?: string
  tags?: string[]
}

export function ArticleManagementDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<ArticleStats>({
    total: 0,
    draft: 0,
    assigned: 0,
    in_progress: 0,
    submitted: 0,
    in_review: 0,
    approved: 0,
    published: 0,
    archived: 0,
  })
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isImportingAPI, setIsImportingAPI] = useState(false)

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [articles, activeTab, searchQuery, categoryFilter])

  const loadArticles = async () => {
    try {
      setIsLoading(true)
      
      // Load articles from the articles table
      const { data: articlesData, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:author_id(id, full_name, email),
          editor:editor_id(id, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setArticles(articlesData || [])
      
      // Calculate stats
      const newStats: ArticleStats = {
        total: articlesData?.length || 0,
        draft: 0,
        assigned: 0,
        in_progress: 0,
        submitted: 0,
        in_review: 0,
        approved: 0,
        published: 0,
        archived: 0,
      }

      articlesData?.forEach((article) => {
        if (article.status in newStats) {
          newStats[article.status as keyof ArticleStats]++
        }
      })

      setStats(newStats)
    } catch (error) {
      console.error('Error loading articles:', error)
      toast({
        title: 'Error loading articles',
        description: 'Failed to load articles. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = [...articles]

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'in_work') {
        filtered = filtered.filter((article) => article.status === 'assigned' || article.status === 'in_progress')
      } else {
        filtered = filtered.filter((article) => article.status === activeTab)
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((article) =>
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        (article.author?.full_name?.toLowerCase().includes(query) || false)
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((article) => article.category === categoryFilter)
    }

    setFilteredArticles(filtered)
  }

  const handleStatusChange = async (articleId: string, newStatus: Article['status']) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: newStatus,
          editor_id: user?.id,
          updated_at: new Date().toISOString(),
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', articleId)

      if (error) throw error

      toast({
        title: 'Status updated',
        description: `Article status changed to ${newStatus}`,
      })

      loadArticles()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update article status',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      toast({
        title: 'Article deleted',
        description: 'The article has been deleted successfully',
      })

      loadArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive',
      })
    }
  }

  const handleImportRSS = async () => {
    try {
      setIsLoading(true)
      toast({
        title: 'RSS Import Started',
        description: 'Importing articles from RSS feeds...',
      })
      
      const result = await ArticleImportService.importFromRSSFeeds()
      
      if (result.success > 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${result.success} articles from RSS feeds`,
        })
      }
      
      if (result.failed > 0) {
        toast({
          title: 'Import Warnings',
          description: `${result.failed} articles failed to import. Check console for details.`,
          variant: 'destructive',
        })
        console.error('RSS Import Errors:', result.errors)
      }
      
      await loadArticles()
    } catch (error) {
      console.error('RSS Import Error:', error)
      toast({
        title: 'Import Failed',
        description: 'Failed to import articles from RSS feeds',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAI = async () => {
    try {
      setIsLoading(true)
      toast({
        title: 'AI Generation Started',
        description: 'Generating articles with AI...',
      })
      
      const result = await ArticleImportService.generateAIArticles(5)
      
      if (result.success > 0) {
        toast({
          title: 'Generation Complete',
          description: `Successfully generated ${result.success} AI articles`,
        })
      }
      
      if (result.failed > 0) {
        toast({
          title: 'Generation Warnings',
          description: `${result.failed} articles failed to generate. Check console for details.`,
          variant: 'destructive',
        })
        console.error('AI Generation Errors:', result.errors)
      }
      
      await loadArticles()
    } catch (error) {
      console.error('AI Generation Error:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate articles with AI',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportAPI = async () => {
    try {
      setIsImportingAPI(true)
      toast({
        title: 'API Import Started',
        description: 'Importing articles from external APIs...',
      })
      
      const result = await ArticleImportService.importFromAPIs()
      
      if (result.success > 0) {
        toast({
          title: 'API Import Complete',
          description: `Successfully imported ${result.success} articles from APIs`,
        })
      }
      
      if (result.failed > 0) {
        toast({
          title: 'API Import Warnings',
          description: `${result.failed} articles failed to import. Check console for details.`,
          variant: 'destructive',
        })
        console.error('API Import Errors:', result.errors)
      }
      
      await loadArticles()
    } catch (error) {
      console.error('API Import Error:', error)
      toast({
        title: 'API Import Failed',
        description: 'Failed to import articles from APIs',
        variant: 'destructive',
      })
    } finally {
      setIsImportingAPI(false)
    }
  }

  const getStatusIcon = (status: Article['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'assigned':
      case 'in_progress':
        return <Edit className="h-4 w-4" />
      case 'submitted':
      case 'in_review':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'published':
        return <Eye className="h-4 w-4" />
      case 'archived':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Article['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'assigned':
        return 'bg-indigo-100 text-indigo-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'published':
        return 'bg-purple-100 text-purple-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceIcon = (sourceType: Article['source_type']) => {
    switch (sourceType) {
      case 'manual':
        return <Edit className="h-4 w-4" />
      case 'rss':
        return <Rss className="h-4 w-4" />
      case 'api':
        return <TrendingUp className="h-4 w-4" />
      case 'ai':
        return <Bot className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-light text-gray-900">Article Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create, review, and publish articles across all categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Article
          </Button>
          <Button
            onClick={handleImportRSS}
            variant="outline"
            disabled={isLoading}
          >
            <Rss className="mr-2 h-4 w-4" />
            Import RSS
          </Button>
          <Button
            onClick={handleImportAPI}
            variant="outline"
            disabled={isImportingAPI}
          >
            <Globe2 className="mr-2 h-4 w-4" />
            Import API
          </Button>
          <Button
            onClick={handleGenerateAI}
            variant="outline"
            disabled={isLoading}
          >
            <Bot className="mr-2 h-4 w-4" />
            Generate AI
          </Button>
          <Button
            onClick={loadArticles}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold">{stats.in_progress + stats.assigned}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Review</p>
                <p className="text-2xl font-bold">{stats.in_review}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Archived</p>
                <p className="text-2xl font-bold">{stats.archived}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Article Workflow Progress</CardTitle>
          <CardDescription>Visual pipeline showing articles in each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Draft → Assigned → In Progress → Submitted → Review → Approved → Published</span>
              <span className="text-gray-500">
                {stats.published} of {stats.total} articles published
              </span>
            </div>
            <Progress 
              value={(stats.published / stats.total) * 100 || 0} 
              className="h-3"
            />
            <div className="grid grid-cols-6 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Draft</div>
                <div className="text-gray-500">{stats.draft}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Working</div>
                <div className="text-gray-500">{stats.assigned + stats.in_progress}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Submitted</div>
                <div className="text-gray-500">{stats.submitted}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Review</div>
                <div className="text-gray-500">{stats.in_review}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Approved</div>
                <div className="text-gray-500">{stats.approved}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Published</div>
                <div className="text-gray-500">{stats.published}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="tourism">Tourism</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Articles List with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          <TabsTrigger value="in_work">Working ({stats.assigned + stats.in_progress})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="in_review">Review ({stats.in_review})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({stats.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-gray-400" />
                <p className="text-lg text-gray-500">No articles found</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{article.title}</h3>
                              <Badge className={getStatusColor(article.status)}>
                                {getStatusIcon(article.status)}
                                <span className="ml-1">{article.status.replace('_', ' ')}</span>
                              </Badge>
                              <Badge variant="outline">
                                {getSourceIcon(article.source_type)}
                                <span className="ml-1">{article.source_type}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>By {article.author?.full_name || 'Unknown'}</span>
                              <span>•</span>
                              <span>{new Date(article.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{article.category}</span>
                              <span>•</span>
                              <span>{article.view_count} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {article.status === ARTICLE_STATUSES.DRAFT && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(article.id, ARTICLE_STATUSES.SUBMITTED)}
                          >
                            Submit
                          </Button>
                        )}
                        {article.status === ARTICLE_STATUSES.SUBMITTED && user?.role !== 'curator' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(article.id, ARTICLE_STATUSES.IN_REVIEW)}
                          >
                            Start Review
                          </Button>
                        )}
                        {article.status === ARTICLE_STATUSES.IN_REVIEW && user?.role !== 'curator' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(article.id, ARTICLE_STATUSES.APPROVED)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(article.id, ARTICLE_STATUSES.ARCHIVED)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Archive
                            </Button>
                          </>
                        )}
                        {article.status === ARTICLE_STATUSES.APPROVED && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(article.id, ARTICLE_STATUSES.PUBLISHED)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Handle edit
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(article.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Article Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ArticleCreateForm
            onSuccess={() => {
              setShowCreateDialog(false)
              loadArticles()
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Article Preview Dialog */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{selectedArticle.title}</h2>
                <Badge className={getStatusColor(selectedArticle.status)}>
                  {selectedArticle.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>By {selectedArticle.author.full_name}</span>
                <span>•</span>
                <span>{new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{selectedArticle.category}</span>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-600">{selectedArticle.summary}</p>
                <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}