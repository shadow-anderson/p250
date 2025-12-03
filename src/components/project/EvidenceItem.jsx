import React from 'react';
import TimeAgo from 'react-timeago';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';

/**
 * EvidenceItem Component
 * 
 * Displays a single evidence item with:
 * - Lazy-loaded image
 * - Upload badge (user + timestamp)
 * - Geo-tag indicator
 * - Completeness score
 * - Verified status
 * 
 * Props:
 * - evidence: {id, type, title, description, uploaded_by, uploaded_at, geo_tag, image_url, tags, verified, completeness_score}
 * - onVerify: (evidenceId, verified) => void
 * - onClick: (evidence) => void
 */
const EvidenceItem = ({ evidence, onVerify, onClick }) => {
  const {
    id,
    type,
    title,
    description,
    uploaded_by,
    uploaded_at,
    geo_tag,
    image_url,
    tags = [],
    verified,
    completeness_score,
  } = evidence;

  const getTypeIcon = () => {
    return type === 'image' ? <ImageIcon /> : <DocumentIcon />;
  };

  const getCompletenessColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  return (
    <Card
      elevation={1}
      sx={{
        display: 'flex',
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateX(4px)',
        },
      }}
      onClick={() => onClick?.(evidence)}
    >
      {/* Image Thumbnail */}
      {type === 'image' && image_url && (
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover' }}
          image={image_url}
          alt={title}
          loading="lazy"
        />
      )}

      {/* Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent sx={{ flex: '1 0 auto', py: 1.5 }}>
          {/* Title with Type Icon and Verified Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ mr: 0.5, color: 'text.secondary' }}>
              {getTypeIcon()}
            </Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
              {title}
            </Typography>
            {verified && (
              <Tooltip title="Verified">
                <VerifiedIcon
                  sx={{ fontSize: 18, color: 'success.main', ml: 1 }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>

          {/* Metadata Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {/* Uploader */}
            <Tooltip title={`Uploaded by ${uploaded_by}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {uploaded_by}
                </Typography>
              </Box>
            </Tooltip>

            {/* Timestamp */}
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <TimeAgo date={uploaded_at} />
            </Typography>

            {/* Geo-tag */}
            {geo_tag && (
              <>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Tooltip title={`Location: ${geo_tag.lat}, ${geo_tag.lng}`}>
                  <LocationIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                </Tooltip>
              </>
            )}
          </Box>

          {/* Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: 'rgba(37, 99, 235, 0.1)',
                  color: 'primary.main',
                }}
              />
            ))}
            {tags.length > 3 && (
              <Chip
                label={`+${tags.length - 3}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                }}
              />
            )}
          </Box>

          {/* Completeness Score */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Completeness:
            </Typography>
            <Chip
              label={`${completeness_score}%`}
              size="small"
              color={getCompletenessColor(completeness_score)}
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            />
          </Box>
        </CardContent>
      </Box>
    </Card>
  );
};

export default EvidenceItem;
