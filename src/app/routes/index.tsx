import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { AdminRoute } from '@/shared/components/AdminRoute'

// Direct imports to avoid lazy loading issues during build
import HomePage from '../../pages/HomePage'
import { NewsPage } from '../../features/news/pages/NewsPage'
import { NewsDetailPage } from '../../features/news/pages/NewsDetailPage'
import { TourismPage } from '../../features/tourism/pages/TourismPage'
import { TourismDetailPage } from '../../features/tourism/pages/TourismDetailPage'
import { GovernmentPage } from '../../features/government/pages/GovernmentPage'
import { GovernmentDetailPage } from '../../features/government/pages/GovernmentDetailPage'
import { PracticalPage } from '../../features/practical/pages/PracticalPage'
import { ChatbotPage } from '../../features/chatbot/pages/ChatbotPage'
import { SearchPage } from '../../features/search/pages/SearchPage'
import ProfilePage from '../../pages/user/ProfilePage'
import SettingsPage from '../../pages/user/SettingsPage'
import SignInPage from '../../pages/auth/SignInPage'
import SignUpPage from '../../pages/auth/SignUpPage'
import OnboardingPage from '../../pages/auth/OnboardingPage'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import LuxuryLifePage from '../../pages/LuxuryLifePage'
// import { EditorialDashboard } from '../../features/editorial' // Disabled - tables not in production

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route id="signin" path="/signin" element={<SignInPage />} />
      <Route id="signup" path="/signup" element={<SignUpPage />} />
      
      {/* Protected routes */}
      <Route id="protected" element={<ProtectedRoute />}>
        <Route id="onboarding" path="/onboarding" element={<OnboardingPage />} />
        
        <Route id="main-layout" element={<MainLayout />}>
          <Route id="home" path="/" element={<HomePage />} />
          <Route id="government" path="/government" element={<GovernmentPage />} />
          <Route id="government-detail" path="/government/:id" element={<GovernmentDetailPage />} />
          <Route id="news" path="/news" element={<NewsPage />} />
          <Route id="news-detail" path="/news/:id" element={<NewsDetailPage />} />
          <Route id="tourism" path="/tourism" element={<TourismPage />} />
          <Route id="tourism-detail" path="/tourism/:id" element={<TourismDetailPage />} />
          <Route id="luxurylife" path="/luxurylife" element={<LuxuryLifePage />} />
          <Route id="practical" path="/practical-info" element={<PracticalPage />} />
          <Route id="chatbot" path="/chatbot" element={<ChatbotPage />} />
          <Route id="chat" path="/chat" element={<ChatbotPage />} />
          <Route id="search" path="/search" element={<SearchPage />} />
          <Route id="profile" path="/profile" element={<ProfilePage />} />
          <Route id="settings" path="/settings" element={<SettingsPage />} />
          
          {/* Admin Dashboard Routes */}
          <Route id="admin" path="/admin/*" element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          } />
          
          {/* Editorial Dashboard Routes - Disabled (tables not in production) */}
          {/* <Route id="editorial" path="/editorial" element={
            <AdminRoute>
              <EditorialDashboard />
            </AdminRoute>
          } /> */}
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route id="fallback" path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Export empty preload function for now
export function preloadCriticalRoutes() {
  // Routes are directly imported, no preloading needed
}