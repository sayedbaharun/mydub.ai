import { useState } from 'react'
import { useTransitionArticle } from '../api/articles'
import { ArticleForm } from '../components/ArticleForm'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function CreateArticlePage() {
  const transition = useTransitionArticle()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSubmitted = (id: string) => {
    setCurrentId(id)
    toast.success('Draft saved')
  }

  const handleSubmitForReview = async () => {
    if (!currentId) return toast.error('Save draft first')
    await transition.mutateAsync({ id: currentId, to: 'submitted', currentUserId: user?.id })
    toast.success('Article submitted for review')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Article</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSubmitForReview} disabled={!currentId || transition.isPending}>
            {transition.isPending ? 'Submitting...' : 'Submit for review'}
          </Button>
        </div>
      </div>
      <ArticleForm onSubmitted={handleSubmitted} />
    </div>
  )
}
