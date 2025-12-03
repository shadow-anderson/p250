# AI Assistant Guide - Ask Prabhaav

## 📋 Overview

**Ask Prabhaav** is an AI-powered natural language query system that enables users to ask questions about KPIs, projects, evidence, and performance metrics using conversational language. The system uses Retrieval-Augmented Generation (RAG) to provide accurate, explainable answers with source citations.

### Key Features

- **Natural Language Queries**: Ask questions in plain English
- **Contextual Retrieval**: Semantic search over KPIs, projects, and evidence
- **Explainable Results**: Every answer includes sources and confidence scores
- **Quick Actions**: Drilldown links and export options
- **Conversation Memory**: Maintains context across queries
- **Safety First**: Always cites sources, admits uncertainty

---

## 🏗️ Architecture

```
┌─────────────────┐
│  User Query     │
│  "What is the   │
│   HQ Ops score?"│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AskPrabhaavModal.jsx               │
│  - Input handling                   │
│  - Conversation UI                  │
│  - Result cards with citations      │
└────────┬────────────────────────────┘
         │ useQueryAi()
         ▼
┌─────────────────────────────────────┐
│  mockAiServer.js (Port 3004)        │
│  POST /api/ai/query                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  retrieval.js                       │
│  - Semantic search                  │
│  - Score calculation                │
│  - Context filtering                │
└────────┬────────────────────────────┘
         │ Top 3 matches
         ▼
┌─────────────────────────────────────┐
│  prompts.js                         │
│  - Generate system prompt           │
│  - Inject KPI definitions           │
│  - Format context snippets          │
└────────┬────────────────────────────┘
         │ Formatted prompt
         ▼
┌─────────────────────────────────────┐
│  LLM API (Claude / Gemini)          │
│  - Process query with context       │
│  - Generate answer + citations      │
└────────┬────────────────────────────┘
         │ Structured response
         ▼
┌─────────────────────────────────────┐
│  parseAiResponse()                  │
│  - Extract answer text              │
│  - Parse JSON block                 │
│  - Validate citations               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Result Card                        │
│  - Answer (≤80 words)               │
│  - Confidence score                 │
│  - 3 source citations               │
│  - Quick action buttons             │
└─────────────────────────────────────┘
```

---

## 🎯 Client Interface

### AskPrabhaavModal Component

**Location**: `src/components/AskPrabhaavModal.jsx`

**Features**:
- Natural language input with multiline TextField
- Recent queries sidebar (last 5 queries)
- Conversation history with user/AI messages
- Result cards with confidence scores
- Source citations with drilldown links
- Quick action buttons (export, save, drilldown)
- Copy and export conversation

**Usage**:

```jsx
import AskPrabhaavModal from './components/AskPrabhaavModal';

function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        Ask Prabhaav
      </Button>
      
      <AskPrabhaavModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        context={{
          orgId: 'org-123',
          divisionId: 'div-central',
          userId: 'user-456',
        }}
      />
    </>
  );
}
```

### API Hooks

**Location**: `src/hooks/useAiApi.js`

**Available Hooks**:

1. **useQueryAi()** - Submit query to AI
   ```javascript
   const mutation = useQueryAi();
   
   await mutation.mutateAsync({
     query: 'What is the HQ Operations score?',
     context: {
       orgId: 'org-123',
       conversationHistory: [],
     },
   });
   ```

2. **useQueryHistory()** - Fetch recent queries
   ```javascript
   const { data } = useQueryHistory({ limit: 10 });
   // data.queries = [{id, query, timestamp}, ...]
   ```

3. **useSaveQuery()** - Save query to favorites
   ```javascript
   const mutation = useSaveQuery();
   await mutation.mutateAsync({ query: 'Top performers' });
   ```

4. **useAiStats()** - Get query statistics
   ```javascript
   const { data } = useAiStats();
   // data = {totalQueries, avgResponseTime, topCategories}
   ```

---

## 🖥️ Server Implementation

### AI Server

**Location**: `server/mockAiServer.js`  
**Port**: 3004

### Endpoints

#### 1. POST /api/ai/query

Process natural language query with retrieval and LLM.

