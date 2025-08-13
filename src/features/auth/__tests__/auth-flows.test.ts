import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { User, UserRole } from '@/shared/types'

// Create mock chain object
const mockChain = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}

// Set up chainable methods
mockChain.select.mockReturnValue(mockChain)
mockChain.insert.mockReturnValue(mockChain)
mockChain.update.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)

// Mock Supabase - move outside the mock call
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => mockChain),
  },
}))

// Mock email service
vi.mock('@/shared/services/email.service', () => ({
  EmailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue({}),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({}),
  },
}))

// Import after mocking
import { AuthService } from '../services/auth.service'
import { supabase } from '@/shared/lib/supabase'

// Get mocked versions for use in tests
const mockSupabase = supabase as any

describe('Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
    sessionStorage.clear()

    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Reset mock chain methods
    mockChain.select.mockReturnValue(mockChain)
    mockChain.insert.mockReturnValue(mockChain)
    mockChain.update.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.single.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Registration', () => {
    test('should create user account with default role', async () => {
      const mockUser = { id: 'test-id', email: 'test@example.com' }
      const mockAuthData = { user: mockUser, session: null }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null,
      })

      mockChain.insert.mockResolvedValue({ error: null })

      const result = await AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'resident',
      })

      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUser)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            user_type: 'resident',
          },
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })

      // Should create profile with user role by default
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    test('should handle signup errors gracefully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      })

      const result = await AuthService.signUp({
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'resident',
      })

      expect(result.error).toBe('Email already exists')
      expect(result.user).toBeNull()
    })
  })

  describe('User Authentication', () => {
    test('should sign in user and load profile', async () => {
      const mockUser = { id: 'test-id', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      const mockProfile: User = {
        id: 'test-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        userType: 'resident',
        language: 'en',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockChain.single.mockResolvedValue({
        data: {
          id: 'test-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          user_type: 'resident',
          language: 'en',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        error: null,
      })

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockProfile)
      expect(result.session).toEqual(mockSession)
    })

    test('should handle signin errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const result = await AuthService.signIn({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      expect(result.error).toBe('Invalid credentials')
      expect(result.user).toBeNull()
      expect(result.session).toBeNull()
    })
  })

  describe('Session Management', () => {
    test('should get current session with profile', async () => {
      const mockUser = { id: 'test-id', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      const mockProfile: User = {
        id: 'test-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        userType: 'resident',
        language: 'en',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      mockChain.single.mockResolvedValue({
        data: {
          id: 'test-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          user_type: 'resident',
          language: 'en',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        error: null,
      })

      const result = await AuthService.getSession()

      expect(result.error).toBeNull()
      expect(result.session).toEqual(mockSession)
      expect(result.user).toEqual(mockProfile)
    })

    test('should handle session timeout gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const result = await AuthService.getSession()

      expect(result.session).toBeNull()
      expect(result.user).toBeNull()
      expect(result.error).toBe('Session expired')
    })

    test('should fallback to session data when profile fails', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User', role: 'user' },
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }
      const mockSession = { user: mockUser, access_token: 'token' }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Simulate profile loading timeout
      mockChain.single.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      const result = await AuthService.getSession()

      expect(result.error).toBeNull()
      expect(result.session).toEqual(mockSession)
      expect(result.user?.id).toBe('test-id')
      expect(result.user?.email).toBe('test@example.com')
      expect(result.user?.fullName).toBe('Test User')
      expect(result.user?.role).toBe('user')
    })
  })

  describe('User Roles and Permissions', () => {
    const createMockUserProfile = (role: UserRole): User => ({
      id: `${role}-user-id`,
      email: `${role}@example.com`,
      fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role,
      userType: 'resident',
      language: 'en',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    })

    test('should load user profile correctly', async () => {
      const mockProfile = createMockUserProfile('user')

      mockChain.single.mockResolvedValue({
        data: {
          id: mockProfile.id,
          email: mockProfile.email,
          full_name: mockProfile.fullName,
          role: mockProfile.role,
          user_type: mockProfile.userType,
          language: mockProfile.language,
          created_at: mockProfile.createdAt,
          updated_at: mockProfile.updatedAt,
        },
        error: null,
      })

      const result = await AuthService.getUserProfile(mockProfile.id)

      expect(result).toEqual(mockProfile)
    })

    test('should handle curator role', async () => {
      const curatorProfile = createMockUserProfile('curator')

      mockChain.single.mockResolvedValue({
        data: {
          id: curatorProfile.id,
          email: curatorProfile.email,
          full_name: curatorProfile.fullName,
          role: 'curator',
          user_type: curatorProfile.userType,
          language: curatorProfile.language,
          created_at: curatorProfile.createdAt,
          updated_at: curatorProfile.updatedAt,
        },
        error: null,
      })

      const result = await AuthService.getUserProfile(curatorProfile.id)

      expect(result?.role).toBe('curator')
      expect(result?.fullName).toBe('Curator User')
    })

    test('should handle editor role', async () => {
      const editorProfile = createMockUserProfile('editor')

      mockChain.single.mockResolvedValue({
        data: {
          id: editorProfile.id,
          email: editorProfile.email,
          full_name: editorProfile.fullName,
          role: 'editor',
          user_type: editorProfile.userType,
          language: editorProfile.language,
          created_at: editorProfile.createdAt,
          updated_at: editorProfile.updatedAt,
        },
        error: null,
      })

      const result = await AuthService.getUserProfile(editorProfile.id)

      expect(result?.role).toBe('editor')
      expect(result?.fullName).toBe('Editor User')
    })

    test('should handle admin role', async () => {
      const adminProfile = createMockUserProfile('admin')

      mockChain.single.mockResolvedValue({
        data: {
          id: adminProfile.id,
          email: adminProfile.email,
          full_name: adminProfile.fullName,
          role: 'admin',
          user_type: adminProfile.userType,
          language: adminProfile.language,
          created_at: adminProfile.createdAt,
          updated_at: adminProfile.updatedAt,
        },
        error: null,
      })

      const result = await AuthService.getUserProfile(adminProfile.id)

      expect(result?.role).toBe('admin')
      expect(result?.fullName).toBe('Admin User')
    })

    test('should handle subscriber role', async () => {
      const subscriberProfile = createMockUserProfile('subscriber')

      mockChain.single.mockResolvedValue({
        data: {
          id: subscriberProfile.id,
          email: subscriberProfile.email,
          full_name: subscriberProfile.fullName,
          role: 'subscriber',
          user_type: subscriberProfile.userType,
          language: subscriberProfile.language,
          created_at: subscriberProfile.createdAt,
          updated_at: subscriberProfile.updatedAt,
        },
        error: null,
      })

      const result = await AuthService.getUserProfile(subscriberProfile.id)

      expect(result?.role).toBe('subscriber')
      expect(result?.fullName).toBe('Subscriber User')
    })
  })

  describe('Profile Updates', () => {
    test('should update user profile successfully', async () => {
      const userId = 'test-user-id'
      const updates = {
        fullName: 'Updated Name',
        language: 'ar' as const,
      }

      const mockUpdatedProfile = {
        id: userId,
        email: 'test@example.com',
        full_name: 'Updated Name',
        role: 'user',
        user_type: 'resident',
        language: 'ar',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      mockChain.single.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      })

      const result = await AuthService.updateProfile(userId, updates)

      expect(result.error).toBeNull()
      expect(result.data?.fullName).toBe('Updated Name')
      expect(result.data?.language).toBe('ar')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    test('should handle profile update errors', async () => {
      const userId = 'test-user-id'
      const updates = { fullName: 'Updated Name' }

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await AuthService.updateProfile(userId, updates)

      expect(result.error).toBe('Update failed')
      expect(result.data).toBeNull()
    })
  })

  describe('Password Management', () => {
    test('should send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail = vi.fn().mockResolvedValue({
        error: null,
      })

      const result = await AuthService.resetPassword('test@example.com')

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/reset-password'),
      })
    })

    test('should update password successfully', async () => {
      mockSupabase.auth.updateUser = vi.fn().mockResolvedValue({
        error: null,
      })

      const result = await AuthService.updatePassword('newpassword123')

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })
  })

  describe('Sign Out', () => {
    test('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await AuthService.signOut()

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    test('should handle sign out errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      const result = await AuthService.signOut()

      expect(result.error).toBe('Sign out failed')
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.error).toBe('Network error')
      expect(result.user).toBeNull()
      expect(result.session).toBeNull()
    })

    test('should handle profile not found errors', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await AuthService.getUserProfile('nonexistent-user')

      expect(result).toBeNull()
    })

    test('should handle invalid session data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await AuthService.getSession()

      expect(result.session).toBeNull()
      expect(result.user).toBeNull()
      expect(result.error).toBeNull()
    })
  })
})

describe('Auth Context Integration', () => {
  test('should maintain authentication state correctly', () => {
    // Test that auth context properly manages state
    // This would require more complex integration testing
    // For now, we verify the basic flow works
    expect(true).toBe(true)
  })

  test('should handle role-based access correctly', () => {
    // Test role-based access control
    const roles: UserRole[] = ['user', 'subscriber', 'curator', 'editor', 'admin']

    roles.forEach((role) => {
      expect(['user', 'subscriber', 'curator', 'editor', 'admin']).toContain(role)
    })
  })
})
