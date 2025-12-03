import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * useUploadQueue Hook
 * Manages resumable upload queue with concurrent uploads, retries, and progress tracking
 * 
 * Features:
 * - Max 3 concurrent uploads
 * - Exponential backoff retries (max 5 attempts)
 * - Pause/Resume/Cancel individual uploads
 * - Chunked upload strategy (5MB chunks)
 * - Progress tracking per upload
 * - localStorage persistence
 */

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 5;
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const INITIAL_RETRY_DELAY = 1000; // 1 second

const QUEUE_STORAGE_KEY = 'evidence_upload_queue';

/**
 * Upload status enum
 */
export const UploadStatus = {
  QUEUED: 'queued',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Create upload item from file and metadata
 */
export function createUploadItem(file, metadata = {}) {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    metadata: {
      title: metadata.title || file.name,
      description: metadata.description || '',
      tags: metadata.tags || [],
      location: metadata.location || null,
      timestamp: metadata.timestamp || new Date().toISOString(),
      ...metadata,
    },
    status: UploadStatus.QUEUED,
    progress: 0,
    uploadedBytes: 0,
    retryCount: 0,
    error: null,
    uploadId: null, // Server-assigned upload ID
    createdAt: new Date().toISOString(),
  };
}

/**
 * Main upload queue hook
 */
