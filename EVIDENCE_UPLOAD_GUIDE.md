# Evidence Upload - Mobile-First Implementation Guide

## Overview

The Evidence Upload page (`/evidence/upload`) is a mobile-first interface for capturing and uploading field evidence with advanced features:

- **Camera Capture**: Native camera access with fallback for older browsers
- **Geo-Tagging**: GPS coordinates capture with permission handling
- **Resumable Uploads**: Chunked upload strategy with pause/resume/retry
- **Offline Queue**: Upload queue persists in localStorage
- **Concurrent Control**: Max 3 simultaneous uploads with exponential backoff retries

---

## Route Configuration

**Path**: `/evidence/upload`  
**Component**: `src/pages/EvidenceUpload.jsx`

### Accessing the Page
Navigate directly: `http://localhost:5174/evidence/upload`

---

## Architecture

### File Structure
```
src/
├── pages/
│   └── EvidenceUpload.jsx           # Main upload page
├── hooks/
│   └── useUploadQueue.js            # Upload queue management
└── test/
    └── EvidenceUpload.test.jsx      # Unit tests

server/
└── mockEvidenceServer.js            # Sample Express.js server
```

---

## Features

### 1. Camera Capture

**Implementation**: MediaDevices.getUserMedia API

#### Features
- **Native Camera Access**: Requests rear-facing camera on mobile
- **Video Preview**: Live video stream before capture
- **High Resolution**: 1920x1080 ideal resolution
- **Fallback Support**: `<input type="file" accept="image/*" capture="environment">` for older browsers

#### User Flow
1. Click "Open Camera" button
2. Grant camera permission
3. Video preview appears
4. Click large camera button to capture
5. Photo captured to canvas
6. Metadata dialog opens automatically

#### Error Handling
```javascript
// Permission denied
"Camera API not supported. Using file input fallback."

// No camera available
"Camera access denied. Please check permissions."
```

---

### 2. Geo-Tagging

**Implementation**: Geolocation API

#### Features
- **High Accuracy Mode**: `enableHighAccuracy: true`
- **Timeout**: 10 seconds
- **Auto-Capture**: Triggers automatically after photo capture
- **Manual Trigger**: "Capture Location" button in metadata dialog

#### Location Object
```javascript
{
  latitude: 28.7041,        // Decimal degrees
  longitude: 77.1025,       // Decimal degrees
  accuracy: 10.5,           // Meters
  timestamp: "2025-12-04T10:30:00.000Z"
}
```

#### Permission Handling
- **Granted**: Shows success chips with coordinates
- **Denied**: Shows error message, allows proceeding without location
- **Unavailable**: Graceful degradation, optional field

---

### 3. Upload Queue System

**Hook**: `useUploadQueue`

#### Features
- **Max 3 Concurrent Uploads**: Queue automatically processes next item
- **Chunked Strategy**: 5MB chunks for large files
- **Exponential Backoff**: Retries with delays: 1s, 2s, 4s, 8s, 16s
- **Max Retries**: 5 attempts before marking as failed
- **localStorage Persistence**: Queue survives page refresh
- **Progress Tracking**: Per-item progress (0-100%)

#### Upload Status Enum
```javascript
UploadStatus = {
  QUEUED: 'queued',         // Waiting to start
  UPLOADING: 'uploading',   // In progress
  PAUSED: 'paused',         // User paused
  COMPLETED: 'completed',   // Successfully uploaded
  FAILED: 'failed',         // Failed after max retries
  CANCELLED: 'cancelled',   // User cancelled
}
```

#### Hook API
```javascript
const {
  queue,                    // Array of upload items
  addToQueue,               // (items) => ids[]
  removeFromQueue,          // (itemId) => void
  updateQueueItem,          // (itemId, updates) => void
  pauseUpload,              // (itemId) => void
  resumeUpload,             // (itemId) => void
  cancelUpload,             // (itemId) => void
  retryUpload,              // (itemId) => void
  clearCompleted,           // () => void
  clearAll,                 // () => void
  activeUploadsCount,       // Number (0-3)
  stats: {
    total,                  // Total items
    queued,                 // Waiting
    uploading,              // In progress
    paused,                 // Paused by user
    completed,              // Success
    failed,                 // Failed
  },
} = useUploadQueue();
```

