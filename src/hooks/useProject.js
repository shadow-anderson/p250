import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectMeta,
  fetchProjectMilestones,
  fetchProjectKPIs,
  fetchProjectEvidence,
  verifyEvidence,
  updateMilestone,
  mockProjectMeta,
  mockProjectMilestones,
  mockProjectKPIs,
  mockProjectEvidence,
} from './useProjectApi';

/**
 * Hook: useProjectMeta
 * Fetches project metadata
 */
export function useProjectMeta(projectId, useMock = true) {
  return useQuery({
    queryKey: ['projectMeta', projectId],
    queryFn: () => useMock ? Promise.resolve(mockProjectMeta) : fetchProjectMeta(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId,
  });
}

/**
 * Hook: useProjectMilestones
 * Fetches project milestones for Gantt chart
 */
export function useProjectMilestones(projectId, useMock = true) {
  return useQuery({
    queryKey: ['projectMilestones', projectId],
    queryFn: () => useMock ? Promise.resolve(mockProjectMilestones) : fetchProjectMilestones(projectId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!projectId,
  });
}

/**
 * Hook: useProjectKPIs
 * Fetches project KPIs
 */
export function useProjectKPIs(projectId, useMock = true) {
  return useQuery({
    queryKey: ['projectKPIs', projectId],
    queryFn: () => useMock ? Promise.resolve(mockProjectKPIs) : fetchProjectKPIs(projectId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!projectId,
  });
}

/**
 * Hook: useProjectEvidence
 * Infinite scroll evidence feed with cursor pagination
 */
export function useProjectEvidence(projectId, useMock = true) {
  return useInfiniteQuery({
    queryKey: ['projectEvidence', projectId],
    queryFn: ({ pageParam }) => {
      if (useMock) {
        // Simulate pagination with mock data
        if (pageParam === 'cursor_page2') {
          return Promise.resolve({
            items: mockProjectEvidence.items.map((item, idx) => ({
              ...item,
              id: `${item.id}-page2-${idx}`,
              title: `${item.title} (Page 2)`,
            })),
            next_cursor: null, // End of data
          });
        }
        return Promise.resolve(mockProjectEvidence);
      }
      return fetchProjectEvidence({ projectId, cursor: pageParam, limit: 20 });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!projectId,
  });
}

/**
 * Hook: useVerifyEvidence
 * Mutation for marking evidence as verified (optimistic update)
 */
export function useVerifyEvidence(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evidenceId, verified }) => verifyEvidence(evidenceId, verified),
    // Optimistic update
    onMutate: async ({ evidenceId, verified }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projectEvidence', projectId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['projectEvidence', projectId]);

      // Optimistically update
      queryClient.setQueryData(['projectEvidence', projectId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === evidenceId ? { ...item, verified } : item
            ),
          })),
        };
      });

      return { previousData };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['projectEvidence', projectId], context.previousData);
      }
    },
    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projectEvidence', projectId] });
    },
  });
}

/**
 * Hook: useUpdateMilestone
 * Mutation for updating milestone dates/status (with debounce in component)
 */
export function useUpdateMilestone(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, updates }) => updateMilestone(milestoneId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] });
    },
  });
}
