import Landmark from '../models/Landmark.js';
import Road from '../models/Road.js';
import CityProfile from '../models/CityProfile.js';

// ═══════════════════════════════════════════════════════════
// Cache Service — prevents duplicate API calls
// Checks DB before calling OSM APIs
// ═══════════════════════════════════════════════════════════

/**
 * Check if landmarks exist near a point in the DB
 */
export async function findCachedLandmarks(lat, lng, radiusKm = 5) {
  const radiusInRadians = radiusKm / 6378.1;
  const landmarks = await Landmark.find({
    geometry: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusInRadians],
      },
    },
  }).limit(500);

  return landmarks;
}

/**
 * Save OSM places as Landmarks in DB (upsert by osm_id)
 */
export async function saveLandmarksFromOSM(places, city = '', areaId = null) {
  if (!places || places.length === 0) return [];

  const ops = places
    .filter((p) => p.lat && p.lng && p.id)
    .map((p) => ({
      updateOne: {
        filter: { osm_id: p.id },
        update: {
          $setOnInsert: {
            name: (p.name || 'Unnamed').substring(0, 200),
            type: mapOSMTypeToSchema(p.type),
            geometry: {
              type: 'Point',
              coordinates: [p.lng, p.lat],
            },
            city: city,
            source: 'osm',
            osm_id: p.id,
            area_id: areaId,
            address: p.address || '',
            description: p.type || '',
            service_radius_km: 2,
            status: 'operational',
          },
        },
        upsert: true,
      },
    }));

  if (ops.length > 0) {
    try {
      await Landmark.bulkWrite(ops, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors from concurrent requests
      if (err.code !== 11000) {
        console.error('[CacheService] Landmark bulk write error:', err.message);
      }
    }
  }

  return ops.length;
}

/**
 * Save OSM roads in DB (upsert by osm_id)
 */
export async function saveRoadsFromOSM(roads, city = '', areaId = null) {
  if (!roads || roads.length === 0) return [];

  const ops = roads
    .filter((r) => r.id && r.geometry && r.geometry.length > 1)
    .map((r) => ({
      updateOne: {
        filter: { osm_id: r.id },
        update: {
          $setOnInsert: {
            name: (r.name || 'Unnamed Road').substring(0, 200),
            road_type: mapOSMRoadType(r.type),
            geometry: {
              type: 'LineString',
              coordinates: r.geometry.map((pt) => [pt[1] || pt.lon, pt[0] || pt.lat]),
            },
            lanes: r.lanes || 2,
            speed_limit: parseInt(r.maxSpeed) || 60,
            surface_type: r.surface === 'concrete' ? 'concrete' : r.surface === 'unpaved' ? 'unpaved' : 'asphalt',
            city: city,
            source: 'osm',
            osm_id: r.id,
            area_id: areaId,
            status: 'operational',
          },
        },
        upsert: true,
      },
    }));

  if (ops.length > 0) {
    try {
      await Road.bulkWrite(ops, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) {
        console.error('[CacheService] Road bulk write error:', err.message);
      }
    }
  }

  return ops.length;
}

/**
 * Map external geocode types to valid CityProfile category enum values
 */
function mapCategoryToEnum(type) {
  const categoryMap = {
    place: 'city',
    city: 'city',
    town: 'town',
    village: 'village',
    suburb: 'suburb',
    county: 'county',
    state: 'state',
    region: 'state',
    country: 'country',
    residential: 'residential',
    administrative: 'administrative',
    neighbourhood: 'neighbourhood',
    neighborhood: 'neighbourhood',
    hamlet: 'hamlet',
    district: 'district',
    municipality: 'municipality',
    quarter: 'quarter',
    borough: 'borough',
    address: 'other',
    poi: 'other',
    locality: 'city',
    street: 'other',
    virtual_street: 'other',
  };
  return categoryMap[(type || '').toLowerCase()] || 'other';
}

/**
 * Upsert a CityProfile from geocoded data
 */
export async function upsertCityProfile(geocodeResult) {
  if (!geocodeResult) return null;

  const cityName = extractCityName(geocodeResult);
  if (!cityName) return null;

  const countryCode = geocodeResult.address?.country_code?.toUpperCase() || '';
  const safeCategory = mapCategoryToEnum(geocodeResult.type);

  try {
    const city = await CityProfile.findOneAndUpdate(
      { name: cityName, country_code: countryCode },
      {
        $set: {
          display_name: geocodeResult.displayName || '',
          country: geocodeResult.address?.country || '',
          country_code: countryCode,
          state: geocodeResult.address?.state || '',
          coordinates: {
            type: 'Point',
            coordinates: [geocodeResult.lng, geocodeResult.lat],
          },
          bounding_box: geocodeResult.boundingBox || [],
          category: safeCategory,
          last_data_fetch: new Date(),
        },
        $inc: { search_count: 1 },
        $setOnInsert: {
          name: cityName,
        },
      },
      { upsert: true, new: true }
    );

    return city;
  } catch (err) {
    console.error('[CacheService] City profile upsert error:', err.message);
    return null;
  }
}

/**
 * Check if an area's data is already cached (within 5km)
 */
export async function isAreaCached(lat, lng, radiusKm = 5) {
  const cached = await findCachedLandmarks(lat, lng, radiusKm);
  return cached.length >= 3; // Consider cached if at least 3 landmarks exist
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function mapOSMTypeToSchema(osmType) {
  const typeMap = {
    hospital: 'hospital', clinic: 'hospital',
    school: 'school', university: 'university',
    park: 'park', playground: 'park',
    mosque: 'religious', church: 'religious', religious: 'religious',
    police: 'government', fire_station: 'government',
    pharmacy: 'commercial', bank: 'commercial',
    mall: 'commercial', supermarket: 'commercial',
    government: 'government',
  };
  return typeMap[osmType] || 'other';
}

function mapOSMRoadType(osmRoadType) {
  const typeMap = {
    motorway: 'highway', trunk: 'highway',
    primary: 'arterial', secondary: 'arterial',
    tertiary: 'collector',
    residential: 'local', living_street: 'local',
  };
  return typeMap[osmRoadType] || 'local';
}

function extractCityName(geocodeResult) {
  if (!geocodeResult) return '';
  const addr = geocodeResult.address;
  if (addr) {
    return addr.city || addr.town || addr.village || addr.county || addr.state || '';
  }
  // Fallback: extract from display name
  const parts = (geocodeResult.displayName || '').split(',');
  return parts[0]?.trim() || '';
}

/**
 * Find cached roads near a point in the DB
 */
export async function findCachedRoads(lat, lng, radiusKm = 3) {
  const radiusInRadians = radiusKm / 6378.1;
  try {
    const roads = await Road.find({
      geometry: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
    }).limit(200);
    return roads;
  } catch (err) {
    console.error('[CacheService] findCachedRoads error:', err.message);
    return [];
  }
}

export default {
  findCachedLandmarks,
  findCachedRoads,
  saveLandmarksFromOSM,
  saveRoadsFromOSM,
  upsertCityProfile,
  isAreaCached,
};
