// ═══════════════════════════════════════════════════════════
// UrbanPulse Scoring Engine
// Realistic weighted-additive scoring for urban area analysis
// ═══════════════════════════════════════════════════════════

// Category weights (must sum to ~1.0)
const CATEGORY_WEIGHTS = {
  hospital:     0.18,
  school:       0.14,
  park:         0.10,
  pharmacy:     0.08,
  police:       0.07,
  fire_station: 0.07,
  mosque:       0.05,
  bank:         0.05,
  mall:         0.05,
  university:   0.05,
};

const ROAD_WEIGHT = 0.08;
const DIVERSITY_WEIGHT = 0.08;

// Distance thresholds (in km) — same as analysisService
const THRESHOLDS = {
  hospital:     { ideal: 2,   acceptable: 5,   critical: 8 },
  school:       { ideal: 1,   acceptable: 3,   critical: 5 },
  university:   { ideal: 3,   acceptable: 8,   critical: 15 },
  park:         { ideal: 0.5, acceptable: 2,   critical: 4 },
  pharmacy:     { ideal: 0.5, acceptable: 1.5, critical: 3 },
  police:       { ideal: 2,   acceptable: 5,   critical: 10 },
  fire_station: { ideal: 3,   acceptable: 6,   critical: 10 },
  mosque:       { ideal: 0.5, acceptable: 1,   critical: 2 },
  bank:         { ideal: 1,   acceptable: 3,   critical: 5 },
  mall:         { ideal: 2,   acceptable: 5,   critical: 10 },
};

// Essential services — missing any of these adds a hard penalty
const ESSENTIAL_SERVICES = ['hospital', 'school', 'park'];

// ─────────────────────────────────────────────────────────
// Calculate score for a single category (0–100)
// ─────────────────────────────────────────────────────────
export function calculateCategoryScore(nearest, count, threshold) {
  if (count === 0 || nearest === null || nearest === undefined) {
    return 0;
  }

  let distanceScore;
  if (nearest <= threshold.ideal) {
    // Excellent: 82–95 range (with slight variation based on exact distance)
    const ratio = nearest / threshold.ideal;
    distanceScore = 95 - (ratio * 13); // 95 at 0 distance, 82 at ideal
  } else if (nearest <= threshold.acceptable) {
    // Good: 55–81 range
    const ratio = (nearest - threshold.ideal) / (threshold.acceptable - threshold.ideal);
    distanceScore = 81 - (ratio * 26);
  } else if (nearest <= threshold.critical) {
    // Poor: 20–54 range
    const ratio = (nearest - threshold.acceptable) / (threshold.critical - threshold.acceptable);
    distanceScore = 54 - (ratio * 34);
  } else {
    // Critical: 0–19 range
    const overshoot = (nearest - threshold.critical) / threshold.critical;
    distanceScore = Math.max(0, 19 - (overshoot * 19));
  }

  // Count bonus: more facilities = slightly better coverage
  let countBonus = 0;
  if (count >= 2) countBonus += 3;
  if (count >= 4) countBonus += 2;
  if (count >= 6) countBonus += 1;
  // Cap count bonus at +6
  countBonus = Math.min(countBonus, 6);

  // Clustering penalty: too many of the same type very close = diminishing returns
  // This is handled externally, but we cap the benefit
  const totalScore = Math.min(97, distanceScore + countBonus);

  return Math.round(Math.max(0, totalScore));
}

// ─────────────────────────────────────────────────────────
// Calculate diversity index (0–100)
// How many distinct categories are present?
// ─────────────────────────────────────────────────────────
export function calculateDiversityIndex(coverage) {
  const totalCategories = Object.keys(THRESHOLDS).length;
  const presentCategories = Object.values(coverage).filter(
    (c) => c.count > 0
  ).length;

  if (totalCategories === 0) return 0;
  const ratio = presentCategories / totalCategories;

  // Non-linear: having 60% of categories is decent, but only 30% is poor
  if (ratio >= 0.8) return 85 + (ratio - 0.8) * 50; // 85-95
  if (ratio >= 0.6) return 65 + ((ratio - 0.6) / 0.2) * 20; // 65-85
  if (ratio >= 0.4) return 40 + ((ratio - 0.4) / 0.2) * 25; // 40-65
  return ratio * 100; // 0-40
}

