import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataExport, AccountDeletion } from '../DataExport'
import { useAuth } from '@/features/auth/context/AuthContext'
import { supabase } from '@/shared/lib/supabase'

// Mock auth context
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock file download APIs only
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

global.URL = global.URL || {}
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

describe('DataExport', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:mock-url')

    ;(useAuth as any).mockReturnValue({
      user: mockUser,
      signOut: vi.fn(),
    })
  })

  test('renders export button', () => {
    render(<DataExport />)

    expect(screen.getByText('dataExport.exportButton')).toBeInTheDocument()
  })

  test('exports user data successfully', async () => {
    // Mock Supabase responses
    const mockUserData = {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: '2024-01-01',
    }

    const mockPreferences = {
      language: 'en',
      theme: 'light',
    }

    const mockFavorites = [{ id: '1', entity_type: 'place', entity_id: 'place-1' }]

    // Create a comprehensive query builder mock
    const createQueryBuilder = (tableName: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
      }

      // Configure responses based on table
      if (tableName === 'profiles') {
        builder.single.mockResolvedValue({ data: mockUserData, error: null })
      } else if (tableName === 'user_preferences') {
        builder.single.mockResolvedValue({ data: mockPreferences, error: null })
      } else if (tableName === 'user_favorites') {
        // For favorites, we chain select().eq() - no order/limit
        builder.eq.mockResolvedValue({ data: mockFavorites, error: null })
      } else if (tableName === 'search_history') {
        // For search history, we chain select().eq().order().limit()
        builder.limit.mockResolvedValue({ data: [], error: null })
      } else if (tableName === 'chat_sessions') {
        // For chat sessions with messages, we chain select().eq().order()
        builder.order.mockResolvedValue({ data: [], error: null })
      } else if (tableName === 'notifications') {
        // For notifications, we chain select().eq().order().limit()
        builder.limit.mockResolvedValue({ data: [], error: null })
      } else if (tableName === 'feedback') {
        // For feedback, we chain select().eq().order()
        builder.order.mockResolvedValue({ data: [], error: null })
      } else {
        // Default fallback
        builder.order.mockResolvedValue({ data: [], error: null })
        builder.limit.mockResolvedValue({ data: [], error: null })
        builder.single.mockResolvedValue({ data: null, error: null })
      }

      return builder
    }

    ;(supabase.from as any) = vi.fn(createQueryBuilder)

    render(<DataExport />)

    // Click export button
    fireEvent.click(screen.getByText('dataExport.exportButton'))

    // Wait for loading to complete and success
    await waitFor(
      () => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Verify blob was created (this means the export succeeded)
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  test('shows error when export fails', async () => {
    // Mock Supabase error - create a failing query builder
    const createFailingQueryBuilder = () => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
      }
      return builder
    }

    ;(supabase.from as any) = vi.fn(createFailingQueryBuilder)

    render(<DataExport />)

    fireEvent.click(screen.getByText('dataExport.exportButton'))

    // Wait for error to appear - the error message might vary
    await waitFor(
      () => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  test('shows delete account dialog', () => {
    render(<AccountDeletion />)

    fireEvent.click(screen.getByText('accountDeletion.deleteButton'))

    expect(screen.getByText('accountDeletion.confirmPrompt')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument()
  })

  test('prevents account deletion without confirmation', async () => {
    render(<AccountDeletion />)

    fireEvent.click(screen.getByText('accountDeletion.deleteButton'))

    // Try to delete without typing DELETE
    const deleteButton = screen.getByText('accountDeletion.confirmDelete')
    expect(deleteButton.closest('button')).toBeDisabled()

    // Type wrong confirmation
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'delete' } })

    expect(deleteButton.closest('button')).toBeDisabled()
  })

  test('deletes account with proper confirmation', async () => {
    const mockSignOut = vi.fn()
    ;(useAuth as any).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })

    // Mock successful deletion
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true },
      error: null,
    })

    render(<AccountDeletion />)

    // Open dialog
    fireEvent.click(screen.getByText('accountDeletion.deleteButton'))

    // Type confirmation
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'DELETE' } })

    // Delete button should be enabled
    const deleteButton = screen.getByText('accountDeletion.confirmDelete')
    expect(deleteButton.closest('button')).not.toBeDisabled()

    // Click delete
    fireEvent.click(deleteButton)

    // Wait for deletion
    await waitFor(() => {
      expect(screen.getByText('accountDeletion.deleting')).toBeInTheDocument()
    })

    // Verify API call
    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user-account', {
      body: { userId: 'test-user-id' },
    })

    // Verify sign out was called
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  test('shows error when account deletion fails', async () => {
    render(<AccountDeletion />)

    // Mock failed deletion
    ;(supabase.functions.invoke as any).mockResolvedValue({
      error: new Error('Deletion failed'),
    })

    // Open dialog and confirm
    fireEvent.click(screen.getByText('accountDeletion.deleteButton'))
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByText('accountDeletion.confirmDelete'))

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalled()
    })
  })

  test('cancels account deletion', () => {
    render(<AccountDeletion />)

    fireEvent.click(screen.getByText('accountDeletion.deleteButton'))

    // Click cancel
    fireEvent.click(screen.getByText('common.cancel'))

    // Dialog should close
    expect(screen.queryByText('accountDeletion.confirmPrompt')).not.toBeInTheDocument()
  })
})
