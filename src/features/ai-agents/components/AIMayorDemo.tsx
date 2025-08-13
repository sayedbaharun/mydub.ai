import React, { useState } from 'react'
import { AIMayorService } from '../services/ai-mayor.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Loader2, Brain, Users, Zap, MessageSquare } from 'lucide-react'

/**
 * Demo component showcasing the AI Mayor multi-agent system
 * This demonstrates how the revolutionary AI agent architecture works
 */
export const AIMayorDemo: React.FC = () => {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<any>(null)

  // Initialize AI Mayor and get system status
  React.useEffect(() => {
    const initializeSystem = async () => {
      try {
        const aiMayor = AIMayorService.getInstance()
        const status = aiMayor.getSystemStatus()
        setSystemStatus(status)
      } catch (error) {
        console.error('Failed to initialize AI Mayor:', error)
      }
    }
    
    initializeSystem()
  }, [])

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResponse('')

    try {
      const aiMayor = AIMayorService.getInstance()
      const result = await aiMayor.processSimpleQuery(query)
      setResponse(result)
    } catch (error) {
      console.error('AI Mayor query error:', error)
      setResponse('I apologize, but I encountered an issue processing your query. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const exampleQueries = [
    "What's the weather like and how should I plan my day in Dubai?",
    "I want to start a business in Dubai - what do I need to know?",
    "Help me plan the perfect Dubai experience with transport and dining",
    "What government services are available and how do I access them?",
    "Tell me about Dubai's culture and the best entertainment options"
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Mayor - Dubai's Revolutionary AI Agent System
          </CardTitle>
          <p className="text-muted-foreground">
            Experience the world's most advanced city AI that coordinates multiple specialized agents 
            to provide comprehensive, intelligent responses about Dubai.
          </p>
        </CardHeader>
      </Card>

      {/* System Status */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                  <p className="text-2xl font-bold">{systemStatus.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Orchestration Rules</p>
                  <p className="text-2xl font-bold">{systemStatus.orchestrationRules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Ask the AI Mayor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Try complex, multi-domain questions to see the AI agent orchestration in action
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about Dubai - weather, transport, business, culture, government..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Ask AI Mayor'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Example Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Try These Multi-Agent Examples</CardTitle>
          <p className="text-sm text-muted-foreground">
            These queries will trigger multiple specialized agents working together
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {exampleQueries.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setQuery(example)}
                disabled={isLoading}
                className="text-left justify-start h-auto py-3 px-4"
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Display */}
      {(response || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Mayor Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI Mayor is coordinating agents to process your query...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">{response}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Information */}
      <Card>
        <CardHeader>
          <CardTitle>Specialized Agents</CardTitle>
          <p className="text-sm text-muted-foreground">
            The AI Mayor coordinates these specialized agents based on your query
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Government Agent', emoji: '🏛️', specialty: 'Visas, permits, licenses' },
              { name: 'Transport Agent', emoji: '🚇', specialty: 'Metro, buses, traffic' },
              { name: 'Business Agent', emoji: '🏢', specialty: 'Company formation, trade' },
              { name: 'Culture Agent', emoji: '🕌', specialty: 'Traditions, etiquette' },
              { name: 'Lifestyle Agent', emoji: '🌟', specialty: 'Dining, entertainment' },
              { name: 'Environment Agent', emoji: '🌦️', specialty: 'Weather, air quality' }
            ].map((agent, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{agent.emoji}</span>
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{agent.specialty}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revolutionary Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle>🚀 Revolutionary AI Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🤖 Multi-Agent Orchestration</h4>
              <p className="text-muted-foreground">
                Coordinates specialized agents based on query complexity and domain requirements
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🧠 Intelligent Query Processing</h4>
              <p className="text-muted-foreground">
                Analyzes intent, urgency, and complexity to determine optimal agent allocation
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Real-time Data Integration</h4>
              <p className="text-muted-foreground">
                Accesses live government APIs, weather data, and search results automatically
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Contextual Intelligence</h4>
              <p className="text-muted-foreground">
                Understands cultural context and provides Dubai-specific, actionable advice
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}