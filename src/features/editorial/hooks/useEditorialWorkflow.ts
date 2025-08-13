/**
 * Editorial Workflow Hook
 * Manages editorial dashboard state and operations
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editorialService } from '../services/editorial.service';
import type {
  EditorialDashboardData,
  EditorialArticle,
  StoryAssignment,
  CreateAssignmentForm,
  CreateBreakingNewsForm,
  ArticleUpdateForm,
  ArticleFilters,
  AssignmentFilters
} from '../types/editorial.types';

export function useEditorialDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['editorial-dashboard'],
    queryFn: () => editorialService.getDashboardData(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    dashboardData: data,
    isLoading,
    error,
    refetch
  };
}

export function useArticles(filters?: ArticleFilters, page = 1, limit = 25) {
  const [currentFilters, setCurrentFilters] = useState(filters);

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', currentFilters, page, limit],
    queryFn: () => editorialService.getArticles(currentFilters, undefined, page, limit),
  });

  return {
    articles: data?.articles || [],
    total: data?.total || 0,
    isLoading,
    error,
    filters: currentFilters,
    setFilters: setCurrentFilters
  };
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => editorialService.getArticleById(id),
    enabled: !!id,
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ArticleUpdateForm }) =>
      editorialService.updateArticle(id, updates),
    onSuccess: (updatedArticle) => {
      // Update article in cache
      queryClient.setQueryData(['article', updatedArticle.id], updatedArticle);
      
      // Invalidate articles list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
    },
  });
}

export function useAssignments(filters?: AssignmentFilters, page = 1, limit = 25) {
  const [currentFilters, setCurrentFilters] = useState(filters);

  const { data, isLoading, error } = useQuery({
    queryKey: ['assignments', currentFilters, page, limit],
    queryFn: () => editorialService.getAssignments(currentFilters, undefined, page, limit),
  });

  return {
    assignments: data?.assignments || [],
    total: data?.total || 0,
    isLoading,
    error,
    filters: currentFilters,
    setFilters: setCurrentFilters
  };
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: CreateAssignmentForm) =>
      editorialService.createAssignment(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StoryAssignment> }) =>
      editorialService.updateAssignment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
    },
  });
}

export function useBreakingNews() {
  return useQuery({
    queryKey: ['breaking-news'],
    queryFn: () => editorialService.getBreakingNewsAlerts(),
    refetchInterval: 10000, // Refresh every 10 seconds for breaking news
  });
}

export function useCreateBreakingNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alert: CreateBreakingNewsForm) =>
      editorialService.createBreakingNewsAlert(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
    },
  });
}

export function useDeactivateBreakingNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => editorialService.deactivateBreakingNewsAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
    },
  });
}

export function useJournalists() {
  return useQuery({
    queryKey: ['journalists'],
    queryFn: () => editorialService.getJournalists(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

export function useEditors() {
  return useQuery({
    queryKey: ['editors'],
    queryFn: () => editorialService.getEditors(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

export function useArticleVersions(articleId: string) {
  return useQuery({
    queryKey: ['article-versions', articleId],
    queryFn: () => editorialService.getArticleVersions(articleId),
    enabled: !!articleId,
  });
}

export function useContentApprovals(articleId?: string) {
  return useQuery({
    queryKey: ['content-approvals', articleId],
    queryFn: () => editorialService.getContentApprovals(articleId),
  });
}

// Real-time subscriptions hook
export function useEditorialRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to breaking news updates
    const breakingNewsSubscription = editorialService.subscribeToBreakingNews(
      (alert) => {
        queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
        queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
      }
    );

    // Subscribe to article updates
    const articleSubscription = editorialService.subscribeToArticleUpdates(
      (article) => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
        // Update specific article cache if it exists
        queryClient.setQueryData(['article', article.id], article);
      }
    );

    // Subscribe to assignment updates
    const assignmentSubscription = editorialService.subscribeToAssignmentUpdates(
      (assignment) => {
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
        queryClient.invalidateQueries({ queryKey: ['editorial-dashboard'] });
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      editorialService.supabase.removeChannel(breakingNewsSubscription);
      editorialService.supabase.removeChannel(articleSubscription);
      editorialService.supabase.removeChannel(assignmentSubscription);
    };
  }, [queryClient]);
}

// Hook for managing editorial workflow state
export function useEditorialWorkflow() {
  const [selectedArticle, setSelectedArticle] = useState<EditorialArticle | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<StoryAssignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isBreakingNewsDialogOpen, setIsBreakingNewsDialogOpen] = useState(false);

  // Setup real-time subscriptions
  useEditorialRealtime();

  return {
    selectedArticle,
    setSelectedArticle,
    selectedAssignment,
    setSelectedAssignment,
    isAssignmentDialogOpen,
    setIsAssignmentDialogOpen,
    isBreakingNewsDialogOpen,
    setIsBreakingNewsDialogOpen,
  };
}