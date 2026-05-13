/**
 * ============================================================================
 * GEO-SPATIAL DATABASE FOR URBAN PLANNING - DATABASE SCRIPTS
 * ============================================================================
 * 
 * This file contains MongoDB database scripts including:
 * - Aggregation queries
 * - Stored procedures (JavaScript functions)
 * - Triggers (change streams)
 * - Index definitions
 * - Data validation functions
 * - Utility functions
 * 
 * Database: urbanpulse
 * MongoDB Version: 5.0+
 * 
 * @author Urban Planning Team (Hassan Jamal , Warda Rafi , Suleman Asghar)
 
 * @lastUpdated 2026
 * ============================================================================
 */

// ============================================================================
// SECTION 1: INDEX DEFINITIONS
// ============================================================================

/**
 * Create all required indexes for optimal query performance
 * Execute this function during initial setup or migrations
 */
async function createAllIndexes(db) {
  console.log('Creating indexes...');

  // ---------------------------------------------------------------------------
  // USERS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('users').createIndex(
    { email: 1 },
    { unique: true, name: 'email_unique' }
  );
  
  await db.collection('users').createIndex(
    { googleId: 1 },
    { unique: true, sparse: true, name: 'googleId_unique_sparse' }
  );
  
  await db.collection('users').createIndex(
    { role: 1, createdAt: -1 },
    { name: 'role_createdAt_compound' }
  );

  // ---------------------------------------------------------------------------
  // ZONES COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('zones').createIndex(
    { geometry: '2dsphere' },
    { name: 'geometry_2dsphere' }
  );
  
  await db.collection('zones').createIndex(
    { osm_id: 1 },
    { unique: true, sparse: true, partialFilterExpression: { osm_id: { $ne: null } }, name: 'osm_id_unique_sparse' }
  );
  
  await db.collection('zones').createIndex(
    { zone_type: 1, status: 1 },
    { name: 'zone_type_status_compound' }
  );
  
  await db.collection('zones').createIndex(
    { name: 'text', description: 'text' },
    { name: 'zones_text_search' }
  );

  // ---------------------------------------------------------------------------
  // LANDMARKS COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('landmarks').createIndex(
    { geometry: '2dsphere' },
    { name: 'geometry_2dsphere' }
  );
  
  await db.collection('landmarks').createIndex(
    { type: 1, status: 1 },
    { name: 'type_status_compound' }
  );
  
  await db.collection('landmarks').createIndex(
    { city: 1, type: 1 },
    { name: 'city_type_compound' }
  );
  
  await db.collection('landmarks').createIndex(
    { name: 'text', description: 'text', address: 'text' },
    { name: 'landmarks_text_search' }
  );
  
  await db.collection('landmarks').createIndex(
    { osm_id: 1 },
    { sparse: true, name: 'osm_id_sparse' }
  );
  
  await db.collection('landmarks').createIndex(
    { area_id: 1 },
    { name: 'area_id_index' }
  );

  // ---------------------------------------------------------------------------
  // ROADS COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('roads').createIndex(
    { geometry: '2dsphere' },
    { name: 'geometry_2dsphere' }
  );
  
  await db.collection('roads').createIndex(
    { road_type: 1, status: 1 },
    { name: 'road_type_status_compound' }
  );
  
  await db.collection('roads').createIndex(
    { city: 1, road_type: 1 },
    { name: 'city_road_type_compound' }
  );
  
  await db.collection('roads').createIndex(
    { name: 'text' },
    { name: 'roads_text_search' }
  );
  
  await db.collection('roads').createIndex(
    { area_id: 1 },
    { name: 'area_id_index' }
  );

  // ---------------------------------------------------------------------------
  // CITY PROFILES COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('cityprofiles').createIndex(
    { coordinates: '2dsphere' },
    { name: 'coordinates_2dsphere' }
  );
  
  await db.collection('cityprofiles').createIndex(
    { name: 1, country_code: 1 },
    { unique: true, name: 'name_country_unique' }
  );
  
  await db.collection('cityprofiles').createIndex(
    { search_count: -1 },
    { name: 'search_count_desc' }
  );
  
  await db.collection('cityprofiles').createIndex(
    { name: 'text', display_name: 'text', country: 'text' },
    { name: 'cities_text_search' }
  );

  // ---------------------------------------------------------------------------
  // SAVED AREAS COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('savedareas').createIndex(
    { coordinates: '2dsphere' },
    { name: 'coordinates_2dsphere' }
  );
  
  await db.collection('savedareas').createIndex(
    { user_id: 1, created_at: -1 },
    { name: 'user_id_created_at_compound' }
  );
  
  await db.collection('savedareas').createIndex(
    { city: 1 },
    { name: 'city_index' }
  );

  // ---------------------------------------------------------------------------
  // POPULATION DATA COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('populationdatas').createIndex(
    { zone_id: 1 },
    { name: 'zone_id_index' }
  );
  
  await db.collection('populationdatas').createIndex(
    { zone_name: 1, year: 1 },
    { name: 'zone_name_year_compound' }
  );
  
  await db.collection('populationdatas').createIndex(
    { year: 1 },
    { name: 'year_index' }
  );

  // ---------------------------------------------------------------------------
  // ANALYTICS RESULTS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('analyticsresults').createIndex(
    { area_id: 1 },
    { name: 'area_id_index' }
  );
  
  await db.collection('analyticsresults').createIndex(
    { user_id: 1, timestamp: -1 },
    { name: 'user_id_timestamp_compound' }
  );
  
  await db.collection('analyticsresults').createIndex(
    { score: -1 },
    { name: 'score_desc' }
  );

  // ---------------------------------------------------------------------------
  // ACTIVITY LOGS COLLECTION INDEXES (TTL)
  // ---------------------------------------------------------------------------
  await db.collection('activitylogs').createIndex(
    { user_id: 1, timestamp: -1 },
    { name: 'user_id_timestamp_compound' }
  );
  
  await db.collection('activitylogs').createIndex(
    { action: 1, timestamp: -1 },
    { name: 'action_timestamp_compound' }
  );
  
  await db.collection('activitylogs').createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 7776000, name: 'timestamp_ttl_90days' } // 90 days TTL
  );

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS COLLECTION INDEXES (TTL)
  // ---------------------------------------------------------------------------
  await db.collection('notifications').createIndex(
    { user_id: 1, is_read: 1, created_at: -1 },
    { name: 'user_read_created_compound' }
  );
  
  await db.collection('notifications').createIndex(
    { created_at: 1 },
    { expireAfterSeconds: 2592000, name: 'created_at_ttl_30days' } // 30 days TTL
  );

  // ---------------------------------------------------------------------------
  // PLANNER DESIGNS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('plannerdesigns').createIndex(
    { user_id: 1, created_at: -1 },
    { name: 'user_id_created_at_compound' }
  );
  
  await db.collection('plannerdesigns').createIndex(
    { 'elements.type': 1 },
    { name: 'elements_type_index' }
  );

  // ---------------------------------------------------------------------------
  // REPORTS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('reports').createIndex(
    { user_id: 1, generated_at: -1 },
    { name: 'user_id_generated_at_compound' }
  );
  
  await db.collection('reports').createIndex(
    { area_id: 1 },
    { name: 'area_id_index' }
  );
  
  await db.collection('reports').createIndex(
    { report_type: 1, generated_at: -1 },
    { name: 'report_type_generated_compound' }
  );

  // ---------------------------------------------------------------------------
  // MAP LAYERS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('maplayers').createIndex(
    { user_id: 1, is_active: 1 },
    { name: 'user_active_compound' }
  );
  
  await db.collection('maplayers').createIndex(
    { visibility: 1 },
    { name: 'visibility_index' }
  );
  
  await db.collection('maplayers').createIndex(
    { layer_type: 1 },
    { name: 'layer_type_index' }
  );

  // ---------------------------------------------------------------------------
  // UTILITIES COLLECTION INDEXES (Geo-spatial)
  // ---------------------------------------------------------------------------
  await db.collection('utilities').createIndex(
    { geometry: '2dsphere' },
    { name: 'geometry_2dsphere' }
  );
  
  await db.collection('utilities').createIndex(
    { utility_type: 1, status: 1 },
    { name: 'utility_type_status_compound' }
  );

  // ---------------------------------------------------------------------------
  // AREA COMPARISONS COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('areacomparisons').createIndex(
    { user_id: 1, created_at: -1 },
    { name: 'user_id_created_at_compound' }
  );

  // ---------------------------------------------------------------------------
  // PROJECT WORKSPACES COLLECTION INDEXES
  // ---------------------------------------------------------------------------
  await db.collection('projectworkspaces').createIndex(
    { user_id: 1, status: 1 },
    { name: 'user_status_compound' }
  );
  
  await db.collection('projectworkspaces').createIndex(
    { 'collaborators.user_id': 1 },
    { name: 'collaborators_user_id_index' }
  );
  
  await db.collection('projectworkspaces').createIndex(
    { tags: 1 },
    { name: 'tags_index' }
  );

  console.log('All indexes created successfully!');
}

