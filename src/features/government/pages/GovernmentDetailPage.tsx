import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Building,
  AlertTriangle,
  FileText,
  ExternalLink,
  Download,
  Share2,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { GovernmentUpdate } from '@/shared/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/utils'

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', icon: FileText },
  medium: { color: 'bg-blue-100 text-blue-800', icon: FileText },
  high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
}

export function GovernmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [content, setContent] = useState<GovernmentUpdate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        // TODO: Replace with actual API call to fetch government update
        // const response = await supabase.from('government_updates').select('*').eq('id', id).single()

        // Mock data for demonstration
        const mockContent: GovernmentUpdate = {
          id: id,
          type: 'government',
          title: 'New Digital Services Platform Launch',
          description:
            'Dubai Government announces the launch of a new digital services platform that will streamline government services and provide residents with 24/7 access to essential services.',
          imageUrl: '/icons/icon-512x512.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          department: 'Smart Dubai Office',
          priority: 'high',
          documentUrl: 'https://example.com/document.pdf',
        }

        setContent(mockContent)
      } catch (err: any) {
        setError(err.message || 'Failed to load government update')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [id])

  const handleShare = async () => {
    if (!content) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Save bookmark to user preferences
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" text="Loading government update..." />
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Government Update Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'The government update you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate('/government')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Government Updates
          </Button>
        </div>
      </div>
    )
  }

  const priorityStyle = priorityConfig[content.priority]
  const PriorityIcon = priorityStyle.icon

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/government')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Government Updates
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge className="gap-2 bg-violet-100 text-violet-800">
                <Building className="h-3 w-3" />
                Government Update
              </Badge>
              <Badge className={cn('gap-1', priorityStyle.color)}>
                <PriorityIcon className="h-3 w-3" />
                {content.priority.charAt(0).toUpperCase() + content.priority.slice(1)} Priority
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{content.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Priority Alert */}
      {content.priority === 'urgent' && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This is an urgent government update that requires immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Image */}
      {content.imageUrl && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content Body */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Update Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-lg leading-relaxed">{content.description}</p>

              {/* Department Information */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold">Department Information</h3>
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{content.department}</span>
                </div>

                {/* Official Document */}
                {content.documentUrl && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Official Documentation</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <a href={content.documentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Document
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={content.documentUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Department</div>
                <div className="text-muted-foreground">{content.department}</div>
              </div>

              <div>
                <div className="text-sm font-medium">Priority Level</div>
                <Badge className={cn('mt-1', priorityStyle.color)}>
                  {content.priority.charAt(0).toUpperCase() + content.priority.slice(1)}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium">Published</div>
                <div className="text-muted-foreground">
                  {new Date(content.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-muted-foreground">
                  {new Date(content.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Related government services and updates will be displayed here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                For more information about this update:
              </p>
              <Button variant="outline" className="w-full">
                Contact {content.department}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GovernmentDetailPage
