import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  CloudQueue as CloudQueueIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Error as ErrorIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';

/**
 * QuickUploadDrawer Component
 * Mobile-friendly drawer for quick evidence upload with offline queue
 * 
 * @param {Object} props
 * @param {boolean} props.open - Drawer open state
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onUpload - Upload callback (formData)
 * @param {Array} props.uploadQueue - Offline upload queue
 * @param {boolean} props.uploading - Upload in progress
 */
export default function QuickUploadDrawer({
  open,
  onClose,
  onUpload,
  uploadQueue = [],
  uploading = false,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get geolocation
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setLocationError(error.message);
      }
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }

    await onUpload(formData);

    // Reset form
    setTitle('');
    setDescription('');
    setTags('');
    setFile(null);
    setLocation(null);
    setLocationError(null);
  };

  const getQueueStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <CloudQueueIcon color="action" />;
      case 'uploading':
        return <CloudUploadIcon color="primary" />;
      case 'synced':
        return <CloudDoneIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <CloudOffIcon />;
    }
  };

  const getQueueStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'uploading':
        return 'primary';
      case 'synced':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%', p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Quick Upload Evidence</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Online/Offline Status */}
        <Alert
          severity={isOnline ? 'success' : 'warning'}
          icon={isOnline ? <CloudDoneIcon /> : <CloudOffIcon />}
          sx={{ mb: 2 }}
        >
          {isOnline ? 'Online - uploads will sync immediately' : 'Offline - uploads will queue for later'}
        </Alert>

        {/* Upload Form */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., inspection, quarterly, field-visit"
            sx={{ mb: 2 }}
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            {file ? `Selected: ${file.name}` : 'Choose File'}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          {/* Geolocation */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              onClick={captureLocation}
              fullWidth
            >
              {location ? 'Location Captured' : 'Capture Location'}
            </Button>
            {location && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </Typography>
            )}
            {locationError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {locationError}
              </Typography>
            )}
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!file || !title.trim() || uploading}
            startIcon={<CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : isOnline ? 'Upload Now' : 'Add to Queue'}
          </Button>

          {uploading && <LinearProgress sx={{ mt: 1 }} />}
        </Box>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Upload Queue ({uploadQueue.length})
            </Typography>
            <List dense>
              {uploadQueue.map((item) => (
                <ListItem key={item.id}>
                  <ListItemIcon>{getQueueStatusIcon(item.status)}</ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={`Retry count: ${item.retryCount || 0}`}
                  />
                  <Chip label={item.status} size="small" color={getQueueStatusColor(item.status)} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}
