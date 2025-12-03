import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Box,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  VisibilityOutlined as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRisks } from '../../hooks/useDashboard';

/**
 * Get severity color based on severity score
 */
const getSeverityColor = (severity) => {
  if (severity >= 0.8) return { bg: '#fecaca', text: '#991b1b', label: 'Critical' };
  if (severity >= 0.6) return { bg: '#fed7aa', text: '#9a3412', label: 'High' };
  if (severity >= 0.4) return { bg: '#fef08a', text: '#854d0e', label: 'Medium' };
  return { bg: '#d9f99d', text: '#365314', label: 'Low' };
};

/**
 * RiskDetailModal Component
 * Shows evidence feed for a selected risk
 */
const RiskDetailModal = ({ risk, open, onClose }) => {
  if (!risk) return null;

  // Mock evidence data
  const mockEvidence = [
    { id: 1, type: 'Milestone Slip', date: '2025-12-01', description: 'Task XYZ delayed by 3 days' },
    { id: 2, type: 'Resource Issue', date: '2025-11-28', description: 'Key team member on leave' },
    { id: 3, type: 'Budget Alert', date: '2025-11-25', description: 'Approaching 80% of allocated budget' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: getSeverityColor(risk.severity).text }} />
          <Typography variant="h6">Risk Details</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {risk.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            label={`Severity: ${(risk.severity * 100).toFixed(0)}%`}
            size="small"
            sx={{
              bgcolor: getSeverityColor(risk.severity).bg,
              color: getSeverityColor(risk.severity).text,
            }}
          />
          <Chip
            label={`Confidence: ${(risk.confidence * 100).toFixed(0)}%`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${risk.evidence_count} Evidence Items`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
          Evidence Feed
        </Typography>
        <List>
          {mockEvidence.map((evidence) => (
            <ListItem key={evidence.id} sx={{ px: 0 }}>
              <ListItemText
                primary={evidence.type}
                secondary={`${evidence.date} • ${evidence.description}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * TopRisksTable Component
 * 
 * Displays top risks with:
 * - Server-side sorting
 * - Severity color scale
 * - Click to view evidence
 * - Loading skeletons
 */
const TopRisksTable = () => {
  const [orderBy, setOrderBy] = useState('severity');
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: risks, isLoading } = useRisks({ limit: 10, sort: orderBy }, true);

  const handleSort = (field) => {
    setOrderBy(field);
  };

  const handleViewRisk = (risk) => {
    setSelectedRisk(risk);
    setModalOpen(true);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={50} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Top 10 Risks
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            High-severity risks across all divisions and projects
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      onClick={() => handleSort('title')}
                    >
                      Risk Title
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={orderBy === 'severity'}
                      onClick={() => handleSort('severity')}
                    >
                      Severity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Confidence</TableCell>
                  <TableCell align="center">Evidence</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {risks?.map((risk) => {
                  const severityColor = getSeverityColor(risk.severity);
                  return (
                    <TableRow
                      key={risk.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {risk.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {risk.id}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={severityColor.label}
                          size="small"
                          sx={{
                            bgcolor: severityColor.bg,
                            color: severityColor.text,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {(risk.confidence * 100).toFixed(0)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={risk.evidence_count}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewRisk(risk)}
                          sx={{ color: 'primary.main' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Risk Detail Modal */}
      <RiskDetailModal
        risk={selectedRisk}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default TopRisksTable;
