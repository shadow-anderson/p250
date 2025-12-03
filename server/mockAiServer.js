/**
 * Mock AI Server - Natural Language Query Processing
 * 
 * Provides endpoints for AI-powered queries about KPIs, projects, and evidence.
 * Includes retrieval-augmented generation (RAG) with source citations.
 * 
 * Endpoints:
 * - POST /api/ai/query - Process natural language query
 * - GET /api/ai/history - Fetch query history
 * - POST /api/ai/save - Save query to favorites
 * - GET /api/ai/saved - Fetch saved queries
 * - DELETE /api/ai/saved/:id - Delete saved query
 * - GET /api/ai/stats - Get query statistics
 * 
 * Port: 3004
 */

import express from 'express';
import cors from 'cors';
import { retrieveContext } from '../utils/retrieval.js';
import { generatePrompt, parseAiResponse } from '../utils/prompts.js';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
const queryHistory = [];
const savedQueries = [];
let queryIdCounter = 1;

// Mock data - KPIs, Projects, Evidence
const mockData = {
  kpis: [
    {
      id: 'kpi-001',
      name: 'HQ Operations Score',
      category: 'HQ Operations',
      currentScore: 85,
      target: 90,
      weight: 0.3,
      trend: 'up',
      lastUpdated: '2025-12-01',
      division: 'Central Division',
    },
    {
      id: 'kpi-002',
      name: 'Field Operations Score',
      category: 'Field Operations',
      currentScore: 78,
      target: 85,
      weight: 0.3,
      trend: 'stable',
      lastUpdated: '2025-12-01',
      division: 'North Division',
    },
    {
      id: 'kpi-003',
      name: 'Team Collaboration Index',
      category: 'Team Collaboration',
      currentScore: 92,
      target: 90,
      weight: 0.2,
      trend: 'up',
      lastUpdated: '2025-12-01',
      division: 'Central Division',
    },
    {
      id: 'kpi-004',
      name: 'Individual Behavior Score',
      category: 'Individual Behavior',
      currentScore: 88,
      target: 85,
      weight: 0.2,
      trend: 'up',
      lastUpdated: '2025-12-01',
      division: 'Central Division',
    },
  ],
  projects: [
    {
      id: 'proj-001',
      name: 'Digital Transformation Initiative',
      status: 'on-track',
      progress: 75,
      deadline: '2025-12-31',
      team: 'Team Alpha',
      division: 'Central Division',
      milestones: 10,
      milestonesCompleted: 7,
    },
    {
      id: 'proj-002',
      name: 'Operational Excellence Program',
      status: 'at-risk',
      progress: 55,
      deadline: '2025-11-30',
      team: 'Team Beta',
      division: 'North Division',
      milestones: 8,
      milestonesCompleted: 4,
    },
    {
      id: 'proj-003',
      name: 'Training & Development Program',
      status: 'on-track',
      progress: 90,
      deadline: '2025-12-15',
      team: 'Team Gamma',
      division: 'Central Division',
      milestones: 6,
      milestonesCompleted: 5,
    },
  ],
  evidence: [
    {
      id: 'ev-001',
      title: 'Q3 Performance Report',
      type: 'report',
      category: 'HQ Operations',
      submittedBy: 'emp-001',
      submittedAt: '2025-11-25',
      status: 'approved',
      division: 'Central Division',
      snippet: 'Achieved 85% score in HQ Operations through process optimization...',
    },
    {
      id: 'ev-002',
      title: 'Field Visit Documentation',
      type: 'document',
      category: 'Field Operations',
      submittedBy: 'emp-002',
      submittedAt: '2025-11-28',
      status: 'approved',
      division: 'North Division',
      snippet: 'Conducted 15 field visits covering 78% of operational sites...',
    },
    {
      id: 'ev-003',
      title: 'Team Meeting Minutes',
      type: 'minutes',
      category: 'Team Collaboration',
      submittedBy: 'emp-003',
      submittedAt: '2025-11-30',
      status: 'pending',
      division: 'Central Division',
      snippet: 'Weekly team meeting with 92% attendance and high engagement...',
    },
  ],
};

/**
 * POST /api/ai/query
 * Process natural language query with retrieval and LLM
 */