---

### 4. Chunked Upload Strategy

**Chunk Size**: 5MB per chunk

#### Process Flow
1. File divided into 5MB chunks
2. Each chunk uploaded sequentially with index
3. Server assembles chunks into final file
4. Progress tracked per chunk
5. Resume from last uploaded chunk on failure

#### Chunk Upload Request
```javascript
POST /api/evidence/upload

FormData:
{
  chunk: Blob,              // Binary chunk data
  chunkIndex: 0,            // 0-based index
  totalChunks: 3,           // Total number of chunks
  uploadId: "upload-123",   // Server-assigned ID (optional for first chunk)
  fileName: "photo.jpg",
  metadata: JSON.stringify({
    title: "Site Inspection",
    description: "Building A foundation check",
    tags: ["inspection", "foundation"],
    location: { latitude: 28.7041, longitude: 77.1025 },
    timestamp: "2025-12-04T10:30:00.000Z"
  })
}
```

#### Chunk Upload Response
```javascript
// Partial upload
{
  uploadId: "upload-123",
  status: "uploading",
  message: "Chunk 1/3 received",
  progress: 33,
  receivedChunks: 1
}

// Completed upload
{
  uploadId: "upload-123",
  status: "completed",
  message: "Upload completed successfully",
  evidenceId: "upload-123",
  progress: 100
}
```

---

### 5. Retry Logic with Exponential Backoff

**Initial Delay**: 1 second  
**Max Retries**: 5 attempts  
**Backoff Formula**: `delay = 1000ms * 2^retryCount`

#### Retry Sequence
```
Attempt 1: Immediate
Attempt 2: 1 second delay
Attempt 3: 2 seconds delay
Attempt 4: 4 seconds delay
Attempt 5: 8 seconds delay
Attempt 6: 16 seconds delay → Mark as FAILED
```

#### Retry Trigger
- Network timeout
- Server 5xx errors
- Connection reset
- Chunk upload failure

#### Non-Retry Errors
- 4xx client errors (except 429 rate limit)
- User cancellation
- File not found

---

## Server Endpoints

### Sample Server Implementation

**File**: `server/mockEvidenceServer.js`

#### Installation
```bash
npm install express multer fs-extra cors
node server/mockEvidenceServer.js
```

Server runs on `http://localhost:3001`

---

### API Endpoints

#### 1. POST /api/evidence/upload
Upload file chunk.

**Request**:
```http
POST /api/evidence/upload
Content-Type: multipart/form-data

chunk: <binary>
chunkIndex: 0
totalChunks: 3
uploadId: "upload-123" (optional)
fileName: "photo.jpg"
metadata: {"title":"...","description":"..."}
```

**Response** (Partial):
```json
{
  "uploadId": "upload-123",
  "status": "uploading",
  "progress": 33,
  "receivedChunks": 1
}
```

**Response** (Completed):
```json
{
  "uploadId": "upload-123",
  "status": "completed",
  "evidenceId": "upload-123",
  "progress": 100
}
```

---

#### 2. GET /api/evidence/upload/:uploadId/status
Check upload status.

**Response**:
```json
{
  "uploadId": "upload-123",
  "status": "uploading",
  "progress": 66,
  "receivedChunks": 2,
  "totalChunks": 3,
  "createdAt": "2025-12-04T10:30:00.000Z",
  "completedAt": null
}
```

---

#### 3. PATCH /api/evidence/:id/status
Update evidence status (verify/reject).

**Request**:
```json
{
  "status": "verified",
  "comment": "Approved by supervisor"
}
```

**Response**:
```json
{
  "id": "upload-123",
  "status": "verified",
  "statusComment": "Approved by supervisor",
  "statusUpdatedAt": "2025-12-04T10:35:00.000Z"
}
```

---

#### 4. DELETE /api/evidence/upload/:uploadId
Cancel upload and clean up.

**Response**:
```json
{
  "message": "Upload cancelled and cleaned up",
  "uploadId": "upload-123"
}
```

---

