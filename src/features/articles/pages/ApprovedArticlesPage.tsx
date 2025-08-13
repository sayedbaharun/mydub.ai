 
import { useArticles, useTransitionArticle } from '../api/articles'
import ArticleTable from '../components/ArticleTable'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/context/AuthContext'
import { UserRole } from '@/shared/lib/auth/roles'
import { canTransition } from '../permissions'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { toPreviewArticle, type PreviewArticle } from '@/features/articles/lib/preview'

export default function ApprovedArticlesPage() {
  const { data, isLoading, error } = useArticles({ status: 'approved' })
  const transition = useTransitionArticle()
  const { user } = useAuth()
  const role = (user?.role as UserRole) || UserRole.USER
  const [preview, setPreview] = useState<PreviewArticle | null>(null)

  if (isLoading) return <p>Loading approved articles...</p>
  if (error) return <p className="text-red-600">Failed to load approved articles</p>

  const actions = (a: any) => (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="outline" onClick={() => setPreview(toPreviewArticle(a))}>Preview</Button>
      {canTransition(role, 'approved', 'published') && (
        <Button size="sm" onClick={async () => {
          await transition.mutateAsync({ id: a.id, to: 'published', currentUserId: user?.id })
          toast.success('Published')
        }}>Publish</Button>
      )}
      {canTransition(role, 'submitted', 'changes_requested') && (
        <Button size="sm" variant="secondary" onClick={async () => {
          await transition.mutateAsync({ id: a.id, to: 'changes_requested', currentUserId: user?.id })
          toast.success('Changes requested')
        }}>Request Changes</Button>
      )}
    </div>
  )

  const renderPreview = () => (
    <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
      <DialogContent className="max-w-3xl">
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
        <h1 className="text-xl font-semibold">Approved Articles</h1>
      </div>
      <ArticleTable articles={data ?? []} actions={actions} />
      {renderPreview()}
    </div>
  )
}
