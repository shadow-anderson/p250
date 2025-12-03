import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Box,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import TimeAgo from 'react-timeago';

/**
 * TaskList Component
 * Displays employee tasks with status toggles and inline comments
 * 
 * @param {Object} props
 * @param {Array} props.tasks - Array of task objects
 * @param {Function} props.onUpdateStatus - Callback for status updates (taskId, status, comment)
 * @param {boolean} props.loading - Loading state
 */
export default function TaskList({ tasks = [], onUpdateStatus, loading = false }) {
  const [expandedTask, setExpandedTask] = useState(null);
  const [comments, setComments] = useState({});
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingTaskId(taskId);
    await onUpdateStatus({ taskId, status: newStatus, comment: comments[taskId] || '' });
    setUpdatingTaskId(null);
    setComments((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleCommentSubmit = async (taskId) => {
    if (!comments[taskId]?.trim() || !onUpdateStatus) return;
    setUpdatingTaskId(taskId);
    const currentTask = tasks.find((t) => t.id === taskId);
    await onUpdateStatus({ taskId, status: currentTask.status, comment: comments[taskId] });
    setUpdatingTaskId(null);
    setComments((prev) => ({ ...prev, [taskId]: '' }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in-progress':
        return <CircularProgress size={24} />;
      default:
        return <RadioButtonUncheckedIcon color="action" />;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          My Tasks
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No tasks assigned
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {tasks.map((task) => (
              <Box key={task.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  {/* Task Header */}
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
                    {getStatusIcon(task.status)}
                    <Typography variant="subtitle1" sx={{ ml: 1, flex: 1, fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{
                        transform: expandedTask === task.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>

                  {/* Task Metadata */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={task.priority} size="small" color={getPriorityColor(task.priority)} />
                    <Chip label={task.status} size="small" variant="outlined" />
                    {task.dueDate && (
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={
                          <span>
                            Due <TimeAgo date={task.dueDate} />
                          </span>
                        }
                        size="small"
                        color={isOverdue(task.dueDate) ? 'error' : 'default'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={expandedTask === task.id} timeout="auto" unmountOnExit>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>

                    {/* Status Change */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="caption" sx={{ minWidth: 80 }}>
                        Update Status:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={updatingTaskId === task.id}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in-progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                      </FormControl>
                      {updatingTaskId === task.id && <CircularProgress size={20} />}
                    </Box>

                    {/* Comments Section */}
                    {task.comments?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Comments:
                        </Typography>
                        {task.comments.map((comment) => (
                          <Box key={comment.id} sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {comment.author}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {comment.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <TimeAgo date={comment.timestamp} />
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Add Comment */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Add a comment..."
                        value={comments[task.id] || ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(task.id);
                          }
                        }}
                        disabled={updatingTaskId === task.id}
                      />
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleCommentSubmit(task.id)}
                        disabled={!comments[task.id]?.trim() || updatingTaskId === task.id}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
