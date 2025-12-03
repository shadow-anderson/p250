/**
 * Prompt Templates for AI Assistant
 * 
 * Provides robust prompt engineering for Claude Sonnet 4 and Gemini 3 Pro
 * with context injection, safety guidelines, and structured output formatting.
 */

/**
 * KPI Definitions for context
 */
const KPI_DEFINITIONS = {
  'HQ Operations': {
    description: 'Measures efficiency and effectiveness of headquarters operations',
    components: ['Process adherence', 'Documentation quality', 'Response time'],
    weight: 0.3,
  },
  'Field Operations': {
    description: 'Evaluates field activities, site visits, and operational execution',
    components: ['Site coverage', 'Task completion', 'Quality of work'],
    weight: 0.3,
  },
  'Team Collaboration': {
    description: 'Assesses teamwork, communication, and collaborative effectiveness',
    components: ['Meeting participation', 'Knowledge sharing', 'Cross-team coordination'],
    weight: 0.2,
  },
  'Individual Behavior': {
    description: 'Measures personal conduct, professionalism, and work ethics',
    components: ['Punctuality', 'Initiative', 'Accountability'],
    weight: 0.2,
  },
};

/**
 * System context for the AI
 */
const SYSTEM_CONTEXT = `You are Prabhaav AI Assistant, an intelligent query system for the Prabhaav Performance Management Platform.

**Your Role:**
- Answer questions about KPIs, projects, evidence, and performance metrics
- Provide concise, accurate, and actionable insights
- Always cite sources for your answers
- Be transparent about confidence levels
- Suggest verification steps when uncertain

**Platform Overview:**
Prabhaav is a performance assessment system used by government organizations to track:
- Key Performance Indicators (KPIs) across 4 categories
- Project progress and milestones
- Evidence submissions for performance documentation
- Team and individual performance metrics

**KPI Categories:**
${Object.entries(KPI_DEFINITIONS)
  .map(
    ([name, def]) =>
      `- ${name} (${def.weight * 100}%): ${def.description}`
  )
  .join('\n')}

**Response Guidelines:**
1. Keep answers concise (≤80 words)
2. Provide one-line rationale for your answer
3. Cite up to 3 sources with IDs
4. Suggest 2-4 actionable next steps
5. Include confidence score if uncertain
6. Use "I don't know" when data is insufficient`;

/**
 * Generate prompt for LLM
 * 
 * @param {object} params - Prompt parameters
 * @returns {string} Formatted prompt
 */
export function generatePrompt({ query, context, conversationHistory, userContext }) {
  const contextSection = formatContextSection(context);
  const historySection = formatHistorySection(conversationHistory);
  const userSection = formatUserContext(userContext);

  return `${SYSTEM_CONTEXT}

${userSection}

${historySection}

**Retrieved Context:**
${contextSection}

**User Query:**
"${query}"

**Instructions:**
Analyze the query and retrieved context to provide a helpful answer. Structure your response as follows:

1. **Answer** (≤80 words): Direct answer to the query
2. **Rationale** (1 sentence): Brief explanation of your reasoning
3. **Sources** (list): IDs of context items used (e.g., kpi-001, proj-002)
4. **Actions** (2-4 items): Suggested next steps with labels and targets

If the query cannot be answered with confidence from the provided context:
- State "I don't have enough information to answer this with confidence."
- Explain what information is missing
- Suggest how the user can verify or find the answer

**Output Format:**
Provide your response in natural language, followed by a JSON block with structured data:

\`\`\`json
{
  "sources": ["<source-id-1>", "<source-id-2>"],
  "actions": [
    {"type": "drill|export|save", "label": "<button-text>", "target": "<url>", "data": {}}
  ],
  "confidence": 0.0-1.0
}
\`\`\`

**Safety Rules:**
- Never fabricate data or sources
- Always cite retrieved context
- Be transparent about limitations
- Suggest verification for critical decisions
- Respect data privacy and security`;
}

/**
 * Format context section with retrieved items
 */
function formatContextSection(context) {
  if (!context || context.length === 0) {
    return 'No relevant context found in the system.';
  }

  return context
    .map((item, idx) => {
      const header = `[${idx + 1}] ${item.type.toUpperCase()}: ${item.name || item.title} (ID: ${item.id}, Score: ${(item.score * 100).toFixed(0)}%)`;
      
      const details = [];
      if (item.type === 'kpi') {
        details.push(`Category: ${item.category}`);
        details.push(`Current: ${item.currentScore}/${item.target}`);
        details.push(`Trend: ${item.trend}`);
        details.push(`Weight: ${(item.weight * 100).toFixed(0)}%`);
      } else if (item.type === 'project') {
        details.push(`Status: ${item.status}`);
        details.push(`Progress: ${item.progress}%`);
        details.push(`Milestones: ${item.milestonesCompleted}/${item.milestones}`);
        details.push(`Team: ${item.team}`);
      } else if (item.type === 'evidence') {
        details.push(`Type: ${item.type}`);
        details.push(`Status: ${item.status}`);
        details.push(`Submitted: ${item.submittedAt}`);
        details.push(`Snippet: ${item.snippet}`);
      }

      return `${header}\n  ${details.join('\n  ')}`;
    })
    .join('\n\n');
}

/**
 * Format conversation history
 */
