import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  TextField,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Restore as RestoreIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  useWeightsConfig,
  useWeightHistory,
  useSaveWeights,
  useRollbackWeights,
  useCalibrationPreview,
} from '../../hooks/useAdminApi';

/**
 * validateWeights
 * Validates that weights sum to 1.0 (100%) at each level
 */
export function validateWeights(categories) {
  const errors = [];

  // Validate category weights sum to 1.0
  const categorySum = Object.values(categories).reduce((sum, cat) => sum + cat.weight, 0);
  if (Math.abs(categorySum - 1.0) > 0.001) {
    errors.push({
      type: 'category',
      message: `Category weights must sum to 100% (currently ${(categorySum * 100).toFixed(1)}%)`,
    });
  }

  // Validate KPI weights within each category sum to 1.0
  Object.entries(categories).forEach(([catKey, category]) => {
    const kpiSum = category.kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    if (Math.abs(kpiSum - 1.0) > 0.001) {
      errors.push({
        type: 'kpi',
        category: catKey,
        message: `${catKey} KPI weights must sum to 100% (currently ${(kpiSum * 100).toFixed(1)}%)`,
      });
    }
  });

  return errors;
}

/**
 * WeightEditor Component
 * Allows admins to edit KPI weights with validation and preview
 */
export default function WeightEditor() {
  const { data: weightsConfig, isLoading } = useWeightsConfig(true);
  const { data: weightHistory } = useWeightHistory(true);
  const saveWeightsMutation = useSaveWeights();
  const rollbackMutation = useRollbackWeights();
  const calibrationMutation = useCalibrationPreview(true);

  // Local state for editing
  const [editedWeights, setEditedWeights] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [saveReason, setSaveReason] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Initialize edited weights when config loads
  useEffect(() => {
    if (weightsConfig && !editedWeights) {
      setEditedWeights(JSON.parse(JSON.stringify(weightsConfig.categories)));
    }
  }, [weightsConfig, editedWeights]);

  // Validate on changes
  useEffect(() => {
    if (editedWeights) {
      const errors = validateWeights(editedWeights);
      setValidationErrors(errors);
    }
  }, [editedWeights]);

  const handleCategoryWeightChange = (categoryKey, value) => {
    setEditedWeights((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        weight: value / 100,
      },
    }));
  };

  const handleKpiWeightChange = (categoryKey, kpiId, value) => {
    setEditedWeights((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        kpis: prev[categoryKey].kpis.map((kpi) =>
          kpi.id === kpiId ? { ...kpi, weight: value / 100 } : kpi
        ),
      },
    }));
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) return;

    try {
      await saveWeightsMutation.mutateAsync({
        categories: editedWeights,
        reason: saveReason,
        adminId: 'admin@example.com', // Replace with actual auth
      });
      setSaveDialogOpen(false);
      setSaveReason('');
    } catch (error) {
      console.error('Failed to save weights:', error);
    }
  };

  const handlePreview = async () => {
    if (validationErrors.length > 0) return;

    try {
      await calibrationMutation.mutateAsync(editedWeights);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Failed to run preview:', error);
    }
  };

  const handleRollback = async (versionId) => {
    try {
      await rollbackMutation.mutateAsync({
        versionId,
        metadata: {
          adminId: 'admin@example.com',
          reason: 'Manual rollback from weight editor',
        },
      });
      setRollbackDialogOpen(false);
    } catch (error) {
      console.error('Failed to rollback:', error);
    }
  };

  const handleReset = () => {
    setEditedWeights(JSON.parse(JSON.stringify(weightsConfig.categories)));
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const hasChanges =
    editedWeights &&
    JSON.stringify(editedWeights) !== JSON.stringify(weightsConfig?.categories);

  if (isLoading || !editedWeights) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const categoryLabels = {
    hq_operations: 'HQ Operations',
    field_operations: 'Field Operations',
    team_collaboration: 'Team Collaboration',
    individual_behavior: 'Individual Behavior',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            KPI Weight Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current version: {weightsConfig.version} • Last updated:{' '}
            {new Date(weightsConfig.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={() => setRollbackDialogOpen(true)}
          >
            History
          </Button>
          <Button variant="outlined" onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
            disabled={validationErrors.length > 0 || !hasChanges}
          >
            Preview Impact
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={validationErrors.length > 0 || !hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          {validationErrors.map((error, idx) => (
            <Typography key={idx} variant="body2">
              • {error.message}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Category Weights Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Category Weights
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell width="50%">Weight Distribution</TableCell>
                  <TableCell width="15%">Weight (%)</TableCell>
                  <TableCell width="10%">KPIs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(editedWeights).map(([catKey, category]) => (
                  <React.Fragment key={catKey}>
                    <TableRow hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => toggleCategory(catKey)}
                          >
                            {expandedCategories[catKey] ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {categoryLabels[catKey]}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Slider
                          value={category.weight * 100}
                          onChange={(e, val) => handleCategoryWeightChange(catKey, val)}
                          min={0}
                          max={100}
                          step={1}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 50, label: '50%' },
                            { value: 100, label: '100%' },
                          ]}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={(category.weight * 100).toFixed(1)}
                          onChange={(e) =>
                            handleCategoryWeightChange(catKey, parseFloat(e.target.value))
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={category.kpis.length} size="small" />
                      </TableCell>
                    </TableRow>

                    {/* KPI Weights (Collapsible) */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ p: 0 }}>
                        <Collapse in={expandedCategories[catKey]} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {categoryLabels[catKey]} - KPI Weights
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>KPI</TableCell>
                                  <TableCell width="50%">Weight Distribution</TableCell>
                                  <TableCell width="15%">Weight (%)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {category.kpis.map((kpi) => (
                                  <TableRow key={kpi.id}>
                                    <TableCell>
                                      <Typography variant="body2">{kpi.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Slider
                                        value={kpi.weight * 100}
                                        onChange={(e, val) =>
                                          handleKpiWeightChange(catKey, kpi.id, val)
                                        }
                                        min={0}
                                        max={100}
                                        step={1}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        type="number"
                                        value={(kpi.weight * 100).toFixed(1)}
                                        onChange={(e) =>
                                          handleKpiWeightChange(
                                            catKey,
                                            kpi.id,
                                            parseFloat(e.target.value)
                                          )
                                        }
                                        size="small"
                                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                                        sx={{ width: 80 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`Total Categories: ${Object.keys(editedWeights).length}`}
              color="primary"
            />
            <Chip
              label={`Total KPIs: ${Object.values(editedWeights).reduce(
                (sum, cat) => sum + cat.kpis.length,
                0
              )}`}
              color="primary"
            />
            <Chip
              label={
                hasChanges
                  ? 'Unsaved Changes'
                  : `Current: ${weightsConfig.version}`
              }
              color={hasChanges ? 'warning' : 'success'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Weight Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This will create a new weight version and apply changes to all employee scores.
          </Typography>
          <TextField
            fullWidth
            label="Reason for Change"
            value={saveReason}
            onChange={(e) => setSaveReason(e.target.value)}
            multiline
            rows={3}
            required
            sx={{ mt: 2 }}
            placeholder="e.g., Increased field operations weight based on Q4 review"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!saveReason.trim() || saveWeightsMutation.isPending}
          >
            {saveWeightsMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog
        open={rollbackDialogOpen}
        onClose={() => setRollbackDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Weight Version History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weightHistory?.map((version) => (
                  <TableRow key={version.version}>
                    <TableCell>{version.version}</TableCell>
                    <TableCell>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{version.createdBy}</TableCell>
                    <TableCell>
                      <Tooltip title={version.reason}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {version.reason}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {version.isActive ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {!version.isActive && (
                        <Button
                          size="small"
                          onClick={() => handleRollback(version.version)}
                          disabled={rollbackMutation.isPending}
                        >
                          Rollback
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog (placeholder, actual preview in CalibrationPreview component) */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Calibration Preview</DialogTitle>
        <DialogContent>
          {calibrationMutation.data && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This preview shows the impact of proposed weight changes on {calibrationMutation.data.summary.employeesAnalyzed} employees.
              </Alert>
              <Typography variant="h6">Summary</Typography>
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                <Chip label={`Avg Change: ${calibrationMutation.data.summary.avgScoreChange > 0 ? '+' : ''}${calibrationMutation.data.summary.avgScoreChange}`} />
                <Chip label={`Impacted: ${calibrationMutation.data.summary.impactedEmployees}`} />
                <Chip label={`Significant: ${calibrationMutation.data.summary.significantChanges}`} color="warning" />
              </Box>
              {/* Full preview rendered in CalibrationPreview component */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
