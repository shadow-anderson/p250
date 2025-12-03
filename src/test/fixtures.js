/**
 * Mock API Fixtures for Development and Testing
 * 
 * These fixtures simulate the expected API responses
 * Use these for development before backend is ready
 */

/**
 * Mock Organization Pulse Response
 * GET /api/kpis/org?period=30d
 */
export const mockOrgPulseResponse = {
  score: 78.5,
  trend: [72, 73, 75, 74, 76, 78, 79, 77, 78, 78.5],
  breakdown: {
    hq: 82.3,
    field: 75.1,
  },
  weight_version: 'v2.1',
  last_compute: '2025-12-03T15:30:00Z',
};

/**
 * Mock Risks Response
 * GET /api/risks?limit=10&sort=severity
 */
export const mockRisksResponse = [
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
  {
    id: 'RISK-006',
    title: 'Technical debt accumulation in legacy systems',
    severity: 0.64,
    confidence: 0.88,
    evidence_count: 11,
  },
  {
    id: 'RISK-007',
    title: 'Vendor dependency causing delays',
    severity: 0.59,
    confidence: 0.72,
    evidence_count: 5,
  },
  {
    id: 'RISK-008',
    title: 'Training backlog affecting productivity',
    severity: 0.52,
    confidence: 0.79,
    evidence_count: 7,
  },
  {
    id: 'RISK-009',
    title: 'Documentation gaps in critical modules',
    severity: 0.48,
    confidence: 0.81,
    evidence_count: 4,
  },
  {
    id: 'RISK-010',
    title: 'Minor process inefficiencies identified',
    severity: 0.35,
    confidence: 0.68,
    evidence_count: 3,
  },
];

/**
 * Mock Report Generation Response
 * POST /api/reports/generate
 */
export const mockReportGenerateResponse = {
  jobId: 'JOB-2025-12-03-001',
};

/**
 * Mock Report Job Status Responses
 * GET /api/reports/job/:jobId
 */
export const mockReportJobPending = {
  status: 'pending',
  progress: 0,
};

export const mockReportJobProcessing = {
  status: 'processing',
  progress: 45,
  message: 'Aggregating performance data...',
};

export const mockReportJobCompleted = {
  status: 'completed',
  progress: 100,
  url_signed_pdf: 'https://storage.example.com/reports/APAR-2025-signed.pdf',
  expires_at: '2025-12-10T15:30:00Z',
};

export const mockReportJobFailed = {
  status: 'failed',
  error: 'Insufficient data for selected period',
};

/**
 * Mock Employee Data for Export
 */
export const mockEmployees = [
  { id: 'EMP001', name: 'Rajesh Kumar', designation: 'Senior Engineer', division: 'Engineering' },
  { id: 'EMP002', name: 'Priya Sharma', designation: 'Project Manager', division: 'Operations' },
  { id: 'EMP003', name: 'Amit Patel', designation: 'Team Lead', division: 'Engineering' },
  { id: 'EMP004', name: 'Sneha Reddy', designation: 'Analyst', division: 'Strategy' },
  { id: 'EMP005', name: 'Vikram Singh', designation: 'Division Head', division: 'Infrastructure' },
  { id: 'EMP006', name: 'Anjali Desai', designation: 'Senior Developer', division: 'Engineering' },
  { id: 'EMP007', name: 'Arjun Menon', designation: 'QA Lead', division: 'Quality' },
  { id: 'EMP008', name: 'Kavita Nair', designation: 'Business Analyst', division: 'Strategy' },
  { id: 'EMP009', name: 'Rahul Gupta', designation: 'DevOps Engineer', division: 'Infrastructure' },
  { id: 'EMP010', name: 'Meera Iyer', designation: 'UX Designer', division: 'Design' },
];

/**
 * Mock Evidence Feed for a Risk
 */
export const mockRiskEvidence = {
  'RISK-001': [
    {
      id: 'EVD-001',
      type: 'Milestone Slip',
      date: '2025-12-01',
      description: 'Task XYZ delayed by 3 days due to resource constraints',
      severity: 'high',
    },
    {
      id: 'EVD-002',
      type: 'Resource Issue',
      date: '2025-11-28',
      description: 'Key team member on unplanned leave',
      severity: 'medium',
    },
    {
      id: 'EVD-003',
      type: 'Dependency Block',
      date: '2025-11-25',
      description: 'Waiting on external vendor API integration',
      severity: 'high',
    },
  ],
};