#### 5. GET /api/evidence
List all uploaded evidence.

**Response**:
```json
{
  "total": 42,
  "evidence": [
    {
      "id": "upload-123",
      "fileName": "photo.jpg",
      "metadata": {
        "title": "Site Inspection",
        "location": { "latitude": 28.7041, "longitude": 77.1025 }
      },
      "uploadedAt": "2025-12-04T10:35:00.000Z"
    }
  ]
}
```

---

## User Interface

### Mobile-First Design

#### Screen Layout
```
┌─────────────────────────────────┐
│  Evidence Upload    [2 active]  │ ← App Bar
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │     Open Camera  📷       │ │ ← Primary Action
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │    Choose File  🖼️        │ │ ← Secondary Action
│  └───────────────────────────┘ │
│                                 │
│  Captured Images (3)            │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ IMG │ │ IMG │ │ IMG │      │ ← Preview Grid
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  Upload Queue                   │
│  2/5 completed • 1 uploading    │
│  ┌─────────────────────────┐  │
│  │ 🔄 photo1.jpg  [▓▓▓▓▓░]│  │ ← Queue Items
│  │ ✓ photo2.jpg  [▓▓▓▓▓▓]│  │
│  │ ⏸ photo3.jpg  [▓▓░░░░]│  │
│  └─────────────────────────┘  │
└─────────────────────────────────┘
```

---

### Camera View
```
┌─────────────────────────────────┐
│                                 │
│       📹 Live Video Feed        │
│                                 │
│                                 │
│                                 │
│                                 │
│         (Camera Preview)        │
│                                 │
│                                 │
│                                 │
│      [📷]        [✕]           │ ← Capture / Close
│                                 │
└─────────────────────────────────┘
```

---

### Metadata Dialog
```
┌─────────────────────────────────┐
│  Add Evidence Details       ✕   │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │     (Photo Preview)     │   │
│  └─────────────────────────┘   │
│                                 │
│  Title: ___________________    │
│                                 │
│  Description:                   │
│  ________________________       │
│  ________________________       │
│                                 │
│  Tags: ____________________    │
│                                 │
│  [📍 Location Captured]         │
│  ✓ Lat: 28.704100              │
│  ✓ Lng: 77.102500              │
│                                 │
│  Timestamp: Dec 4, 2025 10:30  │
│                                 │
│            [Cancel] [Add to Queue]│
└─────────────────────────────────┘
```

---

## Testing

### Unit Tests

**File**: `src/test/EvidenceUpload.test.jsx`

#### Test Coverage
- ✅ Queue initialization
- ✅ Add/remove items
- ✅ Update queue items
- ✅ Automatic upload start
- ✅ Retry logic with backoff
- ✅ Pause/resume/cancel
- ✅ Max concurrent uploads (3)
- ✅ localStorage persistence
- ✅ Chunked uploads for large files
- ✅ createUploadItem helper

#### Running Tests
```bash
npm test EvidenceUpload.test.jsx
```

---

### Manual Testing Checklist

#### Camera Capture
- [ ] Open camera shows video preview
- [ ] Capture button creates photo
- [ ] Fallback works on unsupported browsers
- [ ] Camera stops after capture
- [ ] Multiple captures work

#### Geo-Tagging
- [ ] Auto-captures location after photo
- [ ] Manual "Capture Location" button works
- [ ] Shows success chips with coordinates
- [ ] Handles permission denial gracefully
- [ ] Allows proceeding without location

#### Upload Queue
- [ ] Photos added to queue with metadata
- [ ] Max 3 concurrent uploads enforced
- [ ] Progress bars update correctly
- [ ] Pause stops upload
- [ ] Resume continues from last chunk
- [ ] Cancel aborts upload
- [ ] Retry works for failed uploads
- [ ] Clear completed removes finished items

#### Network Conditions
- [ ] Handles slow network (progress visible)
- [ ] Recovers from temporary disconnection
- [ ] Retries with exponential backoff
- [ ] Marks as failed after 5 attempts
- [ ] Queue persists across page refresh

---

## Performance Optimizations

