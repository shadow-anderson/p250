import React, { useState } from 'react';
import { Container, Grid, Box, Typography, Fab, Alert, Snackbar } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ScoreCard from '../components/employee/ScoreCard';
import TaskList from '../components/employee/TaskList';
import QuickUploadDrawer from '../components/employee/QuickUploadDrawer';
import {
  useEmployeeData,
  useEmployeeKPIs,
  useEmployeeTasks,
  useUpdateTaskStatus,
  useUploadEvidence,
  useUploadQueue,
} from '../hooks/useEmployee';

/**
 * EmployeeDashboard Page
 * Personal dashboard showing scorecard, tasks, and quick evidence upload
 * Route: /app/me
 */
export default function EmployeeDashboard() {
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data queries
  const { data: employeeData, isLoading: loadingEmployee } = useEmployeeData(true);
  const { data: kpis, isLoading: loadingKPIs } = useEmployeeKPIs(true);
  const { data: tasks, isLoading: loadingTasks } = useEmployeeTasks(true);

  // Mutations
  const updateTaskMutation = useUpdateTaskStatus();
  const uploadMutation = useUploadEvidence();

  // Upload queue
  const { queue, addToQueue, updateQueueItem } = useUploadQueue();

  const handleTaskUpdate = async ({ taskId, status, comment }) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, status, comment });
      setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update task', severity: 'error' });
    }
  };

  const handleUpload = async (formData) => {
    try {
      // Check if online
      if (navigator.onLine) {
        await uploadMutation.mutateAsync(formData);
        setSnackbar({ open: true, message: 'Evidence uploaded successfully', severity: 'success' });
        setUploadDrawerOpen(false);
      } else {
        // Add to offline queue
        const uploadItem = {
          title: formData.get('title'),
          description: formData.get('description'),
          tags: formData.get('tags'),
          file: formData.get('file').name,
          location: formData.get('location'),
          formData,
        };
        addToQueue(uploadItem);
        setSnackbar({ open: true, message: 'Evidence queued for upload', severity: 'info' });
        setUploadDrawerOpen(false);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Upload failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {loadingEmployee ? 'Loading...' : `Welcome, ${employeeData?.name || 'Employee'}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loadingEmployee ? '' : `${employeeData?.designation} • ${employeeData?.division}`}
          </Typography>
        </Box>

        {/* Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Left Column: ScoreCard */}
          <Grid item xs={12} md={5}>
            <ScoreCard kpis={kpis || []} loading={loadingKPIs} />
          </Grid>

          {/* Right Column: TaskList */}
          <Grid item xs={12} md={7}>
            <TaskList
              tasks={tasks || []}
              onUpdateStatus={handleTaskUpdate}
              loading={loadingTasks}
            />
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="quick upload"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => setUploadDrawerOpen(true)}
        >
          <AddIcon />
        </Fab>

        {/* Quick Upload Drawer */}
        <QuickUploadDrawer
          open={uploadDrawerOpen}
          onClose={() => setUploadDrawerOpen(false)}
          onUpload={handleUpload}
          uploadQueue={queue}
          uploading={uploadMutation.isPending}
        />

        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
