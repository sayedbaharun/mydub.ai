import React from 'react';
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

interface SimplifiedPersonalizedDashboardProps {
  className?: string;
}

export function SimplifiedPersonalizedDashboard({ className = '' }: SimplifiedPersonalizedDashboardProps) {
  // Mock data since database tables don't exist yet
  const mockInsights = [
    {
      id: '1',
      type: 'recommendation',
      title: 'New Restaurant Alert',
      description: 'A highly-rated Middle Eastern restaurant just opened in Dubai Marina',
      priority: 'medium',
      category: 'dining',
      confidence: 0.85,
    },
    {
      id: '2', 
      type: 'trend',
      title: 'Beach Season Peak',
      description: 'Beach activities are trending 40% higher this week',
      priority: 'high',
      category: 'leisure',
      confidence: 0.92,
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Explorer Badge',
      description: 'You\'ve discovered 5 new places this month!',
      priority: 'low',
      category: 'achievement',
      confidence: 1.0,
    }
  ];

  const mockMetrics = {
    activity_score: 78,
    engagement_level: 'high' as const,
    interests_discovered: 12,
    goals_progress: [
      { goal: 'Discover new restaurants', progress: 7, target: 10 },
      { goal: 'Visit cultural sites', progress: 3, target: 5 },
      { goal: 'Explore nightlife', progress: 2, target: 4 }
    ],
    weekly_summary: {
      searches: 23,
      content_viewed: 45,
      places_visited: 6,
      services_used: 8
    }
  };

  const mockWeather = {
    temperature: 28,
    condition: 'sunny',
    humidity: 65,
    wind_speed: 12,
    outfit_recommendation: 'Light clothing recommended, bring sunglasses!'
  };

  const mockTraffic = {
    current_conditions: 'Light Traffic',
    affected_routes: [],
    alternative_routes: [
      { route: 'Sheikh Zayed Road', timeSaving: 5 }
    ]
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <DashboardHeader />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <InsightsPreview insights={mockInsights} />
              <WeatherTrafficRow weather={mockWeather} traffic={mockTraffic} />
            </div>
            
            <div className="space-y-6">
              <MetricsSummary metrics={mockMetrics} />
              <LearningPathPreview />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <DetailedInsightsList insights={mockInsights} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DetailedMetrics metrics={mockMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardHeader() {
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
        <Button variant="outline" size="sm">
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

function InsightsPreview({ insights }: { insights: any[] }) {
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
        {insights.slice(0, 3).map((insight) => (
          <div key={insight.id} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {insight.category}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(insight.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          View All Insights
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function WeatherTrafficRow({ weather, traffic }: { weather: any, traffic: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {weather.temperature}°C
                <Thermometer className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-muted-foreground capitalize">
                {weather.condition}
              </p>
            </div>
            
            <div className="text-right text-sm">
              <div className="flex items-center gap-1 mb-1">
                <Droplets className="h-3 w-3" />
                {weather.humidity}%
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.wind_speed} km/h
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-medium text-sm mb-2">Outfit Recommendation</p>
            <p className="text-sm text-muted-foreground">{weather.outfit_recommendation}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Traffic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              {traffic.current_conditions}
            </Badge>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm">Alternative Routes</p>
            {traffic.alternative_routes.map((route: any, index: number) => (
              <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                Try {route.route} (saves {route.timeSaving} min)
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricsSummary({ metrics }: { metrics: any }) {
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Activity Score</span>
            <span className="font-medium">{metrics.activity_score}/100</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Interests Discovered</span>
            <span className="font-medium">{metrics.interests_discovered}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement Level</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {metrics.engagement_level}
            </Badge>
          </div>
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
  const mockLearningPath = [
    { topic: 'Dubai Culture & History', progress: 75 },
    { topic: 'Local Cuisine Guide', progress: 45 },
    { topic: 'Business Etiquette', progress: 20 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockLearningPath.map((topic, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{topic.topic}</span>
              <span>{topic.progress}%</span>
            </div>
            <Progress value={topic.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DetailedInsightsList({ insights }: { insights: any[] }) {
  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card key={insight.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-full bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-base">{insight.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm">
                    {insight.description}
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {Math.round(insight.confidence * 100)}% confidence
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailedMetrics({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Goals Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.goals_progress.map((goal: any, index: number) => (
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
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Activity Score</span>
            <span className="font-medium">{metrics.activity_score}/100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {metrics.engagement_level}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Interests</span>
            <span className="font-medium">{metrics.interests_discovered}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SimplifiedPersonalizedDashboard;