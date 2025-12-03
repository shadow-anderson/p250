# Admin Section Quick Start

Quick reference for running and testing the Admin Panel.

## Prerequisites

```bash
# Ensure dependencies installed
npm install --legacy-peer-deps
```

## Running the Admin Section

### 1. Start Mock Admin Server

```bash
# Terminal 1
node server/mockAdminServer.js
```

Server runs on: **http://localhost:3002**

**Available Endpoints**:
- GET `/api/admin/weights/config` - Fetch current weights
- POST `/api/admin/weights/config` - Save new weights
- GET `/api/admin/weights/history` - Version history
- POST `/api/admin/weights/rollback/:versionId` - Rollback
- POST `/api/admin/calibrate` - Preview impact
- GET `/api/admin/audit` - Audit trail with filters
- GET `/health` - Server health check

### 2. Start Vite Dev Server

```bash
# Terminal 2
npm run dev
```

App runs on: **http://localhost:5174**

### 3. Navigate to Admin Panel

Open browser: **http://localhost:5174/admin**

## Features Overview

### Tab 1: KPI Weight Configuration

**What You Can Do**:
- ✅ View current weight configuration (v2.1)
- ✅ Edit category weights (4 categories)
- ✅ Edit KPI weights within categories (13 total KPIs)
- ✅ Real-time validation (weights must sum to 100%)
- ✅ Preview calibration impact (248 employees simulated)
- ✅ Save with mandatory reason (creates new version)
- ✅ Rollback to previous versions
- ✅ View version history

**Key Components**:
- Inline sliders (0-100%) and number inputs
- Collapsible KPI sections per category
- Validation alerts for invalid sums
- Save, Reset, Preview, Rollback, Version History buttons

### Tab 2: Audit Trail

**What You Can Do**:
- ✅ View complete audit log (1247 entries initially)
- ✅ Search by actor, target, or comment
- ✅ Filter by action type (WEIGHT_UPDATE, KPI_WEIGHT_UPDATE, CALIBRATION_PREVIEW, WEIGHT_ROLLBACK)
- ✅ Filter by date range (from/to)
- ✅ Paginate (25/50/100 per page)
- ✅ Expand rows to see old/new values and metadata

**Key Components**:
- Search bar with icon
- Action type dropdown
- Date range pickers
- Expandable table rows with details
- Pagination controls

## Quick Test Scenarios

### Test 1: Edit and Save Weights

1. Navigate to Admin → KPI Weight Configuration
2. Edit "Field Operations" category weight:
   - Change from 30% to 35%
3. Adjust "HQ Operations" to compensate:
   - Change from 25% to 20%
4. Verify validation: Sum should be 100% ✅
5. Click "Preview Impact":
   - See 248 employees analyzed
   - Check before/after distribution chart
   - Review top 5 impacted employees
6. Click "Save Changes":
   - Enter reason: "Test: Increased field ops emphasis"
   - Confirm
7. Verify:
   - New version created (v2.2)
   - Toast notification appears
   - Weights updated in UI

### Test 2: Validation Errors

1. Edit "Field Operations" to 40%
2. Do NOT adjust other categories
3. Observe validation error:
   - Red alert: "Category weights sum to 105% (must be 100%)"
4. Save button disabled ❌
5. Reset to clear error

### Test 3: Calibration Preview

1. Edit any weight
2. Click "Preview Impact"
3. View preview dialog:
   - Summary cards: Employees Analyzed (248), Avg Score Change (+2.3), etc.
   - Bar chart: Before (blue) vs After (orange) distributions
   - Top Impacted table: 5 employees with largest deltas
   - KPI Impact Heatmap: Per-category average impacts
4. Check warning:
   - If >20% have significant changes, warning appears
5. Close dialog without saving

### Test 4: Rollback

1. Click "Rollback" button
2. Version history table appears:
   - v2.1 (Active)
   - v2.0 (Archived)
   - v1.5 (Archived)
3. Select v2.0 row
4. Enter reason: "Test: Reverting for demo"
5. Confirm rollback
6. Verify:
   - Version restored to v2.0
   - Weights updated
   - Audit entry created

### Test 5: Audit Trail Search

1. Navigate to Audit Trail tab
2. Search: "field operations"
3. Verify filtered results show only related entries
4. Filter by action type: "WEIGHT_UPDATE"
5. Set date range: 2025-01-01 to 2025-01-31
6. Verify pagination updates
7. Expand row to see:
   - Old Value: 0.28
   - New Value: 0.3
   - Metadata: { versionId: "v2.1", affectedEmployees: 248 }

### Test 6: KPI Weight Editing

1. Click "HQ Operations" row to expand
2. Edit "Reporting Timeliness" KPI:
   - Change from 30% to 40%
3. Adjust "Data Accuracy" to compensate:
   - Change from 40% to 30%
4. Verify KPI weights sum to 100% ✅
5. Category weight remains 25%
6. Save and verify

## Mock Data

