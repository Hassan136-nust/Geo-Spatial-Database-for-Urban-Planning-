// ═══════════════════════════════════════════════════════════
// Urban Planning Analysis Engine (v2.0)
// Realistic weighted scoring + intelligent planner validation
// ═══════════════════════════════════════════════════════════

import {
  THRESHOLDS,
  calculateOverallScore,
  getRating,
  generateStrengths,
  generateWeaknesses,
  generateRecommendations,
} from './scoringEngine.js';

// ─────────────────────────────────────────────────────────
// Planner Layout Evaluation (drag & drop)
// Smart rule-based analysis for user-placed elements
// ─────────────────────────────────────────────────────────
export function evaluateLayout(elements, centerLat, centerLng, evalRadius = 5) {
  const houses = elements.filter((e) => e.type === 'house' || e.type === 'residential');
  const hospitals = elements.filter((e) => e.type === 'hospital');
  const schools = elements.filter((e) => e.type === 'school');
  const parks = elements.filter((e) => e.type === 'park');
  const roads = elements.filter((e) => e.type === 'road');
  const mosques = elements.filter((e) => e.type === 'mosque');
  const malls = elements.filter((e) => e.type === 'mall');
  const police = elements.filter((e) => e.type === 'police');
  const industrial = elements.filter((e) => e.type === 'industrial');

  const recommendations = [];
  const strengths = [];
  const weaknesses = [];

  const scale = Math.max(1, evalRadius / 5);
  const T = {
    hospital: { ideal: THRESHOLDS.hospital.ideal * scale, acceptable: THRESHOLDS.hospital.acceptable * scale, critical: THRESHOLDS.hospital.critical * scale },
    school: { ideal: THRESHOLDS.school.ideal * scale, acceptable: THRESHOLDS.school.acceptable * scale, critical: THRESHOLDS.school.critical * scale },
    park: { ideal: THRESHOLDS.park.ideal * scale, acceptable: THRESHOLDS.park.acceptable * scale, critical: THRESHOLDS.park.critical * scale },
  };

  // ── Score calculation: additive model ──
  let score = 0;
  let maxPossible = 0;

  // ── Category: Healthcare (25 pts) ──
  maxPossible += 25;
  if (hospitals.length === 0 && houses.length > 0) {
    recommendations.push({
      severity: 'critical',
      category: 'healthcare',
      message: 'No hospital placed! Every residential area needs at least one hospital within 5km.',
      icon: '🏥',
    });
    weaknesses.push({ type: 'hospital', message: 'No healthcare facility', severity: 'critical', icon: '🏥' });
  } else if (hospitals.length > 0 && houses.length > 0) {
    let healthScore = 0;
    let allWithinIdeal = true;
    let anyBeyondCritical = false;

    houses.forEach((house) => {
      const nearest = findNearest(house, hospitals);
      if (nearest) {
        if (nearest.distance <= T.hospital.ideal) {
          healthScore += 25 / houses.length;
        } else if (nearest.distance <= T.hospital.acceptable) {
          healthScore += (18 / houses.length);
          allWithinIdeal = false;
          recommendations.push({
            severity: 'info',
            category: 'healthcare',
            message: `Hospital is ${nearest.distance.toFixed(1)}km from housing at (${house.lat.toFixed(4)}, ${house.lng.toFixed(4)}). Consider a clinic nearby.`,
            icon: '🏥',
          });
        } else if (nearest.distance <= T.hospital.critical) {
          healthScore += (8 / houses.length);
          allWithinIdeal = false;
          recommendations.push({
            severity: 'warning',
            category: 'healthcare',
            message: `Hospital is ${nearest.distance.toFixed(1)}km from residential area — too far! Should be within ${T.hospital.acceptable.toFixed(1)}km.`,
            icon: '🏥',
          });
        } else {
          anyBeyondCritical = true;
          allWithinIdeal = false;
          recommendations.push({
            severity: 'critical',
            category: 'healthcare',
            message: `Hospital is ${nearest.distance.toFixed(1)}km from residential area — critically far! Must be within ${T.hospital.critical.toFixed(1)}km.`,
            icon: '🏥',
          });
        }
      }
    });

    score += healthScore;
    if (allWithinIdeal && hospitals.length >= 1) {
      strengths.push({ type: 'hospital', message: 'Good hospital placement — all houses within ideal range', icon: '🏥' });
    }
    if (anyBeyondCritical) {
      weaknesses.push({ type: 'hospital', message: 'Hospital too far from some residential areas', severity: 'critical', icon: '🏥' });
    }
  }

  // ── Category: Education (20 pts) ──
  maxPossible += 20;
  if (schools.length === 0 && houses.length > 0) {
    recommendations.push({
      severity: 'critical',
      category: 'education',
      message: 'No school placed! Every residential area needs educational facilities within 3km.',
      icon: '🏫',
    });
    weaknesses.push({ type: 'school', message: 'No educational facility', severity: 'critical', icon: '🏫' });
  } else if (schools.length > 0 && houses.length > 0) {
    let eduScore = 0;
    houses.forEach((house) => {
      const nearest = findNearest(house, schools);
      if (nearest) {
        if (nearest.distance <= T.school.ideal) {
          eduScore += 20 / houses.length;
        } else if (nearest.distance <= T.school.acceptable) {
          eduScore += 14 / houses.length;
        } else if (nearest.distance <= T.school.critical) {
          eduScore += 6 / houses.length;
          recommendations.push({
            severity: 'warning',
            category: 'education',
            message: `School is ${nearest.distance.toFixed(1)}km from residential area. Should be within ${T.school.acceptable.toFixed(1)}km.`,
            icon: '🏫',
          });
        } else {
          recommendations.push({
            severity: 'critical',
            category: 'education',
            message: `School is ${nearest.distance.toFixed(1)}km away — critically far from housing.`,
            icon: '🏫',
          });
        }
      }
    });
    score += eduScore;
    if (eduScore >= 18) {
      strengths.push({ type: 'school', message: 'Schools well-placed near residential areas', icon: '🏫' });
    }
  }

  // ── Category: Green Space (15 pts) ──
  maxPossible += 15;
  if (parks.length === 0 && houses.length > 0) {
    recommendations.push({
      severity: 'warning',
      category: 'recreation',
      message: 'No parks! Add green spaces within 2km of residential areas for quality of life.',
      icon: '🌳',
    });
    weaknesses.push({ type: 'park', message: 'No green space or park', severity: 'warning', icon: '🌳' });
  } else if (parks.length > 0 && houses.length > 0) {
    let parkScore = 0;
    houses.forEach((house) => {
      const nearest = findNearest(house, parks);
      if (nearest) {
        if (nearest.distance <= T.park.ideal) parkScore += 15 / houses.length;
        else if (nearest.distance <= T.park.acceptable) parkScore += 10 / houses.length;
        else if (nearest.distance <= T.park.critical) {
          parkScore += 4 / houses.length;
          recommendations.push({
            severity: 'warning',
            category: 'recreation',
            message: `Nearest park is ${nearest.distance.toFixed(1)}km away. Add a green space within ${T.park.acceptable.toFixed(1)}km.`,
            icon: '🌳',
          });
        }
      }
    });
    score += parkScore;
    if (parkScore >= 13) {
      strengths.push({ type: 'park', message: 'Good park coverage near residential zones', icon: '🌳' });
    }
  }

  // ── Category: Road Connectivity (15 pts) ──
  maxPossible += 15;
  if (roads.length === 0 && elements.length > 2) {
    score += 2; // Minimal base
    recommendations.push({
      severity: 'warning',
      category: 'connectivity',
      message: 'No roads placed! Add road connections between facilities for accessibility.',
      icon: '🛣️',
    });
    weaknesses.push({ type: 'road', message: 'No road infrastructure', severity: 'warning', icon: '🛣️' });
  } else if (roads.length > 0) {
    // Score based on road-to-facility ratio
    const facilityCount = elements.filter((e) => e.type !== 'road').length;
    const roadRatio = Math.min(1, roads.length / Math.max(1, facilityCount * 0.5));
    const roadScore = Math.round(roadRatio * 13 + 2); // 2-15 range
    score += roadScore;
    if (roadScore >= 12) {
      strengths.push({ type: 'road', message: 'Good road connectivity between facilities', icon: '🛣️' });
    }
  }

  // ── Category: Safety & Services (10 pts) ──
  maxPossible += 10;
  let safetyScore = 0;
  if (police.length > 0) safetyScore += 4;
  if (mosques.length > 0) safetyScore += 3;
  if (malls.length > 0) safetyScore += 3;
  score += safetyScore;

  // ── Clustering penalty ──
  const clusterTypes = [
    { items: hospitals, name: 'hospitals', threshold: 1 },
    { items: schools, name: 'schools', threshold: 1 },
    { items: parks, name: 'parks', threshold: 0.5 },
  ];

  clusterTypes.forEach(({ items, name, threshold }) => {
    if (items.length >= 3) {
      const cluster = checkClustering(items, threshold);
      if (cluster.isClustered) {
        score -= 3;
        recommendations.push({
          severity: 'info',
          category: 'density',
          message: `${cluster.clusterSize} ${name} clustered within ${threshold}km. Distribute them for better coverage.`,
          icon: '📊',
        });
      }
    }
  });

  // ── Industrial zone proximity check ──
  if (industrial.length > 0 && houses.length > 0) {
    houses.forEach((house) => {
      const nearestIndustrial = findNearest(house, industrial);
      if (nearestIndustrial && nearestIndustrial.distance < 2) {
        score -= 5;
        recommendations.push({
          severity: 'critical',
          category: 'zoning',
          message: `Industrial zone is only ${nearestIndustrial.distance.toFixed(1)}km from housing! Should be at least 2km away for health and safety.`,
          icon: '🏭',
        });
        weaknesses.push({ type: 'zoning', message: 'Industrial zone too close to housing', severity: 'critical', icon: '🏭' });
      }
    });
  }

  // ── School-Hospital proximity ──
  if (schools.length > 0 && hospitals.length > 0) {
    schools.forEach((school) => {
      const nearest = findNearest(school, hospitals);
      if (nearest && nearest.distance < 0.1) {
        recommendations.push({
          severity: 'info',
          category: 'planning',
          message: 'School and hospital are very close. Consider separating for noise and traffic management.',
          icon: '📋',
        });
      }
    });
  }

  // ── Ratio checks ──
  if (houses.length >= 5 && hospitals.length === 0) {
    recommendations.push({
      severity: 'critical',
      category: 'ratio',
      message: `${houses.length} residential areas with zero hospitals — critical healthcare gap!`,
      icon: '⚠️',
    });
  }
  if (houses.length >= 5 && schools.length === 0) {
    recommendations.push({
      severity: 'critical',
      category: 'ratio',
      message: `${houses.length} residential areas with zero schools — critical education gap!`,
      icon: '⚠️',
    });
  }

  // ── Final score ──
  // Normalize to 0–100 scale from maxPossible, then cap at 95
  const normalizedScore = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;
  const finalScore = Math.max(0, Math.min(95, normalizedScore));

  let overallRating;
  if (finalScore >= 80) overallRating = 'Excellent Planning';
  else if (finalScore >= 65) overallRating = 'Good Layout';
  else if (finalScore >= 50) overallRating = 'Acceptable — Can Improve';
  else if (finalScore >= 35) overallRating = 'Below Average — Issues Found';
  else overallRating = 'Poor Planning — Major Issues';

  // Add positive feedback
  if (finalScore >= 75) {
    recommendations.unshift({
      severity: 'success',
      category: 'overall',
      message: 'Well-planned layout! Infrastructure is distributed with good coverage of residential areas.',
      icon: '✅',
    });
  }

  // Deduplicate similar recommendations
  const uniqueRecs = deduplicateRecs(recommendations);

  return {
    score: finalScore,
    rating: overallRating,
    strengths,
    weaknesses,
    recommendations: uniqueRecs,
    summary: {
      totalElements: elements.length,
      houses: houses.length,
      hospitals: hospitals.length,
      schools: schools.length,
      parks: parks.length,
      roads: roads.length,
      mosques: mosques.length,
      malls: malls.length,
      police: police.length,
      criticalIssues: uniqueRecs.filter((r) => r.severity === 'critical').length,
      warnings: uniqueRecs.filter((r) => r.severity === 'warning').length,
    },
  };
}

