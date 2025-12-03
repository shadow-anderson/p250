import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEmployeeData,
  fetchEmployeeKPIs,
  fetchEmployeeTasks,
  updateTaskStatus,
  uploadEvidence,
  mockEmployeeData,
  mockEmployeeKPIs,
  mockEmployeeTasks,
} from './useEmployeeApi';

/**
 * Hook: useEmployeeData
 * Fetches current employee information
 */
export function useEmployeeData(useMock = true) {
  return useQuery({
    queryKey: ['employeeData'],
    queryFn: () => useMock ? Promise.resolve(mockEmployeeData) : fetchEmployeeData(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: useEmployeeKPIs
 * Fetches employee KPIs for scorecard
 */
export function useEmployeeKPIs(useMock = true) {
  return useQuery({
    queryKey: ['employeeKPIs'],
    queryFn: () => useMock ? Promise.resolve(mockEmployeeKPIs) : fetchEmployeeKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: useEmployeeTasks
 * Fetches employee tasks
 */
export function useEmployeeTasks(useMock = true) {
  return useQuery({
    queryKey: ['employeeTasks'],
    queryFn: () => useMock ? Promise.resolve(mockEmployeeTasks) : fetchEmployeeTasks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: useUpdateTaskStatus
 * Mutation for updating task status with optimistic update
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status, comment }) => updateTaskStatus(taskId, status, comment),
    // Optimistic update
    onMutate: async ({ taskId, status, comment }) => {
      await queryClient.cancelQueries({ queryKey: ['employeeTasks'] });

      const previousTasks = queryClient.getQueryData(['employeeTasks']);

      queryClient.setQueryData(['employeeTasks'], (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === taskId) {
            const updatedTask = { ...task, status };
            if (comment) {
              updatedTask.comments = [
                ...task.comments,
                {
                  id: `C-${Date.now()}`,
                  text: comment,
                  author: 'You',
                  timestamp: new Date().toISOString(),
                },
              ];
            }
            return updatedTask;
          }
          return task;
        });
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['employeeTasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTasks'] });
    },
  });
}

/**
 * Hook: useUploadEvidence
 * Mutation for evidence upload with offline queue support
 */
export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadEvidence,
    onSuccess: () => {
      // Invalidate evidence queries
      queryClient.invalidateQueries({ queryKey: ['projectEvidence'] });
      queryClient.invalidateQueries({ queryKey: ['employeeKPIs'] });
    },
  });
}

/**
 * Hook: useUploadQueue
 * Manages offline evidence upload queue
 */
export function useUploadQueue() {
  const queryClient = useQueryClient();

  const addToQueue = (uploadItem) => {
    queryClient.setQueryData(['uploadQueue'], (old = []) => [
      ...old,
      {
        ...uploadItem,
        id: `QUEUE-${Date.now()}`,
        status: 'pending',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      },
    ]);
  };

  const updateQueueItem = (id, updates) => {
    queryClient.setQueryData(['uploadQueue'], (old = []) =>
      old.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeFromQueue = (id) => {
    queryClient.setQueryData(['uploadQueue'], (old = []) =>
      old.filter((item) => item.id !== id)
    );
  };

  const getQueue = () => {
    return queryClient.getQueryData(['uploadQueue']) || [];
  };

  return {
    queue: getQueue(),
    addToQueue,
    updateQueueItem,
    removeFromQueue,
  };
}
