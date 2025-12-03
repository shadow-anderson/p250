# 📁 Complete Project Structure

```
p250/
│
├── public/                              # Static assets (served as-is)
│   └── vite.svg                        # Vite logo
│
├── src/                                 # Source code
│   │
│   ├── assets/                         # Images, fonts, etc.
│   │   └── react.svg                   # React logo
│   │
│   ├── components/                     # Reusable components
│   │   ├── Logo.jsx                    # ✨ Brand logo with gradient
│   │   │
│   │   └── dashboard/                  # Dashboard-specific components
│   │       ├── OrgPulseCard.jsx       # 📊 KPI score + trend sparkline
│   │       ├── TopRisksTable.jsx      # ⚠️ Sortable risks table + modal
│   │       └── ExportAPARCard.jsx     # 📄 PDF export interface + modal
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useApi.js                   # 🔌 API functions + query keys
│   │   └── useDashboard.js            # 🎣 TanStack Query hooks
│   │
│   ├── pages/                          # Page-level components
│   │   ├── Login.jsx                   # 🔐 Beautiful login page
│   │   └── ExecutiveDashboard.jsx     # 📈 Main dashboard page
│   │
│   ├── test/                           # Tests and mock data
│   │   ├── Dashboard.test.jsx         # 🧪 Unit & integration tests
│   │   ├── fixtures.js                 # 📦 Mock API responses
│   │   └── setup.js                    # ⚙️ Test environment setup
│   │
│   ├── App.css                         # App-specific styles (legacy)
│   ├── App.jsx                         # 🎯 Main app with routing & theme
│   ├── index.css                       # 🎨 Global CSS reset
│   └── main.jsx                        # 🚀 App entry point
│
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore rules
├── eslint.config.js                    # ESLint configuration
├── index.html                          # HTML entry point
├── package.json                        # Dependencies & scripts
├── vite.config.js                      # Vite + Vitest configuration
│
├── QUICK_START.md                      # ⚡ 3-minute setup guide
├── PROJECT_README.md                   # 📖 Full documentation
├── IMPLEMENTATION_SUMMARY.md           # ✅ Implementation checklist
└── README.md                           # Original Vite README
```

---

## 📄 File Descriptions

### Core Application Files

#### `src/main.jsx` (Entry Point)
```javascript
// Mounts React app to DOM
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

#### `src/App.jsx` (Router & Theme)
```javascript
// Sets up React Router, TanStack Query, and MUI theme
<Router>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/app/executive" element={<ExecutiveDashboard />} />
  </Routes>
</Router>
```

#### `src/index.css` (Global Styles)
```css
/* Minimal CSS reset + smooth scrolling */
* { margin: 0; padding: 0; box-sizing: border-box; }
```

---

### Page Components

#### `src/pages/Login.jsx`
**Purpose**: Beautiful login interface  
**Features**:
- Glassmorphism card
- Animated gradient background
- Email + password fields
- Loading state
- Responsive design

**Key Props**: None (standalone page)

#### `src/pages/ExecutiveDashboard.jsx`
**Purpose**: Main dashboard layout  
**Features**:
- Grid layout (responsive)
- Lazy-loaded sections
- Suspense boundaries
- Skeleton loaders

**Sections**:
1. OrgPulseCard (top-left)
2. ExportAPARCard (top-right)
3. TopRisksTable (bottom, full-width)

---

### Dashboard Components

#### `src/components/dashboard/OrgPulseCard.jsx`
**Data Source**: `useOrgPulse('30d')`  
**Displays**:
- Composite KPI score (78.5/100)
- 30-day trend sparkline (Recharts)
- HQ vs Field breakdown
- KPI version chip

**State**: Loading skeleton, error handling

#### `src/components/dashboard/TopRisksTable.jsx`
**Data Source**: `useRisks({ limit: 10, sort: 'severity' })`  
**Features**:
- Sortable columns (title, severity)
- Color-coded severity badges
- Click row → RiskDetailModal
- Evidence feed in modal

**State**: Selected risk, modal open/close

#### `src/components/dashboard/ExportAPARCard.jsx`
**Features**:
- Employee multi-select (Autocomplete)
- Date range picker
- Generate button → APARExportModal
- Progress indicator
- Download link when ready

**State**: Selected employees, dates, jobId

---

### Hooks

#### `src/hooks/useApi.js`
**Exports**:
- `queryKeys`: Query key factory
- `fetchOrgPulse()`: GET /api/kpis/org
- `fetchRisks()`: GET /api/risks
- `generateReport()`: POST /api/reports/generate
- `fetchReportJob()`: GET /api/reports/job/:jobId
- `mockOrgPulse`, `mockRisks`: Mock data

#### `src/hooks/useDashboard.js`
**Custom Hooks**:
- `useOrgPulse(period)`: Cached 5 minutes
- `useRisks({ limit, sort })`: Cached 1 minute
- `useGenerateReport()`: Mutation for PDF gen
- `useReportJob(jobId)`: Auto-polling every 2s
- `useIntersectionObserver(ref)`: Viewport detection

---

### Test Files

#### `src/test/Dashboard.test.jsx`
**Test Suites**:
1. OrgPulseCard (unit tests)
2. APAR Export Flow (integration tests)
3. Accessibility (keyboard nav, ARIA)

**Coverage**:
- Rendering
- Data loading
- User interactions
- Modal workflows

#### `src/test/fixtures.js`
**Mock Data**:
- `mockOrgPulseResponse`: KPI data
- `mockRisksResponse`: 10 risks
- `mockReportJobCompleted`: Success state
- `mockEmployees`: Employee list

---

## 🔗 Component Relationships

```
App.jsx (Router + Theme)
├── Login.jsx
│   └── Logo.jsx
│
└── ExecutiveDashboard.jsx
    ├── OrgPulseCard.jsx
    │   ├── useOrgPulse() → useApi.js
    │   └── Recharts LineChart
    │
    ├── TopRisksTable.jsx
    │   ├── useRisks() → useApi.js
    │   └── RiskDetailModal
    │
    └── ExportAPARCard.jsx
        ├── APARExportModal
        │   ├── useGenerateReport() → useApi.js
        │   └── useReportJob() → useApi.js
        └── Autocomplete (MUI)