**Request**:
```json
{
  "query": "What is the current HQ Operations score?",
  "context": {
    "orgId": "org-123",
    "divisionId": "div-central",
    "userId": "user-456",
    "conversationHistory": [
      {"type": "user", "content": "Previous question"},
      {"type": "ai", "content": "Previous answer"}
    ]
  }
}
```

**Response**:
```json
{
  "answer": "The current HQ Operations score is 85 out of 90 (target), representing a 94% achievement rate. The score has shown an upward trend recently.",
  "confidence": 0.95,
  "highlights": [
    {
      "snippet": "Process optimization efforts led to 85% achievement",
      "sourceId": "ev-001"
    }
  ],
  "sources": [
    {
      "id": "kpi-001",
      "type": "kpi",
      "title": "HQ Operations Score",
      "snippet": "Measures efficiency and effectiveness of headquarters operations",
      "link": "/app/division/central",
      "score": 0.87
    }
  ],
  "actions": [
    {
      "type": "drill",
      "label": "View Dashboard",
      "target": "/app/division/central"
    },
    {
      "type": "export",
      "label": "Export Report",
      "data": {"kpiId": "kpi-001"}
    }
  ],
  "processingTime": 543,
  "model": "claude-sonnet-4"
}
```

#### 2. GET /api/ai/history

Fetch recent query history.

**Query Params**: `?limit=10`

**Response**:
```json
{
  "queries": [
    {
      "id": "q-123",
      "query": "What is the HQ Operations score?",
      "response": "The score is 85...",
      "timestamp": "2025-12-04T10:30:00Z"
    }
  ]
}
```

#### 3. POST /api/ai/save

Save query to favorites.

**Request**:
```json
{
  "query": "Projects behind schedule"
}
```

**Response**:
```json
{
  "id": "sq-456",
  "query": "Projects behind schedule",
  "savedAt": "2025-12-04T10:35:00Z"
}
```

#### 4. GET /api/ai/stats

Get query statistics.

**Response**:
```json
{
  "totalQueries": 247,
  "savedQueries": 12,
  "avgResponseTime": 512,
  "topCategories": [
    {"name": "KPIs", "count": 98},
    {"name": "Projects", "count": 75}
  ],
  "recentActivity": [...]
}
```

---

## 🔍 Retrieval System

### Semantic Search

**Location**: `utils/retrieval.js`

**Algorithm**:
1. **Tokenization**: Split query into normalized tokens
2. **Stop Word Removal**: Filter common words (the, is, at, etc.)
3. **Jaccard Similarity**: Calculate intersection/union ratio
4. **Boosting**: Exact matches, title matches get higher scores
5. **Sorting**: Rank by score descending

**Example**:

```javascript
import { retrieveContext } from './utils/retrieval.js';

const results = retrieveContext(
  'What is the HQ Operations score?',
  mockData,
  {
    maxResults: 3,
    minScore: 0.3,
    types: ['kpi', 'project', 'evidence'],
  }
);

// Returns:
[
  {
    id: 'kpi-001',
    type: 'kpi',
    name: 'HQ Operations Score',
    score: 0.87,
    ...
  },
  ...
]
```

### Context Filtering

```javascript
import { filterContext } from './utils/retrieval.js';

const filtered = filterContext(results, {
  division: 'Central Division',
  status: 'at-risk',
  dateRange: {
    start: '2025-11-01',
    end: '2025-11-30',
  },
});
```

### Reranking

```javascript
import { rerank } from './utils/retrieval.js';

const reranked = rerank(results, {
  userDivision: 'Central Division',  // Boost user's division
});
```

---

## 📝 Prompt Engineering

### System Prompt Template

**Location**: `utils/prompts.js`

**Structure**:

```
SYSTEM_CONTEXT
├─ Role: "You are Prabhaav AI Assistant..."
├─ Platform Overview: Performance assessment system
├─ KPI Definitions: 4 categories with weights
└─ Response Guidelines: Concise, cited, actionable

USER_CONTEXT
├─ Organization ID
├─ Division ID
└─ User ID

CONVERSATION_HISTORY
├─ Last 2 exchanges
└─ Maintains context

RETRIEVED_CONTEXT
├─ Top 3 matches from semantic search
├─ KPI data (score, target, trend, weight)
├─ Project data (status, progress, milestones)
└─ Evidence data (type, status, snippet)

USER_QUERY
└─ "What is the HQ Operations score?"

INSTRUCTIONS
├─ Analyze query and context
├─ Provide answer (≤80 words)
├─ One-line rationale
├─ Cite sources (IDs)
├─ Suggest 2-4 actions
└─ Include confidence score

OUTPUT_FORMAT
├─ Natural language answer
└─ JSON block:
    {
      "sources": ["kpi-001"],
      "actions": [{type, label, target}],
      "confidence": 0.95
    }

SAFETY_RULES
├─ Never fabricate data
├─ Always cite sources
├─ Be transparent about limitations
└─ Suggest verification for critical decisions
```

### Prompt Generation

```javascript
import { generatePrompt } from './utils/prompts.js';

const prompt = generatePrompt({
  query: 'What is the HQ Operations score?',
  context: retrievedItems,
  conversationHistory: [
    {type: 'user', content: 'Previous question'},
    {type: 'ai', content: 'Previous answer'},
  ],
  userContext: {
    orgId: 'org-123',
    divisionId: 'div-central',
  },
});

// Send prompt to LLM...
```

### Response Parsing

```javascript
import { parseAiResponse } from './utils/prompts.js';

const llmResponse = `The current HQ Operations score is 85...

\`\`\`json
{
  "sources": ["kpi-001"],
  "actions": [{"type": "drill", "label": "View", "target": "/app"}],
  "confidence": 0.95
}
\`\`\``;

const parsed = parseAiResponse(llmResponse);
// {answer, confidence, highlights, sources, actions}
```

---

## 🔐 Safety & Best Practices

### Citation Requirements

✅ **DO**:
- Always cite sources for factual claims
- Use actual source IDs from retrieved context
- Provide links to original data
- Show confidence scores
- Admit uncertainty when appropriate

❌ **DON'T**:
- Fabricate source IDs
- Make claims without citations
- Hide low confidence scores
- Provide data outside retrieved context

### Uncertainty Handling

When the AI doesn't have enough information:

```javascript
import { formatUncertaintyResponse } from './utils/prompts.js';

const response = formatUncertaintyResponse(
  'What is the weather today?',
  'This query is outside the scope of Prabhaav system'
);

// Returns:
// "I don't have enough information to answer..."
// "How to verify: ..."
// "What I can help with: ..."
```

### Response Validation

```javascript
import { validateResponse } from './utils/prompts.js';

const validation = validateResponse(parsedResponse);

if (!validation.valid) {
  validation.issues.forEach(issue => {
    console.error(`${issue.type}: ${issue.message}`);
  });
}

// Issue types:
// - invalid-source: Source ID is null/invalid
// - empty-answer: No answer text
// - answer-too-long: Exceeds 80 words
// - invalid-confidence: Score not in 0-1 range
```

### Prompt Injection Prevention

1. **Sanitize User Input**:
   ```javascript
   const sanitizedQuery = query
     .replace(/\n{3,}/g, '\n\n')  // Limit newlines
     .trim()
     .substring(0, 500);  // Max 500 chars
   ```

2. **System Prompt Protection**:
   - Use clear delimiters between sections
   - Instruct model to ignore "ignore previous instructions"
   - Validate output format

3. **Output Validation**:
   - Check source IDs against retrieved context
   - Verify action targets are valid routes
   - Sanitize any user-generated content in responses

---

## 🤖 LLM Integration

### Claude Sonnet 4 (Anthropic)

**Recommended for**: High accuracy, strong reasoning

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function callClaude(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    temperature: 0.3,  // Lower for factual responses
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return message.content[0].text;
}
```

### Gemini 3 Pro (Google)

**Recommended for**: Cost-effective, fast

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro',
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  return result.response.text();
}
```

### Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Choose model
AI_MODEL=claude-sonnet-4  # or gemini-3-pro
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1024
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all AI tests
npm test -- AiAssistant.test.jsx

# Run specific test suite
npm test -- AiAssistant.test.jsx -t "Retrieval System"

# Watch mode
npm test -- --watch AiAssistant.test.jsx
```

