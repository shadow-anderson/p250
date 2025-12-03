# Employee Dashboard - Implementation Guide

## Overview

The Employee Dashboard (`/app/me`) is a personal performance management interface for individual employees. It features:

- **Personal Scorecard**: Real-time performance score with category breakdown
- **Task Management**: Task list with status updates and inline comments
- **Quick Evidence Upload**: Mobile-friendly drawer with offline queue support
- **Responsive Design**: Optimized for mobile and desktop usage

---

## Route Configuration

**Path**: `/app/me`  
**Component**: `src/pages/EmployeeDashboard.jsx`

### Accessing the Dashboard
Navigate to the Employee Dashboard from:
- Direct link: `http://localhost:5173/app/me`
- Login page → Dashboard navigation

---

## Architecture

### File Structure
```
src/
├── pages/
│   └── EmployeeDashboard.jsx         # Main dashboard page
├── components/
│   └── employee/
│       ├── ScoreCard.jsx             # Performance scorecard with category drill-down
│       ├── TaskList.jsx              # Task list with status toggles
│       └── QuickUploadDrawer.jsx     # Evidence upload with offline queue
├── hooks/
│   ├── useEmployee.js                # TanStack Query hooks
│   └── useEmployeeApi.js             # API functions and mock data
└── utils/
    └── scoring.js                     # Scoring algorithm
```

---

## Components

### 1. ScoreCard Component

**Location**: `src/components/employee/ScoreCard.jsx`

**Purpose**: Displays computed performance score with category breakdown.

#### Features
- **Overall Score**: Circular progress indicator (0-100) with color coding
  - Green (≥90): Excellent
  - Blue (≥75): Good
  - Amber (≥60): Needs Improvement
  - Red (<60): Critical

- **Category Breakdown**: Four categories with weights
  - HQ Operations (25%)
  - Field Operations (30%)
  - Team Collaboration (15%)
  - Individual Behavior (30%) — uses behavioral rubric

- **Audit Info**: Weight version and last compute timestamp (top-right chip)

- **Drill-down Modal**: Click any category to view individual KPIs

#### Props
```javascript
<ScoreCard 
  kpis={[]}           // Array of KPI objects
  weights={{}}        // Category weights (optional, defaults to DEFAULT_WEIGHTS)
  loading={false}     // Loading state
/>
```

#### Scoring Algorithm
Located in `src/utils/scoring.js`:
- **computeScore(kpis, weights)**: Main scoring function
- **computeBehavioralScore()**: Special handler for 0-3 rubric scale
- **computeScoreBreakdown()**: Category-wise score analysis

**Behavioral KPIs** (0-3 scale):
1. Professionalism
2. Initiative
3. Quality of Work
4. Attendance & Punctuality
5. Communication

---

### 2. TaskList Component

**Location**: `src/components/employee/TaskList.jsx`

**Purpose**: Task management with status updates and comments.

#### Features
- **Expandable Tasks**: Click to expand/collapse details
- **Status Updates**: Dropdown to change status (Pending/In Progress/Completed)
- **Priority Badges**: Visual indicators (High/Medium/Low)
- **Due Date Warnings**: Displays overdue tasks in red
- **Inline Comments**: Add comments with Enter key or Send button
- **Optimistic Updates**: Immediate UI feedback before server confirmation

#### Props
```javascript
<TaskList 
  tasks={[]}                  // Array of task objects
  onUpdateStatus={fn}         // Callback for status updates
  loading={false}             // Loading state
/>
```

#### Task Object Structure
```javascript
{
  id: "T-001",
  title: "Complete quarterly report",
  description: "Submit Q4 performance report...",
  status: "in-progress",  // pending | in-progress | completed
  priority: "high",       // high | medium | low
  dueDate: "2025-02-15T00:00:00.000Z",
  comments: [
    {
      id: "C-001",
      text: "Started data collection",
      author: "John Doe",
      timestamp: "2025-01-28T10:00:00.000Z"
    }
  ]
}
```

---

### 3. QuickUploadDrawer Component

**Location**: `src/components/employee/QuickUploadDrawer.jsx`

**Purpose**: Mobile-friendly evidence upload with offline support.

#### Features
- **File Upload**: Single file picker with preview
- **Metadata Capture**: Title, description, tags
- **Geolocation**: Capture GPS coordinates (optional)
- **Offline Queue**: Automatically queues uploads when offline
- **Online/Offline Status**: Visual indicator
- **Queue Visibility**: Shows pending/uploading/synced/failed items

#### Props
```javascript
<QuickUploadDrawer 
  open={false}              // Drawer visibility
  onClose={fn}              // Close callback
  onUpload={fn}             // Upload handler (formData)
  uploadQueue={[]}          // Offline queue array
  uploading={false}         // Upload in progress
/>
```

#### Offline Queue Behavior
1. **Online**: Uploads immediately via API
2. **Offline**: Adds to localStorage queue
3. **Queue Sync**: Automatically syncs when connection restored
4. **Retry Logic**: Failed uploads can be retried (up to 3 attempts)

#### Queue Item Structure
```javascript
{
  id: "QUEUE-1738123456789",
  status: "pending",      // pending | uploading | synced | failed
  title: "Field Inspection Photo",
  description: "Site A inspection...",
  tags: "inspection, quarterly",
  file: "inspection.jpg",
  location: { latitude: 28.7041, longitude: 77.1025 },
  timestamp: "2025-01-28T12:00:00.000Z",
  retryCount: 0
}
```

---

## API Integration

### Hooks (useEmployee.js)

#### useEmployeeData(useMock)
Fetches current employee information.
- **Cache Time**: 10 minutes
- **Returns**: `{ name, employeeId, designation, division, email }`

#### useEmployeeKPIs(useMock)
Fetches employee KPIs for scorecard.
- **Cache Time**: 5 minutes
- **Returns**: Array of 11 KPIs (6 operational + 5 behavioral)

#### useEmployeeTasks(useMock)
Fetches employee tasks.
- **Cache Time**: 2 minutes
- **Returns**: Array of task objects

#### useUpdateTaskStatus()
Mutation for task status updates.
- **Optimistic Update**: Immediate UI feedback
- **Rollback**: Reverts on error
- **Invalidation**: Refreshes tasks on success

#### useUploadEvidence()
Mutation for evidence upload.
- **Invalidates**: `projectEvidence`, `employeeKPIs`

#### useUploadQueue()
Manages offline upload queue.
- **Methods**: `addToQueue`, `updateQueueItem`, `removeFromQueue`, `getQueue`

### API Endpoints (useEmployeeApi.js)

```javascript
// GET /api/employees/me
fetchEmployeeData()

// GET /api/employees/me/kpis
fetchEmployeeKPIs()

// GET /api/employees/me/tasks
fetchEmployeeTasks()

// PATCH /api/employees/me/tasks/:taskId
updateTaskStatus(taskId, status, comment)

// POST /api/employees/me/evidence
uploadEvidence(formData)
```

---

## Mock Data

Currently using mock data for frontend-first development.

### Mock Employee Data
```javascript
{
  employeeId: "EMP-2025-001",
  name: "Priya Sharma",
  designation: "Senior Field Officer",
  division: "Western Division",
  email: "priya.sharma@example.com"
}
```

### Mock KPIs (11 total)
**HQ Operations (2 KPIs)**
- Field Reports Submitted: 18/20
- Audit Compliance: 95/100

**Field Operations (4 KPIs)**
- Site Inspections: 42/40 (105%)
- Site Issue Resolution Time: 4.2/5 days
- Travel Compliance: 98/100
- Field Expense Adherence: 94/100

**Team Collaboration (none in current mock)**

**Individual Behavior (5 KPIs - Rubric Scale 0-3)**
- Professionalism: 3/3
- Initiative & Proactiveness: 2/3
- Quality of Work: 3/3
- Attendance & Punctuality: 3/3
- Communication: 2/3

### Mock Tasks (4 total)
1. Complete Quarterly Performance Report (High Priority, In Progress)
2. Submit Field Inspection Photos (Medium Priority, Pending, Overdue)
3. Review Team Member Appraisals (Low Priority, Pending)
4. Update Personal Development Plan (Medium Priority, Completed)

---

## User Workflows

### Viewing Performance Score
1. Navigate to `/app/me`
2. ScoreCard displays overall score (circular progress)
3. View category breakdown (4 bars with weights)
4. Click category to drill down into individual KPIs
5. Modal shows KPI details with progress bars

### Managing Tasks
1. Scroll to TaskList section
2. Click task to expand details
3. Change status via dropdown
4. Add comment in text field (Enter or Send button)
5. View existing comments with timestamps

### Uploading Evidence
1. Click Floating Action Button (bottom-right)
2. Drawer opens from bottom
3. Fill title, description, tags
4. Choose file
5. Optionally capture geolocation
6. Click "Upload Now" (online) or "Add to Queue" (offline)
7. View queue status below form

### Offline Mode
1. Disconnect from internet
2. Upload evidence → adds to queue
3. Queue shows "pending" status
4. Reconnect to internet
5. App auto-syncs queue items
6. Queue status updates to "synced"

---

## Testing

### Manual Testing Checklist

#### ScoreCard
- [ ] Overall score displays correctly (0-100)
- [ ] Color coding matches score (green/blue/amber/red)
- [ ] Category breakdown shows 4 bars with correct weights
- [ ] Audit chip displays version and date
- [ ] Click category opens modal
- [ ] Modal shows individual KPIs with performance/target
- [ ] Behavioral KPIs show 0-3 scale correctly

#### TaskList
- [ ] Tasks display with correct status icons
- [ ] Priority badges color-coded correctly
- [ ] Overdue tasks show in red
- [ ] Click task expands/collapses
- [ ] Status dropdown changes task status
- [ ] Comment input accepts text
- [ ] Enter key submits comment
- [ ] Comments appear with timestamp
- [ ] Loading spinner shows during updates

#### QuickUploadDrawer
- [ ] FAB button opens drawer
- [ ] Online/offline status displays correctly
- [ ] File picker accepts files
- [ ] Geolocation captures coordinates
- [ ] Form validation works (title required)
- [ ] Online upload shows progress
- [ ] Offline upload adds to queue
- [ ] Queue displays pending items
- [ ] Drawer closes after successful upload

---

## Performance Optimizations

1. **TanStack Query Caching**
   - Employee data: 10 min stale time
   - KPIs: 5 min stale time
   - Tasks: 2 min stale time

2. **Optimistic Updates**
   - Task status changes update immediately
   - Comment additions appear instantly
   - Rollback on server error

3. **Offline Support**
   - localStorage persistence for upload queue
   - Navigator.onLine detection
   - Auto-sync on reconnection

4. **Responsive Design**
   - Grid layout adjusts for mobile (stacked) and desktop (side-by-side)
   - Bottom drawer optimized for mobile
   - FAB positioned for thumb reach

---

## Future Enhancements

### Phase 2 Features
- [ ] Push notifications for task assignments
- [ ] Evidence photo compression before upload
- [ ] Background sync API for upload queue
- [ ] Task filtering (by status, priority, date)
- [ ] Score history chart (last 6 months)
- [ ] Peer comparison (anonymized)
- [ ] Export scorecard as PDF

### Phase 3 Features
- [ ] WebRTC video evidence upload
- [ ] Voice-to-text for descriptions
- [ ] Barcode/QR scanner integration
- [ ] Multi-file upload support
- [ ] Task templates
- [ ] Smart task scheduling suggestions

---

## Troubleshooting

### Score Not Displaying
**Issue**: ScoreCard shows 0 or NaN  
**Solution**: Ensure KPIs have `performance`, `target`, and `category` fields

### Tasks Not Updating
**Issue**: Status change doesn't persist  
**Solution**: Check `onUpdateStatus` callback is passed to TaskList

### Upload Queue Not Syncing
**Issue**: Items stuck in "pending" after reconnection  
**Solution**: Verify upload queue logic in `useUploadQueue` hook

### Geolocation Not Working
**Issue**: "Geolocation not supported" error  
**Solution**: Use HTTPS or localhost (required for geolocation API)

---

## API Integration Checklist

When replacing mock data with real API:

1. **Update API Base URL**
   - Modify `useEmployeeApi.js` to use production endpoint

2. **Authentication**
   - Add JWT token to fetch headers
   - Handle 401 unauthorized responses

3. **Error Handling**
   - Implement retry logic for network failures
   - Show user-friendly error messages

4. **WebSocket Integration** (optional)
   - Real-time task updates
   - Score recalculation notifications

5. **Upload Queue Sync**
   - Background sync service worker
   - Exponential backoff for retries

---

## Dependencies

```json
{
  "@tanstack/react-query": "^5.x",
  "@mui/material": "^6.x",
  "react-router-dom": "^6.x",
  "react-timeago": "^7.x"
}
```

---

## Related Documentation

- [Scoring Algorithm](../src/utils/scoring.js) - JSDoc comments explain scoring logic
- [PROJECT_DASHBOARD_GUIDE.md](./PROJECT_DASHBOARD_GUIDE.md) - Similar patterns used
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Overall architecture

---

**Last Updated**: January 2025  
**Author**: Development Team  
**Version**: 1.0