### 1. Chunked Uploads
- **Benefit**: Large files resume from last chunk on failure
- **Chunk Size**: 5MB balances memory and network efficiency
- **Memory Usage**: Only one chunk in memory at a time

### 2. Concurrent Control
- **Max 3 Uploads**: Prevents network saturation
- **Queue System**: Automatically processes next item when slot available

### 3. localStorage Persistence
- **Benefit**: Queue survives browser close/refresh
- **Storage**: ~5MB typical browser limit (queue metadata only, not file data)

### 4. Exponential Backoff
- **Benefit**: Reduces server load during issues
- **Max Delay**: 16 seconds prevents indefinite waiting

### 5. AbortController
- **Benefit**: Properly cancels fetch requests
- **Cleanup**: Frees network resources immediately

---

## Browser Compatibility

### Camera Capture
| Browser | getUserMedia | Fallback |
|---------|--------------|----------|
| Chrome 53+ | ✅ | - |
| Firefox 36+ | ✅ | - |
| Safari 11+ | ✅ | - |
| Edge 12+ | ✅ | - |
| iOS Safari 11+ | ✅ | - |
| Chrome Android | ✅ | - |
| Older browsers | ❌ | ✅ File input |

### Geolocation
| Browser | Support |
|---------|---------|
| All modern browsers | ✅ |
| Requires HTTPS | ⚠️ (or localhost) |

### localStorage
| Browser | Support | Limit |
|---------|---------|-------|
| All modern browsers | ✅ | 5-10MB |

---

## Troubleshooting

### Camera Not Working
**Issue**: "Camera API not supported"  
**Solution**: Use HTTPS or localhost. Check browser permissions.

### Location Not Capturing
**Issue**: "Geolocation not supported"  
**Solution**: Requires HTTPS. Check device has GPS/location services enabled.

### Uploads Stuck in Queue
**Issue**: Items remain in "queued" status  
**Solution**: Check network connection. Check server is running on port 3001.

### High Memory Usage
**Issue**: Browser slows down during uploads  
**Solution**: Clear completed uploads. Reduce concurrent upload count.

### Failed After Max Retries
**Issue**: Upload fails with "Upload failed after 5 attempts"  
**Solution**: Check server logs. Verify file size is reasonable. Check network stability.

---

## Security Considerations

### File Validation
```javascript
// Add file type validation
if (!file.type.startsWith('image/')) {
  throw new Error('Only image files allowed');
}

// Add file size limit (e.g., 50MB)
if (file.size > 50 * 1024 * 1024) {
  throw new Error('File too large (max 50MB)');
}
```

### Metadata Sanitization
```javascript
// Sanitize user input before upload
const sanitizeMetadata = (metadata) => ({
  title: metadata.title.trim().slice(0, 200),
  description: metadata.description.trim().slice(0, 2000),
  tags: metadata.tags.slice(0, 10).map(tag => tag.trim().slice(0, 50)),
});
```

### Authentication
```javascript
// Add JWT token to upload requests
const uploadChunk = async (item, chunkIndex, chunk) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/evidence/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
};
```

---

## Future Enhancements

### Phase 2
- [ ] Video capture support
- [ ] Photo filters/editing before upload
- [ ] Batch metadata editing
- [ ] Cloud storage integration (S3, Azure Blob)

### Phase 3
- [ ] Background sync API (ServiceWorker)
- [ ] WebRTC peer-to-peer transfer
- [ ] Compression before upload
- [ ] OCR text extraction from photos

---

## Dependencies

```json
{
  "@mui/material": "^6.x",
  "@tanstack/react-query": "^5.x",
  "react": "^19.x"
}
```

**Server Dependencies**:
```json
{
  "express": "^4.x",
  "multer": "^1.x",
  "fs-extra": "^11.x",
  "cors": "^2.x"
}
```

---

## Related Documentation

- [useUploadQueue Hook](../src/hooks/useUploadQueue.js) - Implementation details
- [Mock Server](../server/mockEvidenceServer.js) - Server-side reference
- [Tests](../src/test/EvidenceUpload.test.jsx) - Testing examples

---

**Last Updated**: December 2025  
**Author**: Development Team  
**Version**: 1.0
