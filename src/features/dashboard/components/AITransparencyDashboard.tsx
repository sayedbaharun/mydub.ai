/**
 * AI Transparency Dashboard for MyDub.ai
 * Provides transparency metrics, confidence scores, and data source attribution
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Shield, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  ExternalLink,
  Brain,
  Database,
  Users,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { cn } from '@/shared/lib/utils'

interface TransparencyMetrics {
  totalQueries: number
  averageConfidence: number
  dataSourcesUsed: number
  biasDetections: number
  explainabilityScore: number
  transparencyGrade: 'A' | 'B' | 'C' | 'D' | 'F'
}

interface AIResponse {
  id: string
  query: string
  response: string
  confidence: number
  dataSources: string[]
  timestamp: Date
  biasFlag: boolean
  explainabilityScore: number
  modelUsed: string
  processingTime: number
}

interface DataSource {
  name: string
  type: 'government' | 'news' | 'community' | 'ai'
  reliability: number
  lastUpdated: Date
  usageCount: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AITransparencyDashboard() {
  const { user } = useAuth()
  const { announce } = useScreenReader()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [metrics, setMetrics] = useState<TransparencyMetrics | null>(null)
  const [recentResponses, setRecentResponses] = useState<AIResponse[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedResponse, setSelectedResponse] = useState<AIResponse | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadTransparencyData()
    }
  }, [user?.id, period])

  const loadTransparencyData = async () => {
    if (!user?.id) return

    setLoading(true)
    announce('Loading AI transparency dashboard', 'polite')

    try {
      // Mock data - in real implementation, these would come from your AI tracking service
      const mockMetrics: TransparencyMetrics = {
        totalQueries: 1247,
        averageConfidence: 87.3,
        dataSourcesUsed: 15,
        biasDetections: 3,
        explainabilityScore: 92.1,
        transparencyGrade: 'A'
      }
      setMetrics(mockMetrics)

      // Mock recent responses
      const mockResponses: AIResponse[] = [
        {
          id: '1',
          query: 'What are the RTA bus routes to Dubai Mall?',
          response: 'There are several RTA bus routes to Dubai Mall...',
          confidence: 95.2,
          dataSources: ['RTA Official API', 'Dubai Municipality', 'Real-time GPS'],
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          biasFlag: false,
          explainabilityScore: 96.8,
          modelUsed: 'GPT-4',
          processingTime: 1.2
        },
        {
          id: '2',
          query: 'Best restaurants in JBR for families?',
          response: 'Here are some family-friendly restaurants in JBR...',
          confidence: 78.4,
          dataSources: ['Zomato API', 'Google Reviews', 'Dubai Tourism'],
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          biasFlag: true,
          explainabilityScore: 82.3,
          modelUsed: 'Claude-3',
          processingTime: 2.1
        },
        {
          id: '3',
          query: 'Dubai visa requirements for Pakistani citizens',
          response: 'Pakistani citizens can apply for Dubai visa...',
          confidence: 92.7,
          dataSources: ['GDRFA Official', 'UAE Embassy', 'Immigration Portal'],
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          biasFlag: false,
          explainabilityScore: 94.5,
          modelUsed: 'GPT-4',
          processingTime: 0.8
        }
      ]
      setRecentResponses(mockResponses)

      // Mock data sources
      const mockDataSources: DataSource[] = [
        {
          name: 'RTA Official API',
          type: 'government',
          reliability: 98.5,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 15),
          usageCount: 342
        },
        {
          name: 'Dubai Municipality',
          type: 'government',
          reliability: 97.2,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 30),
          usageCount: 298
        },
        {
          name: 'DEWA Services',
          type: 'government',
          reliability: 96.8,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 45),
          usageCount: 156
        },
        {
          name: 'Dubai Tourism Board',
          type: 'government',
          reliability: 95.1,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60),
          usageCount: 423
        },
        {
          name: 'Gulf News API',
          type: 'news',
          reliability: 89.3,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 10),
          usageCount: 234
        }
      ]
      setDataSources(mockDataSources)

      announce(`Transparency dashboard loaded. Average confidence: ${mockMetrics.averageConfidence}%`, 'polite')
    } catch (error) {
      console.error('Error loading transparency data:', error)
      announce('Error loading transparency data', 'assertive')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50'
      case 'B': return 'text-blue-600 bg-blue-50'
      case 'C': return 'text-yellow-600 bg-yellow-50'
      case 'D': return 'text-orange-600 bg-orange-50'
      case 'F': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 80) return 'text-blue-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading transparency dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading AI transparency dashboard...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to load transparency data</AlertTitle>
        <AlertDescription>
          Please try refreshing the page or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  // Prepare chart data
  const sourceTypeData = dataSources.reduce((acc, source) => {
    const existing = acc.find(item => item.type === source.type)
    if (existing) {
      existing.count += 1
      existing.usage += source.usageCount
    } else {
      acc.push({
        type: source.type,
        count: 1,
        usage: source.usageCount,
        name: source.type.charAt(0).toUpperCase() + source.type.slice(1)
      })
    }
    return acc
  }, [] as Array<{type: string, count: number, usage: number, name: string}>)

  const confidenceData = recentResponses.map((response, index) => ({
    query: `Query ${index + 1}`,
    confidence: response.confidence,
    explainability: response.explainabilityScore,
    processingTime: response.processingTime
  }))

  return (
    <div className="space-y-6" role="main" aria-label="AI Transparency Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            AI Transparency Dashboard
          </h1>
          <p className="text-gray-600">Monitor AI decision-making transparency and explainability</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(value: any) => setPeriod(value)} className="w-auto">
            <TabsList>
              <TabsTrigger value="day" aria-label="Daily view">Day</TabsTrigger>
              <TabsTrigger value="week" aria-label="Weekly view">Week</TabsTrigger>
              <TabsTrigger value="month" aria-label="Monthly view">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadTransparencyData}
            aria-label="Refresh transparency data"
          >
            <Eye className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Transparency Grade Alert */}
      <Alert className={cn("border-2", metrics.transparencyGrade === 'A' ? 'border-green-200' : 'border-yellow-200')}>
        <Shield className="h-4 w-4" />
        <AlertTitle>
          Current Transparency Grade: 
          <span className={cn("ml-2 px-2 py-1 rounded text-sm font-bold", getGradeColor(metrics.transparencyGrade))}>
            {metrics.transparencyGrade}
          </span>
        </AlertTitle>
        <AlertDescription>
          Your AI system meets {metrics.transparencyGrade === 'A' ? 'excellent' : 'good'} transparency standards. 
          All responses include confidence scores and data source attribution.
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getConfidenceColor(metrics.averageConfidence))}>
              {metrics.averageConfidence.toFixed(1)}%
            </div>
            <Progress value={metrics.averageConfidence} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on {metrics.totalQueries} queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dataSourcesUsed}</div>
            <p className="text-xs text-muted-foreground">
              Active verified sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Explainability Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.explainabilityScore.toFixed(1)}%</div>
            <Progress value={metrics.explainabilityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              AI decision clarity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bias Detections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", metrics.biasDetections > 0 ? 'text-orange-600' : 'text-green-600')}>
              {metrics.biasDetections}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.biasDetections === 0 ? 'No bias detected' : 'Flagged responses'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Confidence & Explainability Trends</CardTitle>
            <CardDescription>Recent query performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="query" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'confidence' ? 'Confidence' : 'Explainability'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="confidence"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="explainability" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="explainability"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Data Source Types */}
        <Card>
          <CardHeader>
            <CardTitle>Data Source Distribution</CardTitle>
            <CardDescription>Usage by source type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {sourceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Usage Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Responses</CardTitle>
          <CardDescription>Latest queries with transparency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentResponses.map((response) => (
              <div 
                key={response.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedResponse(response)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{response.query}</h4>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {response.response.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Model: {response.modelUsed}</span>
                      <span>{response.processingTime}s</span>
                      <span>{response.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={response.confidence >= 90 ? 'default' : 
                              response.confidence >= 80 ? 'secondary' : 'outline'}
                    >
                      {response.confidence.toFixed(1)}% confident
                    </Badge>
                    {response.biasFlag && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Bias Flag
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {response.dataSources.length} sources
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources Reliability</CardTitle>
          <CardDescription>Reliability and usage statistics for all data sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Source</th>
                  <th className="text-center p-2">Type</th>
                  <th className="text-center p-2">Reliability</th>
                  <th className="text-center p-2">Usage</th>
                  <th className="text-center p-2">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((source) => (
                  <tr key={source.name} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{source.name}</td>
                    <td className="p-2 text-center">
                      <Badge 
                        variant={source.type === 'government' ? 'default' : 
                                source.type === 'news' ? 'secondary' : 'outline'}
                      >
                        {source.type}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("font-medium", getConfidenceColor(source.reliability))}>
                          {source.reliability.toFixed(1)}%
                        </span>
                        <Progress value={source.reliability} className="w-16 h-2" />
                      </div>
                    </td>
                    <td className="p-2 text-center">{source.usageCount.toLocaleString()}</td>
                    <td className="p-2 text-center text-xs text-gray-500">
                      {source.lastUpdated.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* How AI Works Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How Our AI Works
          </CardTitle>
          <CardDescription>Understanding MyDub.AI's decision-making process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">1. Query Processing</h4>
                <p className="text-sm text-gray-600">
                  Your question is analyzed for intent, language, and complexity. We identify the type of information needed.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">2. Source Selection</h4>
                <p className="text-sm text-gray-600">
                  Our system selects the most reliable and up-to-date sources based on your query type and requirements.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">3. AI Model Selection</h4>
                <p className="text-sm text-gray-600">
                  We choose the best AI model for your specific question - GPT-4 for complex reasoning, Claude for analysis.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">4. Confidence Scoring</h4>
                <p className="text-sm text-gray-600">
                  Every response includes a confidence score based on source reliability and model certainty.
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Bias Detection & Mitigation</h4>
              <p className="text-sm text-gray-600 mb-2">
                Our system continuously monitors for potential bias in AI responses:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Cultural sensitivity checks for Dubai's diverse population</li>
                <li>Religious and cultural bias detection</li>
                <li>Gender and nationality bias monitoring</li>
                <li>Economic bias awareness in recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AITransparencyDashboard