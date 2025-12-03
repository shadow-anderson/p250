import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Breadcrumbs from '../components/project/Breadcrumbs';
import KPICard from '../components/project/KPICard';
import EvidenceItem from '../components/project/EvidenceItem';
import GanttLite from '../components/project/GanttLite';
import {
  useProjectMeta,
  useProjectMilestones,
  useProjectKPIs,
  useProjectEvidence,
  useVerifyEvidence,
  useUpdateMilestone,
} from '../hooks/useProject';

/**
 * KPI Detail Modal
 * Shows detailed KPI information and history
 */
const KPIDetailModal = ({ kpi, open, onClose }) => {
  if (!kpi) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{kpi.name}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Category
          </Typography>
          <Chip label={kpi.category} color="primary" size="small" />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Value
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {kpi.value} {kpi.unit}
          </Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Target
          </Typography>
          <Typography variant="h5">
            {kpi.target} {kpi.unit}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Audit Information
          </Typography>
          <Typography variant="body2">
            Weight Version: <strong>{kpi.weight_version}</strong>
          </Typography>
          <Typography variant="body2">
            Last Computed: <strong>{new Date(kpi.last_compute).toLocaleString()}</strong>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Evidence Detail Modal
 * Shows full evidence details
 */
const EvidenceDetailModal = ({ evidence, open, onClose, onVerify }) => {
  if (!evidence) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{evidence.title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {evidence.image_url && (
          <Box
            component="img"
            src={evidence.image_url}
            alt={evidence.title}
            sx={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'contain',
              mb: 2,
              borderRadius: 2,
            }}
          />
        )}
        <Typography variant="body1" gutterBottom>
          {evidence.description}
        </Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Uploaded by: <strong>{evidence.uploaded_by}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded at: <strong>{new Date(evidence.uploaded_at).toLocaleString()}</strong>
          </Typography>
          {evidence.geo_tag && (
            <Typography variant="body2" color="text.secondary">
              Location: <strong>{evidence.geo_tag.lat}, {evidence.geo_tag.lng}</strong>
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {evidence.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
        <Box>
          <Chip
            label={`Completeness: ${evidence.completeness_score}%`}
            color={evidence.completeness_score >= 90 ? 'success' : 'warning'}
          />
          {evidence.verified && (
            <Chip label="Verified" color="success" sx={{ ml: 1 }} />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!evidence.verified && (
          <Button
            variant="contained"
            onClick={() => {
              onVerify(evidence.id, true);
              onClose();
            }}
          >
            Mark as Verified
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * ProjectDashboard Page
 * 
 * Three-column layout:
 * - Left: Gantt-lite timeline
 * - Center: KPI cards grid
 * - Right: Virtualized evidence feed
 */
const ProjectDashboard = () => {
  const { divisionId, projectId } = useParams();
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

  // Data fetching
  const { data: projectMeta, isLoading: metaLoading } = useProjectMeta(projectId, true);
  const { data: milestones, isLoading: milestonesLoading } = useProjectMilestones(projectId, true);
  const { data: kpis, isLoading: kpisLoading } = useProjectKPIs(projectId, true);
  const {
    data: evidenceData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectEvidence(projectId, true);

  const verifyMutation = useVerifyEvidence(projectId);
  const updateMilestoneMutation = useUpdateMilestone(projectId);

  // Flatten evidence pages
  const allEvidence = evidenceData?.pages.flatMap((page) => page.items) || [];

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Organization', path: '/app/executive', type: 'organization' },
    { label: projectMeta?.division_name || 'Division', path: `/app/division/${divisionId}`, type: 'division' },
    { label: projectMeta?.name || 'Project', path: `/app/division/${divisionId}/project/${projectId}`, type: 'project' },
  ];

  const handleKPIDrill = useCallback((kpi) => {
    setSelectedKPI(kpi);
    setKpiModalOpen(true);
  }, []);

  const handleEvidenceClick = useCallback((evidence) => {
    setSelectedEvidence(evidence);
    setEvidenceModalOpen(true);
  }, []);

  const handleVerifyEvidence = useCallback((evidenceId, verified) => {
    verifyMutation.mutate({ evidenceId, verified });
  }, [verifyMutation]);

  const handleMilestoneUpdate = useCallback((milestoneId, updates) => {
    updateMilestoneMutation.mutate({ milestoneId, updates });
  }, [updateMilestoneMutation]);

  // Evidence list row renderer
  const EvidenceRow = ({ index, style }) => {
    const evidence = allEvidence[index];
    return (
      <div style={style}>
        <EvidenceItem
          evidence={evidence}
          onVerify={handleVerifyEvidence}
          onClick={handleEvidenceClick}
        />
      </div>
    );
  };

  if (metaLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pt: 4, pb: 6 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {projectMeta?.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`Health Score: ${projectMeta?.health_score}%`}
              color={projectMeta?.health_score >= 80 ? 'success' : 'warning'}
            />
            <Typography variant="body2" color="text.secondary">
              {projectMeta?.start_date} → {projectMeta?.end_date}
            </Typography>
          </Box>
        </Box>

        {/* Three-Column Layout */}
        <Grid container spacing={3}>
          {/* Left Column: Gantt Chart */}
          <Grid item xs={12} lg={5}>
            {milestonesLoading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : (
              <GanttLite
                milestones={milestones || []}
                onMilestoneUpdate={handleMilestoneUpdate}
              />
            )}
          </Grid>

          {/* Center Column: KPI Cards */}
          <Grid item xs={12} lg={4}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Key Performance Indicators
            </Typography>
            {kpisLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Skeleton variant="rectangular" height={200} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {(kpis || []).map((kpi) => (
                  <Grid item xs={12} sm={6} key={kpi.id}>
                    <KPICard kpi={kpi} onDrill={handleKPIDrill} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* Right Column: Evidence Feed */}
          <Grid item xs={12} lg={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: 600 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Evidence Feed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {allEvidence.length} items
              </Typography>

              {/* Virtualized List */}
              <List
                height={500}
                itemCount={allEvidence.length}
                itemSize={140}
                width="100%"
              >
                {EvidenceRow}
              </List>

              {/* Load More */}
              {hasNextPage && (
                <Button
                  fullWidth
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  startIcon={isFetchingNextPage ? <CircularProgress size={16} /> : <RefreshIcon />}
                  sx={{ mt: 2 }}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* KPI Detail Modal */}
      <KPIDetailModal
        kpi={selectedKPI}
        open={kpiModalOpen}
        onClose={() => setKpiModalOpen(false)}
      />

      {/* Evidence Detail Modal */}
      <EvidenceDetailModal
        evidence={selectedEvidence}
        open={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        onVerify={handleVerifyEvidence}
      />
    </Box>
  );
};

export default ProjectDashboard;
