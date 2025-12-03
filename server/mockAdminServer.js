/**
 * Mock Admin Server
 * 
 * Express.js server providing mock endpoints for admin operations:
 * - Weight configuration management
 * - Calibration preview simulation
 * - Audit trail with filters
 * - Weight rollback
 * 
 * Run with: node server/mockAdminServer.js
 * Server runs on: http://localhost:3002
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let weightsConfig = {
  version: 'v2.1',
  lastModified: new Date('2025-01-15T10:30:00Z').toISOString(),
  modifiedBy: 'admin-003',
  modifiedByName: 'Anjali Sharma',
  categories: [
    {
      id: 'hq_operations',
      name: 'HQ Operations',
      weight: 0.25,
      kpis: [
        { id: 'reporting_timeliness', name: 'Reporting Timeliness', weight: 0.3 },
        { id: 'data_accuracy', name: 'Data Accuracy', weight: 0.4 },
        { id: 'process_adherence', name: 'Process Adherence', weight: 0.3 },
      ],
    },
    {
      id: 'field_operations',
      name: 'Field Operations',
      weight: 0.3,
      kpis: [
        { id: 'inspection_completion', name: 'Inspection Completion Rate', weight: 0.35 },
        { id: 'travel_efficiency', name: 'Travel Efficiency', weight: 0.25 },
        { id: 'quality_compliance', name: 'Quality Compliance', weight: 0.4 },
      ],
    },
    {
      id: 'team_collaboration',
      name: 'Team Collaboration',
      weight: 0.15,
      kpis: [
        { id: 'meeting_attendance', name: 'Meeting Attendance', weight: 0.4 },
        { id: 'peer_support', name: 'Peer Support', weight: 0.35 },
        { id: 'knowledge_sharing', name: 'Knowledge Sharing', weight: 0.25 },
      ],
    },
    {
      id: 'individual_behavior',
      name: 'Individual Behavior',
      weight: 0.3,
      kpis: [
        { id: 'punctuality', name: 'Punctuality', weight: 0.25 },
        { id: 'initiative', name: 'Initiative', weight: 0.35 },
        { id: 'professionalism', name: 'Professionalism', weight: 0.25 },
        { id: 'learning_development', name: 'Learning & Development', weight: 0.15 },
      ],
    },
  ],
};

let weightHistory = [
  {
    versionId: 'v2.1',
    timestamp: new Date('2025-01-15T10:30:00Z').toISOString(),
    modifiedBy: 'admin-003',
    modifiedByName: 'Anjali Sharma',
    comment: 'Increased field operations weight to 30% based on Q4 2024 review',
    status: 'active',
  },
  {
    versionId: 'v2.0',
    timestamp: new Date('2024-12-01T14:20:00Z').toISOString(),
    modifiedBy: 'admin-001',
    modifiedByName: 'Rajesh Kumar',
    comment: 'Quarterly weight adjustment - increased team collaboration emphasis',
    status: 'archived',
  },
  {
    versionId: 'v1.5',
    timestamp: new Date('2024-09-15T09:00:00Z').toISOString(),
    modifiedBy: 'admin-002',
    modifiedByName: 'Priya Patel',
    comment: 'Initial production weights based on pilot feedback',
    status: 'archived',
  },
];

let auditTrail = [
  {
    id: 'audit-1247',
    timestamp: new Date('2025-01-15T10:30:00Z').toISOString(),
    actor: 'admin-003',
    actorName: 'Anjali Sharma',
    actionType: 'WEIGHT_UPDATE',
    target: 'category:field_operations',
    oldValue: 0.28,
    newValue: 0.3,
    comment: 'Increased field operations weight to 30% based on Q4 2024 review',
    metadata: { versionId: 'v2.1', affectedEmployees: 248 },
  },
  {
    id: 'audit-1246',
    timestamp: new Date('2025-01-15T10:25:00Z').toISOString(),
    actor: 'admin-003',
    actorName: 'Anjali Sharma',
    actionType: 'CALIBRATION_PREVIEW',
    target: 'weight_config:v2.1-draft',
    oldValue: null,
    newValue: null,
    comment: 'Previewed calibration impact for field operations weight increase',
    metadata: { employeesAnalyzed: 248, avgScoreChange: 2.3, significantChanges: 18 },
  },
  {
    id: 'audit-1245',
    timestamp: new Date('2024-12-01T14:20:00Z').toISOString(),
    actor: 'admin-001',
    actorName: 'Rajesh Kumar',
    actionType: 'WEIGHT_UPDATE',
    target: 'category:team_collaboration',
    oldValue: 0.12,
    newValue: 0.15,
    comment: 'Quarterly weight adjustment - increased team collaboration emphasis',
    metadata: { versionId: 'v2.0', affectedEmployees: 242 },
  },
  {
    id: 'audit-1244',
    timestamp: new Date('2024-11-28T16:45:00Z').toISOString(),
    actor: 'admin-002',
    actorName: 'Priya Patel',
    actionType: 'WEIGHT_ROLLBACK',
    target: 'weight_config:v1.8',
    oldValue: 'v1.9',
    newValue: 'v1.8',
    comment: 'Rolled back due to unexpected score variance',
    metadata: { versionId: 'v1.8', reason: 'unexpected_variance' },
  },
  {
    id: 'audit-1243',
    timestamp: new Date('2024-09-15T09:00:00Z').toISOString(),
    actor: 'admin-002',
    actorName: 'Priya Patel',
    actionType: 'KPI_WEIGHT_UPDATE',
    target: 'kpi:reporting_timeliness',
    oldValue: 0.25,
    newValue: 0.3,
    comment: 'Initial production weights based on pilot feedback',
    metadata: { categoryId: 'hq_operations', versionId: 'v1.5' },
  },
];

// Generate audit ID
let auditIdCounter = 1248;
function generateAuditId() {
  return `audit-${auditIdCounter++}`;
}

// Log audit entry
function logAudit(actor, actorName, actionType, target, oldValue, newValue, comment, metadata = {}) {
  const entry = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    actor,
    actorName,
    actionType,
    target,
    oldValue,
    newValue,
    comment,
    metadata,
  };
  auditTrail.unshift(entry);
  return entry;
}

// ===== ENDPOINTS =====

/**
 * GET /api/admin/weights/config
 * Fetch current weight configuration
 */
