import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  Menu,
  X,
  ChevronLeft,
  Brain,
  Sidebar,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { DashboardOverview } from '../components/DashboardOverview'
import { SimplifiedPersonalizedDashboard } from '../components/SimplifiedPersonalizedDashboard'
import { SidebarDashboard } from '../components/SidebarDashboard'
import { ContentManagement } from '../components/ContentManagement'
import { UserManagement } from '../components/UserManagement'
import { ActivityLogs } from '../components/ActivityLogs'
import { ContentAnalytics } from '../components/ContentAnalytics'
import { LegalDocumentManager } from '@/features/legal/components/LegalDocumentManager'
import { AIUsageMonitoringDashboard } from '../components/AIUsageMonitoringDashboard'
import { AITransparencyDashboard } from '../components/AITransparencyDashboard'
import { GovernmentServiceMonitor } from '@/shared/components/monitoring/GovernmentServiceMonitor'
import { ArticleManagementDashboard } from '../components/ArticleManagementDashboard'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Check if user prefers sidebar layout
  const layoutFromUrl = searchParams.get('layout')
  const storedLayout = typeof window !== 'undefined' ? localStorage.getItem('dashboard-layout') : null
  const [useSidebarLayout, setUseSidebarLayout] = useState(
    layoutFromUrl
      ? (layoutFromUrl === 'sidebar' || layoutFromUrl === 'side')
      : storedLayout
        ? storedLayout === 'sidebar'
        : true // Default to sidebar layout
  )
  
  const [activeTab, setActiveTab] = useState('ai-dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleLayout = () => {
    const newLayout = !useSidebarLayout
    setUseSidebarLayout(newLayout)
    localStorage.setItem('dashboard-layout', newLayout ? 'sidebar' : 'tabs')
    
    // Update URL to reflect layout choice
    const newSearchParams = new URLSearchParams(searchParams)
    if (newLayout) {
      newSearchParams.set('layout', 'sidebar')
    } else {
      newSearchParams.delete('layout')
    }
    setSearchParams(newSearchParams)
  }

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

  const tabItems = [
    { show: true, value: 'ai-dashboard', label: 'AI Dashboard', icon: Brain },
    { show: canViewStats, value: 'overview', label: 'Classic View', icon: LayoutDashboard },
    { show: canManageArticles, value: 'articles', label: 'Articles', icon: Newspaper },
    { show: canManageContent, value: 'content', label: 'Content', icon: FileText },
    { show: canManageUsers, value: 'users', label: 'Users', icon: Users },
    { show: canViewLogs, value: 'activity', label: 'Activity', icon: Activity },
    { show: canViewStats, value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { show: canManageLegal, value: 'legal', label: 'Legal', icon: Shield },
    { show: canManageAIContent, value: 'ai-content', label: 'AI Content', icon: PenTool },
    { show: canViewAICosts, value: 'ai-usage', label: 'AI Usage', icon: DollarSign },
    { show: canViewAITransparency, value: 'ai-transparency', label: 'AI Transparency', icon: Eye },
    { show: canViewServiceMonitoring, value: 'service-monitoring', label: 'Service Monitor', icon: Server },
  ].filter(item => item.show)

  // If user prefers sidebar layout, render that instead
  if (useSidebarLayout) {
    return (
      <div className="min-h-screen bg-background">
        {/* Layout Toggle Button */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={toggleLayout}
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm"
            title="Switch to tabbed layout"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tabs
          </Button>
        </div>
        <SidebarDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Header - Responsive */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            {/* Mobile Header */}
            <div className="flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="p-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back!</p>
                </div>
              </div>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-2">
                    {/* Quick Actions in Mobile Menu */}
                    {quickActions.length > 0 && (
                      <>
                        <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">Quick Actions</div>
                        {quickActions.map((action) => (
                          <Button
                            key={action.path}
                            variant="ghost"
                            onClick={() => {
                              navigate(action.path)
                              setMobileMenuOpen(false)
                            }}
                            className="justify-start"
                          >
                            <action.icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </Button>
                        ))}
                        <div className="my-2 border-t" />
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/settings')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl xl:text-4xl font-light tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-base xl:text-lg font-light text-gray-600">
                  Welcome back, {user?.fullName || user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2 xl:gap-3">
                {/* Layout Toggle */}
                <Button
                  onClick={toggleLayout}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-sm"
                  title="Switch to sidebar layout"
                >
                  <Sidebar className="h-4 w-4" />
                  <span className="hidden xl:inline">Sidebar</span>
                </Button>

                {/* Quick Actions - Desktop */}
                {quickActions.map((action) => (
                  <Button
                    key={action.path}
                    variant="outline"
                    onClick={() => navigate(action.path)}
                    className="hidden xl:flex items-center gap-2 text-sm"
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="hidden 2xl:inline">{action.label}</span>
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-sm"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden xl:inline">Home</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden xl:inline">Settings</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content - Responsive */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation - Responsive */}
          <div className="mb-6 lg:mb-8">
            <TabsList className="w-full lg:w-auto flex flex-wrap gap-1 h-auto p-1 lg:p-2 bg-gray-50">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <tab.icon className="h-4 w-4 lg:hidden xl:inline-block" />
                  <span className="hidden sm:inline lg:hidden xl:inline">{tab.label}</span>
                  <span className="sm:hidden lg:inline xl:hidden">{tab.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="ai-dashboard" className="space-y-6 lg:space-y-8">
            <SimplifiedPersonalizedDashboard />
          </TabsContent>

          {canViewStats && (
            <TabsContent value="overview" className="space-y-6 lg:space-y-8">
              <DashboardOverview />
            </TabsContent>
          )}

          {canManageArticles && (
            <TabsContent value="articles" className="space-y-6 lg:space-y-8">
              <ArticleManagementDashboard />
            </TabsContent>
          )}

          {canManageContent && (
            <TabsContent value="content" className="space-y-6 lg:space-y-8">
              <ContentManagement />
            </TabsContent>
          )}

          {canManageUsers && (
            <TabsContent value="users" className="space-y-6 lg:space-y-8">
              <UserManagement />
            </TabsContent>
          )}

          {canViewLogs && (
            <TabsContent value="activity" className="space-y-6 lg:space-y-8">
              <ActivityLogs />
            </TabsContent>
          )}

          {canViewStats && (
            <TabsContent value="analytics" className="space-y-6 lg:space-y-8">
              <ContentAnalytics />
            </TabsContent>
          )}

          {canManageLegal && (
            <TabsContent value="legal" className="space-y-6 lg:space-y-8">
              <LegalDocumentManager />
            </TabsContent>
          )}

          {canManageAIContent && (
            <TabsContent value="ai-content" className="space-y-6 lg:space-y-8">
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
            </TabsContent>
          )}

          {canViewAICosts && (
            <TabsContent value="ai-usage" className="space-y-6 lg:space-y-8">
              <AIUsageMonitoringDashboard />
            </TabsContent>
          )}

          {canViewAITransparency && (
            <TabsContent value="ai-transparency" className="space-y-6 lg:space-y-8">
              <AITransparencyDashboard />
            </TabsContent>
          )}

          {canViewServiceMonitoring && (
            <TabsContent value="service-monitoring" className="space-y-6 lg:space-y-8">
              <GovernmentServiceMonitor />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default DashboardPage