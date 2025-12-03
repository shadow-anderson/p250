/**
 * Retrieval Utility - Simple semantic search for RAG
 * 
 * Provides context retrieval for AI queries using keyword matching
 * and basic semantic similarity. In production, replace with:
 * - Vector embeddings (OpenAI, Cohere, etc.)
 * - Vector database (Pinecone, Weaviate, Chroma)
 * - Hybrid search (keyword + semantic)
 */

/**
 * Calculate similarity score between query and item
 * Uses simple keyword matching and TF-IDF-like scoring
 * 
 * @param {string} query - User query
 * @param {object} item - Data item (KPI, project, evidence)
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(query, item) {
  const queryTokens = tokenize(query);
  const itemText = getItemText(item);
  const itemTokens = tokenize(itemText);

  if (queryTokens.length === 0 || itemTokens.length === 0) {
    return 0;
  }

  // Calculate intersection
  const intersection = queryTokens.filter((token) =>
    itemTokens.includes(token)
  ).length;

  // Calculate Jaccard similarity
  const union = new Set([...queryTokens, ...itemTokens]).size;
  const jaccardScore = intersection / union;

  // Boost score for exact matches
  let boostScore = 0;
  if (itemText.toLowerCase().includes(query.toLowerCase())) {
    boostScore = 0.3;
  }

  // Boost score for title/name matches
  if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) {
    boostScore += 0.2;
  }
  if (item.title && item.title.toLowerCase().includes(query.toLowerCase())) {
    boostScore += 0.2;
  }

  return Math.min(jaccardScore + boostScore, 1.0);
}

/**
 * Tokenize text into normalized tokens
 * 
 * @param {string} text - Text to tokenize
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter((token) => token.length > 2) // Remove short tokens
    .filter((token) => !STOP_WORDS.has(token)); // Remove stop words
}

/**
 * Stop words for filtering
 */
const STOP_WORDS = new Set([
  'the',
  'is',
  'at',
  'which',
  'on',
  'a',
  'an',
  'as',
  'are',
  'was',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'must',
  'can',
  'of',
  'to',
  'for',
  'with',
  'in',
  'by',
  'from',
  'this',
  'that',
  'these',
  'those',
  'what',
  'show',
  'tell',
  'get',
  'give',
]);

/**
 * Get searchable text from item
 * 
 * @param {object} item - Data item
 * @returns {string} Searchable text
 */
function getItemText(item) {
  const parts = [];

  // Add all relevant fields
  if (item.name) parts.push(item.name);
  if (item.title) parts.push(item.title);
  if (item.category) parts.push(item.category);
  if (item.description) parts.push(item.description);
  if (item.snippet) parts.push(item.snippet);
  if (item.status) parts.push(item.status);
  if (item.team) parts.push(item.team);
  if (item.division) parts.push(item.division);
  if (item.type) parts.push(item.type);

  return parts.join(' ');
}

/**
 * Retrieve relevant context for query
 * Main function for RAG (Retrieval-Augmented Generation)
 * 
 * @param {string} query - User query
 * @param {object} data - Data object with kpis, projects, evidence
 * @param {object} options - Retrieval options
 * @returns {object[]} Array of relevant items with scores
 */
