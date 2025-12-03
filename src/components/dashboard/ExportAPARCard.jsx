import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useGenerateReport, useReportJob } from '../../hooks/useDashboard';

/**
 * Mock employee data
 */
const mockEmployees = [
  { id: 'EMP001', name: 'Rajesh Kumar', designation: 'Senior Engineer' },
  { id: 'EMP002', name: 'Priya Sharma', designation: 'Project Manager' },
  { id: 'EMP003', name: 'Amit Patel', designation: 'Team Lead' },
  { id: 'EMP004', name: 'Sneha Reddy', designation: 'Analyst' },
  { id: 'EMP005', name: 'Vikram Singh', designation: 'Division Head' },
];

/**
 * APARExportModal Component
 * 
 * Modal for APAR PDF export with:
 * - Employee multi-select
 * - Date range picker
 * - Progress indicator
 * - Download link when ready
 */
const APARExportModal = ({ open, onClose }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2025-12-03');
  const [jobId, setJobId] = useState(null);

  const generateMutation = useGenerateReport();
  const { data: jobData, isLoading: isPolling } = useReportJob(jobId, !!jobId);

  const handleGenerate = () => {
    const employeeIds = selectedEmployees.map((emp) => emp.id);
    
    // Simulate report generation
    const mockJobId = `JOB-${Date.now()}`;
    setJobId(mockJobId);
    
    // In real scenario:
    // generateMutation.mutate(
    //   { employeeIds, from: fromDate, to: toDate },
    //   {
    //     onSuccess: (data) => setJobId(data.jobId),
    //   }
    // );
  };

  const handleDownload = () => {
    // Mock download
    window.open('https://example.com/mock-report.pdf', '_blank');
  };

  const handleReset = () => {
    setJobId(null);
    setSelectedEmployees([]);
    setFromDate('2025-01-01');
    setToDate('2025-12-03');
  };

  const isGenerating = !!jobId && (!jobData || jobData?.status === 'pending' || jobData?.status === 'processing');
  const isCompleted = jobData?.status === 'completed';
  const isFailed = jobData?.status === 'failed';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="error" />
          <Typography variant="h6">Export APAR Pack</Typography>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {/* Employee Selection */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Select Employees
        </Typography>
        <Autocomplete
          multiple
          options={mockEmployees}
          getOptionLabel={(option) => `${option.name} (${option.designation})`}
          value={selectedEmployees}
          onChange={(_, newValue) => setSelectedEmployees(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search employees..."
              variant="outlined"
              size="small"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                size="small"
                {...getTagProps({ index })}
              />
            ))
          }
          disabled={isGenerating || isCompleted}
          sx={{ mb: 3 }}
        />

        {/* Date Range */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Assessment Period
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
            disabled={isGenerating || isCompleted}
          />
          <TextField
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
            disabled={isGenerating || isCompleted}
          />
        </Box>

        {/* Progress Indicator */}
        {isGenerating && (
          <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Generating signed PDF report...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This may take 30-60 seconds depending on the number of employees.
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Alert>
        )}

        {/* Success State */}
        {isCompleted && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Report generated successfully!
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your signed PDF is ready for download.
            </Typography>
          </Alert>
        )}

        {/* Error State */}
        {isFailed && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Report generation failed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Please try again or contact support if the issue persists.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isCompleted ? (
          <>
            <Button onClick={handleReset} variant="outlined">
              Generate New Report
            </Button>
            <Button
              onClick={handleDownload}
              variant="contained"
              startIcon={<DownloadIcon />}
            >
              Download PDF
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              variant="contained"
              disabled={selectedEmployees.length === 0 || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <PdfIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate Signed PDF'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

/**
 * ExportAPARCard Component
 * 
 * Card with button to trigger APAR export modal
 */
const ExportAPARCard = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Export APAR Pack
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95, mb: 3 }}>
            Generate digitally signed Annual Performance Assessment Reports for selected employees
          </Typography>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              bgcolor: 'white',
              color: '#f5576c',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Export Modal */}
      <APARExportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default ExportAPARCard;
