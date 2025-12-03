# Mock Servers

Express.js servers providing mock endpoints for development.

## Servers

### 1. Evidence Upload Server (Port 3001)
Handles chunked file uploads for evidence submission.

### 2. Admin Server (Port 3002)
Provides admin endpoints for KPI weight management and audit trails.

## Installation

```bash
npm install express multer fs-extra cors
```

## Running the Servers

```bash
# Evidence Upload Server
node server/mockEvidenceServer.js

# Admin Server
node server/mockAdminServer.js

# Or add to package.json scripts:
npm run server:evidence
npm run server:admin
```

## Features

### Evidence Upload Server (Port 3001)
- **Chunked Upload**: Handles 5MB chunks for large files
- **Upload Tracking**: In-memory storage of upload progress
- **Chunk Merging**: Automatically merges chunks into final file
- **Status Updates**: PATCH endpoint for evidence verification
- **CORS Enabled**: Works with Vite dev server (localhost:5174)

### Admin Server (Port 3002)
- **Weight Management**: CRUD operations for KPI weights
- **Calibration Preview**: Simulates score impact before saving
- **Version History**: Tracks all weight configuration versions
- **Rollback**: Restore previous weight configurations
- **Audit Trail**: Searchable, filterable activity log
- **Validation**: Ensures weights sum to 100%

## Endpoints

### Evidence Upload Server (localhost:3001)

#### POST /api/evidence/upload
Upload file chunk

**Request** (multipart/form-data):
```
chunk: Blob
chunkIndex: number
totalChunks: number
uploadId: string (optional)
fileName: string
metadata: JSON string
```

**Response**:
```json
{
  "uploadId": "upload-123",
  "status": "uploading|completed",
  "progress": 33,
  "receivedChunks": 1
}
```

### GET /api/evidence/upload/:uploadId/status
Get upload status

**Response**:
```json
{
  "uploadId": "upload-123",
  "status": "uploading",
  "progress": 66,
  "receivedChunks": 2,
  "totalChunks": 3
}
```

### PATCH /api/evidence/:id/status
Update evidence status

**Request**:
```json
{
  "status": "verified|rejected",
  "comment": "Approved by supervisor"
}
```

### DELETE /api/evidence/upload/:uploadId
Cancel upload

### GET /api/evidence
List all uploaded evidence

### GET /health
Health check

---

### Admin Server (localhost:3002)

#### GET /api/admin/weights/config
Get current weight configuration

**Response**:
```json
{
  "version": "v2.1",
  "lastModified": "2025-01-15T10:30:00Z",
  "modifiedBy": "admin-003",
  "modifiedByName": "Anjali Sharma",
  "categories": [
    {
      "id": "hq_operations",
      "name": "HQ Operations",
      "weight": 0.25,
      "kpis": [
        { "id": "reporting_timeliness", "name": "Reporting Timeliness", "weight": 0.3 }
      ]
    }
  ]
}
```

#### POST /api/admin/weights/config
Save new weight configuration

**Request**:
```json
{
  "weights": { "categories": [...] },
  "reason": "Quarterly adjustment based on performance review",
  "actor": "admin-003",
  "actorName": "Anjali Sharma"
}
```

**Response**:
```json
{
  "success": true,
  "config": { ... },
  "message": "Weight configuration updated to v2.2"
}
```

#### GET /api/admin/weights/history
Get version history

**Response**:
```json
{
  "versions": [
    {
      "versionId": "v2.1",
      "timestamp": "2025-01-15T10:30:00Z",
      "modifiedBy": "admin-003",
      "modifiedByName": "Anjali Sharma",
      "comment": "Increased field operations weight",
      "status": "active"
    }
  ],
  "total": 3
}
```

#### POST /api/admin/weights/rollback/:versionId
Rollback to previous version

**Request**:
```json
{
  "actor": "admin-003",
  "actorName": "Anjali Sharma",
  "reason": "Reverting due to unexpected variance"
}
```

#### POST /api/admin/calibrate
Preview calibration impact

**Request**:
```json
{
  "weights": { "categories": [...] },
  "actor": "admin-003",
  "actorName": "Anjali Sharma"
}
```

**Response**:
```json
{
  "employeesAnalyzed": 248,
  "avgScoreChange": 2.3,
  "scoreDistribution": {
    "before": [...],
    "after": [...]
  },
  "topImpacted": [...],
  "kpiImpactHeatmap": [...],
  "significantChanges": 18
}
```

#### GET /api/admin/audit
Get audit trail with filters

**Query Params**:
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 50)
- `search`: Search actor/target/comment
- `actionType`: Filter by action (WEIGHT_UPDATE, KPI_WEIGHT_UPDATE, CALIBRATION_PREVIEW, WEIGHT_ROLLBACK)
- `actor`: Filter by actor ID
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)

**Response**:
```json
{
  "entries": [
    {
      "id": "audit-1247",
      "timestamp": "2025-01-15T10:30:00Z",
      "actor": "admin-003",
      "actorName": "Anjali Sharma",
      "actionType": "WEIGHT_UPDATE",
      "target": "category:field_operations",
      "oldValue": 0.28,
      "newValue": 0.3,
      "comment": "Increased field operations weight",
      "metadata": { "versionId": "v2.1", "affectedEmployees": 248 }
    }
  ],
  "total": 1247,
  "page": 1,
  "perPage": 50,
  "totalPages": 25
}
```

#### GET /health
Health check

## Directory Structure

```
uploads/     - Final merged files
temp/        - Temporary chunk storage
```

## Configuration

Edit `mockEvidenceServer.js` to change:
- `PORT`: Server port (default: 3001)
- `UPLOAD_DIR`: Final upload directory
- `TEMP_DIR`: Temporary chunk directory

## Production Considerations

This is a **mock server** for development. For production:

1. Replace in-memory storage with database (MongoDB, PostgreSQL)
2. Add authentication/authorization
3. Implement file validation (type, size, virus scan)
4. Use cloud storage (S3, Azure Blob) instead of local filesystem
5. Add rate limiting
6. Implement proper error handling
7. Add logging (Winston, Bunyan)
8. Use environment variables for configuration
9. Add upload expiration/cleanup
10. Implement resumable upload protocol (tus.io)

## Testing with cURL

```bash
# Upload single chunk
curl -X POST http://localhost:3001/api/evidence/upload \
  -F "chunk=@photo.jpg" \
  -F "chunkIndex=0" \
  -F "totalChunks=1" \
  -F "fileName=photo.jpg" \
  -F 'metadata={"title":"Test Photo","description":"Test"}'

# Check status
curl http://localhost:3001/api/evidence/upload/upload-123/status

# Update status
curl -X PATCH http://localhost:3001/api/evidence/upload-123/status \
  -H "Content-Type: application/json" \
  -d '{"status":"verified","comment":"Looks good"}'
```

## Troubleshooting

**Port already in use**:
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <PID> /F
```

**CORS errors**:
- Ensure server is running before starting Vite dev server
- Check CORS is enabled in server code

**Upload fails**:
- Check `uploads/` and `temp/` directories exist
- Verify file permissions
- Check server logs for errors
