import { useState } from 'react'
import { ApprovalItem } from '../types'
import { useApprovalItem } from '../hooks/useApprovalQueue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { 
  Globe, 
  Eye, 
  Clock, 
  User, 
  Link, 
  Tag,
  BarChart,
  Languages,
  Image as ImageIcon
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ApprovalActions } from './ApprovalActions'

interface ArticlePreviewProps {
  item: ApprovalItem
  onClose: () => void
  onAction?: () => void
}

export function ArticlePreview({ item, onClose, onAction }: ArticlePreviewProps) {
  const [activeTab, setActiveTab] = useState('content')
  const { data: fullItem, isLoading, error } = useApprovalItem(item.id)

  // Log any errors for debugging
  if (error) {
    console.error('Error loading article preview:', error)
  }

  const articleData = fullItem || item

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Article Preview</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="content" className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">
                          {articleData.title}
                        </h2>
                        {articleData.title_ar && (
                          <h3 className="text-xl text-gray-700 mb-4" dir="rtl">
                            {articleData.title_ar}
                          </h3>
                        )}
                      </div>

                      <div className="prose prose-gray max-w-none">
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="font-medium text-gray-700 mb-2">Excerpt:</p>
                          <p className="text-gray-600">{articleData.excerpt}</p>
                          {articleData.excerpt_ar && (
                            <p className="text-gray-600 mt-2" dir="rtl">
                              {articleData.excerpt_ar}
                            </p>
                          )}
                        </div>

                        {articleData.content?.body ? (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Full Content:</p>
                            <div 
                              className="text-gray-600 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: articleData.content.body }}
                            />
                            {articleData.content.body_ar && (
                              <div 
                                className="text-gray-600 whitespace-pre-wrap mt-6 pt-6 border-t" 
                                dir="rtl"
                                dangerouslySetInnerHTML={{ __html: articleData.content.body_ar }}
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">Loading full content...</p>
                        )}
                      </div>

                      {articleData.content?.images && articleData.content.images.length > 0 && (
                        <div className="space-y-4">
                          <p className="font-medium text-gray-700">Images:</p>
                          {articleData.content.images.map((image, index) => (
                            <div key={index} className="space-y-2">
                              <img 
                                src={image.url} 
                                alt={image.alt || `Image ${index + 1}`}
                                className="w-full rounded-lg"
                              />
                              {image.caption && (
                                <p className="text-sm text-gray-600 text-center">
                                  {image.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <Card className="p-6">
                    <p className="text-sm text-gray-500 mb-2">
                      This is how the article will appear on the website:
                    </p>
                    <div className="border rounded-lg p-6 bg-white">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{articleData.content_type}</Badge>
                          <span>•</span>
                          <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-gray-900">
                          {articleData.title}
                        </h1>
                        
                        <p className="text-lg text-gray-600 leading-relaxed">
                          {articleData.excerpt}
                        </p>

                        {articleData.content?.images?.[0] && (
                          <img 
                            src={articleData.content.images[0].url}
                            alt={articleData.content.images[0].alt}
                            className="w-full rounded-lg"
                          />
                        )}

                        <div className="prose prose-gray max-w-none">
                          {articleData.content?.body && (
                            <div dangerouslySetInnerHTML={{ __html: articleData.content.body }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Article Metadata</h3>
                    <dl className="space-y-3">
                      {articleData.metadata?.word_count && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Word Count</dt>
                          <dd className="text-sm text-gray-900">{articleData.metadata.word_count}</dd>
                        </div>
                      )}
                      {articleData.metadata?.reading_time && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Reading Time</dt>
                          <dd className="text-sm text-gray-900">{articleData.metadata.reading_time} min</dd>
                        </div>
                      )}
                      {articleData.metadata?.language && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Language</dt>
                          <dd className="text-sm text-gray-900">{articleData.metadata.language}</dd>
                        </div>
                      )}
                      {articleData.metadata?.sentiment && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Sentiment</dt>
                          <dd className="text-sm text-gray-900">
                            <Badge variant={
                              articleData.metadata.sentiment === 'positive' ? 'default' :
                              articleData.metadata.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }>
                              {articleData.metadata.sentiment}
                            </Badge>
                          </dd>
                        </div>
                      )}
                      {articleData.metadata?.tags && articleData.metadata.tags.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                          <dd className="flex flex-wrap gap-2">
                            {articleData.metadata.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Article Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Created
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDistanceToNow(new Date(articleData.created_at), { addSuffix: true })}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Author
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {articleData.ai_agent?.name || articleData.author.name}
                  </dd>
                </div>

                {articleData.source && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Link className="h-4 w-4" />
                      Source
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {articleData.source.name}
                    </dd>
                  </div>
                )}

                {articleData.metadata?.quality_score && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <BarChart className="h-4 w-4" />
                      Quality Score
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {articleData.metadata.quality_score}%
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm">
                    <Badge variant={
                      articleData.status === 'pending' ? 'default' :
                      articleData.status === 'approved' ? 'success' :
                      articleData.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {articleData.status}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="text-sm">
                    <Badge variant={
                      articleData.priority === 'high' ? 'destructive' :
                      articleData.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {articleData.priority}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <ApprovalActions
                  item={articleData}
                  onAction={() => {
                    onAction?.()
                    onClose()
                  }}
                  showLabels
                />
                
                {articleData.preview_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(articleData.preview_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Live Preview
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}