### Current Configuration (v2.1)

**Categories**:
- HQ Operations: 25%
  - Reporting Timeliness: 30%
  - Data Accuracy: 40%
  - Process Adherence: 30%
- Field Operations: 30%
  - Inspection Completion Rate: 35%
  - Travel Efficiency: 25%
  - Quality Compliance: 40%
- Team Collaboration: 15%
  - Meeting Attendance: 40%
  - Peer Support: 35%
  - Knowledge Sharing: 25%
- Individual Behavior: 30%
  - Punctuality: 25%
  - Initiative: 35%
  - Professionalism: 25%
  - Learning & Development: 15%

### Version History

- **v2.1** (Active) - 2025-01-15 by Anjali Sharma
  - "Increased field operations weight to 30%"
- **v2.0** (Archived) - 2024-12-01 by Rajesh Kumar
  - "Quarterly weight adjustment"
- **v1.5** (Archived) - 2024-09-15 by Priya Patel
  - "Initial production weights"

### Calibration Preview Sample

**248 employees analyzed**:
- Avg Score Change: +2.3
- Impacted Employees: 142
- Significant Changes: 18 (±5 points or more)

**Top Impacted**:
1. Rajesh Kumar (East Zone): 68 → 77 (+9)
2. Priya Sharma (West Zone): 72 → 65 (-7)
3. Amit Patel (North Zone): 55 → 61 (+6)
4. Anjali Singh (South Zone): 64 → 58 (-6)
5. Vikram Reddy (Central Zone): 59 → 64 (+5)

**KPI Impact Heatmap**:
- HQ Operations: -1.2 avg (85 affected)
- Field Operations: +3.8 avg (142 affected)
- Team Collaboration: +0.5 avg (68 affected)
- Individual Behavior: -0.8 avg (95 affected)

### Audit Trail Sample

**5 most recent entries** (out of 1247 total):
1. audit-1247: WEIGHT_UPDATE - category:field_operations (0.28 → 0.3)
2. audit-1246: CALIBRATION_PREVIEW - weight_config:v2.1-draft
3. audit-1245: WEIGHT_UPDATE - category:team_collaboration (0.12 → 0.15)
4. audit-1244: WEIGHT_ROLLBACK - weight_config:v1.8
5. audit-1243: KPI_WEIGHT_UPDATE - kpi:reporting_timeliness (0.25 → 0.3)

## Troubleshooting

### Server Not Running

**Error**: Network request failed
**Solution**: Start mock admin server
```bash
node server/mockAdminServer.js
```

### Validation Errors Won't Clear

**Error**: "Category weights sum to X%"
**Solution**: Click "Reset" button to restore valid state

### Preview Shows No Data

**Error**: Empty calibration preview
**Solution**: Check server logs, verify POST /api/admin/calibrate endpoint

### Audit Trail Empty

**Error**: No entries shown
**Solution**: 
1. Clear all filters
2. Check "All Actions" in action type
3. Verify server running

### Port Already in Use

**Error**: EADDRINUSE :::3002
**Solution**:
```powershell
# Find process
netstat -ano | findstr :3002

# Kill process
taskkill /PID <PID> /F
```

## API Testing with cURL

### Fetch Current Config
```bash
curl http://localhost:3002/api/admin/weights/config
```

### Save New Config
```bash
curl -X POST http://localhost:3002/api/admin/weights/config \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "categories": [...]
    },
    "reason": "Test save",
    "actor": "admin-999",
    "actorName": "Test Admin"
  }'
```

### Run Calibration
```bash
curl -X POST http://localhost:3002/api/admin/calibrate \
  -H "Content-Type: application/json" \
  -d '{
    "weights": { "categories": [...] },
    "actor": "admin-999",
    "actorName": "Test Admin"
  }'
```

### Fetch Audit Trail
```bash
curl "http://localhost:3002/api/admin/audit?page=1&perPage=10&actionType=WEIGHT_UPDATE"
```

### Health Check
```bash
curl http://localhost:3002/health
```

## Next Steps

1. **Run Tests**: Create `src/test/Admin.test.jsx` for unit tests
2. **Add Role Check**: Implement admin authentication in production
3. **Real Database**: Replace in-memory storage with MongoDB/PostgreSQL
4. **Export CSV**: Add audit trail CSV export functionality
5. **Email Notifications**: Alert stakeholders on weight changes
6. **Scheduled Changes**: Add ability to schedule weight updates
7. **Multi-tenant**: Support multiple organizations with isolated configs

## Documentation

- **Full Guide**: See `ADMIN_GUIDE.md` for complete workflows and best practices
- **API Reference**: See `server/README.md` for endpoint details
- **Project Structure**: See `STRUCTURE.md` for file organization

---

**Admin Panel Complete!** 🎉

All features implemented:
✅ Weight editing with validation
✅ Calibration preview with charts
✅ Version history and rollback
✅ Comprehensive audit trail
✅ Mock server with all endpoints
✅ Complete documentation
