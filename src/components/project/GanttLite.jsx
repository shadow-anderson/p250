import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

/**
 * GanttLite Component
 * 
 * Lightweight Gantt chart with:
 * - Timeline visualization
 * - Draggable milestones (simulated)
 * - Zoom controls
 * - Keyboard support
 * - Status color coding
 * 
 * Props:
 * - milestones: Array of {id, title, start_date, end_date, status, progress}
 * - onMilestoneUpdate: (milestoneId, updates) => void
 */
const GanttLite = ({ milestones = [], onMilestoneUpdate }) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  // Calculate timeline bounds
  const allDates = milestones.flatMap((m) => [
    new Date(m.start_date),
    new Date(m.end_date),
  ]);
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  // Debounced update handler
  const debouncedUpdate = useCallback(
    debounce((milestoneId, updates) => {
      onMilestoneUpdate?.(milestoneId, updates);
    }, 500),
    [onMilestoneUpdate]
  );

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      'in-progress': '#3b82f6',
      delayed: '#ef4444',
      'not-started': '#94a3b8',
    };
    return colors[status] || '#64748b';
  };

  const calculatePosition = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOffset = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Project Timeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 2}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={handleResetZoom}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Timeline Container */}
      <Box
        sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'visible',
          pb: 2,
        }}
        role="region"
        aria-label="Gantt chart timeline"
      >
        <Box
          sx={{
            position: 'relative',
            minHeight: milestones.length * 60 + 40,
            transform: `scaleX(${zoom})`,
            transformOrigin: 'left',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Month Grid Lines */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  position: 'absolute',
                  left: `${(idx / 12) * 100}%`,
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed rgba(0, 0, 0, 0.1)',
                }}
              />
            ))}
          </Box>

          {/* Milestones */}
          {milestones.map((milestone, index) => {
            const position = calculatePosition(milestone.start_date, milestone.end_date);
            const isHovered = hoveredMilestone === milestone.id;

            return (
              <Box
                key={milestone.id}
                sx={{
                  position: 'absolute',
                  top: index * 60 + 20,
                  left: position.left,
                  width: position.width,
                  height: 40,
                  minWidth: '80px',
                }}
                onMouseEnter={() => setHoveredMilestone(milestone.id)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Milestone Bar */}
                <Tooltip
                  title={`${milestone.title} (${formatDate(milestone.start_date)} - ${formatDate(milestone.end_date)})`}
                  placement="top"
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: 1,
                      bgcolor: getStatusColor(milestone.status),
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'none',
                      boxShadow: isHovered ? 3 : 1,
                      '&:active': {
                        cursor: 'grabbing',
                      },
                      overflow: 'hidden',
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Milestone: ${milestone.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        // Handle keyboard interaction
                        e.preventDefault();
                      }
                    }}
                  >
                    {/* Progress Bar */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${milestone.progress}%`,
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        transition: 'width 0.3s ease',
                      }}
                    />

                    {/* Content */}
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1,
                        height: '100%',
                        color: 'white',
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {milestone.title}
                      </Typography>
                      <Chip
                        label={`${milestone.progress}%`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          color: 'white',
                          ml: 1,
                        }}
                      />
                    </Box>
                  </Box>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {[
          { status: 'completed', label: 'Completed' },
          { status: 'in-progress', label: 'In Progress' },
          { status: 'delayed', label: 'Delayed' },
          { status: 'not-started', label: 'Not Started' },
        ].map(({ status, label }) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: getStatusColor(status),
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default GanttLite;