// ============================================================================
// SECTION 2: AGGREGATION QUERIES
// ============================================================================

/**
 * Find landmarks within a given radius of a point
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude  
 * @param {number} radiusKm - Radius in kilometers
 * @param {string} typeFilter - Optional type filter
 */
function findLandmarksNearPoint(lng, lat, radiusKm = 5, typeFilter = null) {
  const query = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance_meters',
        distanceMultiplier: 0.001,
        spherical: true,
        maxDistance: radiusKm * 1000,
        query: typeFilter ? { type: typeFilter, status: 'operational' } : { status: 'operational' }
      }
    },
    {
      $project: {
        name: 1,
        type: 1,
        subtype: 1,
        address: 1,
        distance_km: { $round: ['$distance_meters', 2] },
        capacity: 1,
        rating: 1,
        city: 1,
        coordinates: '$geometry.coordinates'
      }
    },
    { $sort: { distance_km: 1 } }
  ];
  return query;
}

/**
 * Find zones that intersect with a given polygon
 * @param {Array} polygonCoords - Polygon coordinates array
 */
function findZonesIntersectingPolygon(polygonCoords) {
  return [
    {
      $match: {
        geometry: {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: polygonCoords
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        zone_type: 1,
        area_sqkm: 1,
        population_density: 1,
        status: 1,
        zoning_code: 1
      }
    }
  ];
}

/**
 * Calculate landmark statistics by city and type
 */
function getLandmarkStatsByCity() {
  return [
    { $match: { status: 'operational' } },
    {
      $group: {
        _id: { city: '$city', type: '$type' },
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalCapacity: { $sum: '$capacity' },
        avgServiceRadius: { $avg: '$service_radius_km' }
      }
    },
    {
      $group: {
        _id: '$_id.city',
        landmarks: {
          $push: {
            type: '$_id.type',
            count: '$count',
            avgRating: { $round: ['$avgRating', 2] },
            totalCapacity: '$totalCapacity',
            avgServiceRadius: { $round: ['$avgServiceRadius', 2] }
          }
        },
        totalLandmarks: { $sum: '$count' }
      }
    },
    {
      $project: {
        city: '$_id',
        landmarks: 1,
        totalLandmarks: 1,
        _id: 0
      }
    },
    { $sort: { totalLandmarks: -1 } }
  ];
}

/**
 * Get road network statistics by type
 * @param {string} city - Optional city filter
 */
function getRoadNetworkStats(city = null) {
  const pipeline = [
    { $match: city ? { city: city, status: 'operational' } : { status: 'operational' } },
    {
      $group: {
        _id: '$road_type',
        totalRoads: { $sum: 1 },
        totalLengthKm: { $sum: '$length_km' },
        avgLanes: { $avg: '$lanes' },
        avgSpeedLimit: { $avg: '$speed_limit' },
        totalCapacity: { $sum: '$traffic_capacity' }
      }
    },
    {
      $project: {
        road_type: '$_id',
        totalRoads: 1,
        totalLengthKm: { $round: ['$totalLengthKm', 2] },
        avgLanes: { $round: ['$avgLanes', 1] },
        avgSpeedLimit: { $round: ['$avgSpeedLimit', 0] },
        totalCapacity: 1,
        _id: 0
      }
    },
    { $sort: { totalRoads: -1 } }
  ];
  return pipeline;
}

/**
 * Get population demographics analysis by zone type
 */
function getPopulationDemographicsByZoneType() {
  return [
    {
      $lookup: {
        from: 'zones',
        localField: 'zone_id',
        foreignField: '_id',
        as: 'zone'
      }
    },
    { $unwind: '$zone' },
    {
      $group: {
        _id: '$zone.zone_type',
        totalPopulation: { $sum: '$population_count' },
        totalHouseholds: { $sum: '$household_count' },
        avgGrowthRate: { $avg: '$growth_rate' },
        avgEmploymentRate: { $avg: '$employment_rate' },
        avgLiteracyRate: { $avg: '$literacy_rate' },
        ageDistribution: {
          children: { $sum: '$age_distribution.children' },
          youth: { $sum: '$age_distribution.youth' },
          adults: { $sum: '$age_distribution.adults' },
          seniors: { $sum: '$age_distribution.seniors' }
        }
      }
    },
    {
      $project: {
        zone_type: '$_id',
        totalPopulation: 1,
        totalHouseholds: 1,
        avgGrowthRate: { $round: ['$avgGrowthRate', 2] },
        avgEmploymentRate: { $round: ['$avgEmploymentRate', 2] },
        avgLiteracyRate: { $round: ['$avgLiteracyRate', 2] },
        ageDistribution: 1,
        _id: 0
      }
    },
    { $sort: { totalPopulation: -1 } }
  ];
}

/**
 * Calculate area livability score based on nearby amenities
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} radiusKm - Search radius in kilometers
 */
function calculateAreaLivabilityScore(lng, lat, radiusKm = 5) {
  return [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance_meters',
        spherical: true,
        maxDistance: radiusKm * 1000,
        query: { status: 'operational' }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalCapacity: { $sum: '$capacity' },
        nearestDistance: { $min: '$distance_meters' }
      }
    },
    {
      $group: {
        _id: null,
        categories: {
          $push: {
            type: '$_id',
            count: '$count',
            avgRating: { $round: ['$avgRating', 2] },
            totalCapacity: '$totalCapacity',
            nearestDistanceM: { $round: ['$nearestDistance', 0] }
          }
        },
        totalAmenities: { $sum: '$count' },
        avgOverallRating: { $avg: '$avgRating' }
      }
    },
    {
      $project: {
        categories: 1,
        totalAmenities: 1,
        avgOverallRating: { $round: ['$avgOverallRating', 2] },
        _id: 0
      }
    }
  ];
}

