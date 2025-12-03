import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchOrgPulse, 
  fetchRisks, 
  generateReport, 
  fetchReportJob,
  queryKeys,
  mockOrgPulse,
  mockRisks,
} from './useApi';

/**
 * Hook: useOrgPulse
 * Fetches organization pulse data with caching
 * Cache: 5 minutes
 */
export function useOrgPulse(period = '30d', useMock = true) {
  return useQuery({
    queryKey: queryKeys.orgPulse(period),
    queryFn: () => useMock ? Promise.resolve(mockOrgPulse) : fetchOrgPulse(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: useRisks
 * Fetches top risks with server-side sorting
 * Cache: 1 minute
 */
export function useRisks({ limit = 10, sort = 'severity' } = {}, useMock = true) {
  return useQuery({
    queryKey: queryKeys.risks(limit, sort),
    queryFn: () => useMock ? Promise.resolve(mockRisks) : fetchRisks({ limit, sort }),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: useGenerateReport
 * Mutation hook for generating APAR reports
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      // Invalidate relevant queries after report generation
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook: useReportJob
 * Polls report job status
 * Refetch interval: 2 seconds when status is pending/processing
 */
export function useReportJob(jobId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportJob(jobId),
    queryFn: () => fetchReportJob(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

/**
 * Hook: useIntersectionObserver
 * Lazy-load components when they enter viewport
 */
export function useIntersectionObserver(ref, options = {}) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isVisible;
}
