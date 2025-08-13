import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface BreadcrumbProps {
  className?: string
}

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/today': 'Today in Dubai',
  '/eat-drink': 'Eat & Drink',
  '/events': 'Events & Experiences',
  '/beach-nightlife': 'Beach & Nightlife',
  '/living': 'Living in Dubai',
  '/luxury': 'Luxury Life',
  '/real-estate': 'Real Estate Watch',
  '/reels': 'Dubai in Reels',
  '/chat': 'Ayyan X',
  '/subscribe': 'Subscribe',
  '/news': 'News',
  '/tourism': 'Tourism',
  '/government': 'Government',
  '/practical': 'Practical Info',
  '/search': 'Search Results',
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/settings': 'Settings'
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)
  
  if (pathSegments.length === 0) {
    return null // Don't show breadcrumb on home page
  }

  const breadcrumbs = [
    { path: '/', label: 'Home' },
    ...pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      return {
        path,
        label: routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
      }
    })
  ]

  return (
    <nav className={cn(
      'flex items-center gap-2 text-sm text-gray-600 mb-6 px-6 py-3 bg-white/50 backdrop-blur rounded-lg border border-gray-200/50',
      className
    )}>
      <Home className="h-4 w-4" />
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-midnight-black">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-600 hover:text-ai-blue transition-colors duration-200 hover:underline"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
} 