app.get('/api/admin/weights/config', (req, res) => {
  res.json(weightsConfig);
});

/**
 * POST /api/admin/weights/config
 * Save new weight configuration
 * Body: { weights: {...}, reason: string, actor: string, actorName: string }
 */
app.post('/api/admin/weights/config', (req, res) => {
  const { weights, reason, actor, actorName } = req.body;

  if (!weights || !reason || !actor || !actorName) {
    return res.status(400).json({ error: 'Missing required fields: weights, reason, actor, actorName' });
  }

  // Validate weights sum to 1.0
  const categoryWeightSum = weights.categories.reduce((sum, cat) => sum + cat.weight, 0);
  if (Math.abs(categoryWeightSum - 1.0) > 0.001) {
    return res.status(400).json({ error: 'Category weights must sum to 1.0' });
  }

  // Validate KPI weights within each category
  for (const category of weights.categories) {
    const kpiWeightSum = category.kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    if (Math.abs(kpiWeightSum - 1.0) > 0.001) {
      return res.status(400).json({ error: `KPI weights in category ${category.name} must sum to 1.0` });
    }
  }

  // Generate new version
  const oldVersion = weightsConfig.version;
  const versionNumber = parseFloat(oldVersion.substring(1)) + 0.1;
  const newVersion = `v${versionNumber.toFixed(1)}`;

  // Archive old version
  weightHistory.unshift({
    versionId: weightsConfig.version,
    timestamp: weightsConfig.lastModified,
    modifiedBy: weightsConfig.modifiedBy,
    modifiedByName: weightsConfig.modifiedByName,
    comment: `Archived on ${new Date().toISOString()}`,
    status: 'archived',
  });

  // Update active config
  weightsConfig = {
    version: newVersion,
    lastModified: new Date().toISOString(),
    modifiedBy: actor,
    modifiedByName: actorName,
    categories: weights.categories,
  };

  // Add to history
  weightHistory.unshift({
    versionId: newVersion,
    timestamp: weightsConfig.lastModified,
    modifiedBy: actor,
    modifiedByName: actorName,
    comment: reason,
    status: 'active',
  });

  // Log audit
  logAudit(
    actor,
    actorName,
    'WEIGHT_UPDATE',
    `weight_config:${newVersion}`,
    oldVersion,
    newVersion,
    reason,
    { versionId: newVersion, affectedEmployees: 248 }
  );

  res.json({
    success: true,
    config: weightsConfig,
    message: `Weight configuration updated to ${newVersion}`,
  });
});

