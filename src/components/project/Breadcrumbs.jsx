import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Business as BusinessIcon,
  AccountTree as DivisionIcon,
  Folder as ProjectIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

/**
 * Breadcrumbs Component
 * 
 * Provides hierarchical navigation:
 * Organization → Division → Project → Employee
 * 
 * Props:
 * - items: Array of {label, path, icon?}
 */
const Breadcrumbs = ({ items = [] }) => {
  const getIcon = (type) => {
    const iconMap = {
      organization: <BusinessIcon fontSize="small" />,
      division: <DivisionIcon fontSize="small" />,
      project: <ProjectIcon fontSize="small" />,
      employee: <PersonIcon fontSize="small" />,
    };
    return iconMap[type] || null;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
          },
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const icon = getIcon(item.type);

          if (isLast) {
            return (
              <Box
                key={item.path || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.primary',
                }}
              >
                {icon}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Link
              key={item.path || index}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {icon}
                <Typography variant="body2" color="inherit">
                  {item.label}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
