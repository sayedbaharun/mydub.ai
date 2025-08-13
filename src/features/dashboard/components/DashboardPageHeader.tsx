import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, Home } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface DashboardPageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  showBackToDashboard?: boolean
  showBackToHome?: boolean
  actions?: React.ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  description,
  icon: Icon,
  showBackToDashboard = true,
  showBackToHome = false,
  actions,
  className
}: DashboardPageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={cn("border-b border-gray-100 bg-white", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          {showBackToDashboard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          )}
          {showBackToHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Back to Home</span>
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {Icon && (
              <div className="rounded-lg bg-blue-50 p-3 w-fit">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900">{title}</h1>
              {description && (
                <p className="mt-1 text-sm sm:text-lg font-light text-gray-600">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop Back Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {showBackToDashboard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              )}
              {showBackToHome && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              )}
            </div>
            
            {/* Custom Actions */}
            {actions && (
              <div className="flex flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPageHeader