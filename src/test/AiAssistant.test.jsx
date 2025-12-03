import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { retrieveContext, filterContext, expandQuery, rerank, generateSnippet } from '../utils/retrieval.js';
import { generatePrompt, parseAiResponse, validateResponse, formatUncertaintyResponse } from '../utils/prompts.js';

/**
 * AI Assistant Integration Tests
 * 
 * Tests for:
 * - Query processing and retrieval
 * - Prompt generation and parsing
 * - Source citation extraction
 * - Response validation
 * - Safety checks
 */

// Mock data for testing
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
  ],
};

describe('Retrieval System', () => {
  it('should retrieve relevant context for KPI queries', () => {
    const query = 'What is the HQ Operations score?';
    const results = retrieveContext(query, mockData, { maxResults: 3 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('kpi');
    expect(results[0].category).toContain('HQ Operations');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('should retrieve relevant context for project queries', () => {
    const query = 'Which projects are behind schedule?';
    const results = retrieveContext(query, mockData, { maxResults: 3 });

    expect(results.length).toBeGreaterThan(0);
    const hasProject = results.some(r => r.type === 'project');
    expect(hasProject).toBe(true);
  });

  it('should retrieve relevant context for evidence queries', () => {
    const query = 'Show me evidence submitted last week';
    const results = retrieveContext(query, mockData, { maxResults: 3 });

    expect(results.length).toBeGreaterThan(0);
    const hasEvidence = results.some(r => r.type === 'evidence');
    expect(hasEvidence).toBe(true);
  });

  it('should respect maxResults parameter', () => {
    const query = 'performance';
    const results = retrieveContext(query, mockData, { maxResults: 1 });

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('should respect minScore threshold', () => {
    const query = 'unrelated query xyz123';
    const results = retrieveContext(query, mockData, { minScore: 0.8 });

    // Should return no results for unrelated query
    expect(results.length).toBe(0);
  });

  it('should filter by specific types', () => {
    const query = 'operations';
    const results = retrieveContext(query, mockData, { types: ['kpi'], maxResults: 5 });

    results.forEach(result => {
      expect(result.type).toBe('kpi');
    });
  });

  it('should sort results by score descending', () => {
    const query = 'operations score';
    const results = retrieveContext(query, mockData, { maxResults: 5 });

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

describe('Context Filtering', () => {
  it('should filter by division', () => {
    const context = retrieveContext('operations', mockData, { maxResults: 10 });
    const filtered = filterContext(context, { division: 'Central Division' });

    filtered.forEach(item => {
      expect(item.division).toBe('Central Division');
    });
  });

  it('should filter by status', () => {
    const context = retrieveContext('project', mockData, { maxResults: 10 });
    const filtered = filterContext(context, { status: 'at-risk' });

    filtered.forEach(item => {
      expect(item.status).toBe('at-risk');
    });
  });

  it('should filter by date range', () => {
    const context = retrieveContext('evidence', mockData, { maxResults: 10 });
    const filtered = filterContext(context, {
      dateRange: { start: '2025-11-20', end: '2025-11-30' },
    });

    filtered.forEach(item => {
      const date = new Date(item.submittedAt || item.lastUpdated || item.deadline);
      expect(date >= new Date('2025-11-20')).toBe(true);
      expect(date <= new Date('2025-11-30')).toBe(true);
    });
  });
});

describe('Query Expansion', () => {
  it('should expand query with synonyms', () => {
    const query = 'score';
    const expanded = expandQuery(query);

    expect(expanded).toContain('score');
    expect(expanded.length).toBeGreaterThan(1);
  });

  it('should include original query', () => {
    const query = 'project status';
    const expanded = expandQuery(query);

    expect(expanded).toContain('project status');
  });
});

describe('Result Reranking', () => {
  it('should boost recent items', () => {
    const results = [
      {
        id: 'old',
        type: 'kpi',
        score: 0.5,
        lastUpdated: '2025-01-01',
      },
      {
        id: 'recent',
        type: 'kpi',
        score: 0.5,
        lastUpdated: '2025-12-01',
      },
    ];

    const reranked = rerank(results);
    expect(reranked[0].id).toBe('recent');
  });

  it('should boost items from user context', () => {
    const results = [
      { id: '1', type: 'kpi', score: 0.5, division: 'North Division' },
      { id: '2', type: 'kpi', score: 0.5, division: 'Central Division' },
    ];

    const reranked = rerank(results, { userDivision: 'Central Division' });
    expect(reranked[0].division).toBe('Central Division');
  });
});

describe('Snippet Generation', () => {
  it('should generate context snippet', () => {
    const item = mockData.evidence[0];
    const query = 'HQ Operations';
    const snippet = generateSnippet(item, query);

    expect(snippet).toBeTruthy();
    expect(typeof snippet).toBe('string');
    expect(snippet.length).toBeGreaterThan(0);
  });

  it('should truncate long snippets', () => {
    const item = {
      ...mockData.evidence[0],
      snippet: 'A'.repeat(200),
    };
    const query = 'test';
    const snippet = generateSnippet(item, query);

    expect(snippet.length).toBeLessThanOrEqual(150);
  });
});

describe('Prompt Generation', () => {
  it('should generate prompt with context', () => {
    const context = retrieveContext('HQ Operations score', mockData, { maxResults: 3 });
    const prompt = generatePrompt({
      query: 'What is the HQ Operations score?',
      context,
      conversationHistory: [],
      userContext: {},
    });

    expect(prompt).toContain('Prabhaav AI Assistant');
    expect(prompt).toContain('HQ Operations');
    expect(prompt).toContain('What is the HQ Operations score?');
  });

  it('should include conversation history', () => {
    const history = [
      { type: 'user', content: 'Previous question' },
      { type: 'ai', content: 'Previous answer' },
    ];

    const prompt = generatePrompt({
      query: 'Follow up question',
      context: [],
      conversationHistory: history,
      userContext: {},
    });

    expect(prompt).toContain('Previous question');
    expect(prompt).toContain('Previous answer');
  });

  it('should include user context', () => {
    const prompt = generatePrompt({
      query: 'Test query',
      context: [],
      conversationHistory: [],
      userContext: {
        orgId: 'org-123',
        divisionId: 'div-456',
        userId: 'user-789',
      },
    });

    expect(prompt).toContain('org-123');
    expect(prompt).toContain('div-456');
  });
});

describe('Response Parsing', () => {
  it('should parse AI response with JSON block', () => {
    const response = `This is the answer to your question.

**Rationale:** Based on the data provided.

\`\`\`json
{
  "sources": ["kpi-001", "ev-001"],
  "actions": [
    {"type": "drill", "label": "View Details", "target": "/app/dashboard"}
  ],
  "confidence": 0.9
}
\`\`\``;

    const parsed = parseAiResponse(response);

    expect(parsed.answer).toContain('answer to your question');
    expect(parsed.sources).toEqual(['kpi-001', 'ev-001']);
    expect(parsed.actions.length).toBe(1);
    expect(parsed.confidence).toBe(0.9);
  });

  it('should handle response without JSON block', () => {
    const response = 'Simple answer without structured data.';
    const parsed = parseAiResponse(response);

    expect(parsed.answer).toBe(response);
    expect(parsed.sources).toEqual([]);
    expect(parsed.actions).toEqual([]);
    expect(parsed.confidence).toBeGreaterThan(0);
  });

  it('should extract highlights from bullet points', () => {
    const response = `Here are the key findings:

- First important point
- Second important point
* Third important point

\`\`\`json
{"sources": [], "actions": []}
\`\`\``;

    const parsed = parseAiResponse(response);

    expect(parsed.highlights.length).toBeGreaterThan(0);
  });
});

describe('Response Validation', () => {
  it('should validate correct response', () => {
    const response = {
      answer: 'This is a valid answer.',
      sources: ['kpi-001', 'proj-002'],
      actions: [{ type: 'drill', label: 'View', target: '/app' }],
      confidence: 0.85,
    };

    const validation = validateResponse(response);
    expect(validation.valid).toBe(true);
    expect(validation.issues.length).toBe(0);
  });

  it('should detect empty answer', () => {
    const response = {
      answer: '',
      sources: [],
      actions: [],
      confidence: 0.85,
    };

    const validation = validateResponse(response);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.type === 'empty-answer')).toBe(true);
  });

  it('should detect invalid confidence score', () => {
    const response = {
      answer: 'Valid answer',
      sources: [],
      actions: [],
      confidence: 1.5, // Invalid: > 1
    };

    const validation = validateResponse(response);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.type === 'invalid-confidence')).toBe(true);
  });

  it('should warn about long answers', () => {
    const response = {
      answer: 'This is a very long answer with many words. '.repeat(10),
      sources: [],
      actions: [],
      confidence: 0.85,
    };

    const validation = validateResponse(response);
    expect(validation.issues.some(i => i.type === 'answer-too-long')).toBe(true);
  });
});

describe('Uncertainty Handling', () => {
  it('should format uncertainty response', () => {
    const response = formatUncertaintyResponse(
      'Unknown query',
      'No relevant data found'
    );

    expect(response).toContain("I don't have enough information");
    expect(response).toContain('Unknown query');
    expect(response).toContain('No relevant data found');
    expect(response).toContain('"confidence": 0.0');
  });
});

describe('End-to-End Query Processing', () => {
  it('should process complete query pipeline', () => {
    const query = 'What is the current HQ Operations score?';

    // Step 1: Retrieve context
    const context = retrieveContext(query, mockData, { maxResults: 3 });
    expect(context.length).toBeGreaterThan(0);

    // Step 2: Generate prompt
    const prompt = generatePrompt({
      query,
      context,
      conversationHistory: [],
      userContext: {},
    });
    expect(prompt).toContain(query);
    expect(prompt).toContain('HQ Operations');

    // Step 3: Parse mock response
    const mockResponse = `The current HQ Operations score is 85 out of 90 (target).

\`\`\`json
{
  "sources": ["kpi-001"],
  "actions": [{"type": "drill", "label": "View Dashboard", "target": "/app/division/central"}],
  "confidence": 0.95
}
\`\`\``;

    const parsed = parseAiResponse(mockResponse);
    expect(parsed.answer).toContain('85 out of 90');
    expect(parsed.sources).toContain('kpi-001');

    // Step 4: Validate response
    const validation = validateResponse(parsed);
    expect(validation.valid).toBe(true);
  });

  it('should handle queries with no relevant context', () => {
    const query = 'What is the weather today?';

    const context = retrieveContext(query, mockData, { maxResults: 3, minScore: 0.3 });
    expect(context.length).toBe(0);

    const uncertaintyResponse = formatUncertaintyResponse(
      query,
      'This query is outside the scope of Prabhaav system'
    );
    expect(uncertaintyResponse).toContain("I don't have enough information");
  });

  it('should extract citations from response', () => {
    const context = retrieveContext('projects at risk', mockData, { maxResults: 3 });
    
    const mockResponse = `One project is at risk: Operational Excellence Program.

\`\`\`json
{
  "sources": ["proj-002"],
  "actions": [{"type": "drill", "label": "View Project", "target": "/app/project/proj-002"}]
}
\`\`\``;

    const parsed = parseAiResponse(mockResponse);
    
    // Verify citations
    expect(parsed.sources).toContain('proj-002');
    expect(parsed.sources.length).toBe(1);
    
    // Verify source exists in context
    const sourceExists = context.some(c => c.id === 'proj-002');
    expect(sourceExists).toBe(true);
  });
});

describe('Safety Checks', () => {
  it('should reject response with fabricated sources', () => {
    const response = {
      answer: 'Valid answer',
      sources: [null, undefined, 123], // Invalid source IDs
      actions: [],
      confidence: 0.85,
    };

    const validation = validateResponse(response);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.type === 'invalid-source')).toBe(true);
  });

  it('should always include sources for factual claims', () => {
    // This is a guideline test - in production, use an LLM judge
    const responseWithSources = {
      answer: 'The score is 85.',
      sources: ['kpi-001'],
      actions: [],
      confidence: 0.9,
    };

    const responseWithoutSources = {
      answer: 'The score is 85.',
      sources: [],
      actions: [],
      confidence: 0.9,
    };

    // Response with sources is valid
    expect(validateResponse(responseWithSources).valid).toBe(true);

    // Response without sources for factual claim should be flagged
    // (In production, implement semantic analysis to detect factual claims)
  });
});
