import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb } from '@/shared/components/Breadcrumb'
import { MainContent } from '@/shared/components/accessibility/SkipLinks'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <MainContent className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb />
          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </MainContent>
      
      <Footer />
    </div>
  )
}

// Alternative layout for auth pages (no header/nav)
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}

// Dashboard layout with same styling as main
export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}