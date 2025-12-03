# Admin Panel User Guide

Complete guide to the Admin Panel for managing KPI weights, previewing calibration impacts, and monitoring system changes.

## Table of Contents
- [Overview](#overview)
- [Accessing the Admin Panel](#accessing-the-admin-panel)
- [KPI Weight Configuration](#kpi-weight-configuration)
- [Calibration Preview](#calibration-preview)
- [Audit Trail](#audit-trail)
- [Workflows](#workflows)
- [Security & Compliance](#security--compliance)

---

## Overview

The Admin Panel (`/admin`) provides system administrators with tools to:

1. **Edit KPI Weights**: Adjust category and individual KPI weights to align with organizational priorities
2. **Preview Impact**: Simulate how weight changes affect employee scores before committing
3. **Rollback Changes**: Restore previous weight configurations if needed
4. **Monitor Activity**: View complete audit trail of all admin actions

### Key Features

- ✅ **Real-time Validation**: Ensures weights sum to 100% at all times
- ✅ **Impact Preview**: Shows before/after score distributions with top impacted employees
- ✅ **Version Control**: Every change creates a new version with full history
- ✅ **Audit Logging**: Immutable record of all changes with actor, timestamp, and reason
- ✅ **Rollback Capability**: Quickly revert to previous configurations
- ✅ **Search & Filters**: Find specific audit entries by date, actor, or action type

---

## Accessing the Admin Panel

### URL
```
http://localhost:5174/admin
```

### Authentication
Requires **Administrator** role. Non-admin users are redirected to login.

### Navigation
The Admin Panel has two main tabs:
1. **KPI Weight Configuration** - Edit weights and preview impacts
2. **Audit Trail** - View complete change history

---

## KPI Weight Configuration

### Weight Structure

**Categories** (4 total):
- HQ Operations (25%)
- Field Operations (30%)
- Team Collaboration (15%)
- Individual Behavior (30%)

Each category contains **KPIs** with their own weights that sum to 100% within the category.

### Editing Weights

#### 1. View Current Configuration
- Current version displayed at top (e.g., "v2.1")
- Last modified timestamp and admin name shown
- Categories displayed in collapsible table rows

#### 2. Adjust Category Weights
- Use slider (0-100%) or number input
- Changes reflected in real-time
- Validation errors appear if sum ≠ 100%

#### 3. Adjust KPI Weights
- Click category row to expand
- Individual KPI sliders shown
- Must sum to 100% within category

#### 4. Validation Rules
✅ **Category weights** must sum to 100% (tolerance: 0.1%)
✅ **KPI weights** within each category must sum to 100%
✅ **All weights** must be non-negative

**Example Error**:
```
Category weights sum to 98.5% (must be 100%)
```

#### 5. Preview Impact (Recommended)
Before saving, click **"Preview Impact"** to run calibration simulation:
- See how many employees affected
- View before/after score distributions
- Review top 5 most impacted employees
- Analyze per-category impact heatmap

**Warning**: If >20% of employees have significant changes (±5 points), a warning appears.

#### 6. Save Changes
Click **"Save Changes"** button:
1. Validation dialog appears
2. Enter **reason** for change (required for audit)
   - Example: "Q1 2025 quarterly adjustment - increased field operations emphasis"
3. Confirm to create new version
4. New version ID displayed (e.g., "v2.2")

#### 7. Reset Changes
Click **"Reset"** to discard unsaved edits and restore current configuration.

### Version History

Click **"Version History"** to view all past configurations:

| Version | Date       | Modified By    | Comment                          | Status   |
|---------|------------|----------------|----------------------------------|----------|
| v2.1    | 2025-01-15 | Anjali Sharma  | Increased field ops weight       | Active   |
| v2.0    | 2024-12-01 | Rajesh Kumar   | Quarterly adjustment             | Archived |
| v1.5    | 2024-09-15 | Priya Patel    | Initial production weights       | Archived |

### Rollback

To restore a previous version:
1. Click **"Rollback"** button
2. Select version from history table
3. Enter **reason** for rollback
   - Example: "Reverting v2.1 due to unexpected score variance"
4. Confirm to activate previous version
5. New audit entry created with WEIGHT_ROLLBACK action

---

## Calibration Preview

### What is Calibration?

**Calibration** simulates how weight changes affect all employee scores before committing the changes.

### Running Preview

1. Adjust weights in editor
2. Click **"Preview Impact"**
3. Calibration runs on 248 employees (mock data)
4. Results shown in dialog

### Preview Results

#### Summary Cards
- **Employees Analyzed**: Total count (248)
- **Avg Score Change**: Mean delta across all employees (+2.3)
- **Impacted Employees**: Count with score change (142)
- **Significant Changes**: Count with ±5+ point change (18)

#### Score Distribution Chart
Bar chart showing:
- **Before**: Current score distribution (blue bars)
- **After**: New score distribution (orange bars)
- Bins: 0-10, 10-20, ..., 90-100

#### Top Impacted Employees
Table with 5 most affected employees:

| Employee         | Division   | Before | After | Delta | Reason                               |
|------------------|------------|--------|-------|-------|--------------------------------------|
| Rajesh Kumar     | East Zone  | 68     | 77    | +9    | Strong field ops benefits            |
| Priya Sharma     | West Zone  | 72     | 65    | -7    | Lower collaboration impacted         |
| Amit Patel       | North Zone | 55     | 61    | +6    | Above-avg individual behavior gains  |

**Delta Colors**:
- 🟢 Green: +5 or more
- 🟡 Light Green: +1 to +4
- 🟠 Orange: -1 to -4
- 🔴 Red: -5 or less

#### KPI Impact Heatmap
Grid showing per-category impact:

| Category             | Avg Impact | Employees Affected |
|----------------------|------------|--------------------|
| HQ Operations        | -1.2       | 85                 |
| Field Operations     | +3.8       | 142                |
| Team Collaboration   | +0.5       | 68                 |
| Individual Behavior  | -0.8       | 95                 |

**Color Intensity**: Darker = larger impact magnitude

### Warning Threshold

⚠️ **Warning** appears if:
- More than 20% of employees have significant changes (±5 points)
- Example: "18 out of 248 employees (7.3%) have significant changes"

This helps admins identify potentially disruptive weight adjustments.

---

## Audit Trail

### Overview
Complete searchable log of all admin actions with filters for date, actor, and action type.

### Viewing Audit Log

Navigate to **"Audit Trail"** tab to see:
- Timestamp (relative and absolute)
- Actor (admin name and ID)
- Action Type (color-coded chip)
- Target (what was changed)
- Comment (reason for change)

### Action Types

| Type                  | Color     | Description                          |
|-----------------------|-----------|--------------------------------------|
| WEIGHT_UPDATE         | Blue      | Category weight changed              |
| KPI_WEIGHT_UPDATE     | Purple    | Individual KPI weight changed        |
| CALIBRATION_PREVIEW   | Light Blue| Calibration simulation run           |
| WEIGHT_ROLLBACK       | Orange    | Version restored                     |

### Filters

#### Search Bar
Search across:
- Actor names
- Target resources
- Comments

**Example**: "field operations" finds all changes to field_operations category

#### Action Type Filter
Select specific action type or "All Actions"

#### Date Range
- **Date From**: Start date (inclusive)
- **Date To**: End date (inclusive, end of day)

**Example**: Filter to "2025-01-01" → "2025-01-31" for January changes

#### Actor Filter
Enter actor ID to see all actions by specific admin

### Expanded Details

Click **▼** icon to expand row and see:
- **Old Value**: Previous value (JSON for complex objects)
- **New Value**: Updated value
- **Metadata**: Additional context (version ID, affected employees, etc.)
- **Full Comment**: Complete reason text

**Example Metadata**:
```json
{
  "versionId": "v2.1",
  "affectedEmployees": 248
}
```

### Pagination

- **Rows Per Page**: 25, 50, or 100
- **Page Navigation**: Previous/Next buttons
- **Total Count**: Displayed at top (e.g., "1247 entries")

### Export (Future Enhancement)
**CSV Export** button to download filtered audit log for compliance reporting.

---

## Workflows

### Workflow 1: Quarterly Weight Adjustment

**Scenario**: Adjust weights at end of quarter based on strategic review.

1. **Navigate** to `/admin` → KPI Weight Configuration
2. **Review** current weights and version
3. **Adjust** category weights:
   - Increase Field Operations from 28% to 30%
   - Decrease HQ Operations from 27% to 25%
4. **Validate** - ensure sum = 100%
5. **Preview Impact**:
   - Run calibration
   - Review top impacted employees
   - Check heatmap for category-level effects
6. **Save Changes**:
   - Click "Save Changes"
   - Enter reason: "Q1 2025 quarterly adjustment - increased field ops based on strategic goals"
   - Confirm
7. **Verify**:
   - New version created (e.g., v2.2)
   - Navigate to Audit Trail
   - Confirm WEIGHT_UPDATE entry logged

### Workflow 2: Emergency Rollback

**Scenario**: Weight change causes unexpected score variance; need to revert.

1. **Identify Issue**: Reports show unexpected score drops
2. **Navigate** to `/admin` → KPI Weight Configuration
3. **Click** "Rollback" button
4. **Select Version**: Choose previous stable version (e.g., v2.0)
5. **Enter Reason**: "Reverting v2.1 due to unexpected 15% variance in South Zone scores"
6. **Confirm** rollback
7. **Verify**:
   - Version restored
   - WEIGHT_ROLLBACK entry in audit trail
   - Check employee scores stabilized

### Workflow 3: Compliance Audit

**Scenario**: Internal audit requires proof of weight change history.

1. **Navigate** to `/admin` → Audit Trail
2. **Set Date Range**: Audit period (e.g., 2024-07-01 to 2024-12-31)
3. **Filter by Action**: WEIGHT_UPDATE + KPI_WEIGHT_UPDATE
4. **Review Entries**:
   - Expand rows to see old/new values
   - Verify each change has reason
   - Check actor names and timestamps
5. **Export**: Download CSV (future feature)
6. **Generate Report**: Document findings for compliance team

### Workflow 4: Impact Analysis Before Major Change

**Scenario**: Planning to significantly shift weight to Field Operations.

1. **Navigate** to `/admin` → KPI Weight Configuration
2. **Adjust Weights**:
   - Field Operations: 30% → 40%
   - Individual Behavior: 30% → 20%
3. **Run Preview**:
   - Click "Preview Impact"
   - Review summary: Avg Score Change, Impacted Employees
4. **Analyze Distribution**:
   - Compare before/after bar chart
   - Check if distribution shifts significantly
5. **Review Top Impacted**:
   - Identify employees with large deltas
   - Assess fairness of changes
6. **Check Heatmap**:
   - Field Operations: +8.5 avg impact (142 affected)
   - Individual Behavior: -6.2 avg impact (95 affected)
7. **Decision**:
   - If acceptable: Save with detailed reason
   - If not acceptable: Reset and adjust differently
8. **Communicate**: Notify stakeholders before saving

---

## Security & Compliance

### Access Control

#### Role Requirements
- **Admin Panel**: Requires `ROLE_ADMIN`
- **Weight Editing**: Requires `PERMISSION_EDIT_WEIGHTS`
- **Audit Viewing**: Requires `PERMISSION_VIEW_AUDIT`

#### Authentication
- Admin users authenticated via JWT tokens
- Session timeout: 8 hours
- Re-authentication required for sensitive actions (rollback)

### Audit Immutability

#### Logging Guarantees
- **Every Change Logged**: No silent updates
- **Immutable Entries**: Audit records cannot be deleted or modified
- **Actor Attribution**: Every action tied to specific admin account
- **Timestamp Precision**: UTC timestamps to millisecond accuracy

#### Required Metadata
All weight changes require:
- ✅ **Actor ID**: Admin user identifier
- ✅ **Actor Name**: Human-readable name
- ✅ **Reason**: Free-text explanation (min 10 characters)
- ✅ **Timestamp**: Auto-generated server timestamp
- ✅ **Old Value**: Previous state (for rollback)
- ✅ **New Value**: Updated state
- ✅ **Metadata**: Context (version ID, affected employees)

### Compliance Features

#### Change Management
- **Version Control**: Every change increments version (v2.1 → v2.2)
- **History Retention**: All versions archived indefinitely
- **Rollback Trail**: Rollbacks create new versions (not deletions)
- **No Overwriting**: Historical data preserved

#### Audit Reporting
- **Searchable**: Filter by date, actor, action type
- **Exportable**: CSV download for external audits
- **Complete**: Includes old/new values and full metadata
- **Timestamped**: All entries include UTC timestamps

#### Data Integrity
- **Validation**: Weights validated before commit
- **Checksums**: Configurations hashed for integrity verification
- **Backup**: Configurations backed up before each change
- **Rollback**: Point-in-time recovery available

### Best Practices

#### 1. Document All Changes
Always provide detailed reasons:
- ❌ Bad: "Quarterly update"
- ✅ Good: "Q1 2025 adjustment: Increased field ops from 28% to 30% based on executive review of Dec 2024 performance data. Goal: Align with strategic emphasis on field presence."

#### 2. Preview Before Saving
- Always run calibration preview for changes >5%
- Review top impacted employees for fairness
- Check for >20% significant changes warning

#### 3. Coordinate Large Changes
- Notify stakeholders before major weight shifts
- Plan changes during low-activity periods
- Prepare communication for affected employees

#### 4. Test Rollback Procedures
- Periodically test rollback functionality
- Verify version history integrity
- Ensure admins know emergency procedures

#### 5. Monitor Audit Trail
- Weekly review of admin actions
- Look for unauthorized access attempts
- Investigate unexpected weight changes

#### 6. Backup Configurations
- Export weight configurations monthly
- Store backups off-system
- Test restoration procedures

---

## API Reference

### Weight Management

#### Fetch Current Config
```http
GET /api/admin/weights/config
```

#### Save New Config
```http
POST /api/admin/weights/config
Content-Type: application/json

{
  "weights": {
    "categories": [
      {
        "id": "hq_operations",
        "name": "HQ Operations",
        "weight": 0.25,
        "kpis": [...]
      }
    ]
  },
  "reason": "Quarterly adjustment",
  "actor": "admin-003",
  "actorName": "Anjali Sharma"
}
```

#### Rollback to Version
```http
POST /api/admin/weights/rollback/v2.0
Content-Type: application/json

{
  "actor": "admin-003",
  "actorName": "Anjali Sharma",
  "reason": "Reverting due to variance"
}
```

### Calibration

#### Run Preview
```http
POST /api/admin/calibrate
Content-Type: application/json

{
  "weights": { "categories": [...] },
  "actor": "admin-003",
  "actorName": "Anjali Sharma"
}
```

### Audit Trail

#### Fetch Entries
```http
GET /api/admin/audit?page=1&perPage=50&actionType=WEIGHT_UPDATE&dateFrom=2025-01-01
```

---

## Troubleshooting

### Issue: Validation Error "Weights don't sum to 100%"

**Cause**: Category or KPI weights have rounding errors.

**Solution**:
1. Check each category sum
2. Adjust decimal places (0.01 increments)
3. Use "Reset" to restore valid state
4. Re-enter weights carefully

### Issue: Calibration Preview Shows Large Impacts

**Cause**: Weight shift significantly affects certain employee profiles.

**Solution**:
1. Review heatmap to identify affected categories
2. Consider smaller incremental changes
3. Communicate impacts to stakeholders
4. Run preview again with adjusted weights

### Issue: Rollback Fails

**Cause**: Version not found or database error.

**Solution**:
1. Check version ID in history table
2. Verify version status (must be "archived")
3. Contact system administrator
4. Check audit trail for recent rollback attempts

### Issue: Audit Trail Empty

**Cause**: No actions performed or filter too restrictive.

**Solution**:
1. Clear all filters
2. Expand date range
3. Check "All Actions" in action type
4. Verify database connection

### Issue: Save Button Disabled

**Cause**: Validation errors or no changes made.

**Solution**:
1. Check for red validation alerts
2. Ensure weights sum to 100%
3. Make at least one weight change
4. Verify all KPI weights valid within categories

---

## FAQ

**Q: How often should weights be updated?**
A: Typically quarterly, aligned with performance review cycles. Ad-hoc changes acceptable with proper justification.

**Q: Can I delete audit entries?**
A: No. Audit log is immutable for compliance. Entries cannot be deleted or modified.

**Q: What happens if I save invalid weights?**
A: Validation prevents saving. You'll see error message until weights sum to 100%.

**Q: How far back can I rollback?**
A: All versions archived indefinitely. Rollback to any previous version in history.

**Q: Who can see the audit trail?**
A: Only users with `PERMISSION_VIEW_AUDIT` (typically admins and auditors).

**Q: What if two admins edit weights simultaneously?**
A: Last save wins. Use version numbers to detect conflicts. Consider adding optimistic locking in production.

**Q: How do I export audit trail?**
A: CSV export button in UI (future feature). Currently, use API endpoint with filters.

**Q: Can I customize categories or KPIs?**
A: Not via UI. Contact system administrator for schema changes.

---

## Support

**Technical Issues**: Contact DevOps team
**Weight Strategy**: Contact HR/Performance team
**Audit Questions**: Contact Compliance team
**Security Concerns**: Contact InfoSec team

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Platform Engineering Team
