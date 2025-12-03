# Prabhaav - Performance Management System

A modern, enterprise-grade performance management platform built with Vite, React, and Material UI.

## Features

### 🏢 Executive Dashboard (`/app/executive`)
- **OrgPulse**: Real-time organizational health metrics with sparkline trends
- **Top Risks**: Sortable risk table with detailed modals
- **APAR Export**: PDF generation with progress tracking

### 📊 Project Dashboard (`/app/division/:divisionId/project/:projectId`)
- **Gantt-Lite**: Lightweight timeline with drag-to-edit milestones
- **KPI Cards**: Grid of project KPIs with drill-down
- **Evidence Feed**: Virtualized infinite scroll (1000+ items)

### 👤 Employee Dashboard (`/app/me`)
- **Personal Scorecard**: Performance score with category breakdown
- **Task Management**: Tasks with status toggles and inline comments
- **Quick Upload**: Evidence upload with offline queue support

### 📸 Evidence Upload (`/evidence/upload`)
- **Camera Capture**: Native camera with fallback for older browsers
- **Geo-Tagging**: GPS coordinates with permission handling
- **Resumable Uploads**: Chunked strategy with pause/resume/retry
- **Upload Queue**: Max 3 concurrent uploads with exponential backoff

### 🔧 Admin Panel (`/admin`)
- **KPI Weight Management**: Edit category and individual KPI weights
- **Calibration Preview**: Simulate score impact before saving
- **Version Control**: Full history with rollback capability
- **Audit Trail**: Searchable, filterable activity log with immutable entries

### 📄 APAR Reports (`/reports/apar`)
- **Batch Generation**: Multi-select employees for bulk report generation
- **Digital Signatures**: PKCS#7 signed PDFs with AWS KMS or local HSM
- **Job Tracking**: Real-time progress monitoring with queued jobs
- **Verification**: Signature validation script included

### 🤖 AI Assistant ("Ask Prabhaav")
- **Natural Language Queries**: Ask questions about KPIs, projects, and evidence
- **Explainable Results**: Every answer includes source citations and confidence scores
- **Quick Actions**: Drilldown links and export options
- **Conversation Memory**: Maintains context across queries

## Tech Stack

- **Build Tool**: Vite 7.2.6
- **Framework**: React 19.2.0
- **UI Library**: Material UI v6
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query v5
- **Virtualization**: react-window 1.8.10
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 20.19+ (currently running 20.18.0 with warning)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Server runs at `http://localhost:5173`

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/login` |
| `/login` | Login | Authentication page |
| `/app/executive` | ExecutiveDashboard | C-level dashboard |
| `/app/division/:divisionId/project/:projectId` | ProjectDashboard | Project-level dashboard |
| `/app/me` | EmployeeDashboard | Personal performance dashboard |
| `/evidence/upload` | EvidenceUpload | Mobile-first evidence capture & upload |
| `/admin` | Admin | KPI weight management & audit trail |

## Project Structure

```
p250/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── ExecutiveDashboard.jsx
│   │   ├── ProjectDashboard.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── EvidenceUpload.jsx
│   │   ├── Admin.jsx
│   │   └── Admin/
│   │       ├── WeightEditor.jsx
│   │       ├── CalibrationPreview.jsx
│   │       └── AuditTrail.jsx
│   ├── components/
│   │   ├── Logo.jsx
│   │   ├── dashboard/
│   │   │   ├── OrgPulseCard.jsx
│   │   │   ├── TopRisksTable.jsx
│   │   │   └── ExportAPARCard.jsx
│   │   ├── project/
│   │   │   ├── Breadcrumbs.jsx
│   │   │   ├── KPICard.jsx
│   │   │   ├── EvidenceItem.jsx
│   │   │   └── GanttLite.jsx
│   │   └── employee/
│   │       ├── ScoreCard.jsx
│   │       ├── TaskList.jsx
│   │       └── QuickUploadDrawer.jsx
│   ├── hooks/
│   │   ├── useApi.js
│   │   ├── useDashboard.js
│   │   ├── useProject.js
│   │   ├── useProjectApi.js
│   │   ├── useEmployee.js
│   │   ├── useEmployeeApi.js
│   │   ├── useUploadQueue.js
│   │   └── useAdminApi.js
│   ├── utils/
│   │   └── scoring.js
│   └── test/
│       ├── Dashboard.test.jsx
│       ├── ProjectDashboard.test.jsx
│       ├── EvidenceUpload.test.jsx
│       ├── fixtures.js
│       └── setup.js
├── public/
├── server/
│   ├── mockEvidenceServer.js
│   ├── mockAdminServer.js
│   └── README.md
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Documentation

- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [PROJECT_DASHBOARD_GUIDE.md](./PROJECT_DASHBOARD_GUIDE.md) - Project dashboard details
- [EMPLOYEE_DASHBOARD_GUIDE.md](./EMPLOYEE_DASHBOARD_GUIDE.md) - Employee dashboard details
- [EVIDENCE_UPLOAD_GUIDE.md](./EVIDENCE_UPLOAD_GUIDE.md) - Evidence upload implementation
- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Admin panel workflows & best practices
- [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md) - Admin section quick start
- [APAR_QUICKSTART.md](./APAR_QUICKSTART.md) - **APAR reports quick start (5 minutes)**
- [APAR_REPORTS_GUIDE.md](./APAR_REPORTS_GUIDE.md) - **APAR report generation with digital signatures**
- [AI_QUICKSTART.md](./AI_QUICKSTART.md) - **AI assistant quick start (5 minutes)**
- [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md) - **AI assistant with natural language queries**
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation overview
- [STRUCTURE.md](./STRUCTURE.md) - Architecture details

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Key Features

### Scoring Algorithm
Employee performance scoring with weighted categories:
- HQ Operations: 25%
- Field Operations: 30%
- Team Collaboration: 15%
- Individual Behavior: 30% (behavioral rubric 0-3 scale)

See `src/utils/scoring.js` for implementation.

### Offline Support
- Evidence upload queue with localStorage persistence
- Navigator.onLine detection
- Auto-sync on reconnection
- Retry logic for failed uploads

### Camera & Geolocation
- MediaDevices.getUserMedia for native camera
- Fallback to file input for older browsers
- Geolocation API for GPS tagging
- Permission handling for camera and location

### Resumable Uploads
- Chunked upload strategy (5MB chunks)
- Pause/resume/cancel individual uploads
- Exponential backoff retries (max 5 attempts)
- Max 3 concurrent uploads

### Performance Optimizations
- TanStack Query caching (1-10 min stale times)
- Optimistic updates for mutations
- Virtualized lists for 1000+ items
- Lazy loading with React.Suspense

## Mock Data
Currently using mock data for all dashboards. Replace with real API endpoints in production.

## Contributing
See individual component files for JSDoc comments and implementation details.

## License
Proprietary - Internal use only

---

**Last Updated**: January 2025  
**Version**: 1.0
