import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
  Chip,
} from '@mui/material';
import {
  Tune as TuneIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import WeightEditor from './Admin/WeightEditor';
import AuditTrail from './Admin/AuditTrail';
import Logo from '../components/Logo';

/**
 * TabPanel Component
 */
function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

/**
 * Admin Component
 * Main admin panel with KPI weight management, calibration preview, and audit trail
 */
export default function Admin() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Logo size={32} />
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Chip
            icon={<AdminIcon />}
            label="Administrator"
            color="error"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab
              icon={<TuneIcon />}
              iconPosition="start"
              label="KPI Weight Configuration"
              id="admin-tab-0"
              aria-controls="admin-tabpanel-0"
            />
            <Tab
              icon={<HistoryIcon />}
              iconPosition="start"
              label="Audit Trail"
              id="admin-tab-1"
              aria-controls="admin-tabpanel-1"
            />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Panels */}
      <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
        <TabPanel value={tabValue} index={0}>
          <WeightEditor />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AuditTrail />
        </TabPanel>
      </Container>
    </Box>
  );
}
