import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useOrgPulse } from '../../hooks/useDashboard';

/**
 * KPIChip Component
 * Displays weight version and last computation time
 */
const KPIChip = ({ weightVersion, lastCompute }) => {
  const formattedDate = new Date(lastCompute).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Tooltip title={`Last computed: ${formattedDate}`}>
      <Chip
        label={`${weightVersion} • ${formattedDate}`}
        size="small"
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontSize: '0.7rem',
          height: 24,
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          color: 'primary.main',
        }}
      />
    </Tooltip>
  );
};

/**
 * OrgPulseCard Component
 * 
 * Displays organization-wide KPI with:
 * - Overall composite score (large number)
 * - 30-day trend sparkline
 * - Breakdown by HQ vs Field
 * - Tooltip explanations
 * - Loading skeleton
 */
const OrgPulseCard = () => {
  const { data, isLoading, error } = useOrgPulse('30d', true);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: 280,
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Skeleton variant="rectangular" width="48%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Skeleton variant="rectangular" width="48%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, p: 3, bgcolor: 'error.light', color: 'white' }}>
        <Typography>Error loading organization pulse data</Typography>
      </Card>
    );
  }

  const { score, trend, breakdown, weight_version, last_compute } = data;
  const trendData = trend.map((value, index) => ({ day: index + 1, value }));
  const isPositiveTrend = trend[trend.length - 1] > trend[0];

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)',
        },
      }}
    >
      {/* KPI Version Chip */}
      <KPIChip weightVersion={weight_version} lastCompute={last_compute} />

      <CardContent sx={{ pt: 6 }}>
        {/* Header with Tooltip */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Organization Pulse
          </Typography>
          <Tooltip
            title="Composite KPI score across all divisions and projects, weighted by strategic importance"
            arrow
          >
            <InfoIcon sx={{ ml: 1, fontSize: 18, opacity: 0.8, cursor: 'help' }} />
          </Tooltip>
        </Box>

        {/* Main Score */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, mr: 1 }}>
            {score.toFixed(1)}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            / 100
          </Typography>
          {isPositiveTrend ? (
            <TrendingUp sx={{ ml: 2, fontSize: 32, color: '#4ade80' }} />
          ) : (
            <TrendingDown sx={{ ml: 2, fontSize: 32, color: '#fca5a5' }} />
          )}
        </Box>

        {/* 30-Day Trend Sparkline */}
        <Box sx={{ width: '100%', height: 80, mt: 2, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={3}
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Breakdown: HQ vs Field */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mt: 2,
          }}
        >
          {/* HQ Score */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
              HQ Operations
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {breakdown.hq.toFixed(1)}
            </Typography>
          </Box>

          {/* Field Score */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
              Field Operations
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {breakdown.field.toFixed(1)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrgPulseCard;
