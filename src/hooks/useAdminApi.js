import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Admin API Functions
 * Handles KPI weight management, calibration preview, and audit trails
 */

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch current KPI weights configuration
 */
export async function fetchWeightsConfig() {
  const response = await fetch('/api/admin/weights/config');
  if (!response.ok) throw new Error('Failed to fetch weights config');
  return response.json();
}

/**
 * Fetch weight history (all versions)
 */
export async function fetchWeightHistory() {
  const response = await fetch('/api/admin/weights/history');
  if (!response.ok) throw new Error('Failed to fetch weight history');
  return response.json();
}

/**
 * Save new weight configuration
 */
export async function saveWeightsConfig(data) {
  const response = await fetch('/api/admin/weights/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save weights config');
  return response.json();
}

/**
 * Rollback to previous weight version
 */
export async function rollbackWeights(versionId, metadata) {
  const response = await fetch(`/api/admin/weights/rollback/${versionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error('Failed to rollback weights');
  return response.json();
}

/**
 * Run calibration preview with new weights
 */
export async function runCalibrationPreview(weights) {
  const response = await fetch('/api/admin/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  });
  if (!response.ok) throw new Error('Failed to run calibration');
  return response.json();
}

/**
 * Fetch audit trail with filters
 */
export async function fetchAuditTrail(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/admin/audit?${query}`);
  if (!response.ok) throw new Error('Failed to fetch audit trail');
  return response.json();
}

// ============================================================================
// Mock Data
// ============================================================================

export const mockWeightsConfig = {
  version: 'v2.1',
  createdAt: '2025-12-01T10:00:00.000Z',
  createdBy: 'admin@example.com',
  categories: {
    hq_operations: {
      weight: 0.25,
      kpis: [
        { id: 'hq_reports', name: 'Field Reports Submitted', weight: 0.5 },
        { id: 'hq_compliance', name: 'Audit Compliance', weight: 0.5 },
      ],
    },
    field_operations: {
      weight: 0.30,
      kpis: [
        { id: 'field_inspections', name: 'Site Inspections', weight: 0.4 },
        { id: 'field_resolution', name: 'Issue Resolution Time', weight: 0.3 },
        { id: 'field_travel', name: 'Travel Compliance', weight: 0.15 },
        { id: 'field_expense', name: 'Field Expense Adherence', weight: 0.15 },
      ],
    },
    team_collaboration: {
      weight: 0.15,
      kpis: [
        { id: 'team_meetings', name: 'Meeting Participation', weight: 0.5 },
        { id: 'team_support', name: 'Peer Support', weight: 0.5 },
      ],
    },
    individual_behavior: {
      weight: 0.30,
      kpis: [
        { id: 'behavior_professionalism', name: 'Professionalism', weight: 0.2 },
        { id: 'behavior_initiative', name: 'Initiative & Proactiveness', weight: 0.2 },
        { id: 'behavior_quality', name: 'Quality of Work', weight: 0.2 },
        { id: 'behavior_attendance', name: 'Attendance & Punctuality', weight: 0.2 },
        { id: 'behavior_communication', name: 'Communication', weight: 0.2 },
      ],
    },
  },
};

export const mockWeightHistory = [
  {
    version: 'v2.1',
    createdAt: '2025-12-01T10:00:00.000Z',
    createdBy: 'admin@example.com',
    reason: 'Increased field operations weight based on Q4 review',
    changes: ['field_operations: 0.25 → 0.30', 'team_collaboration: 0.20 → 0.15'],
    isActive: true,
  },
  {
    version: 'v2.0',
    createdAt: '2025-10-15T14:30:00.000Z',
    createdBy: 'admin@example.com',
    reason: 'Rebalanced behavioral KPIs for consistency',
    changes: ['individual_behavior: 0.25 → 0.30', 'hq_operations: 0.30 → 0.25'],
    isActive: false,
  },
  {
    version: 'v1.5',
    createdAt: '2025-08-01T09:00:00.000Z',
    createdBy: 'supervisor@example.com',
    reason: 'Added new behavioral KPI: Communication',
    changes: ['Added behavior_communication with 0.2 weight'],
    isActive: false,
  },
];

