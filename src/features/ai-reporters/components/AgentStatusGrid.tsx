import { useAgents, useUpdateAgentStatus, useRealtimeAgentStatus } from '../hooks/useAgentStatus'
import { AIAgent } from '../types'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Progress } from '@/shared/components/ui/progress'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { 
  Bot, 
  Newspaper, 
  MapPin, 
  Building, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Activity,
  Pause,
  Play,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { AgentConfigDialog } from './AgentConfigDialog'

export function AgentStatusGrid() {
  const { data: agents, isLoading } = useAgents()
  const updateStatus = useUpdateAgentStatus()
  const [configAgent, setConfigAgent] = useState<AIAgent | null>(null)

  // Enable real-time updates
  useRealtimeAgentStatus()

  const getAgentIcon = (type: AIAgent['type']) => {
    const icons = {
      news_reporter: Newspaper,
      tourism_curator: MapPin,
      government_monitor: Building,
      event_tracker: Calendar,
      content_optimizer: TrendingUp
    }
    return icons[type] || Bot
  }

  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const handleToggleStatus = async (agent: AIAgent) => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    await updateStatus.mutateAsync({
      agentId: agent.id,
      status: newStatus
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents?.map((agent) => {
          const Icon = getAgentIcon(agent.type)
          const approvalRate = agent.performance.approval_rate

          return (
            <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-gray-50`}>
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                    <Badge variant={
                      agent.status === 'active' ? 'default' :
                      agent.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {agent.status}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {agent.description}
                </p>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Approval Rate</span>
                    <span className="font-medium">{approvalRate}%</span>
                  </div>
                  <Progress value={approvalRate} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Articles Today</p>
                      <p className="font-medium">{agent.performance.articles_generated}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quality Score</p>
                      <p className="font-medium">{agent.performance.average_quality_score}/100</p>
                    </div>
                  </div>

                  {agent.performance.errors_last_24h > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{agent.performance.errors_last_24h} errors in last 24h</span>
                    </div>
                  )}
                </div>

                {/* Last Active */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span>
                    Last active {formatDistanceToNow(new Date(agent.performance.last_active), { addSuffix: true })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={agent.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(agent)}
                      disabled={agent.status === 'error' || agent.status === 'maintenance'}
                    />
                    <span className="text-sm text-gray-600">
                      {agent.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfigAgent(agent)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Configuration Dialog */}
      {configAgent && (
        <AgentConfigDialog
          agent={configAgent}
          onClose={() => setConfigAgent(null)}
        />
      )}
    </>
  )
}