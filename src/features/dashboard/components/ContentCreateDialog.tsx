import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/features/auth/context/AuthContext'
import { dashboardService } from '../services/dashboard.service'
import { contentImages } from '@/shared/lib/storage'

const contentSchema = z.object({
  type: z.enum(['news', 'government', 'tourism', 'event']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  titleAr: z.string().min(3, 'Arabic title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  contentAr: z.string().min(10, 'Arabic content must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  publishNow: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

type ContentFormData = z.infer<typeof contentSchema>

interface ContentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ContentCreateDialog({ open, onOpenChange, onSuccess }: ContentCreateDialogProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      type: 'news',
      title: '',
      titleAr: '',
      content: '',
      contentAr: '',
      category: '',
      publishNow: false,
      isFeatured: false,
    }
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      // Generate a temporary ID for the content
      const tempId = crypto.randomUUID()
      const urls = await contentImages.uploadMultiple(tempId, Array.from(files))
      setUploadedImages(prev => [...prev, ...urls])
      
      toast({
        title: t('imagesUploaded'),
        description: t('imagesUploadedDesc', { count: files.length })
      })
    } catch (error) {
      toast({
        title: t('uploadError'),
        variant: 'destructive'
      })
    }
  }

  const onSubmit = async (data: ContentFormData) => {
    if (!user) return
    
    setIsSubmitting(true)
    try {
      await dashboardService.createContent({
        ...data,
        metadata: {
          category: data.category,
          publishNow: data.publishNow,
          isFeatured: data.isFeatured,
          imageUrl: uploadedImages[0], // Use first image as main image
          images: uploadedImages,
        }
      }, user.id)

      toast({
        title: t('contentCreated'),
        description: data.publishNow 
          ? t('contentPublished')
          : t('dashboard.contentSavedAsDraft')
      })

      form.reset()
      setUploadedImages([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: t('dashboard.createError'),
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryOptions = () => {
    const type = form.watch('type')
    switch (type) {
      case 'news':
        return [
          { value: 'general', label: 'General News' },
          { value: 'business', label: 'Business & Economy' },
          { value: 'technology', label: 'Technology & Innovation' },
          { value: 'sports', label: 'Sports & Recreation' },
          { value: 'entertainment', label: 'Entertainment & Culture' }
        ]
      case 'government':
        return [
          { value: 'visa', label: 'Visa Services' },
          { value: 'licensing', label: 'Business Licensing' },
          { value: 'healthcare', label: 'Healthcare Services' },
          { value: 'education', label: 'Education & Schools' },
          { value: 'utilities', label: 'Utilities & Infrastructure' }
        ]
      case 'tourism':
        return [
          { value: 'attraction', label: 'Tourist Attractions' },
          { value: 'museum', label: 'Museums & Galleries' },
          { value: 'park', label: 'Parks & Recreation' },
          { value: 'beach', label: 'Beaches & Waterfront' },
          { value: 'heritage', label: 'Heritage & Culture' }
        ]
      case 'event':
        return [
          { value: 'cultural', label: 'Cultural Events' },
          { value: 'sports', label: 'Sports Events' },
          { value: 'business', label: 'Business & Networking' },
          { value: 'entertainment', label: 'Entertainment Shows' },
          { value: 'community', label: 'Community Gatherings' }
        ]
      default:
        return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dashboard.createContent')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.createContentDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dashboard.contentType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="news">{t('dashboard.contentType.news')}</SelectItem>
                      <SelectItem value="government">{t('dashboard.contentType.government')}</SelectItem>
                      <SelectItem value="tourism">{t('dashboard.contentType.tourism')}</SelectItem>
                      <SelectItem value="event">{t('dashboard.contentType.event')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.titleEn')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titleAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.titleAr')}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dashboard.category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('dashboard.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getCategoryOptions().map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dashboard.contentEn')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={6}
                      placeholder={t('dashboard.contentPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dashboard.contentAr')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      dir="rtl"
                      rows={6}
                      placeholder={t('dashboard.contentPlaceholderAr')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormItem>
                <FormLabel>{t('dashboard.images')}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('dashboard.uploadImages')}
                        </span>
                      </Button>
                    </label>
                    {uploadedImages.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {t('dashboard.imagesCount', { count: uploadedImages.length })}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {t('dashboard.imagesDescription')}
                </FormDescription>
              </FormItem>

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="publishNow"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        {t('dashboard.publishNow')}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        {t('dashboard.featured')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.watch('publishNow') ? t('dashboard.publish') : t('dashboard.saveDraft')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}