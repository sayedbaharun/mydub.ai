/**
 * Role-based access control components
 * Provides UI components for protecting content based on user roles
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { UserRole, Permission, hasRole, hasPermission, hasAnyRole, useRole } from '@/shared/lib/auth/roles'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Shield, Lock } from 'lucide-react'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAll?: boolean // For permissions, require all vs any
  fallback?: React.ReactNode
  redirect?: string
  showError?: boolean
}

/**
 * Component that protects its children based on user role
 */
export function RoleGuard({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
  redirect,
  showError = true,
}: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading, hasPermission: checkPermission, hasAllPermissions, hasAnyPermission } = useRole(user)
  
  const loading = authLoading || roleLoading
  
  // Check access
  const hasAccess = React.useMemo(() => {
    if (!user) return false
    
    // Check single role
    if (requiredRole && !hasRole(role, requiredRole)) {
      return false
    }
    
    // Check multiple roles
    if (requiredRoles && !hasAnyRole(role, requiredRoles)) {
      return false
    }
    
    // Check single permission
    if (requiredPermission && !checkPermission(requiredPermission)) {
      return false
    }
    
    // Check multiple permissions
    if (requiredPermissions) {
      if (requireAll) {
        return hasAllPermissions(requiredPermissions)
      } else {
        return hasAnyPermission(requiredPermissions)
      }
    }
    
    return true
  }, [user, role, requiredRole, requiredRoles, requiredPermission, requiredPermissions, requireAll, checkPermission, hasAllPermissions, hasAnyPermission])
  
  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>
  }
  
  // User not authenticated
  if (!user) {
    if (redirect) {
      return <Navigate to={redirect} replace />
    }
    return (
      <Alert className="m-4">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access this content.
        </AlertDescription>
      </Alert>
    )
  }
  
  // User doesn't have required access
  if (!hasAccess) {
    if (redirect) {
      return <Navigate to={redirect} replace />
    }
    
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (showError) {
      return (
        <Alert className="m-4" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this content.
          </AlertDescription>
        </Alert>
      )
    }
    
    return null
  }
  
  // User has access
  return <>{children}</>
}

/**
 * Conditional render based on role
 */
export function RoleConditional({
  children,
  fallback,
  ...props
}: RoleGuardProps) {
  return (
    <RoleGuard {...props} showError={false} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Show content only to specific roles
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole={UserRole.ADMIN} showError={false}>
      {children}
    </RoleGuard>
  )
}

export function EditorOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole={UserRole.EDITOR} showError={false}>
      {children}
    </RoleGuard>
  )
}

export function StaffOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.CURATOR, UserRole.EDITOR, UserRole.ADMIN]} showError={false}>
      {children}
    </RoleGuard>
  )
}

export function SubscriberOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole={UserRole.SUBSCRIBER} showError={false}>
      {children}
    </RoleGuard>
  )
}

/**
 * Hook for conditional logic based on roles
 */
export function useRoleConditional() {
  const { user } = useAuth()
  const roleUtils = useRole(user)
  
  return {
    showIf: (condition: boolean) => condition ? true : false,
    showIfRole: (requiredRole: UserRole) => roleUtils.hasRole(requiredRole),
    showIfAnyRole: (roles: UserRole[]) => roleUtils.hasAnyRole(roles),
    showIfPermission: (permission: Permission) => roleUtils.hasPermission(permission),
    showIfAdmin: () => roleUtils.role === UserRole.ADMIN,
    showIfEditor: () => roleUtils.role === UserRole.EDITOR,
    showIfStaff: () => roleUtils.isStaff(roleUtils.role),
    showIfSubscriber: () => roleUtils.role === UserRole.SUBSCRIBER,
  }
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * function MyComponent() {
 *   const { showIfAdmin, showIfPermission } = useRoleConditional()
 *   
 *   return (
 *     <div>
 *       {showIfAdmin() && <AdminPanel />}
 *       {showIfPermission(Permission.EDIT_CONTENT) && <EditButton />}
 *       
 *       <RoleGuard requiredRole={UserRole.EDITOR}>
 *         <EditorTools />
 *       </RoleGuard>
 *       
 *       <StaffOnly>
 *         <ModerationQueue />
 *       </StaffOnly>
 *     </div>
 *   )
 * }
 * ```
 */