app.post('/api/ai/query', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query, context = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[AI] Processing query: "${query}"`);

    // Step 1: Retrieve relevant context
    const retrievedContext = retrieveContext(query, mockData, {
      maxResults: 3,
      minScore: 0.3,
    });

    console.log(`[AI] Retrieved ${retrievedContext.length} context items`);

    // Step 2: Generate prompt for LLM
    const prompt = generatePrompt({
      query,
      context: retrievedContext,
      conversationHistory: context.conversationHistory || [],
      userContext: {
        orgId: context.orgId,
        divisionId: context.divisionId,
        userId: context.userId,
      },
    });

    // Step 3: Call LLM (mock response - replace with actual API call)
    const llmResponse = await callLlmApi(prompt);

    // Step 4: Parse LLM response
    const parsedResponse = parseAiResponse(llmResponse);

    // Step 5: Enhance with metadata
    const response = {
      answer: parsedResponse.answer,
      confidence: parsedResponse.confidence || 0.85,
      highlights: parsedResponse.highlights || [],
      sources: retrievedContext.map((ctx) => ({
        id: ctx.id,
        type: ctx.type,
        title: ctx.title || ctx.name,
        snippet: ctx.snippet || ctx.description,
        link: generateSourceLink(ctx),
        score: ctx.score,
      })),
      actions: generateActions(query, parsedResponse, retrievedContext),
      processingTime: Date.now() - startTime,
      model: 'claude-sonnet-4', // or 'gemini-3-pro'
    };

    // Save to history
    queryHistory.unshift({
      id: `q-${queryIdCounter++}`,
      query,
      response: response.answer,
      timestamp: new Date().toISOString(),
      context,
    });

    // Keep only last 100 queries
    if (queryHistory.length > 100) {
      queryHistory.pop();
    }

    res.json(response);
  } catch (error) {
    console.error('[AI] Query processing error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/history
 * Fetch recent query history
 */
app.get('/api/ai/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const queries = queryHistory.slice(0, limit);
  
  res.json({ queries });
});

/**
 * POST /api/ai/save
 * Save query to favorites
 */
app.post('/api/ai/save', (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const savedQuery = {
    id: `sq-${Date.now()}`,
    query,
    savedAt: new Date().toISOString(),
  };

  savedQueries.unshift(savedQuery);
  res.json(savedQuery);
});

/**
 * GET /api/ai/saved
 * Fetch saved queries
 */
app.get('/api/ai/saved', (req, res) => {
  res.json({ queries: savedQueries });
});

/**
 * DELETE /api/ai/saved/:id
 * Delete saved query
 */
app.delete('/api/ai/saved/:id', (req, res) => {
  const { id } = req.params;
  const index = savedQueries.findIndex((q) => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Query not found' });
  }

  savedQueries.splice(index, 1);
  res.json({ success: true });
});

/**
 * GET /api/ai/stats
 * Get query statistics
 */
app.get('/api/ai/stats', (req, res) => {
  const stats = {
    totalQueries: queryHistory.length,
    savedQueries: savedQueries.length,
    avgResponseTime: calculateAvgResponseTime(),
    topCategories: getTopCategories(),
    recentActivity: queryHistory.slice(0, 5).map((q) => ({
      query: q.query,
      timestamp: q.timestamp,
    })),
  };

  res.json(stats);
});

/**
 * Call LLM API (mock implementation)
 * Replace with actual Anthropic Claude or Google Gemini API
 */
async function callLlmApi(prompt) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response - replace with actual API call:
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 1024,
  //   messages: [{ role: 'user', content: prompt }],
  // });
  // return response.content[0].text;

  // Mock intelligent response based on query patterns
  const query = prompt.toLowerCase();

  if (query.includes('hq operations') || query.includes('score')) {
    return `Based on the latest data, HQ Operations currently has a score of 85 out of 90 (target), representing a 94% achievement rate. The score has shown an upward trend recently.

**Rationale:** This is derived from the Q3 Performance Report which documented process optimization efforts.

**Sources:**
- KPI: HQ Operations Score (kpi-001)
- Evidence: Q3 Performance Report (ev-001)

**Actions:**
- View detailed breakdown in Division Dashboard
- Compare with previous quarters
- Export report for stakeholder review

\`\`\`json
{
  "sources": ["kpi-001", "ev-001"],
  "actions": [
    {"type": "drill", "label": "View Dashboard", "target": "/app/division/central"},
    {"type": "export", "label": "Export Report", "data": {"kpiId": "kpi-001"}}
  ]
}
\`\`\``;
  } else if (query.includes('behind schedule') || query.includes('at risk')) {
    return `One project is currently at risk: **Operational Excellence Program** (Team Beta, North Division).

It has 55% progress but the deadline is November 30, 2025, with only 4 out of 8 milestones completed.

**Rationale:** Progress rate vs. deadline indicates potential delay. Immediate attention required.

**Sources:**
- Project: Operational Excellence Program (proj-002)

**Actions:**
- Review project details
- Contact Team Beta lead
- Escalate to division head

\`\`\`json
{
  "sources": ["proj-002"],
  "actions": [
    {"type": "drill", "label": "View Project", "target": "/app/project/proj-002"},
    {"type": "save", "label": "Track Progress", "query": "Projects behind schedule"}
  ]
}
\`\`\``;
  } else if (query.includes('evidence') && query.includes('last week')) {
    return `Three evidence items were submitted last week:

1. **Q3 Performance Report** (HQ Operations) - Approved
2. **Field Visit Documentation** (Field Operations) - Approved  
3. **Team Meeting Minutes** (Team Collaboration) - Pending review

**Rationale:** Filtered evidence submissions from Nov 25-30, 2025.

**Sources:**
- Evidence: Q3 Performance Report (ev-001)
- Evidence: Field Visit Documentation (ev-002)
- Evidence: Team Meeting Minutes (ev-003)

**Actions:**
- Review pending evidence
- Download all submissions
- Generate evidence summary report

\`\`\`json
{
  "sources": ["ev-001", "ev-002", "ev-003"],
  "actions": [
    {"type": "drill", "label": "Review Evidence", "target": "/app/evidence"},
    {"type": "export", "label": "Download All", "data": {"evidenceIds": ["ev-001", "ev-002", "ev-003"]}}
  ]
}
\`\`\``;
  } else if (query.includes('compare') && query.includes('team')) {
    return `**Team Comparison:**

- **Team Alpha** (Digital Transformation): 75% progress, on track, 7/10 milestones
- **Team Beta** (Operational Excellence): 55% progress, at risk, 4/8 milestones
- **Team Gamma** (Training & Development): 90% progress, on track, 5/6 milestones

**Rationale:** Team Gamma leads in progress and completion rate. Team Beta needs support.

**Sources:**
- Project: Digital Transformation (proj-001)
- Project: Operational Excellence (proj-002)
- Project: Training & Development (proj-003)

**Actions:**
- View team performance dashboard
- Export comparison report
- Schedule team lead meeting

\`\`\`json
{
  "sources": ["proj-001", "proj-002", "proj-003"],
  "actions": [
    {"type": "drill", "label": "Team Dashboard", "target": "/app/dashboard/teams"},
    {"type": "export", "label": "Export Comparison", "data": {"type": "team-comparison"}}
  ]
}
\`\`\``;
  } else {
    // Fallback response
    return `I don't have enough specific information to answer that question with confidence.

**How to verify:**
1. Check the Project Dashboard for real-time data
2. Review recent evidence submissions
3. Consult with your division administrator

**What I can help with:**
- KPI scores and trends
- Project status and progress
- Evidence submission tracking
- Team performance comparisons

\`\`\`json
{
  "sources": [],
  "actions": [
    {"type": "drill", "label": "Go to Dashboard", "target": "/app/dashboard"}
  ]
}
\`\`\``;
  }
}

