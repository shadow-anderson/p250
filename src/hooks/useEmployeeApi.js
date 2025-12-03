/**
 * Employee Dashboard API Functions
 * 
 * API Contracts:
 * - GET /api/employees/me - Current employee data
 * - GET /api/employees/me/kpis - Employee KPIs
 * - GET /api/employees/me/tasks - Tasks assigned to employee
 * - PATCH /api/tasks/:taskId - Update task status
 * - POST /api/evidence/upload - Upload evidence with offline queue
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch Current Employee Data
 * GET /api/employees/me
 * 
 * Returns: {
 *   id, name, designation, division_id, team_id,
 *   email, current_score, avatar_url
 * }
 */
export async function fetchEmployeeData() {
  const response = await fetch(`${API_BASE_URL}/employees/me`);
  if (!response.ok) throw new Error('Failed to fetch employee data');
  return response.json();
}

/**
 * Fetch Employee KPIs
 * GET /api/employees/me/kpis
 * 
 * Returns: [{
 *   id, name, value, target, unit, category,
 *   weight_version, last_compute, trend: []
 * }]
 */
export async function fetchEmployeeKPIs() {
  const response = await fetch(`${API_BASE_URL}/employees/me/kpis`);
  if (!response.ok) throw new Error('Failed to fetch employee KPIs');
  return response.json();
}

/**
 * Fetch Employee Tasks
 * GET /api/employees/me/tasks
 * 
 * Returns: [{
 *   id, title, description, status: 'pending' | 'in-progress' | 'completed',
 *   due_date, priority: 'low' | 'medium' | 'high',
 *   project_id, project_name, comments: []
 * }]
 */
