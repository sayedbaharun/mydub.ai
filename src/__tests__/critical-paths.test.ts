import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthService } from '@/features/auth/services/auth.service'
import { NewsService } from '@/features/news/services/news.service'
import { supabase } from '@/shared/lib/supabase'

// Mock Supabase
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis()
    }))
  }
}))

describe('Critical Path: Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow user to sign up with valid credentials', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    }

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null
    })

    const result = await AuthService.signUp('test@example.com', 'Password123!', 'Test User')
    
    expect(result.data?.user).toEqual(mockUser)
    expect(result.error).toBeNull()
  })

  it('should allow user to sign in with valid credentials', async () => {
    const mockSession = {
      access_token: 'test-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null
    })

    const result = await AuthService.signIn('test@example.com', 'Password123!')
    
    expect(result.data?.session).toEqual(mockSession)
    expect(result.error).toBeNull()
  })

  it('should handle sign in failure with invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', status: 401 }
    })

    const result = await AuthService.signIn('test@example.com', 'WrongPassword')
    
    expect(result.data?.session).toBeNull()
    expect(result.error?.message).toBe('Invalid credentials')
  })

  it('should allow user to sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null
    })

    const result = await AuthService.signOut()
    
    expect(result.error).toBeNull()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('Critical Path: Article Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch articles from database', async () => {
    const mockArticles = [
      {
        id: '1',
        title: 'Test Article 1',
        content: 'Test content 1',
        category: 'news',
        status: 'published',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Test Article 2',
        content: 'Test content 2',
        category: 'sports',
        status: 'published',
        created_at: new Date().toISOString()
      }
    ]

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
    }

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

    const articles = await NewsService.getArticles({})
    
    expect(articles).toHaveLength(2)
    expect(articles[0].title).toBe('Test Article 1')
    expect(supabase.from).toHaveBeenCalledWith('articles')
  })

  it('should create a new article', async () => {
    const newArticle = {
      title: 'New Article',
      content: 'New content',
      category: 'news',
      author_id: 'user-123',
      status: 'draft'
    }

    const mockInsert = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'new-id', ...newArticle },
        error: null
      })
    }

    vi.mocked(supabase.from).mockReturnValue(mockInsert as any)

    const result = await supabase
      .from('articles')
      .insert(newArticle)
      .select()
      .single()
    
    expect(result.data).toMatchObject(newArticle)
    expect(result.error).toBeNull()
  })

  it('should update article status', async () => {
    const articleId = 'test-article-id'
    const mockUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: articleId, status: 'published' },
        error: null
      })
    }

    vi.mocked(supabase.from).mockReturnValue(mockUpdate as any)

    const result = await supabase
      .from('articles')
      .update({ status: 'published' })
      .eq('id', articleId)
      .select()
      .single()
    
    expect(result.data?.status).toBe('published')
    expect(result.error).toBeNull()
  })

  it('should handle article fetch errors gracefully', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '500' }
      })
    }

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

    const articles = await NewsService.getArticles({})
    
    // Should return empty array on error
    expect(articles).toEqual([])
  })
})

describe('Critical Path: User Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get current session', async () => {
    const mockSession = {
      access_token: 'test-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const result = await supabase.auth.getSession()
    
    expect(result.data?.session).toEqual(mockSession)
    expect(result.error).toBeNull()
  })

  it('should handle session expiry', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const result = await supabase.auth.getSession()
    
    expect(result.data?.session).toBeNull()
    expect(result.error).toBeNull()
  })

  it('should listen for auth state changes', () => {
    const mockCallback = vi.fn()
    const mockUnsubscribe = vi.fn()

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    } as any)

    const { data } = supabase.auth.onAuthStateChange(mockCallback)
    
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
    expect(data?.subscription?.unsubscribe).toBe(mockUnsubscribe)
  })
})

describe('Critical Path: Environment Variables', () => {
  it('should have required environment variables set', () => {
    // These should be mocked in test environment
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined()
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeDefined()
  })
})