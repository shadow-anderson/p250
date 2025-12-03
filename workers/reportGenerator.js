/**
 * Report Generation Worker
 * 
 * Background worker that processes report generation jobs:
 * 1. Fetches employee KPIs, evidence, and metadata from database
 * 2. Renders HTML template using Handlebars
 * 3. Converts HTML to PDF using Puppeteer
 * 4. Signs PDF with organizational private key (AWS KMS or local HSM)
 * 5. Uploads signed PDF to storage (S3, Azure Blob)
 * 6. Updates job status
 * 
 * Run with: node workers/reportGenerator.js
 */

import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { signPDF } from '../utils/signing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch employee data from database
 * In production, this would query your actual database
 * 
 * @param {string} employeeId - Employee ID
 * @param {string} startDate - Start date (ISO 8601)
 * @param {string} endDate - End date (ISO 8601)
 * @returns {Promise<Object>} Employee performance data
 */
async function fetchEmployeeData(employeeId, startDate, endDate) {
  // Mock data - replace with actual database query
  return {
    employee: {
      id: employeeId,
      name: 'Rajesh Kumar',
      employeeCode: 'EMP-2023-001',
      division: 'East Zone',
      department: 'Field Operations',
      role: 'Senior Inspector',
      joiningDate: '2020-03-15',
      email: 'rajesh.kumar@prabhaav.gov.in',
      supervisor: 'Amit Sharma',
    },
    period: {
      startDate,
      endDate,
      fiscalYear: '2024-25',
    },
    performance: {
      overallScore: 78,
      grade: 'A',
      ranking: '12/248',
      categories: [
        {
          name: 'HQ Operations',
          weight: 25,
          score: 75,
          kpis: [
            { name: 'Reporting Timeliness', score: 80, target: 90, achieved: 88 },
            { name: 'Data Accuracy', score: 85, target: 95, achieved: 92 },
            { name: 'Process Adherence', score: 60, target: 85, achieved: 70 },
          ],
        },
        {
          name: 'Field Operations',
          weight: 30,
          score: 85,
          kpis: [
            { name: 'Inspection Completion Rate', score: 90, target: 100, achieved: 95 },
            { name: 'Travel Efficiency', score: 75, target: 80, achieved: 78 },
            { name: 'Quality Compliance', score: 88, target: 90, achieved: 89 },
          ],
        },
        {
          name: 'Team Collaboration',
          weight: 15,
          score: 70,
          kpis: [
            { name: 'Meeting Attendance', score: 75, target: 90, achieved: 85 },
            { name: 'Peer Support', score: 68, target: 80, achieved: 75 },
            { name: 'Knowledge Sharing', score: 67, target: 75, achieved: 70 },
          ],
        },
        {
          name: 'Individual Behavior',
          weight: 30,
          score: 72,
          kpis: [
            { name: 'Punctuality', score: 80, target: 95, achieved: 90 },
            { name: 'Initiative', score: 70, target: 85, achieved: 75 },
            { name: 'Professionalism', score: 75, target: 85, achieved: 80 },
            { name: 'Learning & Development', score: 63, target: 70, achieved: 65 },
          ],
        },
      ],
    },
    evidence: {
      totalSubmissions: 42,
      approved: 38,
      rejected: 2,
      pending: 2,
      highlights: [
        {
          date: '2024-09-15',
          title: 'Completed 15 field inspections in Q3',
          category: 'Field Operations',
        },
        {
          date: '2024-11-20',
          title: 'Led training workshop for junior inspectors',
          category: 'Team Collaboration',
        },
        {
          date: '2024-12-05',
          title: 'Achieved 100% reporting timeliness for Nov-Dec',
          category: 'HQ Operations',
        },
      ],
    },
    milestones: {
      total: 8,
      completed: 7,
      inProgress: 1,
      overdue: 0,
      items: [
        { name: 'Complete Annual Safety Training', status: 'completed', dueDate: '2024-04-30' },
        { name: 'Conduct 50 Field Inspections', status: 'completed', dueDate: '2024-12-31' },
        { name: 'Submit Quarterly Reports', status: 'completed', dueDate: '2024-12-31' },
      ],
    },
    remarks: {
      supervisor: 'Rajesh has shown consistent performance throughout the year. His field operations skills are exceptional, and he has taken initiative in mentoring junior staff. Areas for improvement include HQ process adherence and team collaboration activities.',
      hod: 'Strong contributor to divisional goals. Recommended for promotion consideration.',
    },
  };
}

/**
 * Render HTML from Handlebars template
 * 
 * @param {Object} data - Employee performance data
 * @returns {Promise<string>} Rendered HTML
 */
async function renderHTML(data) {
  const templatePath = path.join(__dirname, '../templates/apar.hbs');
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);

  // Register Handlebars helpers
  Handlebars.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  Handlebars.registerHelper('percentage', (value) => {
    return `${Math.round(value)}%`;
  });

  Handlebars.registerHelper('gradeColor', (grade) => {
    const colors = {
      'A+': '#4caf50',
      A: '#8bc34a',
      B: '#ffc107',
      C: '#ff9800',
      D: '#f44336',
    };
    return colors[grade] || '#9e9e9e';
  });

  return template(data);
}