/**
 * GET /api/admin/weights/history
 * Fetch weight configuration history
 */
app.get('/api/admin/weights/history', (req, res) => {
  res.json({
    versions: weightHistory,
    total: weightHistory.length,
  });
});

/**
 * POST /api/admin/weights/rollback/:versionId
 * Rollback to a previous version
 * Body: { actor: string, actorName: string, reason: string }
 */
app.post('/api/admin/weights/rollback/:versionId', (req, res) => {
  const { versionId } = req.params;
  const { actor, actorName, reason } = req.body;

  if (!actor || !actorName || !reason) {
    return res.status(400).json({ error: 'Missing required fields: actor, actorName, reason' });
  }

  // Find version in history
  const version = weightHistory.find((v) => v.versionId === versionId);
  if (!version) {
    return res.status(404).json({ error: `Version ${versionId} not found` });
  }

  // Archive current version
  const oldVersion = weightsConfig.version;
  weightHistory.unshift({
    versionId: weightsConfig.version,
    timestamp: weightsConfig.lastModified,
    modifiedBy: weightsConfig.modifiedBy,
    modifiedByName: weightsConfig.modifiedByName,
    comment: `Archived before rollback to ${versionId}`,
    status: 'archived',
  });

  // Restore version (in real system, would fetch full config from database)
  weightsConfig = {
    ...weightsConfig,
    version: versionId,
    lastModified: new Date().toISOString(),
    modifiedBy: actor,
    modifiedByName: actorName,
  };

  // Update history
  version.status = 'active';

  // Log audit
  logAudit(
    actor,
    actorName,
    'WEIGHT_ROLLBACK',
    `weight_config:${versionId}`,
    oldVersion,
    versionId,
    reason,
    { versionId, reason }
  );

  res.json({
    success: true,
    config: weightsConfig,
    message: `Rolled back to version ${versionId}`,
  });
});

/**
 * POST /api/admin/calibrate
 * Run calibration preview simulation
 * Body: { weights: {...}, actor: string, actorName: string }
 */
