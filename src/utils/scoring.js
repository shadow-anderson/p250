/**
 * Scoring Utilities for Employee Performance Calculation
 * 
 * This module implements the weighted KPI scoring algorithm that computes
 * an employee's overall performance score based on multiple KPI categories.
 * 
 * Reference: Individual Behaviour KPIs (behavioral rubric 0-3 scaled to 30 points)
 * 
 * KPI Categories and Weights:
 * - HQ Operations: Administrative, compliance, documentation
 * - Field Operations: On-site activities, project execution
 * - Team Collaboration: Peer support, knowledge sharing
 * - Individual Behavior: Professionalism, initiative, quality (0-3 rubric)
 */

/**
 * Individual Behavior KPI Rubric Mapping
 * Based on qualitative assessment scale: 0 (Poor) to 3 (Excellent)
 * 
 * Each behavioral KPI is scored 0-3 and scaled to contribute up to 30 points total
 * 
 * Behavioral KPIs:
 * 1. Professionalism & Ethics (0-3)
 * 2. Initiative & Proactiveness (0-3)
 * 3. Quality of Work (0-3)
 * 4. Attendance & Punctuality (0-3)
 * 5. Communication Skills (0-3)
 * 
 * Scoring Rubric:
 * 0 = Needs Significant Improvement (0-25% effectiveness)
 * 1 = Meets Minimum Standards (26-50% effectiveness)
 * 2 = Meets Expectations (51-75% effectiveness)
 * 3 = Exceeds Expectations (76-100% effectiveness)
 * 
 * Conversion: Raw score (0-15 max) * 2 = Final score (0-30 max)
 */
const BEHAVIORAL_KPI_MAX_SCORE = 30;
const BEHAVIORAL_KPI_MAX_RAW = 15; // 5 KPIs * 3 points each

/**
 * Default Weight Distribution
 * Total weights should sum to 100%
 */
export const DEFAULT_WEIGHTS = {
  hq_operations: 0.25,        // 25% weight
  field_operations: 0.30,     // 30% weight
  team_collaboration: 0.15,   // 15% weight
  individual_behavior: 0.30,  // 30% weight (behavioral rubric)
};

/**
 * KPI Interface (TypeScript-style JSDoc)
 * @typedef {Object} KPI
 * @property {string} id - Unique identifier
 * @property {string} name - KPI name
 * @property {number} value - Current value (0-100)
 * @property {number} target - Target value
 * @property {string} category - Category: 'hq_operations' | 'field_operations' | 'team_collaboration' | 'individual_behavior'
 * @property {number} [weight] - Optional individual weight within category
 */

/**
 * Weight Configuration Interface
 * @typedef {Object} Weight
 * @property {string} category - Category name
 * @property {number} weight - Weight value (0-1)
 * @property {string} version - Weight version (e.g., 'v2.1')
 */

/**
 * Compute Employee Performance Score
 * 
 * Calculates a weighted composite score from multiple KPIs across different categories.
 * 
 * Algorithm:
 * 1. Group KPIs by category
 * 2. Calculate average score per category
 * 3. Apply category weights
 * 4. Special handling for behavioral KPIs (0-3 rubric scaled to 30 points)
 * 5. Sum weighted category scores
 * 
 * @param {KPI[]} kpis - Array of KPI objects with values and categories
 * @param {Weight[]} [weights] - Optional weight configuration (uses defaults if not provided)
 * @returns {number} Composite score (0-100)
 * 
 * @example
 * const kpis = [
 *   { id: 'KPI-1', name: 'Budget Compliance', value: 85, target: 90, category: 'hq_operations' },
 *   { id: 'KPI-2', name: 'Field Productivity', value: 78, target: 80, category: 'field_operations' },
 *   { id: 'KPI-3', name: 'Professionalism', value: 2.5, target: 3, category: 'individual_behavior' }
 * ];
 * const score = computeScore(kpis); // Returns weighted composite score
 */
export function computeScore(kpis = [], weights = null) {
  // Edge case: Empty KPI array
  if (!kpis || kpis.length === 0) {
    return 0;
  }

  // Use provided weights or defaults
  const categoryWeights = weights 
    ? convertWeightsToMap(weights) 
    : DEFAULT_WEIGHTS;

  // Group KPIs by category
  const categoryGroups = groupKPIsByCategory(kpis);

  let totalScore = 0;
  let appliedWeight = 0;

  // Calculate weighted score for each category
  Object.keys(categoryGroups).forEach((category) => {
    const categoryKPIs = categoryGroups[category];
    const weight = categoryWeights[category] || 0;

    if (categoryKPIs.length === 0 || weight === 0) {
      return; // Skip empty categories
    }

    let categoryScore;

    // Special handling for behavioral KPIs
    if (category === 'individual_behavior') {
      categoryScore = computeBehavioralScore(categoryKPIs);
    } else {
      categoryScore = computeCategoryAverage(categoryKPIs);
    }

    totalScore += categoryScore * weight;
    appliedWeight += weight;
  });

  // Normalize score if not all categories are present
  if (appliedWeight < 1.0 && appliedWeight > 0) {
    totalScore = totalScore / appliedWeight;
  }

  // Ensure score is within bounds [0, 100]
  return Math.max(0, Math.min(100, totalScore));
}

