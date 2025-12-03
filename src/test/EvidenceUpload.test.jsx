import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadQueue, createUploadItem, UploadStatus } from '../hooks/useUploadQueue';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Helper to create mock file
function createMockFile(name = 'test.jpg', size = 1024 * 1024) {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type: 'image/jpeg' });
  file.slice = vi.fn((start, end) => {
    const slicedBuffer = buffer.slice(start, end);
    return new Blob([slicedBuffer]);
  });
  return file;
}

describe('useUploadQueue', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.queue).toEqual([]);
    expect(result.current.stats.total).toBe(0);
  });

  it('should add items to queue', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].metadata.title).toBe('Test Upload');
    expect(result.current.stats.total).toBe(1);
    expect(result.current.stats.queued).toBe(1);
  });

  it('should remove item from queue', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    expect(result.current.queue).toHaveLength(1);

    act(() => {
      result.current.removeFromQueue(uploadItem.id);
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it('should update queue item', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    act(() => {
      result.current.updateQueueItem(uploadItem.id, { progress: 50 });
    });

    expect(result.current.queue[0].progress).toBe(50);
  });

  it('should start upload automatically when item added', async () => {
    // Mock successful upload response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        uploadId: 'test-upload-id',
        status: 'completed',
        progress: 100,
      }),
    });

    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile('small.jpg', 1024); // Small file (1KB, single chunk)
    const uploadItem = createUploadItem(file, { title: 'Small Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    // Wait for upload to complete
    await waitFor(
      () => {
        expect(result.current.queue[0].status).toBe(UploadStatus.COMPLETED);
      },
      { timeout: 3000 }
    );

    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle upload failures with retry', async () => {
    vi.useFakeTimers();

    // Mock failed upload response
    global.fetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile('test.jpg', 1024);
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    // Wait for initial upload attempt
    await waitFor(() => {
      expect(result.current.queue[0].status).toBe(UploadStatus.QUEUED);
      expect(result.current.queue[0].retryCount).toBeGreaterThan(0);
    });

    vi.useRealTimers();
  });

  it('should pause upload', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    act(() => {
      result.current.pauseUpload(uploadItem.id);
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.PAUSED);
  });

  it('should resume paused upload', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    act(() => {
      result.current.pauseUpload(uploadItem.id);
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.PAUSED);

    act(() => {
      result.current.resumeUpload(uploadItem.id);
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.QUEUED);
  });

  it('should cancel upload', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    act(() => {
      result.current.cancelUpload(uploadItem.id);
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.CANCELLED);
  });

  it('should retry failed upload', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    // Manually set to failed state
    act(() => {
      result.current.updateQueueItem(uploadItem.id, {
        status: UploadStatus.FAILED,
        error: 'Network error',
        retryCount: 3,
      });
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.FAILED);

    act(() => {
      result.current.retryUpload(uploadItem.id);
    });

    expect(result.current.queue[0].status).toBe(UploadStatus.QUEUED);
    expect(result.current.queue[0].retryCount).toBe(0);
    expect(result.current.queue[0].error).toBeNull();
  });

  it('should clear completed uploads', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file1 = createMockFile('file1.jpg');
    const file2 = createMockFile('file2.jpg');
    const item1 = createUploadItem(file1, { title: 'Upload 1' });
    const item2 = createUploadItem(file2, { title: 'Upload 2' });

    act(() => {
      result.current.addToQueue([item1, item2]);
    });

    // Set first item to completed
    act(() => {
      result.current.updateQueueItem(item1.id, { status: UploadStatus.COMPLETED });
    });

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].id).toBe(item2.id);
  });

  it('should respect max concurrent uploads (3)', async () => {
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ uploadId: 'test', status: 'completed' }),
            });
          }, 100);
        })
    );

    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    // Add 5 items
    const items = Array.from({ length: 5 }, (_, i) => {
      const file = createMockFile(`file${i}.jpg`, 1024);
      return createUploadItem(file, { title: `Upload ${i}` });
    });

    act(() => {
      result.current.addToQueue(items);
    });

    // Wait a bit for uploads to start
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have max 3 active uploads
    expect(result.current.activeUploadsCount).toBeLessThanOrEqual(3);
  });

  it('should persist queue to localStorage', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile();
    const uploadItem = createUploadItem(file, { title: 'Test Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    const stored = JSON.parse(localStorageMock.getItem('evidence_upload_queue'));
    expect(stored).toHaveLength(1);
    expect(stored[0].metadata.title).toBe('Test Upload');
  });

  it('should handle chunked uploads for large files', async () => {
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const fileSize = 12 * 1024 * 1024; // 12MB (3 chunks)

    let chunkCount = 0;

    global.fetch.mockImplementation(async () => {
      chunkCount++;
      return {
        ok: true,
        json: async () => ({
          uploadId: 'test-upload-id',
          status: chunkCount === 3 ? 'completed' : 'uploading',
          progress: Math.round((chunkCount / 3) * 100),
        }),
      };
    });

    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: createWrapper(),
    });

    const file = createMockFile('large.jpg', fileSize);
    const uploadItem = createUploadItem(file, { title: 'Large Upload' });

    act(() => {
      result.current.addToQueue(uploadItem);
    });

    // Wait for all chunks to upload
    await waitFor(
      () => {
        expect(result.current.queue[0].status).toBe(UploadStatus.COMPLETED);
      },
      { timeout: 5000 }
    );

    // Should have called fetch 3 times (3 chunks)
    expect(chunkCount).toBe(3);
  });
});

describe('createUploadItem', () => {
  it('should create upload item with file and metadata', () => {
    const file = createMockFile('test.jpg', 2048);
    const metadata = {
      title: 'Test Photo',
      description: 'Test description',
      tags: ['test', 'photo'],
      location: { latitude: 28.7041, longitude: 77.1025 },
    };

    const uploadItem = createUploadItem(file, metadata);

    expect(uploadItem.id).toBeDefined();
    expect(uploadItem.fileName).toBe('test.jpg');
    expect(uploadItem.fileSize).toBe(2048);
    expect(uploadItem.fileType).toBe('image/jpeg');
    expect(uploadItem.metadata.title).toBe('Test Photo');
    expect(uploadItem.metadata.description).toBe('Test description');
    expect(uploadItem.metadata.tags).toEqual(['test', 'photo']);
    expect(uploadItem.metadata.location).toEqual({
      latitude: 28.7041,
      longitude: 77.1025,
    });
    expect(uploadItem.status).toBe(UploadStatus.QUEUED);
    expect(uploadItem.progress).toBe(0);
  });

  it('should use default values when metadata not provided', () => {
    const file = createMockFile('test.jpg');
    const uploadItem = createUploadItem(file);

    expect(uploadItem.metadata.title).toBe('test.jpg');
    expect(uploadItem.metadata.description).toBe('');
    expect(uploadItem.metadata.tags).toEqual([]);
    expect(uploadItem.metadata.location).toBeNull();
  });
});
