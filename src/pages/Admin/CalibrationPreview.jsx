import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/**
 * CalibrationPreview Component
 * Displays before/after score distributions, top impacted employees, and KPI delta heatmap
 * 
 * @param {Object} props.data - Calibration preview data from API
 */
export default function CalibrationPreview({ data }) {
  if (!data) return null;

  const { summary, scoreDistribution, topImpacted, kpiDeltaHeatmap } = data;

  // Prepare data for score distribution chart
  const distributionData = scoreDistribution.before.bins.map((bin, idx) => ({
    range: bin.range,
    before: bin.count,
    after: scoreDistribution.after.bins[idx].count,
  }));

  // Get delta color
  const getDeltaColor = (delta) => {
    if (delta > 5) return '#4caf50'; // green
    if (delta > 0) return '#8bc34a'; // light green
    if (delta < -5) return '#f44336'; // red
    if (delta < 0) return '#ff9800'; // orange
    return '#9e9e9e'; // gray
  };

  // Get delta icon
  const getDeltaIcon = (delta) => {
    if (delta > 0) return <TrendingUpIcon fontSize="small" />;
    if (delta < 0) return <TrendingDownIcon fontSize="small" />;
    return <TrendingFlatIcon fontSize="small" />;
  };

  // Get heatmap color intensity
  const getHeatmapColor = (avgImpact) => {
    const absImpact = Math.abs(avgImpact);
    if (absImpact > 3) return avgImpact > 0 ? '#4caf50' : '#f44336';
    if (absImpact > 2) return avgImpact > 0 ? '#8bc34a' : '#ff9800';
    if (absImpact > 1) return avgImpact > 0 ? '#c5e1a5' : '#ffcc80';
    return '#e0e0e0';
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Employees Analyzed
              </Typography>
              <Typography variant="h4">{summary.employeesAnalyzed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Score Change
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: summary.avgScoreChange > 0 ? 'success.main' : 'error.main' }}
              >
                {summary.avgScoreChange > 0 ? '+' : ''}
                {summary.avgScoreChange.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Impacted Employees
              </Typography>
              <Typography variant="h4">{summary.impactedEmployees}</Typography>
              <Typography variant="caption" color="text.secondary">
                {((summary.impactedEmployees / summary.employeesAnalyzed) * 100).toFixed(1)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Significant Changes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summary.significantChanges}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ±5 points or more
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Distribution Comparison */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score Distribution: Before vs After
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Before: Avg {scoreDistribution.before.avgScore} | Median{' '}
                {scoreDistribution.before.medianScore}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                After: Avg {scoreDistribution.after.avgScore} | Median{' '}
                {scoreDistribution.after.medianScore}
              </Typography>
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis label={{ value: 'Employees', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="before" fill="#2563eb" name="Before" />
              <Bar dataKey="after" fill="#7c3aed" name="After" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Impacted Employees */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Impacted Employees
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell align="center">Before</TableCell>
                  <TableCell align="center">After</TableCell>
                  <TableCell align="center">Delta</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topImpacted.map((emp) => (
                  <TableRow key={emp.employeeId}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {emp.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.employeeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{emp.division}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={emp.scoreBefore} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={emp.scoreAfter} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Chip
                          icon={getDeltaIcon(emp.delta)}
                          label={`${emp.delta > 0 ? '+' : ''}${emp.delta}`}
                          size="small"
                          sx={{
                            bgcolor: getDeltaColor(emp.delta),
                            color: 'white',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {emp.reason}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* KPI Delta Heatmap */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Per-Category Impact Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Average score change by category (sample employees shown)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {kpiDeltaHeatmap.map((category) => (
              <Grid item xs={12} md={6} key={category.category}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: getHeatmapColor(category.avgImpact),
                    color: Math.abs(category.avgImpact) > 1 ? 'white' : 'text.primary',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {category.category.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Chip
                      label={`${category.avgImpact > 0 ? '+' : ''}${category.avgImpact.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'inherit',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {category.employees.slice(0, 5).map((emp) => (
                      <Chip
                        key={emp.id}
                        label={`${emp.id}: ${emp.delta > 0 ? '+' : ''}${emp.delta.toFixed(1)}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: 'currentColor',
                          color: 'inherit',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Warning for significant changes */}
      {summary.significantChanges > (summary.employeesAnalyzed * 0.2) && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            High Impact Alert
          </Typography>
          <Typography variant="body2">
            More than 20% of employees will experience significant score changes (±5 points). Consider
            reviewing the weight adjustments before saving.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