/**
 * Get user activity statistics
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
function getUserActivityStats(userId, startDate, endDate) {
  return [
    {
      $match: {
        user_id: userId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: null,
        activities: {
          $push: {
            action: '$_id',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        },
        totalActions: { $sum: '$count' },
        uniqueActionTypes: { $sum: 1 }
      }
    },
    {
      $project: {
        activities: { $sortArray: { input: '$activities', sortBy: { count: -1 } } },
        totalActions: 1,
        uniqueActionTypes: 1,
        _id: 0
      }
    }
  ];
}

/**
 * Compare multiple areas analytics
 * @param {Array} areaIds - Array of area ObjectIds
 */
function compareAreasAnalytics(areaIds) {
  return [
    { $match: { area_id: { $in: areaIds } } },
    {
      $lookup: {
        from: 'savedareas',
        localField: 'area_id',
        foreignField: '_id',
        as: 'area_info'
      }
    },
    { $unwind: '$area_info' },
    {
      $project: {
        area_id: 1,
        area_name: '$area_info.area_name',
        score: 1,
        rating: 1,
        total_places: 1,
        strengths: 1,
        weaknesses: 1,
        recommendations: 1,
        coverage_data: 1,
        timestamp: 1
      }
    },
    { $sort: { score: -1 } }
  ];
}

/**
 * Get infrastructure coverage gaps analysis
 * @param {string} city - City name
 */
