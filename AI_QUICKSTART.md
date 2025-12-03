# Ask Prabhaav - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly set up and test the AI-powered natural language query system.

---

## Prerequisites

```bash
# Ensure Node.js is installed
node --version  # v20 or higher

# Install dependencies
cd p250
npm install
```

---

## Step 1: Set Up Environment Variables

Create a `.env` file in `p250/` directory:

```bash
# Choose your LLM provider (one of the following)

# Option 1: Anthropic Claude (recommended for accuracy)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Option 2: Google Gemini (cost-effective)
GOOGLE_API_KEY=AIza...

# AI Configuration
AI_MODEL=claude-sonnet-4  # or gemini-3-pro
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1024
```

**Get API Keys**:
- Claude: https://console.anthropic.com/
- Gemini: https://aistudio.google.com/app/apikey

---

## Step 2: Start the AI Server

```bash
# From p250 directory
node server/mockAiServer.js
```

You should see:
```
AI Server running on http://localhost:3004
Ready to process natural language queries
```

---

## Step 3: Start the Frontend

In a **new terminal**:

```bash
cd p250
npm run dev
```

Navigate to: `http://localhost:5174`

---

## Step 4: Try Your First Query

1. **Click the floating AI button** (bottom-right corner with brain icon 🧠)

2. **Type a question**:
   ```
   What is the current HQ Operations score?
   ```

3. **Press Enter** or click Send

4. **View the result**:
   - Answer in natural language
   - Confidence score (e.g., 95%)
   - Source citations with links
   - Quick action buttons

---

## 📝 Example Queries to Try

### KPI Queries
```
What is the HQ Operations score?
Show me all KPIs below target
Which category has the highest weight?
What is the trend for Field Operations?
```

### Project Queries
```
Which projects are behind schedule?
Show me projects at risk
What are the upcoming milestones?
Compare Team Alpha vs Team Beta
```

### Evidence Queries
```
Show me evidence submitted last week
How many evidence items are pending?
What evidence did I submit for HQ Operations?
```

### Analytical Queries
```
What are the top risks in our division?
Who has the highest score?
Show me trends this quarter
```

---

## 🐳 Docker Deployment (Optional)

For production-like environment with all services:

### 1. Update Environment

```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

### 2. Start All Services

```bash
# Build and start all 7 services
docker-compose up -d

# Check status
docker-compose ps

# Should show: frontend, evidence-server, admin-server, 
#              report-server, report-worker, redis, ai-server
```

### 3. Access AI Assistant

- Frontend: `http://localhost:5174`
- Click the floating AI button
- AI Server API: `http://localhost:3004/api/ai/query`

### 4. View Logs

```bash
# All services
docker-compose logs -f

# AI server only
docker-compose logs -f ai-server

# Last 50 lines
docker-compose logs --tail=50 ai-server
```

### 5. Stop Services

```bash
docker-compose down

# Remove volumes (clears Redis data)
docker-compose down -v
```

---

## 🧪 Testing

### Run Integration Tests

```bash
# Run all AI tests
npm test -- AiAssistant.test.jsx

# Run specific test suite
npm test -- AiAssistant.test.jsx -t "Retrieval System"

# Watch mode
npm test -- --watch AiAssistant.test.jsx
```

### Manual Testing with curl

```bash
# Test AI query endpoint
curl -X POST http://localhost:3004/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the HQ Operations score?",
    "context": {"orgId": "org-123"}
  }'

# Get query history
curl http://localhost:3004/api/ai/history?limit=5

# Get statistics
curl http://localhost:3004/api/ai/stats
```

---

## 🔍 Verify Setup

### Checklist

- [ ] `.env` file created with API key
- [ ] AI server running on port 3004
- [ ] Frontend running on port 5174
- [ ] Floating AI button visible (bottom-right)
- [ ] Modal opens when clicking button
- [ ] Can type and submit queries
- [ ] Responses include answer, confidence, sources
- [ ] Quick action buttons work
- [ ] Recent queries sidebar populated

### Health Check

```bash
# Test AI server health
curl http://localhost:3004/health

# Expected response:
{"status":"ok","service":"ai-server"}
```

---

## 🔧 Troubleshooting

### Issue: "AI server not responding"

**Check if server is running**:
```bash
# Windows
netstat -ano | findstr :3004

# If nothing, start server
node server/mockAiServer.js
```

### Issue: "API key not found"

**Verify environment variables**:
```bash
# Check .env file exists
ls .env

# Check key is set
cat .env | grep API_KEY

# Restart server after adding key
```

### Issue: "No context found for query"

**Solutions**:
1. Try broader keywords: "score" instead of "HQ Ops score"
2. Check mock data in `server/mockAiServer.js`
3. Lower minScore threshold in retrieval

### Issue: "Slow response (>3s)"

**Solutions**:
1. Use Gemini instead of Claude (faster)
2. Reduce maxResults to 2 in retrieval
3. Enable response caching

### Issue: "CORS error"

**Fix CORS in mockAiServer.js**:
```javascript
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true,
}));
```

---

## 📚 Next Steps

### Explore Features

1. **Conversation Context**:
   - Ask follow-up questions
   - AI remembers last 2 exchanges

2. **Quick Actions**:
   - Click "View Dashboard" to drilldown
   - Click "Export" to download data
   - Click "Save Query" to bookmark

3. **Recent Queries**:
   - Click sidebar items to reuse queries
   - History persists across sessions

4. **Export Conversation**:
   - Click download icon (bottom-left)
   - Saves as JSON file

### Customize

1. **Add Custom Data**:
   - Edit `mockData` in `server/mockAiServer.js`
   - Add your KPIs, projects, evidence

2. **Modify Prompts**:
   - Edit `SYSTEM_CONTEXT` in `utils/prompts.js`
   - Add organization-specific context

3. **Adjust Retrieval**:
   - Change `maxResults` (default 3)
   - Change `minScore` threshold (default 0.3)
   - Add custom boosting logic

### Integrate Production LLM

1. **Claude Sonnet 4**:
   ```javascript
   // In mockAiServer.js
   import Anthropic from '@anthropic-ai/sdk';
   
   const anthropic = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY,
   });
   
   const message = await anthropic.messages.create({
     model: 'claude-sonnet-4-20250514',
     max_tokens: 1024,
     messages: [{ role: 'user', content: prompt }],
   });
   ```

2. **Gemini 3 Pro**:
   ```javascript
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
   const model = genAI.getGenerativeModel({ model: 'gemini-3-pro' });
   
   const result = await model.generateContent(prompt);
   ```

---

## 🎓 Learn More

- **[AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md)** - Complete documentation
  - Architecture details
  - Prompt engineering
  - LLM integration
  - Retrieval optimization
  - Safety best practices
  - Production deployment

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Admin panel docs
- **[APAR_REPORTS_GUIDE.md](./APAR_REPORTS_GUIDE.md)** - Report generation

---

## 💡 Tips

1. **Be Specific**: "HQ Operations score for November" better than "scores"
2. **Ask Follow-ups**: AI remembers context from previous 2 exchanges
3. **Use Action Buttons**: Click links to navigate directly to data
4. **Save Useful Queries**: Bookmark frequently used questions
5. **Export Conversations**: Download for sharing or record-keeping

---

## 🆘 Getting Help

If you encounter issues:

1. Check server logs: `docker-compose logs ai-server`
2. Run tests: `npm test -- AiAssistant.test.jsx`
3. Verify API key: `echo $ANTHROPIC_API_KEY`
4. Review [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md) troubleshooting section

---

**Ready to ask Prabhaav anything? Click the floating AI button! 🤖✨**
