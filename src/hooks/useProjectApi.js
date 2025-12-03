/**
 * Project Dashboard API Functions
 * 
 * API Contracts:
 * - GET /api/projects/:projectId/meta
 * - GET /api/projects/:projectId/milestones
 * - GET /api/projects/:projectId/kpis
 * - GET /api/projects/:projectId/evidence?cursor=&limit=20
 * - PATCH /api/evidence/:evidenceId/verify
 * - PATCH /api/milestones/:milestoneId
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch Project Metadata
 * GET /api/projects/:projectId/meta
 * 
 * Returns: {
 *   id, name, division_id, division_name, 
 *   health_score, start_date, end_date
 * }
 */
export async function fetchProjectMeta(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/meta`);
  if (!response.ok) throw new Error('Failed to fetch project metadata');
  return response.json();
}

/**
 * Fetch Project Milestones
 * GET /api/projects/:projectId/milestones
 * 
 * Returns: [{
 *   id, title, start_date, end_date, 
 *   status: 'completed' | 'in-progress' | 'delayed', 
 *   dependencies: []
 * }]
 */
export async function fetchProjectMilestones(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones`);
  if (!response.ok) throw new Error('Failed to fetch milestones');
  return response.json();
}

/**
 * Fetch Project KPIs
 * GET /api/projects/:projectId/kpis
 * 
 * Returns: [{
 *   id, name, value, target, unit, trend: [],
 *   weight_version, last_compute, category
 * }]
 */
export async function fetchProjectKPIs(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/kpis`);
  if (!response.ok) throw new Error('Failed to fetch KPIs');
  return response.json();
}

/**
 * Fetch Evidence Feed (Paginated)
 * GET /api/projects/:projectId/evidence?cursor=xyz&limit=20
 * 
 * Returns: {
 *   items: [{
 *     id, type, title, description, uploaded_by,
 *     uploaded_at, geo_tag: {lat, lng}, image_url,
 *     tags: [], verified, completeness_score
 *   }],
 *   next_cursor: string | null
 * }
 */
export async function fetchProjectEvidence({ projectId, cursor, limit = 20 }) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor);
  
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/evidence?${params.toString()}`
  );
  if (!response.ok) throw new Error('Failed to fetch evidence');
  return response.json();
}

/**
 * Verify Evidence (Optimistic Update)
 * PATCH /api/evidence/:evidenceId/verify
 * 
 * Body: { verified: boolean }
 * Returns: { id, verified, verified_by, verified_at }
 */
