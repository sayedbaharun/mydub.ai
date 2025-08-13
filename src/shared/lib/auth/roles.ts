/**
 * Role-based access control utilities
 * Simplified to user and admin roles only
 */

import { User } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import React from 'react'

// User roles enum  
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor',
  CURATOR = 'curator',
}

// Role hierarchy (higher index = more permissions)
const roleHierarchy: UserRole[] = [
  UserRole.USER,
  UserRole.CURATOR,
  UserRole.EDITOR,
  UserRole.ADMIN,
]

// Permission types
export enum Permission {
  // Content permissions
  VIEW_CONTENT = 'view_content',
  CREATE_CONTENT = 'create_content',
  EDIT_CONTENT = 'edit_content',
  DELETE_CONTENT = 'delete_content',
  PUBLISH_CONTENT = 'publish_content',
  
  // User management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  CHANGE_ROLES = 'change_roles',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // System
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_LOGS = 'view_logs',
}

// Role permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_CONTENT,
  ],
  
  [UserRole.CURATOR]: [
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.EDITOR]: [
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  
  [UserRole.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],
}

// User profile with role
export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  role: UserRole
  created_at: string
  updated_at: string
}

/**
 * Get user role from profile
 */
export async function getUserRole(userId?: string): Promise<UserRole> {
  if (!userId) return UserRole.USER
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single()
    
    if (error || !data) return UserRole.USER
    
    // Return the role from the database (admin role is managed by database triggers)
    return (data.role as UserRole) || UserRole.USER
  } catch {
    return UserRole.USER
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const userIndex = roleHierarchy.indexOf(userRole)
  const requiredIndex = roleHierarchy.indexOf(requiredRole)
  
  // User has the required role if their role is at the same level or higher
  return userIndex >= requiredIndex
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole | undefined, roles: UserRole[]): boolean {
  if (!userRole) return false
  return roles.some(role => hasRole(userRole, role))
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false
  
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(permission)
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || []
}

/**
 * Role checking utilities
 */
export const roleChecks = {
  isAdmin: (role?: UserRole) => role === UserRole.ADMIN,
  isUser: (role?: UserRole) => role === UserRole.USER,
  isEditor: (role?: UserRole) => role === UserRole.EDITOR,
  isCurator: (role?: UserRole) => role === UserRole.CURATOR,
  
  // Legacy compatibility
  isSubscriber: (role?: UserRole) => role === UserRole.USER,
  
  // Combined checks
  isStaff: (role?: UserRole) => [UserRole.CURATOR, UserRole.EDITOR, UserRole.ADMIN].includes(role as UserRole),
  isModerator: (role?: UserRole) => [UserRole.EDITOR, UserRole.ADMIN].includes(role as UserRole),
  canPublish: (role?: UserRole) => [UserRole.EDITOR, UserRole.ADMIN].includes(role as UserRole),
  canModerate: (role?: UserRole) => [UserRole.EDITOR, UserRole.ADMIN].includes(role as UserRole),
  canApprove: (role?: UserRole) => [UserRole.CURATOR, UserRole.EDITOR, UserRole.ADMIN].includes(role as UserRole),
}

/**
 * React hook for role-based access control
 */
export function useRole(user: User | null) {
  const [role, setRole] = React.useState<UserRole>(UserRole.USER)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    if (user?.id) {
      getUserRole(user.id).then(userRole => {
        setRole(userRole)
        setLoading(false)
      })
    } else {
      setRole(UserRole.USER)
      setLoading(false)
    }
  }, [user?.id])
  
  return {
    role,
    loading,
    hasRole: (requiredRole: UserRole) => hasRole(role, requiredRole),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(role, roles),
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    ...roleChecks,
  }
}

/**
 * Role display names
 */
export const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.USER]: 'User',
  [UserRole.CURATOR]: 'Curator',
  [UserRole.EDITOR]: 'Editor',
  [UserRole.ADMIN]: 'Administrator',
}

/**
 * Role descriptions
 */
export const roleDescriptions: Record<UserRole, string> = {
  [UserRole.USER]: 'Basic access to view public content',
  [UserRole.CURATOR]: 'Can create and curate content, review submissions',
  [UserRole.EDITOR]: 'Can create, edit, approve and publish content',
  [UserRole.ADMIN]: 'Full system access and user management',
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    [UserRole.USER]: 'bg-gray-100 text-gray-800',
    [UserRole.CURATOR]: 'bg-blue-100 text-blue-800',
    [UserRole.EDITOR]: 'bg-green-100 text-green-800',
    [UserRole.ADMIN]: 'bg-red-100 text-red-800',
  }
  return colors[role] || colors[UserRole.USER]
}