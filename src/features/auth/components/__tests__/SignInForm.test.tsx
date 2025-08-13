import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { SignInForm } from '../SignInForm'
import { AuthService } from '../../services/auth.service'

// Mock the auth service
vi.mock('../../services/auth.service')

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/auth/signin' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock useToast
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Get the mock from the global setup
const mockSignIn = vi.fn()

// Override the AuthContext mock for this test
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: mockSignIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('SignInForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSignIn.mockClear()
  })

  it('renders sign in form with all fields', () => {
    render(<SignInForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<SignInForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    // Wait for navigation after form submission
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      },
      { timeout: 1000 }
    )
  })

  it('displays error message on sign in failure', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables form while submitting', async () => {
    mockSignIn.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })

  it('navigates to sign up page when clicking sign up link', async () => {
    render(<SignInForm />)

    const signUpLink = screen.getByText(/sign up/i)
    await user.click(signUpLink)

    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  it('navigates to forgot password page when clicking forgot password', async () => {
    render(<SignInForm />)

    const forgotPasswordLink = screen.getByText(/forgot password/i)
    await user.click(forgotPasswordLink)

    expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-password')
  })
})