export async function verifyEvidence(evidenceId, verified) {
  const response = await fetch(`${API_BASE_URL}/evidence/${evidenceId}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified }),
  });
  if (!response.ok) throw new Error('Failed to verify evidence');
  return response.json();
}

/**
 * Update Milestone
 * PATCH /api/milestones/:milestoneId
 * 
 * Body: { start_date?, end_date?, status? }
 * Returns: updated milestone
 */
export async function updateMilestone(milestoneId, updates) {
  const response = await fetch(`${API_BASE_URL}/milestones/${milestoneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update milestone');
  return response.json();
}

/**
 * Mock Data for Development
 */
export const mockProjectMeta = {
  id: 'PROJ-001',
  name: 'Smart Infrastructure Modernization',
  division_id: 'DIV-001',
  division_name: 'Infrastructure Division',
  health_score: 82.5,
  start_date: '2025-01-15',
  end_date: '2025-12-31',
};

export const mockProjectMilestones = [
  {
    id: 'MS-001',
    title: 'Requirements Gathering',
    start_date: '2025-01-15',
    end_date: '2025-02-28',
    status: 'completed',
    dependencies: [],
    progress: 100,
  },
  {
    id: 'MS-002',
    title: 'Design & Architecture',
    start_date: '2025-03-01',
    end_date: '2025-04-30',
    status: 'completed',
    dependencies: ['MS-001'],
    progress: 100,
  },
  {
    id: 'MS-003',
    title: 'Phase 1 Implementation',
    start_date: '2025-05-01',
    end_date: '2025-08-31',
    status: 'in-progress',
    dependencies: ['MS-002'],
    progress: 65,
  },
  {
    id: 'MS-004',
    title: 'Testing & QA',
    start_date: '2025-09-01',
    end_date: '2025-10-31',
    status: 'delayed',
    dependencies: ['MS-003'],
    progress: 30,
  },
  {
    id: 'MS-005',
    title: 'Deployment & Handover',
    start_date: '2025-11-01',
    end_date: '2025-12-31',
    status: 'not-started',
    dependencies: ['MS-004'],
    progress: 0,
  },
];

export const mockProjectKPIs = [
  {
    id: 'KPI-001',
    name: 'Budget Utilization',
    value: 78.5,
    target: 85,
    unit: '%',
    trend: [65, 68, 72, 75, 78.5],
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    category: 'Financial',
  },
  {
    id: 'KPI-002',
    name: 'Milestone Completion',
    value: 68,
    target: 75,
    unit: '%',
    trend: [50, 55, 60, 65, 68],
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    category: 'Progress',
  },
  {
    id: 'KPI-003',
    name: 'Team Productivity',
    value: 85,
    target: 80,
    unit: 'pts',
    trend: [75, 78, 82, 84, 85],
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    category: 'Performance',
  },
  {
    id: 'KPI-004',
    name: 'Quality Score',
    value: 92,
    target: 90,
    unit: '%',
    trend: [88, 89, 90, 91, 92],
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    category: 'Quality',
  },
];

export const mockProjectEvidence = {
  items: [
    {
      id: 'EVD-001',
      type: 'image',
      title: 'Site Survey - Building A',
      description: 'Initial site assessment completed',
      uploaded_by: 'Rajesh Kumar',
      uploaded_at: '2025-12-01T10:30:00Z',
      geo_tag: { lat: 28.6139, lng: 77.2090 },
      image_url: 'https://picsum.photos/seed/evd1/400/300',
      tags: ['survey', 'building-a', 'phase-1'],
      verified: true,
      completeness_score: 95,
    },
    {
      id: 'EVD-002',
      type: 'document',
      title: 'Design Approval Document',
      description: 'Approved by stakeholder committee',
      uploaded_by: 'Priya Sharma',
      uploaded_at: '2025-11-28T14:20:00Z',
      geo_tag: null,
      image_url: 'https://picsum.photos/seed/evd2/400/300',
      tags: ['approval', 'design', 'documentation'],
      verified: true,
      completeness_score: 100,
    },
    {
      id: 'EVD-003',
      type: 'image',
      title: 'Foundation Work Progress',
      description: 'Week 3 progress photo',
      uploaded_by: 'Amit Patel',
      uploaded_at: '2025-11-25T09:15:00Z',
      geo_tag: { lat: 28.6142, lng: 77.2095 },
      image_url: 'https://picsum.photos/seed/evd3/400/300',
      tags: ['construction', 'foundation', 'progress'],
      verified: false,
      completeness_score: 80,
    },
    {
      id: 'EVD-004',
      type: 'image',
      title: 'Quality Inspection Report',
      description: 'Third-party inspection results',
      uploaded_by: 'Sneha Reddy',
      uploaded_at: '2025-11-20T16:45:00Z',
      geo_tag: null,
      image_url: 'https://picsum.photos/seed/evd4/400/300',
      tags: ['quality', 'inspection', 'compliance'],
      verified: true,
      completeness_score: 100,
    },
    {
      id: 'EVD-005',
      type: 'image',
      title: 'Material Delivery Receipt',
      description: 'Steel beams delivered on schedule',
      uploaded_by: 'Vikram Singh',
      uploaded_at: '2025-11-18T11:30:00Z',
      geo_tag: { lat: 28.6138, lng: 77.2088 },
      image_url: 'https://picsum.photos/seed/evd5/400/300',
      tags: ['logistics', 'materials', 'procurement'],
      verified: false,
      completeness_score: 75,
    },
  ],
  next_cursor: 'cursor_page2',
};
