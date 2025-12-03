import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useGenerateReport, useFetchJobStatus } from '../../hooks/useReportApi';

/**
 * GenerateAPAR Component
 * 
 * Multi-select employees, date range, preview report items, and generate signed APAR PDFs.
 * Shows progress tracking and queued job status.
 */
export default function GenerateAPAR() {
  // Employee selection
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchInput, setEmployeeSearchInput] = useState('');

  // Date range
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Preview & generation
  const [showPreview, setShowPreview] = useState(false);
  const [generationJobId, setGenerationJobId] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);

  // Mutations and queries
  const generateMutation = useGenerateReport();
  const { data: jobStatus } = useFetchJobStatus(generationJobId, {
    enabled: !!generationJobId,
    refetchInterval: (data) => {
      if (!data) return 2000;
      return data.status === 'completed' || data.status === 'failed' ? false : 2000;
    },
  });

  // Mock employee data (in production, fetch from API)
  const allEmployees = useMemo(() => [
    { id: 'emp-001', name: 'Rajesh Kumar', division: 'East Zone', department: 'Field Operations', role: 'Senior Inspector' },
    { id: 'emp-002', name: 'Priya Sharma', division: 'West Zone', department: 'HQ Operations', role: 'Data Analyst' },
    { id: 'emp-003', name: 'Amit Patel', division: 'North Zone', department: 'Field Operations', role: 'Inspector' },
    { id: 'emp-004', name: 'Anjali Singh', division: 'South Zone', department: 'HQ Operations', role: 'Operations Manager' },
    { id: 'emp-005', name: 'Vikram Reddy', division: 'Central Zone', department: 'Field Operations', role: 'Inspector' },
    { id: 'emp-006', name: 'Sneha Gupta', division: 'East Zone', department: 'Team Collaboration', role: 'Team Lead' },
    { id: 'emp-007', name: 'Arjun Mehta', division: 'West Zone', department: 'Field Operations', role: 'Junior Inspector' },
    { id: 'emp-008', name: 'Kavita Desai', division: 'North Zone', department: 'HQ Operations', role: 'HR Manager' },
    { id: 'emp-009', name: 'Rahul Verma', division: 'South Zone', department: 'Field Operations', role: 'Senior Inspector' },
    { id: 'emp-010', name: 'Pooja Nair', division: 'Central Zone', department: 'Team Collaboration', role: 'Coordinator' },
  ], []);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchInput) return allEmployees;
    const searchLower = employeeSearchInput.toLowerCase();
    return allEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchLower) ||
        emp.division.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower)
    );
  }, [allEmployees, employeeSearchInput]);

  // Generate mock preview data
  const previewData = useMemo(() => {
    if (selectedEmployees.length === 0) return [];
    
    return selectedEmployees.map((emp) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      division: emp.division,
      department: emp.department,
      period: { start: startDate, end: endDate },
      kpiSnapshot: {
        overallScore: Math.floor(Math.random() * 30 + 60), // 60-90
        categories: [
          { name: 'HQ Operations', score: Math.floor(Math.random() * 30 + 60), weight: 25 },
          { name: 'Field Operations', score: Math.floor(Math.random() * 30 + 60), weight: 30 },
          { name: 'Team Collaboration', score: Math.floor(Math.random() * 30 + 60), weight: 15 },
          { name: 'Individual Behavior', score: Math.floor(Math.random() * 30 + 60), weight: 30 },
        ],
        evidenceCount: Math.floor(Math.random() * 50 + 20),
        milestonesCompleted: Math.floor(Math.random() * 10 + 5),
      },
    }));
  }, [selectedEmployees, startDate, endDate]);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        employeeIds: selectedEmployees.map((emp) => emp.id),
        startDate,
        endDate,
      });
      
      setGenerationJobId(result.jobId);
      setShowPreview(false);
    } catch (error) {
      console.error('Failed to start generation:', error);
    }
  };

  const handleDownload = (reportUrl) => {
    window.open(reportUrl, '_blank');
  };

  // Handle job completion
  React.useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.reports) {
      setGeneratedReports((prev) => [...prev, ...jobStatus.reports]);
      setGenerationJobId(null);
    }
  }, [jobStatus]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <CircularProgress size={24} />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  const isGenerationDisabled = selectedEmployees.length === 0 || !startDate || !endDate;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Generate APAR Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select employees and date range to generate digitally signed Annual Performance Assessment Reports
      </Typography>

      {/* Selection Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            1. Select Employees
          </Typography>
          
          <Autocomplete
            multiple
            id="employee-select"
            options={filteredEmployees}
            getOptionLabel={(option) => `${option.name} - ${option.division} (${option.department})`}
            value={selectedEmployees}
            onChange={(event, newValue) => setSelectedEmployees(newValue)}
            inputValue={employeeSearchInput}
            onInputChange={(event, newInputValue) => setEmployeeSearchInput(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search and select employees"
                placeholder="Type to search..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={`${option.name} (${option.division})`}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Selected: {selectedEmployees.length} employee(s)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            2. Select Period
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            3. Generate Reports
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={isGenerationDisabled}
            >
              Preview Report Items
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleGenerate}
              disabled={isGenerationDisabled || generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Starting...' : 'Generate Signed PDFs'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {jobStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {getStatusIcon(jobStatus.status)}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">
                  Generation {jobStatus.status === 'completed' ? 'Completed' : 'In Progress'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job ID: {generationJobId}
                </Typography>
              </Box>
            </Box>

            {jobStatus.status !== 'completed' && jobStatus.status !== 'failed' && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Processing {jobStatus.currentIndex || 0} of {jobStatus.total || 0}
                  </Typography>
                  <Typography variant="body2">
                    {jobStatus.progress || 0}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={jobStatus.progress || 0} />
              </Box>
            )}

            {jobStatus.status === 'completed' && jobStatus.reports && (
              <Alert severity="success" icon={<VerifiedIcon />}>
                Successfully generated {jobStatus.reports.length} digitally signed APAR report(s)
              </Alert>
            )}

            {jobStatus.status === 'failed' && (
              <Alert severity="error">
                Generation failed: {jobStatus.error || 'Unknown error'}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Reports
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Division</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.employeeName}</TableCell>
                      <TableCell>{report.division}</TableCell>
                      <TableCell>
                        {new Date(report.startDate).toLocaleDateString()} -{' '}
                        {new Date(report.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{new Date(report.generatedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<VerifiedIcon />}
                          label="Digitally Signed"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download Signed PDF">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(report.url)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Preview - KPI Snapshots</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Preview of performance data for selected period: {new Date(startDate).toLocaleDateString()} to{' '}
            {new Date(endDate).toLocaleDateString()}
          </Typography>

          <List>
            {previewData.map((data, index) => (
              <React.Fragment key={data.employeeId}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {data.employeeName}
                        </Typography>
                        <Chip
                          label={`Overall: ${data.kpiSnapshot.overallScore}%`}
                          color={data.kpiSnapshot.overallScore >= 75 ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          {data.division} • {data.department}
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          {data.kpiSnapshot.categories.map((cat) => (
                            <Grid item xs={6} key={cat.name}>
                              <Typography variant="caption">
                                {cat.name}: {cat.score}% (weight: {cat.weight}%)
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Evidence: {data.kpiSnapshot.evidenceCount} • Milestones: {data.kpiSnapshot.milestonesCompleted}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generateMutation.isPending}>
            Generate Signed PDFs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
