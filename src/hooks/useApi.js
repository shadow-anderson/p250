/**
 * API Query Keys
 * Centralized query key factory for TanStack Query
 */
export const queryKeys = {
  orgPulse: (period = '30d') => ['orgPulse', period],
  risks: (limit = 10, sort = 'severity') => ['risks', { limit, sort }],
  reportJob: (jobId) => ['reportJob', jobId],
};

/**
 * API Base URL - adjust for your backend
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch Organization Pulse Data
 * GET /api/kpis/org?period=30d
 * 
 * Returns: {score: number, trend: number[], breakdown: {hq: number, field: number}}
 */
export async function fetchOrgPulse(period = '30d') {
  const response = await fetch(`${API_BASE_URL}/kpis/org?period=${period}`);
  if (!response.ok) {
    throw new Error('Failed to fetch org pulse data');
  }
  return response.json();
}

/**
 * Fetch Top Risks
 * GET /api/risks?limit=10&sort=severity
 * 
 * Returns: [{id, title, severity, confidence, evidence_count}]
 */
export async function fetchRisks({ limit = 10, sort = 'severity' } = {}) {
  const response = await fetch(`${API_BASE_URL}/risks?limit=${limit}&sort=${sort}`);
  if (!response.ok) {
    throw new Error('Failed to fetch risks');
  }
  return response.json();
}

/**
 * Generate APAR Report
 * POST /api/reports/generate
 * Body: {employeeIds: string[], from: 'YYYY-MM-DD', to: 'YYYY-MM-DD'}
 * 
 * Returns: {jobId: string}
 */
export async function generateReport({ employeeIds, from, to }) {
  const response = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeIds, from, to }),
  });
  if (!response.ok) {
    throw new Error('Failed to generate report');
  }
  return response.json();
}

/**
 * Get Report Job Status
 * GET /api/reports/job/:jobId
 * 
 * Returns: {status: 'pending'|'processing'|'completed'|'failed', url_signed_pdf?: string}
 */
export async function fetchReportJob(jobId) {
  const response = await fetch(`${API_BASE_URL}/reports/job/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch report job status');
  }
  return response.json();
}

/**
 * Mock Data for Development
 * Remove these when connecting to real backend
 */
export const mockOrgPulse = {
  score: 78.5,
  trend: [72, 73, 75, 74, 76, 78, 79, 77, 78, 78.5],
  breakdown: {
    hq: 82.3,
    field: 75.1,
  },
  weight_version: 'v2.1',
  last_compute: '2025-12-03T15:30:00Z',
};

export const mockRisks = [
  {
    id: 'RISK-001',
    title: 'Delayed milestone delivery in Project Alpha',
    severity: 0.92,
    confidence: 0.85,
    evidence_count: 12,
  },
  {
    id: 'RISK-002',
    title: 'Budget overrun in Infrastructure Division',
    severity: 0.87,
    confidence: 0.78,
    evidence_count: 8,
  },
  {
    id: 'RISK-003',
    title: 'Resource allocation conflict across teams',
    severity: 0.79,
    confidence: 0.91,
    evidence_count: 15,
  },
  {
    id: 'RISK-004',
    title: 'Compliance documentation incomplete',
    severity: 0.75,
    confidence: 0.82,
    evidence_count: 6,
  },
  {
    id: 'RISK-005',
    title: 'Stakeholder communication gap identified',
    severity: 0.68,
    confidence: 0.75,
    evidence_count: 9,
  },
];
