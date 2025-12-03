# Prabhaav - Performance Management Platform

**Performance. Clarity. Impact.**

A modern, enterprise-grade performance management and analytics platform built for the Smart India Hackathon 2025.

---

## 🚀 Features

### 1. **Beautiful Login Page**
- Apple-style clean design with glassmorphism effects
- Smooth animations (fade-in, slide-up, gradient shifts)
- Fully responsive (desktop + mobile ≤480px)
- No authentication logic (pure frontend UI for demo)

### 2. **Executive Dashboard**
- **Organization Pulse**: Real-time composite KPI with 30-day trend sparkline
- **Top 10 Risks**: Interactive table with severity indicators and evidence drilldown
- **APAR Export**: Generate digitally signed PDF reports for performance assessments

### 3. **Performance Optimizations**
- React lazy loading + Suspense for code splitting
- TanStack Query with smart caching (5min for pulse, 1min for risks)
- Skeleton loaders for better UX
- IntersectionObserver for viewport-based loading

### 4. **Accessibility**
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management in modals
- Semantic HTML structure

---

## 📁 Project Structure

```
p250/
├── public/
├── src/
│   ├── assets/                 # Static assets
│   ├── components/
│   │   ├── Logo.jsx           # Brand logo component
│   │   └── dashboard/
│   │       ├── OrgPulseCard.jsx        # Org KPI widget
│   │       ├── TopRisksTable.jsx       # Risks table with modal
│   │       └── ExportAPARCard.jsx      # APAR export interface
│   ├── hooks/
│   │   ├── useApi.js          # API functions & query keys
│   │   └── useDashboard.js    # Custom hooks with TanStack Query
│   ├── pages/
│   │   ├── Login.jsx          # Login page
│   │   └── ExecutiveDashboard.jsx     # Main dashboard
│   ├── test/
│   │   ├── Dashboard.test.jsx # Unit & integration tests
│   │   ├── fixtures.js        # Mock API data
│   │   └── setup.js           # Test configuration
│   ├── App.jsx                # Router & theme setup
│   ├── main.jsx               # App entry point
│   └── index.css              # Global styles
├── package.json
├── vite.config.js
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **UI Library**: Material UI (MUI) v6
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Styling**: Emotion (CSS-in-JS)
- **Testing**: Vitest + React Testing Library
- **Date Utilities**: date-fns

---

## 📦 Installation

### Prerequisites
- Node.js v20+ (v20.19.0 or >=22.12.0 recommended)
- npm v10+

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd p250
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 🎯 Usage

### Navigation
- **Login Page**: `/login` (default route)
  - Enter any email/password (no validation)
  - Click "Login" to navigate to dashboard
  
- **Executive Dashboard**: `/app/executive`
  - View organization pulse metrics
  - Sort and filter risks
  - Generate APAR PDF reports

### Mock Data
The app currently uses mock data (see `src/test/fixtures.js`). To connect to a real backend:

1. Update `VITE_API_BASE_URL` in `.env`:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

2. Set `useMock=false` in hook calls:
   ```javascript
   const { data } = useOrgPulse('30d', false); // Use real API
   ```

---

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Test Coverage
- Unit tests for `OrgPulseCard` (KPI rendering, tooltips)
- Integration tests for APAR export flow (modal → generate → poll → download)
- Accessibility tests (keyboard navigation, ARIA labels)

### Test Files
- `src/test/Dashboard.test.jsx`: Main test suite
- `src/test/fixtures.js`: Mock API responses
- `src/test/setup.js`: Test environment setup

---

## 🎨 Design System

### Color Palette
- **Primary**: `#2563eb` (Blue)
- **Secondary**: `#7c3aed` (Purple)
- **Background**: `#f8fafc` (Light gray)
- **Gradients**: Multi-color gradients for visual impact

### Typography
- **Font**: -apple-system, SF Pro, Segoe UI, Roboto
- **Weights**: 400 (Regular), 600 (Semibold), 700 (Bold)

### Components
- **Buttons**: Rounded corners, gradient backgrounds, scale animations
- **Cards**: Elevated shadows, glassmorphism blur effects
- **Tables**: Sortable columns, hover states, density padding

---

## 📊 API Contracts

### 1. Organization Pulse
```http
GET /api/kpis/org?period=30d
```
**Response:**
```json
{
  "score": 78.5,
  "trend": [72, 73, 75, 74, 76, 78, 79, 77, 78, 78.5],
  "breakdown": { "hq": 82.3, "field": 75.1 },
  "weight_version": "v2.1",
  "last_compute": "2025-12-03T15:30:00Z"
}
```

### 2. Top Risks
```http
GET /api/risks?limit=10&sort=severity
```
**Response:**
```json
[
  {
    "id": "RISK-001",
    "title": "Delayed milestone delivery in Project Alpha",
    "severity": 0.92,
    "confidence": 0.85,
    "evidence_count": 12
  }
]
```

### 3. Generate Report
```http
POST /api/reports/generate
Content-Type: application/json

{
  "employeeIds": ["EMP001", "EMP002"],
  "from": "2025-01-01",
  "to": "2025-12-03"
}
```
**Response:**
```json
{ "jobId": "JOB-2025-12-03-001" }
```

### 4. Report Job Status
```http
GET /api/reports/job/:jobId
```
**Response:**
```json
{
  "status": "completed",
  "url_signed_pdf": "https://storage.example.com/reports/APAR-2025-signed.pdf"
}
```

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables (if using real API)

---

## 🔒 Security Notes

- **No Authentication**: This is a frontend-only demo. Add JWT/OAuth before production.
- **Mock Data**: Replace with secure API calls.
- **CORS**: Configure backend CORS headers for cross-origin requests.
- **PDF Signing**: Ensure backend validates user permissions before generating reports.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is built for Smart India Hackathon 2025.  
© Prabhaav 2025 - All Rights Reserved

---

## 🏆 Credits

**Team**: [Your Team Name]  
**Hackathon**: Smart India Hackathon 2025  
**Problem Statement**: Performance Management System

---

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Email: [your-email@example.com]
- Discord: [your-discord-server]

---

**Built with ❤️ for SIH 2025**
