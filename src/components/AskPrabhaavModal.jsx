import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Tooltip,
  Stack,
  Avatar,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Article as ArticleIcon,
  Assessment as AssessmentIcon,
  VerifiedUser as VerifiedUserIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQueryAi, useQueryHistory, useSaveQuery } from '../hooks/useAiApi';
import { useNavigate } from 'react-router-dom';

/**
 * Ask Prabhaav Modal - AI-powered natural language query interface
 * 
 * Features:
 * - Natural language input for KPIs, projects, evidence queries
 * - Conversation context with recent queries
 * - Explainable result cards with citations
 * - Quick action buttons (drilldown, export, save)
 * - Source attribution with confidence scores
 * 
 * @param {boolean} open - Modal visibility
 * @param {function} onClose - Close handler
 * @param {object} context - Initial context {orgId, divisionId, userId, projectId}
 */
const AskPrabhaavModal = ({ open, onClose, context = {} }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // State
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);

  // API hooks
  const queryAiMutation = useQueryAi();
  const { data: historyData } = useQueryHistory({ limit: 5 });
  const saveQueryMutation = useSaveQuery();

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle query submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!query.trim() || queryAiMutation.isPending) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setQuery('');

    try {
      const result = await queryAiMutation.mutateAsync({
        query: query.trim(),
        context: {
          ...context,
          conversationHistory: conversation.slice(-2), // Last 2 exchanges for context
        },
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.answer,
        metadata: {
          confidence: result.confidence,
          highlights: result.highlights || [],
          actions: result.actions || [],
          sources: result.sources || [],
          processingTime: result.processingTime,
        },
        timestamp: new Date().toISOString(),
      };

      setConversation((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message || 'Failed to process query. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, errorMessage]);
    }
  };

  // Handle recent query selection
  const handleSelectRecentQuery = (recentQuery) => {
    setQuery(recentQuery.query);
    setSelectedQuery(recentQuery);
    inputRef.current?.focus();
  };

  // Handle action button clicks
  const handleAction = (action) => {
    if (action.type === 'drill') {
      navigate(action.target);
      onClose();
    } else if (action.type === 'export') {
      handleExport(action.data);
    } else if (action.type === 'save') {
      handleSaveQuery(action.query);
    }
  };

  // Save query to favorites
  const handleSaveQuery = async (queryText) => {
    try {
      await saveQueryMutation.mutateAsync({ query: queryText });
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  };

  // Export conversation
  const handleExport = (data) => {
    const exportData = data || conversation;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prabhaav-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy answer to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Clear conversation
  const handleClear = () => {
    setConversation([]);
    setQuery('');
    setSelectedQuery(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <PsychologyIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Ask Prabhaav</Typography>
          <Typography variant="caption" color="text.secondary">
            Natural language queries about KPIs, projects, and evidence
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ flex: 1, display: 'flex', gap: 2, p: 0 }}>
        {/* Recent Queries Sidebar */}
        <Box
          sx={{
            width: 200,
            borderRight: 1,
            borderColor: 'divider',
            p: 2,
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            <HistoryIcon fontSize="small" />
            Recent Queries
          </Typography>
          <List dense>
            {historyData?.queries?.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectRecentQuery(item)}
                  selected={selectedQuery?.id === item.id}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primary={item.query}
                    primaryTypographyProps={{
                      variant: 'body2',
                      noWrap: true,
                    }}
                    secondary={new Date(item.timestamp).toLocaleDateString()}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Conversation Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
            {conversation.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  color: 'text.secondary',
                }}
              >
                <PsychologyIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="h6">Ask me anything</Typography>
                <Typography variant="body2" textAlign="center" sx={{ maxWidth: 400 }}>
                  Try questions like:
                </Typography>
                <Stack spacing={1} sx={{ maxWidth: 400 }}>
                  {[
                    'What is the current score for HQ Operations?',
                    'Which projects are behind schedule?',
                    'Show me evidence submitted last week',
                    'Compare Team A vs Team B performance',
                  ].map((example, idx) => (
                    <Chip
                      key={idx}
                      label={example}
                      onClick={() => setQuery(example)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                {conversation.map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    onAction={handleAction}
                    onCopy={handleCopy}
                    onSave={() => handleSaveQuery(message.content)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Loading Indicator */}
          {queryAiMutation.isPending && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Analyzing your query...
              </Typography>
            </Box>
          )}

          {/* Input Form */}
          <Paper
            component="form"
            onSubmit={handleSubmit}
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask about KPIs, projects, evidence, or performance..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputRef={inputRef}
              disabled={queryAiMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!query.trim() || queryAiMutation.isPending}
              sx={{ minWidth: 100 }}
            >
              <SendIcon />
            </Button>
          </Paper>

          {/* Context Info */}
          {Object.keys(context).length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Context: {Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', gap: 1 }}>
        <Tooltip title="Clear conversation">
          <IconButton onClick={handleClear} disabled={conversation.length === 0}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export conversation">
          <IconButton
            onClick={() => handleExport()}
            disabled={conversation.length === 0}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Message Card Component - Displays user queries and AI responses
 */
const MessageCard = ({ message, onAction, onCopy, onSave }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';
  const isAi = message.type === 'ai';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: isUser ? '70%' : '100%',
          p: 2,
          bgcolor: isUser ? 'primary.main' : isError ? 'error.light' : 'grey.50',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          border: 1,
          borderColor: isUser ? 'primary.main' : 'divider',
        }}
      >
        {/* User Message */}
        {isUser && (
          <Typography variant="body1">{message.content}</Typography>
        )}

        {/* Error Message */}
        {isError && (
          <Alert severity="error" sx={{ bgcolor: 'transparent' }}>
            {message.content}
          </Alert>
        )}

        {/* AI Response */}
        {isAi && (
          <>
            {/* Answer */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {message.content}
            </Typography>

            {/* Confidence Score */}
            {message.metadata?.confidence && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <VerifiedUserIcon fontSize="small" color="success" />
                  <Typography variant="caption" fontWeight="bold">
                    Confidence: {Math.round(message.metadata.confidence * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={message.metadata.confidence * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            )}

            {/* Sources */}
            {message.metadata?.sources?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sources:
                </Typography>
                <Stack spacing={1}>
                  {message.metadata.sources.map((source, idx) => (
                    <SourceCard key={idx} source={source} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Highlights */}
            {message.metadata?.highlights?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Key Findings:
                </Typography>
                <Stack spacing={1}>
                  {message.metadata.highlights.map((highlight, idx) => (
                    <Alert
                      key={idx}
                      severity="info"
                      icon={<TrendingUpIcon />}
                      sx={{ py: 0.5 }}
                    >
                      <Typography variant="body2">{highlight.snippet}</Typography>
                      {highlight.sourceId && (
                        <Typography variant="caption" color="text.secondary">
                          Source: {highlight.sourceId}
                        </Typography>
                      )}
                    </Alert>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Quick Actions */}
            {message.metadata?.actions?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Quick Actions:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {message.metadata.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      size="small"
                      variant="outlined"
                      startIcon={getActionIcon(action.type)}
                      onClick={() => onAction(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Footer Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Tooltip title="Copy answer">
                <IconButton size="small" onClick={() => onCopy(message.content)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save query">
                <IconButton size="small" onClick={onSave}>
                  <BookmarkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Processing Time */}
            {message.metadata?.processingTime && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Processed in {message.metadata.processingTime}ms
              </Typography>
            )}
          </>
        )}

        {/* Timestamp */}
        <Typography variant="caption" color={isUser ? 'inherit' : 'text.secondary'} sx={{ display: 'block', mt: 1 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

/**
 * Source Card Component - Displays citation with link
 */
const SourceCard = ({ source }) => {
  const getSourceIcon = (type) => {
    switch (type) {
      case 'kpi':
        return <AssessmentIcon fontSize="small" />;
      case 'evidence':
        return <ArticleIcon fontSize="small" />;
      case 'project':
        return <TrendingUpIcon fontSize="small" />;
      default:
        return <ArticleIcon fontSize="small" />;
    }
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getSourceIcon(source.type)}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              {source.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {source.snippet}
            </Typography>
          </Box>
          {source.link && (
            <IconButton size="small" component={Link} href={source.link} target="_blank">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Get icon for action type
 */
const getActionIcon = (type) => {
  switch (type) {
    case 'drill':
      return <OpenInNewIcon />;
    case 'export':
      return <DownloadIcon />;
    case 'save':
      return <BookmarkIcon />;
    default:
      return <OpenInNewIcon />;
  }
};

export default AskPrabhaavModal;