/**
 * Generate source link based on item type
 */
function generateSourceLink(item) {
  switch (item.type) {
    case 'kpi':
      return `/app/division/${item.division?.toLowerCase().replace(/ /g, '-')}`;
    case 'project':
      return `/app/project/${item.id}`;
    case 'evidence':
      return `/app/evidence?id=${item.id}`;
    default:
      return '/app/dashboard';
  }
}

/**
 * Generate quick action buttons based on query and response
 */
function generateActions(query, parsedResponse, retrievedContext) {
  const actions = parsedResponse.actions || [];
  const queryLower = query.toLowerCase();

  // Add contextual actions based on query type
  if (queryLower.includes('project') && retrievedContext.some(c => c.type === 'project')) {
    const project = retrievedContext.find(c => c.type === 'project');
    if (project && !actions.some(a => a.target === `/app/project/${project.id}`)) {
      actions.push({
        type: 'drill',
        label: 'View Project',
        target: `/app/project/${project.id}`,
      });
    }
  }

  if (queryLower.includes('export') || queryLower.includes('download')) {
    if (!actions.some(a => a.type === 'export')) {
      actions.push({
        type: 'export',
        label: 'Export Data',
        data: { items: retrievedContext.map(c => c.id) },
      });
    }
  }

  // Always add save query action
  if (!actions.some(a => a.type === 'save')) {
    actions.push({
      type: 'save',
      label: 'Save Query',
      query: query,
    });
  }

  return actions.slice(0, 4); // Max 4 actions
}

/**
 * Calculate average response time
 */
function calculateAvgResponseTime() {
  if (queryHistory.length === 0) return 0;
  
  const recent = queryHistory.slice(0, 20);
  const avg = recent.reduce((sum, q) => sum + (q.processingTime || 500), 0) / recent.length;
  return Math.round(avg);
}

/**
 * Get top query categories
 */
function getTopCategories() {
  const categories = {};
  
  queryHistory.forEach((q) => {
    const query = q.query.toLowerCase();
    if (query.includes('kpi') || query.includes('score')) {
      categories.KPIs = (categories.KPIs || 0) + 1;
    }
    if (query.includes('project')) {
      categories.Projects = (categories.Projects || 0) + 1;
    }
    if (query.includes('evidence')) {
      categories.Evidence = (categories.Evidence || 0) + 1;
    }
    if (query.includes('team')) {
      categories.Teams = (categories.Teams || 0) + 1;
    }
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
  console.log('Ready to process natural language queries');
});