```

---

## 📊 Data Flow

```
User Interaction
    ↓
React Component
    ↓
Custom Hook (useDashboard.js)
    ↓
TanStack Query (useQuery/useMutation)
    ↓
API Function (useApi.js)
    ↓
Fetch Request → Backend API
    ↓
Response → Cache (5min/1min)
    ↓
Re-render Component with Data
```

---

## 🎨 Styling Architecture

### Global Styles
- `src/index.css`: CSS reset, smooth scrolling

### Component Styles
- **Material UI `sx` prop**: Inline styling with theme access
- **Emotion**: CSS-in-JS (bundled with MUI)
- **Theme**: Defined in `src/App.jsx` (colors, typography)

### Example:
```javascript
<Box sx={{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 3,
  '&:hover': { transform: 'translateY(-4px)' }
}} />
```

---

## 🧩 Dependency Tree

### Production Dependencies
```
react + react-dom              → Core framework
react-router-dom               → Routing
@mui/material + @emotion/*     → UI components
@tanstack/react-query          → Data fetching
recharts                       → Charts
date-fns                       → Date utilities
```

### Development Dependencies
```
vite                           → Build tool
@vitejs/plugin-react           → React plugin
vitest + @testing-library/*    → Testing
eslint                         → Linting
```

---

## 🚀 Build Pipeline

### Development Mode
```
npm run dev
    ↓
Vite dev server (port 5173)
    ↓
Hot Module Replacement (HMR)
    ↓
Fast refresh on file save
```

### Production Build
```
npm run build
    ↓
Vite bundles with Rollup
    ↓
Optimizations: minification, tree-shaking, code-splitting
    ↓
Output: dist/ folder
    ↓
Deploy to hosting (Vercel, Netlify, etc.)
```

---

## 📦 Bundle Size Estimates

- **Login page chunk**: ~150 KB (gzipped)
- **Dashboard chunk**: ~200 KB (gzipped)
- **Recharts chunk**: ~80 KB (lazy-loaded)
- **Total initial load**: ~350 KB

*Optimized with lazy loading and code splitting*

---

## 🔐 Security Considerations

### Current Implementation (Frontend Only)
- ❌ No authentication
- ❌ No authorization
- ❌ No token management
- ❌ No API validation

### Production Requirements
- ✅ Add JWT/OAuth authentication
- ✅ Validate API responses
- ✅ Sanitize user inputs
- ✅ Implement CSRF protection
- ✅ Add rate limiting
- ✅ Use HTTPS only

---

## 🎯 Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 90+

### Load Times (Target)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Total Bundle Size**: < 500 KB

---

## 📱 Browser Support

### Tested Browsers
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Mobile Support
- ✅ iOS Safari 16+
- ✅ Chrome Mobile 120+
- ✅ Samsung Internet 23+

---

**Last Updated**: December 4, 2025  
**Project Version**: 1.0.0
