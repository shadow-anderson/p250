import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import { Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';
import { computeScore, computeScoreBreakdown, DEFAULT_WEIGHTS } from '../../utils/scoring';

/**
 * ScoreCard Component
 * Displays employee's overall performance score with category breakdown
 * 
 * @param {Object} props
 * @param {Array} props.kpis - Array of KPI objects with { category, performance, target, weight_version, last_compute }
 * @param {Object} props.weights - Category weights (defaults to DEFAULT_WEIGHTS)
 * @param {boolean} props.loading - Loading state
 */
export default function ScoreCard({ kpis = [], weights = DEFAULT_WEIGHTS, loading = false }) {
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Compute overall score and breakdown
  const overallScore = computeScore(kpis, weights);
  const breakdown = computeScoreBreakdown(kpis, weights);

  // Find audit info (weight_version & last_compute)
  const auditInfo = kpis.length > 0 ? {
    weight_version: kpis[0].weight_version || 'v1.0',
    last_compute: kpis[0].last_compute || new Date().toISOString(),
  } : null;

  // Category display config
  const categories = [
    { key: 'hq_operations', label: 'HQ Operations', color: '#2563eb' },
    { key: 'field_operations', label: 'Field Operations', color: '#7c3aed' },
    { key: 'team_collaboration', label: 'Team Collaboration', color: '#059669' },
    { key: 'individual_behavior', label: 'Individual Behavior', color: '#dc2626' },
  ];

  const handleCategoryClick = (categoryKey) => {
    const categoryKPIs = kpis.filter((k) => k.category === categoryKey);
    setSelectedCategory({ key: categoryKey, kpis: categoryKPIs });
    setDrilldownOpen(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#059669'; // green
    if (score >= 75) return '#2563eb'; // blue
    if (score >= 60) return '#f59e0b'; // amber
    return '#dc2626'; // red
  };

  return (
    <>
      <Card sx={{ position: 'relative', overflow: 'visible' }}>
        {/* Audit Info Chip */}
        {auditInfo && (
          <Chip
            icon={<InfoIcon />}
            label={`${auditInfo.weight_version} • ${new Date(auditInfo.last_compute).toLocaleDateString()}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        )}

        <CardContent>
          <Typography variant="h6" gutterBottom>
            My Performance Score
          </Typography>

          {loading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              {/* Overall Score Circle */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(overallScore)} ${overallScore * 3.6}deg, #e5e7eb 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700, color: getScoreColor(overallScore) }}>
                      {overallScore.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      out of 100
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Category Breakdown */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Category Breakdown
                </Typography>
                {categories.map((cat) => {
                  const categoryData = breakdown[cat.key];
                  if (!categoryData) return null;

                  return (
                    <Box
                      key={cat.key}
                      sx={{
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        p: 1,
                        borderRadius: 1,
                      }}
                      onClick={() => handleCategoryClick(cat.key)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cat.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: cat.color, fontWeight: 600 }}>
                          {categoryData.score.toFixed(0)} / 100
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={categoryData.score}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: cat.color },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Weight: {(categoryData.weight * 100).toFixed(0)}% • {categoryData.count} KPI(s)
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Category Drilldown Dialog */}
      <Dialog
        open={drilldownOpen}
        onClose={() => setDrilldownOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedCategory && categories.find((c) => c.key === selectedCategory.key)?.label}
          <IconButton size="small" onClick={() => setDrilldownOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCategory && (
            <List>
              {selectedCategory.kpis.map((kpi, idx) => {
                const performancePercent = kpi.category === 'individual_behavior'
                  ? (kpi.performance / 3) * 100
                  : (kpi.performance / kpi.target) * 100;

                return (
                  <React.Fragment key={idx}>
                    <ListItem sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={kpi.name}
                        secondary={
                          <>
                            {kpi.category === 'individual_behavior' ? (
                              <span>
                                Rubric Score: {kpi.performance} / 3 ({performancePercent.toFixed(0)}%)
                              </span>
                            ) : (
                              <span>
                                Performance: {kpi.performance} / {kpi.target} ({performancePercent.toFixed(0)}%)
                              </span>
                            )}
                          </>
                        }
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(performancePercent, 100)}
                        sx={{ width: '100%', mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </ListItem>
                    {idx < selectedCategory.kpis.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
