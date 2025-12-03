/**
 * Mock Server Endpoints for Evidence Upload
 * 
 * This file provides example server-side code for handling:
 * - Chunked file uploads
 * - Upload status tracking
 * - Resumable uploads
 * 
 * Technology: Express.js + Multer
 * 
 * Install dependencies:
 * npm install express multer fs-extra cors
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Upload storage directory
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure directories exist
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(TEMP_DIR);

// Configure multer for chunk uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uploadId = req.body.uploadId || `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chunkIndex = req.body.chunkIndex || 0;
    cb(null, `${uploadId}-chunk-${chunkIndex}`);
  },
});

const upload = multer({ storage });

// In-memory upload tracking
const uploads = new Map();

/**
 * POST /api/evidence/upload
 * Handle chunked file upload
 * 
 * Body (multipart/form-data):
 * - chunk: File (binary chunk data)
 * - chunkIndex: number (0-based index)
 * - totalChunks: number
 * - uploadId: string (optional for first chunk)
 * - fileName: string
 * - metadata: JSON string { title, description, tags, location, timestamp }
 */
app.post('/api/evidence/upload', upload.single('chunk'), async (req, res) => {
  try {
    const { chunkIndex, totalChunks, uploadId: existingUploadId, fileName, metadata } = req.body;
    const chunkIndexNum = parseInt(chunkIndex, 10);
    const totalChunksNum = parseInt(totalChunks, 10);

    // Generate or retrieve upload ID
    let uploadId = existingUploadId;
    if (!uploadId || chunkIndexNum === 0) {
      uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Initialize upload tracking
    if (!uploads.has(uploadId)) {
      uploads.set(uploadId, {
        id: uploadId,
        fileName,
        metadata: JSON.parse(metadata || '{}'),
        totalChunks: totalChunksNum,
        receivedChunks: [],
        createdAt: new Date().toISOString(),
        status: 'uploading',
      });
    }

    const uploadInfo = uploads.get(uploadId);
    uploadInfo.receivedChunks.push(chunkIndexNum);

    // Simulate processing delay (remove in production)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if all chunks received
    if (uploadInfo.receivedChunks.length === totalChunksNum) {
      // Merge chunks into final file
      await mergeChunks(uploadId, fileName, totalChunksNum);
      uploadInfo.status = 'completed';
      uploadInfo.completedAt = new Date().toISOString();

      // Store evidence metadata in database (mock)
      const evidenceRecord = {
        id: uploadId,
        fileName,
        filePath: path.join(UPLOAD_DIR, `${uploadId}-${fileName}`),
        metadata: uploadInfo.metadata,
        uploadedAt: uploadInfo.completedAt,
      };

      console.log('Evidence uploaded:', evidenceRecord);

      return res.json({
        uploadId,
        status: 'completed',
        message: 'Upload completed successfully',
        evidenceId: uploadId,
        progress: 100,
      });
    }

    // Partial upload response
    const progress = Math.round((uploadInfo.receivedChunks.length / totalChunksNum) * 100);
    res.json({
      uploadId,
      status: 'uploading',
      message: `Chunk ${chunkIndexNum + 1}/${totalChunksNum} received`,
      progress,
      receivedChunks: uploadInfo.receivedChunks.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
});

/**
 * Merge chunks into final file
 */
async function mergeChunks(uploadId, fileName, totalChunks) {
  const finalPath = path.join(UPLOAD_DIR, `${uploadId}-${fileName}`);
  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${uploadId}-chunk-${i}`);
    const chunkBuffer = await fs.readFile(chunkPath);
    writeStream.write(chunkBuffer);
    await fs.remove(chunkPath); // Clean up chunk
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * GET /api/evidence/upload/:uploadId/status
 * Get upload status
 */
app.get('/api/evidence/upload/:uploadId/status', (req, res) => {
  const { uploadId } = req.params;

  if (!uploads.has(uploadId)) {
    return res.status(404).json({
      error: 'Upload not found',
      message: `Upload ID ${uploadId} does not exist`,
    });
  }

  const uploadInfo = uploads.get(uploadId);
  const progress = Math.round((uploadInfo.receivedChunks.length / uploadInfo.totalChunks) * 100);

  res.json({
    uploadId,
    status: uploadInfo.status,
    progress,
    receivedChunks: uploadInfo.receivedChunks.length,
    totalChunks: uploadInfo.totalChunks,
    createdAt: uploadInfo.createdAt,
    completedAt: uploadInfo.completedAt || null,
  });
});

/**
 * PATCH /api/evidence/:id/status
 * Update evidence status (verify, reject, etc.)
 * 
 * Body:
 * - status: string (pending|verified|rejected)
 * - comment: string (optional)
 */
app.patch('/api/evidence/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  if (!uploads.has(id)) {
    return res.status(404).json({
      error: 'Evidence not found',
      message: `Evidence ID ${id} does not exist`,
    });
  }

  const uploadInfo = uploads.get(id);
  uploadInfo.status = status;
  uploadInfo.statusComment = comment;
  uploadInfo.statusUpdatedAt = new Date().toISOString();

  res.json({
    id,
    status: uploadInfo.status,
    statusComment: uploadInfo.statusComment,
    statusUpdatedAt: uploadInfo.statusUpdatedAt,
    message: 'Status updated successfully',
  });
});

/**
 * DELETE /api/evidence/upload/:uploadId
 * Cancel and clean up upload
 */
app.delete('/api/evidence/upload/:uploadId', async (req, res) => {
  const { uploadId } = req.params;

  if (!uploads.has(uploadId)) {
    return res.status(404).json({
      error: 'Upload not found',
      message: `Upload ID ${uploadId} does not exist`,
    });
  }

  const uploadInfo = uploads.get(uploadId);

  // Clean up chunks
  for (let i = 0; i < uploadInfo.totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${uploadId}-chunk-${i}`);
    await fs.remove(chunkPath).catch(() => {});
  }

  // Remove from tracking
  uploads.delete(uploadId);

  res.json({
    message: 'Upload cancelled and cleaned up',
    uploadId,
  });
});

/**
 * GET /api/evidence
 * List all uploaded evidence (for testing)
 */
app.get('/api/evidence', (req, res) => {
  const evidenceList = Array.from(uploads.values())
    .filter((upload) => upload.status === 'completed')
    .map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      metadata: upload.metadata,
      uploadedAt: upload.completedAt,
    }));

  res.json({
    total: evidenceList.length,
    evidence: evidenceList,
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeUploads: uploads.size,
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Evidence upload server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Temp directory: ${TEMP_DIR}`);
});

module.exports = app;
