import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { supabase } from '@/shared/lib/supabase'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { X, Plus, Upload, Globe, FileText, Tag, Image as ImageIcon } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

interface ArticleCreateFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: {
    title?: string
    summary?: string
    content?: string
    category?: string
    source_type?: string
    source_name?: string
  }
}

export function ArticleCreateForm({ onSuccess, onCancel, initialData }: ArticleCreateFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // Form fields
  const [formData, setFormData] = useState({
    // English content
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    content: initialData?.content || '',
    
    // Multilingual content
    title_ar: '',
    summary_ar: '',
    content_ar: '',
    title_hi: '',
    summary_hi: '',
    content_hi: '',
    title_ur: '',
    summary_ur: '',
    content_ur: '',
    
    // Metadata
    category: initialData?.category || 'news',
    source_type: initialData?.source_type || 'manual',
    source_name: initialData?.source_name || '',
    featured_image: '',
    
    // SEO
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    
    // Publishing options
    is_featured: false,
    is_breaking: false,
    enable_comments: true,
    schedule_publish: false,
    scheduled_date: '',
    scheduled_time: '',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `article-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath)

      handleInputChange('featured_image', publicUrl)
      toast({
        title: 'Image uploaded',
        description: 'Featured image uploaded successfully',
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!formData.title || !formData.summary || !formData.content) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)

      const articleData = {
        title: formData.title,
        title_ar: formData.title_ar || null,
        title_hi: formData.title_hi || null,
        title_ur: formData.title_ur || null,
        summary: formData.summary,
        summary_ar: formData.summary_ar || null,
        summary_hi: formData.summary_hi || null,
        summary_ur: formData.summary_ur || null,
        content: formData.content,
        content_ar: formData.content_ar || null,
        content_hi: formData.content_hi || null,
        content_ur: formData.content_ur || null,
        category: formData.category,
        status,
        source_type: formData.source_type,
        source_name: formData.source_name || null,
        author_id: user?.id,
        featured_image: formData.featured_image || null,
        tags,
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.summary,
        seo_keywords: formData.seo_keywords || tags.join(', '),
        is_featured: formData.is_featured,
        is_breaking_news: formData.is_breaking,
        enable_comments: formData.enable_comments,
        published_at: formData.schedule_publish && status === 'submitted' 
          ? `${formData.scheduled_date}T${formData.scheduled_time}:00Z`
          : null,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('articles')
        .insert([articleData])

      if (error) {
        console.error('Supabase error creating article:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      toast({
        title: 'Article created',
        description: status === 'draft' 
          ? 'Article saved as draft' 
          : 'Article submitted for review',
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating article:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        articleData: {
          title: formData.title,
          status,
          category: formData.category,
          author_id: user?.id
        }
      })
      
      // Show more detailed error message
      const errorMessage = error?.message || 'Failed to create article. Please try again.'
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Create New Article</h2>
          <p className="text-sm text-gray-500">Fill in the details to create a new article</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">
            <FileText className="mr-2 h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="multilingual">
            <Globe className="mr-2 h-4 w-4" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="mr-2 h-4 w-4" />
            Media & SEO
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Tag className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>Main content in English (required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter article title"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Brief summary of the article"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your article content here..."
                  rows={10}
                  disabled={isSubmitting}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="tourism">Tourism</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type">Source Type</Label>
                  <Select
                    value={formData.source_type}
                    onValueChange={(value) => handleInputChange('source_type', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="source_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="rss">RSS Feed</SelectItem>
                      <SelectItem value="api">API Import</SelectItem>
                      <SelectItem value="ai">AI Generated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.source_type !== 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="source_name">Source Name</Label>
                  <Input
                    id="source_name"
                    value={formData.source_name}
                    onChange={(e) => handleInputChange('source_name', e.target.value)}
                    placeholder="e.g., Reuters, Gulf News, etc."
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multilingual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multilingual Content</CardTitle>
              <CardDescription>Translate your article into other languages (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Arabic */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Arabic (العربية)</h3>
                <div className="space-y-2">
                  <Label htmlFor="title_ar">Title (Arabic)</Label>
                  <Input
                    id="title_ar"
                    value={formData.title_ar}
                    onChange={(e) => handleInputChange('title_ar', e.target.value)}
                    placeholder="العنوان بالعربية"
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary_ar">Summary (Arabic)</Label>
                  <Textarea
                    id="summary_ar"
                    value={formData.summary_ar}
                    onChange={(e) => handleInputChange('summary_ar', e.target.value)}
                    placeholder="الملخص بالعربية"
                    dir="rtl"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content_ar">Content (Arabic)</Label>
                  <Textarea
                    id="content_ar"
                    value={formData.content_ar}
                    onChange={(e) => handleInputChange('content_ar', e.target.value)}
                    placeholder="المحتوى بالعربية"
                    dir="rtl"
                    rows={8}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Hindi */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hindi (हिन्दी)</h3>
                <div className="space-y-2">
                  <Label htmlFor="title_hi">Title (Hindi)</Label>
                  <Input
                    id="title_hi"
                    value={formData.title_hi}
                    onChange={(e) => handleInputChange('title_hi', e.target.value)}
                    placeholder="हिंदी में शीर्षक"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary_hi">Summary (Hindi)</Label>
                  <Textarea
                    id="summary_hi"
                    value={formData.summary_hi}
                    onChange={(e) => handleInputChange('summary_hi', e.target.value)}
                    placeholder="हिंदी में सारांश"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Urdu */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Urdu (اردو)</h3>
                <div className="space-y-2">
                  <Label htmlFor="title_ur">Title (Urdu)</Label>
                  <Input
                    id="title_ur"
                    value={formData.title_ur}
                    onChange={(e) => handleInputChange('title_ur', e.target.value)}
                    placeholder="اردو میں عنوان"
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary_ur">Summary (Urdu)</Label>
                  <Textarea
                    id="summary_ur"
                    value={formData.summary_ur}
                    onChange={(e) => handleInputChange('summary_ur', e.target.value)}
                    placeholder="اردو میں خلاصہ"
                    dir="rtl"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>Upload a featured image for your article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image">Featured Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="featured_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  {formData.featured_image && (
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="h-20 w-20 rounded object-cover"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your article for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="SEO optimized title (defaults to article title)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="SEO meta description (defaults to article summary)"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_keywords">SEO Keywords</Label>
                <Input
                  id="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                  placeholder="Comma-separated keywords"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to categorize your article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>Configure how your article will be published</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_featured">Featured Article</Label>
                  <p className="text-sm text-gray-500">Display prominently on the homepage</p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_breaking">Breaking News</Label>
                  <p className="text-sm text-gray-500">Mark as urgent breaking news</p>
                </div>
                <Switch
                  id="is_breaking"
                  checked={formData.is_breaking}
                  onCheckedChange={(checked) => handleInputChange('is_breaking', checked)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_comments">Enable Comments</Label>
                  <p className="text-sm text-gray-500">Allow readers to comment on this article</p>
                </div>
                <Switch
                  id="enable_comments"
                  checked={formData.enable_comments}
                  onCheckedChange={(checked) => handleInputChange('enable_comments', checked)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule_publish">Schedule Publication</Label>
                  <p className="text-sm text-gray-500">Publish at a specific date and time</p>
                </div>
                <Switch
                  id="schedule_publish"
                  checked={formData.schedule_publish}
                  onCheckedChange={(checked) => handleInputChange('schedule_publish', checked)}
                  disabled={isSubmitting}
                />
              </div>

              {formData.schedule_publish && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Date</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_time">Time</Label>
                    <Input
                      id="scheduled_time"
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit('submitted')}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
          Submit for Review
        </Button>
      </div>
    </div>
  )
}