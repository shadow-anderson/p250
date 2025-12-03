import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3004';

/**
 * AI API Functions
 */

/**
 * Query AI with natural language
 * @param {string} query - Natural language query
 * @param {object} context - Context {orgId, divisionId, userId, conversationHistory}
 * @returns {Promise<object>} AI response with answer, highlights, actions, sources
 */
export const queryAi = async ({ query, context }) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process query');
  }

  return response.json();
};

/**
 * Fetch query history
 * @param {number} limit - Number of recent queries to fetch
 * @returns {Promise<object>} Query history
 */
export const fetchQueryHistory = async ({ limit = 10 }) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/history?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch query history');
  }

  return response.json();
};

/**
 * Save query to favorites
 * @param {string} query - Query text to save
 * @returns {Promise<object>} Saved query
 */
export const saveQuery = async ({ query }) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Failed to save query');
  }

  return response.json();
};

/**
 * Fetch saved queries
 * @returns {Promise<object>} Saved queries
 */
export const fetchSavedQueries = async () => {
  const response = await fetch(`${API_BASE_URL}/api/ai/saved`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch saved queries');
  }

  return response.json();
};

/**
 * Delete saved query
 * @param {string} queryId - Query ID to delete
 * @returns {Promise<void>}
 */
export const deleteSavedQuery = async ({ queryId }) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/saved/${queryId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete query');
  }

  return response.json();
};

/**
 * Get AI statistics
 * @returns {Promise<object>} Query stats
 */
export const fetchAiStats = async () => {
  const response = await fetch(`${API_BASE_URL}/api/ai/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch AI stats');
  }

  return response.json();
};

/**
 * React Query Hooks
 */

/**
 * Hook to query AI
 * @returns {object} TanStack Query mutation
 */
export const useQueryAi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: queryAi,
    onSuccess: () => {
      // Invalidate history to show new query
      queryClient.invalidateQueries({ queryKey: ['ai', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'stats'] });
    },
  });
};

/**
 * Hook to fetch query history
 * @param {object} options - Query options
 * @returns {object} TanStack Query result
 */
export const useQueryHistory = (options = {}) => {
  const { limit = 10, ...queryOptions } = options;

  return useQuery({
    queryKey: ['ai', 'history', limit],
    queryFn: () => fetchQueryHistory({ limit }),
    staleTime: 30000, // 30 seconds
    ...queryOptions,
  });
};

/**
 * Hook to save query
 * @returns {object} TanStack Query mutation
 */
export const useSaveQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'saved'] });
    },
  });
};

/**
 * Hook to fetch saved queries
 * @returns {object} TanStack Query result
 */
export const useSavedQueries = () => {
  return useQuery({
    queryKey: ['ai', 'saved'],
    queryFn: fetchSavedQueries,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to delete saved query
 * @returns {object} TanStack Query mutation
 */
export const useDeleteSavedQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'saved'] });
    },
  });
};

/**
 * Hook to fetch AI stats
 * @returns {object} TanStack Query result
 */
export const useAiStats = () => {
  return useQuery({
    queryKey: ['ai', 'stats'],
    queryFn: fetchAiStats,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook for streaming AI responses (WebSocket-based)
 * @param {function} onMessage - Callback for each message chunk
 * @param {function} onError - Error callback
 * @returns {object} Send function and connection status
 */
export const useAiStream = (onMessage, onError) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const wsRef = React.useRef(null);

  React.useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket('ws://localhost:3004/api/ai/stream');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('AI stream connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('AI stream disconnected');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [onMessage, onError]);

  const sendQuery = React.useCallback((query, context) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ query, context }));
    } else {
      console.error('WebSocket not connected');
    }
  }, []);

  return {
    sendQuery,
    isConnected,
  };
};