function getInfrastructureGaps(city) {
  return [
    { $match: { city: city, status: 'operational' } },
    {
      $group: {
        _id: {
          type: '$type',
          gridCell: {
            $floor: { $divide: [{ $arrayElemAt: ['$geometry.coordinates', 0] }, 0.01] }
          }
        },
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        cells: {
          $push: {
            cell: '$_id.gridCell',
            count: '$count',
            capacity: '$totalCapacity'
          }
        },
        totalCells: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        coverageCells: '$totalCells',
        avgPerCell: { $avg: '$cells.count' },
        _id: 0
      }
    }
  ];
}

/**
 * Get trending cities based on search activity
 * @param {number} limit - Number of results
 */
function getTrendingCities(limit = 10) {
  return [
    { $sort: { search_count: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        display_name: 1,
        country: 1,
        search_count: 1,
        landmark_count: 1,
        road_count: 1,
        population: 1,
        coordinates: 1
      }
    }
  ];
}

/**
 * Get comprehensive dashboard statistics
 */
function getDashboardStats() {
  return [
    {
      $facet: {
        totalUsers: [
          { $count: 'count' }
        ],
        usersByRole: [
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ],
        newUsersToday: [
          {
            $match: {
              createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ];
}

// ============================================================================
// SECTION 3: STORED PROCEDURES (JavaScript Functions)
// ============================================================================

/**
 * Create a new saved area with automatic landmark and road counts
 * @param {Object} db - Database reference
 * @param {Object} areaData - Area data object
 */
async function createSavedAreaWithStats(db, areaData) {
  const { user_id, area_name, coordinates, radius, city, country } = areaData;
  
  // Create the saved area
  const savedArea = await db.collection('savedareas').insertOne({
    user_id,
    area_name,
    display_name: area_name,
    coordinates: {
      type: 'Point',
      coordinates: coordinates // [lng, lat]
    },
    radius: radius || 5000,
    city: city || '',
    country: country || '',
    source: 'search',
    created_at: new Date(),
    updated_at: new Date()
  });
  
  const areaId = savedArea.insertedId;
  
  // Count landmarks in the area
  const landmarkCount = await db.collection('landmarks').countDocuments({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radius || 5000
      }
    },
    status: 'operational'
  });
  
  // Count roads in the area
  const roadCount = await db.collection('roads').countDocuments({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radius || 5000
      }
    },
    status: 'operational'
  });
  
  // Update the saved area with counts
  await db.collection('savedareas').updateOne(
    { _id: areaId },
    { $set: { landmark_count: landmarkCount, road_count: roadCount } }
  );
  
  // Log activity
  await logActivity(db, user_id, 'search_area', 'area', areaId, { area_name, city });
  
  return { areaId, landmarkCount, roadCount };
}

/**
 * Generate area analysis report
 * @param {Object} db - Database reference
 * @param {ObjectId} areaId - Saved area ID
 * @param {ObjectId} userId - User ID
 */
async function generateAreaAnalysisReport(db, areaId, userId) {
  // Get area details
  const area = await db.collection('savedareas').findOne({ _id: areaId });
  if (!area) throw new Error('Area not found');
  
  const [lng, lat] = area.coordinates.coordinates;
  const radius = area.radius / 1000; // Convert to km
  
  // Get landmarks within area
  const landmarks = await db.collection('landmarks')
    .aggregate(findLandmarksNearPoint(lng, lat, radius))
    .toArray();
  
  // Calculate coverage by type
  const coverageByType = {};
  const typeWeights = {
    hospital: 15,
    school: 12,
    university: 10,
    park: 8,
    government: 6,
    religious: 5,
    commercial: 7,
    monument: 4,
    other: 2
  };
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  for (const type in typeWeights) {
    const count = landmarks.filter(l => l.type === type).length;
    const avgDistance = landmarks
      .filter(l => l.type === type)
      .reduce((sum, l) => sum + l.distance_km, 0) / (count || 1);
    
    coverageByType[type] = {
      count,
      avgDistance: count > 0 ? Math.round(avgDistance * 100) / 100 : null
    };
    
    // Score calculation
    if (count > 0) {
      totalScore += typeWeights[type] * Math.min(count, 5);
    }
    maxPossibleScore += typeWeights[type] * 5;
  }
  
  const score = Math.round((totalScore / maxPossibleScore) * 100);
  
  // Determine rating
  let rating;
  if (score >= 80) rating = 'Excellent';
  else if (score >= 60) rating = 'Very Good';
  else if (score >= 40) rating = 'Good';
  else if (score >= 20) rating = 'Fair';
  else rating = 'Needs Improvement';
  
  // Identify strengths and weaknesses
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];
  
  for (const type in coverageByType) {
    if (coverageByType[type].count >= 3) {
      strengths.push({
        type,
        message: `Good coverage of ${type} facilities (${coverageByType[type].count} within ${radius}km)`,
        score: coverageByType[type].count * typeWeights[type]
      });
    } else if (coverageByType[type].count === 0) {
      weaknesses.push({
        type,
        message: `No ${type} facilities found within ${radius}km radius`,
        severity: 'high'
      });
      recommendations.push({
        priority: 'high',
        category: type,
        message: `Consider adding ${type} facilities in this area`
      });
    } else if (coverageByType[type].count < 2) {
      weaknesses.push({
        type,
        message: `Limited ${type} coverage (${coverageByType[type].count} facility)`,
        severity: 'medium'
      });
      recommendations.push({
        priority: 'medium',
        category: type,
        message: `Additional ${type} facilities would improve area score`
      });
    }
  }
  
  // Store analytics result
  const analyticsResult = {
    user_id: userId,
    area_id: areaId,
    score,
    rating,
    coverage_data: coverageByType,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendations: recommendations.slice(0, 10),
    total_places: landmarks.length,
    radius_km: radius,
    center: { lat, lng },
    timestamp: new Date()
  };
  
  await db.collection('analyticsresults').insertOne(analyticsResult);
  
  // Update saved area with last score
  await db.collection('savedareas').updateOne(
    { _id: areaId },
    { $set: { last_analysis_score: score, updated_at: new Date() } }
  );
  
  return analyticsResult;
}

