import React, { Suspense, lazy } from 'react';
import { Box, Container, Typography, Grid, Skeleton, CircularProgress } from '@mui/material';

// Lazy-load heavy chart components
const OrgPulseCard = lazy(() => import('../components/dashboard/OrgPulseCard'));
const TopRisksTable = lazy(() => import('../components/dashboard/TopRisksTable'));
const ExportAPARCard = lazy(() => import('../components/dashboard/ExportAPARCard'));

/**
 * Loading Skeleton for Cards
 */
const CardSkeleton = ({ height = 280 }) => (
  <Box
    sx={{
      borderRadius: 3,
      overflow: 'hidden',
      bgcolor: 'background.paper',
      boxShadow: 2,
    }}
  >
    <Skeleton variant="rectangular" width="100%" height={height} />
  </Box>
);

/**
 * ExecutiveDashboard Page
 * 
 * Main dashboard for C-level executives with:
 * - Organization Pulse: Composite KPI with 30d trend
 * - Top 10 Risks: Sortable table with severity indicators
 * - APAR Export: Generate signed PDF reports
 * 
 * Performance optimizations:
 * - React.lazy + Suspense for code splitting
 * - Skeleton loaders for better UX
 * - TanStack Query caching (5min for pulse, 1min for risks)
 * - IntersectionObserver for lazy loading (implemented in subcomponents)
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Keyboard navigation support
 * - ARIA labels for interactive elements
 * - Focus management in modals
 */
const ExecutiveDashboard = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        pt: 4,
        pb: 6,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Executive Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights into organizational performance, risks, and reporting
          </Typography>
        </Box>

        {/* Dashboard Grid Layout */}
        <Grid container spacing={3}>
          {/* Organization Pulse - Full width on mobile, half on desktop */}
          <Grid item xs={12} lg={6}>
            <Suspense fallback={<CardSkeleton height={280} />}>
              <OrgPulseCard />
            </Suspense>
          </Grid>

          {/* APAR Export Card */}
          <Grid item xs={12} lg={6}>
            <Suspense fallback={<CardSkeleton height={280} />}>
              <ExportAPARCard />
            </Suspense>
          </Grid>

          {/* Top Risks Table - Full width */}
          <Grid item xs={12}>
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <TopRisksTable />
            </Suspense>
          </Grid>
        </Grid>

        {/* Future Enhancement Placeholders */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            Drilldown links to Division/Project dashboards coming soon
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ExecutiveDashboard;
