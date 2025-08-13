import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

interface AdminRouteProps {
  children: ReactNode
  requiredRole?: 'curator' | 'editor' | 'admin'
}

export function AdminRoute({ children, requiredRole = 'curator' }: AdminRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Check if user has required role
  const roleHierarchy = {
    curator: 1,
    editor: 2,
    admin: 3
  }

  const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole]

  if (userRoleLevel < requiredRoleLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light text-gray-900">Access Restricted</h1>
            <p className="text-gray-600 font-light">
              You don't have the required permissions to access this area. 
              Please contact an administrator if you believe this is an error.
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 text-sm font-light text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}