// ─────────────────────────────────────────────────────────
// Calculate road connectivity score (0–100)
// ─────────────────────────────────────────────────────────
export function calculateRoadScore(roadCount, areaKm2) {
  if (roadCount === 0) return 5; // Not zero — even remote areas have some access
  if (!areaKm2 || areaKm2 === 0) areaKm2 = Math.PI * 5 * 5; // default 5km radius

  const roadsPerKm2 = roadCount / areaKm2;

  // Urban areas typically have 10-30+ roads per km²
  if (roadsPerKm2 >= 15) return 90;
  if (roadsPerKm2 >= 8) return 70 + ((roadsPerKm2 - 8) / 7) * 20;
  if (roadsPerKm2 >= 3) return 45 + ((roadsPerKm2 - 3) / 5) * 25;
  if (roadsPerKm2 >= 1) return 20 + ((roadsPerKm2 - 1) / 2) * 25;
  return Math.max(5, roadsPerKm2 * 20);
}

// ─────────────────────────────────────────────────────────
// Apply penalties to scores
// ─────────────────────────────────────────────────────────
export function applyPenalties(baseScore, coverage) {
  let penalty = 0;
  const penaltyReasons = [];

  // Missing essential services
  for (const svc of ESSENTIAL_SERVICES) {
    const cov = coverage[svc];
    if (!cov || cov.count === 0) {
      penalty += 8;
      penaltyReasons.push({
        reason: `No ${svc} found in the area`,
        points: 8,
        severity: 'critical',
      });
    }
  }

  // Check for overcrowding (too many same-type in very small area)
  for (const [type, cov] of Object.entries(coverage)) {
    if (cov.count >= 8 && cov.nearest !== null && cov.nearest < 0.3) {
      penalty += 3;
      penaltyReasons.push({
        reason: `Over-concentration of ${type} facilities`,
        points: 3,
        severity: 'info',
      });
    }
  }

  // Apply smoothing noise for realistic feel (+/- 2 points)
  const noise = (hashCode(JSON.stringify(coverage)) % 5) - 2;
  const finalScore = Math.max(0, Math.min(95, baseScore - penalty + noise));

  return {
    score: Math.round(finalScore),
    penalties: penaltyReasons,
  };
}

