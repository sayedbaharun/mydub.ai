import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Breadcrumb } from '@/shared/components/Breadcrumb'
import { OnboardingModal } from '@/features/onboarding/components/OnboardingModal'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb />
          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
      
      {/* Onboarding Modal */}
      <OnboardingModal />
    </div>
  )
}