/**
 * Log user activity
 * @param {Object} db - Database reference
 * @param {ObjectId} userId - User ID
 * @param {string} action - Action type
 * @param {string} resourceType - Resource type
 * @param {ObjectId} resourceId - Resource ID
 * @param {Object} metadata - Additional metadata
 */
async function logActivity(db, userId, action, resourceType = null, resourceId = null, metadata = {}) {
  await db.collection('activitylogs').insertOne({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    timestamp: new Date()
  });
}

/**
 * Create notification for user
 * @param {Object} db - Database reference
 * @param {ObjectId} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {string} category - Notification category
 * @param {string} link - Optional link
 */
async function createNotification(db, userId, title, message, type = 'info', category = 'system_update', link = '') {
  await db.collection('notifications').insertOne({
    user_id: userId,
    title,
    message,
    type,
    category,
    link,
    is_read: false,
    created_at: new Date()
  });
}

/**
 * Bulk import landmarks with validation
 * @param {Object} db - Database reference
 * @param {Array} landmarks - Array of landmark objects
 * @param {string} source - Source identifier
 */
async function bulkImportLandmarks(db, landmarks, source = 'import') {
  const results = {
    inserted: 0,
    updated: 0,
    errors: []
  };
  
  for (const landmark of landmarks) {
    try {
      // Validate required fields
      if (!landmark.name || !landmark.type || !landmark.geometry) {
        results.errors.push({ landmark, error: 'Missing required fields' });
        continue;
      }
      
      // Validate geometry
      if (!landmark.geometry.type || !landmark.geometry.coordinates) {
        results.errors.push({ landmark, error: 'Invalid geometry' });
        continue;
      }
      
      // Check for existing landmark by OSM ID or name+coordinates
      let existingQuery = {};
      if (landmark.osm_id) {
        existingQuery = { osm_id: landmark.osm_id };
      } else {
        existingQuery = {
          name: landmark.name,
          'geometry.coordinates': landmark.geometry.coordinates
        };
      }
      
      const existing = await db.collection('landmarks').findOne(existingQuery);
      
      const landmarkDoc = {
        name: landmark.name,
        type: landmark.type,
        subtype: landmark.subtype || '',
        geometry: landmark.geometry,
        service_radius_km: landmark.service_radius_km || 2,
        capacity: landmark.capacity || 0,
        status: landmark.status || 'operational',
        address: landmark.address || '',
        contact: landmark.contact || '',
        description: landmark.description || '',
        rating: landmark.rating || 0,
        image_url: landmark.image_url || '',
        city: landmark.city || '',
        source: source,
        osm_id: landmark.osm_id || null,
        updated_at: new Date()
      };
      
      if (existing) {
        await db.collection('landmarks').updateOne(
          { _id: existing._id },
          { $set: landmarkDoc }
        );
        results.updated++;
      } else {
        landmarkDoc.created_at = new Date();
        await db.collection('landmarks').insertOne(landmarkDoc);
        results.inserted++;
      }
    } catch (error) {
      results.errors.push({ landmark, error: error.message });
    }
  }
  
  return results;
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Update city statistics (landmark and road counts)
 * @param {Object} db - Database reference
 * @param {string} cityName - City name
 */
async function updateCityStats(db, cityName) {
  const landmarkCount = await db.collection('landmarks').countDocuments({ city: cityName });
  const roadCount = await db.collection('roads').countDocuments({ city: cityName });
  
  await db.collection('cityprofiles').updateOne(
    { name: cityName },
    {
      $set: {
        landmark_count: landmarkCount,
        road_count: roadCount,
        last_data_fetch: new Date()
      }
    }
  );
  
  return { landmarkCount, roadCount };
}

// ============================================================================
// SECTION 4: TRIGGERS (Change Streams)
// ============================================================================

/**
 * Setup change stream triggers for the database
 * @param {Object} db - Database reference
 */
function setupChangeStreamTriggers(db) {
  // ---------------------------------------------------------------------------
  // TRIGGER: Update city stats when landmarks change
  // ---------------------------------------------------------------------------
  const landmarksChangeStream = db.collection('landmarks').watch();
  
  landmarksChangeStream.on('change', async (change) => {
    if (['insert', 'update', 'delete'].includes(change.operationType)) {
      let cityName = '';
      
      if (change.operationType === 'insert' || change.operationType === 'update') {
        const doc = change.operationType === 'insert' 
          ? change.fullDocument 
          : change.fullDocument;
        cityName = doc?.city;
      } else if (change.operationType === 'delete') {
        // For deletes, we'd need to track the city beforehand
        return;
      }
      
      if (cityName) {
        await updateCityStats(db, cityName);
        console.log(`Updated stats for city: ${cityName}`);
      }
    }
  });
  
  // ---------------------------------------------------------------------------
  // TRIGGER: Create welcome notification for new users
  // ---------------------------------------------------------------------------
  const usersChangeStream = db.collection('users').watch();
  
  usersChangeStream.on('change', async (change) => {
    if (change.operationType === 'insert') {
      const user = change.fullDocument;
      
      await createNotification(
        db,
        user._id,
        'Welcome to UrbanPulse!',
        'Start exploring urban planning tools and analyze your first area.',
        'success',
        'welcome',
        '/planner'
      );
      
      console.log(`Welcome notification created for user: ${user._id}`);
    }
  });
  
  // ---------------------------------------------------------------------------
  // TRIGGER: Update analytics when design is evaluated
  // ---------------------------------------------------------------------------
  const designsChangeStream = db.collection('plannerdesigns').watch();
  
  designsChangeStream.on('change', async (change) => {
    if (change.operationType === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields.evaluation_score !== undefined) {
        const designId = change.documentKey._id;
        
        // Log the evaluation activity
        await logActivity(
          db,
          change.fullDocument.user_id,
          'update_design',
          'design',
          designId,
          { evaluation_score: updatedFields.evaluation_score }
        );
        
        console.log(`Design ${designId} evaluated with score: ${updatedFields.evaluation_score}`);
      }
    }
  });
  
  console.log('Change stream triggers initialized');
  
  return {
    landmarksChangeStream,
    usersChangeStream,
    designsChangeStream
  };
}

