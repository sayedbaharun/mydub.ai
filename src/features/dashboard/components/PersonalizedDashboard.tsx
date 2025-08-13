import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Sun, 
  Car, 
  BookOpen, 
  Compass, 
  Settings,
  RefreshCw,
  Bell,
  Target,
  MapPin,
  Clock,
  Thermometer,
  Wind,
  Droplets,
  ChevronRight,
  Lightbulb,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useAIDashboard, useInsights, useDashboardMetrics, useWeatherInsights, useTrafficInsights, useLearningPath, useInsightActions } from '@/shared/hooks/useAIDashboard';
import { UserInsight } from '@/shared/lib/dashboard/aiInsightsEngine';
import { formatDistanceToNow } from 'date-fns';

interface PersonalizedDashboardProps {
  className?: string;
}

export function PersonalizedDashboard({ className = '' }: PersonalizedDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'insights' | 'analytics'>('overview');
  const { isLoading, refreshDashboard } = useAIDashboard();

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <DashboardHeader onRefresh={refreshDashboard} />
      
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardHeader({ onRefresh }: { onRefresh: () => void }) {
  const { criticalInsights } = useInsights();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          AI Dashboard
        </h1>
        <p className="text-muted-foreground">
          Personalized insights and recommendations for Dubai
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {criticalInsights.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {criticalInsights.length} urgent
          </Badge>
        )}
        
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <InsightsPreview />
        <WeatherTrafficRow />
      </div>
      
      <div className="space-y-6">
        <MetricsSummary />
        <LearningPathPreview />
      </div>
    </div>
  );
}

function InsightsTab() {
  return (
    <div className="space-y-6">
      <DetailedInsightsList />
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <DetailedMetrics />
    </div>
  );
}

function InsightsPreview() {
  const { activeInsights } = useInsights();
  const { executeAction, trackInsightInteraction } = useInsightActions();

  const topInsights = activeInsights.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Personalized recommendations based on your activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} compact />
        ))}
        
        {topInsights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No insights available right now</p>
            <p className="text-sm">Check back later for personalized recommendations</p>
          </div>
        )}
        
        {activeInsights.length > 3 && (
          <Button variant="outline" className="w-full">
            View All Insights ({activeInsights.length})
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function WeatherTrafficRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <WeatherWidget />
      <TrafficWidget />
    </div>
  );
}

