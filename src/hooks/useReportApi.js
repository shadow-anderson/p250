import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3003'; // Report generation server

/**
 * API Functions
 */

/**
 * Generate APAR report
 * @param {Object} params
 * @param {string[]} params.employeeIds - Array of employee IDs
 * @param {string} params.startDate - Start date (ISO 8601)
 * @param {string} params.endDate - End date (ISO 8601)
 * @returns {Promise<{jobId: string, status: string}>}
 */
export async function generateReport({ employeeIds, startDate, endDate }) {
  const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeIds,
      startDate,
      endDate,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start report generation');
  }

  return response.json();
}

/**
 * Fetch job status
 * @param {string} jobId - Job ID
 * @returns {Promise<{status: string, progress: number, reports?: Array}>}
 */
export async function fetchJobStatus(jobId) {
  if (!jobId) return null;

  const response = await fetch(`${API_BASE_URL}/api/reports/job/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch job status');
  }

  return response.json();
}

/**
 * Download report
 * @param {string} reportId - Report ID
 * @returns {Promise<Blob>}
 */
export async function downloadReport(reportId) {
  const response = await fetch(`${API_BASE_URL}/api/reports/download/${reportId}`);

  if (!response.ok) {
    throw new Error('Failed to download report');
  }

  return response.blob();
}

/**
 * Verify signature
 * @param {string} reportId - Report ID
 * @returns {Promise<{valid: boolean, signer: string, timestamp: string}>}
 */
export async function verifySignature(reportId) {
  const response = await fetch(`${API_BASE_URL}/api/reports/verify/${reportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify signature');
  }

  return response.json();
}

/**
 * List generated reports
 * @param {Object} params
 * @param {number} params.page - Page number
 * @param {number} params.perPage - Items per page
 * @returns {Promise<{reports: Array, total: number}>}
 */
export async function listReports({ page = 1, perPage = 20 } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports?page=${page}&perPage=${perPage}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
}

/**
 * React Query Hooks
 */

/**
 * useGenerateReport Hook
 * Mutation for generating APAR reports
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * useFetchJobStatus Hook
 * Query for polling job status
 * 
 * @param {string} jobId - Job ID
 * @param {Object} options - Additional query options
 */
export function useFetchJobStatus(jobId, options = {}) {
  return useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: () => fetchJobStatus(jobId),
    enabled: !!jobId,
    staleTime: 0, // Always fetch fresh data
    ...options,
  });
}

/**
 * useDownloadReport Hook
 * Mutation for downloading report
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: downloadReport,
    onSuccess: (blob, reportId) => {
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `APAR_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

/**
 * useVerifySignature Hook
 * Query for verifying report signature
 * 
 * @param {string} reportId - Report ID
 * @param {Object} options - Additional query options
 */
export function useVerifySignature(reportId, options = {}) {
  return useQuery({
    queryKey: ['signature', reportId],
    queryFn: () => verifySignature(reportId),
    enabled: !!reportId,
    staleTime: Infinity, // Signature doesn't change
    ...options,
  });
}

/**
 * useListReports Hook
 * Query for listing generated reports
 * 
 * @param {Object} params - Query parameters
 */
export function useListReports(params = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => listReports(params),
    staleTime: 30000, // 30 seconds
  });
}
