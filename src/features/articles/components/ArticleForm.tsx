import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Article } from '../types'
import { useCreateDraft, useUpdateArticle } from '../api/articles'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { useAuth } from '@/features/auth/context/AuthContext'

const schema = z.object({
  title: z.string().min(3, 'Heading is required'),
  subTitle: z.string().optional(),
  body: z.string().min(50, 'Article should have some content'),
  featuredImageUrl: z.string().url().optional().or(z.literal('')),
  gallery: z.array(z.string().url()).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

export type ArticleFormValues = z.infer<typeof schema>

type Props = {
  draft?: Partial<Article>
  onSubmitted?: (articleId: string) => void
}

export function ArticleForm({ draft, onSubmitted }: Props) {
  const createDraft = useCreateDraft()
  const updateArticle = useUpdateArticle()
  const { user } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ArticleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: draft?.title ?? '',
      subTitle: draft?.subTitle ?? '',
      body: draft?.body ?? '',
      featuredImageUrl: draft?.featuredImageUrl ?? '',
      categoryId: draft?.categoryId ?? '',
      tags: draft?.tags ?? [],
      slug: draft?.slug ?? '',
      seoTitle: draft?.seo?.title ?? '',
      seoDescription: draft?.seo?.description ?? '',
    },
  })

  const onSubmit = async (values: ArticleFormValues) => {
    let id = draft?.id
    if (!id) {
      const created = await createDraft.mutateAsync({
        title: values.title,
        subTitle: values.subTitle,
        body: values.body,
        featuredImageUrl: values.featuredImageUrl || undefined,
        categoryId: values.categoryId || undefined,
        tags: values.tags,
        slug: values.slug,
        seo: { title: values.seoTitle, description: values.seoDescription },
        createdBy: user?.id || 'anonymous',
      })
      id = created.id
    } else {
      await updateArticle.mutateAsync({
        id,
        updates: {
          title: values.title,
          subTitle: values.subTitle,
          body: values.body,
          featuredImageUrl: values.featuredImageUrl || undefined,
          categoryId: values.categoryId || undefined,
          tags: values.tags,
          slug: values.slug,
          seo: { title: values.seoTitle, description: values.seoDescription },
        },
      })
    }
    onSubmitted?.(id!)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <label className="font-medium">Heading</label>
        <Input {...register('title')} placeholder="Enter heading" />
        {errors.title && <p className="text-red-600 text-sm">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4">
        <label className="font-medium">Sub heading</label>
        <Input {...register('subTitle')} placeholder="Optional sub heading" />
      </div>

      <div className="grid gap-4">
        <label className="font-medium">Article</label>
        <Textarea rows={12} {...register('body')} placeholder="Write or paste the article body" />
        {errors.body && <p className="text-red-600 text-sm">{errors.body.message}</p>}
      </div>

      <div className="grid gap-4">
        <label className="font-medium">Featured Image URL</label>
        <Input {...register('featuredImageUrl')} placeholder="https://..." />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="font-medium">Category</label>
          <Input {...register('categoryId')} placeholder="Category id or slug" />
        </div>
        <div>
          <label className="font-medium">SEO Title</label>
          <Input {...register('seoTitle')} placeholder="SEO title" />
        </div>
        <div>
          <label className="font-medium">SEO Description</label>
          <Input {...register('seoDescription')} placeholder="SEO description" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>
    </form>
  )
}

export default ArticleForm
