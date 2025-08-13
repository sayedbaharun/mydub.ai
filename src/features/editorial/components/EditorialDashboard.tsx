/**
 * Editorial Dashboard - Main newsroom interface
 * Central hub for editorial operations and oversight
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  Zap,
  Eye,
  Edit3,
  Plus
} from 'lucide-react';
import { useEditorialDashboard } from '../hooks/useEditorialWorkflow';
import { StoryAssignmentPanel } from './StoryAssignmentPanel';
import { BreakingNewsPanel } from './BreakingNewsPanel';
import { ArticleWorkflow } from './ArticleWorkflow';
import { EditorialCalendar } from './EditorialCalendar';
import type { EditorialDashboardStats, ArticleStatus, PriorityLevel } from '../types/editorial.types';

export function EditorialDashboard() {
  const { dashboardData, isLoading, error } = useEditorialDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <p>Failed to load editorial dashboard</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editorial Dashboard</h1>
          <p className="text-gray-600 mt-1">
            MyDub.ai Newsroom • {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Breaking News
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={dashboardData.stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="breaking">Breaking News</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Articles */}
            <RecentArticles articles={dashboardData.recent_articles} />
            
            {/* Urgent Assignments */}
            <UrgentAssignments assignments={dashboardData.urgent_assignments} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Breaking News */}
            <ActiveBreakingNews breakingNews={dashboardData.breaking_news} />
            
            {/* Journalist Workload */}
            <JournalistWorkload workload={dashboardData.journalist_workload} />
          </div>

          {/* Today's Calendar */}
          <TodaysCalendar events={dashboardData.calendar_today} />
        </TabsContent>

        <TabsContent value="articles">
          <ArticleWorkflow />
        </TabsContent>

        <TabsContent value="assignments">
          <StoryAssignmentPanel />
        </TabsContent>

        <TabsContent value="breaking">
          <BreakingNewsPanel />
        </TabsContent>

        <TabsContent value="calendar">
          <EditorialCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsOverview({ stats }: { stats: EditorialDashboardStats }) {
  const statCards = [
    {
      title: 'Total Articles',
      value: stats.total_articles,
      icon: FileText,
      change: `+${stats.articles_today} today`,
      color: 'text-blue-600'
    },
    {
      title: 'Drafts Pending',
      value: stats.drafts_pending,
      icon: Edit3,
      change: 'Need review',
      color: 'text-yellow-600'
    },
    {
      title: 'Published Today',
      value: stats.published_today,
      icon: CheckCircle,
      change: 'Live on site',
      color: 'text-green-600'
    },
    {
      title: 'Breaking News',
      value: stats.breaking_news_active,
      icon: Zap,
      change: 'Active alerts',
      color: 'text-red-600'
    },
    {
      title: 'Assignments Due',
      value: stats.assignments_due_today,
      icon: Clock,
      change: 'Due today',
      color: 'text-orange-600'
    },
    {
      title: 'Overdue',
      value: stats.assignments_overdue,
      icon: AlertTriangle,
      change: 'Need attention',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecentArticles({ articles }: { articles: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Recent Articles
        </CardTitle>
        <CardDescription>Latest content updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {articles.slice(0, 5).map((article) => (
            <div key={article.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusBadge status={article.status} />
                  <span className="text-xs text-gray-500">{article.author_name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(article.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UrgentAssignments({ assignments }: { assignments: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
          Urgent Assignments
        </CardTitle>
        <CardDescription>High priority and overdue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{assignment.title}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <PriorityBadge priority={assignment.priority} />
                  <span className="text-xs text-gray-500">{assignment.journalist?.full_name}</span>
                  {assignment.deadline && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-red-600">
                        Due {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveBreakingNews({ breakingNews }: { breakingNews: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-red-600" />
          Active Breaking News
        </CardTitle>
        <CardDescription>Live alerts and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {breakingNews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active breaking news</p>
        ) : (
          <div className="space-y-3">
            {breakingNews.map((alert) => (
              <div key={alert.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm font-medium text-red-900">{alert.title}</p>
                <p className="text-xs text-red-700 mt-1">{alert.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <AlertLevelBadge level={alert.alert_level} />
                  <span className="text-xs text-red-600">
                    {new Date(alert.sent_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JournalistWorkload({ workload }: { workload: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Journalist Workload
        </CardTitle>
        <CardDescription>Current assignments and capacity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workload.slice(0, 5).map((journalist) => (
            <div key={journalist.journalist_id} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/avatars/${journalist.journalist_id}.jpg`} />
                <AvatarFallback>{journalist.journalist_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{journalist.journalist_name}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{journalist.active_assignments} assignments</span>
                  <span>•</span>
                  <span>{journalist.articles_in_progress} in progress</span>
                  {journalist.avg_days_to_deadline && (
                    <>
                      <span>•</span>
                      <span>{Math.round(journalist.avg_days_to_deadline)} days avg deadline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TodaysCalendar({ events }: { events: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Today's Schedule
        </CardTitle>
        <CardDescription>Editorial calendar for today</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {event.event_type.replace('_', ' ')}
                    </Badge>
                    {event.assignee && (
                      <span className="text-xs text-gray-500">{event.assignee.full_name}</span>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={event.priority} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper components
function StatusBadge({ status }: { status: ArticleStatus }) {
  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-800' },
    in_review: { label: 'In Review', color: 'bg-orange-100 text-orange-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    published: { label: 'Published', color: 'bg-green-100 text-green-800' },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const priorityConfig = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
  };

  const config = priorityConfig[priority];

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}

function AlertLevelBadge({ level }: { level: string }) {
  const levelConfig = {
    low: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  };

  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.medium;

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}