### Test Coverage

**Retrieval System** (7 tests):
- Retrieve KPIs by query
- Retrieve projects by status
- Retrieve evidence by date
- Respect maxResults parameter
- Filter by minScore threshold
- Filter by specific types
- Sort by score descending

**Context Filtering** (3 tests):
- Filter by division
- Filter by status
- Filter by date range

**Prompt Generation** (3 tests):
- Generate with context
- Include conversation history
- Include user context

**Response Parsing** (3 tests):
- Parse with JSON block
- Handle without JSON
- Extract highlights

**Response Validation** (4 tests):
- Validate correct response
- Detect empty answer
- Detect invalid confidence
- Warn about long answers

**Safety Checks** (2 tests):
- Reject fabricated sources
- Require sources for factual claims

**End-to-End** (3 tests):
- Complete query pipeline
- Handle no context
- Extract and validate citations

### Manual Testing

```bash
# Start AI server
node server/mockAiServer.js

# Start frontend
npm run dev

# Open browser
http://localhost:5174

# Click floating AI button (bottom-right)
# Try example queries:
- "What is the HQ Operations score?"
- "Which projects are behind schedule?"
- "Show me evidence submitted last week"
- "Compare Team Alpha vs Team Beta"
```

---

## 📊 Performance Optimization

### Caching

1. **Query Results Cache**:
   ```javascript
   const queryCache = new Map();
   
   const cacheKey = `${query}-${JSON.stringify(context)}`;
   if (queryCache.has(cacheKey)) {
     return queryCache.get(cacheKey);
   }
   ```

2. **TanStack Query Cache**:
   - Stale time: 30 seconds for history
   - Stale time: 60 seconds for saved queries
   - Automatic refetch on window focus: disabled

### Retrieval Optimization

1. **Early Termination**:
   ```javascript
   if (results.length >= maxResults && result.score < topScore * 0.5) {
     break;  // Stop searching if score too low
   }
   ```

2. **Indexing** (for production):
   - Use vector database (Pinecone, Weaviate)
   - Pre-compute embeddings for all documents
   - Hybrid search (keyword + semantic)

### LLM Optimization

1. **Reduce Context**:
   - Max 3 retrieved items
   - Truncate long snippets (150 chars)
   - Only include relevant fields

2. **Streaming Responses**:
   ```javascript
   const stream = await anthropic.messages.stream({
     model: 'claude-sonnet-4',
     messages: [...],
   });

   for await (const chunk of stream) {
     // Send chunk to client via WebSocket
   }
   ```

3. **Batch Queries**:
   - Group similar queries
   - Cache common patterns

---

## 🚀 Deployment

### Start AI Server

```bash
# Development
node server/mockAiServer.js

# Production with PM2
pm2 start server/mockAiServer.js --name ai-server

# Check status
pm2 status
pm2 logs ai-server
```

### Docker Deployment

Update `docker-compose.yml`:

```yaml
services:
  ai-server:
    build:
      context: .
      dockerfile: Dockerfile.ai
    ports:
      - "3004:3004"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - AI_MODEL=claude-sonnet-4
    volumes:
      - ./server:/app/server:ro
      - ./utils:/app/utils:ro
    networks:
      - prabhaav-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Create `Dockerfile.ai`:

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/
COPY utils/ ./utils/

EXPOSE 3004

CMD ["node", "server/mockAiServer.js"]
```

Build and run:

```bash
docker-compose up -d ai-server
docker-compose logs -f ai-server
```

### Environment Configuration

```bash
# .env.production
NODE_ENV=production
AI_SERVER_PORT=3004

# LLM Provider (choose one)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Model selection
AI_MODEL=claude-sonnet-4  # or gemini-3-pro
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1024

# Rate limiting
AI_RATE_LIMIT_REQUESTS=100  # per minute
AI_RATE_LIMIT_WINDOW=60000  # 1 minute

# Logging
LOG_LEVEL=info
LOG_QUERIES=true
```