// ─────────────────────────────────────────────────────────
// Area Analysis — real-world data from OSM
// Uses the new scoring engine for weighted additive scoring
// ─────────────────────────────────────────────────────────
export function analyzeArea(places, centerLat, centerLng, radiusKm = 5, roadCount = 0) {
  const allTypes = Object.keys(THRESHOLDS);
  const categorized = {};

  allTypes.forEach((t) => {
    categorized[t] = places.filter((p) => p.type === t);
  });

  // Build coverage data
  const coverage = {};
  const gaps = [];

  allTypes.forEach((type) => {
    const items = categorized[type] || [];
    const threshold = THRESHOLDS[type];

    if (items.length === 0) {
      coverage[type] = { status: 'missing', count: 0, nearest: null, score: 0 };
      gaps.push({
        type,
        severity: 'critical',
        message: `No ${formatType(type)} found within ${radiusKm}km radius`,
        count: 0,
      });
    } else {
      const nearestDist = Math.min(...items.map((p) => p.distance || 999));
      let status;
      if (nearestDist <= threshold.ideal) status = 'excellent';
      else if (nearestDist <= threshold.acceptable) status = 'good';
      else if (nearestDist <= threshold.critical) status = 'poor';
      else status = 'critical';

      coverage[type] = {
        status,
        count: items.length,
        nearest: nearestDist,
        items: items.slice(0, 5).map((p) => ({ name: p.name, distance: p.distance })),
      };

      if (status === 'critical' || status === 'poor') {
        gaps.push({
          type,
          severity: status === 'critical' ? 'critical' : 'warning',
          message: `Nearest ${formatType(type)} is ${nearestDist.toFixed(1)}km away (should be within ${threshold.acceptable}km)`,
          count: items.length,
        });
      }
    }
  });

  // Calculate overall score using the scoring engine
  const areaKm2 = Math.PI * radiusKm * radiusKm;
  const scoring = calculateOverallScore(coverage, roadCount, areaKm2);

  const rating = getRating(scoring.score);
  const strengths = generateStrengths(coverage);
  const weaknesses = generateWeaknesses(coverage);
  const recs = generateRecommendations(coverage, gaps, scoring.score);

  return {
    center: { lat: centerLat, lng: centerLng },
    radiusKm,
    score: scoring.score,
    rating,
    totalPlaces: places.length,
    coverage,
    gaps,
    strengths,
    weaknesses,
    recommendations: recs,
    scoring: {
      rawScore: scoring.rawScore,
      roadScore: scoring.roadScore,
      diversityScore: scoring.diversityScore,
      penalties: scoring.penalties,
    },
    density: {
      placesPerSqKm: (places.length / areaKm2).toFixed(2),
    },
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function findNearest(point, targets) {
  if (!targets.length) return null;
  let nearest = null;
  let minDist = Infinity;

  targets.forEach((t) => {
    const dist = haversineDistance(point.lat, point.lng, t.lat, t.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...t, distance: dist };
    }
  });

  return nearest;
}

function checkClustering(items, radiusKm) {
  let maxCluster = 0;
  for (let i = 0; i < items.length; i++) {
    let clusterSize = 0;
    for (let j = 0; j < items.length; j++) {
      if (i !== j) {
        const dist = haversineDistance(items[i].lat, items[i].lng, items[j].lat, items[j].lng);
        if (dist <= radiusKm) clusterSize++;
      }
    }
    maxCluster = Math.max(maxCluster, clusterSize);
  }
  return { isClustered: maxCluster >= 2, clusterSize: maxCluster + 1 };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function deduplicateRecs(recs) {
  const seen = new Set();
  return recs.filter((r) => {
    const key = `${r.category}-${r.severity}-${r.message.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default { evaluateLayout, analyzeArea };
