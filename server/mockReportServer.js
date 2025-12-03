/**
 * Mock Report Generation Server
 * 
 * Express.js server providing endpoints for APAR report generation with digital signatures.
 * 
 * Features:
 * - Queued job processing
 * - HTML to PDF conversion with Puppeteer
 * - Digital signature with PKCS7 (AWS KMS or local HSM)
 * - Job status tracking
 * - Signed PDF download
 * 
 * Run with: node server/mockReportServer.js
 * Server runs on: http://localhost:3003
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory job queue
const jobs = new Map();
const reports = new Map();

// Job ID counter
let jobIdCounter = 1;
let reportIdCounter = 1;

/**
 * Generate unique job ID
 */
function generateJobId() {
  return `job-${String(jobIdCounter++).padStart(6, '0')}`;
}

/**
 * Generate unique report ID
 */
function generateReportId() {
  return `report-${String(reportIdCounter++).padStart(8, '0')}`;
}

/**
 * Simulate report generation worker
 * In production, this would be a separate worker process
 */
async function processReportJob(jobId, employeeIds, startDate, endDate) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.startedAt = new Date().toISOString();

  const generatedReports = [];

  try {
    // Process each employee
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];

      // Update progress
      job.currentIndex = i + 1;
      job.progress = Math.round(((i + 1) / employeeIds.length) * 100);

      // Simulate processing time (fetch data, render PDF, sign)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate report
      const reportId = generateReportId();
      const report = {
        id: reportId,
        employeeId,
        employeeName: getEmployeeName(employeeId),
        division: getEmployeeDivision(employeeId),
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        url: `http://localhost:${PORT}/api/reports/download/${reportId}`,
        signedUrl: `http://localhost:${PORT}/api/reports/download/${reportId}?signed=true`,
        signature: {
          algorithm: 'SHA256withRSA',
          signer: 'CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN',
          signedAt: new Date().toISOString(),
          kmsKeyId: 'arn:aws:kms:ap-south-1:123456789012:key/example-key-id',
          valid: true,
        },
        fileSize: Math.floor(Math.random() * 500000 + 100000), // 100KB - 600KB
        pages: Math.floor(Math.random() * 10 + 5), // 5-15 pages
      };

      reports.set(reportId, report);
      generatedReports.push(report);
    }

    // Job completed
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.reports = generatedReports;
    job.progress = 100;
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
  }
}

/**
 * Helper: Get employee name from ID
 */
function getEmployeeName(employeeId) {
  const names = {
    'emp-001': 'Rajesh Kumar',
    'emp-002': 'Priya Sharma',
    'emp-003': 'Amit Patel',
    'emp-004': 'Anjali Singh',
    'emp-005': 'Vikram Reddy',
    'emp-006': 'Sneha Gupta',
    'emp-007': 'Arjun Mehta',
    'emp-008': 'Kavita Desai',
    'emp-009': 'Rahul Verma',
    'emp-010': 'Pooja Nair',
  };
  return names[employeeId] || 'Unknown Employee';
}

/**
 * Helper: Get employee division from ID
 */
function getEmployeeDivision(employeeId) {
  const divisions = {
    'emp-001': 'East Zone',
    'emp-002': 'West Zone',
    'emp-003': 'North Zone',
    'emp-004': 'South Zone',
    'emp-005': 'Central Zone',
    'emp-006': 'East Zone',
    'emp-007': 'West Zone',
    'emp-008': 'North Zone',
    'emp-009': 'South Zone',
    'emp-010': 'Central Zone',
  };
  return divisions[employeeId] || 'Unknown Division';
}

// ===== ENDPOINTS =====

/**
 * POST /api/reports/generate
 * Start report generation job
 * 
 * Body: { employeeIds: string[], startDate: string, endDate: string }
 * Returns: { jobId: string, status: string, total: number }
 */
