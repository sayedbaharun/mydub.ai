export type ArticleStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'

export interface SeoMeta {
  title?: string
  description?: string
  canonicalUrl?: string
  ogImageUrl?: string
  keywords?: string[]
}

export interface Article {
  id: string
  title: string
  subTitle?: string
  body: string
  status: ArticleStatus
  categoryId?: string
  featuredImageUrl?: string
  gallery?: string[]
  tags?: string[]
  slug?: string
  createdBy: string
  reviewedBy?: string
  approvedBy?: string
  publishedBy?: string
  scheduledAt?: string | null
  publishedAt?: string | null
  seo?: SeoMeta
  createdAt?: string
  updatedAt?: string
}

export interface ArticleListQuery {
  status?: ArticleStatus
  search?: string
  categoryId?: string
}
