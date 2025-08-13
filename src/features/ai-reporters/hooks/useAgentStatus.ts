import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { aiReporterService } from '../services/aiReporter.service'
import { AIAgent, ContentSource, AgentMetrics } from '../types'
import { toast } from 'sonner'
import { supabase } from '@/shared/lib/supabase'

export function useAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiReporterService.getAgents(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['ai-agent', agentId],
    queryFn: () => aiReporterService.getAgent(agentId),
    enabled: !!agentId,
  })
}

export function useAgentMetrics(agentId: string, period: AgentMetrics['period'] = 'day') {
  return useQuery({
    queryKey: ['agent-metrics', agentId, period],
    queryFn: () => aiReporterService.getAgentMetrics(agentId, period),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      agentId,
      config,
    }: {
      agentId: string
      config: Partial<AIAgent['configuration']>
    }) => aiReporterService.updateAgentConfig(agentId, config),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] })
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agentId] })
      toast.success('Agent configuration updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to update configuration: ' + error.message)
    },
  })
}

export function useUpdateAgentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      agentId,
      status,
    }: {
      agentId: string
      status: AIAgent['status']
    }) => aiReporterService.updateAgentStatus(agentId, status),
    onSuccess: (_, { agentId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] })
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agentId] })
      toast.success(`Agent ${status === 'active' ? 'activated' : 'paused'}`)
    },
    onError: (error: Error) => {
      toast.error('Failed to update status: ' + error.message)
    },
  })
}

export function useSources() {
  return useQuery({
    queryKey: ['content-sources'],
    queryFn: () => aiReporterService.getSources(),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useAddSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (source: Omit<ContentSource, 'id' | 'created_at' | 'updated_at'>) =>
      aiReporterService.addSource(source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
      queryClient.invalidateQueries({ queryKey: ['ai-reporter-dashboard'] })
      toast.success('Source added successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to add source: ' + error.message)
    },
  })
}

export function useUpdateSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sourceId,
      updates,
    }: {
      sourceId: string
      updates: Partial<ContentSource>
    }) => aiReporterService.updateSource(sourceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
      toast.success('Source updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update source: ' + error.message)
    },
  })
}

export function useDeleteSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sourceId: string) => aiReporterService.deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
      queryClient.invalidateQueries({ queryKey: ['ai-reporter-dashboard'] })
      toast.success('Source deleted successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete source: ' + error.message)
    },
  })
}

export function useAIReporterDashboard() {
  return useQuery({
    queryKey: ['ai-reporter-dashboard'],
    queryFn: () => aiReporterService.getDashboard(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useTestSource() {
  return useMutation({
    mutationFn: (sourceId: string) => aiReporterService.testSource(sourceId),
    onSuccess: ({ success, message }) => {
      if (success) {
        toast.success(message)
      } else {
        toast.error(message)
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to test source: ' + error.message)
    },
  })
}

// Real-time subscription for agent status updates
export function useRealtimeAgentStatus() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscription = supabase
      .channel('agent-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
        },
        (payload) => {
          // Invalidate queries when agent status changes
          queryClient.invalidateQueries({ queryKey: ['ai-agents'] })
          queryClient.invalidateQueries({ queryKey: ['ai-agent', payload.new?.id] })
          queryClient.invalidateQueries({ queryKey: ['ai-reporter-dashboard'] })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])
}

// Real-time subscription for new content
export function useRealtimeContentUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscription = supabase
      .channel('ai-content-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_generated_content',
        },
        () => {
          // Invalidate approval queue when new content is generated
          queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
          queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
          queryClient.invalidateQueries({ queryKey: ['ai-reporter-dashboard'] })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])
}