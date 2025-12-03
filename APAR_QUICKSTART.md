# APAR Reports - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly test the APAR report generation system locally.

---

## Prerequisites

```bash
# Ensure Node.js and npm are installed
node --version  # v20 or higher
npm --version

# Install dependencies
cd p250
npm install
```

---

## Step 1: Generate Development Certificates

For local testing, generate self-signed certificates:

```bash
# Create keys directory
mkdir keys

# Generate development certificate (valid for 1 year)
node -e "require('./utils/signing.js').generateDevCertificate('./keys')"
```

This creates:
- `keys/private-key.pem` - Private key for signing
- `keys/certificate.pem` - Public certificate

⚠️ **Never commit these files to git!** The `.gitignore` is already configured.

---

## Step 2: Start the Report Server

```bash
# From p250 directory
node server/mockReportServer.js
```

You should see:
```
Report Generation Server running on http://localhost:3003
```

---

## Step 3: Start the Frontend

In a **new terminal**:

```bash
cd p250
npm run dev
```

Navigate to: `http://localhost:5174/reports/apar`

---

## Step 4: Generate Your First Report

1. **Select Employees**
   - Click the "Select employees" dropdown
   - Choose 1-3 employees (e.g., "Rajesh Kumar", "Priya Sharma")

2. **Set Date Range**
   - Start Date: `2024-04-01`
   - End Date: `2025-03-31`

3. **Preview (Optional)**
   - Click "Preview Report" to see KPI snapshots

4. **Generate**
   - Click "Generate APAR Reports"
   - Watch the progress bar (shows "Processing 1 of 3...")

5. **Download**
   - When complete, click "Download PDF" button
   - The report is digitally signed with your dev certificate

---

## Step 5: Verify the Signature

```bash
# Verify the downloaded PDF
node scripts/verify-signature.js ~/Downloads/report.pdf --verbose
```

Expected output:
```
✅ VALID SIGNATURE

File Information:
  Name:         report.pdf
  Size:         2.4 MB
  Created:      2025-06-15 14:30:22

Signature Information:
  Signer:       CN=Prabhaav Dev Certificate
  Signed At:    2025-06-15 14:30:15
  Algorithm:    RSA-SHA256
```

---

## 🐳 Docker Deployment (Optional)

For production-like environment with all services:

### 1. Build Images

```bash
# Build report server image
docker build -f Dockerfile.reports -t prabhaav-reports:latest .
```

### 2. Start All Services

```bash
# Start 6 services: frontend, 3 API servers, worker, redis
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Scale Workers (Optional)

```bash
# Run 3 worker processes for parallel processing
docker-compose up -d --scale report-worker=3
```

### 4. Access Application

- Frontend: `http://localhost:5174/reports/apar`
- Report API: `http://localhost:3003/api/reports`

### 5. View Logs

```bash
# All services
docker-compose logs -f

# Report worker only
docker-compose logs -f report-worker

# Report server only
docker-compose logs -f report-server
```

### 6. Stop Services

```bash
docker-compose down

# Remove volumes (clears Redis data)
docker-compose down -v
```

---

## 📋 Testing Checklist

- [ ] Dev certificates generated in `keys/` directory
- [ ] Report server running on port 3003
- [ ] Frontend running on port 5174
- [ ] Successfully selected employees and set date range
- [ ] Preview showing correct KPI data
- [ ] Report generation progress bar working
- [ ] PDF downloaded successfully
- [ ] Signature verification shows "✅ VALID SIGNATURE"
- [ ] Report contains all sections (Employee Info, Scores, Evidence, Milestones)

---

## 🔍 Troubleshooting

### Issue: "EADDRINUSE: Port 3003 already in use"

```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Or change port in server/mockReportServer.js
const PORT = process.env.PORT || 3004;
```

### Issue: Puppeteer fails to launch

```bash
# Install Chromium dependencies (Linux/WSL)
sudo apt-get install -y chromium-browser libx11-6 libx11-xcb1 libnss3 libatk1.0-0 libcups2 libdrm2 libgbm1

# Or use system Chrome
# Edit workers/reportGenerator.js:
puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser'  // Or Chrome path
})
```

### Issue: "Cannot find module './utils/signing.js'"

```bash
# Ensure you're in p250 directory
pwd  # Should show .../SIH/p250

# Check file exists
ls utils/signing.js
```

### Issue: Signature verification fails

```bash
# Check certificate matches
openssl x509 -in keys/certificate.pem -text -noout

# Regenerate if needed
rm keys/*.pem
node -e "require('./utils/signing.js').generateDevCertificate('./keys')"
```

---

## 🎯 Next Steps

### For Development

1. **Integrate Real Data**
   - Replace mock employee data in `workers/reportGenerator.js`
   - Connect to actual database for KPIs, evidence, milestones

2. **Add More Fields**
   - Edit `templates/apar.hbs` to add custom sections
   - Update `fetchEmployeeData()` to include new data

3. **Customize Styling**
   - Modify CSS in `apar.hbs` for branding
   - Add organization logo in header

### For Production

1. **AWS KMS Setup**
   - Follow the complete guide in [APAR_REPORTS_GUIDE.md](./APAR_REPORTS_GUIDE.md)
   - Section: "Digital Signatures > AWS KMS Setup"

2. **S3 Integration**
   - Configure bucket for PDF storage
   - Update worker to upload to S3 after generation

3. **Monitoring**
   - Set up CloudWatch dashboards
   - Configure alerts for failed jobs

4. **Security**
   - Obtain CA-signed certificate for production
   - Implement key rotation (90-day cycle)
   - Enable audit logging

---

## 📚 Additional Resources

- **[APAR_REPORTS_GUIDE.md](./APAR_REPORTS_GUIDE.md)** - Comprehensive production guide
  - Architecture details
  - AWS KMS integration
  - Security best practices
  - Docker deployment
  - Production checklist

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Admin panel documentation
- **[QUICK_START.md](./QUICK_START.md)** - General application setup

---

## 🆘 Getting Help

If you encounter issues not covered here:

1. Check the **Troubleshooting** section in [APAR_REPORTS_GUIDE.md](./APAR_REPORTS_GUIDE.md)
2. Review server logs: `docker-compose logs report-server report-worker`
3. Test individual components:
   ```bash
   # Test PDF generation only
   node workers/reportGenerator.js
   
   # Test signing utility
   node -e "require('./utils/signing.js').signPDF('./test.pdf', './test-signed.pdf', {method: 'local', privateKeyPath: './keys/private-key.pem'})"
   ```

---

**Ready to generate reports? Start with Step 1! 🎉**
