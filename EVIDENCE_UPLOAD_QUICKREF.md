# Evidence Upload - Quick Reference

## 🚀 Quick Start

### Run Dev Server
```bash
npm run dev
# Navigate to: http://localhost:5174/evidence/upload
```

### Run Mock Server (Optional)
```bash
npm install express multer fs-extra cors
npm run server
# Server at: http://localhost:3001
```

---

## 📱 User Flow

1. **Capture Photo**
   - Click "Open Camera" → Grant permission → Capture
   - Or click "Choose File" → Select image

2. **Add Metadata**
   - Enter title (required)
   - Add description and tags
   - Click "Capture Location" for GPS

3. **Queue Upload**
   - Click "Add to Queue"
   - Photo added to upload queue
   - Auto-starts when slot available (max 3 concurrent)

4. **Monitor Progress**
   - View queue panel
   - See progress bars (0-100%)
   - Pause/Resume/Cancel as needed

---

## 🎯 Key Features

| Feature | Details |
|---------|---------|
| **Camera** | Native getUserMedia + fallback |
| **Geolocation** | Auto-capture with 10s timeout |
| **Chunking** | 5MB chunks for large files |
| **Concurrency** | Max 3 simultaneous uploads |
| **Retry** | Exponential backoff: 1s, 2s, 4s, 8s, 16s |
| **Persistence** | localStorage queue survives refresh |
| **Progress** | Per-item 0-100% tracking |

---

## 🔧 API Endpoints

### Upload Chunk
```http
POST http://localhost:3001/api/evidence/upload
Content-Type: multipart/form-data

chunk, chunkIndex, totalChunks, uploadId, fileName, metadata
```

### Check Status
```http
GET http://localhost:3001/api/evidence/upload/:uploadId/status
```

### Update Status
```http
PATCH http://localhost:3001/api/evidence/:id/status
Content-Type: application/json

{"status":"verified","comment":"Approved"}
```

---

## 🧪 Testing

### Run Tests
```bash
npm test EvidenceUpload.test.jsx
```

### Test Coverage
- ✅ 15 unit tests
- ✅ Queue operations
- ✅ Chunked uploads
- ✅ Retry logic
- ✅ Pause/Resume/Cancel

---

## 🐛 Troubleshooting

### Camera Not Working
```
Error: "Camera API not supported"
Solution: Use HTTPS or localhost
```

### Location Not Working
```
Error: "Geolocation not supported"
Solution: Check HTTPS, enable location services
```

### Uploads Stuck
```
Issue: Items remain "queued"
Solution: Start mock server (npm run server)
```

---

## 📊 Hook API

```javascript
const {
  queue,              // Upload items
  addToQueue,         // Add items
  pauseUpload,        // Pause by ID
  resumeUpload,       // Resume by ID
  cancelUpload,       // Cancel by ID
  retryUpload,        // Retry failed
  clearCompleted,     // Remove completed
  stats: {
    total,            // Total items
    uploading,        // Active uploads
    completed,        // Successful
    failed,           // Failed
  },
} = useUploadQueue();
```

---

## 📂 Files

| File | Purpose |
|------|---------|
| `src/pages/EvidenceUpload.jsx` | Main UI |
| `src/hooks/useUploadQueue.js` | Queue logic |
| `src/test/EvidenceUpload.test.jsx` | Tests |
| `server/mockEvidenceServer.js` | Mock API |

---

## 🔐 Security Checklist

Production deployment:
- [ ] Add JWT authentication
- [ ] Validate file types (magic numbers)
- [ ] Scan for viruses
- [ ] Rate limit uploads
- [ ] Use HTTPS only
- [ ] Sanitize metadata
- [ ] Implement CSRF protection
- [ ] Store in database (not in-memory)

---

## 📚 Documentation

- [EVIDENCE_UPLOAD_GUIDE.md](./EVIDENCE_UPLOAD_GUIDE.md) - Full guide
- [EVIDENCE_UPLOAD_SUMMARY.md](./EVIDENCE_UPLOAD_SUMMARY.md) - Implementation details
- [server/README.md](./server/README.md) - Server docs

---

**Route**: `/evidence/upload`  
**Status**: ✅ Production-ready (with security hardening)  
**Last Updated**: December 2025
