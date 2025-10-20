import { supabase } from '@/shared/lib/supabase'

export type QCAction = 'approve' | 'flag' | 'reject' | 'revision'

export interface ReviewScores {
  overall_score: number
  content_quality?: number
  grammar_score?: number
  readability_score?: number
  seo_score?: number
  brand_voice_score?: number
  cultural_sensitivity_score?: number
  factual_accuracy_score?: number
  image_quality_score?: number
}

export interface CreateQualityReviewInput extends ReviewScores {
  article_id: string
  action: QCAction
  notes?: string
}

export class QualityReviewService {
  async createReview(input: CreateQualityReviewInput) {
    const { data: userData } = await supabase.auth.getUser()
    const reviewer_id = userData.user?.id || null

    const payload = {
      article_id: input.article_id,
      action: input.action,
      notes: input.notes || null,
      reviewer_id,
      overall_score: input.overall_score,
      content_quality: input.content_quality ?? null,
      grammar_score: input.grammar_score ?? null,
      readability_score: input.readability_score ?? null,
      seo_score: input.seo_score ?? null,
      brand_voice_score: input.brand_voice_score ?? null,
      cultural_sensitivity_score: input.cultural_sensitivity_score ?? null,
      factual_accuracy_score: input.factual_accuracy_score ?? null,
      image_quality_score: input.image_quality_score ?? null,
      reviewed_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('quality_reviews').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
}

export const qualityReviewService = new QualityReviewService()