app.post('/api/reports/generate', async (req, res) => {
  const { employeeIds, startDate, endDate } = req.body;

  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    return res.status(400).json({ error: 'employeeIds must be a non-empty array' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  // Create job
  const jobId = generateJobId();
  const job = {
    jobId,
    status: 'queued',
    employeeIds,
    startDate,
    endDate,
    total: employeeIds.length,
    currentIndex: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
    reports: [],
  };

  jobs.set(jobId, job);

  // Start processing asynchronously
  processReportJob(jobId, employeeIds, startDate, endDate);

  res.json({
    jobId,
    status: 'queued',
    total: employeeIds.length,
    message: 'Report generation job started',
  });
});

/**
 * GET /api/reports/job/:jobId
 * Get job status
 * 
 * Returns: { status: string, progress: number, total: number, reports?: Array }
 */
app.get('/api/reports/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    total: job.total,
    currentIndex: job.currentIndex,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    reports: job.reports,
    error: job.error,
  });
});

/**
 * GET /api/reports/download/:reportId
 * Download report PDF
 * 
 * Query: ?signed=true (optional) - Include signature metadata
 * Returns: PDF file (application/pdf)
 */
app.get('/api/reports/download/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const report = reports.get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // In production, this would return the actual PDF file
  // For mock, we'll return a JSON with metadata
  res.json({
    reportId: report.id,
    employeeName: report.employeeName,
    division: report.division,
    period: `${report.startDate} to ${report.endDate}`,
    generatedAt: report.generatedAt,
    signature: report.signature,
    message: 'In production, this would be a PDF file with embedded PKCS7 signature',
    downloadNote: 'Use Puppeteer to generate actual PDF from HTML template',
  });
});

/**
 * GET /api/reports/verify/:reportId
 * Verify report signature
 * 
 * Returns: { valid: boolean, signer: string, signedAt: string, algorithm: string }
 */
app.get('/api/reports/verify/:reportId', (req, res) => {
  const { reportId } = req.params;
  const report = reports.get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({
    reportId: report.id,
    valid: report.signature.valid,
    signer: report.signature.signer,
    signedAt: report.signature.signedAt,
    algorithm: report.signature.algorithm,
    kmsKeyId: report.signature.kmsKeyId,
    verifiedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/reports
 * List all generated reports
 * 
 * Query: ?page=1&perPage=20
 * Returns: { reports: Array, total: number, page: number }
 */
app.get('/api/reports', (req, res) => {
  const { page = 1, perPage = 20 } = req.query;
  const pageNum = parseInt(page, 10);
  const perPageNum = parseInt(perPage, 10);

  const allReports = Array.from(reports.values());
  const total = allReports.length;
  const start = (pageNum - 1) * perPageNum;
  const end = start + perPageNum;
  const paginatedReports = allReports.slice(start, end);

  res.json({
    reports: paginatedReports,
    total,
    page: pageNum,
    perPage: perPageNum,
    totalPages: Math.ceil(total / perPageNum),
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mockReportServer',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/reports/generate',
      'GET /api/reports/job/:jobId',
      'GET /api/reports/download/:reportId',
      'GET /api/reports/verify/:reportId',
      'GET /api/reports',
    ],
    features: [
      'Queued job processing',
      'Progress tracking',
      'Digital signature metadata',
      'Report verification',
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Report Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - POST /api/reports/generate`);
  console.log(`   - GET  /api/reports/job/:jobId`);
  console.log(`   - GET  /api/reports/download/:reportId`);
  console.log(`   - GET  /api/reports/verify/:reportId`);
  console.log(`   - GET  /api/reports`);
  console.log(`   - GET  /health`);
  console.log(`\n⚠️  Note: This is a mock server. In production:`);
  console.log(`   - Use separate worker process for PDF generation`);
  console.log(`   - Integrate with AWS KMS or HSM for signing`);
  console.log(`   - Use Puppeteer/Playwright for HTML to PDF`);
  console.log(`   - Store PDFs in S3 or Azure Blob Storage`);
});