---

## 📈 Monitoring

### Metrics to Track

1. **Query Volume**:
   - Total queries per day
   - Queries per user
   - Peak query times

2. **Performance**:
   - Average response time
   - P95/P99 latency
   - LLM API latency

3. **Quality**:
   - Average confidence scores
   - Queries with no context found
   - User feedback (thumbs up/down)

4. **Retrieval**:
   - Average number of matches
   - Average retrieval scores
   - Most queried topics

### Logging

```javascript
// In mockAiServer.js
console.log(`[AI] Processing query: "${query}"`);
console.log(`[AI] Retrieved ${retrievedContext.length} context items`);
console.log(`[AI] LLM response time: ${llmTime}ms`);
console.log(`[AI] Total processing time: ${totalTime}ms`);

// Add structured logging in production
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'ai-queries.log' }),
  ],
});

logger.info({
  event: 'query_processed',
  query,
  contextCount: retrievedContext.length,
  confidence: response.confidence,
  processingTime: totalTime,
  userId: context.userId,
  timestamp: new Date().toISOString(),
});
```

### Alerts

Set up alerts for:
- High error rate (>5%)
- Slow response time (>3s)
- Low confidence queries (>20% with confidence <0.5)
- API rate limits exceeded
- Server downtime

---

## 🎓 Example Queries

### KPI Queries

```
"What is the current HQ Operations score?"
"Show me all KPIs below target"
"Which category has the highest weight?"
"Compare my division's KPIs with North Division"
"What is the trend for Field Operations?"
```

### Project Queries

```
"Which projects are behind schedule?"
"Show me projects with completion rate above 80%"
"What are the upcoming milestones for Project Alpha?"
"How many projects are at risk?"
"Compare Team Alpha vs Team Beta performance"
```

### Evidence Queries

```
"Show me evidence submitted last week"
"How many evidence items are pending approval?"
"What evidence did I submit for HQ Operations?"
"Show approved evidence from November"
"Which categories have the most evidence?"
```

### Analytical Queries

```
"What are the top 3 risks in our division?"
"Who has the highest individual behavior score?"
"What is our overall performance this quarter?"
"Show me trends over the last 6 months"
"Which teams need support?"
```

---

## 🔧 Troubleshooting

### Issue: "No relevant context found"

**Symptoms**: AI responds with uncertainty message

**Solutions**:
1. Lower `minScore` threshold (default 0.3 → 0.2)
2. Expand query with synonyms using `expandQuery()`
3. Check if data exists in `mockData`
4. Try broader keywords ("performance" instead of "HQ Ops score")

### Issue: "Response time too slow (>3s)"

**Solutions**:
1. Reduce `maxResults` (3 → 2)
2. Enable caching for common queries
3. Use faster LLM (Gemini instead of Claude)
4. Pre-compute embeddings for retrieval

### Issue: "Sources not cited"

**Solutions**:
1. Check `parseAiResponse()` JSON extraction
2. Verify LLM output includes ```json block
3. Add stronger citation instructions to system prompt
4. Use validation to reject responses without sources

### Issue: "Hallucinated data"

**Solutions**:
1. Use lower temperature (0.3 or less)
2. Strengthen "never fabricate" instruction in prompt
3. Validate source IDs against retrieved context
4. Reject responses with fabricated IDs

---

## 📚 Additional Resources

- **Anthropic Claude Docs**: https://docs.anthropic.com
- **Google Gemini Docs**: https://ai.google.dev/docs
- **RAG Best Practices**: https://www.anthropic.com/rag-guide
- **Prompt Engineering Guide**: https://www.promptingguide.ai

---

## 🆘 Getting Help

If you encounter issues:

1. Check server logs: `docker-compose logs ai-server`
2. Test retrieval: `npm test -- AiAssistant.test.jsx -t "Retrieval"`
3. Verify LLM API key: `echo $ANTHROPIC_API_KEY`
4. Test prompt generation:
   ```javascript
   const prompt = generatePrompt({...});
   console.log(prompt);
   ```

---

**Ready to ask Prabhaav anything? Click the floating AI button! 🤖**