function WeatherWidget() {
  const { weather, recommendations, outfitRecommendation, isHot } = useWeatherInsights();

  if (!weather) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Weather data unavailable
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold flex items-center gap-2">
              {weather.current.temperature}°C
              <Thermometer className={`h-5 w-5 ${isHot ? 'text-red-500' : 'text-blue-500'}`} />
            </div>
            <p className="text-muted-foreground capitalize">
              {weather.current.condition}
            </p>
          </div>
          
          <div className="text-right text-sm">
            <div className="flex items-center gap-1 mb-1">
              <Droplets className="h-3 w-3" />
              {weather.current.humidity}%
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {weather.current.wind_speed} km/h
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="font-medium text-sm mb-2">Outfit Recommendation</p>
          <p className="text-sm text-muted-foreground">{outfitRecommendation}</p>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="text-xs bg-muted p-2 rounded">
                {rec}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrafficWidget() {
  const { traffic, severityColor, hasDelays, routeSuggestions } = useTrafficInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Traffic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`bg-${severityColor}-100 text-${severityColor}-800 border-${severityColor}-200`}
          >
            {traffic?.current_conditions || 'Unknown'}
          </Badge>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>

        {hasDelays && (
          <div className="space-y-2">
            <p className="font-medium text-sm">Affected Routes</p>
            {traffic?.affected_routes?.slice(0, 2).map((route, index) => (
              <div key={index} className="text-sm bg-orange-50 p-2 rounded">
                <div className="font-medium">{route.route}</div>
                <div className="text-muted-foreground">
                  +{route.delay_minutes} min delay
                </div>
              </div>
            ))}
          </div>
        )}

        {routeSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-sm">Alternative Routes</p>
            {routeSuggestions.slice(0, 1).map((suggestion, index) => (
              <div key={index} className="text-sm bg-green-50 p-2 rounded">
                Try {suggestion.alternative} (saves {suggestion.timeSaving} min)
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricsSummary() {
  const { metrics, getTrend } = useDashboardMetrics();

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <MetricItem
            label="Activity Score"
            value={Math.round(metrics.activity_score)}
            trend={getTrend('activity_score')}
            suffix="/100"
          />
          
          <MetricItem
            label="Interests Discovered"
            value={metrics.interests_discovered}
            trend="up"
          />
          
          <MetricItem
            label="Personalization"
            value={metrics.personalization_score}
            trend="up"
            suffix="%"
          />
        </div>

        <Separator />

        <div>
          <p className="font-medium text-sm mb-2">This Week</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Searches: {metrics.weekly_summary.searches}</div>
            <div>Content: {metrics.weekly_summary.content_viewed}</div>
            <div>Places: {metrics.weekly_summary.places_visited}</div>
            <div>Services: {metrics.weekly_summary.services_used}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LearningPathPreview() {
  const { learningPath, getTopicProgress, nextRecommendation } = useLearningPath();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextRecommendation && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="font-medium text-sm">{nextRecommendation.topic}</p>
            <Progress value={getTopicProgress(nextRecommendation)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {nextRecommendation.estimated_time} remaining
            </p>
          </div>
        )}

        {learningPath.slice(0, 2).map((topic, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{topic.topic}</span>
              <span>{Math.round(getTopicProgress(topic))}%</span>
            </div>
            <Progress value={getTopicProgress(topic)} className="h-2" />
          </div>
        ))}

        {learningPath.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No learning paths yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailedInsightsList() {
  const { activeInsights, dismissInsight } = useInsights();

  return (
    <div className="space-y-4">
      {activeInsights.map((insight) => (
        <InsightCard 
          key={insight.id} 
          insight={insight} 
          onDismiss={() => dismissInsight(insight.id)}
        />
      ))}
      
      {activeInsights.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No insights available</h3>
            <p className="text-muted-foreground">
              Continue using MyDub.AI to receive personalized insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: UserInsight;
  compact?: boolean;
  onDismiss?: () => void;
}

function InsightCard({ insight, compact = false, onDismiss }: InsightCardProps) {
  const { executeAction, trackInsightInteraction } = useInsightActions();

  const getPriorityColor = (priority: UserInsight['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: UserInsight['type']) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'recommendation': return Compass;
      case 'alert': return AlertTriangle;
      case 'achievement': return Award;
      case 'opportunity': return Target;
      case 'summary': return Brain;
      default: return Lightbulb;
    }
  };

  const Icon = getTypeIcon(insight.type);

  return (
    <Card className={compact ? 'border-l-4 border-l-primary' : ''}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-full ${getPriorityColor(insight.priority)}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
                  {insight.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              </div>
              
              <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                {insight.description}
              </p>
              
              {!compact && insight.metadata?.trend_direction && (
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className={`h-3 w-3 ${
                    insight.metadata.trend_direction === 'up' ? 'text-green-500' : 
                    insight.metadata.trend_direction === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {insight.metadata.percentage_change && 
                      `${insight.metadata.percentage_change > 0 ? '+' : ''}${insight.metadata.percentage_change}%`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {Math.round(insight.confidence * 100)}%
            </span>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                ×
              </Button>
            )}
          </div>
        </div>

        {insight.actions && insight.actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {insight.actions.slice(0, compact ? 1 : 2).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  executeAction(action);
                  trackInsightInteraction(insight.id, action.type);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {!compact && (
          <div className="text-xs text-muted-foreground mt-3">
            {formatDistanceToNow(insight.created_at, { addSuffix: true })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailedMetrics() {
  const { metrics, historicalMetrics, getTrend, getMetricChange } = useDashboardMetrics();

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetricItem
            label="Activity Score"
            value={Math.round(metrics.activity_score)}
            trend={getTrend('activity_score')}
            change={getMetricChange('activity_score')}
            suffix="/100"
          />
          <MetricItem
            label="Engagement Level"
            value={metrics.engagement_level}
            trend="stable"
          />
          <MetricItem
            label="Interests"
            value={metrics.interests_discovered}
            trend={getTrend('interests_discovered')}
            change={getMetricChange('interests_discovered')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{metrics.weekly_summary.searches}</div>
              <div className="text-xs text-muted-foreground">Searches</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.weekly_summary.content_viewed}</div>
              <div className="text-xs text-muted-foreground">Content Viewed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.weekly_summary.places_visited}</div>
              <div className="text-xs text-muted-foreground">Places Visited</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.weekly_summary.services_used}</div>
              <div className="text-xs text-muted-foreground">Services Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.goals_progress.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{goal.goal}</span>
                <span>{goal.progress}/{goal.target}</span>
              </div>
              <Progress value={(goal.progress / goal.target) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  suffix?: string;
}

function MetricItem({ label, value, trend, change, suffix = '' }: MetricItemProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {value}{suffix}
        </span>
        {getTrendIcon()}
        {change !== undefined && change !== 0 && (
          <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="h-20 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </>
  );
}

export default PersonalizedDashboard;