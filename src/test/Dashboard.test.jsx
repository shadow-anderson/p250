/**
 * Unit and Integration Tests for Dashboard Components
 * 
 * To run these tests, install testing dependencies:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
 * 
 * Configure vitest in vite.config.js:
 * 
 * import { defineConfig } from 'vite'
 * import react from '@vitejs/plugin-react'
 * 
 * export default defineConfig({
 *   plugins: [react()],
 *   test: {
 *     globals: true,
 *     environment: 'jsdom',
 *     setupFiles: './src/test/setup.js',
 *   },
 * })
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrgPulseCard from '../components/dashboard/OrgPulseCard';
import ExportAPARCard from '../components/dashboard/ExportAPARCard';
import { mockOrgPulse } from '../hooks/useApi';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

/**
 * Test Suite: OrgPulseCard
 */
describe('OrgPulseCard', () => {
  it('renders loading skeleton initially', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgPulseCard />
      </QueryClientProvider>
    );
    
    // Should show skeleton loaders
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('displays correct KPI score and tooltip', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgPulseCard />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/78.5/)).toBeInTheDocument();
    });

    // Check for breakdown scores
    expect(screen.getByText(/82.3/)).toBeInTheDocument(); // HQ
    expect(screen.getByText(/75.1/)).toBeInTheDocument(); // Field
  });

  it('shows positive trend indicator', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgPulseCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const trendIcon = screen.getByTestId('TrendingUpIcon');
      expect(trendIcon).toBeInTheDocument();
    });
  });

  it('displays KPI chip with version and timestamp', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgPulseCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/v2.1/)).toBeInTheDocument();
    });
  });
});

/**
 * Test Suite: APAR Export Flow (Integration Test)
 */
describe('APAR Export Flow', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('opens modal when Generate Report button is clicked', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    // Click the button
    const generateButton = screen.getByText(/Generate Report/i);
    fireEvent.click(generateButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText(/Export APAR Pack/i)).toBeInTheDocument();
    });
  });

  it('allows employee selection and date range input', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText(/Generate Report/i));

    await waitFor(() => {
      // Check for employee autocomplete
      expect(screen.getByPlaceholderText(/Search employees/i)).toBeInTheDocument();
      
      // Check for date inputs
      expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/To/i)).toBeInTheDocument();
    });
  });

  it('shows progress indicator during generation', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText(/Generate Report/i));

    await waitFor(() => {
      // Select an employee (mock interaction)
      const generatePdfButton = screen.getByText(/Generate Signed PDF/i);
      fireEvent.click(generatePdfButton);
    });

    // Should show progress
    await waitFor(() => {
      expect(screen.getByText(/Generating signed PDF report/i)).toBeInTheDocument();
    });
  });

  it('displays download link when report is ready', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    // Open modal and generate
    fireEvent.click(screen.getByText(/Generate Report/i));

    await waitFor(() => {
      const generatePdfButton = screen.getByText(/Generate Signed PDF/i);
      fireEvent.click(generatePdfButton);
    });

    // Wait for completion (mocked)
    await waitFor(
      () => {
        expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

/**
 * Test Suite: Accessibility
 */
describe('Accessibility Tests', () => {
  it('export modal is keyboard navigable', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    // Open modal with Enter key
    const button = screen.getByText(/Generate Report/i);
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  it('close button in modal has proper aria label', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExportAPARCard />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText(/Generate Report/i));

    await waitFor(() => {
      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toBeInTheDocument();
    });
  });
});