export const mockCalibrationPreview = {
  summary: {
    employeesAnalyzed: 248,
    avgScoreChange: 2.3,
    impactedEmployees: 187,
    significantChanges: 42,
  },
  scoreDistribution: {
    before: {
      bins: [
        { range: '0-10', count: 2 },
        { range: '11-20', count: 5 },
        { range: '21-30', count: 12 },
        { range: '31-40', count: 18 },
        { range: '41-50', count: 28 },
        { range: '51-60', count: 42 },
        { range: '61-70', count: 58 },
        { range: '71-80', count: 52 },
        { range: '81-90', count: 24 },
        { range: '91-100', count: 7 },
      ],
      avgScore: 64.2,
      medianScore: 65,
    },
    after: {
      bins: [
        { range: '0-10', count: 1 },
        { range: '11-20', count: 4 },
        { range: '21-30', count: 10 },
        { range: '31-40', count: 15 },
        { range: '41-50', count: 25 },
        { range: '51-60', count: 45 },
        { range: '61-70', count: 62 },
        { range: '71-80', count: 55 },
        { range: '81-90', count: 26 },
        { range: '91-100', count: 5 },
      ],
      avgScore: 66.5,
      medianScore: 67,
    },
  },
  topImpacted: [
    {
      employeeId: 'EMP-123',
      name: 'Rajesh Kumar',
      division: 'Western Division',
      scoreBefore: 72,
      scoreAfter: 81,
      delta: +9,
      reason: 'Strong field operations performance benefited from weight increase',
    },
    {
      employeeId: 'EMP-456',
      name: 'Priya Sharma',
      division: 'Eastern Division',
      scoreBefore: 68,
      scoreAfter: 76,
      delta: +8,
      reason: 'Consistent field inspections',
    },
    {
      employeeId: 'EMP-789',
      name: 'Amit Patel',
      division: 'Northern Division',
      scoreBefore: 82,
      scoreAfter: 75,
      delta: -7,
      reason: 'Weaker in field operations, strong in team collaboration (reduced weight)',
    },
    {
      employeeId: 'EMP-234',
      name: 'Sunita Verma',
      division: 'Southern Division',
      scoreBefore: 65,
      scoreAfter: 72,
      delta: +7,
      reason: 'Improved field metrics',
    },
    {
      employeeId: 'EMP-567',
      name: 'Vikram Singh',
      division: 'Central Division',
      scoreBefore: 78,
      scoreAfter: 72,
      delta: -6,
      reason: 'Collaboration focus reduced impact',
    },
  ],
  kpiDeltaHeatmap: [
    {
      category: 'hq_operations',
      avgImpact: -1.2,
      employees: [
        { id: 'EMP-123', delta: -0.8 },
        { id: 'EMP-456', delta: -1.5 },
        { id: 'EMP-789', delta: -1.1 },
      ],
    },
    {
      category: 'field_operations',
      avgImpact: +3.8,
      employees: [
        { id: 'EMP-123', delta: +4.2 },
        { id: 'EMP-456', delta: +3.9 },
        { id: 'EMP-789', delta: +2.1 },
      ],
    },
    {
      category: 'team_collaboration',
      avgImpact: -2.1,
      employees: [
        { id: 'EMP-123', delta: -1.8 },
        { id: 'EMP-456', delta: -2.2 },
        { id: 'EMP-789', delta: -3.5 },
      ],
    },
    {
      category: 'individual_behavior',
      avgImpact: +0.5,
      employees: [
        { id: 'EMP-123', delta: +0.4 },
        { id: 'EMP-456', delta: +0.6 },
        { id: 'EMP-789', delta: +0.3 },
      ],
    },
  ],
};

