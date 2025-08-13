import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  Settings,
  LogOut,
  BarChart3,
  Shield,
  Home,
  FileCheck,
  Bot,
  PenTool,
  DollarSign,
  Eye,
  Server,
  Newspaper,
  Brain,
  ChevronLeft,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/shared/components/ui/sidebar'

import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

// Import dashboard components
import { SimplifiedPersonalizedDashboard } from './SimplifiedPersonalizedDashboard'
import { DashboardOverview } from './DashboardOverview'
import { ContentManagement } from './ContentManagement'
import { UserManagement } from './UserManagement'
import { ActivityLogs } from './ActivityLogs'
import { ContentAnalytics } from './ContentAnalytics'
import { LegalDocumentManager } from '@/features/legal/components/LegalDocumentManager'
import { AIUsageMonitoringDashboard } from './AIUsageMonitoringDashboard'
import { AITransparencyDashboard } from './AITransparencyDashboard'
import { GovernmentServiceMonitor } from '@/shared/components/monitoring/GovernmentServiceMonitor'
import { ArticleManagementDashboard } from './ArticleManagementDashboard'

export function SidebarDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activeSection, setActiveSection] = useState('ai-dashboard')

  // Check permissions based on user role
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@mydub.ai'
  const canViewStats = true // All authenticated users can view stats
  const canManageContent = isAdmin
  const canManageUsers = isAdmin
  const canViewLogs = isAdmin
  const canManageLegal = isAdmin
  const canApproveContent = isAdmin
  const canManageAIReporters = isAdmin
  const canManageAIContent = isAdmin
  const canViewAICosts = isAdmin
  const canViewAITransparency = true // All authenticated users can view transparency
  const canViewServiceMonitoring = isAdmin
  const canManageArticles = isAdmin

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const quickActions = [
    {
      show: canApproveContent,
      label: 'Content Approval',
      icon: FileCheck,
      path: '/dashboard/content-approval',
    },
    {
      show: canManageAIReporters,
      label: 'AI Reporters',
      icon: Bot,
      path: '/dashboard/ai-reporters',
    },
    {
      show: canManageAIContent,
      label: 'AI Content',
      icon: PenTool,
      path: '/dashboard/content-management',
    },
  ].filter(action => action.show)

  const mainMenuItems = [
    { show: true, value: 'ai-dashboard', label: 'AI Dashboard', icon: Brain },
    { show: canViewStats, value: 'overview', label: 'Classic View', icon: LayoutDashboard },
    { show: canManageArticles, value: 'articles', label: 'Articles', icon: Newspaper },
    { show: canManageContent, value: 'content', label: 'Content', icon: FileText },
    { show: canViewStats, value: 'analytics', label: 'Analytics', icon: BarChart3 },
  ].filter(item => item.show)

  const adminMenuItems = [
    { show: canManageUsers, value: 'users', label: 'Users', icon: Users },
    { show: canViewLogs, value: 'activity', label: 'Activity', icon: Activity },
    { show: canManageLegal, value: 'legal', label: 'Legal', icon: Shield },
    { show: canManageAIContent, value: 'ai-content', label: 'AI Content', icon: PenTool },
    { show: canViewAICosts, value: 'ai-usage', label: 'AI Usage', icon: DollarSign },
    { show: canViewServiceMonitoring, value: 'service-monitoring', label: 'Service Monitor', icon: Server },
  ].filter(item => item.show)

  const renderContent = () => {
    switch (activeSection) {
      case 'ai-dashboard':
        return <SimplifiedPersonalizedDashboard />
      case 'overview':
        return <DashboardOverview />
      case 'articles':
        return <ArticleManagementDashboard />
      case 'content':
        return <ContentManagement />
      case 'users':
        return <UserManagement />
      case 'activity':
        return <ActivityLogs />
      case 'analytics':
        return <ContentAnalytics />
      case 'legal':
        return <LegalDocumentManager />
      case 'ai-content':
        return (
          <div className="space-y-6 lg:space-y-8">
            <div className="rounded-xl border border-gray-100 bg-white p-6 lg:p-8 shadow-sm">
              <div className="space-y-4 lg:space-y-6 text-center">
                <div className="mx-auto flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-blue-50">
                  <PenTool className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl lg:text-2xl font-light tracking-tight text-gray-900">
                    AI Content Creator System
                  </h3>
                  <p className="mx-auto max-w-2xl text-sm lg:text-lg font-light text-gray-600">
                    Manage AI-powered content creation across all categories. Monitor sources,
                    review drafts, and publish content for Dining, Experiences, Nightlife,
                    Luxury, and Practical categories.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4 pt-4">
                  <Button
                    onClick={() => navigate('/dashboard/content-management')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Manage Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/ai-reporters')}
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    Configure AI Reporters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'ai-usage':
        return <AIUsageMonitoringDashboard />
      case 'ai-transparency':
        return <AITransparencyDashboard />
      case 'service-monitoring':
        return <GovernmentServiceMonitor />
      default:
        return <PersonalizedDashboard />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar_url} alt={user?.fullName || user?.email} />
                      <AvatarFallback className="rounded-lg">
                        {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.fullName || 'User'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar_url} alt={user?.fullName || user?.email} />
                        <AvatarFallback className="rounded-lg">
                          {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.fullName || 'User'}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.value)}
                      isActive={activeSection === item.value}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {canViewAITransparency && (
            <SidebarGroup>
              <SidebarGroupLabel>AI & Transparency</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection('ai-transparency')}
                      isActive={activeSection === 'ai-transparency'}
                      tooltip="AI Transparency"
                    >
                      <Eye className="h-4 w-4" />
                      <span>AI Transparency</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {adminMenuItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.value)}
                        isActive={activeSection === item.value}
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {quickActions.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {quickActions.map((action) => (
                    <SidebarMenuItem key={action.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(action.path)}
                        tooltip={action.label}
                      >
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate('/')}>
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {mainMenuItems.find(item => item.value === activeSection)?.label || 
               adminMenuItems.find(item => item.value === activeSection)?.label || 
               'AI Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.fullName || user?.email}
            </p>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SidebarDashboard