/**
 * Convert HTML to PDF using Puppeteer
 * 
 * @param {string} html - HTML content
 * @param {string} outputPath - Output PDF path
 * @returns {Promise<void>}
 */
async function generatePDF(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, {
    waitUntil: 'networkidle0',
  });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
        <span>Annual Performance Assessment Report (APAR)</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span style="margin-left: 20px;">Digitally Signed - Prabhaav Organization</span>
      </div>
    `,
  });

  await browser.close();
}

/**
 * Process single report generation
 * 
 * @param {Object} params
 * @param {string} params.employeeId - Employee ID
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @param {string} params.jobId - Job ID
 * @returns {Promise<Object>} Report metadata
 */
export async function generateReport({ employeeId, startDate, endDate, jobId }) {
  console.log(`[Worker] Starting report generation for employee ${employeeId}`);

  try {
    // Step 1: Fetch employee data
    console.log(`[Worker] Fetching data for ${employeeId}...`);
    const data = await fetchEmployeeData(employeeId, startDate, endDate);

    // Step 2: Render HTML
    console.log(`[Worker] Rendering HTML template...`);
    const html = await renderHTML(data);

    // Step 3: Generate PDF
    const reportId = `report-${Date.now()}-${employeeId}`;
    const outputDir = path.join(__dirname, '../storage/reports');
    await fs.ensureDir(outputDir);
    const pdfPath = path.join(outputDir, `${reportId}.pdf`);

    console.log(`[Worker] Generating PDF...`);
    await generatePDF(html, pdfPath);

    // Step 4: Sign PDF
    console.log(`[Worker] Signing PDF with organizational key...`);
    const signedPdfPath = path.join(outputDir, `${reportId}-signed.pdf`);
    await signPDF(pdfPath, signedPdfPath);

    // Step 5: Upload to storage (S3, Azure Blob)
    // In production, upload the signed PDF to cloud storage
    console.log(`[Worker] Uploading to storage...`);
    // const s3Url = await uploadToS3(signedPdfPath, reportId);

    // Step 6: Return report metadata
    const report = {
      id: reportId,
      employeeId,
      employeeName: data.employee.name,
      division: data.employee.division,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      url: `http://localhost:3003/api/reports/download/${reportId}`,
      signedUrl: `http://localhost:3003/api/reports/download/${reportId}?signed=true`,
      signature: {
        algorithm: 'SHA256withRSA',
        signer: 'CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN',
        signedAt: new Date().toISOString(),
        kmsKeyId: process.env.AWS_KMS_KEY_ID || 'arn:aws:kms:ap-south-1:123456789012:key/example',
        valid: true,
      },
      fileSize: (await fs.stat(signedPdfPath)).size,
      pages: data.performance.categories.length + 3, // Estimate
    };

    console.log(`[Worker] Report generation completed: ${reportId}`);
    return report;
  } catch (error) {
    console.error(`[Worker] Error generating report for ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Process job queue
 * In production, this would be a long-running process that polls a job queue (Redis, RabbitMQ)
 * 
 * @param {Object} job
 * @param {string} job.jobId - Job ID
 * @param {string[]} job.employeeIds - Employee IDs
 * @param {string} job.startDate - Start date
 * @param {string} job.endDate - End date
 * @param {Function} job.onProgress - Progress callback
 * @param {Function} job.onComplete - Completion callback
 * @param {Function} job.onError - Error callback
 */
export async function processJob(job) {
  const { jobId, employeeIds, startDate, endDate, onProgress, onComplete, onError } = job;

  console.log(`[Worker] Processing job ${jobId} with ${employeeIds.length} employee(s)`);

  const reports = [];

  try {
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];

      // Generate report
      const report = await generateReport({
        employeeId,
        startDate,
        endDate,
        jobId,
      });

      reports.push(report);

      // Update progress
      const progress = Math.round(((i + 1) / employeeIds.length) * 100);
      if (onProgress) {
        onProgress({
          jobId,
          currentIndex: i + 1,
          total: employeeIds.length,
          progress,
        });
      }
    }

    // Job completed
    if (onComplete) {
      onComplete({
        jobId,
        reports,
        completedAt: new Date().toISOString(),
      });
    }

    console.log(`[Worker] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Worker] Job ${jobId} failed:`, error);
    if (onError) {
      onError({
        jobId,
        error: error.message,
        failedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Start worker
 * In production, this would connect to a job queue and process jobs continuously
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔧 Report Generation Worker started');
  console.log('📝 Waiting for jobs...');
  console.log('\n⚠️  Note: This is a standalone worker example.');
  console.log('   In production, integrate with:');
  console.log('   - Redis Queue (Bull, BullMQ)');
  console.log('   - AWS SQS');
  console.log('   - RabbitMQ');
  console.log('   - Kubernetes Jobs\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n👋 Worker shutting down...');
    process.exit(0);
  });
}