// ─────────────────────────────────────────────────────────
// Calculate overall score from coverage data
// ─────────────────────────────────────────────────────────
export function calculateOverallScore(coverage, roadCount, areaKm2) {
  let weightedSum = 0;
  let totalWeight = 0;

  // Category scores
  for (const [type, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const cov = coverage[type];
    if (cov) {
      const catScore = calculateCategoryScore(
        cov.nearest, cov.count, THRESHOLDS[type]
      );
      cov.score = catScore; // attach score to coverage data
      weightedSum += catScore * weight;
      totalWeight += weight;
    }
  }

  // Road score
  const roadScore = calculateRoadScore(roadCount || 0, areaKm2);
  weightedSum += roadScore * ROAD_WEIGHT;
  totalWeight += ROAD_WEIGHT;

  // Diversity score
  const diversityScore = calculateDiversityIndex(coverage);
  weightedSum += diversityScore * DIVERSITY_WEIGHT;
  totalWeight += DIVERSITY_WEIGHT;

  // Normalize to 0–100
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Apply penalties
  const { score, penalties } = applyPenalties(rawScore, coverage);

  return {
    score,
    rawScore: Math.round(rawScore),
    roadScore: Math.round(roadScore),
    diversityScore: Math.round(diversityScore),
    penalties,
  };
}

// ─────────────────────────────────────────────────────────
// Generate human-readable rating
// ─────────────────────────────────────────────────────────
export function getRating(score) {
  if (score >= 80) return 'Excellent Urban Planning';
  if (score >= 65) return 'Good Coverage';
  if (score >= 50) return 'Moderate — Room for Improvement';
  if (score >= 35) return 'Below Average — Significant Gaps';
  if (score >= 20) return 'Poor — Major Infrastructure Deficit';
  return 'Critical — Minimal Infrastructure';
}

// ─────────────────────────────────────────────────────────
// Generate strengths (top performing categories)
// ─────────────────────────────────────────────────────────
export function generateStrengths(coverage) {
  const strengths = [];
  const sorted = Object.entries(coverage)
    .filter(([, cov]) => cov.score !== undefined && cov.score >= 55)
    .sort((a, b) => b[1].score - a[1].score);

  for (const [type, cov] of sorted.slice(0, 4)) {
    const label = formatTypeName(type);
    if (cov.score >= 80) {
      strengths.push({
        type,
        message: `Excellent ${label} coverage — ${cov.count} facilities, nearest at ${cov.nearest?.toFixed(1) || '?'}km`,
        score: cov.score,
        icon: getTypeIcon(type),
      });
    } else if (cov.score >= 55) {
      strengths.push({
        type,
        message: `Good ${label} access — ${cov.count} found within search radius`,
        score: cov.score,
        icon: getTypeIcon(type),
      });
    }
  }

  return strengths;
}

// ─────────────────────────────────────────────────────────
// Generate weaknesses (worst performing categories)
// ─────────────────────────────────────────────────────────
export function generateWeaknesses(coverage) {
  const weaknesses = [];
  const sorted = Object.entries(coverage)
    .filter(([, cov]) => cov.score !== undefined)
    .sort((a, b) => a[1].score - b[1].score);

  for (const [type, cov] of sorted.slice(0, 4)) {
    const label = formatTypeName(type);
    if (cov.count === 0) {
      weaknesses.push({
        type,
        message: `No ${label} found — critical gap in infrastructure`,
        score: 0,
        severity: 'critical',
        icon: getTypeIcon(type),
      });
    } else if (cov.score < 35) {
      weaknesses.push({
        type,
        message: `${label} coverage is poor — nearest is ${cov.nearest?.toFixed(1) || '?'}km away`,
        score: cov.score,
        severity: 'warning',
        icon: getTypeIcon(type),
      });
    } else if (cov.score < 55) {
      weaknesses.push({
        type,
        message: `${label} access is below average — consider adding more facilities`,
        score: cov.score,
        severity: 'info',
        icon: getTypeIcon(type),
      });
    }
  }

  return weaknesses.filter((w) => w.score < 55);
}

// ─────────────────────────────────────────────────────────
// Generate actionable recommendations
// ─────────────────────────────────────────────────────────
export function generateRecommendations(coverage, gaps, score) {
  const recommendations = [];

  // Priority 1: Missing essential services
  for (const svc of ESSENTIAL_SERVICES) {
    const cov = coverage[svc];
    if (!cov || cov.count === 0) {
      recommendations.push({
        priority: 'critical',
        category: svc,
        message: `Add ${formatTypeName(svc)} facilities — this is essential infrastructure with zero coverage`,
        icon: getTypeIcon(svc),
      });
    }
  }

  // Priority 2: Poor coverage services
  for (const [type, cov] of Object.entries(coverage)) {
    if (cov.score !== undefined && cov.score > 0 && cov.score < 35 && cov.count > 0) {
      recommendations.push({
        priority: 'high',
        category: type,
        message: `Improve ${formatTypeName(type)} access — nearest is ${cov.nearest?.toFixed(1)}km away, ideally should be within ${THRESHOLDS[type]?.acceptable || 3}km`,
        icon: getTypeIcon(type),
      });
    }
  }

  // Priority 3: Moderate coverage improvements
  for (const [type, cov] of Object.entries(coverage)) {
    if (cov.score !== undefined && cov.score >= 35 && cov.score < 55) {
      recommendations.push({
        priority: 'medium',
        category: type,
        message: `Consider adding more ${formatTypeName(type)} facilities to improve coverage from ${cov.score}/100`,
        icon: getTypeIcon(type),
      });
    }
  }

  // Priority 4: General recommendations based on overall score
  if (score < 40) {
    recommendations.push({
      priority: 'high',
      category: 'general',
      message: 'This area needs significant infrastructure investment across multiple categories',
      icon: '🏗️',
    });
  }

  if (score >= 70) {
    recommendations.push({
      priority: 'low',
      category: 'general',
      message: 'Maintain current infrastructure and plan for population growth',
      icon: '📈',
    });
  }

  return recommendations;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatTypeName(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTypeIcon(type) {
  const icons = {
    hospital: '🏥', clinic: '🏥', school: '🏫', university: '🎓',
    park: '🌳', playground: '🎡', mosque: '🕌', religious: '⛪',
    police: '🚔', fire_station: '🚒', pharmacy: '💊', bank: '🏦',
    mall: '🛍️', government: '🏛️', general: '📋', other: '📍',
  };
  return icons[type] || '📍';
}

// Simple deterministic hash for reproducible noise
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export { THRESHOLDS, CATEGORY_WEIGHTS, ESSENTIAL_SERVICES };

export default {
  calculateCategoryScore,
  calculateDiversityIndex,
  calculateRoadScore,
  calculateOverallScore,
  applyPenalties,
  getRating,
  generateStrengths,
  generateWeaknesses,
  generateRecommendations,
  THRESHOLDS,
};
