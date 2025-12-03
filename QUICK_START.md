# 🚀 Quick Start Guide - Prabhaav

Get up and running in 3 minutes!

---

## ⚡ Fast Setup

### 1. Install Dependencies
```bash
cd p250
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to: **http://localhost:5173**

---

## 🎮 Quick Demo

### Login Page (`/login`)
1. Enter any email (e.g., `admin@prabhaav.com`)
2. Enter any password (e.g., `password123`)
3. Click **Login** → Automatically redirects to dashboard

### Executive Dashboard (`/app/executive`)

#### Organization Pulse Card
- Shows composite KPI score: **78.5/100**
- 30-day trend sparkline
- HQ vs Field breakdown
- Hover KPI chip for version info

#### Top Risks Table
- Click **👁️ View** icon on any risk
- Modal opens with evidence feed
- Close modal with X or Cancel

#### Export APAR Card
1. Click **Generate Report**
2. Select employees from dropdown
3. Choose date range (from/to)
4. Click **Generate Signed PDF**
5. Wait for progress (simulated ~3 seconds)
6. Click **Download PDF** when ready

---

## 🗂️ Key Files

| File | Description |
|------|-------------|
| `src/pages/Login.jsx` | Beautiful login interface |
| `src/pages/ExecutiveDashboard.jsx` | Main dashboard layout |
| `src/components/dashboard/OrgPulseCard.jsx` | KPI widget |
| `src/components/dashboard/TopRisksTable.jsx` | Risks table |
| `src/components/dashboard/ExportAPARCard.jsx` | APAR export |
| `src/hooks/useApi.js` | API functions + mock data |
| `src/hooks/useDashboard.js` | TanStack Query hooks |
| `src/test/fixtures.js` | Mock API responses |

---

## 🎨 Customization

### Change Colors
Edit `src/App.jsx`:
```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' }, // Change this!
    secondary: { main: '#7c3aed' }, // And this!
  },
});
```

### Update Logo
Edit `src/components/Logo.jsx`:
```javascript
<Logo size={70} color="#2563eb" />
```

### Add New Routes
Edit `src/App.jsx`:
```javascript
<Route path="/new-page" element={<NewPage />} />
```

---

## 🔧 Common Issues

### Issue: "Module not found"
**Solution**: 
```bash
npm install --legacy-peer-deps
```

### Issue: Vite fails to start
**Solution**: Node.js version should be 20.19+ or 22.12+
```bash
node -v  # Check version
nvm install 22  # Upgrade if needed
```

### Issue: Port 5173 already in use
**Solution**: Change port in `vite.config.js`:
```javascript
server: { port: 3000 }
```

---

## 📦 Build for Production

```bash
npm run build      # Creates dist/ folder
npm run preview    # Test production build
```

Deploy `dist/` folder to:
- Vercel: `vercel deploy`
- Netlify: Drag & drop `dist/`
- GitHub Pages: Push `dist/` to `gh-pages` branch

---

## 🧪 Run Tests (Optional)

### Install Test Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

### Run Tests
```bash
npm test
```

---

## 📚 Learn More

- **Full Documentation**: See `PROJECT_README.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **API Contracts**: See `src/hooks/useApi.js`
- **Mock Data**: See `src/test/fixtures.js`

---

## 🆘 Need Help?

1. Check error messages in browser console (F12)
2. Read error stack trace carefully
3. Verify all dependencies installed
4. Restart dev server
5. Clear browser cache

---

## 🎯 Next Steps

1. ✅ Run the app locally
2. ✅ Explore Login page
3. ✅ Navigate to Dashboard
4. ✅ Test all dashboard features
5. ✅ Read PROJECT_README.md
6. 🚀 Connect to real backend API
7. 🚀 Add authentication logic
8. 🚀 Deploy to production

---

**Happy Coding! 🎉**

Built with ❤️ for SIH 2025
