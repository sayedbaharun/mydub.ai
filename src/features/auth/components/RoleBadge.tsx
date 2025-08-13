/**
 * Role Badge Component
 * Displays user role in a visually appealing badge
 */

import React from 'react'
import { UserRole, roleDisplayNames, getRoleBadgeColor } from '@/shared/lib/auth/roles'
import { cn } from '@/shared/lib/utils'
import { Shield, Star, Edit, Users, Crown } from 'lucide-react'

interface RoleBadgeProps {
  role: UserRole
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  [UserRole.USER]: <Users className="h-3 w-3" />,
  [UserRole.SUBSCRIBER]: <Star className="h-3 w-3" />,
  [UserRole.CURATOR]: <Edit className="h-3 w-3" />,
  [UserRole.EDITOR]: <Shield className="h-3 w-3" />,
  [UserRole.ADMIN]: <Crown className="h-3 w-3" />,
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
}

export function RoleBadge({ 
  role, 
  showIcon = true, 
  size = 'md',
  className 
}: RoleBadgeProps) {
  const colorClass = getRoleBadgeColor(role)
  const sizeClass = sizeClasses[size]
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        colorClass,
        sizeClass,
        className
      )}
    >
      {showIcon && roleIcons[role]}
      {roleDisplayNames[role]}
    </span>
  )
}

interface UserRoleDisplayProps {
  userId?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

/**
 * Component that fetches and displays a user's role
 */
export function UserRoleDisplay({
  userId,
  size = 'md',
  showIcon = true,
  className
}: UserRoleDisplayProps) {
  const [role, setRole] = React.useState<UserRole>(UserRole.USER)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    if (userId) {
      // Import dynamically to avoid circular dependency
      import('@/shared/lib/auth/roles').then(({ getUserRole }) => {
        getUserRole(userId).then(userRole => {
          setRole(userRole)
          setLoading(false)
        })
      })
    } else {
      setLoading(false)
    }
  }, [userId])
  
  if (loading) {
    return (
      <span className={cn(
        'inline-flex items-center font-medium rounded-full animate-pulse',
        'bg-gray-200',
        sizeClasses[size]
      )}>
        <span className="invisible">Loading</span>
      </span>
    )
  }
  
  return (
    <RoleBadge 
      role={role} 
      size={size} 
      showIcon={showIcon}
      className={className}
    />
  )
}

/**
 * List of all roles with descriptions
 */
export function RolesList() {
  const roles = Object.values(UserRole)
  
  return (
    <div className="space-y-2">
      {roles.map(role => (
        <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <RoleBadge role={role} />
            <span className="text-sm text-muted-foreground">
              {getRoleDescription(role)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.USER]: 'Basic access to view public content',
    [UserRole.SUBSCRIBER]: 'Premium features and extended access',
    [UserRole.CURATOR]: 'Can create and manage content',
    [UserRole.EDITOR]: 'Can edit all content and moderate',
    [UserRole.ADMIN]: 'Full system access and user management',
  }
  return descriptions[role]
}