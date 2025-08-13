 
import { useArticles } from '../api/articles'
import ArticleTable from '../components/ArticleTable'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { toPreviewArticle, type PreviewArticle } from '@/features/articles/lib/preview'

export default function PublishedArticlesPage() {
  const { data, isLoading, error } = useArticles({ status: 'published' })
  const [preview, setPreview] = useState<PreviewArticle | null>(null)

  if (isLoading) return <p>Loading published articles...</p>
  if (error) return <p className="text-red-600">Failed to load published articles</p>

  const actions = (a: any) => (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="outline" onClick={() => setPreview(toPreviewArticle(a))}>Preview</Button>
    </div>
  )

  const renderPreview = () => (
    <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{preview?.title}</DialogTitle>
        </DialogHeader>
        {preview?.featuredImageUrl && (
          <img src={preview.featuredImageUrl} alt="Featured" className="w-full rounded mb-4" />
        )}
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: preview?.body || '' }} />
        {Array.isArray(preview?.gallery) && preview.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {preview.gallery.map((src: string, i: number) => (
              <img key={i} src={src} alt={`Image ${i+1}`} className="w-full rounded" />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Published Articles</h1>
      </div>
      <ArticleTable articles={data ?? []} actions={actions} />
      {renderPreview()}
    </div>
  )
}
