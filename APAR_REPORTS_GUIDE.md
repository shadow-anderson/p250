# APAR Reports Generation Guide

Complete guide to the digitally signed APAR (Annual Performance Assessment Report) generation system.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Client Interface](#client-interface)
- [Server Implementation](#server-implementation)
- [Digital Signatures](#digital-signatures)
- [Security Best Practices](#security-best-practices)
- [Docker Deployment](#docker-deployment)
- [Testing & Verification](#testing--verification)
- [Production Checklist](#production-checklist)

---

## Overview

The APAR Reports system generates digitally signed PDF documents containing annual performance assessment data for employees. The system ensures:

- **Authenticity**: Documents are digitally signed with organizational private key
- **Integrity**: Any tampering invalidates the signature
- **Non-repudiation**: Signed documents are legally binding
- **Scalability**: Asynchronous job processing handles bulk generation

### Key Features

✅ Multi-select employee batch generation  
✅ Date range selection for assessment period  
✅ KPI snapshot preview before generation  
✅ Asynchronous job processing with progress tracking  
✅ Digital signatures using PKCS#7 standard  
✅ AWS KMS or local HSM support  
✅ Verification script for signature validation  
✅ Docker-ready deployment  

---

## Architecture

### Components

```
┌─────────────────┐
│   React Client  │
│  GenerateAPAR   │
└────────┬────────┘
         │
         │ POST /api/reports/generate
         ▼
┌─────────────────┐
│  Report Server  │
│  (Express.js)   │
└────────┬────────┘
         │
         │ Queue Job
         ▼
┌─────────────────┐       ┌──────────────┐
│  Report Worker  │◄──────┤ Job Queue    │
│  (Background)   │       │ (Redis/SQS)  │
└────────┬────────┘       └──────────────┘
         │
         │ 1. Fetch Data
         │ 2. Render HTML
         │ 3. Generate PDF
         │ 4. Sign PDF
         │ 5. Upload to S3
         ▼
┌─────────────────┐       ┌──────────────┐
│  Signed PDF     │       │  AWS KMS or  │
│  Storage (S3)   │       │  Local HSM   │
└─────────────────┘       └──────────────┘
```

### Data Flow

1. **User Action**: Select employees + date range → Click "Generate"
2. **Job Creation**: Server creates job, returns `jobId`
3. **Client Polling**: Poll `/api/reports/job/:jobId` for status (every 2s)
4. **Worker Processing**:
   - Fetch employee KPIs, evidence, milestones from database
   - Render HTML using Handlebars template
   - Convert HTML to PDF with Puppeteer
   - Sign PDF with organizational key (KMS or local)
   - Upload signed PDF to storage
5. **Completion**: Update job status, return signed PDF URLs
6. **Download**: User downloads signed PDFs

---

## Client Interface

### GenerateAPAR Component

Location: `src/pages/Reports/GenerateAPAR.jsx`

#### Features

**1. Employee Selection**
```jsx
<Autocomplete
  multiple
  options={allEmployees}
  getOptionLabel={(option) => `${option.name} - ${option.division}`}
  value={selectedEmployees}
  onChange={(event, newValue) => setSelectedEmployees(newValue)}
/>
```

- Multi-select with search
- Shows employee name, division, department
- Chips for selected employees

**2. Date Range Selector**
```jsx
<TextField
  label="Start Date"
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>
<TextField
  label="End Date"
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
/>
```

- ISO 8601 date format
- Validates end date > start date

**3. Preview Dialog**
```jsx
const previewData = selectedEmployees.map((emp) => ({
  employeeName: emp.name,
  kpiSnapshot: {
    overallScore: 78,
    categories: [...],
    evidenceCount: 42,
    milestonesCompleted: 7,
  },
}));
```

Shows:
- Overall performance score
- Category scores with weights
- Evidence submission count
- Milestone completion

**4. Generation Progress**
```jsx
<LinearProgress variant="determinate" value={jobStatus.progress} />
<Typography>Processing {currentIndex} of {total}</Typography>
```

- Real-time progress bar
- Current/total employees processed
- Job status: queued → processing → completed/failed

**5. Generated Reports Table**
```jsx
<Chip
  icon={<VerifiedIcon />}
  label="Digitally Signed"
  color="success"
/>
<IconButton onClick={() => handleDownload(report.url)}>
  <DownloadIcon />
</IconButton>
```

- Lists all generated reports
- Shows employee, division, period, generated timestamp
- Download button for signed PDF

### API Hooks

Location: `src/hooks/useReportApi.js`

#### useGenerateReport

```javascript
const generateMutation = useGenerateReport();

await generateMutation.mutateAsync({
  employeeIds: ['emp-001', 'emp-002'],
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

#### useFetchJobStatus

```javascript
const { data: jobStatus } = useFetchJobStatus(jobId, {
  enabled: !!jobId,
  refetchInterval: (data) => {
    return data?.status === 'completed' ? false : 2000;
  },
});
```

- Polls every 2 seconds until completed
- Returns: `{ status, progress, currentIndex, total, reports }`

#### useDownloadReport

```javascript
const downloadMutation = useDownloadReport();
await downloadMutation.mutateAsync(reportId);
```

- Downloads PDF blob
- Triggers browser download automatically

---

## Server Implementation

### Report Server

Location: `server/mockReportServer.js`

#### Endpoints

**POST /api/reports/generate**
```json
Request:
{
  "employeeIds": ["emp-001", "emp-002"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}

Response:
{
  "jobId": "job-000001",
  "status": "queued",
  "total": 2,
  "message": "Report generation job started"
}
```

**GET /api/reports/job/:jobId**
```json
{
  "jobId": "job-000001",
  "status": "processing",
  "progress": 50,
  "currentIndex": 1,
  "total": 2,
  "createdAt": "2025-01-15T10:00:00Z",
  "reports": []
}
```

Status values:
- `queued`: Job created, not started
- `processing`: Worker actively processing
- `completed`: All reports generated successfully
- `failed`: Error occurred during generation

**GET /api/reports/download/:reportId**

Returns signed PDF file with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="APAR_report-12345.pdf"
```

**GET /api/reports/verify/:reportId**
```json
{
  "reportId": "report-12345",
  "valid": true,
  "signer": "CN=Prabhaav Organization, OU=IT, O=Prabhaav",
  "signedAt": "2025-01-15T10:05:00Z",
  "algorithm": "SHA256withRSA",
  "kmsKeyId": "arn:aws:kms:ap-south-1:123456789012:key/example"
}
```

### Report Worker

Location: `workers/reportGenerator.js`

#### Processing Steps

**1. Fetch Employee Data**
```javascript
async function fetchEmployeeData(employeeId, startDate, endDate) {
  return {
    employee: { name, division, department, role, ... },
    period: { startDate, endDate, fiscalYear },
    performance: {
      overallScore: 78,
      categories: [...]
    },
    evidence: { totalSubmissions, approved, highlights },
    milestones: { total, completed, items },
    remarks: { supervisor, hod }
  };
}
```

**2. Render HTML Template**
```javascript
import Handlebars from 'handlebars';

const template = Handlebars.compile(templateSource);
const html = template(data);
```

Uses `templates/apar.hbs` Handlebars template.

**3. Generate PDF with Puppeteer**
```javascript
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
});
```

**4. Sign PDF**
```javascript
import { signPDF } from '../utils/signing.js';

await signPDF(pdfPath, signedPdfPath, {
  method: 'kms', // or 'local'
  keyId: process.env.AWS_KMS_KEY_ID
});
```

**5. Upload to Storage**
```javascript
// In production:
const s3Url = await uploadToS3(signedPdfPath, reportId);
```

---

## Digital Signatures

### Signing Methods

#### AWS KMS (Recommended for Production)

**Advantages**:
- Keys never leave AWS HSM
- FIPS 140-2 Level 2 validated
- Automatic key rotation
- Audit logging in CloudTrail
- Access control via IAM

**Setup**:
```bash
# 1. Create KMS key
aws kms create-key \
  --description "Prabhaav APAR Signing Key" \
  --key-usage SIGN_VERIFY \
  --customer-master-key-spec RSA_2048

# 2. Create alias
aws kms create-alias \
  --alias-name alias/prabhaav-apar-signing \
  --target-key-id <KEY_ID>

# 3. Grant permissions
aws kms create-grant \
  --key-id <KEY_ID> \
  --grantee-principal <IAM_ROLE_ARN> \
  --operations Sign Verify GetPublicKey

# 4. Set environment variable
export AWS_KMS_KEY_ID=<KEY_ID>
export SIGNING_METHOD=kms
```

**Code**:
```javascript
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({ region: 'ap-south-1' });

async function signWithKMS(data, keyId) {
  const command = new SignCommand({
    KeyId: keyId,
    Message: data,
    MessageType: 'RAW',
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
  });
  
  const response = await kmsClient.send(command);
  return Buffer.from(response.Signature);
}
```

#### Local HSM/Private Key

**Use for**:
- Development/testing
- On-premise deployments
- Custom HSM integration

**Setup**:
```bash
# Generate self-signed certificate (dev only)
node -e "require('./utils/signing.js').generateDevCertificate('./keys')"

# Or use existing keys
export SIGNING_METHOD=local
export PRIVATE_KEY_PATH=./keys/private.pem
export CERTIFICATE_PATH=./keys/cert.pem
```

**⚠️ Security Warning**:
- Never commit private keys to git
- Use `.gitignore` for `/keys` directory
- Production: Use CA-signed certificates
- Rotate keys regularly (annually minimum)

### PKCS#7 Signature Structure

```
PKCS#7 Signature {
  version: 1
  digestAlgorithm: SHA-256
  contentInfo: {
    contentType: data
    content: <PDF byte range>
  }
  certificates: [X.509 certificate]
  signerInfos: [{
    version: 1
    issuerAndSerialNumber: {
      issuer: "CN=Prabhaav Organization, OU=IT, O=Prabhaav"
      serialNumber: <cert serial>
    }
    digestAlgorithm: SHA-256
    signatureAlgorithm: RSA
    signature: <signature bytes>
  }]
}
```

### Signature Embedding in PDF

PDF signature dictionary:
```
/Sig <<
  /Type /Sig
  /Filter /Adobe.PPKLite
  /SubFilter /adbe.pkcs7.detached
  /ByteRange [0 1234 5678 9012]
  /Contents <hexadecimal PKCS#7 data>
  /Reason (Official APAR Document)
  /Location (Prabhaav Organization)
  /ContactInfo (support@prabhaav.gov.in)
  /M (D:20250115100000Z)
>>
```

---

## Security Best Practices

### Key Management

#### DO:
✅ Use AWS KMS or hardware HSM in production  
✅ Store keys encrypted at rest  
✅ Rotate keys annually (at minimum)  
✅ Use separate keys for dev/staging/production  
✅ Implement key access logging  
✅ Use IAM roles with least privilege  
✅ Enable CloudTrail for KMS operations  

#### DON'T:
❌ Commit keys to version control  
❌ Share keys across environments  
❌ Use self-signed certs in production  
❌ Store keys in environment variables (production)  
❌ Disable CloudTrail logging  
❌ Use same key for multiple purposes  

### Environment Variables

```bash
# Development
SIGNING_METHOD=local
PRIVATE_KEY_PATH=./keys/dev/private.pem
CERTIFICATE_PATH=./keys/dev/cert.pem

# Production
SIGNING_METHOD=kms
AWS_REGION=ap-south-1
AWS_KMS_KEY_ID=arn:aws:kms:ap-south-1:123456789012:key/abc123
# Don't set AWS credentials in env - use IAM roles
```

### .gitignore

```gitignore
# Keys - NEVER COMMIT
keys/
*.pem
*.key
*.p12
*.pfx

# AWS credentials
.aws/
aws-credentials.json

# Environment files
.env.production
.env.local
```

### Access Control

**IAM Policy for KMS**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Sign",
        "kms:GetPublicKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:ap-south-1:123456789012:key/*",
      "Condition": {
        "StringEquals": {
          "kms:KeyUsage": "SIGN_VERIFY"
        }
      }
    }
  ]
}
```

### Audit Logging

Log every signing operation:
```javascript
{
  timestamp: '2025-01-15T10:05:00Z',
  action: 'PDF_SIGNED',
  reportId: 'report-12345',
  employeeId: 'emp-001',
  keyId: 'arn:aws:kms:...',
  signedBy: 'service-account@prabhaav.gov.in',
  ipAddress: '10.0.1.50',
  userAgent: 'ReportWorker/1.0'
}
```

---

## Docker Deployment

### Build Report Generation Image

```bash
# Build image
docker build -f Dockerfile.reports -t prabhaav-reports:latest .

# Run container
docker run -d \
  --name report-server \
  -p 3003:3003 \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/keys:/app/keys:ro \
  -e SIGNING_METHOD=local \
  -e PRIVATE_KEY_PATH=/app/keys/private.pem \
  prabhaav-reports:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f report-server
docker-compose logs -f report-worker

# Scale workers
docker-compose up -d --scale report-worker=3

# Stop services
docker-compose down
```

### Docker Compose Configuration

```yaml
services:
  report-server:
    build:
      context: .
      dockerfile: Dockerfile.reports
    ports:
      - "3003:3003"
    volumes:
      - ./storage:/app/storage
      - ./keys:/app/keys:ro
    environment:
      - SIGNING_METHOD=kms
      - AWS_KMS_KEY_ID=${AWS_KMS_KEY_ID}
    
  report-worker:
    build:
      context: .
      dockerfile: Dockerfile.reports
    volumes:
      - ./storage:/app/storage
      - ./keys:/app/keys:ro
    command: node workers/reportGenerator.js
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Production Deployment (ECS)

**Task Definition**:
```json
{
  "family": "prabhaav-report-worker",
  "taskRoleArn": "arn:aws:iam::123456789012:role/PrabhaavReportWorkerRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "report-worker",
      "image": "123456789012.dkr.ecr.ap-south-1.amazonaws.com/prabhaav-reports:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
      "environment": [
        { "name": "SIGNING_METHOD", "value": "kms" },
        { "name": "AWS_REGION", "value": "ap-south-1" }
      ],
      "secrets": [
        {
          "name": "AWS_KMS_KEY_ID",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:123456789012:secret:kms-key-id"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/prabhaav-reports",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "worker"
        }
      }
    }
  ]
}
```

---

## Testing & Verification

### Unit Tests

Run tests:
```bash
npm test src/test/ReportGeneration.test.jsx
```

Coverage:
- PDF generation with mock data
- PDF signing with local keys
- Signature verification
- Tampered PDF detection
- Batch report generation
- Error handling

### Signature Verification Script

```bash
# Basic verification
node scripts/verify-signature.js report-12345.pdf

# Verbose output
node scripts/verify-signature.js report-12345.pdf --verbose

# JSON output (for CI/CD)
node scripts/verify-signature.js report-12345.pdf --format json
```

Output:
```
PDF Signature Verification Report
==================================================

File Information:
  Name:         APAR_report-12345.pdf
  Size:         342.56 KB
  Created:      2025-01-15T10:05:00Z

Signature Information:
  ✅ Status:     VALID
  Signer:       CN=Prabhaav Organization, OU=IT, O=Prabhaav
  Algorithm:    SHA256withRSA
  Signed At:    2025-01-15T10:05:00Z

==================================================
✅ The document signature is valid and authentic.
```

### Manual Verification (Adobe Acrobat)

1. Open PDF in Adobe Acrobat Reader
2. Click signature panel (left sidebar)
3. Click signature to view details
4. Check "Signature is valid" message
5. View signer certificate details

### CI/CD Integration

```yaml
# GitHub Actions
- name: Verify Report Signatures
  run: |
    for pdf in storage/reports/*.pdf; do
      node scripts/verify-signature.js "$pdf" --format json
    done
```

---

## Production Checklist

### Before Going Live

#### Infrastructure
- [ ] Set up AWS KMS key with proper IAM policies
- [ ] Configure CloudTrail logging for KMS operations
- [ ] Set up S3 bucket for PDF storage with encryption
- [ ] Configure CloudFront CDN for PDF downloads
- [ ] Set up Redis/SQS for job queue
- [ ] Deploy workers with auto-scaling (min 2, max 10)
- [ ] Configure CloudWatch alarms for worker failures

#### Security
- [ ] Rotate all development keys
- [ ] Obtain CA-signed certificate from trusted authority
- [ ] Configure key rotation policy (annual)
- [ ] Set up audit logging for all signing operations
- [ ] Implement rate limiting on report generation API
- [ ] Add authentication/authorization checks
- [ ] Configure CORS properly for production domain
- [ ] Enable HTTPS only (no HTTP)

#### Testing
- [ ] Run full integration test suite
- [ ] Verify signatures on generated PDFs
- [ ] Test with 1000+ employee batch
- [ ] Load test with concurrent requests
- [ ] Test worker failure recovery
- [ ] Verify PDF renders correctly across viewers (Adobe, Chrome, Edge)
- [ ] Test signature verification on mobile devices

#### Monitoring
- [ ] Set up CloudWatch dashboards
- [ ] Configure alerts for:
  * Worker process failures
  * KMS signing errors
  * S3 upload failures
  * Job queue backlog > 100
  * Average generation time > 30s
- [ ] Set up log aggregation (ELK or CloudWatch Logs Insights)
- [ ] Configure APM (Application Performance Monitoring)

#### Documentation
- [ ] Update API documentation with production endpoints
- [ ] Document key rotation procedure
- [ ] Create runbook for common issues
- [ ] Train support team on verification process
- [ ] Document disaster recovery procedure

#### Compliance
- [ ] Legal review of digital signature implementation
- [ ] Verify compliance with IT Act 2000 (India)
- [ ] Document signature algorithm and standards used
- [ ] Implement data retention policy for reports
- [ ] Set up compliance audit trail

---

## Troubleshooting

### Issue: PDF generation fails with Puppeteer error

**Symptoms**: Worker crashes with "Failed to launch browser"

**Solution**:
```bash
# Install missing dependencies
apt-get update
apt-get install -y chromium fonts-liberation libnss3

# Or use Docker image with dependencies pre-installed
```

### Issue: KMS signing fails with "AccessDeniedException"

**Symptoms**: Signature fails with AWS KMS permission error

**Solution**:
1. Check IAM role has `kms:Sign` permission
2. Verify key policy allows the role
3. Check key usage is `SIGN_VERIFY`
4. Ensure correct AWS region

### Issue: Signature verification fails

**Symptoms**: `verifyPDFSignature()` returns `valid: false`

**Causes**:
- PDF was modified after signing
- Certificate expired
- Certificate not in trust chain
- Incorrect verification algorithm

**Solution**:
1. Re-generate report with fresh signature
2. Check certificate validity dates
3. Verify signer certificate matches

### Issue: Worker processes stuck

**Symptoms**: Jobs remain in "processing" state indefinitely

**Solution**:
```bash
# Check worker logs
docker logs report-worker

# Restart worker
docker restart report-worker

# Scale up workers if overloaded
docker-compose up -d --scale report-worker=5
```

---

## API Reference

### Generate Report

```http
POST /api/reports/generate HTTP/1.1
Content-Type: application/json

{
  "employeeIds": ["emp-001", "emp-002"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Response**:
```json
{
  "jobId": "job-000123",
  "status": "queued",
  "total": 2
}
```

### Get Job Status

```http
GET /api/reports/job/job-000123 HTTP/1.1
```

**Response**:
```json
{
  "jobId": "job-000123",
  "status": "completed",
  "progress": 100,
  "total": 2,
  "reports": [
    {
      "id": "report-12345",
      "employeeName": "Rajesh Kumar",
      "url": "https://prabhaav.gov.in/api/reports/download/report-12345",
      "signature": {
        "valid": true,
        "algorithm": "SHA256withRSA",
        "signedAt": "2025-01-15T10:05:00Z"
      }
    }
  ]
}
```

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Platform Engineering Team
