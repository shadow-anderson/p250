import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Fab,
  IconButton,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  CloudQueue as CloudQueueIcon,
  CloudDone as CloudDoneIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useUploadQueue, createUploadItem, UploadStatus } from '../hooks/useUploadQueue';

/**
 * EvidenceUpload Page
 * Mobile-first page for capturing and uploading evidence with camera, geo-tagging, and resumable uploads
 * Route: /evidence/upload
 */
export default function EvidenceUpload() {
  // Upload queue
  const {
    queue,
    addToQueue,
    removeFromQueue,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    stats,
  } = useUploadQueue();

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  // Metadata dialog state
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState({
    title: '',
    description: '',
    tags: '',
    location: null,
    timestamp: new Date().toISOString(),
  });

  // Geolocation state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Queue panel state
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);

  // Preview grid state
  const [previewImages, setPreviewImages] = useState([]);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Request geolocation
   */
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        };
        setCurrentMetadata((prev) => ({ ...prev, location }));
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Start camera
   */
  const startCamera = async () => {
    try {
      setCameraError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setUseFallback(true);
        setCameraError('Camera API not supported. Using file input fallback.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError(error.message);
      setUseFallback(true);
    }
  };

  /**
   * Stop camera
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  /**
   * Capture photo from camera
   */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);

      setCapturedImage(imageUrl);
      setCapturedFile(file);
      stopCamera();
      setMetadataDialogOpen(true);
      captureLocation(); // Auto-capture location
    }, 'image/jpeg', 0.9);
  };

  /**
   * Handle file input (fallback)
   */
  const handleFileInput = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      setCapturedFile(file);
      setMetadataDialogOpen(true);
      captureLocation();
    });
  };

  /**
   * Add to queue with metadata
   */
  const addToUploadQueue = () => {
    if (!capturedFile) return;

    const uploadItem = createUploadItem(capturedFile, {
      ...currentMetadata,
      timestamp: new Date().toISOString(),
    });

    addToQueue(uploadItem);

    // Add to preview grid
    setPreviewImages((prev) => [
      ...prev,
      { id: uploadItem.id, url: capturedImage, metadata: currentMetadata },
    ]);

    // Reset state
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentMetadata({
      title: '',
      description: '',
      tags: '',
      location: null,
      timestamp: new Date().toISOString(),
    });
    setMetadataDialogOpen(false);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
      previewImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case UploadStatus.QUEUED:
        return <CloudQueueIcon color="action" />;
      case UploadStatus.UPLOADING:
        return <PlayArrowIcon color="primary" />;
      case UploadStatus.PAUSED:
        return <PauseIcon color="warning" />;
      case UploadStatus.COMPLETED:
        return <CloudDoneIcon color="success" />;
      case UploadStatus.FAILED:
        return <ErrorIcon color="error" />;
      default:
        return <CloudQueueIcon />;
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      {/* App Bar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Evidence Upload
          </Typography>
          <Chip
            label={`${stats.queued + stats.uploading} active`}
            size="small"
            color={stats.uploading > 0 ? 'primary' : 'default'}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 2 }}>
        {/* Camera View */}
        {cameraActive && (
          <Card sx={{ mb: 2, position: 'relative' }}>
            <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'black' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Fab color="primary" size="large" onClick={capturePhoto}>
                <CameraIcon sx={{ fontSize: 32 }} />
              </Fab>
              <Fab color="default" onClick={stopCamera}>
                <CloseIcon />
              </Fab>
            </Box>
          </Card>
        )}

        {/* Camera Error */}
        {cameraError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setCameraError(null)}>
            {cameraError}
          </Alert>
        )}

        {/* Action Buttons */}
        {!cameraActive && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraIcon />}
              onClick={startCamera}
              sx={{ py: 2, fontSize: '1.1rem' }}
            >
              Open Camera
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<PhotoLibraryIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ py: 2, fontSize: '1.1rem' }}
            >
              Choose File
            </Button>
          </Box>
        )}

        {/* Hidden file input (fallback) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={handleFileInput}
        />

        {/* Preview Grid */}
        {previewImages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Captured Images ({previewImages.length})
            </Typography>
            <Grid container spacing={2}>
              {previewImages.map((img) => (
                <Grid item xs={6} sm={4} key={img.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={img.url}
                      alt={img.metadata.title}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="caption" noWrap>
                        {img.metadata.title || 'Untitled'}
                      </Typography>
                      {img.metadata.location && (
                        <Chip
                          icon={<LocationOnIcon />}
                          label="Geo-tagged"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Upload Queue Panel */}
        <Card>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setQueuePanelExpanded(!queuePanelExpanded)}
          >
            <Box>
              <Typography variant="h6">Upload Queue</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.completed}/{stats.total} completed • {stats.uploading} uploading • {stats.failed} failed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {stats.completed > 0 && (
                <Button size="small" onClick={(e) => { e.stopPropagation(); clearCompleted(); }}>
                  Clear
                </Button>
              )}
              <IconButton size="small">
                {queuePanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={queuePanelExpanded}>
            <Divider />
            {queue.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CloudQueueIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">No uploads in queue</Typography>
              </Box>
            ) : (
              <List>
                {queue.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>{getStatusIcon(item.status)}</ListItemIcon>
                      <ListItemText
                        primary={item.metadata.title || item.fileName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {formatFileSize(item.fileSize)} • {item.status}
                            </Typography>
                            {item.error && (
                              <Typography variant="caption" color="error" display="block">
                                {item.error}
                              </Typography>
                            )}
                            {item.status === UploadStatus.UPLOADING && (
                              <LinearProgress
                                variant="determinate"
                                value={item.progress}
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {item.status === UploadStatus.UPLOADING && (
                          <IconButton size="small" onClick={() => pauseUpload(item.id)}>
                            <PauseIcon />
                          </IconButton>
                        )}
                        {item.status === UploadStatus.PAUSED && (
                          <IconButton size="small" onClick={() => resumeUpload(item.id)}>
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                        {item.status === UploadStatus.FAILED && (
                          <IconButton size="small" onClick={() => retryUpload(item.id)}>
                            <RefreshIcon />
                          </IconButton>
                        )}
                        {(item.status === UploadStatus.QUEUED || item.status === UploadStatus.PAUSED) && (
                          <IconButton size="small" onClick={() => cancelUpload(item.id)}>
                            <CloseIcon />
                          </IconButton>
                        )}
                        {(item.status === UploadStatus.COMPLETED || item.status === UploadStatus.CANCELLED) && (
                          <IconButton size="small" onClick={() => removeFromQueue(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                    {index < queue.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Collapse>
        </Card>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Container>

      {/* Metadata Dialog */}
      <Dialog
        open={metadataDialogOpen}
        onClose={() => setMetadataDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Evidence Details</DialogTitle>
        <DialogContent>
          {capturedImage && (
            <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
              <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
            </Box>
          )}

          <TextField
            fullWidth
            label="Title"
            value={currentMetadata.title}
            onChange={(e) => setCurrentMetadata({ ...currentMetadata, title: e.target.value })}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={currentMetadata.description}
            onChange={(e) => setCurrentMetadata({ ...currentMetadata, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={currentMetadata.tags}
            onChange={(e) => setCurrentMetadata({ ...currentMetadata, tags: e.target.value })}
            placeholder="e.g., inspection, field-visit, quarterly"
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              onClick={captureLocation}
              disabled={locationLoading}
              fullWidth
            >
              {currentMetadata.location ? 'Location Captured' : 'Capture Location'}
            </Button>
            {currentMetadata.location && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  icon={<CheckCircleIcon />}
                  label={`Lat: ${currentMetadata.location.latitude.toFixed(6)}`}
                  color="success"
                />
                <Chip
                  size="small"
                  icon={<CheckCircleIcon />}
                  label={`Lng: ${currentMetadata.location.longitude.toFixed(6)}`}
                  color="success"
                />
              </Box>
            )}
            {locationError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {locationError}
              </Typography>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Timestamp: {new Date(currentMetadata.timestamp).toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={addToUploadQueue}
            disabled={!currentMetadata.title.trim()}
          >
            Add to Queue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