export async function fetchEmployeeTasks() {
  const response = await fetch(`${API_BASE_URL}/employees/me/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

/**
 * Update Task Status
 * PATCH /api/tasks/:taskId
 * 
 * Body: { status, comment? }
 * Returns: updated task
 */
export async function updateTaskStatus(taskId, status, comment = null) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

/**
 * Upload Evidence
 * POST /api/evidence/upload
 * 
 * Body: FormData with file, title, description, tags, geo_tag
 * Returns: { id, url, status }
 */
export async function uploadEvidence(formData) {
  const response = await fetch(`${API_BASE_URL}/evidence/upload`, {
    method: 'POST',
    body: formData, // FormData auto-sets Content-Type
  });
  if (!response.ok) throw new Error('Failed to upload evidence');
  return response.json();
}

/**
 * Mock Data for Development
 */
export const mockEmployeeData = {
  id: 'EMP-001',
  name: 'Rajesh Kumar',
  designation: 'Senior Engineer',
  division_id: 'DIV-001',
  division_name: 'Infrastructure Division',
  team_id: 'TEAM-001',
  email: 'rajesh.kumar@prabhaav.gov.in',
  current_score: 82.5,
  avatar_url: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=2563eb&color=fff',
};

export const mockEmployeeKPIs = [
  // HQ Operations
  {
    id: 'KPI-E-001',
    name: 'Documentation Compliance',
    value: 88,
    target: 90,
    unit: '%',
    category: 'hq_operations',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [82, 84, 86, 87, 88],
  },
  {
    id: 'KPI-E-002',
    name: 'Report Submission Timeliness',
    value: 92,
    target: 95,
    unit: '%',
    category: 'hq_operations',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [88, 89, 90, 91, 92],
  },
  // Field Operations
  {
    id: 'KPI-E-003',
    name: 'Site Visit Completion',
    value: 78,
    target: 80,
    unit: '%',
    category: 'field_operations',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [70, 73, 75, 76, 78],
  },
  {
    id: 'KPI-E-004',
    name: 'Field Evidence Uploads',
    value: 85,
    target: 90,
    unit: 'count',
    category: 'field_operations',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [75, 78, 80, 83, 85],
  },
  // Team Collaboration
  {
    id: 'KPI-E-005',
    name: 'Knowledge Sharing Sessions',
    value: 7,
    target: 8,
    unit: 'sessions',
    category: 'team_collaboration',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [5, 5, 6, 6, 7],
  },
  {
    id: 'KPI-E-006',
    name: 'Peer Support Rating',
    value: 4.2,
    target: 4.5,
    unit: '/5',
    category: 'team_collaboration',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [3.8, 3.9, 4.0, 4.1, 4.2],
  },
  // Individual Behavior (0-3 rubric)
  {
    id: 'KPI-E-007',
    name: 'Professionalism & Ethics',
    value: 3,
    target: 3,
    unit: 'rubric',
    category: 'individual_behavior',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [2, 2, 3, 3, 3],
  },
  {
    id: 'KPI-E-008',
    name: 'Initiative & Proactiveness',
    value: 2.5,
    target: 3,
    unit: 'rubric',
    category: 'individual_behavior',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [2, 2, 2, 2.5, 2.5],
  },
  {
    id: 'KPI-E-009',
    name: 'Quality of Work',
    value: 3,
    target: 3,
    unit: 'rubric',
    category: 'individual_behavior',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [2, 2.5, 2.5, 3, 3],
  },
  {
    id: 'KPI-E-010',
    name: 'Attendance & Punctuality',
    value: 2.5,
    target: 3,
    unit: 'rubric',
    category: 'individual_behavior',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [2, 2, 2.5, 2.5, 2.5],
  },
  {
    id: 'KPI-E-011',
    name: 'Communication Skills',
    value: 2.5,
    target: 3,
    unit: 'rubric',
    category: 'individual_behavior',
    weight_version: 'v2.1',
    last_compute: '2025-12-03T15:30:00Z',
    trend: [2, 2.5, 2.5, 2.5, 2.5],
  },
];

export const mockEmployeeTasks = [
  {
    id: 'TASK-001',
    title: 'Complete Q4 Progress Report',
    description: 'Compile all project activities and submit to division head',
    status: 'in-progress',
    due_date: '2025-12-15',
    priority: 'high',
    project_id: 'PROJ-001',
    project_name: 'Smart Infrastructure Modernization',
    comments: [
      { id: 'C1', text: 'Started drafting', author: 'Rajesh Kumar', timestamp: '2025-12-01T10:00:00Z' },
    ],
  },
  {
    id: 'TASK-002',
    title: 'Site Inspection - Building A',
    description: 'Conduct monthly safety inspection and upload photos',
    status: 'pending',
    due_date: '2025-12-10',
    priority: 'high',
    project_id: 'PROJ-001',
    project_name: 'Smart Infrastructure Modernization',
    comments: [],
  },
  {
    id: 'TASK-003',
    title: 'Update Training Documentation',
    description: 'Add new procedures to the team knowledge base',
    status: 'pending',
    due_date: '2025-12-20',
    priority: 'medium',
    project_id: 'PROJ-002',
    project_name: 'Knowledge Management System',
    comments: [],
  },
  {
    id: 'TASK-004',
    title: 'Peer Review - Design Document',
    description: 'Review and provide feedback on Phase 2 design',
    status: 'completed',
    due_date: '2025-11-30',
    priority: 'medium',
    project_id: 'PROJ-001',
    project_name: 'Smart Infrastructure Modernization',
    comments: [
      { id: 'C2', text: 'Reviewed and approved', author: 'Rajesh Kumar', timestamp: '2025-11-29T14:30:00Z' },
    ],
  },
];

/**
 * Evidence Upload Queue Item (for offline support)
 */
export const mockUploadQueue = [
  {
    id: 'QUEUE-001',
    file: { name: 'inspection-photo.jpg', size: 2048576 },
    title: 'Building A Inspection',
    status: 'pending', // pending | uploading | failed | synced
    timestamp: '2025-12-03T16:00:00Z',
    retryCount: 0,
  },
];
