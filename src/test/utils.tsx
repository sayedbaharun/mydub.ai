import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { MonitoringProvider } from '@/app/providers/MonitoringProvider'
import { Toaster } from '@/shared/components/ui/toaster'

// Create a custom render function that includes all providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const testQueryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <I18nProvider>
        <BrowserRouter>
          <MonitoringProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </MonitoringProvider>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  fullName: 'Test User',
  userType: 'resident' as const,
  role: 'user' as const,
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockNewsArticle = (overrides = {}) => ({
  id: 'test-article-id',
  title: 'Test Article',
  titleAr: 'مقال اختبار',
  summary: 'This is a test article summary',
  summaryAr: 'هذا ملخص مقال اختبار',
  content: 'This is the full content of the test article',
  contentAr: 'هذا هو المحتوى الكامل لمقال الاختبار',
  source: {
    id: 'test-source',
    name: 'Test News',
    nameAr: 'أخبار الاختبار',
    logo: '/test-logo.png',
    website: 'https://test.com',
    credibility: 5,
  },
  category: 'general' as const,
  author: 'Test Author',
  publishedAt: new Date().toISOString(),
  imageUrl: '/test-image.jpg',
  tags: ['test', 'article'],
  viewCount: 100,
  readTime: 5,
  sentiment: 'neutral' as const,
  ...overrides,
})

export const createMockGovernmentService = (overrides = {}) => ({
  id: 'test-service-id',
  title: 'Test Service',
  titleAr: 'خدمة اختبار',
  description: 'This is a test government service',
  descriptionAr: 'هذه خدمة حكومية اختبارية',
  department: 'Test Department',
  departmentAr: 'قسم الاختبار',
  category: 'documents' as const,
  url: 'https://test.gov.ae',
  requirements: ['ID', 'Application Form'],
  requirementsAr: ['الهوية', 'نموذج الطلب'],
  fees: 100,
  processingTime: '3-5 days',
  processingTimeAr: '3-5 أيام',
  ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => data,
      })
    }, delay)
  })
}

// Wait for async updates
export const waitForLoadingToFinish = () =>
  waitFor(
    () => {
      const loaders = [...screen.queryAllByTestId(/loading/i), ...screen.queryAllByText(/loading/i)]
      loaders.forEach((loader) => {
        expect(loader).not.toBeInTheDocument()
      })
    },
    { timeout: 3000 }
  )

// Custom matchers
export const expectToBeAccessible = async (container: HTMLElement) => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Import additional testing utilities
import { screen, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { expect } from 'vitest'

expect.extend(toHaveNoViolations)
