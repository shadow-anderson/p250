import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline, Fab, Tooltip } from '@mui/material';
import { Psychology as PsychologyIcon } from '@mui/icons-material';
import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ProjectDashboard from './pages/ProjectDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EvidenceUpload from './pages/EvidenceUpload';
import Admin from './pages/Admin';
import GenerateAPAR from './pages/Reports/GenerateAPAR';
import AskPrabhaavModal from './components/AskPrabhaavModal';

// Create TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create MUI theme with custom colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#3b82f6',
    },
    secondary: {
      main: '#7c3aed',
      dark: '#6d28d9',
      light: '#8b5cf6',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

/**
 * App Component
 * 
 * Main application wrapper with:
 * - React Router for navigation
 * - TanStack Query for data fetching
 * - Material UI theming
 * - AI Assistant modal (Ask Prabhaav)
 * 
 * Routes:
 * - / -> Redirects to /login
 * - /login -> Login page
 * - /app/executive -> Executive Dashboard
 * - /app/division/:divisionId/project/:projectId -> Project Dashboard
 * - /app/me -> Employee Dashboard
 * - /evidence/upload -> Evidence Upload (mobile-first)
 * - /admin -> Admin Panel (KPI weight management, audit trail)
 * - /reports/apar -> Generate APAR Reports (digitally signed PDFs)
 */
function App() {
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Default route redirects to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Login page */}
            <Route path="/login" element={<Login />} />
            
            {/* Executive Dashboard */}
            <Route path="/app/executive" element={<ExecutiveDashboard />} />
            
            {/* Project Dashboard */}
            <Route path="/app/division/:divisionId/project/:projectId" element={<ProjectDashboard />} />
            
            {/* Employee Dashboard */}
            <Route path="/app/me" element={<EmployeeDashboard />} />
            
            {/* Evidence Upload (mobile-first) */}
            <Route path="/evidence/upload" element={<EvidenceUpload />} />
            
            {/* Admin Panel */}
            <Route path="/admin" element={<Admin />} />
            
            {/* Generate APAR Reports */}
            <Route path="/reports/apar" element={<GenerateAPAR />} />
            
            {/* Catch-all: redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Floating AI Assistant Button */}
          <Tooltip title="Ask Prabhaav" placement="left">
            <Fab
              color="primary"
              aria-label="ask prabhaav"
              onClick={() => setAiModalOpen(true)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
            >
              <PsychologyIcon />
            </Fab>
          </Tooltip>

          {/* AI Assistant Modal */}
          <AskPrabhaavModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            context={{}}
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
