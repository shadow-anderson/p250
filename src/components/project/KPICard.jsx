import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  OpenInNew as OpenIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * KPICard Component
 * 
 * Displays a single KPI with:
 * - Current value vs target
 * - Mini sparkline trend
 * - Audit info (weight_version & last_compute) top-right
 * - Click to drilldown
 * 
 * Props:
 * - kpi: {id, name, value, target, unit, trend, weight_version, last_compute, category}
 * - onDrill: (kpi) => void
 */
const KPICard = ({ kpi, onDrill }) => {
  const {
    id,
    name,
    value,
    target,
    unit,
    trend = [],
    weight_version,
    last_compute,
    category,
  } = kpi;

  const isPositive = value >= target;
  const trendData = trend.map((val, idx) => ({ index: idx, value: val }));
  const lastTrendValue = trend[trend.length - 1];
  const firstTrendValue = trend[0];
  const isTrendingUp = lastTrendValue > firstTrendValue;

  const formattedDate = new Date(last_compute).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const categoryColors = {
    Financial: '#10b981',
    Progress: '#3b82f6',
    Performance: '#8b5cf6',
    Quality: '#f59e0b',
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
        },
      }}
      onClick={() => onDrill?.(kpi)}
    >
      {/* Audit Info Chip - Top Right */}
      <Tooltip title={`Weight: ${weight_version} • Computed: ${formattedDate}`}>
        <Chip
          label={`${weight_version} • ${formattedDate}`}
          size="small"
          icon={<InfoIcon />}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: '0.65rem',
            height: 20,
            bgcolor: 'rgba(0, 0, 0, 0.05)',
            '& .MuiChip-icon': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Tooltip>

      <CardContent sx={{ pt: 5 }}>
        {/* Category Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip
            label={category}
            size="small"
            sx={{
              bgcolor: categoryColors[category] || '#64748b',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        </Box>

        {/* KPI Name */}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </Typography>

        {/* Value vs Target */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mr: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unit}
          </Typography>
          {isTrendingUp ? (
            <TrendingUp
              sx={{
                ml: 1,
                fontSize: 20,
                color: isPositive ? 'success.main' : 'warning.main',
              }}
            />
          ) : (
            <TrendingDown
              sx={{
                ml: 1,
                fontSize: 20,
                color: 'error.main',
              }}
            />
          )}
        </Box>

        {/* Target */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Target: {target} {unit}
        </Typography>

        {/* Mini Sparkline */}
        {trend.length > 0 && (
          <Box sx={{ width: '100%', height: 50, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#10b981' : '#f59e0b'}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Drilldown Hint */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            mt: 2,
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiCard-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <Typography variant="caption" color="primary" sx={{ mr: 0.5 }}>
            View Details
          </Typography>
          <OpenIcon fontSize="small" color="primary" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;
