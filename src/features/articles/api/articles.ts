import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Article, ArticleListQuery, ArticleStatus } from '../types'

const TABLE = 'articles'

export function useArticles(query: ArticleListQuery = {}) {
  const { status, search, categoryId } = query
  return useQuery({
    queryKey: ['articles', { status, search, categoryId }],
    queryFn: async (): Promise<Article[]> => {
      let q = supabase.from(TABLE).select('*').order('updated_at', { ascending: false })
      if (status) q = q.eq('status', status)
      if (categoryId) q = q.eq('category_id', categoryId)
      if (search) q = q.ilike('title', `%${search}%`)
      const { data, error } = await q
      if (error) throw error
      // Map snake_case -> camelCase minimal
      return (data as any[]).map(row => ({
        id: row.id,
        title: row.title,
        subTitle: row.sub_title ?? undefined,
        body: row.body ?? '',
        status: row.status as ArticleStatus,
        categoryId: row.category_id ?? undefined,
        featuredImageUrl: row.featured_image_url ?? undefined,
        gallery: row.gallery ?? undefined,
        tags: row.tags ?? undefined,
        slug: row.slug ?? undefined,
        createdBy: row.created_by,
        reviewedBy: row.reviewed_by ?? undefined,
        approvedBy: row.approved_by ?? undefined,
        publishedBy: row.published_by ?? undefined,
        scheduledAt: row.scheduled_at ?? null,
        publishedAt: row.published_at ?? null,
        seo: row.seo ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    },
  })
}

// Aggregate submitted vs published counts over time
export function useArticlesOverTime({ days = 30 }: { days?: number } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return useQuery({
    queryKey: ['articles-over-time', { days }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('status, created_at, published_at')
        .or(`created_at.gte.${since.toISOString()},published_at.gte.${since.toISOString()}`)
      if (error) throw error

      // build buckets per day label
      const buckets = new Map<string, { submitted: number; published: number }>()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const label = d.toLocaleString(undefined, { month: 'short', day: 'numeric' })
        buckets.set(label, { submitted: 0, published: 0 })
      }

      (data ?? []).forEach((row: any) => {
        if (row.created_at) {
          const dt = new Date(row.created_at)
          const label = dt.toLocaleString(undefined, { month: 'short', day: 'numeric' })
          if (buckets.has(label) && row.status === 'submitted') {
            buckets.get(label)!.submitted += 1
          }
        }
        if (row.published_at) {
          const dt = new Date(row.published_at)
          const label = dt.toLocaleString(undefined, { month: 'short', day: 'numeric' })
          if (buckets.has(label)) {
            buckets.get(label)!.published += 1
          }
        }
      })

      return Array.from(buckets.entries()).map(([name, v]) => ({ name, ...v }))
    },
  })
}

export function useCreateDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Article>): Promise<Article> => {
      const insert = {
        title: payload.title ?? 'Untitled',
        sub_title: payload.subTitle ?? null,
        body: payload.body ?? '',
        status: 'draft',
        category_id: payload.categoryId ?? null,
        featured_image_url: payload.featuredImageUrl ?? null,
        gallery: payload.gallery ?? null,
        tags: payload.tags ?? null,
        slug: payload.slug ?? null,
        created_by: payload.createdBy,
        seo: payload.seo ?? null,
      }
      const { data, error } = await supabase.from(TABLE).insert(insert).select('*').single()
      if (error) throw error
      return {
        id: data.id,
        title: data.title,
        subTitle: data.sub_title ?? undefined,
        body: data.body ?? '',
        status: data.status,
        categoryId: data.category_id ?? undefined,
        featuredImageUrl: data.featured_image_url ?? undefined,
        gallery: data.gallery ?? undefined,
        tags: data.tags ?? undefined,
        slug: data.slug ?? undefined,
        createdBy: data.created_by,
        seo: data.seo ?? undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Article> }) => {
      const u: any = {
        title: updates.title,
        sub_title: updates.subTitle,
        body: updates.body,
        category_id: updates.categoryId,
        featured_image_url: updates.featuredImageUrl,
        gallery: updates.gallery,
        tags: updates.tags,
        slug: updates.slug,
        seo: updates.seo,
      }
      const { error } = await supabase.from(TABLE).update(u).eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  })
}

export function useTransitionArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, to, currentUserId }: { id: string; to: ArticleStatus; currentUserId?: string }) => {
      const update: any = { status: to }
      if (to === 'approved' || to === 'changes_requested') update.reviewed_by = currentUserId ?? null
      if (to === 'published') {
        update.published_by = currentUserId ?? null
        update.published_at = new Date().toISOString()
      }
      const { error } = await supabase.from(TABLE).update(update).eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  })
}