// ============================================================================
// SECTION 5: DATA VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate GeoJSON Point geometry
 * @param {Object} geometry - Geometry object
 * @returns {Object} Validation result
 */
function validatePointGeometry(geometry) {
  const errors = [];
  
  if (!geometry) {
    errors.push('Geometry is required');
    return { valid: false, errors };
  }
  
  if (geometry.type !== 'Point') {
    errors.push(`Expected Point geometry, got ${geometry.type}`);
  }
  
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 2) {
    errors.push('Coordinates must be an array of [longitude, latitude]');
  } else {
    const [lng, lat] = geometry.coordinates;
    
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      errors.push('Coordinates must be numbers');
    } else {
      if (lng < -180 || lng > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate GeoJSON Polygon geometry
 * @param {Object} geometry - Geometry object
 * @returns {Object} Validation result
 */
function validatePolygonGeometry(geometry) {
  const errors = [];
  
  if (!geometry) {
    errors.push('Geometry is required');
    return { valid: false, errors };
  }
  
  if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) {
    errors.push(`Expected Polygon or MultiPolygon geometry, got ${geometry.type}`);
  }
  
  if (geometry.type === 'Polygon') {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      errors.push('Polygon must have at least one ring');
    } else {
      geometry.coordinates.forEach((ring, index) => {
        if (!Array.isArray(ring) || ring.length < 4) {
          errors.push(`Ring ${index} must have at least 4 coordinates`);
        }
        // Check if ring is closed
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
          errors.push(`Ring ${index} must be closed (first and last coordinates must match)`);
        }
      });
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate GeoJSON LineString geometry
 * @param {Object} geometry - Geometry object
 * @returns {Object} Validation result
 */
function validateLineStringGeometry(geometry) {
  const errors = [];
  
  if (!geometry) {
    errors.push('Geometry is required');
    return { valid: false, errors };
  }
  
  if (geometry.type !== 'LineString') {
    errors.push(`Expected LineString geometry, got ${geometry.type}`);
  }
  
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    errors.push('LineString must have at least 2 coordinates');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate landmark data
 * @param {Object} landmark - Landmark object
 * @returns {Object} Validation result
 */
function validateLandmark(landmark) {
  const errors = [];
  
  // Required fields
  if (!landmark.name || landmark.name.trim() === '') {
    errors.push('Landmark name is required');
  }
  
  const validTypes = ['hospital', 'school', 'university', 'park', 'government', 'religious', 'commercial', 'monument', 'other'];
  if (!landmark.type || !validTypes.includes(landmark.type)) {
    errors.push(`Landmark type must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate geometry
  const geometryValidation = validatePointGeometry(landmark.geometry);
  if (!geometryValidation.valid) {
    errors.push(...geometryValidation.errors);
  }
  
  // Validate optional fields
  if (landmark.rating !== undefined && (landmark.rating < 0 || landmark.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }
  
  const validStatuses = ['operational', 'under_construction', 'closed', 'planned'];
  if (landmark.status && !validStatuses.includes(landmark.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  if (landmark.capacity !== undefined && landmark.capacity < 0) {
    errors.push('Capacity cannot be negative');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate zone data
 * @param {Object} zone - Zone object
 * @returns {Object} Validation result
 */
function validateZone(zone) {
  const errors = [];
  
  if (!zone.name || zone.name.trim() === '') {
    errors.push('Zone name is required');
  }
  
  const validTypes = ['residential', 'commercial', 'industrial', 'green', 'institutional', 'mixed', 'administrative'];
  if (!zone.zone_type || !validTypes.includes(zone.zone_type)) {
    errors.push(`Zone type must be one of: ${validTypes.join(', ')}`);
  }
  
  const geometryValidation = validatePolygonGeometry(zone.geometry);
  if (!geometryValidation.valid) {
    errors.push(...geometryValidation.errors);
  }
  
  if (zone.population_density !== undefined && zone.population_density < 0) {
    errors.push('Population density cannot be negative');
  }
  
  if (zone.area_sqkm !== undefined && zone.area_sqkm < 0) {
    errors.push('Area cannot be negative');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate road data
 * @param {Object} road - Road object
 * @returns {Object} Validation result
 */
function validateRoad(road) {
  const errors = [];
  
  if (!road.name || road.name.trim() === '') {
    errors.push('Road name is required');
  }
  
  const validTypes = ['highway', 'arterial', 'collector', 'local', 'expressway'];
  if (!road.road_type || !validTypes.includes(road.road_type)) {
    errors.push(`Road type must be one of: ${validTypes.join(', ')}`);
  }
  
  const geometryValidation = validateLineStringGeometry(road.geometry);
  if (!geometryValidation.valid) {
    errors.push(...geometryValidation.errors);
  }
  
  if (road.lanes !== undefined && road.lanes < 1) {
    errors.push('Road must have at least 1 lane');
  }
  
  if (road.speed_limit !== undefined && (road.speed_limit < 0 || road.speed_limit > 200)) {
    errors.push('Speed limit must be between 0 and 200');
  }
  
  if (road.length_km !== undefined && road.length_km < 0) {
    errors.push('Road length cannot be negative');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate user data
 * @param {Object} user - User object
 * @returns {Object} Validation result
 */
function validateUser(user) {
  const errors = [];
  
  if (!user.name || user.name.trim() === '') {
    errors.push('User name is required');
  }
  
  if (user.name && user.name.length > 50) {
    errors.push('User name cannot exceed 50 characters');
  }
  
  if (!user.email || user.email.trim() === '') {
    errors.push('Email is required');
  }
  
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (user.email && !emailRegex.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  if (user.password && user.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  const validRoles = ['admin', 'planner', 'viewer'];
  if (user.role && !validRoles.includes(user.role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// SECTION 6: UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places
 * @returns {string} Formatted coordinates
 */
function formatCoordinates(lat, lng, precision = 6) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}° ${latDir}, ${Math.abs(lng).toFixed(precision)}° ${lngDir}`;
}

/**
 * Convert meters to kilometers
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in kilometers
 */
function metersToKilometers(meters) {
  return meters / 1000;
}

/**
 * Convert kilometers to meters
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in meters
 */
function kilometersToMeters(km) {
  return km * 1000;
}

/**
 * Calculate bounding box for a point and radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box { south, north, west, east }
 */
function calculateBoundingBox(lat, lng, radiusKm) {
  const R = 6371; // Earth's radius in km
  const latOffset = radiusKm / R * (180 / Math.PI);
  const lngOffset = radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  return {
    south: lat - latOffset,
    north: lat + latOffset,
    west: lng - lngOffset,
    east: lng + lngOffset
  };
}

/**
 * Check if point is within bounding box
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Object} bbox - Bounding box { south, north, west, east }
 * @returns {boolean} True if point is within bbox
 */
function isPointInBoundingBox(lat, lng, bbox) {
  return lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}

/**
 * Convert GeoJSON to MongoDB query format
 * @param {Object} geojson - GeoJSON object
 * @returns {Object} MongoDB query object
 */
function geoJsonToMongoQuery(geojson) {
  if (geojson.type === 'Point') {
    return {
      location: {
        $near: {
          $geometry: geojson,
          $maxDistance: 1000
        }
      }
    };
  } else if (geojson.type === 'Polygon') {
    return {
      location: {
        $geoWithin: {
          $geometry: geojson
        }
      }
    };
  }
  return null;
}

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Paginate aggregation pipeline
 * @param {Array} pipeline - Aggregation pipeline
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated pipeline and metadata
 */
function paginatePipeline(pipeline, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return {
    pipeline: [
      ...pipeline,
      { $skip: skip },
      { $limit: limit }
    ],
    metadata: {
      page,
      limit,
      skip
    }
  };
}

/**
 * Build text search query
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Object} MongoDB query object
 */
function buildTextSearchQuery(searchTerm, fields = ['name']) {
  if (!searchTerm || searchTerm.trim() === '') {
    return {};
  }
  
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  if (fields.length === 1) {
    return { [fields[0]]: { $regex: escapedTerm, $options: 'i' } };
  }
  
  return {
    $or: fields.map(field => ({
      [field]: { $regex: escapedTerm, $options: 'i' }
    }))
  };
}

// ============================================================================
// SECTION 7: DATABASE MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Get collection statistics
 * @param {Object} db - Database reference
 * @returns {Object} Collection statistics
 */
async function getCollectionStats(db) {
  const collections = await db.listCollections().toArray();
  const stats = [];
  
  for (const collection of collections) {
    const collectionStats = await db.collection(collection.name).stats();
    stats.push({
      name: collection.name,
      count: collectionStats.count,
      size: collectionStats.size,
      avgDocSize: collectionStats.avgObjSize,
      storageSize: collectionStats.storageSize,
      indexes: collectionStats.nindexes
    });
  }
  
  return stats;
}

/**
 * Clean up orphaned documents
 * @param {Object} db - Database reference
 * @returns {Object} Cleanup results
 */
async function cleanupOrphanedDocuments(db) {
  const results = {
    orphanedLandmarks: 0,
    orphanedRoads: 0,
    orphanedAnalytics: 0,
    orphanedReports: 0
  };
  
  // Find landmarks with non-existent area_id
  const orphanedLandmarks = await db.collection('landmarks').aggregate([
    {
      $lookup: {
        from: 'savedareas',
        localField: 'area_id',
        foreignField: '_id',
        as: 'area'
      }
    },
    {
      $match: {
        area_id: { $ne: null },
        area: { $eq: [] }
      }
    }
  ]).toArray();
  
  if (orphanedLandmarks.length > 0) {
    const ids = orphanedLandmarks.map(l => l._id);
    await db.collection('landmarks').updateMany(
      { _id: { $in: ids } },
      { $set: { area_id: null } }
    );
    results.orphanedLandmarks = ids.length;
  }
  
  // Find roads with non-existent area_id
  const orphanedRoads = await db.collection('roads').aggregate([
    {
      $lookup: {
        from: 'savedareas',
        localField: 'area_id',
        foreignField: '_id',
        as: 'area'
      }
    },
    {
      $match: {
        area_id: { $ne: null },
        area: { $eq: [] }
      }
    }
  ]).toArray();
  
  if (orphanedRoads.length > 0) {
    const ids = orphanedRoads.map(r => r._id);
    await db.collection('roads').updateMany(
      { _id: { $in: ids } },
      { $set: { area_id: null } }
    );
    results.orphanedRoads = ids.length;
  }
  
  // Find analytics with non-existent area_id
  const orphanedAnalytics = await db.collection('analyticsresults').aggregate([
    {
      $lookup: {
        from: 'savedareas',
        localField: 'area_id',
        foreignField: '_id',
        as: 'area'
      }
    },
    {
      $match: { area: { $eq: [] } }
    }
  ]).toArray();
  
  if (orphanedAnalytics.length > 0) {
    const ids = orphanedAnalytics.map(a => a._id);
    await db.collection('analyticsresults').deleteMany({ _id: { $in: ids } });
    results.orphanedAnalytics = ids.length;
  }
  
  // Find reports with non-existent area_id
  const orphanedReports = await db.collection('reports').aggregate([
    {
      $lookup: {
        from: 'savedareas',
        localField: 'area_id',
        foreignField: '_id',
        as: 'area'
      }
    },
    {
      $match: {
        area_id: { $ne: null },
        area: { $eq: [] }
      }
    }
  ]).toArray();
  
  if (orphanedReports.length > 0) {
    const ids = orphanedReports.map(r => r._id);
    await db.collection('reports').deleteMany({ _id: { $in: ids } });
    results.orphanedReports = ids.length;
  }
  
  return results;
}

/**
 * Rebuild all indexes
 * @param {Object} db - Database reference
 */
async function rebuildAllIndexes(db) {
  const collections = [
    'users', 'zones', 'landmarks', 'roads', 'cityprofiles',
    'savedareas', 'populationdatas', 'analyticsresults',
    'activitylogs', 'notifications', 'plannerdesigns',
    'reports', 'maplayers', 'utilities', 'areacomparisons',
    'projectworkspaces'
  ];
  
  for (const collectionName of collections) {
    try {
      await db.collection(collectionName).dropIndexes();
      console.log(`Dropped indexes for ${collectionName}`);
    } catch (error) {
      // Collection might not exist
      continue;
    }
  }
  
  await createAllIndexes(db);
  console.log('All indexes rebuilt successfully');
}

/**
 * Get database health report
 * @param {Object} db - Database reference
 * @returns {Object} Health report
 */
async function getDatabaseHealthReport(db) {
  const report = {
    timestamp: new Date(),
    collections: {},
    issues: []
  };
  
  // Check collection stats
  const stats = await getCollectionStats(db);
  
  for (const stat of stats) {
    report.collections[stat.name] = {
      count: stat.count,
      sizeMB: (stat.size / 1024 / 1024).toFixed(2),
      indexes: stat.indexes
    };
    
    // Check for missing indexes on geo fields
    if (['landmarks', 'zones', 'roads', 'utilities', 'savedareas', 'cityprofiles'].includes(stat.name)) {
      const indexes = await db.collection(stat.name).getIndexes();
      const hasGeoIndex = indexes.some(idx => idx.key && idx.key.geometry === '2dsphere');
      if (!hasGeoIndex && stat.count > 0) {
        report.issues.push(`Missing geo-spatial index on ${stat.name}`);
      }
    }
  }
  
  // Check for stale data
  const staleAnalytics = await db.collection('analyticsresults').countDocuments({
    timestamp: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  if (staleAnalytics > 0) {
    report.issues.push(`${staleAnalytics} analytics results older than 30 days`);
  }
  
  return report;
}

// ============================================================================
// SECTION 8: EXPORTS
// ============================================================================

module.exports = {
  // Index Functions
  createAllIndexes,
  
  // Aggregation Queries
  findLandmarksNearPoint,
  findZonesIntersectingPolygon,
  getLandmarkStatsByCity,
  getRoadNetworkStats,
  getPopulationDemographicsByZoneType,
  calculateAreaLivabilityScore,
  getUserActivityStats,
  compareAreasAnalytics,
  getInfrastructureGaps,
  getTrendingCities,
  getDashboardStats,
  
  // Stored Procedures
  createSavedAreaWithStats,
  generateAreaAnalysisReport,
  logActivity,
  createNotification,
  bulkImportLandmarks,
  calculateDistance,
  updateCityStats,
  
  // Change Stream Triggers
  setupChangeStreamTriggers,
  
  // Validation Functions
  validatePointGeometry,
  validatePolygonGeometry,
  validateLineStringGeometry,
  validateLandmark,
  validateZone,
  validateRoad,
  validateUser,
  
  // Utility Functions
  generateUniqueId,
  formatCoordinates,
  metersToKilometers,
  kilometersToMeters,
  calculateBoundingBox,
  isPointInBoundingBox,
  geoJsonToMongoQuery,
  sanitizeInput,
  deepClone,
  paginatePipeline,
  buildTextSearchQuery,
  
  // Maintenance Functions
  getCollectionStats,
  cleanupOrphanedDocuments,
  rebuildAllIndexes,
  getDatabaseHealthReport
};

console.log('Database Scripts loaded successfully!');