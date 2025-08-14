import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout, AuthLayout } from '@/shared/components/layout/RootLayout'
import { ProtectedRoute, PublicRoute } from '@/shared/components/ProtectedRoute'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { RouteErrorBoundary } from '@/shared/components/RouteErrorBoundary'

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage.tsx'))
const SignInPage = lazy(() => import('@/pages/auth/SignInPage.tsx'))
const SignUpPage = lazy(() => import('@/pages/auth/SignUpPage.tsx'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage.tsx'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage.tsx'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage.tsx'))
const VerifyEmailSentPage = lazy(() => import('@/pages/auth/VerifyEmailSentPage.tsx'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.tsx'))

// Legal pages
const CookiePolicyPage = lazy(() => import('@/features/legal/pages/CookiePolicyPage'))
const DynamicPrivacyPolicyPage = lazy(
  () => import('@/features/legal/pages/DynamicPrivacyPolicyPage')
)
const PrivacyCenterPage = lazy(() => import('@/features/legal/components/PrivacyCenter'))
const ComplianceMonitoringDashboard = lazy(
  () => import('@/features/legal/components/ComplianceMonitoringDashboard')
)

// Admin pages
const AdminComplianceDashboard = lazy(
  () => import('@/features/admin/compliance/ComplianceDashboard')
)

// User pages
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

// AI Reporter pages
const ContentApprovalPage = lazy(
  () => import('@/features/content-approval/pages/ContentApprovalPage')
)
const AIReportersPage = lazy(() => import('@/features/ai-reporters/pages/AIReportersPage'))

// Content Management pages
const ContentManagementPage = lazy(
  () => import('@/features/content-management/pages/ContentManagementPage')
)
const CategoryManagementPage = lazy(
  () => import('@/features/content-management/pages/CategoryManagementPage')
)


// Lazy load feature pages
const GovernmentPage = lazy(() =>
  import('@/features/government/pages/GovernmentPage').then((m) => ({ default: m.GovernmentPage }))
)
const GovernmentDetailPage = lazy(() => import('@/features/government/pages/GovernmentDetailPage'))
const NewsPage = lazy(() => import('@/features/news/pages/NewsPage'))
const NewsDetailPage = lazy(() =>
  import('@/features/news/pages/NewsDetailPage').then((m) => ({ default: m.NewsDetailPage }))
)
const BookmarksPage = lazy(() => import('@/features/bookmarks/pages/BookmarksPage'))
const TourismPage = lazy(() =>
  import('@/features/tourism/pages/TourismPage').then((m) => ({ default: m.TourismPage }))
)
const TourismDetailPage = lazy(() => import('@/features/tourism/pages/TourismDetailPage'))
const PracticalPage = lazy(() =>
  import('@/features/practical/pages/PracticalPage').then((m) => ({ default: m.PracticalPage }))
)
const ChatbotPage = lazy(() =>
  import('@/features/chatbot/pages/ChatbotPage').then((m) => ({ default: m.ChatbotPage }))
)
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const SearchPage = lazy(() =>
  import('@/features/search/pages/SearchPage').then((m) => ({ default: m.SearchPage }))
)
const ContentDetailPage = lazy(() => import('@/pages/ContentDetailPage'))
const AIMayorDemoPage = lazy(() =>
  import('@/features/ai-agents/components/AIMayorDemo').then((m) => ({ default: m.AIMayorDemo }))
)
const WeatherPage = lazy(() => import('@/pages/WeatherPage'))
const TrafficPage = lazy(() => import('@/pages/TrafficPage'))
const EventsPage = lazy(() => import('@/pages/EventsPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))

// New category pages
const EatAndDrinkPage = lazy(() => import('@/pages/EatAndDrinkPage'))
const BeachesPage = lazy(() => import('@/pages/BeachesPage'))
const NightlifePage = lazy(() => import('@/pages/NightlifePage'))
const TodayPage = lazy(() => import('@/pages/TodayPage'))
const LivingPage = lazy(() => 
  import('@/pages/LivingPage').then((m) => ({ default: m.LivingPage }))
)
const RealEstatePage = lazy(() => 
  import('@/pages/RealEstatePage').then((m) => ({ default: m.RealEstatePage }))
)
// Removed - page doesn't exist
// const BeachNightlifePage = lazy(() => 
//   import('@/pages/BeachNightlifePage').then((m) => ({ default: m.BeachNightlifePage }))
// )

// Loading component for lazy loaded routes
const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

// Wrap component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<RouteLoader />}>
    <Component />
  </Suspense>
)


export const router = createBrowserRouter([
  {
    id: 'root',
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        id: 'home',
        index: true,
        element: withSuspense(HomePage),
      },
      {
        id: 'today',
        path: 'today',
        element: withSuspense(TodayPage),
      },
      {
        id: 'eatanddrink',
        path: 'eatanddrink',
        element: withSuspense(EatAndDrinkPage),
      },
      {
        id: 'beaches',
        path: 'beaches',
        element: withSuspense(BeachesPage),
      },
      {
        id: 'nightlife',
        path: 'nightlife',
        element: withSuspense(NightlifePage),
      },
      {
        id: 'reels-redirect',
        path: 'reels',
        element: <Navigate to="/dubaireels" replace />,
      },
      {
        id: 'subscribe-redirect',
        path: 'subscribe',
        element: <Navigate to="/help" replace />,
      },
      {
        id: 'news',
        path: 'news',
        element: withSuspense(NewsPage),
      },
      {
        id: 'news-detail',
        path: 'news/:id',
        element: withSuspense(NewsDetailPage),
      },
      {
        id: 'tourism',
        path: 'tourism',
        element: withSuspense(TourismPage),
      },
      {
        id: 'tourism-detail',
        path: 'tourism/:id',
        element: withSuspense(TourismDetailPage),
      },
      {
        id: 'government',
        path: 'government',
        element: withSuspense(GovernmentPage),
      },
      {
        id: 'government-detail',
        path: 'government/:id',
        element: withSuspense(GovernmentDetailPage),
      },
      {
        id: 'content-detail',
        path: 'content/:id',
        element: withSuspense(ContentDetailPage),
      },
      {
        id: 'chat',
        path: 'chat',
        element: withSuspense(ChatbotPage),
      },
      // Removed - ayyan page
      {
        id: 'search',
        path: 'search',
        element: withSuspense(SearchPage),
      },
      {
        id: 'events',
        path: 'events',
        element: withSuspense(EventsPage),
      },
      {
        id: 'practical',
        path: 'practical',
        element: withSuspense(PracticalPage),
      },
      {
        id: 'traffic',
        path: 'traffic',
        element: withSuspense(TrafficPage),
      },
      {
        id: 'weather',
        path: 'weather',
        element: withSuspense(WeatherPage),
      },
      {
        id: 'profile',
        path: 'profile',
        element: <ProtectedRoute>{withSuspense(ProfilePage)}</ProtectedRoute>,
      },
      {
        id: 'bookmarks',
        path: 'bookmarks',
        element: withSuspense(BookmarksPage),
      },
      {
        id: 'settings',
        path: 'settings',
        element: <ProtectedRoute>{withSuspense(SettingsPage)}</ProtectedRoute>,
      },
      {
        id: 'help',
        path: 'help',
        element: withSuspense(HelpPage),
      },
      {
        id: 'support',
        path: 'support',
        element: withSuspense(SupportPage),
      },
      {
        id: 'about',
        path: 'about',
        element: withSuspense(AboutPage),
      },
      {
        id: 'contact',
        path: 'contact',
        element: withSuspense(ContactPage),
      },
      {
        id: 'faq',
        path: 'faq',
        element: withSuspense(FAQPage),
      },
      // Removed - arabic learning page
      {
        id: 'living',
        path: 'living',
        element: withSuspense(LivingPage),
      },
      {
        id: 'real-estate',
        path: 'real-estate',
        element: withSuspense(RealEstatePage),
      },
      // Removed - page doesn't exist
      {
        id: 'privacy',
        path: 'privacy',
        element: withSuspense(DynamicPrivacyPolicyPage),
      },
      // {
      //   id: 'privacy-static',
      //   path: 'privacy-static',
      //   element: withSuspense(PrivacyPolicyPage),
      // },
      // {
      //   id: 'terms',
      //   path: 'terms',
      //   element: withSuspense(EnhancedTermsOfServicePage),
      // },
      // {
      //   id: 'terms-static',
      //   path: 'terms-static',
      //   element: withSuspense(TermsOfServicePage),
      // },
      {
        id: 'cookies',
        path: 'cookies',
        element: withSuspense(CookiePolicyPage),
      },
      // {
      //   id: 'dpa',
      //   path: 'dpa',
      //   element: withSuspense(DataProcessingAgreementPage),
      // },
      // {
      //   id: 'content-policy',
      //   path: 'legal/content-policy',
      //   element: withSuspense(ContentPolicyPage),
      // },
      // {
      //   id: 'ai-ethics',
      //   path: 'legal/ai-ethics',
      //   element: withSuspense(AIEthicsPage),
      // },
      {
        id: 'privacy-center',
        path: 'user/privacy-center',
        element: <ProtectedRoute>{withSuspense(PrivacyCenterPage)}</ProtectedRoute>,
      },
      {
        id: 'ai-mayor',
        path: 'ai-mayor',
        element: withSuspense(AIMayorDemoPage),
      },
    ],
  },
  {
    id: 'auth',
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        id: 'auth-index',
        index: true,
        element: <Navigate to="/auth/signin" replace />,
      },
      {
        id: 'signin',
        path: 'signin',
        element: <PublicRoute>{withSuspense(SignInPage)}</PublicRoute>,
      },
      {
        id: 'signup',
        path: 'signup',
        element: <PublicRoute>{withSuspense(SignUpPage)}</PublicRoute>,
      },
      {
        id: 'onboarding',
        path: 'onboarding',
        element: <ProtectedRoute>{withSuspense(OnboardingPage)}</ProtectedRoute>,
      },
      {
        id: 'forgot-password',
        path: 'forgot-password',
        element: <PublicRoute>{withSuspense(ForgotPasswordPage)}</PublicRoute>,
      },
      {
        id: 'reset-password',
        path: 'reset-password',
        element: <PublicRoute>{withSuspense(ResetPasswordPage)}</PublicRoute>,
      },
      {
        id: 'verify-email-sent',
        path: 'verify-email-sent',
        element: <PublicRoute>{withSuspense(VerifyEmailSentPage)}</PublicRoute>,
      },
    ],
  },
  {
    id: 'dashboard',
    path: '/dashboard',
    element: (
      <ProtectedRoute roles={['user', 'admin']}>
        {withSuspense(DashboardPage)}
      </ProtectedRoute>
    ),
  },
  {
    id: 'dashboard-compliance',
    path: '/dashboard/compliance',
    element: (
      <ProtectedRoute roles={['admin']}>
        {withSuspense(ComplianceMonitoringDashboard)}
      </ProtectedRoute>
    ),
  },
  {
    id: 'admin-compliance',
    path: '/admin/compliance',
    element: (
      <ProtectedRoute roles={['admin']}>{withSuspense(AdminComplianceDashboard)}</ProtectedRoute>
    ),
  },
  {
    id: 'dashboard-content-approval',
    path: '/dashboard/content-approval',
    element: (
      <ProtectedRoute roles={['admin']}>
        {withSuspense(ContentApprovalPage)}
      </ProtectedRoute>
    ),
  },
  {
    id: 'dashboard-ai-reporters',
    path: '/dashboard/ai-reporters',
    element: (
      <ProtectedRoute roles={['admin']}>{withSuspense(AIReportersPage)}</ProtectedRoute>
    ),
  },
  // Editorial route - redirects to dashboard with articles tab
  {
    id: 'editorial-dashboard',
    path: '/editorial',
    element: <Navigate to="/dashboard?tab=articles" replace />,
  },
  // Direct articles routes
  {
    id: 'dashboard-articles',
    path: '/dashboard/articles',
    element: <Navigate to="/dashboard?tab=articles" replace />,
  },
  {
    id: 'dashboard-articles-create',
    path: '/dashboard/articles/create',
    element: <Navigate to="/dashboard?tab=articles&action=create" replace />,
  },
  {
    id: 'dashboard-content-management',
    path: '/dashboard/content-management',
    element: (
      <ProtectedRoute roles={['admin']}>
        {withSuspense(ContentManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    id: 'dashboard-content-management-category',
    path: '/dashboard/content-management/:category',
    element: (
      <ProtectedRoute roles={['admin']}>
        {withSuspense(CategoryManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    id: 'not-found',
    path: '*',
    element: withSuspense(NotFoundPage),
  },
])