function formatHistorySection(history) {
  if (!history || history.length === 0) {
    return '**Conversation History:** None (first query)';
  }

  const formatted = history
    .slice(-2) // Last 2 exchanges
    .map((msg) => {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    })
    .join('\n');

  return `**Conversation History:**\n${formatted}`;
}

/**
 * Format user context
 */
function formatUserContext(userContext) {
  if (!userContext || Object.keys(userContext).length === 0) {
    return '**User Context:** Not specified';
  }

  const parts = [];
  if (userContext.orgId) parts.push(`Organization: ${userContext.orgId}`);
  if (userContext.divisionId) parts.push(`Division: ${userContext.divisionId}`);
  if (userContext.userId) parts.push(`User: ${userContext.userId}`);

  return `**User Context:**\n${parts.join('\n')}`;
}

/**
 * Parse AI response into structured format
 * 
 * @param {string} response - Raw LLM response
 * @returns {object} Parsed response
 */
export function parseAiResponse(response) {
  try {
    // Extract JSON block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    
    let structured = {
      sources: [],
      actions: [],
      confidence: 0.85, // Default confidence
    };

    if (jsonMatch && jsonMatch[1]) {
      try {
        structured = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse JSON block:', e);
      }
    }

    // Extract answer (text before JSON block)
    let answer = response;
    if (jsonMatch) {
      answer = response.substring(0, jsonMatch.index).trim();
    }

    // Extract highlights from answer (lines starting with - or *)
    const highlights = [];
    const lines = answer.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^[•\-*]\s*(.+)/);
      if (match) {
        highlights.push({
          snippet: match[1].trim(),
          sourceId: null, // Will be populated from sources
        });
      }
    });

    return {
      answer: answer.trim(),
      confidence: structured.confidence || 0.85,
      highlights: highlights.slice(0, 3), // Max 3 highlights
      sources: structured.sources || [],
      actions: structured.actions || [],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return {
      answer: response,
      confidence: 0.5,
      highlights: [],
      sources: [],
      actions: [],
    };
  }
}

/**
 * Generate follow-up prompts based on response
 * 
 * @param {string} query - Original query
 * @param {object} response - AI response
 * @returns {string[]} Suggested follow-up queries
 */
export function generateFollowUpQueries(query, response) {
  const suggestions = [];
  const queryLower = query.toLowerCase();

  if (queryLower.includes('score') && response.sources.some(s => s.includes('kpi'))) {
    suggestions.push('Show me the trend for this KPI over time');
    suggestions.push('Compare this with other divisions');
  }

  if (queryLower.includes('project') && response.sources.some(s => s.includes('proj'))) {
    suggestions.push('What are the upcoming milestones?');
    suggestions.push('Who is on this project team?');
  }

  if (queryLower.includes('evidence')) {
    suggestions.push('Show me pending evidence submissions');
    suggestions.push('Generate evidence summary report');
  }

  // Generic follow-ups
  if (suggestions.length < 2) {
    suggestions.push('Show me more details');
    suggestions.push('Export this data');
  }

  return suggestions.slice(0, 3);
}

/**
 * Validate AI response for safety
 * 
 * @param {object} response - Parsed AI response
 * @returns {object} Validation result
 */
export function validateResponse(response) {
  const issues = [];

  // Check for fabricated sources
  if (response.sources && response.sources.length > 0) {
    response.sources.forEach((sourceId) => {
      if (!sourceId || typeof sourceId !== 'string') {
        issues.push({
          type: 'invalid-source',
          message: `Invalid source ID: ${sourceId}`,
        });
      }
    });
  }

  // Check for empty answer
  if (!response.answer || response.answer.trim().length === 0) {
    issues.push({
      type: 'empty-answer',
      message: 'Response has no answer text',
    });
  }

  // Check for answer length
  const wordCount = response.answer.split(/\s+/).length;
  if (wordCount > 120) {
    issues.push({
      type: 'answer-too-long',
      message: `Answer is ${wordCount} words (max 80 recommended)`,
    });
  }

  // Check confidence score
  if (response.confidence < 0 || response.confidence > 1) {
    issues.push({
      type: 'invalid-confidence',
      message: `Confidence score out of range: ${response.confidence}`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Format uncertainty response
 * 
 * @param {string} query - Original query
 * @param {string} reason - Reason for uncertainty
 * @returns {string} Formatted uncertainty response
 */
export function formatUncertaintyResponse(query, reason) {
  return `I don't have enough information to answer "${query}" with confidence.

**Reason:** ${reason}

**How to verify:**
1. Check the Project Dashboard for real-time data
2. Review recent evidence submissions in the Evidence Upload section
3. Consult with your division administrator

**What I can help with:**
- Current KPI scores and trends
- Project status and progress tracking
- Evidence submission history
- Team performance comparisons

\`\`\`json
{
  "sources": [],
  "actions": [
    {"type": "drill", "label": "Go to Dashboard", "target": "/app/dashboard"}
  ],
  "confidence": 0.0
}
\`\`\``;
}

/**
 * Example prompts for testing
 */
export const EXAMPLE_QUERIES = [
  'What is the current score for HQ Operations?',
  'Which projects are behind schedule?',
  'Show me evidence submitted last week',
  'Compare Team Alpha vs Team Beta performance',
  'What are the top 3 risks in our division?',
  'Who has the highest individual behavior score?',
  'When is the next project milestone due?',
  'How many evidence items are pending approval?',
];
