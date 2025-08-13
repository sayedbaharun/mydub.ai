import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApprovalService } from '../services/contentApproval.service'
import { ApprovalFilter, ApprovalAction } from '../types'
import { toast } from 'sonner'

export function useApprovalQueue(
  page: number = 1,
  pageSize: number = 20,
  filters?: ApprovalFilter
) {
  return useQuery({
    queryKey: ['approval-queue', page, pageSize, filters],
    queryFn: () => contentApprovalService.getApprovalQueue(page, pageSize, filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useApprovalItem(itemId: string) {
  return useQuery({
    queryKey: ['approval-item', itemId],
    queryFn: () => contentApprovalService.getApprovalItem(itemId),
    enabled: !!itemId,
  })
}

export function useApprovalStats() {
  return useQuery({
    queryKey: ['approval-stats'],
    queryFn: () => contentApprovalService.getApprovalStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export function useProcessApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, userId }: { action: ApprovalAction; userId: string }) =>
      contentApprovalService.processApprovalAction(action, userId),
    onSuccess: (_, { action }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
      queryClient.invalidateQueries({ queryKey: ['approval-item', action.item_id] })

      // Show success message
      const messages = {
        approve: 'Content approved successfully',
        reject: 'Content rejected',
        schedule: 'Content scheduled for publishing',
        edit: 'Content edited and approved',
      }
      toast.success(messages[action.action])
    },
    onError: (error: Error) => {
      toast.error('Failed to process approval: ' + error.message)
    },
  })
}

export function useBulkApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      itemIds,
      action,
      userId,
      comments,
    }: {
      itemIds: string[]
      action: 'approve' | 'reject'
      userId: string
      comments?: string
    }) => contentApprovalService.bulkProcessApproval(itemIds, action, userId, comments),
    onSuccess: (_, { action, itemIds }) => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] })

      const message = `${itemIds.length} items ${action}ed successfully`
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error('Failed to process bulk approval: ' + error.message)
    },
  })
}