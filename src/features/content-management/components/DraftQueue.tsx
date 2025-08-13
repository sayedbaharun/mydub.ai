import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Clock,
  Calendar,
  User,
  Bot,
  Image as ImageIcon,
  FileText,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type CategoryType = 'dining' | 'experiences' | 'nightlife' | 'luxury' | 'practical'

interface ArticleDraft {
  id: string
  title: string
  summary: string
  content: string
  category: CategoryType
  sourceUrl: string
  sourceName: string
  aiScore: number
  createdAt: Date
  estimatedReadTime: number
  hasImages: boolean
  imageCount: number
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  aiAgent: string
  tags: string[]
}

interface DraftQueueProps {
  category: CategoryType
}

// Mock data
const MOCK_DRAFTS: ArticleDraft[] = [
  {
    id: '1',
    title: 'New Michelin-Star Restaurant Opens in DIFC',
    summary:
      'Renowned Chef Marco Silva brings his award-winning cuisine to Dubai International Financial Centre with the opening of Lumière, featuring contemporary French dishes...',
    content: '...',
    category: 'dining',
    sourceUrl: 'https://timeoutdubai.com/new-restaurant',
    sourceName: 'TimeOut Dubai',
    aiScore: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    estimatedReadTime: 4,
    hasImages: true,
    imageCount: 3,
    status: 'pending',
    aiAgent: 'News Reporter',
    tags: ['fine-dining', 'DIFC', 'french-cuisine', 'michelin'],
  },
  {
    id: '2',
    title: 'Dubai Food Festival 2025: Complete Guide',
    summary:
      'Everything you need to know about Dubai Food Festival 2025, including participating restaurants, special offers, celebrity chef appearances...',
    content: '...',
    category: 'dining',
    sourceUrl: 'https://whatson.ae/food-festival',
    sourceName: "What's On Dubai",
    aiScore: 88,
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    estimatedReadTime: 6,
    hasImages: true,
    imageCount: 5,
    status: 'reviewing',
    aiAgent: 'Lifestyle Reporter',
    tags: ['food-festival', 'events', 'restaurants', 'celebrity-chefs'],
  },
  {
    id: '3',
    title: 'Best Rooftop Dining Spots for Winter 2025',
    summary:
      "Discover Dubai's most spectacular rooftop restaurants perfect for the winter season, offering stunning views and exceptional cuisine...",
    content: '...',
    category: 'dining',
    sourceUrl: 'https://zomato.com/rooftop-dining',
    sourceName: 'Zomato Dubai',
    aiScore: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    estimatedReadTime: 5,
    hasImages: false,
    imageCount: 0,
    status: 'pending',
    aiAgent: 'Tourism Reporter',
    tags: ['rooftop', 'winter-dining', 'views', 'restaurants'],
  },
]

function DraftCard({
  draft,
  onApprove,
  onReject,
  onEdit,
  onPreview,
}: {
  draft: ArticleDraft
  onApprove: (draftId: string) => void
  onReject: (draftId: string) => void
  onEdit: (draftId: string) => void
  onPreview: (draftId: string) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-600 bg-orange-50'
      case 'reviewing':
        return 'text-blue-600 bg-blue-50'
      case 'approved':
        return 'text-green-600 bg-green-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-orange-600 bg-orange-50'
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <Badge variant="outline" className="text-xs">
                {draft.aiAgent}
              </Badge>
              <Badge className={getStatusColor(draft.status)}>{draft.status}</Badge>
            </div>
            <CardTitle className="mb-2 text-lg font-medium leading-tight">{draft.title}</CardTitle>
            <p className="line-clamp-2 text-sm text-gray-600">{draft.summary}</p>
          </div>
          <Badge className={getScoreColor(draft.aiScore)}>{draft.aiScore}% AI Score</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{draft.estimatedReadTime} min read</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(draft.createdAt, { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <ImageIcon className="h-4 w-4" />
            <span>{draft.hasImages ? `${draft.imageCount} images` : 'No images'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="h-4 w-4" />
            <span>{draft.sourceName}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {draft.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {draft.tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{draft.tags.length - 4} more
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(draft.id)}>
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(draft.id)}>
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(draft.id)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(draft.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DraftQueue({ category }: DraftQueueProps) {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState(MOCK_DRAFTS.filter((d) => d.category === category))
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing'>('all')
  const [previewDraft, setPreviewDraft] = useState<ArticleDraft | null>(null)

  const handleApproveDraft = (draftId: string) => {
    setDrafts(drafts.map((d) => (d.id === draftId ? { ...d, status: 'approved' as const } : d)))
    // In real app, this would publish the article
  }

  const handleRejectDraft = (draftId: string) => {
    setDrafts(drafts.map((d) => (d.id === draftId ? { ...d, status: 'rejected' as const } : d)))
  }

  const handleEditDraft = (draftId: string) => {
    // Navigate to content approval page for now (draft editor coming soon)
    navigate(`/dashboard/content-approval?draft=${draftId}`)
  }

  const handlePreviewDraft = (draftId: string) => {
    // Find and show draft preview
    const draft = drafts.find((d) => d.id === draftId)
    if (draft) {
      setPreviewDraft(draft)
    }
  }

  const filteredDrafts =
    filter === 'all'
      ? drafts.filter((d) => d.status !== 'approved' && d.status !== 'rejected')
      : drafts.filter((d) => d.status === filter)

  const pendingCount = drafts.filter((d) => d.status === 'pending').length
  const reviewingCount = drafts.filter((d) => d.status === 'reviewing').length

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Draft Queue</h2>
          <p className="text-sm text-gray-500">
            {pendingCount} pending • {reviewingCount} in review
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({filteredDrafts.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'reviewing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('reviewing')}
          >
            Reviewing ({reviewingCount})
          </Button>
        </div>
      </div>

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No drafts to review</h3>
          <p className="text-sm text-gray-500">
            AI-generated content will appear here for review and approval.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onApprove={handleApproveDraft}
              onReject={handleRejectDraft}
              onEdit={handleEditDraft}
              onPreview={handlePreviewDraft}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Preview Draft</h2>
                <Button variant="outline" onClick={() => setPreviewDraft(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold">{previewDraft.title}</h3>
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                  <Badge className="bg-blue-50 text-blue-600">{previewDraft.aiAgent}</Badge>
                  <span>•</span>
                  <span>{previewDraft.estimatedReadTime} min read</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(previewDraft.createdAt, { addSuffix: true })}</span>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="mb-4 text-lg text-gray-700">{previewDraft.summary}</p>
                <div className="text-gray-600">
                  <p>{previewDraft.content}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Source:{' '}
                    <a
                      href={previewDraft.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {previewDraft.sourceName}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewDraft(null)
                        handleEditDraft(previewDraft.id)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        handleApproveDraft(previewDraft.id)
                        setPreviewDraft(null)
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
