import { supabase } from '@/shared/lib/supabase'

export interface ArabicPhrase {
  id: string
  arabic_text: string
  english_text: string
  pronunciation: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface DailyArabicPhrase {
  id: string
  phrase_id: string
  display_date: string
  created_at: string
  phrase?: ArabicPhrase
}

export class ArabicPhrasesService {
  /**
   * Get the daily Arabic phrase for a specific date
   */
  static async getDailyPhrase(date: Date = new Date()): Promise<ArabicPhrase | null> {
    try {
      const dateStr = date.toISOString().split('T')[0]
      
      // Call the database function to get daily phrase
      const { data, error } = await supabase
        .rpc('get_daily_arabic_phrase', { for_date: dateStr })
        .single()

      if (error) {
        console.error('Error fetching daily phrase:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getDailyPhrase:', error)
      return null
    }
  }

  /**
   * Get all phrases with filtering options
   */
  static async getAllPhrases(options?: {
    category?: string
    difficulty?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ArabicPhrase[]; count: number }> {
    try {
      let query = supabase
        .from('arabic_phrases')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('difficulty', { ascending: true })

      if (options?.category) {
        query = query.eq('category', options.category)
      }

      if (options?.difficulty) {
        query = query.eq('difficulty', options.difficulty)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching Arabic phrases:', error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error in getAllPhrases:', error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('arabic_phrases')
        .select('category')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      // Extract unique categories
      const categories = [...new Set(data?.map(item => item.category) || [])]
      return categories.sort()
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  /**
   * Search phrases by text
   */
  static async searchPhrases(searchTerm: string): Promise<ArabicPhrase[]> {
    try {
      const { data, error } = await supabase
        .from('arabic_phrases')
        .select('*')
        .eq('is_active', true)
        .or(`arabic_text.ilike.%${searchTerm}%,english_text.ilike.%${searchTerm}%,pronunciation.ilike.%${searchTerm}%`)
        .order('category', { ascending: true })

      if (error) {
        console.error('Error searching Arabic phrases:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in searchPhrases:', error)
      return []
    }
  }

  /**
   * Get phrase by ID
   */
  static async getPhraseById(id: string): Promise<ArabicPhrase | null> {
    try {
      const { data, error } = await supabase
        .from('arabic_phrases')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching phrase by ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getPhraseById:', error)
      return null
    }
  }

  /**
   * Admin: Set daily phrase for a specific date
   */
  static async setDailyPhrase(phraseId: string, date: Date): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0]

      const { error } = await supabase
        .from('daily_arabic_phrase')
        .upsert({
          phrase_id: phraseId,
          display_date: dateStr
        }, {
          onConflict: 'display_date'
        })

      if (error) {
        console.error('Error setting daily phrase:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in setDailyPhrase:', error)
      return false
    }
  }

  /**
   * Admin: Add new phrase
   */
  static async addPhrase(phrase: Omit<ArabicPhrase, 'id' | 'created_at' | 'updated_at'>): Promise<ArabicPhrase | null> {
    try {
      const { data, error } = await supabase
        .from('arabic_phrases')
        .insert([phrase])
        .select()
        .single()

      if (error) {
        console.error('Error adding phrase:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addPhrase:', error)
      return null
    }
  }

  /**
   * Admin: Update phrase
   */
  static async updatePhrase(id: string, updates: Partial<ArabicPhrase>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('arabic_phrases')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating phrase:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePhrase:', error)
      return false
    }
  }

  /**
   * Admin: Toggle phrase active status
   */
  static async togglePhraseStatus(id: string): Promise<boolean> {
    try {
      // First get current status
      const { data: phrase, error: fetchError } = await supabase
        .from('arabic_phrases')
        .select('is_active')
        .eq('id', id)
        .single()

      if (fetchError || !phrase) {
        console.error('Error fetching phrase status:', fetchError)
        return false
      }

      // Toggle status
      const { error } = await supabase
        .from('arabic_phrases')
        .update({ is_active: !phrase.is_active })
        .eq('id', id)

      if (error) {
        console.error('Error toggling phrase status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in togglePhraseStatus:', error)
      return false
    }
  }
}