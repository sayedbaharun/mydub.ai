import { supabase } from '@/shared/lib/supabase'

const MAX_RECENT_SEARCHES = 10
const LOCAL_STORAGE_KEY = 'mydub_recent_searches'

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: string
  user_id?: string
  results_count?: number
}

class SearchHistoryService {
  // Get recent searches for the current user
  async getRecentSearches(userId?: string): Promise<string[]> {
    if (userId) {
      // If user is logged in, fetch from database
      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('query')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MAX_RECENT_SEARCHES)

        if (error) throw error
        return data.map(item => item.query)
      } catch (error) {
        console.error('Error fetching search history:', error)
        return this.getLocalSearchHistory()
      }
    } else {
      // If user is not logged in, use local storage
      return this.getLocalSearchHistory()
    }
  }

  // Save a search query
  async saveSearch(query: string, userId?: string, resultsCount?: number): Promise<void> {
    if (!query.trim()) return

    if (userId) {
      // Save to database for logged-in users
      try {
        await supabase
          .from('search_history')
          .upsert({
            user_id: userId,
            query: query.trim(),
            results_count: resultsCount,
            created_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error saving search history:', error)
        this.saveLocalSearch(query)
      }
    } else {
      // Save to local storage for anonymous users
      this.saveLocalSearch(query)
    }
  }

  // Clear search history
  async clearHistory(userId?: string): Promise<void> {
    if (userId) {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', userId)
      } catch (error) {
        console.error('Error clearing search history:', error)
      }
    }
    
    // Always clear local storage as well
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  // Get trending searches
  async getTrendingSearches(): Promise<{ query: string; count: number }[]> {
    try {
      // This would ideally come from a backend service that aggregates search data
      // For now, return static trending searches
      return [
        { query: 'Dubai Mall', count: 15420 },
        { query: 'Burj Khalifa tickets', count: 12350 },
        { query: 'Best restaurants Dubai', count: 10234 },
        { query: 'Dubai Metro', count: 9876 },
        { query: 'Events this weekend', count: 8543 }
      ]
    } catch (error) {
      console.error('Error fetching trending searches:', error)
      return []
    }
  }

  // Get search suggestions based on partial query
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return []

    try {
      // This would ideally use a search index or backend service
      // For now, return suggestions based on common searches
      const commonSearches = [
        'Dubai Mall',
        'Dubai Marina',
        'Dubai Frame',
        'Dubai Airport',
        'Dubai Metro',
        'Dubai Fountain',
        'Dubai Creek',
        'Dubai Parks',
        'Burj Khalifa',
        'Burj Al Arab',
        'Palm Jumeirah',
        'JBR Beach',
        'Global Village',
        'Gold Souk',
        'Miracle Garden',
        'Desert Safari',
        'Best restaurants',
        'Best hotels',
        'Best beaches',
        'Shopping malls',
        'Events today',
        'Events this weekend',
        'Free activities',
        'Family activities',
        'Things to do',
        'Weather forecast',
        'Traffic update',
        'Prayer times',
        'Exchange rates',
        'Emergency numbers'
      ]

      // Filter and sort by relevance
      const filtered = commonSearches
        .filter(search => search.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          const aIndex = a.toLowerCase().indexOf(query.toLowerCase())
          const bIndex = b.toLowerCase().indexOf(query.toLowerCase())
          return aIndex - bIndex
        })
        .slice(0, 8)

      return filtered
    } catch (error) {
      console.error('Error getting search suggestions:', error)
      return []
    }
  }

  // Private methods for local storage
  private getLocalSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveLocalSearch(query: string): void {
    try {
      const searches = this.getLocalSearchHistory()
      const trimmedQuery = query.trim()
      
      // Remove if already exists and add to beginning
      const filtered = searches.filter(s => s.toLowerCase() !== trimmedQuery.toLowerCase())
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving to local storage:', error)
    }
  }

  // Remove a single search from history
  async removeSearch(query: string, userId?: string): Promise<void> {
    if (userId) {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', userId)
          .eq('query', query)
      } catch (error) {
        console.error('Error removing search:', error)
      }
    }

    // Also remove from local storage
    const searches = this.getLocalSearchHistory()
    const updated = searches.filter(s => s !== query)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  }
}

export const searchHistoryService = new SearchHistoryService()
export default searchHistoryService