app.post('/api/admin/calibrate', (req, res) => {
  const { weights, actor, actorName } = req.body;

  if (!weights) {
    return res.status(400).json({ error: 'Missing required field: weights' });
  }

  // Simulate calibration (in real system, would recalculate all employee scores)
  const mockCalibration = {
    employeesAnalyzed: 248,
    avgScoreChange: 2.3,
    scoreDistribution: {
      before: [
        { bin: '0-10', count: 2 },
        { bin: '10-20', count: 5 },
        { bin: '20-30', count: 12 },
        { bin: '30-40', count: 28 },
        { bin: '40-50', count: 45 },
        { bin: '50-60', count: 62 },
        { bin: '60-70', count: 48 },
        { bin: '70-80', count: 32 },
        { bin: '80-90', count: 12 },
        { bin: '90-100', count: 2 },
      ],
      after: [
        { bin: '0-10', count: 1 },
        { bin: '10-20', count: 4 },
        { bin: '20-30', count: 10 },
        { bin: '30-40', count: 25 },
        { bin: '40-50', count: 42 },
        { bin: '50-60', count: 58 },
        { bin: '60-70', count: 55 },
        { bin: '70-80', count: 38 },
        { bin: '80-90', count: 13 },
        { bin: '90-100', count: 2 },
      ],
    },
    topImpacted: [
      {
        employeeId: 'emp-042',
        employeeName: 'Rajesh Kumar',
        division: 'East Zone',
        scoreBefore: 68,
        scoreAfter: 77,
        delta: 9,
        reason: 'Strong field operations performance benefits from increased weight',
      },
      {
        employeeId: 'emp-128',
        employeeName: 'Priya Sharma',
        division: 'West Zone',
        scoreBefore: 72,
        scoreAfter: 65,
        delta: -7,
        reason: 'Lower team collaboration scores impacted by weight shift',
      },
      {
        employeeId: 'emp-215',
        employeeName: 'Amit Patel',
        division: 'North Zone',
        scoreBefore: 55,
        scoreAfter: 61,
        delta: 6,
        reason: 'Above-average individual behavior scores gain weight',
      },
      {
        employeeId: 'emp-089',
        employeeName: 'Anjali Singh',
        division: 'South Zone',
        scoreBefore: 64,
        scoreAfter: 58,
        delta: -6,
        reason: 'HQ operations performance below par, affected by weight reduction',
      },
      {
        employeeId: 'emp-156',
        employeeName: 'Vikram Reddy',
        division: 'Central Zone',
        scoreBefore: 59,
        scoreAfter: 64,
        delta: 5,
        reason: 'Consistent field work benefits from increased weight',
      },
    ],
    kpiImpactHeatmap: [
      { categoryId: 'hq_operations', categoryName: 'HQ Operations', avgImpact: -1.2, employeesAffected: 85 },
      { categoryId: 'field_operations', categoryName: 'Field Operations', avgImpact: 3.8, employeesAffected: 142 },
      { categoryId: 'team_collaboration', categoryName: 'Team Collaboration', avgImpact: 0.5, employeesAffected: 68 },
      { categoryId: 'individual_behavior', categoryName: 'Individual Behavior', avgImpact: -0.8, employeesAffected: 95 },
    ],
    significantChanges: 18,
  };

  // Log audit if actor provided
  if (actor && actorName) {
    logAudit(
      actor,
      actorName,
      'CALIBRATION_PREVIEW',
      'weight_config:preview',
      null,
      null,
      'Previewed calibration impact',
      {
        employeesAnalyzed: mockCalibration.employeesAnalyzed,
        avgScoreChange: mockCalibration.avgScoreChange,
        significantChanges: mockCalibration.significantChanges,
      }
    );
  }

  res.json(mockCalibration);
});

/**
 * GET /api/admin/audit
 * Fetch audit trail with filters
 * Query params: page, perPage, search, actionType, actor, dateFrom, dateTo
 */
app.get('/api/admin/audit', (req, res) => {
  const {
    page = 1,
    perPage = 50,
    search = '',
    actionType,
    actor,
    dateFrom,
    dateTo,
  } = req.query;

  let filtered = [...auditTrail];

  // Filter by search (actor, target, comment)
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (entry) =>
        entry.actorName.toLowerCase().includes(searchLower) ||
        entry.target.toLowerCase().includes(searchLower) ||
        entry.comment.toLowerCase().includes(searchLower)
    );
  }

  // Filter by action type
  if (actionType && actionType !== 'all') {
    filtered = filtered.filter((entry) => entry.actionType === actionType);
  }

  // Filter by actor
  if (actor) {
    filtered = filtered.filter((entry) => entry.actor === actor);
  }

  // Filter by date range
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filtered = filtered.filter((entry) => new Date(entry.timestamp) >= fromDate);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter((entry) => new Date(entry.timestamp) <= toDate);
  }

  // Paginate
  const total = filtered.length;
  const pageNum = parseInt(page, 10);
  const perPageNum = parseInt(perPage, 10);
  const start = (pageNum - 1) * perPageNum;
  const end = start + perPageNum;
  const paginated = filtered.slice(start, end);

  res.json({
    entries: paginated,
    total,
    page: pageNum,
    perPage: perPageNum,
    totalPages: Math.ceil(total / perPageNum),
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mockAdminServer',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/admin/weights/config',
      'POST /api/admin/weights/config',
      'GET /api/admin/weights/history',
      'POST /api/admin/weights/rollback/:versionId',
      'POST /api/admin/calibrate',
      'GET /api/admin/audit',
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Admin Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - GET  /api/admin/weights/config`);
  console.log(`   - POST /api/admin/weights/config`);
  console.log(`   - GET  /api/admin/weights/history`);
  console.log(`   - POST /api/admin/weights/rollback/:versionId`);
  console.log(`   - POST /api/admin/calibrate`);
  console.log(`   - GET  /api/admin/audit`);
  console.log(`   - GET  /health`);
});
