import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { DashboardPageHeader } from '@/features/dashboard/components/DashboardPageHeader'
import {
  ArrowLeft,
  Settings,
  Plus,
  RefreshCw,
  Database,
  FileText,
  BarChart3,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  Utensils,
  Camera,
  Moon,
  Crown,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SourceManager } from '../components/SourceManager'
import { DraftQueue } from '../components/DraftQueue'
import { PublishedContent } from '../components/PublishedContent'
import { CategoryAnalytics } from '../components/CategoryAnalytics'

type CategoryType = 'dining' | 'experiences' | 'nightlife' | 'luxury' | 'practical'

interface CategoryConfig {
  id: CategoryType
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}

const CATEGORY_CONFIGS: Record<CategoryType, CategoryConfig> = {
  dining: {
    id: 'dining',
    name: 'Dining',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Restaurants, cafes, food trends, and culinary experiences',
  },
  experiences: {
    id: 'experiences',
    name: 'Experiences',
    icon: Camera,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Activities, attractions, events, and entertainment',
  },
  nightlife: {
    id: 'nightlife',
    name: 'Nightlife',
    icon: Moon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Bars, clubs, evening entertainment, and social venues',
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'High-end shopping, luxury services, and premium experiences',
  },
  practical: {
    id: 'practical',
    name: 'Practical',
    icon: Wrench,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Government services, transportation, utilities, and daily needs',
  },
}

export function CategoryManagementPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('sources')
  const [refreshing, setRefreshing] = useState(false)

  // Validate category parameter
  if (!category || !CATEGORY_CONFIGS[category as CategoryType]) {
    return <Navigate to="/dashboard/content-management" replace />
  }

  const categoryConfig = CATEGORY_CONFIGS[category as CategoryType]
  const Icon = categoryConfig.icon

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  // Mock stats - replace with real data
  const stats = {
    sources: 8,
    activeSources: 6,
    pendingDrafts: 3,
    publishedToday: 2,
    totalPublished: 45,
    approvalRate: 89,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPageHeader
        title={`${categoryConfig.name} Management`}
        description={categoryConfig.description}
        icon={Icon}
        showBackToDashboard={true}
        showBackToHome={true}
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="mx-auto max-w-7xl px-8 py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sources</p>
                <p className="text-2xl font-light text-gray-900">{stats.sources}</p>
              </div>
              <Database className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-light text-gray-900">{stats.activeSources}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-light text-gray-900">{stats.pendingDrafts}</p>
              </div>
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-light text-gray-900">{stats.publishedToday}</p>
              </div>
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-light text-gray-900">{stats.totalPublished}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval</p>
                <p className="text-2xl font-light text-gray-900">{stats.approvalRate}%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="mx-auto max-w-7xl px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">
              <Database className="mr-2 h-4 w-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="drafts">
              <FileText className="mr-2 h-4 w-4" />
              Drafts
              {stats.pendingDrafts > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.pendingDrafts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">
              <Globe className="mr-2 h-4 w-4" />
              Published
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="sources" className="space-y-6">
              <SourceManager category={category as CategoryType} />
            </TabsContent>

            <TabsContent value="drafts" className="space-y-6">
              <DraftQueue category={category as CategoryType} />
            </TabsContent>

            <TabsContent value="published" className="space-y-6">
              <PublishedContent category={category as CategoryType} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <CategoryAnalytics category={category as CategoryType} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default CategoryManagementPage