export function retrieveContext(query, data, options = {}) {
  const {
    maxResults = 3,
    minScore = 0.3,
    types = ['kpi', 'project', 'evidence'], // Types to search
  } = options;

  const results = [];

  // Search KPIs
  if (types.includes('kpi') && data.kpis) {
    data.kpis.forEach((kpi) => {
      const score = calculateSimilarity(query, kpi);
      if (score >= minScore) {
        results.push({
          ...kpi,
          type: 'kpi',
          score,
        });
      }
    });
  }

  // Search Projects
  if (types.includes('project') && data.projects) {
    data.projects.forEach((project) => {
      const score = calculateSimilarity(query, project);
      if (score >= minScore) {
        results.push({
          ...project,
          type: 'project',
          score,
        });
      }
    });
  }

  // Search Evidence
  if (types.includes('evidence') && data.evidence) {
    data.evidence.forEach((evidence) => {
      const score = calculateSimilarity(query, evidence);
      if (score >= minScore) {
        results.push({
          ...evidence,
          type: 'evidence',
          score,
        });
      }
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top results
  return results.slice(0, maxResults);
}

/**
 * Filter context by constraints
 * 
 * @param {object[]} context - Retrieved context items
 * @param {object} constraints - Filter constraints
 * @returns {object[]} Filtered context
 */
export function filterContext(context, constraints = {}) {
  let filtered = [...context];

  if (constraints.division) {
    filtered = filtered.filter(
      (item) =>
        item.division &&
        item.division.toLowerCase() === constraints.division.toLowerCase()
    );
  }

  if (constraints.status) {
    filtered = filtered.filter(
      (item) =>
        item.status &&
        item.status.toLowerCase() === constraints.status.toLowerCase()
    );
  }

  if (constraints.dateRange) {
    const { start, end } = constraints.dateRange;
    filtered = filtered.filter((item) => {
      const itemDate = new Date(
        item.lastUpdated || item.submittedAt || item.deadline
      );
      return (
        (!start || itemDate >= new Date(start)) &&
        (!end || itemDate <= new Date(end))
      );
    });
  }

  return filtered;
}

/**
 * Expand query with synonyms and related terms
 * 
 * @param {string} query - Original query
 * @returns {string[]} Expanded query terms
 */
export function expandQuery(query) {
  const terms = [query];
  const queryLower = query.toLowerCase();

  // Synonym mapping
  const synonyms = {
    score: ['performance', 'rating', 'result', 'achievement'],
    project: ['initiative', 'program', 'work', 'task'],
    evidence: ['document', 'proof', 'submission', 'report'],
    team: ['group', 'squad', 'unit', 'crew'],
    behind: ['delayed', 'late', 'overdue', 'at-risk'],
    good: ['high', 'excellent', 'strong', 'positive'],
    bad: ['low', 'poor', 'weak', 'negative'],
  };

  Object.entries(synonyms).forEach(([word, syns]) => {
    if (queryLower.includes(word)) {
      terms.push(...syns);
    }
  });

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Rerank results using additional signals
 * 
 * @param {object[]} results - Initial results
 * @param {object} signals - Additional ranking signals
 * @returns {object[]} Reranked results
 */
export function rerank(results, signals = {}) {
  return results.map((result) => {
    let boost = 0;

    // Boost recent items
    if (result.lastUpdated || result.submittedAt) {
      const date = new Date(result.lastUpdated || result.submittedAt);
      const daysSince = (Date.now() - date) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) boost += 0.1;
      if (daysSince < 30) boost += 0.05;
    }

    // Boost items from user's context
    if (signals.userDivision && result.division === signals.userDivision) {
      boost += 0.15;
    }

    // Boost high-importance items
    if (result.status === 'at-risk' || result.status === 'critical') {
      boost += 0.1;
    }

    // Boost items with high scores/progress
    if (result.currentScore && result.currentScore >= 90) {
      boost += 0.05;
    }
    if (result.progress && result.progress >= 90) {
      boost += 0.05;
    }

    return {
      ...result,
      score: Math.min(result.score + boost, 1.0),
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Generate context snippets for display
 * 
 * @param {object} item - Context item
 * @param {string} query - Original query
 * @returns {string} Context snippet
 */
export function generateSnippet(item, query) {
  const text = getItemText(item);
  const queryTokens = tokenize(query);

  // Find best matching sentence
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let bestSentence = sentences[0] || text.substring(0, 100);
  let maxMatches = 0;

  sentences.forEach((sentence) => {
    const sentenceTokens = tokenize(sentence);
    const matches = queryTokens.filter((token) =>
      sentenceTokens.includes(token)
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestSentence = sentence;
    }
  });

  // Truncate and add ellipsis
  if (bestSentence.length > 150) {
    bestSentence = bestSentence.substring(0, 147) + '...';
  }

  return bestSentence.trim();
}
