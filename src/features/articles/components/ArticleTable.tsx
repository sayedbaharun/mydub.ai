import React from 'react'
import type { Article } from '../types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'

type Props = {
  articles: Article[]
  emptyText?: string
  actions?: (article: Article) => React.ReactNode
}

export function ArticleTable({ articles, emptyText = 'No articles', actions }: Props) {
  if (!articles?.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="p-3 font-medium">Title</th>
            <th className="p-3 font-medium">Category</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Updated</th>
            <th className="p-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className={cn('border-t')}> 
              <td className="p-3">{a.title}</td>
              <td className="p-3">{a.categoryId ?? '-'}</td>
              <td className="p-3 capitalize">{a.status}</td>
              <td className="p-3">{a.updatedAt ? new Date(a.updatedAt).toLocaleString() : '-'}</td>
              <td className="p-3 text-right">
                {actions ? actions(a) : <Button variant="secondary" size="sm">View</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ArticleTable