export function useUploadQueue() {
  const [queue, setQueue] = useState(() => {
    // Load queue from localStorage on init
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      return [];
    }
  });

  const [activeUploads, setActiveUploads] = useState(new Map());
  const uploadControllers = useRef(new Map()); // AbortControllers for each upload
  const queryClient = useQueryClient();

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }, [queue]);

  /**
   * Add items to queue
   */
  const addToQueue = useCallback((items) => {
    const newItems = Array.isArray(items) ? items : [items];
    setQueue((prev) => [...prev, ...newItems]);
    return newItems.map((item) => item.id);
  }, []);

  /**
   * Remove item from queue
   */
  const removeFromQueue = useCallback((itemId) => {
    setQueue((prev) => prev.filter((item) => item.id !== itemId));
    uploadControllers.current.delete(itemId);
  }, []);

  /**
   * Update queue item
   */
  const updateQueueItem = useCallback((itemId, updates) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  }, []);

  /**
   * Upload single chunk with retry logic
   */
  const uploadChunk = async (item, chunkIndex, chunk, retryCount = 0) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', Math.ceil(item.fileSize / CHUNK_SIZE));
    formData.append('uploadId', item.uploadId || '');
    formData.append('fileName', item.fileName);
    formData.append('metadata', JSON.stringify(item.metadata));

    const controller = new AbortController();
    uploadControllers.current.set(`${item.id}-${chunkIndex}`, controller);

    try {
      const response = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      uploadControllers.current.delete(`${item.id}-${chunkIndex}`);
      return data;
    } catch (error) {
      uploadControllers.current.delete(`${item.id}-${chunkIndex}`);

      // Handle abort
      if (error.name === 'AbortError') {
        throw error;
      }

      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return uploadChunk(item, chunkIndex, chunk, retryCount + 1);
      }

      throw error;
    }
  };

  /**
   * Process upload for a single item
   */
  const processUpload = useCallback(async (item) => {
    if (!item.file) {
      updateQueueItem(item.id, {
        status: UploadStatus.FAILED,
        error: 'File not found',
      });
      return;
    }

    try {
      updateQueueItem(item.id, {
        status: UploadStatus.UPLOADING,
        error: null,
      });

      const totalChunks = Math.ceil(item.fileSize / CHUNK_SIZE);
      let uploadedBytes = item.uploadedBytes || 0;
      let currentChunk = Math.floor(uploadedBytes / CHUNK_SIZE);

      // Upload chunks
      while (currentChunk < totalChunks) {
        // Check if paused or cancelled
        const currentItem = queue.find((q) => q.id === item.id);
        if (currentItem?.status === UploadStatus.PAUSED) {
          return;
        }
        if (currentItem?.status === UploadStatus.CANCELLED) {
          throw new Error('Upload cancelled');
        }

        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, item.fileSize);
        const chunk = item.file.slice(start, end);

        const result = await uploadChunk(item, currentChunk, chunk);

        // Store uploadId from first chunk response
        if (currentChunk === 0 && result.uploadId) {
          updateQueueItem(item.id, { uploadId: result.uploadId });
        }

        uploadedBytes = end;
        const progress = Math.round((uploadedBytes / item.fileSize) * 100);

        updateQueueItem(item.id, {
          uploadedBytes,
          progress,
        });

        currentChunk++;
      }

      // Mark as completed
      updateQueueItem(item.id, {
        status: UploadStatus.COMPLETED,
        progress: 100,
        uploadedBytes: item.fileSize,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['projectEvidence'] });
      queryClient.invalidateQueries({ queryKey: ['employeeKPIs'] });
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        // Already handled by cancel/pause
        return;
      }

      const retryCount = (item.retryCount || 0) + 1;

      if (retryCount < MAX_RETRIES) {
        // Retry entire upload
        updateQueueItem(item.id, {
          status: UploadStatus.QUEUED,
          retryCount,
          error: error.message,
        });
      } else {
        // Max retries exceeded
        updateQueueItem(item.id, {
          status: UploadStatus.FAILED,
          error: `Upload failed after ${MAX_RETRIES} attempts: ${error.message}`,
        });
      }
    } finally {
      setActiveUploads((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [queue, queryClient, updateQueueItem]);

  /**
   * Start processing queue
   */
  useEffect(() => {
    const queuedItems = queue.filter((item) => item.status === UploadStatus.QUEUED);
    const activeCount = activeUploads.size;

    // Start new uploads if slots available
    if (activeCount < MAX_CONCURRENT_UPLOADS && queuedItems.length > 0) {
      const slotsAvailable = MAX_CONCURRENT_UPLOADS - activeCount;
      const itemsToStart = queuedItems.slice(0, slotsAvailable);

      itemsToStart.forEach((item) => {
        setActiveUploads((prev) => {
          const next = new Map(prev);
          next.set(item.id, true);
          return next;
        });
        processUpload(item);
      });
    }
  }, [queue, activeUploads, processUpload]);

  /**
   * Pause upload
   */
  const pauseUpload = useCallback((itemId) => {
    // Abort ongoing chunk uploads
    uploadControllers.current.forEach((controller, key) => {
      if (key.startsWith(itemId)) {
        controller.abort();
        uploadControllers.current.delete(key);
      }
    });

    updateQueueItem(itemId, { status: UploadStatus.PAUSED });
  }, [updateQueueItem]);

  /**
   * Resume upload
   */
  const resumeUpload = useCallback((itemId) => {
    updateQueueItem(itemId, { status: UploadStatus.QUEUED });
  }, [updateQueueItem]);

  /**
   * Cancel upload
   */
  const cancelUpload = useCallback((itemId) => {
    // Abort ongoing chunk uploads
    uploadControllers.current.forEach((controller, key) => {
      if (key.startsWith(itemId)) {
        controller.abort();
        uploadControllers.current.delete(key);
      }
    });

    updateQueueItem(itemId, { status: UploadStatus.CANCELLED });

    // Remove from active uploads
    setActiveUploads((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, [updateQueueItem]);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback((itemId) => {
    updateQueueItem(itemId, {
      status: UploadStatus.QUEUED,
      error: null,
      retryCount: 0,
      uploadedBytes: 0,
      progress: 0,
    });
  }, [updateQueueItem]);

  /**
   * Clear completed uploads
   */
  const clearCompleted = useCallback(() => {
    setQueue((prev) =>
      prev.filter((item) => item.status !== UploadStatus.COMPLETED)
    );
  }, []);

  /**
   * Clear all uploads
   */
  const clearAll = useCallback(() => {
    // Cancel all active uploads
    queue.forEach((item) => {
      if (item.status === UploadStatus.UPLOADING) {
        cancelUpload(item.id);
      }
    });
    setQueue([]);
  }, [queue, cancelUpload]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    activeUploadsCount: activeUploads.size,
    stats: {
      total: queue.length,
      queued: queue.filter((i) => i.status === UploadStatus.QUEUED).length,
      uploading: queue.filter((i) => i.status === UploadStatus.UPLOADING).length,
      paused: queue.filter((i) => i.status === UploadStatus.PAUSED).length,
      completed: queue.filter((i) => i.status === UploadStatus.COMPLETED).length,
      failed: queue.filter((i) => i.status === UploadStatus.FAILED).length,
    },
  };
}