export const mockAuditTrail = {
  total: 1247,
  page: 1,
  perPage: 50,
  entries: [
    {
      id: 'AUDIT-001',
      timestamp: '2025-12-04T09:15:00.000Z',
      actor: 'admin@example.com',
      actorName: 'Admin User',
      actionType: 'WEIGHT_UPDATE',
      target: 'field_operations',
      oldValue: '0.25',
      newValue: '0.30',
      comment: 'Increased field operations weight based on Q4 review',
      metadata: { version: 'v2.1', affectedEmployees: 248 },
    },
    {
      id: 'AUDIT-002',
      timestamp: '2025-12-04T09:14:30.000Z',
      actor: 'admin@example.com',
      actorName: 'Admin User',
      actionType: 'WEIGHT_UPDATE',
      target: 'team_collaboration',
      oldValue: '0.20',
      newValue: '0.15',
      comment: 'Rebalanced to accommodate field operations increase',
      metadata: { version: 'v2.1', affectedEmployees: 248 },
    },
    {
      id: 'AUDIT-003',
      timestamp: '2025-12-03T14:22:00.000Z',
      actor: 'supervisor@example.com',
      actorName: 'Supervisor User',
      actionType: 'CALIBRATION_PREVIEW',
      target: 'all_categories',
      oldValue: null,
      newValue: null,
      comment: 'Preview run for proposed weight changes',
      metadata: { avgScoreChange: 2.3, significantChanges: 42 },
    },
    {
      id: 'AUDIT-004',
      timestamp: '2025-12-02T11:45:00.000Z',
      actor: 'admin@example.com',
      actorName: 'Admin User',
      actionType: 'KPI_WEIGHT_UPDATE',
      target: 'field_inspections',
      oldValue: '0.35',
      newValue: '0.40',
      comment: 'Increased emphasis on site inspections',
      metadata: { category: 'field_operations', version: 'v2.0' },
    },
    {
      id: 'AUDIT-005',
      timestamp: '2025-12-01T16:30:00.000Z',
      actor: 'admin@example.com',
      actorName: 'Admin User',
      actionType: 'WEIGHT_ROLLBACK',
      target: 'v2.0',
      oldValue: 'v2.1-draft',
      newValue: 'v2.0',
      comment: 'Rolled back due to unexpected score distribution',
      metadata: { reason: 'Testing failed validation' },
    },
  ],
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook: useWeightsConfig
 * Fetch current weights configuration
 */
export function useWeightsConfig(useMock = true) {
  return useQuery({
    queryKey: ['weightsConfig'],
    queryFn: () => (useMock ? Promise.resolve(mockWeightsConfig) : fetchWeightsConfig()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: useWeightHistory
 * Fetch weight version history
 */
export function useWeightHistory(useMock = true) {
  return useQuery({
    queryKey: ['weightHistory'],
    queryFn: () => (useMock ? Promise.resolve(mockWeightHistory) : fetchWeightHistory()),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: useSaveWeights
 * Mutation for saving weights
 */
export function useSaveWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveWeightsConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightsConfig'] });
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
      queryClient.invalidateQueries({ queryKey: ['employeeKPIs'] });
    },
  });
}

/**
 * Hook: useRollbackWeights
 * Mutation for rolling back weights
 */
export function useRollbackWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versionId, metadata }) => rollbackWeights(versionId, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightsConfig'] });
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
    },
  });
}

/**
 * Hook: useCalibrationPreview
 * Mutation for running calibration preview
 */
export function useCalibrationPreview(useMock = true) {
  return useMutation({
    mutationFn: (weights) =>
      useMock ? Promise.resolve(mockCalibrationPreview) : runCalibrationPreview(weights),
  });
}

/**
 * Hook: useAuditTrail
 * Fetch audit trail with filters
 */
export function useAuditTrail(params = {}, useMock = true) {
  return useQuery({
    queryKey: ['auditTrail', params],
    queryFn: () => (useMock ? Promise.resolve(mockAuditTrail) : fetchAuditTrail(params)),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