/**
 * Group KPIs by Category
 * 
 * @param {KPI[]} kpis - Array of KPIs
 * @returns {Object.<string, KPI[]>} KPIs grouped by category
 */
function groupKPIsByCategory(kpis) {
  return kpis.reduce((groups, kpi) => {
    const category = kpi.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(kpi);
    return groups;
  }, {});
}

/**
 * Compute Category Average Score
 * 
 * Calculates the average value of all KPIs in a category,
 * optionally applying individual KPI weights.
 * 
 * @param {KPI[]} kpis - KPIs in the category
 * @returns {number} Average score (0-100)
 */
function computeCategoryAverage(kpis) {
  if (kpis.length === 0) return 0;

  // Check if KPIs have individual weights
  const hasWeights = kpis.some((kpi) => kpi.weight !== undefined);

  if (hasWeights) {
    // Weighted average
    let totalWeightedValue = 0;
    let totalWeight = 0;

    kpis.forEach((kpi) => {
      const weight = kpi.weight || 1;
      totalWeightedValue += kpi.value * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
  } else {
    // Simple average
    const sum = kpis.reduce((acc, kpi) => acc + kpi.value, 0);
    return sum / kpis.length;
  }
}

/**
 * Compute Behavioral Score from Rubric (0-3 scale)
 * 
 * Behavioral KPIs use a qualitative rubric (0-3) instead of percentage.
 * This function converts the 0-3 scores to a 0-100 scale for final scoring.
 * 
 * Reference Behavioral KPIs:
 * - Professionalism & Ethics: Adherence to code of conduct, integrity
 * - Initiative & Proactiveness: Self-motivation, problem-solving
 * - Quality of Work: Attention to detail, accuracy
 * - Attendance & Punctuality: Reliability, time management
 * - Communication Skills: Clarity, responsiveness, collaboration
 * 
 * @param {KPI[]} behavioralKPIs - KPIs with 0-3 rubric values
 * @returns {number} Scaled score (0-100)
 * 
 * @example
 * // 5 behavioral KPIs with scores: [3, 2, 3, 2, 3] = 13 points
 * // Scaled: (13 / 15) * 100 = 86.67
 */
function computeBehavioralScore(behavioralKPIs) {
  if (behavioralKPIs.length === 0) return 0;

  // Sum raw rubric scores (0-3 per KPI)
  const totalRawScore = behavioralKPIs.reduce((sum, kpi) => sum + kpi.value, 0);

  // Maximum possible raw score (3 points per KPI)
  const maxRawScore = behavioralKPIs.length * 3;

  // Convert to 0-100 scale
  const percentage = (totalRawScore / maxRawScore) * 100;

  return Math.max(0, Math.min(100, percentage));
}

/**
 * Convert Weight Array to Map
 * 
 * @param {Weight[]} weights - Array of weight configurations
 * @returns {Object.<string, number>} Category to weight mapping
 */
function convertWeightsToMap(weights) {
  return weights.reduce((map, w) => {
    map[w.category] = w.weight;
    return map;
  }, {});
}

/**
 * Compute Score Breakdown by Category
 * 
 * Returns detailed breakdown of scores for each category,
 * useful for displaying scorecard details.
 * 
 * @param {KPI[]} kpis - Array of KPIs
 * @param {Weight[]} [weights] - Optional weights
 * @returns {Object} Breakdown with category scores and contributions
 * 
 * @example
 * const breakdown = computeScoreBreakdown(kpis);
 * // {
 * //   hq_operations: { score: 85, weight: 0.25, contribution: 21.25 },
 * //   field_operations: { score: 78, weight: 0.30, contribution: 23.4 },
 * //   ...
 * // }
 */
export function computeScoreBreakdown(kpis = [], weights = null) {
  if (!kpis || kpis.length === 0) {
    return {};
  }

  const categoryWeights = weights 
    ? convertWeightsToMap(weights) 
    : DEFAULT_WEIGHTS;

  const categoryGroups = groupKPIsByCategory(kpis);
  const breakdown = {};

  Object.keys(categoryGroups).forEach((category) => {
    const categoryKPIs = categoryGroups[category];
    const weight = categoryWeights[category] || 0;

    let categoryScore;
    if (category === 'individual_behavior') {
      categoryScore = computeBehavioralScore(categoryKPIs);
    } else {
      categoryScore = computeCategoryAverage(categoryKPIs);
    }

    breakdown[category] = {
      score: Math.round(categoryScore * 10) / 10, // Round to 1 decimal
      weight,
      contribution: Math.round(categoryScore * weight * 10) / 10,
      kpiCount: categoryKPIs.length,
    };
  });

  return breakdown;
}

/**
 * Validate KPI Data
 * 
 * Checks if KPI array is valid for scoring.
 * 
 * @param {KPI[]} kpis - KPIs to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateKPIs(kpis) {
  const errors = [];

  if (!Array.isArray(kpis)) {
    return { valid: false, errors: ['KPIs must be an array'] };
  }

  if (kpis.length === 0) {
    return { valid: false, errors: ['KPI array is empty'] };
  }

  kpis.forEach((kpi, index) => {
    if (typeof kpi.value !== 'number' || isNaN(kpi.value)) {
      errors.push(`KPI at index ${index} has invalid value`);
    }
    if (!kpi.category) {
      errors.push(`KPI at index ${index} missing category`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
